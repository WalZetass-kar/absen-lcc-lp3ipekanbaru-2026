'use client'

import { Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { StudentCertificate } from '@/lib/types'

interface CertificateCardProps {
  certificate: StudentCertificate | null
  mahasiswaNama: string
  onDownload?: () => void
}

export function CertificateCard({ certificate, mahasiswaNama, onDownload }: CertificateCardProps) {
  if (!certificate || certificate.attendance_percentage < 80) {
    return (
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Sertifikat Kehadiran
          </CardTitle>
          <CardDescription>Belum memenuhi syarat (minimum 80% kehadiran)</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Sertifikat Kehadiran
        </CardTitle>
        <CardDescription>Selesaikan dengan {certificate.attendance_percentage}% kehadiran</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nama</span>
            <span className="font-medium">{mahasiswaNama}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Kehadiran</span>
            <span className="font-medium">{certificate.total_hadir}/{certificate.total_pertemuan} pertemuan</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Persentase</span>
            <span className="font-bold text-emerald-600">{certificate.attendance_percentage}%</span>
          </div>
        </div>
        <Button onClick={onDownload} className="w-full gap-2">
          <Download className="w-4 h-4" />
          Unduh Sertifikat
        </Button>
      </CardContent>
    </Card>
  )
}
