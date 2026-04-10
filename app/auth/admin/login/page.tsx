'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Loader2, Eye, EyeOff } from 'lucide-react'

function getAuthErrorMessage(message?: string, status?: number) {
  if (status === 429 || message?.toLowerCase().includes('rate limit')) {
    return 'Terlalu banyak percobaan login. Tunggu sebentar lalu coba lagi.'
  }

  if (status === 401 || message?.toLowerCase().includes('invalid api key')) {
    return 'Konfigurasi Supabase tidak valid. Periksa file environment aplikasi.'
  }

  return 'Email atau password salah. Silakan coba lagi.'
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [canBootstrap, setCanBootstrap] = useState(false)
  const [checkingBootstrap, setCheckingBootstrap] = useState(true)
  const [bootstrapNama, setBootstrapNama] = useState('Super Admin')
  const [bootstrapEmail, setBootstrapEmail] = useState('')
  const [bootstrapPassword, setBootstrapPassword] = useState('')
  const [bootstrapLoading, setBootstrapLoading] = useState(false)
  const [bootstrapError, setBootstrapError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function checkBootstrapState() {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('can_bootstrap_super_admin')

      if (cancelled) return

      setCanBootstrap(!error && Boolean(data))
      setCheckingBootstrap(false)
    }

    checkBootstrapState()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(getAuthErrorMessage(error.message, error.status))
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleBootstrap(e: React.FormEvent) {
    e.preventDefault()
    setBootstrapLoading(true)
    setBootstrapError(null)

    const supabase = createClient()
    const { error: createError } = await supabase.rpc('bootstrap_super_admin', {
      p_email: bootstrapEmail.trim(),
      p_password: bootstrapPassword,
      p_nama: bootstrapNama.trim(),
    })

    if (createError) {
      setBootstrapError(createError.message || 'Gagal membuat super admin pertama.')
      setBootstrapLoading(false)
      return
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: bootstrapEmail.trim(),
      password: bootstrapPassword,
    })

    if (loginError) {
      setBootstrapError('Akun berhasil dibuat, tetapi login otomatis gagal. Silakan login manual.')
      setCanBootstrap(false)
      setBootstrapLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Brand */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary shadow-lg">
            <BookOpen className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">LCC Admin</h1>
            <p className="text-sm text-muted-foreground mt-1">Sistem Manajemen Absensi</p>
          </div>
        </div>

        <Card className="shadow-sm border-border">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold">Masuk</CardTitle>
            <CardDescription>Masukkan kredensial akun admin Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@lcc.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2.5">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full h-10" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Masuk'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Belum punya akun? <a href="/login" className="text-primary hover:underline">Kembali ke login</a>
        </p>

        {!checkingBootstrap && canBootstrap && (
          <Card className="shadow-sm border-border">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-lg font-semibold">Setup Super Admin Pertama</CardTitle>
              <CardDescription>
                Belum ada akun admin di database. Buat akun super admin awal untuk mulai memakai dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBootstrap} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bootstrap-nama">Nama</Label>
                  <Input
                    id="bootstrap-nama"
                    value={bootstrapNama}
                    onChange={(e) => setBootstrapNama(e.target.value)}
                    required
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bootstrap-email">Email</Label>
                  <Input
                    id="bootstrap-email"
                    type="email"
                    value={bootstrapEmail}
                    onChange={(e) => setBootstrapEmail(e.target.value)}
                    placeholder="superadmin@lcc.com"
                    required
                    autoComplete="email"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bootstrap-password">Password</Label>
                  <Input
                    id="bootstrap-password"
                    type="password"
                    value={bootstrapPassword}
                    onChange={(e) => setBootstrapPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    required
                    autoComplete="new-password"
                    className="h-10"
                  />
                </div>

                {bootstrapError && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2.5">
                    <p className="text-sm text-destructive">{bootstrapError}</p>
                  </div>
                )}

                <Button type="submit" className="w-full h-10" disabled={bootstrapLoading}>
                  {bootstrapLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyiapkan akun...
                    </>
                  ) : (
                    'Buat Super Admin'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
