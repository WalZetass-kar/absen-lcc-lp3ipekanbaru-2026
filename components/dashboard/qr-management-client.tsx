'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeCanvas } from 'qrcode.react'
import { Check, Download, Loader2, PlusCircle, QrCode, X } from 'lucide-react'

import { createAutoPertemuan } from '@/lib/admin-actions'
import { approvePermission, deactivateQRCode, generateQRCode } from '@/lib/auth-actions'
import type { PendingPermissionWithDetails, PertemuanWithQR } from '@/lib/types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type MessageState = {
  text: string
  type: 'success' | 'error'
}

function formatDateLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function buildDefaultQrValue(pertemuan: PertemuanWithQR) {
  return `LCC-P${pertemuan.nomor_pertemuan}-${Date.now()}`
}

export default function QRManagementClient({
  initialPertemuan,
  initialPermissions,
}: {
  initialPertemuan: PertemuanWithQR[]
  initialPermissions: PendingPermissionWithDetails[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pertemuan, setPertemuan] = useState(initialPertemuan)
  const [permissions, setPermissions] = useState(initialPermissions)
  const [selectedPertemuanId, setSelectedPertemuanId] = useState('')
  const [qrValue, setQrValue] = useState('')
  const [message, setMessage] = useState<MessageState | null>(null)
  const [openQRDialog, setOpenQRDialog] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPertemuan(initialPertemuan)
  }, [initialPertemuan])

  useEffect(() => {
    setPermissions(initialPermissions)
  }, [initialPermissions])

  const selectedPertemuan = pertemuan.find((item) => item.id === selectedPertemuanId) ?? null

  function handleSelectPertemuan(value: string) {
    setSelectedPertemuanId(value)
    const nextPertemuan = pertemuan.find((item) => item.id === value)

    if (nextPertemuan && !qrValue.trim()) {
      setQrValue(buildDefaultQrValue(nextPertemuan))
    }
  }

  function handleCreatePertemuan() {
    setMessage(null)
    startTransition(async () => {
      try {
        await createAutoPertemuan()
        setMessage({ type: 'success', text: 'Pertemuan baru berhasil dibuat. Silakan pilih pertemuan lalu generate QR code.' })
        router.refresh()
      } catch (error) {
        setMessage({
          type: 'error',
          text: error instanceof Error ? error.message : 'Gagal membuat pertemuan baru',
        })
      }
    })
  }

  function handleGenerateQR() {
    if (!selectedPertemuan || !qrValue.trim()) {
      setMessage({ type: 'error', text: 'Pilih pertemuan dan pastikan data QR code terisi.' })
      return
    }

    setMessage(null)
    const nextQrValue = qrValue.trim()

    startTransition(async () => {
      try {
        const generatedQR = await generateQRCode(selectedPertemuan.id, nextQrValue)

        setPertemuan((prev) => prev.map((item) => {
          if (item.id !== selectedPertemuan.id) return item

          return {
            ...item,
            qr_codes: [
              ...item.qr_codes.map((qr) => ({ ...qr, is_active: false })),
              generatedQR,
            ],
          }
        }))
        setMessage({ type: 'success', text: `QR code untuk pertemuan ${selectedPertemuan.nomor_pertemuan} berhasil dibuat.` })
        setQrValue('')
        setSelectedPertemuanId('')
        setOpenQRDialog(false)
        router.refresh()
      } catch (error) {
        setMessage({
          type: 'error',
          text: error instanceof Error ? error.message : 'Gagal membuat QR code',
        })
      }
    })
  }

  function handleDeactivateQR(qrId: string) {
    if (!confirm('Nonaktifkan QR code ini?')) return

    setMessage(null)
    startTransition(async () => {
      try {
        await deactivateQRCode(qrId)
        setPertemuan((prev) => prev.map((item) => ({
          ...item,
          qr_codes: item.qr_codes.map((qr) => (
            qr.id === qrId
              ? { ...qr, is_active: false }
              : qr
          )),
        })))
        setMessage({ type: 'success', text: 'QR code berhasil dinonaktifkan.' })
        router.refresh()
      } catch (error) {
        setMessage({
          type: 'error',
          text: error instanceof Error ? error.message : 'Gagal menonaktifkan QR code',
        })
      }
    })
  }

  function handleApprovePermission(permissionId: string, approve: boolean) {
    setMessage(null)
    startTransition(async () => {
      try {
        await approvePermission(permissionId, approve)
        setPermissions((prev) => prev.filter((permission) => permission.id !== permissionId))
        setMessage({
          type: 'success',
          text: approve ? 'Permintaan izin berhasil disetujui.' : 'Permintaan izin berhasil ditolak.',
        })
        router.refresh()
      } catch (error) {
        setMessage({
          type: 'error',
          text: error instanceof Error ? error.message : 'Gagal memproses permintaan izin',
        })
      }
    })
  }

  function downloadQR() {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas || !selectedPertemuan) return

    const image = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = image
    link.download = `qr-code-pertemuan-${selectedPertemuan.nomor_pertemuan}.png`
    link.click()
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="qr" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="qr">QR Code</TabsTrigger>
          <TabsTrigger value="permissions">Permintaan Izin</TabsTrigger>
        </TabsList>

        <TabsContent value="qr" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle>Buat QR Code Baru</CardTitle>
                <CardDescription>Generate QR code untuk pertemuan tertentu. Jika belum ada pertemuan, buat dulu otomatis dari sini.</CardDescription>
              </div>
              <Button variant="outline" onClick={handleCreatePertemuan} disabled={isPending}>
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                Buat Pertemuan
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {pertemuan.length === 0 ? (
                <div className="rounded-xl border border-dashed px-6 py-10 text-center text-muted-foreground">
                  <QrCode className="mx-auto mb-3 h-10 w-10 opacity-40" />
                  <p className="font-medium text-foreground">Belum ada pertemuan yang bisa dipilih</p>
                  <p className="mt-1 text-sm">Klik tombol &quot;Buat Pertemuan&quot; untuk menambahkan jadwal pertemuan lebih dulu.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="pertemuan-select">Pilih Pertemuan</Label>
                    <Select value={selectedPertemuanId} onValueChange={handleSelectPertemuan}>
                      <SelectTrigger id="pertemuan-select">
                        <SelectValue placeholder="Pilih pertemuan" />
                      </SelectTrigger>
                      <SelectContent>
                        {pertemuan.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            Pertemuan {item.nomor_pertemuan} - {formatDateLabel(item.tanggal)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="qr-value">Data QR Code</Label>
                    <Input
                      id="qr-value"
                      placeholder="Data QR otomatis bisa diubah bila diperlukan"
                      value={qrValue}
                      onChange={(event) => setQrValue(event.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Data QR akan dipakai oleh mahasiswa saat scan. Nilai ini boleh diganti manual bila dibutuhkan.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={handleGenerateQR}
                      disabled={isPending || !selectedPertemuan || !qrValue.trim()}
                      className="flex-1"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                      Generate QR
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setOpenQRDialog(true)}
                      disabled={!selectedPertemuan || !qrValue.trim()}
                    >
                      Preview
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {pertemuan.map((item) => {
              const activeQR = item.qr_codes.filter((qr) => qr.is_active)

              return (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">Pertemuan {item.nomor_pertemuan}</CardTitle>
                        <CardDescription>{formatDateLabel(item.tanggal)}</CardDescription>
                      </div>
                      <Badge variant={activeQR.length > 0 ? 'default' : 'secondary'}>
                        {activeQR.length} QR Aktif
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {activeQR.length > 0 ? (
                      <div className="space-y-2">
                        {activeQR.map((qr) => (
                          <div key={qr.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                            <span className="truncate text-sm text-muted-foreground">{qr.qr_code_data}</span>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeactivateQR(qr.id)}
                              disabled={isPending}
                            >
                              Nonaktifkan
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Tidak ada QR code aktif untuk pertemuan ini.</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          {permissions.length > 0 ? (
            <div className="space-y-3">
              {permissions.map((permission) => (
                <Card key={permission.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">{permission.mahasiswa?.nama ?? 'Mahasiswa'}</CardTitle>
                        <CardDescription>
                          Pertemuan {permission.pertemuan?.nomor_pertemuan ?? '-'} - {permission.pertemuan?.tanggal ? formatDateLabel(permission.pertemuan.tanggal) : 'Tanggal belum tersedia'}
                        </CardDescription>
                      </div>
                      <Badge>{permission.mahasiswa?.kelas ?? '-'}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Alasan:</p>
                      <p className="text-sm text-muted-foreground">{permission.alasan}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprovePermission(permission.id, true)}
                        disabled={isPending}
                        className="flex-1 gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Setujui
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleApprovePermission(permission.id, false)}
                        disabled={isPending}
                        className="flex-1 gap-2"
                      >
                        <X className="w-4 h-4" />
                        Tolak
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Tidak ada permintaan izin yang menunggu.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={openQRDialog} onOpenChange={setOpenQRDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Preview QR Code</DialogTitle>
            <DialogDescription>
              {selectedPertemuan ? `Pertemuan ${selectedPertemuan.nomor_pertemuan}` : 'QR code yang akan dibuat'}
            </DialogDescription>
          </DialogHeader>
          {selectedPertemuan && qrValue.trim() && (
            <div className="flex flex-col items-center gap-4">
              <div ref={qrRef} className="rounded bg-white p-4">
                <QRCodeCanvas
                  value={qrValue}
                  size={256}
                  level="H"
                  includeMargin
                />
              </div>
              <Button onClick={downloadQR} className="w-full">
                <Download className="w-4 h-4" />
                Download QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
