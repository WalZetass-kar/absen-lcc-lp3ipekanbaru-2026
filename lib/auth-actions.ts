'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function adminLogout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  return { success: true }
}

// QR Code operations with server-only APIs
export async function generateQRCode(pertemuan_id: string, qr_code_data: string) {
  const supabase = await createClient()

  const { error: deactivateError } = await supabase
    .from('qr_codes')
    .update({ is_active: false })
    .eq('pertemuan_id', pertemuan_id)
    .eq('is_active', true)

  if (deactivateError) throw deactivateError

  const { data, error } = await supabase.from('qr_codes').insert({
    pertemuan_id,
    qr_code_data,
    is_active: true,
  }).select('id, pertemuan_id, qr_code_data, is_active, created_at, expires_at').single()

  if (error) throw error
  revalidatePath('/dashboard/qr-management')
  return data
}

export async function deactivateQRCode(qr_code_id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('qr_codes')
    .update({ is_active: false })
    .eq('id', qr_code_id)

  if (error) throw error
  revalidatePath('/dashboard/qr-management')
  return { success: true }
}

export async function approvePermission(permission_id: string, approved: boolean) {
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
    .eq('id', permission_id)
    .single()

  if (permissionError || !permission) {
    throw permissionError ?? new Error('Permintaan izin tidak ditemukan')
  }

  const mahasiswa = Array.isArray(permission.mahasiswa) ? permission.mahasiswa[0] : permission.mahasiswa
  const pertemuan = Array.isArray(permission.pertemuan) ? permission.pertemuan[0] : permission.pertemuan
  const status = approved ? 'Disetujui' : 'Ditolak'

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
      status,
      approved_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', permission_id)

  if (error) throw error
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/qr-management')
  revalidatePath('/student/dashboard')
  revalidatePath('/student/permission')
  return { success: true, status }
}
