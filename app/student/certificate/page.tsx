import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getStudentAttendanceStats, getStudentSession } from '@/lib/student-actions'
import { Award, AlertCircle } from 'lucide-react'

export default async function CertificatePage() {
  const session = await getStudentSession()
  if (!session) {
    redirect('/auth/mahasiswa/login')
  }

  const stats = await getStudentAttendanceStats()
  const isEligible = stats.percentage >= 80

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
            <span className="text-sm text-muted-foreground">{stats.percentage}% kehadiran</span>
          </div>

          {isEligible ? (
            <p className="text-sm text-muted-foreground">
              Anda sudah memenuhi syarat minimal kehadiran. Sertifikat dapat diproses oleh admin saat program selesai.
            </p>
          ) : (
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Sertifikat belum tersedia</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Minimal kehadiran adalah 80%. Saat ini Anda baru mencapai {stats.percentage}%.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
