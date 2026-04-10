'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { updateActivityStatus } from '@/lib/actions'
import type { ActivityStatus, ActivityStatusType } from '@/lib/types'

interface ActivityStatusProps {
  initialData: ActivityStatus | null
  tanggal: string
}

const STATUS_CONFIG: Record<ActivityStatusType, { color: string; icon: any; label: string }> = {
  'Belum Dimulai': { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Belum Dimulai' },
  'Sedang Berlangsung': { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Sedang Berlangsung' },
  'Selesai': { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Selesai' },
}

export default function ActivityStatusComponent({ initialData, tanggal }: ActivityStatusProps) {
  const [status, setStatus] = useState<ActivityStatusType>(initialData?.status || 'Belum Dimulai')
  const [absensiDibuka, setAbsensiDibuka] = useState(initialData?.absensi_dibuka || false)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      await updateActivityStatus(tanggal, status, absensiDibuka)
    })
  }

  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          Status Kegiatan Hari Ini
        </CardTitle>
        <CardDescription>{tanggal}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select value={status} onValueChange={(v) => setStatus(v as ActivityStatusType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Belum Dimulai">Belum Dimulai</SelectItem>
              <SelectItem value="Sedang Berlangsung">Sedang Berlangsung</SelectItem>
              <SelectItem value="Selesai">Selesai</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <input
            type="checkbox"
            id="absensi-dibuka"
            checked={absensiDibuka}
            onChange={(e) => setAbsensiDibuka(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="absensi-dibuka" className="text-sm font-medium cursor-pointer">
            Buka Absensi
          </label>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={config.color}>{config.label}</Badge>
          {absensiDibuka && <Badge variant="outline">Absensi Dibuka</Badge>}
        </div>

        <Button onClick={handleSave} disabled={isPending} className="w-full">
          {isPending ? 'Menyimpan...' : 'Simpan Status'}
        </Button>
      </CardContent>
    </Card>
  )
}
