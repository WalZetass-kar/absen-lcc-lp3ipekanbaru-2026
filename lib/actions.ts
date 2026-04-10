'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Kelas, Prodi, StatusAbsensi, BadgeType } from './types'
import { ValidationError, validateNama, validateEmail, validatePassword, validateTanggal, validatePertemuan } from './errors'

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
  const supabase = await createClient()
  let query = supabase.from('mahasiswa').select('*').order('nama')
  if (kelas) query = query.eq('kelas', kelas)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function addMahasiswa(nama: string, kelas: Kelas, prodi: Prodi, nim?: string) {
  validateNama(nama)
  const supabase = await createClient()
  
  // Check for duplicates
  const { data: existing } = await supabase
    .from('mahasiswa')
    .select('id')
    .eq('nama', nama.trim())
    .eq('kelas', kelas)
    .single()
  if (existing) throw new ValidationError('Mahasiswa dengan nama dan kelas yang sama sudah ada')
  
  const insertData: Record<string, unknown> = { nama: nama.trim(), kelas, prodi }
  if (nim) insertData.nim = nim.trim()
  
  const { data, error } = await supabase.from('mahasiswa').insert(insertData).select().single()
  if (error) throw error
  revalidatePath('/dashboard/mahasiswa')
  revalidatePath('/dashboard')
  return data
}

export async function updateMahasiswa(id: string, nama: string, kelas: Kelas, prodi: Prodi) {
  const supabase = await createClient()
  const { error } = await supabase.from('mahasiswa').update({ nama, kelas, prodi }).eq('id', id)
  if (error) throw error
  revalidatePath('/dashboard/mahasiswa')
}

export async function deleteMahasiswa(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('mahasiswa').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/dashboard/mahasiswa')
  revalidatePath('/dashboard')
}

export async function importMahasiswaFromExcel(
  records: { nama: string; nim?: string; prodi: Prodi; kelas: Kelas }[]
) {
  const supabase = await createClient()
  const bcrypt = await import('bcryptjs')
  
  const results: Array<Record<string, unknown>> = []
  
  for (const record of records) {
    if (!record.nama?.trim()) continue
    
    // Check for duplicate
    const { data: existing } = await supabase
      .from('mahasiswa')
      .select('id')
      .eq('nama', record.nama.trim())
      .eq('kelas', record.kelas)
      .single()
    
    if (existing) continue // Skip duplicates
    
    const insertData: Record<string, unknown> = {
      nama: record.nama.trim(),
      kelas: record.kelas,
      prodi: record.prodi,
    }
    if (record.nim) insertData.nim = record.nim.trim()
    
    const { data, error } = await supabase.from('mahasiswa').insert(insertData).select().single()
    if (error) continue
    
    // Create student account with default password (NIM or nama lowercase)
    if (data && record.nim) {
      const defaultPassword = record.nim.toLowerCase()
      const hashedPassword = await bcrypt.hash(defaultPassword, 10)
      
      await supabase.from('student_accounts').insert({
        mahasiswa_id: data.id,
        nim: record.nim.toLowerCase(),
        password_hash: hashedPassword,
        must_change_password: true,
      })
    }
    
    results.push(data)
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
  revalidatePath('/dashboard/admin')
  return data
}

export async function deleteAdmin(id: string) {
  const supabase = await createClient()
  
  // Delete from auth.users via SQL (profile will cascade delete)
  const { error } = await supabase.rpc('delete_admin_user', {
    p_user_id: id,
  })
  
  if (error) throw error
  revalidatePath('/dashboard/admin')
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('documentation').insert({
    tanggal,
    judul,
    deskripsi,
    file_url,
    file_path,
    created_by: user?.id,
  })
  if (error) throw error
  revalidatePath('/dashboard/dokumentasi')
}

export async function deleteDocumentation(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('documentation').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/dashboard/dokumentasi')
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
  const supabase = await createClient()
  
  const { hadirCount, percentage } = await calculateAttendancePercentage(mahasiswa_id, totalPertemuan)
  
  if (percentage < 80) throw new ValidationError('Attendance percentage must be at least 80% to generate certificate')
  
  const { data: mahasiswa } = await supabase
    .from('mahasiswa')
    .select('nama, kelas')
    .eq('id', mahasiswa_id)
    .single()
  
  const { data: existing } = await supabase
    .from('student_certificates')
    .select('id')
    .eq('mahasiswa_id', mahasiswa_id)
    .single()
  
  if (existing) {
    await supabase
      .from('student_certificates')
      .update({
        total_hadir: hadirCount,
        total_pertemuan: totalPertemuan,
        attendance_percentage: percentage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
  } else {
    await supabase.from('student_certificates').insert({
      mahasiswa_id,
      total_hadir: hadirCount,
      total_pertemuan: totalPertemuan,
      attendance_percentage: percentage,
    })
  }
  
  return { mahasiswa: mahasiswa?.nama, hadirCount, percentage }
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
