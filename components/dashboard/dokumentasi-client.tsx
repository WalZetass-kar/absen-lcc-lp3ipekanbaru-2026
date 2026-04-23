'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Upload, ImageIcon } from 'lucide-react'
import { deleteDocumentation } from '@/lib/actions'
import type { Documentation } from '@/lib/types'

interface DokumentasiClientProps {
  initialData: Documentation[]
}

export default function DokumentasiClient({ initialData }: DokumentasiClientProps) {
  const [docs, setDocs] = useState(initialData)
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])
  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      setError(null)
      setSelectedFile(e.target.files[0])
    }
  }

  function handleAdd() {
    if (!judul || !selectedFile) return
    
    startTransition(async () => {
      try {
        if (selectedFile.size > 5 * 1024 * 1024) {
          throw new Error('Ukuran file maksimal 5MB')
        }

        const formData = new FormData()
        formData.append('tanggal', tanggal)
        formData.append('judul', judul.trim())
        formData.append('deskripsi', deskripsi.trim())
        formData.append('file', selectedFile)

        const response = await fetch('/api/documentation', {
          method: 'POST',
          body: formData,
        })

        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload?.error || 'Gagal mengunggah dokumentasi')
        }

        setJudul('')
        setDeskripsi('')
        setSelectedFile(null)
        setFileInputKey((prev) => prev + 1)
        setError(null)
        setDocs((prevDocs) => [payload.data as Documentation, ...prevDocs])
      } catch (uploadError) {
        setError((uploadError as Error).message || 'Gagal mengunggah dokumentasi')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteDocumentation(id)
        setDocs((prevDocs) => prevDocs.filter((doc) => doc.id !== id))
      } catch (deleteError) {
        setError((deleteError as Error).message || 'Gagal menghapus dokumentasi')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle>Tambah Dokumentasi</CardTitle>
          <CardDescription>Upload foto kegiatan pembelajaran</CardDescription>
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
              <label className="text-sm font-medium">Judul</label>
              <Input
                placeholder="Nama kegiatan"
                value={judul}
                onChange={e => setJudul(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Deskripsi</label>
            <textarea
              placeholder="Deskripsi kegiatan..."
              value={deskripsi}
              onChange={e => setDeskripsi(e.target.value)}
              className="mt-1 w-full p-2 border rounded-lg min-h-20 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Foto</label>
            <div className="flex items-center gap-2">
              <Input
                key={fileInputKey}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="flex-1"
              />
              {selectedFile && <span className="text-sm text-muted-foreground">{selectedFile.name}</span>}
            </div>
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </div>

          <Button
            onClick={handleAdd}
            disabled={isPending || !judul || !selectedFile}
            className="w-full gap-2"
          >
            <Upload className="w-4 h-4" />
            {isPending ? 'Mengunggah...' : 'Unggah Dokumentasi'}
          </Button>
        </CardContent>
      </Card>

      {/* Gallery */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Galeri Dokumentasi</h2>
        {docs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Belum ada dokumentasi</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs.map(doc => (
              <Card key={doc.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="w-full h-40 bg-muted flex items-center justify-center overflow-hidden">
                  <img
                    src={doc.file_url}
                    alt={doc.judul}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as any).style.display = 'none'
                    }}
                  />
                </div>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold line-clamp-2">{doc.judul}</p>
                      <p className="text-xs text-muted-foreground mt-1">{doc.tanggal}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  {doc.deskripsi && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{doc.deskripsi}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
