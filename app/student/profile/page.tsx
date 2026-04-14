import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getStudentSession } from '@/lib/student-actions'
import { User, GraduationCap, BookOpen, Building2 } from 'lucide-react'
import StudentProfilePhotoUpload from '@/components/student/profile-photo-upload'

export default async function ProfilePage() {
  const session = await getStudentSession()
  if (!session) {
    redirect('/auth/mahasiswa/login')
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profil</h1>
        <p className="text-muted-foreground mt-1">Kelola data pribadi dan foto profil Anda</p>
      </div>

      {/* Profile Photo Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-primary" />
            Foto Profil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StudentProfilePhotoUpload userName={session.nama} />
        </CardContent>
      </Card>

      {/* Personal Data Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="w-5 h-5 text-primary" />
            Data Pribadi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nama Lengkap</label>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                <User className="w-4 h-4 text-muted-foreground" />
                <p className="font-semibold">{session.nama}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">NIM</label>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                <GraduationCap className="w-4 h-4 text-muted-foreground" />
                <p className="font-semibold font-mono">{session.nim}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Program Studi</label>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <p className="font-semibold">{session.prodi || '-'}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kelas LCC</label>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <p className="font-semibold">{session.kelas}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
