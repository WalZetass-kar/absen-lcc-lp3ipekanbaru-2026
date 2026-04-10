'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'

export function LowAttendanceWarning({
  students,
}: {
  students: Array<{ id: string; nama: string; prodi: string; kelas: string; totalKehadiran: number; totalPertemuan: number; persentaseKehadiran: number }>
}) {
  if (students.length === 0) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="pt-6">
          <p className="text-sm text-emerald-700">✓ Semua mahasiswa memiliki kehadiran yang baik (&ge;70%)</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-900">
          <AlertTriangle className="w-5 h-5" />
          Peringatan Kehadiran Rendah
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber-200">
                <th className="text-left py-2 px-3 font-semibold text-amber-900">Nama</th>
                <th className="text-left py-2 px-3 font-semibold text-amber-900">Program Studi</th>
                <th className="text-left py-2 px-3 font-semibold text-amber-900">Kelas</th>
                <th className="text-center py-2 px-3 font-semibold text-amber-900">Kehadiran</th>
                <th className="text-center py-2 px-3 font-semibold text-amber-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id} className="border-b border-amber-100 hover:bg-amber-100/50 transition-colors">
                  <td className="py-2 px-3 text-amber-900">{student.nama}</td>
                  <td className="py-2 px-3 text-amber-800">{student.prodi}</td>
                  <td className="py-2 px-3 text-amber-800">{student.kelas}</td>
                  <td className="py-2 px-3 text-center">
                    <span className="font-semibold text-amber-900">
                      {student.totalKehadiran}/{student.totalPertemuan}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <Badge
                      variant={student.persentaseKehadiran < 50 ? 'destructive' : 'secondary'}
                      className={student.persentaseKehadiran < 50 ? 'bg-red-600' : 'bg-amber-600'}
                    >
                      {student.persentaseKehadiran}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
