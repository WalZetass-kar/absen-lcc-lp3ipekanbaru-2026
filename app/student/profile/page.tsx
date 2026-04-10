import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getStudentSession } from '@/lib/student-actions'
import { User } from 'lucide-react'

export default async function ProfilePage() {
  const session = await getStudentSession()
  if (!session) {
    redirect('/auth/mahasiswa/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profil</h1>
        <p className="text-muted-foreground mt-1">Kelola data pribadi Anda</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Data Pribadi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nama Lengkap</label>
              <p className="text-lg font-semibold mt-1">{session.nama}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">NIM</label>
              <p className="text-lg font-semibold mt-1">{session.nim}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Program Studi</label>
              <p className="text-lg font-semibold mt-1">{session.prodi || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Kelas LCC</label>
              <p className="text-lg font-semibold mt-1">{session.kelas}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
