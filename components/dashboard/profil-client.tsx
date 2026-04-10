'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Eye, EyeOff, KeyRound, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppToast } from '@/hooks/use-app-toast'
import type { Profile } from '@/lib/types'

export default function ProfilClient({ profile }: { profile: Profile | null }) {
  const { success, error } = useAppToast()
  const [isPending, startTransition] = useTransition()

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

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

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil Saya</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Kelola informasi akun Anda</p>
      </div>

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
