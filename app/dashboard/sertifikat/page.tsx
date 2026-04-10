'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FileText, Download, CheckCircle2, AlertCircle } from 'lucide-react'
import { ProgressBar } from '@/components/shared/progress-bar'
import { generateCertificate, calculateAttendancePercentage } from '@/lib/actions'
import type { Mahasiswa } from '@/lib/types'

interface StudentWithStats extends Mahasiswa {
  hadirCount?: number
  percentage?: number
  certificateGenerated?: boolean
}

export default function SertifikatPage() {
  const [students, setStudents] = useState<StudentWithStats[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedIds, setGeneratedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    // In a real app, fetch students here
    // For now, this is a placeholder
  }, [])

  const handleGenerateCertificate = async (studentId: string) => {
    setLoading(true)
    try {
      await generateCertificate(studentId)
      setGeneratedIds(prev => new Set([...prev, studentId]))
    } catch (error) {
      console.error('Failed to generate certificate:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Manajemen Sertifikat</h1>
        <p className="text-muted-foreground mt-1">Generate dan kelola sertifikat kehadiran mahasiswa</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Daftar Sertifikat
          </CardTitle>
          <CardDescription>Hasilkan sertifikat untuk mahasiswa dengan kehadiran minimum 80%</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Cari nama mahasiswa..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline">Filter Kelas</Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Tidak ada data mahasiswa yang tersedia</p>
              </div>
            ) : (
              students.map(student => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{student.nama}</p>
                    <p className="text-sm text-muted-foreground">{student.kelas}</p>
                    {student.percentage !== undefined && (
                      <div className="mt-2 w-32">
                        <ProgressBar percentage={student.percentage} showLabel={false} size="sm" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {generatedIds.has(student.id) ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Generated
                      </Badge>
                    ) : (student.percentage ?? 0) >= 80 ? (
                      <Button
                        size="sm"
                        onClick={() => handleGenerateCertificate(student.id)}
                        disabled={loading}
                      >
                        <FileText className="w-4 h-4" />
                        Generate
                      </Button>
                    ) : (
                      <Badge variant="secondary">Belum Eligible</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
