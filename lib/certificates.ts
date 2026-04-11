import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { CertificateOverview, StudentCertificate } from '@/lib/types'

const FALLBACK_TOTAL_PERTEMUAN = 16

type MahasiswaCertificateRow = {
  id: string
  nama: string
  nim: string | null
  kelas: CertificateOverview['kelas']
  prodi: CertificateOverview['prodi']
}

async function resolveTotalPertemuan(inputTotalPertemuan?: number) {
  if (typeof inputTotalPertemuan === 'number' && inputTotalPertemuan > 0) {
    return inputTotalPertemuan
  }

  const admin = createAdminClient()
  const { count, error } = await admin
    .from('pertemuan')
    .select('*', { count: 'exact', head: true })

  if (error) {
    throw error
  }

  return count && count > 0 ? count : FALLBACK_TOTAL_PERTEMUAN
}

function buildCertificateOverview(
  mahasiswa: MahasiswaCertificateRow,
  hadirCount: number,
  totalPertemuan: number,
  certificate: StudentCertificate | null,
): CertificateOverview {
  const percentage = totalPertemuan > 0
    ? Math.round((hadirCount / totalPertemuan) * 100)
    : 0

  return {
    id: mahasiswa.id,
    nama: mahasiswa.nama,
    nim: mahasiswa.nim,
    kelas: mahasiswa.kelas,
    prodi: mahasiswa.prodi,
    hadirCount,
    totalPertemuan,
    percentage,
    eligible: percentage >= 80,
    certificateGenerated: Boolean(certificate),
    issuedAt: certificate?.issued_at ?? null,
    downloadedAt: certificate?.downloaded_at ?? null,
  }
}

export async function listCertificateOverviews(inputTotalPertemuan?: number) {
  const admin = createAdminClient()
  const totalPertemuan = await resolveTotalPertemuan(inputTotalPertemuan)

  const [
    { data: mahasiswa, error: mahasiswaError },
    { data: absensi, error: absensiError },
    { data: certificates, error: certificatesError },
  ] = await Promise.all([
    admin
      .from('mahasiswa')
      .select('id, nama, nim, kelas, prodi')
      .order('nama', { ascending: true }),
    admin
      .from('absensi')
      .select('mahasiswa_id, status'),
    admin
      .from('student_certificates')
      .select('*'),
  ])

  if (mahasiswaError) throw mahasiswaError
  if (absensiError) throw absensiError
  if (certificatesError) throw certificatesError

  const hadirByMahasiswa = new Map<string, number>()
  const certificateByMahasiswa = new Map<string, StudentCertificate>()

  ;(absensi ?? []).forEach((item) => {
    if (item.status !== 'Hadir') return
    hadirByMahasiswa.set(item.mahasiswa_id, (hadirByMahasiswa.get(item.mahasiswa_id) ?? 0) + 1)
  })

  ;(certificates ?? []).forEach((certificate) => {
    certificateByMahasiswa.set(certificate.mahasiswa_id, certificate as StudentCertificate)
  })

  return (mahasiswa ?? []).map((item) => buildCertificateOverview(
    item as MahasiswaCertificateRow,
    hadirByMahasiswa.get(item.id) ?? 0,
    totalPertemuan,
    certificateByMahasiswa.get(item.id) ?? null,
  ))
}

export async function getCertificateOverview(mahasiswaId: string, inputTotalPertemuan?: number) {
  const admin = createAdminClient()
  const totalPertemuan = await resolveTotalPertemuan(inputTotalPertemuan)

  const [
    { data: mahasiswa, error: mahasiswaError },
    { data: absensi, error: absensiError },
    { data: certificate, error: certificateError },
  ] = await Promise.all([
    admin
      .from('mahasiswa')
      .select('id, nama, nim, kelas, prodi')
      .eq('id', mahasiswaId)
      .maybeSingle(),
    admin
      .from('absensi')
      .select('status')
      .eq('mahasiswa_id', mahasiswaId),
    admin
      .from('student_certificates')
      .select('*')
      .eq('mahasiswa_id', mahasiswaId)
      .maybeSingle(),
  ])

  if (mahasiswaError) throw mahasiswaError
  if (absensiError) throw absensiError
  if (certificateError) throw certificateError
  if (!mahasiswa) throw new Error('Data mahasiswa tidak ditemukan')

  const hadirCount = (absensi ?? []).filter((item) => item.status === 'Hadir').length

  return buildCertificateOverview(
    mahasiswa as MahasiswaCertificateRow,
    hadirCount,
    totalPertemuan,
    (certificate as StudentCertificate | null) ?? null,
  )
}

export async function ensureCertificateRecord(mahasiswaId: string, inputTotalPertemuan?: number) {
  const admin = createAdminClient()
  const overview = await getCertificateOverview(mahasiswaId, inputTotalPertemuan)

  if (!overview.eligible) {
    throw new Error('Mahasiswa belum memenuhi syarat minimal 80% kehadiran')
  }

  const now = new Date().toISOString()
  const payload = {
    attendance_percentage: overview.percentage,
    total_hadir: overview.hadirCount,
    total_pertemuan: overview.totalPertemuan,
    updated_at: now,
  }

  const { data: existingCertificate, error: existingError } = await admin
    .from('student_certificates')
    .select('id')
    .eq('mahasiswa_id', mahasiswaId)
    .maybeSingle()

  if (existingError) {
    throw existingError
  }

  if (existingCertificate) {
    const { error: updateError } = await admin
      .from('student_certificates')
      .update(payload)
      .eq('mahasiswa_id', mahasiswaId)

    if (updateError) {
      throw updateError
    }
  } else {
    const { error: insertError } = await admin
      .from('student_certificates')
      .insert({
        mahasiswa_id: mahasiswaId,
        ...payload,
        issued_at: now,
      })

    if (insertError) {
      throw insertError
    }
  }

  const { data: certificate, error: certificateError } = await admin
    .from('student_certificates')
    .select('*')
    .eq('mahasiswa_id', mahasiswaId)
    .single()

  if (certificateError || !certificate) {
    throw certificateError ?? new Error('Gagal menyiapkan data sertifikat')
  }

  return {
    certificate: certificate as StudentCertificate,
    overview: {
      ...overview,
      certificateGenerated: true,
      issuedAt: certificate.issued_at ?? overview.issuedAt ?? null,
      downloadedAt: certificate.downloaded_at ?? overview.downloadedAt ?? null,
    } satisfies CertificateOverview,
  }
}

export async function markCertificateDownloaded(mahasiswaId: string) {
  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { error } = await admin
    .from('student_certificates')
    .update({
      downloaded_at: now,
      updated_at: now,
    })
    .eq('mahasiswa_id', mahasiswaId)

  if (error) {
    throw error
  }

  return now
}
