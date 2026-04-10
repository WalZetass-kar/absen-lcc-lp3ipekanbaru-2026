'use client'

import { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Camera } from 'lucide-react'

interface QRScannerProps {
  onScanned: (data: string) => void
  isScanning: boolean
}

export function QRScanner({ onScanned, isScanning }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [permission, setPermission] = useState<boolean | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    let stream: MediaStream | null = null

    const startCamera = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        }
        stream = await navigator.mediaDevices.getUserMedia(constraints)
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setPermission(true)
        }
      } catch (err) {
        setError('Tidak dapat mengakses kamera. Izinkan akses kamera di browser settings.')
        setPermission(false)
      }
    }

    if (!permission) startCamera()

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop())
    }
  }, [permission])

  useEffect(() => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const video = videoRef.current
    const scanInterval = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        try {
          // This would require jsQR library in production
          // For now, we'll use a placeholder that expects QR data to be scanned
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          // Simulated QR detection - in production use jsQR library
          // jsQR(imageData.data, imageData.width, imageData.height)
        } catch (err) {
          // Scanning in progress
        }
      }
    }, 100)

    return () => clearInterval(scanInterval)
  }, [isScanning])

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {permission ? (
        <div className="space-y-4">
          <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* QR scanner frame */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-primary rounded-lg opacity-50" />
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
          <Button onClick={() => setPermission(null)}>Coba Lagi</Button>
        </div>
      )}
    </div>
  )
}
