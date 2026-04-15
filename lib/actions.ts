'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Kelas, Prodi, StatusAbsensi, BadgeType } from './types'
import { ensureCertificateRecord } from './certificates'
import { ValidationError, validateNama, validateEmail, validatePassword, validateTanggal, validatePertemuan } from './errors'
import { deleteMemberAuthUser, ensureMemberAuthUser, getMemberAuthFlags, normalizeNim, syncMemberAuthUserById } from './member-auth'
import type { Mahasiswa } from './types'
import { createAdminClient } from './supabase/admin'
import { requirePermission } from './permissions'

type CreateMahasiswaInput = {
  kelas: Kelas
  nama: string
  nim: string
  prodi: Prodi
}

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

const MAHASISWA_SCHEMA_MISMATCH_MESSAGE = 'Schema database mahasiswa masih versi lama. Jalankan SQL fix `20260413113000_07_repair_legacy_mahasiswa_identity.sql` agar tabel `mahasiswa` memiliki kolom `id` sebagai primary key dan `user_id` sebagai foreign key ke auth.users.'

function getRawErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message ?? ''
  }

  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message ?? '')
  }

  return ''
}

function isMahasiswaSchemaMismatchErrorMessage(message: string) {
  return (
    message.includes('schema database mahasiswa masih versi lama')
    || (message.includes('schema cache') && message.includes("'id' column") && message.includes('mahasiswa'))
    || message.includes('column mahasiswa.id does not exist')
    || message.includes("could not find the 'id' column of 'mahasiswa'")
  )
}

function throwMahasiswaSchemaMismatchIfNeeded(error: unknown): void {
  const normalizedMsg = getRawErrorMessage(error).toLowerCase()

  if (isMahasiswaSchemaMismatchErrorMessage(normalizedMsg)) {
    throw new Error(MAHASISWA_SCHEMA_MISMATCH_MESSAGE)
  }
}

function assertMahasiswaHasId(record: unknown, context: string): asserts record is Mahasiswa {
  if (
    !record
    || typeof record !== 'object'
    || typeof (record as { id?: unknown }).id !== 'string'
    || !(record as { id: string }).id
  ) {
    console.error(`[${context}] Schema mismatch: mahasiswa row missing id`, {
      keys: record && typeof record === 'object' ? Object.keys(record as Record<string, unknown>) : null,
      record,
    })

    throw new Error(MAHASISWA_SCHEMA_MISMATCH_MESSAGE)
  }
}

function getActionErrorMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    return error.message
  }

  const msg = getRawErrorMessage(error)
  const normalizedMsg = msg.toLowerCase()

  if (normalizedMsg.includes('missing supabase environment variable: supabase_service_role_key')) {
    return 'Konfigurasi server belum lengkap. Isi SUPABASE_SERVICE_ROLE_KEY agar akun mahasiswa bisa dibuat.'
  }

  if (normalizedMsg.includes('missing supabase environment variable: student_session_secret')) {
    return 'Konfigurasi server belum lengkap. Isi STUDENT_SESSION_SECRET agar sesi login mahasiswa dapat dipakai.'
  }

  if (normalizedMsg.includes('permission denied')) {
    return 'Akses ditolak. Pastikan Anda login sebagai admin yang memiliki izin mengelola mahasiswa.'
  }

  if (normalizedMsg.includes('row-level security')) {
    return 'Supabase menolak operasi karena policy RLS. Jalankan migration terbaru untuk tabel mahasiswa dan student_accounts.'
  }

  if (normalizedMsg.includes('column mahasiswa.user_id does not exist') || normalizedMsg.includes('column "user_id" does not exist')) {
    return 'Kolom mahasiswa.user_id belum ada di database. Jalankan migration SQL terbaru terlebih dahulu.'
  }

  if (isMahasiswaSchemaMismatchErrorMessage(normalizedMsg)) {
    return MAHASISWA_SCHEMA_MISMATCH_MESSAGE
  }

  if (normalizedMsg.includes('duplicate key value') && (normalizedMsg.includes('nim') || normalizedMsg.includes('idx_mahasiswa_nim_unique'))) {
    return 'NIM sudah terdaftar.'
  }

  if (normalizedMsg.includes('duplicate key value') && normalizedMsg.includes('user_id')) {
    return 'Akun auth mahasiswa sudah terhubung ke data mahasiswa lain. Periksa sinkronisasi akun.'
  }

  if (normalizedMsg.includes('user already registered')) {
    return 'Akun login dengan NIM tersebut sudah ada, tetapi belum sinkron dengan data mahasiswa.'
  }

  if (normalizedMsg.includes('foreign key')) {
    return 'Relasi data mahasiswa dengan auth.users gagal. Pastikan migration database terbaru sudah dijalankan.'
  }

  if (normalizedMsg.includes('internal server error') || normalizedMsg.includes('500')) {
    return 'Terjadi kesalahan internal Supabase Auth. Coba ulangi beberapa saat lagi.'
  }

  return msg || 'Terjadi kesalahan pada server. Silakan coba lagi.'
}

