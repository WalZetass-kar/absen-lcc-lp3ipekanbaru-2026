'use client'

import { useState, useRef, useCallback } from 'react'
import { useProfile } from '@/lib/profile-context'
import { Camera, Upload, X, Check, Trash2, AlertCircle, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png']
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB

interface ProfilePhotoUploadProps {
  userName?: string
}

export default function ProfilePhotoUpload({ userName = 'User' }: ProfilePhotoUploadProps) {
  const { profilePhoto, setProfilePhoto, removeProfilePhoto } = useProfile()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Hanya file JPG dan PNG yang diperbolehkan'
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Ukuran file maksimal 2MB. File Anda: ${(file.size / 1024 / 1024).toFixed(1)}MB`
    }
    return null
  }, [])

  const handleFileSelect = useCallback((file: File) => {
    setError(null)
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.onerror = () => {
      setError('Gagal membaca file. Silakan coba lagi.')
    }
    reader.readAsDataURL(file)
  }, [validateFile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleSave = async () => {
    if (!previewUrl) return
    setIsSaving(true)
    // Simulate a small delay for UX feedback
    await new Promise((r) => setTimeout(r, 500))
    setProfilePhoto(previewUrl)
    setPreviewUrl(null)
    setIsSaving(false)
  }

  const handleCancel = () => {
    setPreviewUrl(null)
    setError(null)
  }

  const handleRemove = () => {
    removeProfilePhoto()
    setPreviewUrl(null)
    setError(null)
  }

  const currentPhoto = previewUrl || profilePhoto

  return (
    <div className="space-y-6">
      {/* Avatar Display + Upload Area */}
      <div className="flex flex-col items-center">
        <div
          className={`relative group cursor-pointer ${isDragging ? 'scale-105' : ''} transition-transform duration-300`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Avatar Circle */}
          <div className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 transition-all duration-500 ${
            isDragging
              ? 'border-teal-400 shadow-xl shadow-teal-500/30'
              : previewUrl
                ? 'border-amber-400/60 shadow-lg shadow-amber-500/20'
                : 'border-white/10 group-hover:border-teal-400/40 group-hover:shadow-lg group-hover:shadow-teal-500/15'
          }`}>
            {currentPhoto ? (
              <img
                src={currentPhoto}
                alt="Foto profil"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-teal-500/20 to-cyan-600/20 flex items-center justify-center">
                <span className="text-3xl sm:text-4xl font-bold text-teal-300/70">{initials}</span>
              </div>
            )}
          </div>

          {/* Camera Overlay */}
          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Camera className="w-8 h-8 text-white" />
          </div>

          {/* Edit Badge */}
          <div className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-teal-500 border-3 border-[#070b14] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Camera className="w-4 h-4 text-white" />
          </div>

          {/* Preview indicator */}
          {previewUrl && (
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center animate-pulse">
              <span className="text-xs font-bold text-black">!</span>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          onChange={handleInputChange}
          className="hidden"
          aria-label="Upload foto profil"
        />

        <p className="mt-4 text-sm text-muted-foreground text-center">
          Klik foto atau drag & drop untuk mengganti
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Format: JPG, PNG • Maks: 2MB
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Preview Actions */}
      {previewUrl && (
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 transition-all duration-300"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Menyimpan...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Simpan Foto
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="text-muted-foreground hover:text-foreground border border-border"
          >
            <X className="w-4 h-4 mr-2" />
            Batal
          </Button>
        </div>
      )}

      {/* Remove Button */}
      {profilePhoto && !previewUrl && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={handleRemove}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Hapus Foto Profil
          </Button>
        </div>
      )}
    </div>
  )
}
