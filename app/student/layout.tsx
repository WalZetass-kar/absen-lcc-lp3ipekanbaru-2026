'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard, QrCode, History, Award, User, LogOut, Menu, X, BookOpen, FileCheck2,
} from 'lucide-react'
import { studentLogout } from '@/lib/student-actions'

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

export default function StudentDashboardLayout({
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
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border">
          <Link href="/student/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-chart-2 text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-foreground">LCC</span>
          </Link>
          <p className="text-xs text-muted-foreground mt-1">Mahasiswa Portal</p>
        </div>

        {/* Sidebar Menu */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left h-auto py-3 px-4 rounded-lg hover:bg-muted"
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isLoggingOut ? 'Keluar...' : 'Keluar'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card flex items-center px-6 gap-4">
          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex-1" />
          <div className="text-sm text-muted-foreground">
            Portal Mahasiswa LCC
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