async function createMahasiswaWithAccount(
  input: CreateMahasiswaInput,
  options?: { revalidate?: boolean; skipPermissionCheck?: boolean },
) {
  if (!options?.skipPermissionCheck) {
    await requirePermission('edit_mahasiswa')
  }

  validateNama(input.nama)

  const trimmedNama = input.nama.trim()
  const normalizedNim = normalizeNim(input.nim)
  let authUserId: string | null = null
  let createdAuthUser = false
  let insertedMember: Mahasiswa | null = null

  console.info('[createMahasiswaWithAccount] Memulai pembuatan akun mahasiswa', {
    kelas: input.kelas,
    nama: trimmedNama,
    nim: normalizedNim,
    prodi: input.prodi,
  })

  // Gunakan admin client (service_role) agar bypass RLS — INSERT/UPDATE
  // ke tabel mahasiswa harus selalu berhasil dari sisi server.
  const admin = createAdminClient()

  // Cek duplikasi NIM sebelum insert
  const { data: existingMember, error: lookupError } = await admin
    .from('mahasiswa')
    .select('id')
    .eq('nim', normalizedNim)
    .maybeSingle()

  if (lookupError) {
    throwMahasiswaSchemaMismatchIfNeeded(lookupError)
    console.error('[createMahasiswaWithAccount] Gagal cek duplikasi NIM:', lookupError)
    throw lookupError
  }

  if (existingMember) {
    throw new ValidationError('NIM sudah terdaftar')
  }

  try {
    // Step 1: buat atau sinkronkan akun auth di Supabase terlebih dahulu.
    const authUser = await ensureMemberAuthUser({
      mustChangePassword: true,
      nama: trimmedNama,
      nim: normalizedNim,
      prodi: input.prodi,
    })

    authUserId = authUser.userId
    createdAuthUser = authUser.created

    if (!authUserId) {
      throw new Error('user_id dari Supabase Auth tidak valid setelah pembuatan akun')
    }

    // Step 2: simpan data mahasiswa dengan foreign key langsung ke auth.users.
    const { data: createdMember, error: insertError } = await admin
      .from('mahasiswa')
      .insert({
        kelas: input.kelas,
        nama: trimmedNama,
        nim: normalizedNim,
        prodi: input.prodi,
        user_id: authUserId,
      })
      .select('*')
      .single()

    if (insertError || !createdMember) {
      throwMahasiswaSchemaMismatchIfNeeded(insertError)
      console.error('[createMahasiswaWithAccount] Gagal insert mahasiswa:', {
        authUserId,
        insertError,
        nim: normalizedNim,
      })
      throw insertError ?? new Error('Gagal menyimpan data anggota')
    }

    assertMahasiswaHasId(createdMember, 'createMahasiswaWithAccount')
    insertedMember = createdMember

    await syncMemberAuthUserById({
      memberId: insertedMember.id,
      mustChangePassword: true,
      nama: insertedMember.nama,
      nim: normalizedNim,
      prodi: insertedMember.prodi,
      userId: authUserId,
    })

    console.info('[createMahasiswaWithAccount] Berhasil membuat akun mahasiswa', {
      mahasiswaId: insertedMember.id,
      userId: authUserId,
    })

    if (options?.revalidate !== false) {
      revalidatePath('/dashboard/mahasiswa')
      revalidatePath('/dashboard')
    }

    return insertedMember
  } catch (error) {
    console.error('[createMahasiswaWithAccount] Error saat create flow, melakukan rollback:', {
      authUserId,
      createdAuthUser,
      error,
      mahasiswaId: insertedMember?.id ?? null,
      nim: normalizedNim,
    })

    if (insertedMember?.id) {
      await admin.from('mahasiswa').delete().eq('id', insertedMember.id)
    }

    if (createdAuthUser && authUserId) {
      try {
        await deleteMemberAuthUser(authUserId)
      } catch (cleanupError) {
        console.error('[createMahasiswaWithAccount] Gagal cleanup auth user saat rollback:', cleanupError)
      }
    }

    throw error
  }
}

