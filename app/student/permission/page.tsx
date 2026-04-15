'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { SkeletonShimmer } from '@/components/ui/skeleton'
import { getAllPertemuan, getStudentPermissions, submitPermissionRequest } from '@/lib/student-actions'
import { CheckCircle, AlertCircle, Loader2, Clock } from 'lucide-react'

interface PertemuanOption {
  id: string
  nomor_pertemuan: number
  tanggal: string
  status: string
}

interface PermissionRecord {
  id: string
  pertemuan_id: string
  alasan: string
  status: 'Menunggu' | 'Disetujui' | 'Ditolak'
  created_at: string
  nomor_pertemuan?: number
  tanggal_pertemuan?: string
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('Gagal membaca file bukti'))
    reader.readAsDataURL(file)
  })
}

export default function PermissionPage() {
  const [pertemuan, setPertemuan] = useState<PertemuanOption[]>([])
  const [permissions, setPermissions] = useState<PermissionRecord[]>([])
  const [selectedPertemuan, setSelectedPertemuan] = useState('')
  const [alasan, setAlasan] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadPermissionData() {
      try {
        const [pertemuanData, permissionsData] = await Promise.all([
          getAllPertemuan(),
          getStudentPermissions(),
        ])

        if (cancelled) {
          return
        }

        setPertemuan(pertemuanData)
        setPermissions(permissionsData as PermissionRecord[])
      } catch (error) {
        console.error('Error loading permission data:', error)
        if (!cancelled) {
          setMessage({ type: 'error', text: 'Gagal memuat data izin. Silakan login ulang.' })
        }
      } finally {
        if (!cancelled) {
          setIsLoadingData(false)
        }
      }
    }

    void loadPermissionData()

    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async () => {
    if (!selectedPertemuan || !alasan.trim()) {
      setMessage({ type: 'error', text: 'Mohon isi semua field yang wajib' })
      return
    }

    setIsSubmitting(true)

    try {
      let buktiFileUrl: string | undefined
      let buktiFilePath: string | undefined

      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Ukuran file bukti maksimal 5MB')
        }

        buktiFileUrl = await readFileAsDataUrl(file)
        buktiFilePath = file.name
      }

      await submitPermissionRequest(selectedPertemuan, alasan.trim(), buktiFileUrl, buktiFilePath)
      setMessage({ type: 'success', text: 'Permintaan izin berhasil dikirim!' })
      setSelectedPertemuan('')
      setAlasan('')
      setFile(null)

      const updatedPermissions = await getStudentPermissions()
      setPermissions(updatedPermissions as PermissionRecord[])
    } catch (error) {
      setMessage({ type: 'error', text: (error as Error).message || 'Gagal mengirim permintaan' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Disetujui':
        return <Badge className="bg-green-600">Disetujui</Badge>
      case 'Ditolak':
        return <Badge variant="destructive">Ditolak</Badge>
      default:
        return <Badge variant="secondary">Menunggu</Badge>
    }
  }

  if (isLoadingData) {
    return (
      <div className="space-y-6">
        <div>
          <SkeletonShimmer className="h-8 w-48" />
          <SkeletonShimmer className="mt-2 h-4 w-72" />
        </div>

        <Card>
          <CardHeader>
            <SkeletonShimmer className="h-6 w-52" />
            <SkeletonShimmer className="h-4 w-80" />
          </CardHeader>
          <CardContent className="space-y-4">
            <SkeletonShimmer className="h-10 w-full rounded-md" />
            <SkeletonShimmer className="h-24 w-full rounded-xl" />
            <SkeletonShimmer className="h-10 w-full rounded-md" />
            <SkeletonShimmer className="h-11 w-full rounded-md" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SkeletonShimmer className="h-6 w-40" />
            <SkeletonShimmer className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-lg border p-4 space-y-2">
                <SkeletonShimmer className="h-4 w-36" />
                <SkeletonShimmer className="h-4 w-24" />
                <SkeletonShimmer className="h-4 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Permintaan Izin</h1>
        <p className="text-muted-foreground">Ajukan permintaan izin jika tidak dapat hadir</p>
      </div>

      {message && (
        <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
          <div className="flex gap-3">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </div>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ajukan Permintaan Baru</CardTitle>
          <CardDescription>Isi form di bawah untuk mengajukan permintaan izin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pertemuan">Pertemuan *</Label>
            <Select value={selectedPertemuan} onValueChange={setSelectedPertemuan}>
              <SelectTrigger id="pertemuan">
                <SelectValue placeholder="Pilih pertemuan" />
              </SelectTrigger>
              <SelectContent>
                {pertemuan.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    Pertemuan {item.nomor_pertemuan} - {item.tanggal}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alasan">Alasan *</Label>
            <Textarea
              id="alasan"
              placeholder="Jelaskan alasan Anda tidak dapat hadir..."
              value={alasan}
              onChange={(event) => setAlasan(event.target.value)}
              className="min-h-24 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bukti">Bukti Pendukung (Opsional)</Label>
            <Input
              id="bukti"
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <p className="text-xs text-muted-foreground">PDF, JPG, atau PNG max 5MB</p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedPertemuan || !alasan.trim()}
            className="w-full"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isSubmitting ? 'Mengirim...' : 'Ajukan Permintaan'}
          </Button>
        </CardContent>
      </Card>

      {permissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Permintaan</CardTitle>
            <CardDescription>Daftar semua permintaan izin Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {permissions.map((permission) => (
                <div key={permission.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        Pertemuan {permission.nomor_pertemuan ?? '-'}
                      </span>
                      {getStatusBadge(permission.status)}
                    </div>
                    {permission.tanggal_pertemuan && (
                      <p className="text-sm text-muted-foreground">{permission.tanggal_pertemuan}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{permission.alasan}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(permission.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div className="text-right">
                    {permission.status === 'Menunggu' && <Clock className="w-4 h-4 text-yellow-600" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
