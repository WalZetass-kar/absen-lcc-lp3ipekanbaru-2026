'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Search, BarChart3, TrendingDown, TrendingUp, Users } from 'lucide-react'
import type { Mahasiswa, Absensi } from '@/lib/types'

const KELAS_OPTIONS = ['Graphic Design', 'Web Design']

interface RekapRow {
  mahasiswa: Mahasiswa
  hadir: number
  izin: number
  alfa: number
  total: number
  persentase: number
}

export default function RekapClient({
  mahasiswa,
  absensi,
}: {
  mahasiswa: Mahasiswa[]
  absensi: Absensi[]
}) {
  const [search, setSearch] = useState('')
  const [filterKelas, setFilterKelas] = useState('all')
  const [sortBy, setSortBy] = useState<'nama' | 'hadir' | 'alfa'>('nama')

  const rows = useMemo<RekapRow[]>(() => {
    return mahasiswa
      .filter(m => {
        const matchKelas = filterKelas === 'all' || m.kelas === filterKelas
        const matchSearch = m.nama.toLowerCase().includes(search.toLowerCase())
        return matchKelas && matchSearch
      })
      .map(m => {
        const records = absensi.filter(a => a.mahasiswa_id === m.id)
        const hadir = records.filter(a => a.status === 'Hadir').length
        const izin = records.filter(a => a.status === 'Izin').length
        const alfa = records.filter(a => a.status === 'Alfa').length
        const total = records.length
        const persentase = total > 0 ? Math.round((hadir / total) * 100) : 0
        return { mahasiswa: m, hadir, izin, alfa, total, persentase }
      })
      .sort((a, b) => {
        if (sortBy === 'nama') return a.mahasiswa.nama.localeCompare(b.mahasiswa.nama)
        if (sortBy === 'hadir') return b.persentase - a.persentase
        return b.alfa - a.alfa
      })
  }, [mahasiswa, absensi, search, filterKelas, sortBy])

  const totalPertemuan = useMemo(() => {
    const set = new Set(absensi.map(a => `${a.kelas}__${a.pertemuan}`))
    return set.size
  }, [absensi])

  const rataRata = rows.length > 0
    ? Math.round(rows.reduce((s, r) => s + r.persentase, 0) / rows.length)
    : 0

  const seriingAlfa = rows.filter(r => r.alfa >= 3)
  const rajin = rows.filter(r => r.persentase >= 90)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rekap Kehadiran</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Ringkasan kehadiran per mahasiswa</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">Total Mahasiswa</p>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{mahasiswa.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">Total Pertemuan</p>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{totalPertemuan}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">Kehadiran &gt;90%</p>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold mt-1 text-emerald-700">{rajin.length}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">Alfa &ge;3x</p>
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold mt-1 text-red-600">{seriingAlfa.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterKelas} onValueChange={setFilterKelas}>
                <SelectTrigger className="w-44 h-9">
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {KELAS_OPTIONS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={v => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nama">Urutkan: Nama</SelectItem>
                  <SelectItem value="hadir">Urutkan: Kehadiran</SelectItem>
                  <SelectItem value="alfa">Urutkan: Alfa Terbanyak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        {/* Table */}
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Tidak ada data ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-border bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-10">#</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nama</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Kelas</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground w-16">Hadir</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground w-16">Izin</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground w-16">Alfa</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-44">Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row, i) => (
                    <tr key={row.mahasiswa.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{row.mahasiswa.nama}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">{row.mahasiswa.kelas}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge variant={row.mahasiswa.kelas === 'Graphic Design' ? 'default' : 'secondary'} className="font-normal text-xs">
                          {row.mahasiswa.kelas}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-emerald-600">{row.hadir}</td>
                      <td className="px-4 py-3 text-center font-medium text-amber-600">{row.izin}</td>
                      <td className="px-4 py-3 text-center font-medium text-red-500">{row.alfa}</td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-semibold ${
                              row.persentase >= 80 ? 'text-emerald-600' :
                              row.persentase >= 60 ? 'text-amber-600' : 'text-red-500'
                            }`}>{row.persentase}%</span>
                            <span className="text-xs text-muted-foreground">{row.total}x</span>
                          </div>
                          <Progress
                            value={row.persentase}
                            className="h-1.5"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Footer avg */}
              <div className="px-4 py-3 border-t border-border bg-muted/10 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{rows.length} mahasiswa</span>
                <span className="text-xs font-medium">Rata-rata kehadiran: <span className="text-primary">{rataRata}%</span></span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
