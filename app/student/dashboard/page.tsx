import { redirect } from 'next/navigation'
import { getStudentSession, getStudentAttendance, getStudentAttendanceStats, getAnnouncements, getAttendanceWarnings } from '@/lib/student-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, Bell, Calendar, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react'

export default async function StudentDashboardPage() {
  const session = await getStudentSession()
  
  if (!session) {
    redirect('/auth/mahasiswa/login')
  }
  
  const [attendance, stats, announcements, warnings] = await Promise.all([
    getStudentAttendance(session.mahasiswa_id),
    getStudentAttendanceStats(session.mahasiswa_id),
    getAnnouncements(5),
    getAttendanceWarnings(session.mahasiswa_id),
  ])
  
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Mahasiswa</h1>
        <p className="text-muted-foreground mt-1">
          {session.nama} • {session.kelas} • {session.nim}
        </p>
        <p className="text-sm text-muted-foreground mt-1">{today}</p>
      </div>

      {warnings.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-500">
              <AlertCircle className="w-5 h-5" />
              Peringatan Kehadiran
            </CardTitle>
          </CardHeader>
          <CardContent>
            {warnings.map((w) => (
              <p key={w.id} className="text-sm text-yellow-800 dark:text-yellow-400">
                Persentase kehadiran Anda: <strong>{w.attendance_percentage}%</strong>
                <Badge className="ml-2" variant={w.warning_level === 'Merah' ? 'destructive' : 'outline'}>
                  {w.warning_level}
                </Badge>
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Hadir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.hadir}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              Izin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{stats.izin}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Alfa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stats.alfa}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Persentase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{stats.percentage}%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress Kehadiran</CardTitle>
          <CardDescription>Target minimal 80% kehadiran untuk mendapatkan sertifikat</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Kehadiran Anda</span>
              <span className={stats.percentage >= 80 ? 'text-green-600' : stats.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}>
                {stats.percentage}%
              </span>
            </div>
            <Progress value={stats.percentage} className="h-3" />
            {stats.percentage >= 80 ? (
              <p className="text-sm text-green-600">Selamat! Anda memenuhi syarat untuk mendapatkan sertifikat.</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Butuh {Math.max(0, Math.ceil((0.8 * 16) - stats.hadir))} kehadiran lagi untuk mencapai 80%
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Riwayat Kehadiran
            </CardTitle>
            <CardDescription>5 pertemuan terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attendance.slice(0, 5).length > 0 ? (
                attendance.slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Pertemuan {a.pertemuan}</p>
                      <p className="text-xs text-muted-foreground">{a.tanggal}</p>
                    </div>
                    <Badge variant={a.status === 'Hadir' ? 'default' : a.status === 'Izin' ? 'secondary' : 'destructive'}>
                      {a.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada data kehadiran</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Pengumuman
            </CardTitle>
            <CardDescription>Pengumuman terbaru</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {announcements.length > 0 ? (
                announcements.map((a) => (
                  <div key={a.id} className="border-l-4 border-primary pl-4 py-2">
                    <h3 className="font-semibold text-sm">{a.judul}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.isi}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Tidak ada pengumuman</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
