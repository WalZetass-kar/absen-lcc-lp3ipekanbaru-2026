'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Save, BookMarked } from 'lucide-react'
import { saveMeetingNotes } from '@/lib/actions'
import type { MeetingNotes } from '@/lib/types'

interface CatatanClientProps {
  initialData: MeetingNotes[]
  initialPertemuan: number
}

export default function CatatanClient({ initialData, initialPertemuan }: CatatanClientProps) {
  const router = useRouter()
  const [pertemuan, setPertemuan] = useState(initialPertemuan)
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])
  const [judul, setJudul] = useState('')
  const [materi, setMateri] = useState('')
  const [mentorNama, setMentorNama] = useState('')
  const [catatan, setCatatan] = useState('')
  const [isPending, startTransition] = useTransition()

  const currentNote = initialData.find(n => n.pertemuan === pertemuan)

  function handleSave() {
    startTransition(async () => {
      await saveMeetingNotes(pertemuan, tanggal, judul, materi, mentorNama, catatan)
      // Refresh the page
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Pertemuan Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Pilih Pertemuan</CardTitle>
          <CardDescription>Kelola catatan per pertemuan</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={String(pertemuan)} onValueChange={(v) => {
            setPertemuan(parseInt(v))
            router.push(`/dashboard/catatan?pertemuan=${v}`)
          }}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 16 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  Pertemuan {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookMarked className="w-5 h-5" />
            Catatan Pertemuan {pertemuan}
          </CardTitle>
          <CardDescription>Isi catatan pembelajaran dan evaluasi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Tanggal</label>
              <Input
                type="date"
                value={tanggal}
                onChange={e => setTanggal(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Nama Mentor/Pembina</label>
              <Input
                placeholder="Nama lengkap"
                value={mentorNama}
                onChange={e => setMentorNama(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Judul Topik</label>
            <Input
              placeholder="Topik pembelajaran"
              value={judul}
              onChange={e => setJudul(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Materi Pembelajaran</label>
            <textarea
              placeholder="Uraian materi yang diajarkan..."
              value={materi}
              onChange={e => setMateri(e.target.value)}
              className="mt-1 w-full p-3 border rounded-lg min-h-32 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Catatan Evaluasi</label>
            <textarea
              placeholder="Kesimpulan, hambatan, dan rekomendasi..."
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              className="mt-1 w-full p-3 border rounded-lg min-h-32 text-sm"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={isPending || !judul}
            className="w-full gap-2"
          >
            <Save className="w-4 h-4" />
            {isPending ? 'Menyimpan...' : 'Simpan Catatan'}
          </Button>
        </CardContent>
      </Card>

      {/* Current Note Display */}
      {currentNote && (
        <Card>
          <CardHeader>
            <CardTitle>Catatan Tersimpan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Tanggal</p>
                <p className="font-medium">{currentNote.tanggal}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mentor</p>
                <p className="font-medium">{currentNote.mentor_nama || '-'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Judul</p>
              <p className="font-medium text-lg">{currentNote.judul}</p>
            </div>
            {currentNote.materi && (
              <div>
                <p className="text-xs text-muted-foreground">Materi</p>
                <p className="whitespace-pre-wrap text-sm">{currentNote.materi}</p>
              </div>
            )}
            {currentNote.catatan_evaluasi && (
              <div>
                <p className="text-xs text-muted-foreground">Evaluasi</p>
                <p className="whitespace-pre-wrap text-sm">{currentNote.catatan_evaluasi}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Dibuat: {new Date(currentNote.created_at).toLocaleDateString('id-ID')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
