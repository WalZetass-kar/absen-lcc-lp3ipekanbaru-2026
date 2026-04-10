'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ClipboardList, Search } from 'lucide-react'

interface ActivityLog {
  id: string
  admin_id: string | null
  admin_nama: string
  action: string
  entity: string
  detail: string | null
  created_at: string
}

const ACTION_STYLE: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  UPDATE: 'bg-blue-100 text-blue-700 border-blue-200',
  DELETE: 'bg-red-100 text-red-600 border-red-200',
  LOGIN: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  SAVE: 'bg-amber-100 text-amber-700 border-amber-200',
}

export default function LogClient({ initialData }: { initialData: ActivityLog[] }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return initialData
    const q = search.toLowerCase()
    return initialData.filter(l =>
      l.admin_nama.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.entity.toLowerCase().includes(q) ||
      (l.detail ?? '').toLowerCase().includes(q)
    )
  }, [initialData, search])

  function formatTime(ts: string) {
    return new Date(ts).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Log Aktivitas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Catatan semua aktivitas admin dalam sistem</p>
      </div>

      <Card>
        <CardContent className="p-4 pb-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari aktivitas, admin, atau entitas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </CardContent>

        {filtered.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ClipboardList className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Belum ada aktivitas tercatat</p>
          </CardContent>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-border bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Waktu</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Admin</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Aksi</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Entitas</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(log => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatTime(log.created_at)}</td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{log.admin_nama}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ACTION_STYLE[log.action] ?? 'bg-muted text-muted-foreground'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{log.entity}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{log.detail ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-border bg-muted/10">
              <span className="text-xs text-muted-foreground">{filtered.length} entri ditampilkan</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
