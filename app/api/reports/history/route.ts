import { NextRequest } from 'next/server'

import { buildAttendanceHistoryPdf, buildPdfResponse } from '@/lib/pdf'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const kelas = request.nextUrl.searchParams.get('kelas')
  const status = request.nextUrl.searchParams.get('status')
  const pertemuanRaw = request.nextUrl.searchParams.get('pertemuan')
  const shouldDownload = request.nextUrl.searchParams.get('download') === '1'

  let query = supabase
    .from('absensi')
    .select('nama_mahasiswa, kelas, pertemuan, status, tanggal')
    .order('tanggal', { ascending: false })
    .order('pertemuan', { ascending: false })
    .order('nama_mahasiswa', { ascending: true })

  if (kelas) {
    query = query.eq('kelas', kelas)
  }

  if (status) {
    query = query.eq('status', status)
  }

  if (pertemuanRaw) {
    const pertemuan = Number(pertemuanRaw)
    if (Number.isFinite(pertemuan)) {
      query = query.eq('pertemuan', pertemuan)
    }
  }

  const { data: absensi, error: absensiError } = await query

  if (absensiError) {
    return Response.json({ error: absensiError.message || 'Gagal mengambil riwayat absensi' }, { status: 500 })
  }

  const filters = [
    kelas ? `Kelas: ${kelas}` : null,
    status ? `Status: ${status}` : null,
    pertemuanRaw ? `Pertemuan: ${pertemuanRaw}` : null,
  ].filter((value): value is string => Boolean(value))

  const { buffer, fileName } = await buildAttendanceHistoryPdf(
    (absensi ?? []).map((item) => ({
      kelas: item.kelas,
      nama_mahasiswa: item.nama_mahasiswa,
      pertemuan: item.pertemuan,
      status: item.status,
      tanggal: item.tanggal,
    })),
    filters,
  )

  return buildPdfResponse(buffer, fileName, shouldDownload)
}
