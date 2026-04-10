'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { saveAbsensi, getAbsensiByDate, logActivity } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  CheckCircle2,
  Loader2,
  BookOpen,
  Users,
  CalendarDays,
  ChevronDown,
  Zap
} from 'lucide-react'
import type { Mahasiswa, Kelas, StatusAbsensi } from '@/lib/types'
import { cn } from '@/lib/utils'

type AbsensiRecord = Record<string, StatusAbsensi>

const KELAS_OPTIONS: Kelas[] = ['Graphic Design', 'Web Design']

const STATUS_CONFIG: {
  value: StatusAbsensi
  label: string
  short: string
  bg: string
  activeBg: string
  activeText: string
  activeBorder: string
  dot: string
}[] = [
    {
      value: 'Hadir',
      label: 'Hadir',
      short: 'H',
      bg: 'hover:bg-emerald-50',
      activeBg: 'bg-emerald-50',
      activeText: 'text-emerald-700',
      activeBorder: 'border-emerald-500',
      dot: 'bg-emerald-500',
    },
    {
      value: 'Izin',
      label: 'Izin',
      short: 'I',
      bg: 'hover:bg-amber-50',
      activeBg: 'bg-amber-50',
      activeText: 'text-amber-700',
      activeBorder: 'border-amber-500',
      dot: 'bg-amber-500',
    },
    {
      value: 'Alfa',
      label: 'Alfa',
      short: 'A',
      bg: 'hover:bg-red-50',
      activeBg: 'bg-red-50',
      activeText: 'text-red-600',
      activeBorder: 'border-red-500',
      dot: 'bg-red-500',
    },
  ]

