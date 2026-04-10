'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import type { Absensi } from '@/lib/types'

interface StatistikKehadiranProps {
  data: Absensi[]
  pertemuan: number
}

export default function StatistikKehadiran({ data, pertemuan }: StatistikKehadiranProps) {
  const stats = useMemo(() => {
    const filtered = data.filter(a => a.pertemuan === pertemuan)
    const hadir = filtered.filter(a => a.status === 'Hadir').length
    const izin = filtered.filter(a => a.status === 'Izin').length
    const alfa = filtered.filter(a => a.status === 'Alfa').length
    const total = filtered.length
    const persentaseHadir = total > 0 ? Math.round((hadir / total) * 100) : 0

    return {
      hadir,
      izin,
      alfa,
      total,
      persentaseHadir,
      byKelas: (['Graphic Design', 'Web Design'] as const).map(kelas => {
        const kelasData = filtered.filter(a => a.kelas === kelas)
        return {
          kelas,
          hadir: kelasData.filter(a => a.status === 'Hadir').length,
          izin: kelasData.filter(a => a.status === 'Izin').length,
          alfa: kelasData.filter(a => a.status === 'Alfa').length,
        }
      }),
    }
  }, [data, pertemuan])

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Hadir</p>
              <p className="text-3xl font-bold text-emerald-600">{stats.hadir}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Izin</p>
              <p className="text-3xl font-bold text-amber-600">{stats.izin}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Alfa</p>
              <p className="text-3xl font-bold text-red-600">{stats.alfa}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Persentase</p>
              <p className="text-3xl font-bold text-primary">{stats.persentaseHadir}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per Kelas */}
      <Card>
        <CardHeader>
          <CardTitle>Statistik per Kelas</CardTitle>
          <CardDescription>Pertemuan {pertemuan}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.byKelas}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="kelas" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="hadir" fill="#10b981" name="Hadir" />
              <Bar dataKey="izin" fill="#f59e0b" name="Izin" />
              <Bar dataKey="alfa" fill="#ef4444" name="Alfa" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
