'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard, QrCode, History, Award, User, LogOut, Menu, X, GraduationCap, FileCheck2,
} from 'lucide-react'
import { studentLogout } from '@/lib/student-actions'
import { ProfileProvider, useProfile } from '@/lib/profile-context'

const menuItems = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    href: '/student/dashboard',
    description: 'Ringkasan kehadiran dan informasi'
  },
  {
    icon: QrCode,
    label: 'Scan QR Absensi',
    href: '/student/scan-qr',
    description: 'Scan QR code untuk presensi'
  },
  {
    icon: FileCheck2,
    label: 'Permintaan Izin',
    href: '/student/permission',
    description: 'Ajukan izin ketidakhadiran'
  },
  {
    icon: History,
    label: 'Riwayat Kehadiran',
    href: '/student/attendance-history',
    description: 'Lihat semua catatan kehadiran'
  },
  {
    icon: Award,
    label: 'Sertifikat',
    href: '/student/certificate',
    description: 'Unduh sertifikat kehadiran'
  },
  {
    icon: User,
    label: 'Profil',
    href: '/student/profile',
    description: 'Kelola data pribadi'
  }
]

function AvatarBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const { profilePhoto, isLoaded } = useProfile()
  const sizeClass = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
  const textClass = size === 'sm' ? 'text-xs' : 'text-sm'

  if (!isLoaded) {
    return <div className={`${sizeClass} rounded-full bg-muted animate-pulse`} />
  }

  if (profilePhoto) {
    return (
      <img
        src={profilePhoto}
        alt="Profil"
        className={`${sizeClass} rounded-full object-cover border-2 border-primary/20`}
      />
    )
  }

  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center`}>
      <User className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} text-primary/60`} />
    </div>
  )
}

function StudentLayoutInner({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const isStandalonePage = pathname === '/student/login' || pathname === '/student/change-password'

  if (isStandalonePage) {
    return <>{children}</>
  }

  async function handleLogout() {
    setIsLoggingOut(true)
    await studentLogout()
    router.push('/auth/mahasiswa/login')
    router.refresh()
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-blue-600 to-blue-700 shadow-xl transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 rounded-r-2xl ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/10">
          <Link href="/student/dashboard" className="flex items-center gap-2.5 font-bold text-lg group">
            <img
              src="/lp3i-logo.png"
              alt="LP3I"
              className="w-9 h-9 rounded-xl object-contain bg-white p-1"
            />
            <span className="text-white tracking-wide">LCC</span>
          </Link>
          <p className="text-xs text-blue-100 mt-1.5">Politeknik LP3I Pekanbaru</p>
        </div>

        {/* Sidebar Menu */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-left h-auto py-3 px-4 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-white/20 text-white hover:bg-white/25 shadow-lg'
                      : 'text-blue-50 hover:bg-white/10'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={`w-5 h-5 mr-3 shrink-0 ${isActive ? 'text-white' : 'text-blue-100'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-white'}`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-blue-100 truncate">
                      {item.description}
                    </p>
                  </div>
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10">
          <Button
            variant="destructive"
            className="w-full rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-lg"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isLoggingOut ? 'Keluar...' : 'Keluar'}
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card flex items-center px-6 gap-4 md:rounded-tl-2xl">
          <button
            className="md:hidden p-1.5 hover:bg-muted rounded-xl transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Portal Mahasiswa LCC
            </span>
            <Link href="/student/profile" className="hover:opacity-80 transition-opacity">
              <AvatarBadge size="sm" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProfileProvider>
      <StudentLayoutInner>
        {children}
      </StudentLayoutInner>
    </ProfileProvider>
  )
}
