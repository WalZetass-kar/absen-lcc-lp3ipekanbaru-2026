import { getMeetingNotes } from '@/lib/student-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Calendar, User, FileText } from 'lucide-react'

export default async function MaterialsPage() {
  const materials = await getMeetingNotes()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Materi Pembelajaran</h1>
        <p className="text-muted-foreground mt-1">Akses catatan dan materi pertemuan LCC</p>
      </div>

      {materials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Belum ada materi tersedia</p>
            <p className="text-sm text-muted-foreground mt-1">Materi akan ditambahkan setelah pertemuan</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {materials.map((material) => (
            <Card key={material.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default">Pertemuan {material.pertemuan}</Badge>
                      <Badge variant="outline" className="gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(material.tanggal).toLocaleDateString('id-ID')}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{material.judul}</CardTitle>
                    {material.mentor_nama && (
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <User className="w-3 h-3" />
                        Mentor: {material.mentor_nama}
                      </CardDescription>
                    )}
                  </div>
                  <BookOpen className="w-8 h-8 text-primary flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {material.materi && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Materi
                    </h4>
                    <div className="p-4 rounded-xl bg-muted/50 border">
                      <p className="text-sm whitespace-pre-wrap">{material.materi}</p>
                    </div>
                  </div>
                )}

                {material.catatan_evaluasi && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Catatan Evaluasi</h4>
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm whitespace-pre-wrap">{material.catatan_evaluasi}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span>Dibuat: {new Date(material.created_at).toLocaleDateString('id-ID')}</span>
                  <span>Diupdate: {new Date(material.updated_at).toLocaleDateString('id-ID')}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
