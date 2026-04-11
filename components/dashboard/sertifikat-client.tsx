'use client'

import { useMemo, useState, useTransition } from 'react'
import { generateCertificate } from '@/lib/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProgressBar } from '@/components/shared/progress-bar'
import type { CertificateOverview } from '@/lib/types'
import { AlertCircle, CheckCircle2, Download, FileText, Loader2 } from 'lucide-react'

const KELAS_OPTIONS = ['Graphic Design', 'Web Design'] as const

function formatDateLabel(value?: string | null) {
  if (!value) return 'Belum ada'

  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function SertifikatClient({ initialStudents }: { initialStudents: CertificateOverview[] }) {
  const [students, setStudents] = useState(initialStudents)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterKelas, setFilterKelas] = useState('all')
  const [actionError, setActionError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch = student.nama.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesKelas = filterKelas === 'all' || student.kelas === filterKelas
      return matchesSearch && matchesKelas
    })
  }, [students, searchTerm, filterKelas])

  const eligibleCount = students.filter((student) => student.eligible).length
  const generatedCount = students.filter((student) => student.certificateGenerated).length
  const totalPertemuan = students[0]?.totalPertemuan ?? 16

  function openCertificatePdf(studentId: string) {
    window.open(`/api/certificates/${studentId}?download=1`, '_blank', 'noopener,noreferrer')
  }

  function handleGenerateAndDownload(student: CertificateOverview) {
    setActionError(null)
    setBusyId(student.id)
    const popup = window.open('', '_blank', 'noopener,noreferrer')

    startTransition(async () => {
      try {
        await generateCertificate(student.id, student.totalPertemuan)
        const now = new Date().toISOString()

        setStudents((prev) => prev.map((item) => (
          item.id === student.id
            ? {
              ...item,
              certificateGenerated: true,
              issuedAt: item.issuedAt ?? now,
              downloadedAt: now,
            }
            : item
        )))

        const downloadUrl = `/api/certificates/${student.id}?download=1`
        if (popup) {
          popup.location.href = downloadUrl
        } else {
          openCertificatePdf(student.id)
        }
      } catch (error) {
        console.error('Failed to generate certificate:', error)
        popup?.close()
        setActionError(error instanceof Error ? error.message : 'Gagal membuat sertifikat PDF')
      } finally {
        setBusyId(null)
      }
    })
  }

  function handleDownload(student: CertificateOverview) {
    setBusyId(student.id)
    const now = new Date().toISOString()
    setStudents((prev) => prev.map((item) => (
      item.id === student.id
        ? { ...item, downloadedAt: now }
        : item
    )))
    openCertificatePdf(student.id)
    setBusyId(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Manajemen Sertifikat</h1>
        <p className="text-muted-foreground mt-1">Generate dan unduh sertifikat PDF untuk mahasiswa yang memenuhi syarat</p>
      </div>

      {actionError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Total Mahasiswa</p>
            <p className="mt-1 text-2xl font-bold">{students.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Memenuhi Syarat</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{eligibleCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">PDF Siap Diunduh</p>
            <p className="mt-1 text-2xl font-bold text-primary">{generatedCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Basis {totalPertemuan} pertemuan</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Daftar Sertifikat
          </CardTitle>
          <CardDescription>Mahasiswa dengan kehadiran minimum 80% dapat dibuatkan sertifikat PDF</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Cari nama mahasiswa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={filterKelas} onValueChange={setFilterKelas}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Semua Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {KELAS_OPTIONS.map((kelas) => (
                  <SelectItem key={kelas} value={kelas}>{kelas}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredStudents.length === 0 ? (
              <div className="rounded-lg border border-dashed px-6 py-10 text-center text-muted-foreground">
                <AlertCircle className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>Tidak ada mahasiswa yang cocok dengan filter saat ini</p>
              </div>
            ) : (
              filteredStudents.map((student) => {
                const isBusy = isPending && busyId === student.id

                return (
                  <div
                    key={student.id}
                    className="flex flex-col gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/30 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{student.nama}</p>
                        <Badge variant={student.kelas === 'Graphic Design' ? 'default' : 'secondary'}>
                          {student.kelas}
                        </Badge>
                        <Badge variant={student.eligible ? 'outline' : 'secondary'} className={student.eligible ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : ''}>
                          {student.eligible ? 'Eligible' : 'Belum Eligible'}
                        </Badge>
                        {student.certificateGenerated && (
                          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                            Siap PDF
                          </Badge>
                        )}
                      </div>

                      <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                        <p>NIM: <span className="font-medium text-foreground">{student.nim ?? '-'}</span></p>
                        <p>Prodi: <span className="font-medium text-foreground">{student.prodi}</span></p>
                        <p>Dibuat: <span className="font-medium text-foreground">{formatDateLabel(student.issuedAt)}</span></p>
                        <p>Diunduh: <span className="font-medium text-foreground">{formatDateLabel(student.downloadedAt)}</span></p>
                      </div>

                      <div className="max-w-sm space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Kehadiran</span>
                          <span className="font-medium text-foreground">
                            {student.hadirCount}/{student.totalPertemuan} pertemuan
                          </span>
                        </div>
                        <ProgressBar percentage={student.percentage} showLabel={false} size="sm" />
                        <p className="text-xs font-medium text-muted-foreground">{student.percentage}%</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      {student.eligible ? (
                        <>
                          {!student.certificateGenerated && (
                            <Button onClick={() => handleGenerateAndDownload(student)} disabled={isBusy}>
                              {isBusy ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Memproses...
                                </>
                              ) : (
                                <>
                                  <FileText className="h-4 w-4" />
                                  Generate & PDF
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            variant={student.certificateGenerated ? 'default' : 'outline'}
                            onClick={() => handleDownload(student)}
                            disabled={isBusy}
                          >
                            {isBusy ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Memproses...
                              </>
                            ) : (
                              <>
                                {student.certificateGenerated ? <CheckCircle2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                                {student.certificateGenerated ? 'Unduh PDF' : 'Unduh Langsung'}
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <Badge variant="secondary" className="justify-center px-3 py-2">
                          Minimal 80% kehadiran
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