// ─── Auth ────────────────────────────────────────────────
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  return profile
}

// ─── Mahasiswa ───────────────────────────────────────────
export async function getMahasiswa(kelas?: Kelas) {
  await requirePermission('view_mahasiswa')

  const admin = createAdminClient()
  let query = admin.from('mahasiswa').select('*').order('nama')
  if (kelas) query = query.eq('kelas', kelas)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function addMahasiswa(nama: string, kelas: Kelas, prodi: Prodi, nim?: string) {
  if (!nim?.trim()) {
    throw new ValidationError('NIM wajib diisi untuk membuat akun anggota')
  }

  return createMahasiswaWithAccount({
    kelas,
    nama,
    nim,
    prodi,
  })
}

export async function addMahasiswaAction(
  nama: string,
  kelas: Kelas,
  prodi: Prodi,
  nim?: string,
): Promise<ActionResult<Mahasiswa>> {
  try {
    const created = await addMahasiswa(nama, kelas, prodi, nim)
    return {
      success: true,
      data: created as Mahasiswa,
    }
  } catch (error) {
    console.error('Error adding mahasiswa:', error)
    return {
      success: false,
      error: getActionErrorMessage(error),
    }
  }
}

export async function syncMahasiswaAccount(id: string) {
  await requirePermission('edit_mahasiswa')

  // Gunakan admin client untuk membaca dan mengupdate mahasiswa
  // tanpa hambatan RLS
  const admin = createAdminClient()
  const { data: mahasiswa, error: mahasiswaError } = await admin
    .from('mahasiswa')
    .select('*')
    .eq('id', id)
    .single()

  if (mahasiswaError || !mahasiswa) {
    throwMahasiswaSchemaMismatchIfNeeded(mahasiswaError)
    console.error('[syncMahasiswaAccount] Mahasiswa tidak ditemukan:', mahasiswaError)
    throw mahasiswaError ?? new Error('Data mahasiswa tidak ditemukan')
  }

  assertMahasiswaHasId(mahasiswa, 'syncMahasiswaAccount')

  if (!mahasiswa.nim?.trim()) {
    throw new ValidationError('NIM wajib diisi sebelum membuat akun mahasiswa')
  }

  const normalizedNim = normalizeNim(mahasiswa.nim)

  // Buat atau sinkronkan akun Auth
  const authUser = await ensureMemberAuthUser({
    memberId: mahasiswa.id,
    mustChangePassword: true,
    nama: mahasiswa.nama,
    nim: normalizedNim,
    prodi: mahasiswa.prodi,
  })

  if (!authUser.userId) {
    throw new Error('user_id dari Supabase Auth tidak valid setelah sinkronisasi')
  }

  // Update mahasiswa dengan user_id menggunakan admin client
  const { data: updatedMahasiswa, error: updateError } = await admin
    .from('mahasiswa')
    .update({
      nim: normalizedNim,
      user_id: authUser.userId,
    })
    .eq('id', mahasiswa.id)
    .select('*')
    .single()

  if (updateError || !updatedMahasiswa) {
    console.error('[syncMahasiswaAccount] Gagal update user_id:', updateError)
    throw updateError ?? new Error('Gagal menghubungkan akun mahasiswa')
  }

  revalidatePath('/dashboard/mahasiswa')
  revalidatePath('/dashboard')

  return {
    created: authUser.created,
    email: authUser.email,
    member: updatedMahasiswa,
  }
}

export async function syncMahasiswaAccountAction(
  id: string,
): Promise<ActionResult<{ created: boolean; email: string; member: Mahasiswa }>> {
  try {
    const result = await syncMahasiswaAccount(id)
    return {
      success: true,
      data: {
        ...result,
        member: result.member as Mahasiswa,
      },
    }
  } catch (error) {
    console.error('Error syncing mahasiswa account:', error)
    return {
      success: false,
      error: getActionErrorMessage(error),
    }
  }
}

export async function updateMahasiswa(id: string, nama: string, kelas: Kelas, prodi: Prodi) {
  await requirePermission('edit_mahasiswa')

  const admin = createAdminClient()
  const trimmedNama = nama.trim()

  validateNama(trimmedNama)

  const { data: existingMember, error: fetchError } = await admin
    .from('mahasiswa')
    .select('id, nim, user_id')
    .eq('id', id)
    .single()

  if (fetchError || !existingMember) {
    throwMahasiswaSchemaMismatchIfNeeded(fetchError)
    throw fetchError ?? new Error('Data mahasiswa tidak ditemukan')
  }

  const { error } = await admin.from('mahasiswa').update({ nama: trimmedNama, kelas, prodi }).eq('id', id)
  if (error) throw error

  if (existingMember.user_id && existingMember.nim) {
    const flags = await getMemberAuthFlags(existingMember.user_id)

    await syncMemberAuthUserById({
      memberId: id,
      mustChangePassword: flags.mustChangePassword,
      nama: trimmedNama,
      nim: existingMember.nim,
      prodi,
      userId: existingMember.user_id,
    })
  }

  revalidatePath('/dashboard/mahasiswa')
  revalidatePath('/dashboard')
}

export async function deleteMahasiswa(id: string) {
  await requirePermission('edit_mahasiswa')

  const admin = createAdminClient()
  const { data: existingMember, error: fetchError } = await admin
    .from('mahasiswa')
    .select('user_id')
    .eq('id', id)
    .single()

  if (fetchError) {
    throwMahasiswaSchemaMismatchIfNeeded(fetchError)
    throw fetchError
  }

  const { error } = await admin.from('mahasiswa').delete().eq('id', id)
  if (error) throw error

  if (existingMember?.user_id) {
    try {
      await deleteMemberAuthUser(existingMember.user_id)
    } catch (cleanupError) {
      console.error('Failed to cleanup member auth user:', cleanupError)
    }
  }

  revalidatePath('/dashboard/mahasiswa')
  revalidatePath('/dashboard')
}

export async function importMahasiswaFromExcel(
  records: { nama: string; nim?: string; prodi: Prodi; kelas: Kelas }[]
) {
  await requirePermission('edit_mahasiswa')

  const results: Mahasiswa[] = []
  
  for (const record of records) {
    if (!record.nama?.trim() || !record.nim?.trim()) {
      continue
    }

    try {
      const createdMember = await createMahasiswaWithAccount(
        {
          kelas: record.kelas,
          nama: record.nama,
          nim: record.nim,
          prodi: record.prodi,
        },
        { revalidate: false, skipPermissionCheck: true },
      )

      results.push(createdMember)
    } catch (error) {
      console.error(`Skipping member import for NIM ${record.nim}:`, error)
    }
  }
  
  revalidatePath('/dashboard/mahasiswa')
  revalidatePath('/dashboard')
  return results
}

// ─── Absensi ─────────────────────────────────────────────
export async function getAbsensi(filters?: { kelas?: string; tanggal?: string; status?: string; pertemuan?: number }) {
  const supabase = await createClient()
  let query = supabase.from('absensi').select('*').order('pertemuan', { ascending: false }).order('tanggal', { ascending: false }).order('nama_mahasiswa')
  if (filters?.kelas) query = query.eq('kelas', filters.kelas)
  if (filters?.tanggal) query = query.eq('tanggal', filters.tanggal)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.pertemuan) query = query.eq('pertemuan', filters.pertemuan)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getAbsensiByDate(tanggal: string, kelas: Kelas) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('absensi')
    .select('*')
    .eq('tanggal', tanggal)
    .eq('kelas', kelas)
  if (error) throw error
  return data
}

