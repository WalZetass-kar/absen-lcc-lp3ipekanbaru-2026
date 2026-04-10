import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getStudentAttendance, getStudentSession } from '@/lib/student-actions'
import { Clock, AlertCircle } from 'lucide-react'

export default async function AttendanceHistoryPage() {
  const session = await getStudentSession()
  if (!session) {
    redirect('/auth/mahasiswa/login')
  }

  const attendance = await getStudentAttendance()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Riwayat Kehadiran</h1>
        <p className="text-muted-foreground mt-1">Lihat semua catatan kehadiran Anda</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Catatan Kehadiran
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attendance.length > 0 ? (
            <div className="space-y-3">
              {attendance.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Pertemuan {record.pertemuan}</p>
                    <p className="text-sm text-muted-foreground">{record.tanggal}</p>
                  </div>
                  <Badge variant={record.status === 'Hadir' ? 'default' : record.status === 'Izin' ? 'secondary' : 'destructive'}>
                    {record.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Belum ada catatan kehadiran</p>
              <p className="text-sm text-muted-foreground mt-1">Riwayat kehadiran Anda akan muncul di sini</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
