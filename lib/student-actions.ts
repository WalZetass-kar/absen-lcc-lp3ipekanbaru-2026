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

// ============================================
// NEW STUDENT FEATURES ACTIONS
// ============================================

import type { LeaderboardEntry, QRScanHistory, MeetingFeedback, StudentAchievement, CalendarDay } from './types'

// 1. GET LEADERBOARD
export async function getLeaderboard(limit: number = 20): Promise<LeaderboardEntry[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('student_leaderboard')
    .select('*')
    .limit(limit)

  if (error) {
    console.error('Error fetching leaderboard:', error)
    throw new Error('Gagal mengambil data leaderboard')
  }

  return data as LeaderboardEntry[]
}

// 2. GET ALL ANNOUNCEMENTS (with pagination)
export async function getAllAnnouncementsWithReadStatus(page: number = 1, limit: number = 10) {
  const { student } = await requireCurrentStudent()
  const admin = createAdminClient()
  
  const offset = (page - 1) * limit
  
  const { data, error, count } = await admin
    .from('announcements')
    .select(`
      *,
      announcements_read!left(id, read_at)
    `, { count: 'exact' })
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  const announcements = (data ?? []).map((item) => {
    const readRecords = item.announcements_read || []
    const isRead = readRecords.some((r: any) => r.id)
    
    return {
      ...item,
      is_read: isRead,
      read_at: readRecords[0]?.read_at || null,
    }
  })

  return {
    announcements,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  }
}

// 3. MARK ANNOUNCEMENT AS READ
export async function markAnnouncementAsRead(announcementId: string) {
  const { student } = await requireCurrentStudent()
  const admin = createAdminClient()

  const { error } = await admin
    .from('announcements_read')
    .upsert({
      mahasiswa_id: student.id,
      announcement_id: announcementId,
    }, {
      onConflict: 'mahasiswa_id,announcement_id',
    })

  if (error) throw error
  revalidatePath('/student/announcements')
}

// 4. GET QR SCAN HISTORY
export async function getQRScanHistory(): Promise<QRScanHistory[]> {
  const { student } = await requireCurrentStudent()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('qr_scan_history')
    .select(`
      *,
      pertemuan:pertemuan_id (
        nomor_pertemuan,
        tanggal
      )
    `)
    .eq('mahasiswa_id', student.id)
    .order('scan_timestamp', { ascending: false })

  if (error) throw error

  return (data ?? []).map((item) => {
    const pertemuan = Array.isArray(item.pertemuan) ? item.pertemuan[0] : item.pertemuan
    return {
      ...item,
      pertemuan: pertemuan ? {
        nomor_pertemuan: pertemuan.nomor_pertemuan,
        tanggal: pertemuan.tanggal,
      } : undefined,
    }
  }) as QRScanHistory[]
}

// 5. LOG QR SCAN (called internally when scanning)
export async function logQRScan(pertemuanId: string, qrCodeData: string, success: boolean, errorMessage?: string) {
  const { student } = await requireCurrentStudent()
  const admin = createAdminClient()

  const { error } = await admin
    .from('qr_scan_history')
    .insert({
      mahasiswa_id: student.id,
      pertemuan_id: pertemuanId,
      qr_code_data: qrCodeData,
      success,
      error_message: errorMessage,
    })

  if (error) {
    console.error('Error logging QR scan:', error)
  }
}

// 6. SUBMIT MEETING FEEDBACK
export async function submitMeetingFeedback(
  pertemuanId: string,
  ratingMateri: number,
  ratingMentor: number,
  komentar?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { student } = await requireCurrentStudent()
    const admin = createAdminClient()

    // Validate ratings
    if (ratingMateri < 1 || ratingMateri > 5 || ratingMentor < 1 || ratingMentor > 5) {
      return { success: false, error: 'Rating harus antara 1-5' }
    }

    const { error } = await admin
      .from('meeting_feedback')
      .upsert({
        mahasiswa_id: student.id,
        pertemuan_id: pertemuanId,
        rating_materi: ratingMateri,
        rating_mentor: ratingMentor,
        komentar: komentar || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'mahasiswa_id,pertemuan_id',
      })

    if (error) throw error

    revalidatePath('/student/feedback')
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Gagal mengirim feedback' 
    }
  }
}

