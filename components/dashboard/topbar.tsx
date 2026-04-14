'use client'

import { Menu } from 'lucide-react'
import type { Profile } from '@/lib/types'

interface TopbarProps {
  profile: Profile | null
  onMenuClick?: () => void
}

export default function Topbar({ profile, onMenuClick }: TopbarProps) {
  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0 lg:rounded-tl-2xl">
      {/* Hamburger - mobile only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        aria-label="Buka menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Title or empty space */}
      <div className="flex-1" />

      {/* Right side - empty (profile removed) */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground hidden sm:block">
          {profile?.nama ?? 'Admin'}
        </span>
      </div>
    </header>
  )
}