export async function saveAbsensi(
  records: { mahasiswa_id: string; nama_mahasiswa: string; kelas: string; status: StatusAbsensi; tanggal: string; pertemuan: number }[]
) {
  if (records.length === 0) throw new ValidationError('Tidak ada data untuk disimpan')
  
  const first = records[0]
  validateTanggal(first.tanggal)
  validatePertemuan(first.pertemuan)
  
  // Check all records have same date, kelas, pertemuan
  const allValid = records.every(r => 
    r.tanggal === first.tanggal && 
    r.kelas === first.kelas && 
    r.pertemuan === first.pertemuan
  )
  if (!allValid) throw new ValidationError('Semua data harus untuk tanggal, kelas, dan pertemuan yang sama')
  
  const supabase = await createClient()
  
  // Delete existing records for this date+kelas+pertemuan combo first
  await supabase
    .from('absensi')
    .delete()
    .eq('tanggal', first.tanggal)
    .eq('kelas', first.kelas)
    .eq('pertemuan', first.pertemuan)
  
  const { error } = await supabase.from('absensi').insert(records)
  if (error) throw error
  revalidatePath('/dashboard/absensi')
  revalidatePath('/dashboard/riwayat')
  revalidatePath('/dashboard')
}

export async function updateAbsensi(id: string, status: StatusAbsensi) {
  const supabase = await createClient()
  const { error } = await supabase.from('absensi').update({ status }).eq('id', id)
  if (error) throw error
  revalidatePath('/dashboard/riwayat')
  revalidatePath('/dashboard')
}

