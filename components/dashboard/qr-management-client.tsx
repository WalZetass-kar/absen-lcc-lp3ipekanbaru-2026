'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'
import { approvePermission, deactivateQRCode, generateQRCode } from '@/lib/auth-actions'
import { Loader2, QrCode, Check, X, AlertCircle } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'

interface QRManagementClientProps {
  initialPertemuan: any[]
  initialPermissions: any[]
}

export default function QRManagementClient({
  initialPertemuan,
  initialPermissions,
}: QRManagementClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pertemuan, setPertemuan] = useState(initialPertemuan)
  const [permissions, setPermissions] = useState(initialPermissions)
  const [selectedPertemuan, setSelectedPertemuan] = useState<string>('')
  const [qrValue, setQrValue] = useState<string>('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [openQRDialog, setOpenQRDialog] = useState(false)
  const qrRef = useRef<any>(null)

  useEffect(() => {
    setPertemuan(initialPertemuan)
  }, [initialPertemuan])

  useEffect(() => {
    setPermissions(initialPermissions)
  }, [initialPermissions])

  const handleGenerateQR = () => {
    if (!selectedPertemuan || !qrValue.trim()) {
      setMessage({ type: 'error', text: 'Pilih pertemuan dan masukkan data QR' })
      return
    }

    const pertemuanId = selectedPertemuan
    const nextQrValue = qrValue.trim()

    startTransition(async () => {
      try {
        const generatedQR = await generateQRCode(pertemuanId, nextQrValue)

        setPertemuan((prev) => prev.map((item) => {
          if (item.id !== pertemuanId) return item

          const existingQR = Array.isArray(item.qr_codes) ? item.qr_codes : []
          const inactiveQR = existingQR.map((qr: any) => ({ ...qr, is_active: false }))

          return {
            ...item,
            qr_codes: [...inactiveQR, generatedQR],
          }
        }))
        setMessage({ type: 'success', text: 'QR code berhasil dibuat!' })
        setQrValue('')
        setSelectedPertemuan('')
        setOpenQRDialog(false)
        router.refresh()
      } catch (error) {
        setMessage({ type: 'error', text: (error as Error).message || 'Gagal membuat QR code' })
      }
    })
  }

  const handleDeactivateQR = (qrId: string) => {
    if (!confirm('Nonaktifkan QR code ini?')) return

    startTransition(async () => {
      try {
        await deactivateQRCode(qrId)
        setPertemuan((prev) => prev.map((item) => ({
          ...item,
          qr_codes: Array.isArray(item.qr_codes)
            ? item.qr_codes.map((qr: any) => (
              qr.id === qrId
                ? { ...qr, is_active: false }
                : qr
            ))
            : [],
        })))
        setMessage({ type: 'success', text: 'QR code berhasil dinonaktifkan' })
        router.refresh()
      } catch (error) {
        setMessage({ type: 'error', text: 'Gagal menonaktifkan QR code' })
      }
    })
  }

  const handleApprovePermission = (permissionId: string, approve: boolean) => {
    startTransition(async () => {
      try {
        await approvePermission(permissionId, approve)
        setMessage({
          type: 'success',
          text: approve ? 'Permintaan disetujui' : 'Permintaan ditolak',
        })
        setPermissions((prev) => prev.filter((permission) => permission.id !== permissionId))
        router.refresh()
      } catch (error) {
        setMessage({ type: 'error', text: 'Gagal memproses permintaan' })
      }
    })
  }

  const downloadQR = () => {
    if (qrRef.current) {
      const image = qrRef.current.querySelector('canvas').toDataURL('image/png')
      const link = document.createElement('a')
      link.href = image
      link.download = `qr-code-${selectedPertemuan}.png`
      link.click()
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
          <AlertCircle className="h-4 w-4" />
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
            <CardHeader>
              <CardTitle>Buat QR Code Baru</CardTitle>
              <CardDescription>Generate QR code untuk pertemuan tertentu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pertemuan-select">Pilih Pertemuan</Label>
                <select
                  id="pertemuan-select"
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                  value={selectedPertemuan}
                  onChange={e => setSelectedPertemuan(e.target.value)}
                >
                  <option value="">-- Pilih Pertemuan --</option>
                  {pertemuan.map(p => (
                    <option key={p.id} value={p.id}>
                      Pertemuan {p.nomor_pertemuan} - {p.tanggal}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qr-value">Data QR Code</Label>
                <Input
                  id="qr-value"
                  placeholder="Masukkan data yang akan di-encode ke QR"
                  value={qrValue}
                  onChange={e => setQrValue(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateQR}
                  disabled={isPending || !selectedPertemuan || !qrValue}
                  className="flex-1"
                >
                  {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Generate QR
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setOpenQRDialog(true)}
                  disabled={!selectedPertemuan || !qrValue}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {pertemuan.map(p => {
              const activeQR = p.qr_codes?.filter((q: any) => q.is_active) || []
              return (
                <Card key={p.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Pertemuan {p.nomor_pertemuan}</CardTitle>
                        <CardDescription>{p.tanggal}</CardDescription>
                      </div>
                      <Badge variant={activeQR.length > 0 ? 'default' : 'secondary'}>
                        {activeQR.length} QR Aktif
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {activeQR.length > 0 ? (
                      <div className="space-y-2">
                        {activeQR.map((qr: any) => (
                          <div key={qr.id} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm text-muted-foreground truncate">{qr.qr_code_data}</span>
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
                      <p className="text-sm text-muted-foreground">Tidak ada QR code aktif</p>
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
              {permissions.map(perm => (
                <Card key={perm.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{perm.mahasiswa?.nama}</CardTitle>
                        <CardDescription>
                          Pertemuan {perm.pertemuan?.nomor_pertemuan} - {perm.pertemuan?.tanggal}
                        </CardDescription>
                      </div>
                      <Badge>{perm.mahasiswa?.kelas}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Alasan:</p>
                      <p className="text-sm text-muted-foreground">{perm.alasan}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprovePermission(perm.id, true)}
                        disabled={isPending}
                        className="flex-1 gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Setujui
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleApprovePermission(perm.id, false)}
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
                <p className="text-center text-muted-foreground">Tidak ada permintaan izin yang menunggu</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={openQRDialog} onOpenChange={setOpenQRDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Preview QR Code</DialogTitle>
            <DialogDescription>QR code yang akan dibuat</DialogDescription>
          </DialogHeader>
          {selectedPertemuan && qrValue && (
            <div className="flex flex-col items-center gap-4">
              <div ref={qrRef} className="p-4 bg-white rounded">
                <QRCodeCanvas
                  value={qrValue}
                  size={256}
                  level="H"
                  includeMargin
                />
              </div>
              <Button onClick={downloadQR} className="w-full">
                Download QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
