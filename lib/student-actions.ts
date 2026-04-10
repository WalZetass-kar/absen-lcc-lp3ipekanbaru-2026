'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import type { Absensi, Announcement, AttendanceWarning } from './types'

const STUDENT_SESSION_COOKIE = 'student_session_id'

type StudentSessionRecord = {
  mahasiswa_id: string
  nim: string
  nama: string
  kelas: string
  prodi?: string | null
  must_change_password?: boolean | null
}

function takeFirst<T>(data: T | T[] | null): T | null {
  if (!data) return null
  return Array.isArray(data) ? (data[0] ?? null) : data
}

async function getStoredStudentSessionId() {
  const cookieStore = await cookies()
  return cookieStore.get(STUDENT_SESSION_COOKIE)?.value ?? null
}

async function requireStoredStudentSessionId() {
  const sessionId = await getStoredStudentSessionId()
  if (!sessionId) {
    throw new Error('Session tidak valid. Silakan login ulang.')
  }
  return sessionId
}

// Student login with NIM/password
export async function studentLogin(nim: string, password: string): Promise<{ success?: boolean; error?: string; mustChangePassword?: boolean }> {
  const normalizedNim = nim.trim().toLowerCase()
  if (!normalizedNim || !password) {
    return { error: 'NIM dan password wajib diisi' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('login_student', {
    p_nim: normalizedNim,
    p_password: password,
  })

  const account = takeFirst(data as {
    account_id: string
    must_change_password: boolean
  } | {
    account_id: string
    must_change_password: boolean
  }[] | null)

  if (error || !account?.account_id) {
    return { error: 'NIM atau password salah' }
  }

  const cookieStore = await cookies()
  cookieStore.set(STUDENT_SESSION_COOKIE, account.account_id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return { success: true, mustChangePassword: Boolean(account.must_change_password) }
}

// Student logout
export async function studentLogout() {
  const cookieStore = await cookies()
  cookieStore.delete(STUDENT_SESSION_COOKIE)
  revalidatePath('/student')
  revalidatePath('/')
}

// Get current student session - validates against database
export async function getStudentSession(): Promise<{ mahasiswa_id: string; nim: string; nama: string; kelas: string; prodi?: string; must_change_password?: boolean } | null> {
  try {
    const sessionId = await getStoredStudentSessionId()
    if (!sessionId) return null

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_student_session', {
      p_session_id: sessionId,
    })

    const session = takeFirst(data as StudentSessionRecord | StudentSessionRecord[] | null)
    if (error || !session) return null

    return {
      mahasiswa_id: session.mahasiswa_id,
      nim: session.nim,
      nama: session.nama,
      kelas: session.kelas,
      prodi: session.prodi ?? undefined,
      must_change_password: Boolean(session.must_change_password),
    }
  } catch {
    return null
  }
}

// Change student password - validates session server-side
export async function changeStudentPassword(oldPassword: string, newPassword: string): Promise<{ success?: boolean; error?: string }> {
  if (newPassword.length < 6) {
    return { error: 'Password minimal 6 karakter' }
  }

  const sessionId = await getStoredStudentSessionId()
  if (!sessionId) {
    return { error: 'Session tidak valid' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('change_student_password', {
    p_session_id: sessionId,
    p_old_password: oldPassword,
    p_new_password: newPassword,
  })

  if (error) {
    return { error: error.message || 'Gagal mengubah password' }
  }

  revalidatePath('/student/dashboard')
  return { success: true }
}

// Get student attendance history
export async function getStudentAttendance(_mahasiswa_id?: string): Promise<Absensi[]> {
  const supabase = await createClient()
  const sessionId = await requireStoredStudentSessionId()
  const { data, error } = await supabase.rpc('get_student_attendance', {
    p_session_id: sessionId,
  })

  if (error) {
    console.error('Error fetching student attendance:', error)
    throw new Error('Gagal mengambil data kehadiran')
  }

  return Array.isArray(data) ? (data as Absensi[]) : data ? [data as Absensi] : []
}

// Get student attendance stats
export async function getStudentAttendanceStats(_mahasiswa_id?: string): Promise<{ hadir: number; izin: number; alfa: number; total: number; percentage: number }> {
  const supabase = await createClient()
  const sessionId = await requireStoredStudentSessionId()
  const { data, error } = await supabase.rpc('get_student_attendance_stats', {
    p_session_id: sessionId,
  })

  const stats = takeFirst(data as {
    hadir: number
    izin: number
    alfa: number
    total: number
    percentage: number
  } | {
    hadir: number
    izin: number
    alfa: number
    total: number
    percentage: number
  }[] | null)

  if (error || !stats) {
    return { hadir: 0, izin: 0, alfa: 0, total: 0, percentage: 0 }
  }

  return {
    hadir: Number(stats.hadir ?? 0),
    izin: Number(stats.izin ?? 0),
    alfa: Number(stats.alfa ?? 0),
    total: Number(stats.total ?? 0),
    percentage: Number(stats.percentage ?? 0),
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
  const supabase = await createClient()
  const sessionId = await requireStoredStudentSessionId()
  const { error } = await supabase.rpc('submit_student_permission', {
    p_session_id: sessionId,
    p_pertemuan_id: pertemuan_id,
    p_alasan: alasan,
    p_bukti_file_url: bukti_file_url ?? null,
    p_bukti_file_path: bukti_file_path ?? null,
  })

  if (error) throw new Error(error.message || 'Gagal mengirim permintaan izin')
  revalidatePath('/student/permission')
  revalidatePath('/dashboard/qr-management')
}

// Get student permissions
export async function getStudentPermissions() {
  const supabase = await createClient()
  const sessionId = await requireStoredStudentSessionId()
  const { data, error } = await supabase.rpc('get_student_permissions', {
    p_session_id: sessionId,
  })

  if (error) throw error
  return Array.isArray(data) ? data : data ? [data] : []
}

// Get student attendance warnings
export async function getAttendanceWarnings(_mahasiswa_id?: string) {
  const supabase = await createClient()
  const sessionId = await requireStoredStudentSessionId()
  const { data, error } = await supabase.rpc('get_student_attendance_warnings', {
    p_session_id: sessionId,
  })

  if (error) throw error
  return Array.isArray(data) ? (data as AttendanceWarning[]) : data ? [data as AttendanceWarning] : []
}

// Acknowledge warning
export async function acknowledgeWarning(warningId: string) {
  const supabase = await createClient()
  const sessionId = await requireStoredStudentSessionId()
  const { error } = await supabase.rpc('acknowledge_student_warning', {
    p_session_id: sessionId,
    p_warning_id: warningId,
  })

  if (error) throw error
}

// Scan QR code and record attendance
export async function scanQRCodeAndAttend(qr_code_data: string) {
  const supabase = await createClient()
  const sessionId = await requireStoredStudentSessionId()
  const { data, error } = await supabase.rpc('scan_student_attendance', {
    p_session_id: sessionId,
    p_qr_code_data: qr_code_data,
  })

  const result = takeFirst(data as {
    success: boolean
    pertemuan_number: number
  } | {
    success: boolean
    pertemuan_number: number
  }[] | null)

  if (error || !result) {
    throw new Error(error?.message || 'Gagal memproses QR code')
  }

  revalidatePath('/student/dashboard')
  revalidatePath('/dashboard/qr-management')

  return { success: Boolean(result.success), pertemuanNumber: result.pertemuan_number }
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