export async function deleteAbsensi(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('absensi').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/dashboard/riwayat')
  revalidatePath('/dashboard')
}

export async function deleteAbsensiByPertemuan(kelas: string, pertemuan: number) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('absensi')
    .delete()
    .eq('kelas', kelas)
    .eq('pertemuan', pertemuan)
  if (error) throw error
  revalidatePath('/dashboard/riwayat')
  revalidatePath('/dashboard')
}

// ─── Activity Log ────────────────────────────────────────────────
export async function logActivity(action: string, entity: string, detail?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('nama')
    .eq('id', user.id)
    .single()

  const { error } = await supabase.from('activity_log').insert({
    admin_id: user.id,
    admin_nama: profile?.nama || user.email || 'Unknown',
    action,
    entity,
    detail,
  })
  if (error) console.error('Log error:', error)
}

export async function getActivityLog() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getRekapMahasiswa(kelas?: string) {
  const supabase = await createClient()
  let query = supabase.from('absensi').select('*')
  if (kelas) query = query.eq('kelas', kelas)
  const { data, error } = await query
  if (error) throw error

  // Group by mahasiswa
  const grouped: Record<string, any> = {}
  data.forEach(a => {
    if (!grouped[a.mahasiswa_id]) {
      grouped[a.mahasiswa_id] = {
        id: a.mahasiswa_id,
        nama: a.nama_mahasiswa,
        kelas: a.kelas,
        hadir: 0,
        izin: 0,
        alfa: 0,
      }
    }
    if (a.status === 'Hadir') grouped[a.mahasiswa_id].hadir++
    else if (a.status === 'Izin') grouped[a.mahasiswa_id].izin++
    else if (a.status === 'Alfa') grouped[a.mahasiswa_id].alfa++
  })
  return Object.values(grouped)
}

export async function changePassword(oldPassword: string, newPassword: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  if (error) throw error
  await logActivity('UPDATE_PASSWORD', 'PROFIL', 'Changed password')
}

export async function getDashboardStats() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [mahasiswaRes, absensiTodayRes, totalAbsensiRes] = await Promise.all([
    supabase.from('mahasiswa').select('id, kelas'),
    supabase.from('absensi').select('id, status, kelas').eq('tanggal', today),
    supabase.from('absensi').select('id, status'),
  ])

  const totalMahasiswa = mahasiswaRes.data?.length ?? 0
  const mahasiswaDesain = mahasiswaRes.data?.filter(m => m.kelas === 'Graphic Design').length ?? 0
  const mahasiswaWebDesain = mahasiswaRes.data?.filter(m => m.kelas === 'Web Design').length ?? 0
  const hadirHariIni = absensiTodayRes.data?.filter(a => a.status === 'Hadir').length ?? 0
  const totalHadir = totalAbsensiRes.data?.filter(a => a.status === 'Hadir').length ?? 0
  const totalAlfa = totalAbsensiRes.data?.filter(a => a.status === 'Alfa').length ?? 0
  const totalIzin = totalAbsensiRes.data?.filter(a => a.status === 'Izin').length ?? 0

  return {
    totalMahasiswa,
    mahasiswaDesain,
    mahasiswaWebDesain,
    hadirHariIni,
    totalHadir,
    totalAlfa,
    totalIzin,
    totalAbsensi: totalAbsensiRes.data?.length ?? 0,
  }
}

