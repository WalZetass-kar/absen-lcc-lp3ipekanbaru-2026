'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Users, Lock, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function LoginChoicePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo & Brand */}
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-lg">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">LP3I Computer Club</h1>
            <p className="text-sm text-muted-foreground mt-2">Sistem Manajemen Absensi LCC</p>
          </div>
        </div>

        {/* Login Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Login Card */}
          <Card className="shadow-md border-border hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/auth/admin/login')}>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Admin</CardTitle>
              </div>
              <CardDescription>Masuk sebagai Admin</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Mengelola sistem absensi, mahasiswa, dan laporan
              </p>
              <Button className="w-full" variant="default">
                Login Admin
              </Button>
            </CardContent>
          </Card>

          {/* Mahasiswa Login Card */}
          <Card className="shadow-md border-border hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/auth/mahasiswa/login')}>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-chart-2/10">
                  <Users className="w-5 h-5 text-chart-2" />
                </div>
                <CardTitle className="text-lg">Mahasiswa</CardTitle>
              </div>
              <CardDescription>Masuk sebagai Mahasiswa</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Lihat absensi, scan QR, dan akses informasi pembelajaran
              </p>
              <Button className="w-full" variant="outline">
                Login Mahasiswa
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Public Page Button */}
        <div className="mt-8 flex justify-center">
          <Link href="/lcc" target="_blank">
            <Button variant="outline" className="rounded-xl gap-2">
              <ExternalLink className="w-4 h-4" />
              Lihat Halaman Public
            </Button>
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          &copy; {new Date().getFullYear()} WalDevelop-Afk. All rights reserved.
        </p>
      </div>
    </div>
  )
}
