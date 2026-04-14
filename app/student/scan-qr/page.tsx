'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { QRScanner } from '@/components/shared/qr-scanner'
import { scanQRCodeAndAttend } from '@/lib/student-actions'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export default function ScanQRPage() {
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(true)
  const [manualQR, setManualQR] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleQRScanned = async (qrData: string) => {
    setLoading(true)
    try {
      const result = await scanQRCodeAndAttend(qrData)
      setMessage({ type: 'success', text: `Absensi berhasil untuk pertemuan ${result.pertemuanNumber}!` })
      setIsScanning(false)
      setTimeout(() => router.push('/student/dashboard'), 1500)
    } catch (error) {
      setMessage({ type: 'error', text: (error as Error).message || 'Gagal memproses QR code' })
    } finally {
      setLoading(false)
    }
  }

  const handleManualSubmit = async () => {
    if (!manualQR.trim()) return

    setLoading(true)
    try {
      const result = await scanQRCodeAndAttend(manualQR.trim())
      setMessage({ type: 'success', text: `Absensi berhasil untuk pertemuan ${result.pertemuanNumber}!` })
      setIsScanning(false)
      setTimeout(() => router.push('/student/dashboard'), 1500)
    } catch (error) {
      setMessage({ type: 'error', text: (error as Error).message || 'Gagal memproses QR code' })
    } finally {
      setLoading(false)
      setManualQR('')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Scan QR Code</h1>
        <p className="text-muted-foreground">Pindai QR code untuk melakukan absensi</p>
      </div>

      <div className="space-y-4 w-full">
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
            <CardTitle className="text-lg">Kamera QR</CardTitle>
            <CardDescription>Izinkan akses kamera untuk memindai QR code</CardDescription>
          </CardHeader>
          <CardContent>
            <QRScanner onScanned={handleQRScanned} isScanning={isScanning && !loading} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Input Manual</CardTitle>
            <CardDescription>Atau masukkan kode QR secara manual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Masukkan kode QR..."
              value={manualQR}
              onChange={(event) => setManualQR(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleManualSubmit()}
              disabled={loading}
            />
            <Button
              onClick={handleManualSubmit}
              disabled={loading || !manualQR.trim()}
              className="w-full"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? 'Memproses...' : 'Kirim'}
            </Button>
          </CardContent>
        </Card>

        <Button
          variant="outline"
          onClick={() => router.back()}
          className="w-full"
        >
          Kembali
        </Button>
      </div>
    </div>
  )
}
