import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { QRCode, Announcement, Pertemuan, StudentPermission, ActivityDocumentation, AdminActivityLog } from './types'

// ─── Activity Documentation ──────────────────────────────
export async function createActivityDocumentation(
  judul: string,
  deskripsi: string,
  tanggal_kegiatan: string,
  foto_url?: string,
  foto_path?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')
  
  const { data, error } = await supabase
    .from('activity_documentation')
    .insert({
      judul,
      deskripsi,
      tanggal_kegiatan,
      foto_url,
      foto_path,
      created_by: user.id,
    })
    .select()
    .single()
  
  if (error) throw error
  
  await logAdminActivity(user.id, `Membuat dokumentasi kegiatan: ${judul}`, { tanggal_kegiatan })
  revalidatePath('/dashboard/dokumentasi')
  return data
}

export async function getActivityDocumentation() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('activity_documentation')
    .select('*')
    .order('tanggal_kegiatan', { ascending: false })
  
  if (error) throw error
  return data as ActivityDocumentation[]
}

export async function deleteActivityDocumentation(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')
  
  const { error } = await supabase
    .from('activity_documentation')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  
  await logAdminActivity(user.id, `Menghapus dokumentasi kegiatan: ${id}`)
  revalidatePath('/dashboard/dokumentasi')
}

// ─── Admin Activity Logging ──────────────────────────────
export async function logAdminActivity(
  admin_id: string,
  aktivitas: string,
  details?: Record<string, unknown>
) {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('nama')
    .eq('id', admin_id)
    .single()
  
  const { error } = await supabase
    .from('admin_activity_log')
    .insert({
      admin_id,
      admin_nama: profile?.nama,
      aktivitas,
      details,
    })
  
  if (error) console.error('Failed to log activity:', error)
}

export async function getAdminActivityLog() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('admin_activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  
  if (error) throw error
  return data as AdminActivityLog[]
}

// Publish announcement
export async function publishAnnouncement(judul: string, isi: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')
  
  const { data, error } = await supabase.from('announcements').insert({
    judul,
    isi,
    created_by: user.id,
    is_published: true,
    published_at: new Date().toISOString(),
  }).select().single()
  
  if (error) throw error
  
  await logAdminActivity(user.id, `Membuat pengumuman: ${judul}`)
  revalidatePath('/dashboard')
  return data
}

// Update announcement
export async function updateAnnouncement(
  id: string,
  judul: string,
  isi: string,
  is_published: boolean
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')
  
  const { error } = await supabase
    .from('announcements')
    .update({
      judul,
      isi,
      is_published,
      published_at: is_published ? new Date().toISOString() : null,
    })
    .eq('id', id)
  
  if (error) throw error
  
  await logAdminActivity(user.id, `Mengubah pengumuman: ${judul}`)
  revalidatePath('/dashboard')
}

// Get all announcements (admin view)
export async function getAllAnnouncements() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('published_at', { ascending: false })
  
  if (error) throw error
  return data as Announcement[]
}

// Delete announcement
export async function deleteAnnouncement(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('announcements').delete().eq('id', id)
  
  if (error) throw error
  revalidatePath('/dashboard')
}

// Create weekly pertemuan (auto)
export async function createAutoPertemuan() {
  const supabase = await createClient()
  const today = new Date()
  const nextSaturday = new Date(today)
  nextSaturday.setDate(today.getDate() + ((6 - today.getDay()) % 7) + 1)
  
  const { data: lastMeeting } = await supabase
    .from('pertemuan')
    .select('nomor_pertemuan')
    .order('nomor_pertemuan', { ascending: false })
    .limit(1)
    .single()
  
  const nextNomor = (lastMeeting?.nomor_pertemuan || 0) + 1
  
  const { error } = await supabase.from('pertemuan').insert({
    nomor_pertemuan: nextNomor,
    tanggal: nextSaturday.toISOString().split('T')[0],
    status: 'Dijadwalkan',
  })
  
  if (error) throw error
  revalidatePath('/dashboard')
}

