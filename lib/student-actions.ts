'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

import { ensureMemberAuthUser, getMemberAuthFlags, normalizeNim, updateMemberPassword, verifyMemberCredentials } from './member-auth'
import { clearStudentSessionCookie, getStudentSessionUserId, setStudentSessionCookie } from './student-session'
import { createAdminClient } from './supabase/admin'
import type { Absensi, Announcement, AttendanceWarning } from './types'

type LegacyStudentLoginRecord = {
  mahasiswa_id: string
  must_change_password?: boolean | null
  nama: string
  nim: string
  prodi?: string | null
}

type StudentRecord = {
  id: string
  kelas: string
  nama: string
  nim: string | null
  prodi: string | null
  user_id: string | null
}

function takeFirst<T>(data: T | T[] | null): T | null {
  if (!data) return null
  return Array.isArray(data) ? (data[0] ?? null) : data
}

async function getStudentRecordByUserId(userId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('mahasiswa')
    .select('id, kelas, nama, nim, prodi, user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as StudentRecord | null
}

async function linkStudentUserIdByNim(nim: string, userId: string) {
  const admin = createAdminClient()
  const normalizedNim = normalizeNim(nim)
  const existingStudent = await getStudentRecordByUserId(userId)

  if (existingStudent) {
    return existingStudent
  }

  const { data, error } = await admin
    .from('mahasiswa')
    .update({ user_id: userId, nim: normalizedNim })
    .eq('nim', normalizedNim)
    .is('user_id', null)
    .select('id, kelas, nama, nim, prodi, user_id')
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as StudentRecord | null
}

async function requireCurrentStudent() {
  const userId = await getStudentSessionUserId()

  if (!userId) {
    throw new Error('Session tidak valid. Silakan login ulang.')
  }

  const student = await getStudentRecordByUserId(userId)

  if (!student || !student.nim) {
    await clearStudentSessionCookie()
    throw new Error('Session tidak valid. Silakan login ulang.')
  }

  return {
    student,
    userId,
  }
}

async function migrateLegacyStudentAccount(record: LegacyStudentLoginRecord, password: string) {
  const normalizedNim = normalizeNim(record.nim)
  const authUser = await ensureMemberAuthUser({
    memberId: record.mahasiswa_id,
    mustChangePassword: Boolean(record.must_change_password),
    nama: record.nama,
    nim: normalizedNim,
    password,
    prodi: record.prodi ?? 'Manajemen Informatika',
    syncPassword: true,
  })

  const admin = createAdminClient()
  const { error } = await admin
    .from('mahasiswa')
    .update({
      nim: normalizedNim,
      user_id: authUser.userId,
    })
    .eq('id', record.mahasiswa_id)

  if (error) {
    throw error
  }

  return {
    mustChangePassword: Boolean(record.must_change_password),
    userId: authUser.userId,
  }
}

// Student login with NIM/password backed by Supabase Auth.
// Legacy student_accounts users are migrated on first successful login.
export async function studentLogin(nim: string, password: string): Promise<{ success?: boolean; error?: string; mustChangePassword?: boolean }> {
  let normalizedNim: string

  try {
    normalizedNim = normalizeNim(nim)
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'NIM tidak valid' }
  }

  if (!password) {
    return { error: 'NIM dan password wajib diisi' }
  }

  const authResult = await verifyMemberCredentials(normalizedNim, password)

  if (authResult) {
    const linkedStudent = await linkStudentUserIdByNim(normalizedNim, authResult.userId)

    if (!linkedStudent) {
      return { error: 'Akun anggota belum terhubung ke data mahasiswa. Hubungi admin.' }
    }

    await setStudentSessionCookie(authResult.userId)

    return {
      success: true,
      mustChangePassword: authResult.mustChangePassword,
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('login_student', {
    p_nim: normalizedNim,
    p_password: password,
  })

  const legacyAccount = takeFirst(data as LegacyStudentLoginRecord | LegacyStudentLoginRecord[] | null)

  if (error || !legacyAccount?.mahasiswa_id) {
    return { error: 'NIM atau password salah' }
  }

  const migratedAccount = await migrateLegacyStudentAccount(legacyAccount, password)
  await setStudentSessionCookie(migratedAccount.userId)

  return {
    success: true,
    mustChangePassword: migratedAccount.mustChangePassword,
  }
}

// Student logout
export async function studentLogout() {
  await clearStudentSessionCookie()
  revalidatePath('/student')
  revalidatePath('/')
}

// Get current student session from the signed app cookie
export async function getStudentSession(): Promise<{ mahasiswa_id: string; nim: string; nama: string; kelas: string; prodi?: string; must_change_password?: boolean } | null> {
  try {
    const { student, userId } = await requireCurrentStudent()
    const flags = await getMemberAuthFlags(userId)

    return {
      mahasiswa_id: student.id,
      nim: student.nim ?? '',
      nama: student.nama,
      kelas: student.kelas,
      prodi: student.prodi ?? undefined,
      must_change_password: flags.mustChangePassword,
    }
  } catch {
    return null
  }
}

// Change student password after verifying the current password
export async function changeStudentPassword(oldPassword: string, newPassword: string): Promise<{ success?: boolean; error?: string }> {
  if (newPassword.length < 6) {
    return { error: 'Password minimal 6 karakter' }
  }

  const { student, userId } = await requireCurrentStudent()
  const credentialCheck = await verifyMemberCredentials(student.nim ?? '', oldPassword)

  if (!credentialCheck || credentialCheck.userId !== userId) {
    return { error: 'Password lama salah' }
  }

  await updateMemberPassword(userId, newPassword, false)
  revalidatePath('/student/dashboard')
  return { success: true }
}

// Get student attendance history
export async function getStudentAttendance(_mahasiswa_id?: string): Promise<Absensi[]> {
  const { student } = await requireCurrentStudent()
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('absensi')
    .select('*')
    .eq('mahasiswa_id', student.id)
    .order('tanggal', { ascending: false })
    .order('pertemuan', { ascending: false })

  if (error) {
    console.error('Error fetching student attendance:', error)
    throw new Error('Gagal mengambil data kehadiran')
  }

  return data as Absensi[]
}

// Get student attendance stats
export async function getStudentAttendanceStats(_mahasiswa_id?: string): Promise<{ hadir: number; izin: number; alfa: number; total: number; percentage: number }> {
  const attendance = await getStudentAttendance()
  const hadir = attendance.filter((item) => item.status === 'Hadir').length
  const izin = attendance.filter((item) => item.status === 'Izin').length
  const alfa = attendance.filter((item) => item.status === 'Alfa').length
  const total = attendance.length

  return {
    hadir,
    izin,
    alfa,
    total,
    percentage: total > 0 ? Math.round((hadir / total) * 100) : 0,
  }
}

// Get student announcements
export async function getAnnouncements(limit: number = 10) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as Announcement[]
}

// Submit permission/leave request
export async function submitPermissionRequest(
  pertemuan_id: string,
  alasan: string,
  bukti_file_url?: string,
  bukti_file_path?: string
) {
  const { student } = await requireCurrentStudent()
  const admin = createAdminClient()

  const { data: pertemuan, error: pertemuanError } = await admin
    .from('pertemuan')
    .select('id, nomor_pertemuan')
    .eq('id', pertemuan_id)
    .single()

  if (pertemuanError || !pertemuan) {
    throw new Error('Pertemuan tidak ditemukan')
  }

  const { data: existingPermission, error: permissionLookupError } = await admin
    .from('student_permissions')
    .select('id')
    .eq('mahasiswa_id', student.id)
    .eq('pertemuan_id', pertemuan_id)
    .in('status', ['Menunggu', 'Disetujui'])
    .maybeSingle()

  if (permissionLookupError) {
    throw permissionLookupError
  }

  if (existingPermission) {
    throw new Error('Permintaan izin untuk pertemuan ini sudah ada')
  }

  const { data: existingAttendance, error: attendanceLookupError } = await admin
    .from('absensi')
    .select('id')
    .eq('mahasiswa_id', student.id)
    .eq('pertemuan', pertemuan.nomor_pertemuan)
    .maybeSingle()

  if (attendanceLookupError) {
    throw attendanceLookupError
  }

  if (existingAttendance) {
    throw new Error('Absensi untuk pertemuan ini sudah tercatat')
  }

  const { error } = await admin.from('student_permissions').insert({
    mahasiswa_id: student.id,
    pertemuan_id,
    alasan,
    bukti_file_path: bukti_file_path ?? '',
    bukti_file_url: bukti_file_url ?? null,
    status: 'Menunggu',
  })

  if (error) throw new Error(error.message || 'Gagal mengirim permintaan izin')
  revalidatePath('/student/permission')
  revalidatePath('/dashboard/qr-management')
}

// Get student permissions
export async function getStudentPermissions() {
  const { student } = await requireCurrentStudent()
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('student_permissions')
    .select(`
      id,
      pertemuan_id,
      alasan,
      status,
      created_at,
      updated_at,
      bukti_file_url,
      bukti_file_path,
      pertemuan:pertemuan_id (
        nomor_pertemuan,
        tanggal
      )
    `)
    .eq('mahasiswa_id', student.id)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((item) => {
    const pertemuan = Array.isArray(item.pertemuan) ? item.pertemuan[0] : item.pertemuan

    return {
      ...item,
      nomor_pertemuan: pertemuan?.nomor_pertemuan ?? null,
      tanggal_pertemuan: pertemuan?.tanggal ?? null,
    }
  })
}

// Get student attendance warnings
export async function getAttendanceWarnings(_mahasiswa_id?: string) {
  const { student } = await requireCurrentStudent()
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('attendance_warnings')
    .select('*')
    .eq('mahasiswa_id', student.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as AttendanceWarning[]
}

// Acknowledge warning
export async function acknowledgeWarning(warningId: string) {
  const { student } = await requireCurrentStudent()
  const admin = createAdminClient()
  const { error } = await admin
    .from('attendance_warnings')
    .update({ acknowledged_at: new Date().toISOString() })
    .eq('id', warningId)
    .eq('mahasiswa_id', student.id)

  if (error) throw error
}

// Scan QR code and record attendance
export async function scanQRCodeAndAttend(qr_code_data: string) {
  const { student } = await requireCurrentStudent()
  const admin = createAdminClient()
  const { data: qrData, error: qrError } = await admin
    .from('qr_codes')
    .select(`
      id,
      pertemuan_id,
      pertemuan:pertemuan_id (
        nomor_pertemuan,
        tanggal
      )
    `)
    .eq('qr_code_data', qr_code_data.trim())
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (qrError || !qrData) {
    throw new Error('QR code tidak valid atau sudah expired')
  }

  const pertemuan = Array.isArray(qrData.pertemuan) ? qrData.pertemuan[0] : qrData.pertemuan

  if (!pertemuan) {
    throw new Error('Pertemuan tidak ditemukan')
  }

  const { data: existingAttendance, error: attendanceLookupError } = await admin
    .from('absensi')
    .select('id, status')
    .eq('mahasiswa_id', student.id)
    .eq('pertemuan', pertemuan.nomor_pertemuan)
    .maybeSingle()

  if (attendanceLookupError) {
    throw attendanceLookupError
  }

  if (existingAttendance) {
    if (existingAttendance.status === 'Izin') {
      const { error: updateError } = await admin
        .from('absensi')
        .update({
          status: 'Hadir',
          tanggal: pertemuan.tanggal,
        })
        .eq('id', existingAttendance.id)

      if (updateError) {
        throw updateError
      }

      revalidatePath('/student/dashboard')
      revalidatePath('/dashboard/qr-management')

      return { success: true, pertemuanNumber: pertemuan.nomor_pertemuan }
    }

    throw new Error('Anda sudah melakukan absensi untuk pertemuan ini')
  }

  const { error: insertError } = await admin.from('absensi').insert({
    mahasiswa_id: student.id,
    nama_mahasiswa: student.nama,
    kelas: student.kelas,
    status: 'Hadir',
    tanggal: pertemuan.tanggal,
    pertemuan: pertemuan.nomor_pertemuan,
  })

  if (insertError) {
    throw insertError
  }

  revalidatePath('/student/dashboard')
  revalidatePath('/dashboard/qr-management')

  return { success: true, pertemuanNumber: pertemuan.nomor_pertemuan }
}

// Get all pertemuan for permission selection
export async function getAllPertemuan() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pertemuan')
    .select('*')
    .order('nomor_pertemuan', { ascending: true })

  if (error) throw error
  return data
}

// Get schedule (pertemuan)
export async function getSchedule() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pertemuan')
    .select('*')
    .order('tanggal', { ascending: true })

  if (error) throw error
  return data
}
