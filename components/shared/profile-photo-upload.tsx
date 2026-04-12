'use client'

import { useState, useRef, useCallback } from 'react'
import { useProfile } from '@/lib/profile-context'
import { Camera, X, Check, Trash2, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png']
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB

interface ProfilePhotoUploadProps {
  userName?: string
}

export default function ProfilePhotoUpload({ userName = 'User' }: ProfilePhotoUploadProps) {
  const { profilePhoto, uploadProfilePhoto, removeProfilePhoto, isUploading } = useProfile()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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

    setSelectedFile(file)
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
    if (!selectedFile) return
    setIsSaving(true)
    setError(null)

    const result = await uploadProfilePhoto(selectedFile)

    if (!result.success) {
      setError(result.error || 'Gagal menyimpan foto')
    } else {
      setPreviewUrl(null)
      setSelectedFile(null)
    }

    setIsSaving(false)
  }

  const handleCancel = () => {
    setPreviewUrl(null)
    setSelectedFile(null)
    setError(null)
  }

  const handleRemove = async () => {
    await removeProfilePhoto()
    setPreviewUrl(null)
    setSelectedFile(null)
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
              ? 'border-blue-400 shadow-xl shadow-blue-500/20'
              : previewUrl
                ? 'border-amber-400/60 shadow-lg shadow-amber-500/10'
                : 'border-slate-200 group-hover:border-blue-300 group-hover:shadow-lg group-hover:shadow-blue-500/10'
          }`}>
            {currentPhoto ? (
              <img
                src={currentPhoto}
                alt="Foto profil"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                <span className="text-3xl sm:text-4xl font-bold text-blue-300">{initials}</span>
              </div>
            )}
          </div>

          {/* Camera Overlay */}
          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Camera className="w-8 h-8 text-white" />
          </div>

          {/* Edit Badge */}
          <div className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-blue-500 border-[3px] border-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
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
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Preview Actions */}
      {previewUrl && (
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving || isUploading}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
            disabled={isSaving}
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
            disabled={isUploading}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 text-sm"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus Foto Profil
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
