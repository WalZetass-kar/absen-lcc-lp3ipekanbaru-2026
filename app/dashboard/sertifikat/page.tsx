import SertifikatClient from '@/components/dashboard/sertifikat-client'
import { listCertificateOverviews } from '@/lib/certificates'
import { AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SertifikatPage() {
  try {
    const students = await listCertificateOverviews()

    return <SertifikatClient initialStudents={students} />
  } catch (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manajemen Sertifikat</h1>
          <p className="text-muted-foreground mt-1">Generate dan unduh sertifikat kehadiran mahasiswa</p>
        </div>

        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">Halaman sertifikat belum bisa dimuat.</p>
              <p className="mt-1">
                {error instanceof Error ? error.message : 'Terjadi kesalahan saat membaca data sertifikat.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
