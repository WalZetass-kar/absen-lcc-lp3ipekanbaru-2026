'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { adminLogout } from '@/lib/auth-actions'
import {
  LayoutDashboard,
  Users,
  User,
  ClipboardCheck,
  ShieldCheck,
  BookOpen,
  X,
  Images,
  FileCheck2,
  History,
  ClipboardList,
  Award,
  LogOut,
  ExternalLink,
} from 'lucide-react'
import type { Profile } from '@/lib/types'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/mahasiswa', label: 'Mahasiswa', icon: Users },
  { href: '/dashboard/absensi', label: 'Absensi', icon: ClipboardCheck },
  { href: '/dashboard/qr-management', label: 'QR & Izin', icon: FileCheck2 },
  { href: '/dashboard/rekap', label: 'Rekap', icon: History },
  { href: '/dashboard/riwayat', label: 'Riwayat', icon: History },
  { href: '/dashboard/catatan', label: 'Catatan', icon: ClipboardList },
  { href: '/dashboard/dokumentasi', label: 'Dokumentasi', icon: Images },
  { href: '/dashboard/sertifikat', label: 'Sertifikat', icon: Award },
  { href: '/dashboard/profil', label: 'Profil', icon: User },
]

const adminOnlyItems = [
  { href: '/dashboard/ctrl-9Rz', label: 'Manajemen Admin', icon: ShieldCheck },
  { href: '/dashboard/log', label: 'Log Aktivitas', icon: History },
]

interface SidebarProps {
  profile: Profile | null
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function Sidebar({ profile, mobileOpen, onMobileClose }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const isSuperAdmin = profile?.role === 'super_admin'
  const allItems = isSuperAdmin ? [...navItems, ...adminOnlyItems] : navItems

  async function handleLogout() {
    setIsLoggingOut(true)
    await adminLogout()
    router.push('/auth/x7Kp2m/gateway')
    router.refresh()
  }

  const sidebarContent = (
    <aside className="w-72 bg-sidebar flex flex-col h-full shrink-0 lg:rounded-r-2xl">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sidebar-primary shrink-0">
            <BookOpen className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-sidebar-accent-foreground leading-tight">LCC Admin</p>
            <p className="text-xs text-sidebar-foreground leading-tight">Sistem Absensi</p>
          </div>
        </div>
        {/* Close button - mobile only */}
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1 rounded-lg text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider px-2 mb-3">Menu</p>
        {allItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      <div className="px-4 py-4 border-t border-sidebar-border space-y-3">
        {/* Public Website Link */}
        <Link
          href="/lcc"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          Halaman Public
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
            {profile?.profile_photo_url ? (
              <img 
                src={profile.profile_photo_url} 
                alt={profile.nama} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-semibold text-sidebar-primary-foreground">
                {profile?.nama?.charAt(0).toUpperCase() ?? 'A'}
              </span>
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{profile?.nama ?? 'Admin'}</p>
            <p className="text-xs text-sidebar-foreground capitalize truncate">
              {profile?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full rounded-xl"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {isLoggingOut ? 'Keluar...' : 'Keluar'}
        </Button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop sidebar - always visible on lg+ */}
      <div className="hidden lg:flex">
        {sidebarContent}
      </div>

      {/* Mobile sidebar - drawer with overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onMobileClose}
          />
          {/* Drawer */}
          <div className="relative flex w-72 h-full rounded-r-2xl overflow-hidden">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
