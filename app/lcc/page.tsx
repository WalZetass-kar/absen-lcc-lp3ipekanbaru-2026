import { getPublicLCCPages } from '@/lib/admin-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BookOpen, Target, Calendar, Bell } from 'lucide-react'

export default async function PublicLCCPage() {
  const pages = await getPublicLCCPages()
  const pageMap = new Map(pages.map((p) => [p.page_type, p]))

  const aboutPage = pageMap.get('tentang')
  const visiMisiPage = pageMap.get('visi_misi')
  const jadwalPage = pageMap.get('jadwal')
  const pengumumanPage = pageMap.get('pengumuman')

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-blue-600 text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold">Learning Coffee Community (LCC)</h1>
          <p className="text-blue-100 mt-2">Platform Pembelajaran Interaktif</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* Tentang */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Tentang LCC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {aboutPage?.konten || 'Learning Coffee Community adalah platform pembelajaran yang dirancang untuk mendukung pendidikan mahasiswa dengan metode interaktif dan kolaboratif.'}
            </p>
          </CardContent>
        </Card>

        {/* Visi & Misi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Visi & Misi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {visiMisiPage?.konten || 'Membangun komunitas pembelajaran yang inklusif dan mendorong pengembangan keterampilan mahasiswa secara berkelanjutan contoh aja kok.'}
            </p>
          </CardContent>
        </Card>

        {/* Jadwal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Jadwal Pembelajaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {jadwalPage?.konten || 'Jadwal pembelajaran diadakan setiap hari yang telah ditentukan dengan fleksibilitas waktu.'}
            </p>
          </CardContent>
        </Card>

        {/* Pengumuman */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Pengumuman Penting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {pengumumanPage?.konten || 'Pantau halaman ini untuk update terbaru mengenai kegiatan pembelajaran.'}
            </p>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="flex gap-4 justify-center py-8">
          <Link href="/auth/admin/login">
            <Button size="lg">Login Admin</Button>
          </Link>
          <Link href="/auth/mahasiswa/login">
            <Button size="lg" variant="outline">
              Login Mahasiswa
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
