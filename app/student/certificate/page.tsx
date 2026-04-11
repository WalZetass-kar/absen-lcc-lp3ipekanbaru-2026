import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCertificateOverview } from '@/lib/certificates'
import { getStudentSession } from '@/lib/student-actions'
import { Award, AlertCircle, Download } from 'lucide-react'

export default async function CertificatePage() {
  const session = await getStudentSession()
  if (!session) {
    redirect('/auth/mahasiswa/login')
  }

  const certificateOverview = await getCertificateOverview(session.mahasiswa_id)
  const isEligible = certificateOverview.eligible

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Sertifikat</h1>
        <p className="text-muted-foreground mt-1">Pantau kelayakan sertifikat kehadiran Anda</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Status Sertifikat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={isEligible ? 'default' : 'secondary'}>
              {isEligible ? 'Memenuhi Syarat' : 'Belum Memenuhi Syarat'}
            </Badge>
            <span className="text-sm text-muted-foreground">{certificateOverview.percentage}% kehadiran</span>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Kehadiran</span>
              <span className="font-medium">{certificateOverview.hadirCount}/{certificateOverview.totalPertemuan} pertemuan</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground">Status PDF</span>
              <span className="font-medium">
                {certificateOverview.certificateGenerated ? 'Siap diunduh' : 'Belum digenerate'}
              </span>
            </div>
          </div>

          {isEligible ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Sertifikat kehadiran Anda sudah bisa diunduh dalam format PDF.
              </p>
              <Button asChild className="w-full gap-2">
                <a href={`/api/certificates/${session.mahasiswa_id}?download=1`} target="_blank" rel="noreferrer">
                  <Download className="w-4 h-4" />
                  Unduh Sertifikat PDF
                </a>
              </Button>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Sertifikat belum tersedia</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Minimal kehadiran adalah 80%. Saat ini Anda baru mencapai {certificateOverview.percentage}%.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
