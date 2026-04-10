'use client'

import { useState } from 'react'
import Sidebar from './sidebar'
import Topbar from './topbar'
import type { Profile } from '@/lib/types'

export default function DashboardShell({
  profile,
  children,
}: {
  profile: Profile | null
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        profile={profile}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar
          profile={profile}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
