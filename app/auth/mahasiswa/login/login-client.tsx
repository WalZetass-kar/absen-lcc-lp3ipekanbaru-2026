'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Coffee, Loader2, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react'
import { studentLogin } from '@/lib/student-actions'

export function MahasiswaLoginClient() {
  const router = useRouter()
  const [nim, setNim] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await studentLogin(nim, password)

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      if (result.mustChangePassword) {
        router.push('/student/change-password')
      } else {
        router.push('/student/dashboard')
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-50 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-50 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg hover:shadow-xl transition-shadow">
            <Coffee className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">LCC Mahasiswa</h1>
            <p className="text-sm text-slate-500 mt-1">LP3I Computer Club</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Masuk ke Dashboard</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Akses portal pembelajaran dan kelola absensi Anda
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="nim" className="text-slate-700 font-medium text-sm">
                  NIM
                </Label>
                <Input
                  id="nim"
                  type="text"
                  placeholder="Nomor Induk Mahasiswa"
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  disabled={loading}
                  className="bg-slate-50 border-slate-200 h-11 placeholder:text-slate-400 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-200 transition-colors"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="bg-slate-50 border-slate-200 h-11 placeholder:text-slate-400 pr-10 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-200 transition-colors"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-500 bg-blue-50 rounded-lg p-2.5">
                <span className="font-medium">Catatan:</span> Password default adalah NIM Anda. Demi keamanan, Anda akan diminta mengganti password saat login pertama.
              </p>

              <Button
                type="submit"
                disabled={loading || !nim || !password}
                className="w-full h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all mt-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-slate-500">Fitur Utama</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Scan QR Code</p>
                  <p className="text-xs text-slate-500">Absensi real-time dengan pemindaian QR</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Riwayat Kehadiran</p>
                  <p className="text-xs text-slate-500">Pantau status kehadiran Anda</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Manajemen Izin</p>
                  <p className="text-xs text-slate-500">Ajukan dan kelola permohonan izin</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center space-y-3">
          <p className="text-sm text-slate-600">
            Bukan mahasiswa?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
              Kembali ke halaman login
            </a>
          </p>
          <p className="text-xs text-slate-400">
            © 2026 LP3I Computer Club
          </p>
        </div>
      </div>
    </div>
  )
}
