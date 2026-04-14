'use client'

import { useState, useTransition, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Eye, EyeOff, KeyRound, User, Camera, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppToast } from '@/hooks/use-app-toast'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/types'
import Image from 'next/image'

export default function ProfilClient({ profile }: { profile: Profile | null }) {
  const { success, error } = useAppToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const currentPhotoUrl = profile?.profile_photo_url

  function handleChangePassword() {
    if (!newPw || !confirmPw) {
      error('Form tidak lengkap', 'Isi semua field password.')
      return
    }
    if (newPw.length < 6) {
      error('Password terlalu pendek', 'Minimal 6 karakter.')
      return
    }
    if (newPw !== confirmPw) {
      error('Password tidak cocok', 'Konfirmasi password tidak sesuai.')
      return
    }

    startTransition(async () => {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.updateUser({ password: newPw })
      if (authError) {
        error('Gagal ubah password', authError.message)
        return
      }
      success('Password berhasil diubah', 'Gunakan password baru untuk login berikutnya.')
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
    })
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      error('Format tidak valid', 'Hanya JPG, PNG, dan WebP yang diperbolehkan.')
      return
    }

    // Validate file size (2MB)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      error('File terlalu besar', 'Maksimal ukuran file adalah 2MB.')
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

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/profile-photo', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload gagal')
      }

      success('Foto profil berhasil diubah', 'Foto profil Anda telah diperbarui.')
      setPreviewUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      router.refresh()
    } catch (err) {
      error('Upload gagal', err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setIsUploading(false)
    }
  }

  function cancelPreview() {
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleDeletePhoto() {
    if (!currentPhotoUrl) return

    setIsUploading(true)
    try {
      const response = await fetch('/api/profile-photo', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Hapus foto gagal')
      }

      success('Foto profil dihapus', 'Foto profil Anda telah dihapus.')
      router.refresh()
    } catch (err) {
      error('Hapus foto gagal', err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil Saya</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Kelola informasi akun Anda</p>
      </div>

      {/* Photo Upload Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="w-4 h-4" /> Foto Profil
          </CardTitle>
          <CardDescription>Upload foto profil Anda (JPG, PNG, WebP - Max 2MB)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Photo Preview */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-muted flex items-center justify-center border-4 border-border">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : currentPhotoUrl ? (
                  <img src={currentPhotoUrl} alt="Profile" className="w-full h-full object-cover" />
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
            <div className="flex-1 space-y-3 w-full">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />

              {previewUrl ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Preview foto baru</p>
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
                  {currentPhotoUrl && (
                    <Button
                      variant="outline"
                      onClick={handleDeletePhoto}
                      disabled={isUploading}
                      className="w-full text-destructive hover:text-destructive"
                    >
                      {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Hapus Foto
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" /> Informasi Akun
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Nama</span>
            <span className="text-sm font-medium">{profile?.nama ?? '-'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{profile?.email ?? '-'}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Role</span>
            <Badge variant={profile?.role === 'super_admin' ? 'default' : 'secondary'} className="text-xs">
              {profile?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="w-4 h-4" /> Ganti Password
          </CardTitle>
          <CardDescription>Minimal 6 karakter</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Password Baru</Label>
            <div className="relative">
              <Input
                type={showNew ? 'text' : 'password'}
                placeholder="Masukkan password baru"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Konfirmasi Password</Label>
            <div className="relative">
              <Input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Ulangi password baru"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {newPw && confirmPw && newPw !== confirmPw && (
            <p className="text-xs text-destructive">Password tidak cocok</p>
          )}
          <Button
            onClick={handleChangePassword}
            disabled={isPending || !newPw || !confirmPw}
            className="w-full"
          >
            {isPending ? 'Menyimpan...' : 'Simpan Password Baru'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