export default function AbsensiClient({ mahasiswaList }: { mahasiswaList: Mahasiswa[] }) {
  const [selectedKelas, setSelectedKelas] = useState<Kelas>('Graphic Design')
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedPertemuan, setSelectedPertemuan] = useState<string>('1')
  const [records, setRecords] = useState<AbsensiRecord>({})
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const filtered = mahasiswaList.filter(m => m.kelas === selectedKelas)

  const loadExisting = useCallback(async () => {
    setLoadingExisting(true)
    try {
      const existing = await getAbsensiByDate(tanggal, selectedKelas)
      const map: AbsensiRecord = {}
      filtered.forEach(m => { map[m.id] = 'Hadir' })
      existing?.forEach(a => { map[a.mahasiswa_id] = a.status as StatusAbsensi })
      setRecords(map)
    } finally {
      setLoadingExisting(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tanggal, selectedKelas])

  useEffect(() => {
    loadExisting()
    setSaved(false)
  }, [loadExisting])

  function setStatus(mahasiswaId: string, status: StatusAbsensi) {
    setRecords(prev => ({ ...prev, [mahasiswaId]: status }))
    setSaved(false)
  }

  function setAllStatus(status: StatusAbsensi) {
    const map: AbsensiRecord = {}
    filtered.forEach(m => { map[m.id] = status })
    setRecords(prev => ({ ...prev, ...map }))
    setSaved(false)
  }

  function markAllAs(status: StatusAbsensi) {
    const newRecords = { ...records }
    filtered.forEach(m => {
      newRecords[m.id] = status
    })
    setRecords(newRecords)
  }

  const countByStatus = (s: StatusAbsensi) => filtered.filter(m => records[m.id] === s).length
  const hadir = countByStatus('Hadir')
  const izin = countByStatus('Izin')
  const alfa = countByStatus('Alfa')

  function handleSave() {
    startTransition(async () => {
      const payload = filtered.map(m => ({
        mahasiswa_id: m.id,
        nama_mahasiswa: m.nama,
        kelas: m.kelas,
        status: records[m.id] ?? 'Hadir',
        tanggal,
        pertemuan: parseInt(selectedPertemuan),
      }))
      await saveAbsensi(payload)
      await logActivity(
        'INPUT_ABSENSI',
        'ABSENSI',
        `Pertemuan ${selectedPertemuan} - ${selectedKelas} (${hadir}H, ${izin}I, ${alfa}A)`
      )
      setSaved(true)
      setShowConfirm(false)
    })
  }
  const total = filtered.length

  const displayDate = tanggal
    ? new Date(tanggal + 'T00:00:00').toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    : '-'

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Input Kehadiran</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Sistem Informasi Akademik — LCC</p>
      </div>

      {/* Session Info Card */}
      <Card className="border-primary/30 bg-primary/5 shadow-none">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Kelas selector */}
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Kelas / Mata Kuliah
              </p>
              <Select value={selectedKelas} onValueChange={v => setSelectedKelas(v as Kelas)}>
                <SelectTrigger className="h-9 bg-background border-border font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KELAS_OPTIONS.map(k => (
                    <SelectItem key={k} value={k}>{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pertemuan */}
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Pertemuan ke-
              </p>
              <Select value={selectedPertemuan} onValueChange={setSelectedPertemuan}>
                <SelectTrigger className="h-9 bg-background border-border font-medium">
                  <SelectValue />
                  <ChevronDown className="w-4 h-4 opacity-50" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 16 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>Pertemuan {i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tanggal */}
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" /> Tanggal Pertemuan
              </p>
              <Input
                type="date"
                value={tanggal}
                onChange={e => setTanggal(e.target.value)}
                className="h-9 bg-background border-border font-medium"
              />
            </div>
          </div>

          {/* Bulk Actions */}
          {filtered.length > 0 && (
            <div className="mt-4 pt-4 border-t border-primary/20 flex flex-wrap gap-2">
              <p className="text-xs font-semibold text-muted-foreground mr-2">Quick Fill:</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAs('Hadir')}
                className="gap-1.5 text-xs"
              >
                <Zap className="w-3 h-3" />
                Semua Hadir ({filtered.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAs('Izin')}
                className="gap-1.5 text-xs"
              >
                <Zap className="w-3 h-3" />
                Semua Izin
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAs('Alfa')}
                className="gap-1.5 text-xs"
              >
                <Zap className="w-3 h-3" />
                Semua Alfa
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success banner */}
      {saved && (
        <div className="flex items-center gap-2.5 rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Data kehadiran berhasil disimpan untuk pertemuan ke-{selectedPertemuan}.
        </div>
      )}

      {/* Attendance Sheet */}
      <Card className="shadow-none">
        {/* Card top bar */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/30 rounded-t-lg">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Daftar Hadir Mahasiswa
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kelas {selectedKelas} &mdash; Pertemuan ke-{selectedPertemuan}
            </p>
          </div>
          {/* Quick fill buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">Isi semua:</span>
            {STATUS_CONFIG.map(s => (
              <button
                key={s.value}
                onClick={() => setAllStatus(s.value)}
                className={cn(
                  'h-7 px-2.5 rounded text-xs font-medium border transition-colors',
                  s.activeBg, s.activeText, s.activeBorder
                )}
              >
                {s.short}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-background text-xs text-muted-foreground">
          {STATUS_CONFIG.map(s => (
            <span key={s.value} className="flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-full', s.dot)} />
              {s.label}
            </span>
          ))}
          <span className="ml-auto">Klik status untuk memilih</span>
        </div>

        {/* Table */}
        {loadingExisting ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <BookOpen className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Belum ada mahasiswa di kelas {selectedKelas}</p>
            <p className="text-xs text-muted-foreground mt-1">Tambahkan mahasiswa terlebih dahulu di menu Data Mahasiswa</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/20 text-left">
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border w-12 text-center">No</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border">Nama Mahasiswa</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border text-center w-32">Status Kehadiran</th>
                  <th className="hidden sm:table-cell px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border text-center w-24">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => {
                  const status = records[m.id] ?? 'Hadir'
                  const cfg = STATUS_CONFIG.find(s => s.value === status)!
                  return (
                    <tr
                      key={m.id}
                      className={cn(
                        'border-b border-border transition-colors',
                        i % 2 === 0 ? 'bg-background' : 'bg-muted/10',
                        'hover:bg-accent/30'
                      )}
                    >
                      {/* No */}
                      <td className="px-4 py-3 text-center text-muted-foreground font-mono text-xs">{i + 1}</td>

                      {/* Nama */}
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground">{m.nama}</span>
                      </td>

                      {/* Status buttons */}
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1 justify-center">
                          {STATUS_CONFIG.map(s => (
                            <button
                              key={s.value}
                              onClick={() => setStatus(m.id, s.value)}
                              title={s.label}
                              className={cn(
                                'w-9 h-9 rounded-md text-xs font-bold border-2 transition-all select-none',
                                status === s.value
                                  ? cn(s.activeBg, s.activeText, s.activeBorder, 'shadow-sm scale-105')
                                  : 'bg-background text-muted-foreground border-border hover:border-muted-foreground/40'
                              )}
                            >
                              {s.short}
                            </button>
                          ))}
                        </div>
                      </td>

                      {/* Keterangan badge */}
                      <td className="hidden sm:table-cell px-4 py-3 text-center">
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                          cfg.activeBg, cfg.activeText
                        )}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                          {status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>

              {/* Summary footer */}
              <tfoot>
                <tr className="bg-muted/30 border-t-2 border-border">
                  <td colSpan={2} className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Rekapitulasi Kehadiran
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-1 justify-center text-xs font-semibold">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">{hadir}H</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">{izin}I</span>
                      <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600">{alfa}A</span>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 text-center text-xs font-semibold text-foreground">
                    {total} Mahasiswa
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* Submit button */}
      {filtered.length > 0 && (
        <>
          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4 shadow-none">
            <div className="text-sm">
              <p className="font-medium text-foreground">Rekapitulasi Kehadiran</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hadir} Hadir &bull; {izin} Izin &bull; {alfa} Alfa &bull; Total {total}
              </p>
            </div>
            <Button
              onClick={() => setShowConfirm(true)}
              disabled={isPending}
              className="min-w-[140px]"
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" />Simpan Absensi</>
              )}
            </Button>
          </div>

          {/* Confirmation dialog */}
          {showConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-card border border-border rounded-lg shadow-lg max-w-sm w-full p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Konfirmasi Penyimpanan</h2>
                  <p className="text-sm text-muted-foreground mt-1">Pastikan data kehadiran sudah benar sebelum disimpan</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kelas:</span>
                    <span className="font-medium">{selectedKelas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pertemuan:</span>
                    <span className="font-medium">ke-{selectedPertemuan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tanggal:</span>
                    <span className="font-medium">{displayDate}</span>
                  </div>
                  <div className="border-t border-border pt-2 mt-2 flex gap-2">
                    <span className="flex-1">Hadir: <strong className="text-emerald-600">{hadir}</strong></span>
                    <span className="flex-1">Izin: <strong className="text-amber-600">{izin}</strong></span>
                    <span className="flex-1">Alfa: <strong className="text-red-600">{alfa}</strong></span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>Batal</Button>
                  <Button className="flex-1" onClick={handleSave} disabled={isPending}>
                    {isPending ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}