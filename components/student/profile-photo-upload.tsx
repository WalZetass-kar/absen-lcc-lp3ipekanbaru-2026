'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Loader2, X, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/lib/profile-context'

export default function StudentProfilePhotoUpload({ userName }: { userName: string }) {
  const router = useRouter()
  const { profilePhoto, uploadProfilePhoto, removeProfilePhoto, isUploading: isProfileUploading } = useProfile()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isUploading = isProfileUploading

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Format tidak valid. Hanya JPG, PNG, dan WebP yang diperbolehkan.')
      return
    }

    // Validate file size (2MB)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File terlalu besar. Maksimal ukuran file adalah 2MB.')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    setError(null)

    try {
      const result = await uploadProfilePhoto(file)

      if (!result.success) {
        throw new Error(result.error || 'Upload gagal')
      }

      setPreviewUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  function cancelPreview() {
    setPreviewUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleDelete() {
    if (!confirm('Hapus foto profil?')) return

    setError(null)

    try {
      const result = await removeProfilePhoto()

      if (!result.success) {
        throw new Error(result.error || 'Hapus foto gagal')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Photo Preview */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-muted flex items-center justify-center border-4 border-border">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          ) : profilePhoto ? (
            <img src={profilePhoto} alt={userName} className="w-full h-full object-cover" />
          ) : (
            <User className="w-16 h-16 text-muted-foreground" />
          )}
        </div>
        {!previewUrl && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-50"
          >
            <Camera className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Upload Controls */}
      <div className="w-full max-w-sm space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        {previewUrl ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">Preview foto baru</p>
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isUploading ? 'Mengupload...' : 'Simpan Foto'}
              </Button>
              <Button
                variant="outline"
                onClick={cancelPreview}
                disabled={isUploading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full"
            >
              <Camera className="w-4 h-4 mr-2" />
              Pilih Foto
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={isUploading || !profilePhoto}
              className="w-full text-destructive hover:text-destructive"
            >
              {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Hapus Foto
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          JPG, PNG, WebP - Max 2MB
        </p>
      </div>
    </div>
  )
}
