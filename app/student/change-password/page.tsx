'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, KeyRound, CheckCircle, AlertCircle } from 'lucide-react'
import { changeStudentPassword } from '@/lib/student-actions'

export default function ChangePasswordPage() {
  const [isPending, startTransition] = useTransition()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Semua field wajib diisi' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password baru minimal 6 karakter' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok' })
      return
    }

    startTransition(async () => {
      const result = await changeStudentPassword(oldPassword, newPassword)
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Password berhasil diubah!' })
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setMessage({ type: 'error', text: result.error || 'Gagal mengubah password' })
      }
    })
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Ganti Password</h1>
        <p className="text-muted-foreground mt-1">Ubah password akun Anda untuk keamanan</p>
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
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            Ubah Password
          </CardTitle>
          <CardDescription>Masukkan password lama dan password baru Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="oldPassword">Password Lama</Label>
            <div className="relative">
              <Input
                id="oldPassword"
                type={showOld ? 'text' : 'password'}
                placeholder="Masukkan password lama"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Password Baru</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                placeholder="Masukkan password baru (min 6 karakter)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-destructive">Password tidak cocok</p>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isPending || !oldPassword || !newPassword || !confirmPassword}
            className="w-full"
          >
            {isPending ? 'Menyimpan...' : 'Simpan Password Baru'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
