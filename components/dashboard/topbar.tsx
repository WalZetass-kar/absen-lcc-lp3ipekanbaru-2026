'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, ChevronDown, User, Menu } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

interface TopbarProps {
  profile: Profile | null
  onMenuClick?: () => void
}

export default function Topbar({ profile, onMenuClick }: TopbarProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/admin/login')
    router.refresh()
  }

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0">
      {/* Hamburger - mobile only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        aria-label="Buka menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Empty space on desktop */}
      <div className="hidden lg:block" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="flex items-center gap-2 h-9">
            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
              <span className="text-xs font-semibold text-accent-foreground">
                {profile?.nama?.charAt(0).toUpperCase() ?? 'A'}
              </span>
            </div>
            <span className="text-sm font-medium max-w-28 truncate hidden sm:block">{profile?.nama ?? 'Admin'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-0.5">
              <p className="text-sm font-medium">{profile?.nama}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <User className="w-4 h-4" />
            <span className="capitalize">{profile?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
            <LogOut className="w-4 h-4" />
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