// Approve/reject permission
export async function approvePermission(permissionId: string, approved: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: permission, error: permissionError } = await supabase
    .from('student_permissions')
    .select(`
      id,
      mahasiswa_id,
      pertemuan_id,
      mahasiswa:mahasiswa_id(nama, kelas),
      pertemuan:pertemuan_id(nomor_pertemuan, tanggal)
    `)
    .eq('id', permissionId)
    .single()

  if (permissionError || !permission) {
    throw permissionError ?? new Error('Permintaan izin tidak ditemukan')
  }

  const mahasiswa = Array.isArray(permission.mahasiswa) ? permission.mahasiswa[0] : permission.mahasiswa
  const pertemuan = Array.isArray(permission.pertemuan) ? permission.pertemuan[0] : permission.pertemuan

  if (!pertemuan) {
    throw new Error('Data pertemuan tidak ditemukan')
  }

  const { data: existingAttendance, error: attendanceLookupError } = await supabase
    .from('absensi')
    .select('id, status')
    .eq('mahasiswa_id', permission.mahasiswa_id)
    .eq('pertemuan', pertemuan.nomor_pertemuan)
    .maybeSingle()

  if (attendanceLookupError) throw attendanceLookupError

  if (approved) {
    if (!existingAttendance) {
      const { error: attendanceError } = await supabase.from('absensi').insert({
        mahasiswa_id: permission.mahasiswa_id,
        nama_mahasiswa: mahasiswa?.nama || 'Unknown',
        kelas: mahasiswa?.kelas || '',
        status: 'Izin',
        tanggal: pertemuan.tanggal,
        pertemuan: pertemuan.nomor_pertemuan,
      })

      if (attendanceError) throw attendanceError
    }
  } else if (existingAttendance?.status === 'Izin') {
    const { error: deleteAttendanceError } = await supabase
      .from('absensi')
      .delete()
      .eq('id', existingAttendance.id)

    if (deleteAttendanceError) throw deleteAttendanceError
  }

  const { error } = await supabase
    .from('student_permissions')
    .update({
      status: approved ? 'Disetujui' : 'Ditolak',
      approved_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', permissionId)
  
  if (error) throw error
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/qr-management')
  revalidatePath('/student/dashboard')
  revalidatePath('/student/permission')
}

// Get pending permissions
export async function getPendingPermissions() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('student_permissions')
    .select('*')
    .eq('status', 'Menunggu')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as StudentPermission[]
}

// Update LCC public page
export async function updatePublicLCCPage(
  page_type: 'tentang' | 'visi_misi' | 'jadwal' | 'pengumuman',
  judul: string,
  konten: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: existing } = await supabase
    .from('public_lcc_pages')
    .select('id')
    .eq('page_type', page_type)
    .single()
  
  if (existing) {
    await supabase
      .from('public_lcc_pages')
      .update({ judul, konten, updated_by: user?.id })
      .eq('id', existing.id)
  } else {
    await supabase.from('public_lcc_pages').insert({
      page_type,
      judul,
      konten,
      updated_by: user?.id,
    })
  }
  
  revalidatePath('/lcc')
}

// Get public LCC pages
export async function getPublicLCCPages() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('public_lcc_pages').select('*')
  
  if (error) throw error
  return data
}

// Get pending permissions with mahasiswa details
export async function getPendingPermissionsWithDetails() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('student_permissions')
    .select(`
      *,
      mahasiswa:mahasiswa_id(nama, kelas),
      pertemuan:pertemuan_id(nomor_pertemuan, tanggal)
    `)
    .eq('status', 'Menunggu')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

// Record attendance for approved permission
export async function recordAttendanceFromPermission(mahasiswa_id: string, pertemuan_id: string) {
  const supabase = await createClient()
  
  // Get pertemuan and mahasiswa details
  const { data: pertemuan } = await supabase
    .from('pertemuan')
    .select('nomor_pertemuan, tanggal')
    .eq('id', pertemuan_id)
    .single()
  
  const { data: mahasiswa } = await supabase
    .from('mahasiswa')
    .select('nama, kelas')
    .eq('id', mahasiswa_id)
    .single()
  
  if (!pertemuan || !mahasiswa) throw new Error('Data not found')
  
  // Record attendance
  const { error } = await supabase.from('absensi').insert({
    mahasiswa_id,
    nama_mahasiswa: mahasiswa.nama,
    kelas: mahasiswa.kelas,
    status: 'Izin',
    tanggal: pertemuan.tanggal,
    pertemuan: pertemuan.nomor_pertemuan,
  })
  
  if (error) throw error
  revalidatePath('/dashboard')
}

// Get all pertemuan with QR status
export async function getPertemuanWithQR() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pertemuan')
    .select(`
      *,
      qr_codes(id, pertemuan_id, qr_code_data, is_active, created_at, expires_at)
    `)
    .order('nomor_pertemuan', { ascending: false })
  
  if (error) throw error
  return data
}

// Deactivate QR code
export async function deactivateQRCode(qr_code_id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('qr_codes')
    .update({ is_active: false })
    .eq('id', qr_code_id)
  
  if (error) throw error
  revalidatePath('/dashboard/qr-management')
}
