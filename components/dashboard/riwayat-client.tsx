'use client'

import { useState, useMemo, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Download, History, Pencil, Trash2, ChevronDown, ChevronRight, Users, CalendarDays } from 'lucide-react'
import type { Absensi, StatusAbsensi } from '@/lib/types'
import { updateAbsensi, deleteAbsensi, deleteAbsensiByPertemuan } from '@/lib/actions'

const STATUS_STYLE: Record<string, string> = {
  Hadir: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Izin: 'bg-amber-100 text-amber-700 border-amber-200',
  Alfa: 'bg-red-100 text-red-600 border-red-200',
}
const STATUS_OPTIONS: StatusAbsensi[] = ['Hadir', 'Izin', 'Alfa']
const KELAS_OPTIONS = ['Graphic Design', 'Web Design']

type GroupKey = { kelas: string; pertemuan: number }
type Group = GroupKey & { tanggal: string; records: Absensi[] }

export default function RiwayatClient({ initialData }: { initialData: Absensi[] }) {
  const [data, setData] = useState<Absensi[]>(initialData)
  const [filterKelas, setFilterKelas] = useState('all')
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editItem, setEditItem] = useState<Absensi | null>(null)
  const [editStatus, setEditStatus] = useState<StatusAbsensi>('Hadir')

  // Delete single
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Delete whole pertemuan
  const [deleteGroup, setDeleteGroup] = useState<GroupKey | null>(null)

  // Group data by kelas + pertemuan
  const groups = useMemo<Group[]>(() => {
    const filtered = filterKelas === 'all' ? data : data.filter(a => a.kelas === filterKelas)
    const map = new Map<string, Group>()
    for (const a of filtered) {
      const key = `${a.kelas}__${a.pertemuan}`
      if (!map.has(key)) {
        map.set(key, { kelas: a.kelas, pertemuan: a.pertemuan, tanggal: a.tanggal, records: [] })
      }
      map.get(key)!.records.push(a)
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.kelas !== b.kelas) return a.kelas.localeCompare(b.kelas)
      return b.pertemuan - a.pertemuan
    })
  }, [data, filterKelas])

  // Data yang sudah difilter untuk export
  const filteredData = useMemo(() => {
    return filterKelas === 'all' ? data : data.filter(a => a.kelas === filterKelas)
  }, [data, filterKelas])

  function toggleGroup(key: string) {
    setOpenGroups(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function groupKey(g: GroupKey) {
    return `${g.kelas}__${g.pertemuan}`
  }

  function openEdit(item: Absensi) {
    setEditItem(item)
    setEditStatus(item.status)
    setEditOpen(true)
  }

  function handleEdit() {
    if (!editItem) return
    startTransition(async () => {
      await updateAbsensi(editItem.id, editStatus)
      setData(prev => prev.map(a => a.id === editItem.id ? { ...a, status: editStatus } : a))
      setEditOpen(false)
    })
  }

  function handleDeleteSingle() {
    if (!deleteId) return
    startTransition(async () => {
      await deleteAbsensi(deleteId)
      setData(prev => prev.filter(a => a.id !== deleteId))
      setDeleteId(null)
    })
  }

  function handleDeleteGroup() {
    if (!deleteGroup) return
    startTransition(async () => {
      await deleteAbsensiByPertemuan(deleteGroup.kelas, deleteGroup.pertemuan)
      setData(prev => prev.filter(a => !(a.kelas === deleteGroup.kelas && a.pertemuan === deleteGroup.pertemuan)))
      setOpenGroups(prev => {
        const next = new Set(prev)
        next.delete(groupKey(deleteGroup))
        return next
      })
      setDeleteGroup(null)
    })
  }

  function exportPDF() {
    const doc = `
LAPORAN RIWAYAT ABSENSI
LCC - Sistem Absensi Kelas
Generated: ${new Date().toLocaleString('id-ID')}

================================================================================

${filteredData.map(a =>
      `${a.nama_mahasiswa} | ${a.kelas} | Pertemuan ${a.pertemuan} | ${a.tanggal} | ${a.status}`
    ).join('\n')}

================================================================================
Total Records: ${filteredData.length}
Status Summary:
- Hadir: ${filteredData.filter(a => a.status === 'Hadir').length}
- Izin: ${filteredData.filter(a => a.status === 'Izin').length}
- Alfa: ${filteredData.filter(a => a.status === 'Alfa').length}
`.trim()

    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(doc))
    element.setAttribute('download', `riwayat-absensi-${new Date().toISOString().split('T')[0]}.txt`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  function exportCSV() {
    const rows = [
      ['Nama', 'Kelas', 'Pertemuan', 'Status', 'Tanggal'],
      ...filteredData.map(a => [a.nama_mahasiswa, a.kelas, String(a.pertemuan ?? ''), a.status, a.tanggal]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const el = document.createElement('a')
    el.href = url
    el.download = `riwayat-absensi-${new Date().toISOString().split('T')[0]}.csv`
    el.click()
    URL.revokeObjectURL(url)
  }

  function formatTanggal(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  const totalHadir = data.filter(a => a.status === 'Hadir').length
  const totalIzin = data.filter(a => a.status === 'Izin').length
  const totalAlfa = data.filter(a => a.status === 'Alfa').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Riwayat Absensi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Kelola catatan kehadiran per pertemuan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportPDF} disabled={data.length === 0}>
            <Download className="w-4 h-4" />
            Export TXT
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={data.length === 0}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Records', value: data.length },
          { label: 'Hadir', value: totalHadir, className: 'border-emerald-200 bg-emerald-50' },
          { label: 'Izin', value: totalIzin, className: 'border-amber-200 bg-amber-50' },
          { label: 'Alfa', value: totalAlfa, className: 'border-red-200 bg-red-50' },
        ].map(s => (
          <Card key={s.label} className={s.className ?? ''}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={filterKelas} onValueChange={setFilterKelas}>
          <SelectTrigger className="w-48 h-9">
            <SelectValue placeholder="Semua Kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            {KELAS_OPTIONS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">{groups.length} pertemuan ditemukan</p>
      </div>

      {/* Grouped Accordion */}
      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <History className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Belum ada data absensi</p>
            <p className="text-xs text-muted-foreground mt-1">Input absensi terlebih dahulu di halaman Absensi</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {groups.map(group => {
            const key = groupKey(group)
            const isOpen = openGroups.has(key)
            const hadirCount = group.records.filter(r => r.status === 'Hadir').length
            const izinCount = group.records.filter(r => r.status === 'Izin').length
            const alfaCount = group.records.filter(r => r.status === 'Alfa').length

            return (
              <Card key={key} className="overflow-hidden">
                {/* Group Header */}
                <div
                  onClick={() => toggleGroup(key)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 shrink-0">
                    <span className="text-primary font-bold text-sm">{group.pertemuan}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">Pertemuan {group.pertemuan}</span>
                      <Badge variant={group.kelas === 'Graphic Design' ? 'default' : 'secondary'} className="text-xs font-normal">
                        {group.kelas}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="w-3 h-3" />
                        {formatTanggal(group.tanggal)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {group.records.length} mahasiswa
                      </span>
                    </div>
                  </div>
                  {/* Mini recap */}
                  <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">{hadirCount}H</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">{izinCount}I</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">{alfaCount}A</span>
                  </div>
                  {/* Delete group button */}
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setDeleteGroup({ kelas: group.kelas, pertemuan: group.pertemuan }) }}
                    className="ml-2 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {isOpen
                    ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  }
                </div>

                {/* Expanded Detail Table */}
                {isOpen && (
                  <div className="border-t border-border">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/20 border-b border-border">
                            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-10">#</th>
                            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Nama Mahasiswa</th>
                            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                            <th className="px-4 py-2.5 text-right font-medium text-muted-foreground w-20">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {group.records.map((r, i) => (
                            <tr key={r.id} className="hover:bg-muted/10 transition-colors">
                              <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                              <td className="px-4 py-2.5 font-medium">{r.nama_mahasiswa}</td>
                              <td className="px-4 py-2.5">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[r.status]}`}>
                                  {r.status}
                                </span>
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(r)}>
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost" size="icon"
                                    className="w-7 h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => setDeleteId(r.id)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Status Absensi</DialogTitle>
            <DialogDescription>Ubah status kehadiran untuk {editItem?.nama_mahasiswa}</DialogDescription>
          </DialogHeader>
          {editItem && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nama:</span>
                  <span className="font-medium">{editItem.nama_mahasiswa}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kelas:</span>
                  <span>{editItem.kelas}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pertemuan:</span>
                  <span>ke-{editItem.pertemuan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tanggal:</span>
                  <span>{formatTanggal(editItem.tanggal)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Status Kehadiran</p>
                <div className="grid grid-cols-3 gap-2">
                  {STATUS_OPTIONS.map(s => (
                    <Button
                      key={s}
                      type="button"
                      variant={editStatus === s ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEditStatus(s)}
                      className={editStatus === s ? (
                        s === 'Hadir' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
                          s === 'Izin' ? 'bg-amber-500 hover:bg-amber-600 text-white' :
                            'bg-red-500 hover:bg-red-600 text-white'
                      ) : ''}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Batal</Button>
            <Button onClick={handleEdit} disabled={isPending}>
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Single */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Absensi?</AlertDialogTitle>
            <AlertDialogDescription>Data absensi ini akan dihapus permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSingle} className="bg-destructive text-white hover:bg-destructive/90">
              {isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Whole Pertemuan */}
      <AlertDialog open={!!deleteGroup} onOpenChange={open => !open && setDeleteGroup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Seluruh Pertemuan {deleteGroup?.pertemuan}?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua data absensi kelas <strong>{deleteGroup?.kelas}</strong> pertemuan ke-<strong>{deleteGroup?.pertemuan}</strong> akan dihapus permanen dan tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive text-white hover:bg-destructive/90">
              {isPending ? 'Menghapus...' : 'Hapus Semua'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}