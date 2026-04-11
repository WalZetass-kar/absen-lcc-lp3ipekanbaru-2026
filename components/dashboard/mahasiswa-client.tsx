'use client'

import { useState, useTransition, useMemo } from 'react'
import { addMahasiswa, updateMahasiswa, deleteMahasiswa, importMahasiswaFromExcel, syncMahasiswaAccount } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Pencil, Trash2, Users, Upload, Download, FileSpreadsheet, Printer, FileDown, UserPlus } from 'lucide-react'
import type { Mahasiswa, Kelas, Prodi } from '@/lib/types'

const PRODI_OPTIONS: Prodi[] = ['Humas', 'Akuntansi', 'Administrasi Bisnis', 'Manajemen Informatika']
const KELAS_OPTIONS: Kelas[] = ['Graphic Design', 'Web Design']

interface MahasiswaClientProps {
  initialData: Mahasiswa[]
}

export default function MahasiswaClient({ initialData }: MahasiswaClientProps) {
  const [data, setData] = useState<Mahasiswa[]>(initialData)
  const [search, setSearch] = useState('')
  const [filterKelas, setFilterKelas] = useState<string>('all')
  const [filterProdi, setFilterProdi] = useState<string>('all')
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Add dialog
  const [addOpen, setAddOpen] = useState(false)
  const [addNama, setAddNama] = useState('')
  const [addNim, setAddNim] = useState('')
  const [addKelas, setAddKelas] = useState<Kelas>('Graphic Design')
  const [addProdi, setAddProdi] = useState<Prodi>('Manajemen Informatika')

  // Import dialog
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editItem, setEditItem] = useState<Mahasiswa | null>(null)
  const [editNama, setEditNama] = useState('')
  const [editKelas, setEditKelas] = useState<Kelas>('Graphic Design')
  const [editProdi, setEditProdi] = useState<Prodi>('Manajemen Informatika')

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return data.filter(m => {
      const matchSearch = m.nama.toLowerCase().includes(search.toLowerCase())
      const matchKelas = filterKelas === 'all' || m.kelas === filterKelas
      const matchProdi = filterProdi === 'all' || m.prodi === filterProdi
      return matchSearch && matchKelas && matchProdi
    })
  }, [data, search, filterKelas, filterProdi])

  function openEdit(item: Mahasiswa) {
    setActionError(null)
    setEditItem(item)
    setEditNama(item.nama)
    setEditKelas(item.kelas)
    setEditProdi(item.prodi)
    setEditOpen(true)
  }

  function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message
    return 'Terjadi kesalahan. Silakan coba lagi.'
  }

  function openAttendancePdf(mode: 'preview' | 'download') {
    const params = new URLSearchParams()

    if (filterKelas !== 'all') params.set('kelas', filterKelas)
    if (filterProdi !== 'all') params.set('prodi', filterProdi)
    if (mode === 'download') params.set('download', '1')

    const url = `/api/print${params.toString() ? `?${params.toString()}` : ''}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function handleSyncAccount(mahasiswa: Mahasiswa) {
    setActionError(null)
    setActionSuccess(null)

    startTransition(async () => {
      try {
        const result = await syncMahasiswaAccount(mahasiswa.id)
        setData((prev) => prev.map((item) => (
          item.id === mahasiswa.id
            ? { ...item, user_id: result.member.user_id, nim: result.member.nim }
            : item
        )))
        setActionSuccess(`Akun mahasiswa untuk ${mahasiswa.nama} siap digunakan. Password default tetap NIM.`)
      } catch (error) {
        console.error('Error syncing mahasiswa account:', error)
        setActionError(getErrorMessage(error))
      }
    })
  }

  function handleAdd() {
    if (!addNama.trim() || !addNim.trim()) return
    setActionError(null)
    setActionSuccess(null)

    startTransition(async () => {
      try {
        const created = await addMahasiswa(addNama.trim(), addKelas, addProdi, addNim.trim())
        setData(prev => [...prev, created as Mahasiswa])
        setAddNama('')
        setAddNim('')
        setAddKelas('Graphic Design')
        setAddProdi('Manajemen Informatika')
        setAddOpen(false)
        setActionSuccess('Anggota berhasil ditambahkan. Password default login adalah NIM.')
      } catch (error) {
        console.error('Error adding mahasiswa:', error)
        setActionError(getErrorMessage(error))
      }
    })
  }

  function downloadTemplate() {
    const headers = ['nama', 'nim', 'prodi', 'kelas']
    const sampleData = [
      ['Contoh Nama', '123456789', 'Manajemen Informatika', 'Web Design'],
      ['Nama Mahasiswa', '987654321', 'Akuntansi', 'Graphic Design'],
    ]
    const csvContent = [headers.join(','), ...sampleData.map(row => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_mahasiswa.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport() {
    if (!importFile) return
    setImportError(null)
    setImportSuccess(null)
    setActionError(null)
    setActionSuccess(null)

    startTransition(async () => {
      try {
        const text = await importFile.text()
        const lines = text.split('\n').filter(l => l.trim())

        if (lines.length < 2) {
          setImportError('File CSV kosong')
          return
        }

        const headers = lines[0].toLowerCase().split(',').map(h => h.trim())

        const namaIdx = headers.indexOf('nama')
        const nimIdx = headers.indexOf('nim')
        const prodiIdx = headers.indexOf('prodi')
        const kelasIdx = headers.indexOf('kelas')

        if (namaIdx === -1) {
          setImportError('Kolom "nama" tidak ditemukan')
          return
        }

        const newData: { nama: string; nim?: string; prodi: Prodi; kelas: Kelas }[] = []

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim())
          const nama = cols[namaIdx]
          const nim = nimIdx >= 0 && cols[nimIdx] ? cols[nimIdx] : undefined
          let prodi = (prodiIdx >= 0 && cols[prodiIdx] ? cols[prodiIdx] : 'Manajemen Informatika') as Prodi
          let kelas = (kelasIdx >= 0 && cols[kelasIdx] ? cols[kelasIdx] : 'Web Design') as Kelas

          // Validate prodi
          if (!PRODI_OPTIONS.includes(prodi)) {
            prodi = 'Manajemen Informatika'
          }

          // Validate kelas
          if (!KELAS_OPTIONS.includes(kelas)) {
            kelas = 'Web Design'
          }

          if (nama && nama !== '' && nim) {
            newData.push({ nama, nim, prodi, kelas })
          }
        }

        if (newData.length === 0) {
          setImportError('Tidak ada data valid yang ditemukan. Pastikan setiap baris memiliki NIM.')
          return
        }

        const result = await importMahasiswaFromExcel(newData)

        // Cast result ke Mahasiswa[] dengan aman
        const importedData = result as unknown as Mahasiswa[]

        if (importedData && Array.isArray(importedData)) {
          setData(prev => [...prev, ...importedData])
          setImportSuccess(`Berhasil mengimpor ${importedData.length} anggota. Password default login adalah NIM.`)
          setActionSuccess(`Berhasil mengimpor ${importedData.length} anggota.`)
        } else {
          setImportError('Gagal mengimpor data')
        }

        setImportFile(null)
        setTimeout(() => {
          setImportSuccess(null)
          setImportOpen(false)
        }, 2000)
      } catch (err) {
        setImportError('Gagal membaca file. Pastikan format CSV benar.')
        console.error(err)
      }
    })
  }

  function handleEdit() {
    if (!editItem || !editNama.trim()) return
    setActionError(null)
    setActionSuccess(null)

    startTransition(async () => {
      try {
        await updateMahasiswa(editItem.id, editNama.trim(), editKelas, editProdi)
        setData(prev => prev.map(m => m.id === editItem.id
          ? { ...m, nama: editNama.trim(), kelas: editKelas, prodi: editProdi }
          : m
        ))
        setEditOpen(false)
        setEditItem(null)
        setActionSuccess('Data anggota berhasil diperbarui.')
      } catch (error) {
        console.error('Error updating mahasiswa:', error)
        setActionError(getErrorMessage(error))
      }
    })
  }

  function handleDelete() {
    if (!deleteId) return
    setActionError(null)
    setActionSuccess(null)

    startTransition(async () => {
      try {
        await deleteMahasiswa(deleteId)
        setData(prev => prev.filter(m => m.id !== deleteId))
        setDeleteId(null)
        setActionSuccess('Anggota berhasil dihapus.')
      } catch (error) {
        console.error('Error deleting mahasiswa:', error)
        setActionError(getErrorMessage(error))
      }
    })
  }

  const totalGraphicDesign = data.filter(m => m.kelas === 'Graphic Design').length
  const totalWebDesign = data.filter(m => m.kelas === 'Web Design').length
  const totalActiveAccounts = data.filter(m => Boolean(m.user_id)).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mahasiswa & Akun</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Kelola data anggota LCC sekaligus akun login mahasiswa berbasis NIM</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => openAttendancePdf('preview')} size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Preview PDF
          </Button>
          <Button variant="outline" onClick={() => openAttendancePdf('download')} size="sm">
            <FileDown className="w-4 h-4 mr-2" />
            Unduh PDF
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)} size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={() => setAddOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Akun Mahasiswa
          </Button>
        </div>
      </div>

      {(actionError || actionSuccess) && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${
          actionError
            ? 'border-destructive/20 bg-destructive/10 text-destructive'
            : 'border-green-200 bg-green-50 text-green-700'
        }`}>
          {actionError ?? actionSuccess}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Total</p>
            <p className="text-2xl font-bold mt-1">{data.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Akun Aktif</p>
            <p className="text-2xl font-bold mt-1">{totalActiveAccounts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Graphic Design</p>
            <p className="text-2xl font-bold mt-1">{totalGraphicDesign}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Web Design</p>
            <p className="text-2xl font-bold mt-1">{totalWebDesign}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama mahasiswa..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select value={filterProdi} onValueChange={setFilterProdi}>
              <SelectTrigger className="w-full sm:w-52 h-9">
                <SelectValue placeholder="Semua Prodi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Prodi</SelectItem>
                {PRODI_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterKelas} onValueChange={setFilterKelas}>
              <SelectTrigger className="w-full sm:w-44 h-9">
                <SelectValue placeholder="Semua Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {KELAS_OPTIONS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Tidak ada mahasiswa ditemukan</p>
              <p className="text-xs text-muted-foreground mt-1">Coba ubah filter atau tambah mahasiswa baru</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">#</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nama</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">NIM</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Prodi</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Kelas LCC</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Akun</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((m, i) => (
                    <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-medium">{m.nama}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{m.nim || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-normal text-xs">
                          {m.prodi}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={m.kelas === 'Graphic Design' ? 'default' : 'secondary'} className="font-normal text-xs">
                          {m.kelas}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {m.user_id ? (
                          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                            Siap Login
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Belum Dibuat
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {!m.user_id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 text-primary"
                              onClick={() => handleSyncAccount(m)}
                              aria-label={`Buat akun login untuk ${m.nama}`}
                              title="Buat akun login mahasiswa"
                              disabled={isPending}
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(m)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="w-7 h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteId(m.id)}
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
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Tambah Akun Mahasiswa</DialogTitle>
            <DialogDescription>Tambahkan data anggota baru dan buat akun login mahasiswa otomatis dari NIM</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input
                placeholder="Nama lengkap"
                value={addNama}
                onChange={e => setAddNama(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <div className="space-y-2">
              <Label>NIM</Label>
              <Input
                placeholder="Nomor Induk Mahasiswa"
                value={addNim}
                onChange={e => setAddNim(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Program Studi</Label>
              <Select value={addProdi} onValueChange={v => setAddProdi(v as Prodi)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODI_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kelas LCC</Label>
              <Select value={addKelas} onValueChange={v => setAddKelas(v as Kelas)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KELAS_OPTIONS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2.5">
              <p className="text-sm text-blue-700">
                Password default anggota adalah NIM. Sistem akan membuat akun login secara otomatis dan anggota diminta mengganti password saat login pertama.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button onClick={handleAdd} disabled={isPending || !addNama.trim() || !addNim.trim()}>
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Mahasiswa</DialogTitle>
            <DialogDescription>Ubah data mahasiswa yang sudah terdaftar</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input
                value={editNama}
                onChange={e => setEditNama(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEdit()}
              />
            </div>
            <div className="space-y-2">
              <Label>Program Studi</Label>
              <Select value={editProdi} onValueChange={v => setEditProdi(v as Prodi)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODI_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kelas LCC</Label>
              <Select value={editKelas} onValueChange={v => setEditKelas(v as Kelas)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KELAS_OPTIONS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Batal</Button>
            <Button onClick={handleEdit} disabled={isPending || !editNama.trim()}>
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Mahasiswa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Semua data absensi mahasiswa ini juga akan terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isPending}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={(o) => {
        setImportOpen(o)
        if (!o) {
          setImportError(null)
          setImportSuccess(null)
          setImportFile(null)
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Import Mahasiswa dari CSV
            </DialogTitle>
            <DialogDescription>Upload file CSV untuk menambahkan banyak mahasiswa sekaligus</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Format CSV yang diterima:</p>
              <code className="text-xs block bg-background p-2 rounded">nama,nim,prodi,kelas</code>
              <p className="text-xs text-muted-foreground">
                Kolom <strong>nama</strong> dan <strong>nim</strong> wajib. Password default anggota akan mengikuti NIM.
              </p>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Download Template CSV
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Pilih File CSV</Label>
              <Input
                type="file"
                accept=".csv,.txt"
                onChange={e => setImportFile(e.target.files?.[0] || null)}
              />
            </div>
            {importError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2.5">
                <p className="text-sm text-destructive">{importError}</p>
              </div>
            )}
            {importSuccess && (
              <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2.5">
                <p className="text-sm text-green-700">{importSuccess}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Batal</Button>
            <Button onClick={handleImport} disabled={isPending || !importFile}>
              {isPending ? 'Mengimpor...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
