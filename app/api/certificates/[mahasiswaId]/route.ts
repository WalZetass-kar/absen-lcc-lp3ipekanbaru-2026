import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'

import { ensureCertificateRecord, markCertificateDownloaded } from '@/lib/certificates'
import { buildCertificatePdf, buildPdfResponse } from '@/lib/pdf'
import { getStudentSessionUserId } from '@/lib/student-session'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function canAccessCertificate(mahasiswaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      throw profileError
    }

    if (profile) {
      return true
    }
  }

  const studentUserId = await getStudentSessionUserId()
  if (!studentUserId) {
    return false
  }

  const admin = createAdminClient()
  const { data: mahasiswa, error: mahasiswaError } = await admin
    .from('mahasiswa')
    .select('id')
    .eq('user_id', studentUserId)
    .maybeSingle()

  if (mahasiswaError) {
    throw mahasiswaError
  }

  return mahasiswa?.id === mahasiswaId
}

export async function GET(
  request: NextRequest,
  context: { params: { mahasiswaId: string } },
) {
  const { mahasiswaId } = context.params
  const shouldDownload = request.nextUrl.searchParams.get('download') === '1'

  const allowed = await canAccessCertificate(mahasiswaId)
  if (!allowed) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { certificate, overview } = await ensureCertificateRecord(mahasiswaId)
    const { buffer, fileName } = await buildCertificatePdf({
      attendancePercentage: overview.percentage,
      kelas: overview.kelas,
      mahasiswaId: overview.id,
      nama: overview.nama,
      nim: overview.nim,
      prodi: overview.prodi,
      totalHadir: overview.hadirCount,
      totalPertemuan: overview.totalPertemuan,
      issuedAt: certificate.issued_at ?? overview.issuedAt ?? null,
    })

    await markCertificateDownloaded(mahasiswaId)
    revalidatePath('/dashboard/sertifikat')
    revalidatePath('/student/certificate')

    return buildPdfResponse(buffer, fileName, shouldDownload)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal membuat sertifikat PDF'
    return Response.json({ error: message }, { status: 422 })
  }
}
