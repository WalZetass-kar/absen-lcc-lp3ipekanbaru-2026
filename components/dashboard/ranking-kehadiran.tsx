'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Medal, Award } from 'lucide-react'
import { ProgressBadge } from '@/components/shared/progress-badge'
import type { Absensi, Mahasiswa, BadgeType } from '@/lib/types'

interface RankingKehadiranProps {
  absensiData: Absensi[]
  mahasiswaData: Mahasiswa[]
  kelas: string
}

export default function RankingKehadiran({ absensiData, mahasiswaData, kelas }: RankingKehadiranProps) {
  const getBadgeType = (hadirCount: number): BadgeType => {
    if (hadirCount >= 40) return 'Platinum'
    if (hadirCount >= 30) return 'Gold'
    if (hadirCount >= 20) return 'Silver'
    return 'Bronze'
  }

  const ranking = useMemo(() => {
    const kelasAbsensi = absensiData.filter(a => a.kelas === kelas)
    const mahasiswaMap = new Map(mahasiswaData.map(m => [m.id, m]))

    const scores = new Map<string, { nama: string; hadir: number; total: number; persentase: number; badge: BadgeType }>()

    kelasAbsensi.forEach(a => {
      if (!scores.has(a.mahasiswa_id)) {
        scores.set(a.mahasiswa_id, { nama: a.nama_mahasiswa, hadir: 0, total: 0, persentase: 0, badge: 'Bronze' })
      }
      const score = scores.get(a.mahasiswa_id)!
      score.total++
      if (a.status === 'Hadir') score.hadir++
      score.persentase = Math.round((score.hadir / score.total) * 100)
      score.badge = getBadgeType(score.hadir)
    })

    return Array.from(scores.values())
      .sort((a, b) => {
        if (b.persentase !== a.persentase) return b.persentase - a.persentase
        return b.hadir - a.hadir
      })
      .slice(0, 10)
  }, [absensiData, mahasiswaData, kelas])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          Top 10 Kehadiran
        </CardTitle>
        <CardDescription>{kelas}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {ranking.map((item, index) => (
            <div
              key={item.nama}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors gap-3"
            >
              <div className="flex items-center gap-3 flex-1">
                {index === 0 && <Trophy className="w-5 h-5 text-yellow-500" />}
                {index === 1 && <Medal className="w-5 h-5 text-gray-400" />}
                {index === 2 && <Medal className="w-5 h-5 text-orange-600" />}
                {index > 2 && <span className="w-5 text-center font-bold text-muted-foreground">#{index + 1}</span>}
                <div className="flex-1">
                  <p className="font-medium">{item.nama}</p>
                  <p className="text-xs text-muted-foreground">{item.hadir}/{item.total} pertemuan</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ProgressBadge badgeType={item.badge} attendanceCount={item.hadir} size="sm" />
                <Badge variant={item.persentase >= 80 ? 'default' : item.persentase >= 60 ? 'secondary' : 'destructive'}>
                  {item.persentase}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