// 7. GET STUDENT FEEDBACK HISTORY
export async function getStudentFeedbackHistory(): Promise<MeetingFeedback[]> {
  const { student } = await requireCurrentStudent()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('meeting_feedback')
    .select('*')
    .eq('mahasiswa_id', student.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as MeetingFeedback[]
}

// 8. GET STUDENT ACHIEVEMENTS
export async function getStudentAchievements(): Promise<StudentAchievement[]> {
  const { student } = await requireCurrentStudent()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('student_achievements')
    .select('*')
    .eq('mahasiswa_id', student.id)
    .order('earned_at', { ascending: false })

  if (error) throw error
  return data as StudentAchievement[]
}

// 9. CHECK AND AWARD ACHIEVEMENTS (called after attendance update)
export async function checkAndAwardAchievements() {
  const { student } = await requireCurrentStudent()
  const admin = createAdminClient()
  
  const stats = await getStudentAttendanceStats()
  const attendance = await getStudentAttendance()

  // Perfect Attendance (100%)
  if (stats.percentage === 100 && stats.total >= 5) {
    await admin.from('student_achievements').upsert({
      mahasiswa_id: student.id,
      achievement_type: 'perfect_attendance',
      achievement_name: 'Perfect Attendance',
      achievement_description: '100% kehadiran',
      icon: '🏆',
    }, {
      onConflict: 'mahasiswa_id,achievement_type',
      ignoreDuplicates: true,
    })
  }

  // Early Bird (5 consecutive attendances)
  const recentAttendance = attendance.slice(0, 5)
  if (recentAttendance.length === 5 && recentAttendance.every(a => a.status === 'Hadir')) {
    await admin.from('student_achievements').upsert({
      mahasiswa_id: student.id,
      achievement_type: 'early_bird',
      achievement_name: 'Early Bird',
      achievement_description: '5 kehadiran berturut-turut',
      icon: '🐦',
    }, {
      onConflict: 'mahasiswa_id,achievement_type',
      ignoreDuplicates: true,
    })
  }

  // Comeback King (improved from <60% to >80%)
  if (stats.percentage >= 80 && stats.total >= 10) {
    await admin.from('student_achievements').upsert({
      mahasiswa_id: student.id,
      achievement_type: 'comeback_king',
      achievement_name: 'Comeback King',
      achievement_description: 'Meningkatkan kehadiran ke 80%+',
      icon: '👑',
    }, {
      onConflict: 'mahasiswa_id,achievement_type',
      ignoreDuplicates: true,
    })
  }

  revalidatePath('/student/achievements')
}

// 10. GET CALENDAR DATA
export async function getAttendanceCalendar(year: number, month: number): Promise<CalendarDay[]> {
  const { student } = await requireCurrentStudent()
  const admin = createAdminClient()

  // Get attendance for the month
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)

  const { data, error } = await admin
    .from('absensi')
    .select('tanggal, status, pertemuan')
    .eq('mahasiswa_id', student.id)
    .gte('tanggal', startDate.toISOString().split('T')[0])
    .lte('tanggal', endDate.toISOString().split('T')[0])

  if (error) throw error

  // Build calendar
  const today = new Date()
  const daysInMonth = endDate.getDate()
  const calendar: CalendarDay[] = []

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    const dateStr = date.toISOString().split('T')[0]
    const attendanceRecord = data?.find(a => a.tanggal === dateStr)

    calendar.push({
      date: dateStr,
      status: attendanceRecord?.status as any,
      pertemuan: attendanceRecord?.pertemuan,
      isToday: date.toDateString() === today.toDateString(),
      isCurrentMonth: true,
    })
  }

  return calendar
}

// 11. GET MEETING NOTES/MATERIALS
export async function getMeetingNotes(pertemuanNumber?: number) {
  const admin = createAdminClient()
  
  let query = admin
    .from('meeting_notes')
    .select('*')
    .order('pertemuan', { ascending: false })

  if (pertemuanNumber) {
    query = query.eq('pertemuan', pertemuanNumber)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

// 12. UPLOAD STUDENT PROFILE PHOTO
export async function uploadStudentProfilePhoto(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { student, userId } = await requireCurrentStudent()
    const admin = createAdminClient()
    
    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Format file tidak valid' }
    }

    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return { success: false, error: 'Ukuran file maksimal 2MB' }
    }

    // Delete old photo if exists
    if (student.profile_photo_url) {
      const oldPath = student.profile_photo_url.split('/').pop()
      if (oldPath) {
        await admin.storage
          .from('profile-photos')
          .remove([`students/${student.id}/${oldPath}`])
      }
    }

    // Upload new photo
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `students/${student.id}/${fileName}`

    const { error: uploadError } = await admin.storage
      .from('profile-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      return { success: false, error: 'Gagal upload file' }
    }

    // Get public URL
    const { data: { publicUrl } } = admin.storage
      .from('profile-photos')
      .getPublicUrl(filePath)

    // Update mahasiswa record
    const { error: updateError } = await admin
      .from('mahasiswa')
      .update({ profile_photo_url: publicUrl })
      .eq('id', student.id)

    if (updateError) {
      return { success: false, error: 'Gagal update profil' }
    }

    revalidatePath('/student/profile')
    return { success: true, url: publicUrl }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Terjadi kesalahan' 
    }
  }
}

// 13. DELETE STUDENT PROFILE PHOTO
export async function deleteStudentProfilePhoto(): Promise<{ success: boolean; error?: string }> {
  try {
    const { student } = await requireCurrentStudent()
    const admin = createAdminClient()

    if (student.profile_photo_url) {
      const oldPath = student.profile_photo_url.split('/').pop()
      if (oldPath) {
        await admin.storage
          .from('profile-photos')
          .remove([`students/${student.id}/${oldPath}`])
      }
    }

    const { error: updateError } = await admin
      .from('mahasiswa')
      .update({ profile_photo_url: null })
      .eq('id', student.id)

    if (updateError) {
      return { success: false, error: 'Gagal hapus foto' }
    }

    revalidatePath('/student/profile')
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Terjadi kesalahan' 
    }
  }
}