// ─── Admin Management ────────────────────────────────────
export async function getAdmins() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('profiles').select('*').order('created_at')
  if (error) throw error
  return data
}

export async function createAdmin(email: string, password: string, nama: string, role: 'admin' | 'super_admin') {
  validateEmail(email)
  validatePassword(password)
  validateNama(nama)
  
  const supabase = await createClient()
  
  // Check email doesn't already exist
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email.toLowerCase())
    .single()
  if (existing) throw new ValidationError('Email sudah terdaftar')
  
  const { data, error } = await supabase.rpc('create_admin_user', {
    p_email: email.toLowerCase(),
    p_password: password,
    p_nama: nama.trim(),
    p_role: role,
  })
  
  if (error) throw error
  await logActivity('CREATE_ADMIN', 'ADMIN', `Created ${role} account: ${email}`)
  revalidatePath('/dashboard/ctrl-9Rz')
  return data
}

export async function deleteAdmin(id: string) {
  const supabase = await createClient()
  
  // Delete from auth.users via SQL (profile will cascade delete)
  const { error } = await supabase.rpc('delete_admin_user', {
    p_user_id: id,
  })
  
  if (error) throw error
  revalidatePath('/dashboard/ctrl-9Rz')
}

// ─── Activity Status ─────────────────────────────────────────
export async function getActivityStatus(tanggal: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('activity_status')
    .select('*')
    .eq('tanggal', tanggal)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

export async function updateActivityStatus(tanggal: string, status: string, absensi_dibuka: boolean) {
  validateTanggal(tanggal)
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('activity_status')
    .select('id')
    .eq('tanggal', tanggal)
    .single()
  
  if (existing) {
    const { error } = await supabase
      .from('activity_status')
      .update({ status, absensi_dibuka, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('activity_status')
      .insert({ tanggal, status, absensi_dibuka })
    if (error) throw error
  }
  revalidatePath('/dashboard')
}

// ─── Documentation ──────────────────────────────────────────
export async function getDocumentation(tanggal?: string) {
  const supabase = await createClient()
  let query = supabase.from('documentation').select('*').order('created_at', { ascending: false })
  if (tanggal) query = query.eq('tanggal', tanggal)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function addDocumentation(tanggal: string, judul: string, deskripsi: string, file_url: string, file_path: string) {
  const admin = createAdminClient()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Akses ditolak. Silakan login ulang sebagai admin.')
  }

  const { data, error } = await admin.from('documentation').insert({
    tanggal,
    judul,
    deskripsi,
    file_url,
    file_path,
    created_by: user.id,
  })
    .select('*')
    .single()

  if (error) throw error
  revalidatePath('/dashboard/dokumentasi')
  revalidatePath('/')
  revalidatePath('/lcc')

  return data
}

export async function deleteDocumentation(id: string) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Akses ditolak. Silakan login ulang sebagai admin.')
  }

  const { data: existingDoc, error: fetchError } = await admin
    .from('documentation')
    .select('id, file_path')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  const { error } = await admin.from('documentation').delete().eq('id', id)
  if (error) throw error

  if (existingDoc?.file_path) {
    const { error: storageError } = await admin.storage
      .from('documentation-images')
      .remove([existingDoc.file_path])

    if (storageError) {
      console.error('Documentation storage cleanup error:', storageError)
    }
  }

  revalidatePath('/dashboard/dokumentasi')
  revalidatePath('/')
  revalidatePath('/lcc')
}

// ─── Meeting Notes ──────────────────────────────────────────
export async function getMeetingNotes(pertemuan: number, tanggal?: string) {
  const supabase = await createClient()
  let query = supabase.from('meeting_notes').select('*').eq('pertemuan', pertemuan)
  if (tanggal) query = query.eq('tanggal', tanggal)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function saveMeetingNotes(pertemuan: number, tanggal: string, judul: string, materi: string, mentor_nama: string, catatan_evaluasi: string) {
  validateTanggal(tanggal)
  validatePertemuan(pertemuan)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: existing } = await supabase
    .from('meeting_notes')
    .select('id')
    .eq('pertemuan', pertemuan)
    .eq('tanggal', tanggal)
    .single()
  
  if (existing) {
    const { error } = await supabase
      .from('meeting_notes')
      .update({ judul, materi, mentor_nama, catatan_evaluasi, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('meeting_notes')
      .insert({ pertemuan, tanggal, judul, materi, mentor_nama, catatan_evaluasi, created_by: user?.id })
    if (error) throw error
  }
  revalidatePath('/dashboard/catatan')
}

// ─── Badges & Certificates ──────────────────────────────────
export async function calculateAndAwardBadges(mahasiswa_id: string) {
  const supabase = await createClient()
  
  // Get attendance count
  const { data: attendance } = await supabase
    .from('absensi')
    .select('id')
    .eq('mahasiswa_id', mahasiswa_id)
    .eq('status', 'Hadir')
  
  const hadirCount = attendance?.length || 0
  let badgeType: BadgeType = 'Bronze'
  
  if (hadirCount >= 40) badgeType = 'Platinum'
  else if (hadirCount >= 30) badgeType = 'Gold'
  else if (hadirCount >= 20) badgeType = 'Silver'
  
  const { data: existing } = await supabase
    .from('student_badges')
    .select('id')
    .eq('mahasiswa_id', mahasiswa_id)
    .eq('badge_type', badgeType)
    .single()
  
  if (!existing) {
    await supabase.from('student_badges').insert({
      mahasiswa_id,
      badge_type: badgeType,
      attendance_count: hadirCount,
    })
  }
  
  return { badgeType, hadirCount }
}

export async function calculateAttendancePercentage(mahasiswa_id: string, totalPertemuan: number = 16) {
  const supabase = await createClient()
  
  const { data: absensi } = await supabase
    .from('absensi')
    .select('status')
    .eq('mahasiswa_id', mahasiswa_id)
  
  const hadirCount = absensi?.filter(a => a.status === 'Hadir').length || 0
  const percentage = Math.round((hadirCount / totalPertemuan) * 100)
  
  return { hadirCount, totalPertemuan, percentage }
}

export async function generateCertificate(mahasiswa_id: string, totalPertemuan: number = 16) {
  const { overview } = await ensureCertificateRecord(mahasiswa_id, totalPertemuan)

  revalidatePath('/dashboard/sertifikat')
  revalidatePath('/student/certificate')

  return {
    mahasiswa: overview.nama,
    hadirCount: overview.hadirCount,
    percentage: overview.percentage,
  }
}

export async function getStudentBadges(mahasiswa_id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('student_badges')
    .select('*')
    .eq('mahasiswa_id', mahasiswa_id)
    .order('earned_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getStudentCertificate(mahasiswa_id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('student_certificates')
    .select('*')
    .eq('mahasiswa_id', mahasiswa_id)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

// ─── Analytics & Monitoring ──────────────────────────────
export async function getAttendanceByMeeting() {
  const supabase = await createClient()
  const { data: absensi } = await supabase
    .from('absensi')
    .select('pertemuan, status')
    .order('pertemuan')
  
  if (!absensi) return []
  
  const grouped = new Map<number, { hadir: number; izin: number; alfa: number }>()
  absensi.forEach(a => {
    if (!grouped.has(a.pertemuan)) {
      grouped.set(a.pertemuan, { hadir: 0, izin: 0, alfa: 0 })
    }
    const stats = grouped.get(a.pertemuan)!
    if (a.status === 'Hadir') stats.hadir++
    else if (a.status === 'Izin') stats.izin++
    else if (a.status === 'Alfa') stats.alfa++
  })
  
  return Array.from(grouped.entries()).map(([meeting, stats]) => ({
    pertemuan: `P${meeting}`,
    hadir: stats.hadir,
    izin: stats.izin,
    alfa: stats.alfa,
  }))
}

export async function getAttendanceByProdi() {
  const supabase = await createClient()
  const { data: mahasiswa } = await supabase.from('mahasiswa').select('id, prodi')
  const { data: absensi } = await supabase.from('absensi').select('mahasiswa_id, status')
  
  if (!mahasiswa || !absensi) return []
  
  const mahasiswaMap = new Map(mahasiswa.map(m => [m.id, m.prodi]))
  const grouped = new Map<string, { hadir: number; total: number }>()
  
  absensi.forEach(a => {
    const prodi = mahasiswaMap.get(a.mahasiswa_id)
    if (!prodi) return
    if (!grouped.has(prodi)) {
      grouped.set(prodi, { hadir: 0, total: 0 })
    }
    const stats = grouped.get(prodi)!
    stats.total++
    if (a.status === 'Hadir') stats.hadir++
  })
  
  return Array.from(grouped.entries()).map(([prodi, stats]) => ({
    prodi,
    kehadiran: stats.total > 0 ? Math.round((stats.hadir / stats.total) * 100) : 0,
    hadir: stats.hadir,
    total: stats.total,
  }))
}

export async function getTopActiveStudents() {
  const supabase = await createClient()
  const { data: mahasiswa } = await supabase.from('mahasiswa').select('id, nama, prodi')
  const { data: absensi } = await supabase.from('absensi').select('mahasiswa_id, status, pertemuan')
  
  if (!mahasiswa || !absensi) return []
  
  const studentStats = new Map<string, { nama: string; prodi: string; hadir: number; total: number }>()
  
  mahasiswa.forEach(m => {
    studentStats.set(m.id, { nama: m.nama, prodi: m.prodi, hadir: 0, total: 0 })
  })
  
  absensi.forEach(a => {
    const stats = studentStats.get(a.mahasiswa_id)
    if (stats) {
      stats.total++
      if (a.status === 'Hadir') stats.hadir++
    }
  })
  
  return Array.from(studentStats.entries())
    .map(([id, stats]) => ({
      id,
      nama: stats.nama,
      prodi: stats.prodi,
      totalKehadiran: stats.hadir,
      persentaseKehadiran: stats.total > 0 ? Math.round((stats.hadir / stats.total) * 100) : 0,
    }))
    .sort((a, b) => {
      if (b.persentaseKehadiran !== a.persentaseKehadiran) {
        return b.persentaseKehadiran - a.persentaseKehadiran
      }
      return b.totalKehadiran - a.totalKehadiran
    })
    .slice(0, 5)
}

export async function getLowAttendanceStudents() {
  const supabase = await createClient()
  const { data: mahasiswa } = await supabase.from('mahasiswa').select('id, nama, prodi, kelas')
  const { data: absensi } = await supabase.from('absensi').select('mahasiswa_id, status')
  
  if (!mahasiswa || !absensi) return []
  
  const studentStats = new Map<string, { nama: string; prodi: string; kelas: string; hadir: number; total: number }>()
  
  mahasiswa.forEach(m => {
    studentStats.set(m.id, { nama: m.nama, prodi: m.prodi, kelas: m.kelas, hadir: 0, total: 0 })
  })
  
  absensi.forEach(a => {
    const stats = studentStats.get(a.mahasiswa_id)
    if (stats) {
      stats.total++
      if (a.status === 'Hadir') stats.hadir++
    }
  })
  
  return Array.from(studentStats.entries())
    .filter(([, stats]) => {
      const percentage = stats.total > 0 ? (stats.hadir / stats.total) * 100 : 0
      return percentage < 70 && stats.total > 0
    })
    .map(([id, stats]) => ({
      id,
      nama: stats.nama,
      prodi: stats.prodi,
      kelas: stats.kelas,
      totalKehadiran: stats.hadir,
      totalPertemuan: stats.total,
      persentaseKehadiran: Math.round((stats.hadir / stats.total) * 100),
    }))
    .sort((a, b) => a.persentaseKehadiran - b.persentaseKehadiran)
}

export async function getAttendanceTrend() {
  const supabase = await createClient()
  const { data: absensi } = await supabase
    .from('absensi')
    .select('tanggal, status')
    .order('tanggal')
  
  if (!absensi) return []
  
  const grouped = new Map<string, { hadir: number; total: number }>()
  
  absensi.forEach(a => {
    if (!grouped.has(a.tanggal)) {
      grouped.set(a.tanggal, { hadir: 0, total: 0 })
    }
    const stats = grouped.get(a.tanggal)!
    stats.total++
    if (a.status === 'Hadir') stats.hadir++
  })
  
  return Array.from(grouped.entries()).map(([tanggal, stats]) => ({
    tanggal,
    persentase: Math.round((stats.hadir / stats.total) * 100),
  }))
}

export async function getTotalPertemuan() {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('pertemuan')
    .select('*', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}
