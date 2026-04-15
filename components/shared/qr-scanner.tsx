'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Loader2 } from 'lucide-react'

interface QRScannerProps {
  onScanned: (data: string) => void
  isScanning: boolean
}

function getCameraErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

  if (message.includes('notallowederror') || message.includes('permission')) {
    return 'Akses kamera ditolak. Izinkan akses kamera di browser Anda lalu coba lagi.'
  }

  if (message.includes('notfounderror') || message.includes('no cameras')) {
    return 'Kamera tidak ditemukan pada perangkat ini.'
  }

  return 'Tidak dapat mengakses kamera. Coba lagi beberapa saat.'
}

export function QRScanner({ onScanned, isScanning }: QRScannerProps) {
  const scannerElementId = useId().replace(/:/g, '-')
  const html5QrCodeRef = useRef<{
    clear: () => Promise<void> | void
    isScanning?: boolean
    stop: () => Promise<void> | void
  } | null>(null)
  const onScannedRef = useRef(onScanned)
  const [permission, setPermission] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const [booting, setBooting] = useState(false)

  useEffect(() => {
    onScannedRef.current = onScanned
  }, [onScanned])

  useEffect(() => {
    let cancelled = false

    async function cleanupScanner() {
      const scanner = html5QrCodeRef.current
      html5QrCodeRef.current = null

      if (!scanner) {
        return
      }

      try {
        if (scanner.isScanning) {
          await Promise.resolve(scanner.stop())
        }
      } catch {
        // Ignore cleanup failures from the QR library.
      }

      try {
        await Promise.resolve(scanner.clear())
      } catch {
        // Ignore cleanup failures from the QR library.
      }
    }

    async function startScanner() {
      if (!isScanning) {
        await cleanupScanner()
        setBooting(false)
        return
      }

      setBooting(true)
      setError('')
      setPermission(null)

      try {
        const { Html5Qrcode } = await import('html5-qrcode')

        if (cancelled) {
          return
        }

        await cleanupScanner()

        const scanner = new Html5Qrcode(scannerElementId, {
          verbose: false,
        })

        html5QrCodeRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          {
            aspectRatio: 1,
            fps: 10,
            qrbox: { height: 240, width: 240 },
          },
          (decodedText) => {
            if (!cancelled) {
              onScannedRef.current(decodedText)
            }
          },
          () => {
            // Silent while scanning.
          },
        )

        if (!cancelled) {
          setPermission(true)
        }
      } catch (scannerError) {
        console.error('QR scanner error:', scannerError)

        if (!cancelled) {
          setPermission(false)
          setError(getCameraErrorMessage(scannerError))
        }
      } finally {
        if (!cancelled) {
          setBooting(false)
        }
      }
    }

    void startScanner()

    return () => {
      cancelled = true
      void cleanupScanner()
    }
  }, [isScanning, scannerElementId])

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {booting && (
        <div className="flex items-center justify-center gap-2 rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Menyiapkan kamera...
        </div>
      )}

      {permission !== false ? (
        <div className="space-y-4">
          <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary bg-black">
            <div
              id={scannerElementId}
              className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
            />

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-64 w-64 rounded-lg border-2 border-primary/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Arahkan kamera ke QR code untuk melakukan absensi
          </p>
        </div>
      ) : (
        <div className="text-center space-y-4 py-8">
          <div className="flex justify-center">
            <Camera className="w-12 h-12 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Kamera tidak dapat diakses</p>
          <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
        </div>
      )}
    </div>
  )
}
