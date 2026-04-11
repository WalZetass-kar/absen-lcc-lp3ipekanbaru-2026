import { NextRequest } from 'next/server'

import { buildPdfResponse, buildSignatureSheetPdf } from '@/lib/pdf'
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
  const prodi = request.nextUrl.searchParams.get('prodi')
  const shouldDownload = request.nextUrl.searchParams.get('download') === '1'

  let query = supabase
    .from('mahasiswa')
    .select('nim, nama, prodi, kelas')
    .order('nama', { ascending: true })

  if (kelas) {
    query = query.eq('kelas', kelas)
  }

  if (prodi) {
    query = query.eq('prodi', prodi)
  }

  const { data: mahasiswa, error: mahasiswaError } = await query

  if (mahasiswaError) {
    return Response.json({ error: mahasiswaError.message || 'Gagal mengambil data mahasiswa' }, { status: 500 })
  }

  const filters = [
    kelas ? `Kelas LCC: ${kelas}` : null,
    prodi ? `Prodi: ${prodi}` : null,
  ].filter((value): value is string => Boolean(value))

  const { buffer, fileName } = await buildSignatureSheetPdf(
    (mahasiswa ?? []).map((item) => ({
      kelas: item.kelas,
      nama: item.nama,
      nim: item.nim ?? null,
      prodi: item.prodi,
    })),
    filters,
  )

  return buildPdfResponse(buffer, fileName, shouldDownload)
}
