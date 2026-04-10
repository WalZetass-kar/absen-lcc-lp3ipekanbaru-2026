import { getDashboardStats, getActivityStatus, getAttendanceByMeeting, getAttendanceByProdi, getAttendanceTrend, getTopActiveStudents, getLowAttendanceStudents, getTotalPertemuan } from '@/lib/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, ClipboardCheck, UserCheck, UserX, BookOpen, Monitor, TrendingUp, Calendar } from 'lucide-react'
import ActivityStatusComponent from '@/components/dashboard/activity-status'
import { AttendanceStatistics } from '@/components/dashboard/attendance-statistics'
import { TopStudentsLeaderboard } from '@/components/dashboard/top-students-leaderboard'
import { LowAttendanceWarning } from '@/components/dashboard/low-attendance-warning'

export default async function DashboardPage() {
  const [stats, today, todayDate, activityStatus, byMeeting, byProdi, trend, topStudents, lowAttendance, totalPertemuan] = await Promise.all([
    getDashboardStats(),
    Promise.resolve(new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })),
    Promise.resolve(new Date().toISOString().split('T')[0]),
    getActivityStatus(new Date().toISOString().split('T')[0]),
    getAttendanceByMeeting(),
    getAttendanceByProdi(),
    getAttendanceTrend(),
    getTopActiveStudents(),
    getLowAttendanceStudents(),
    getTotalPertemuan(),
  ])

  const hadir_pct = stats.totalAbsensi > 0
    ? Math.round((stats.totalHadir / stats.totalAbsensi) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
      </div>

      {/* Activity Status */}
      <ActivityStatusComponent initialData={activityStatus} tanggal={todayDate} />

      {/* Statistics Grid - Total Pertemuan added */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Mahasiswa"
          value={stats.totalMahasiswa}
          icon={<Users className="w-5 h-5" />}
          color="primary"
        />
        <StatCard
          title="Total Pertemuan"
          value={totalPertemuan}
          icon={<Calendar className="w-5 h-5" />}
          color="warning"
        />
        <StatCard
          title="Kehadiran Hari Ini"
          value={stats.hadirHariIni}
          icon={<UserCheck className="w-5 h-5" />}
          color="success"
        />
        <StatCard
          title="Total Alfa"
          value={stats.totalAlfa}
          icon={<UserX className="w-5 h-5" />}
          color="danger"
        />
        <StatCard
          title="Total Izin"
          value={stats.totalIzin}
          icon={<ClipboardCheck className="w-5 h-5" />}
          color="warning"
        />
      </div>

      {/* Attendance Progress Bar and Rate Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Breakdown per kelas */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Mahasiswa per Kelas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <KelasBar
                label="Graphic Design"
                count={stats.mahasiswaDesain}
                total={stats.totalMahasiswa}
                icon={<BookOpen className="w-4 h-4" />}
                color="bg-primary"
              />
              <KelasBar
                label="Web Design"
                count={stats.mahasiswaWebDesain}
                total={stats.totalMahasiswa}
                icon={<Monitor className="w-4 h-4" />}
                color="bg-chart-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Attendance rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Tingkat Kehadiran</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-4">
            <div className="relative flex items-center justify-center w-28 h-28">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor"
                  className="text-secondary" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none"
                  stroke="currentColor" className="text-primary" strokeWidth="3"
                  strokeDasharray={`${hadir_pct} ${100 - hadir_pct}`}
                  strokeDashoffset="0" strokeLinecap="round" />
              </svg>
              <div className="absolute text-center">
                <p className="text-2xl font-bold text-foreground">{hadir_pct}%</p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                {stats.totalHadir} dari {stats.totalAbsensi} catatan
              </p>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 w-full text-center text-xs">
              <div>
                <p className="font-semibold text-foreground">{stats.totalHadir}</p>
                <p className="text-muted-foreground">Hadir</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">{stats.totalIzin}</p>
                <p className="text-muted-foreground">Izin</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">{stats.totalAlfa}</p>
                <p className="text-muted-foreground">Alfa</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Analitik & Monitoring</h2>
        </div>

        {/* Attendance Statistics Charts */}
        <AttendanceStatistics byMeeting={byMeeting} byProdi={byProdi} trend={trend} />

        {/* Top Students and Low Attendance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <TopStudentsLeaderboard students={topStudents} />
          </div>
          <div className="lg:col-span-2">
            <LowAttendanceWarning students={lowAttendance} />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title, value, icon, color,
}: {
  title: string
  value: number
  icon: React.ReactNode
  color: 'primary' | 'success' | 'danger' | 'warning'
}) {
  const colorMap = {
    primary: 'bg-accent text-accent-foreground',
    success: 'bg-emerald-50 text-emerald-600',
    danger: 'bg-red-50 text-red-500',
    warning: 'bg-amber-50 text-amber-600',
  }
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function KelasBar({
  label, count, total, icon, color,
}: {
  label: string
  count: number
  total: number
  icon: React.ReactNode
  color: string
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="font-medium text-foreground">{label}</span>
        </div>
        <span className="font-semibold">{count} mahasiswa</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
