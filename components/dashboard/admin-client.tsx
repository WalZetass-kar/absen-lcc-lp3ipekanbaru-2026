'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
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
import { Plus, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react'
import type { Profile } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { validateEmail, validateNama, validatePassword } from '@/lib/errors'

export default function AdminClient({
  initialAdmins,
  currentUserId,
  currentUserName,
}: {
  initialAdmins: Profile[]
  currentUserId: string
  currentUserName: string
}) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [admins, setAdmins] = useState<Profile[]>(initialAdmins)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    nama: '',
    email: '',
    password: '',
    role: 'admin' as 'admin' | 'super_admin',
  })

  async function writeActivityLog(action: string, detail: string) {
    const { error } = await supabase.from('activity_log').insert({
      admin_id: currentUserId,
      admin_nama: currentUserName,
      action,
      entity: 'ADMIN',
      detail,
    })

    if (error) {
      console.error('Failed to write activity log:', error)
    }
  }

  function handleAdd() {
    if (!form.nama.trim() || !form.email.trim() || !form.password.trim()) return
    setError(null)
    startTransition(async () => {
      try {
        const normalizedEmail = form.email.trim().toLowerCase()
        const normalizedNama = form.nama.trim()

        validateNama(normalizedNama)
        validateEmail(normalizedEmail)
        validatePassword(form.password)

        const { data: existingAdmin, error: existingAdminError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', normalizedEmail)
          .maybeSingle()

        if (existingAdminError) {
          throw new Error(existingAdminError.message)
        }

        if (existingAdmin) {
          throw new Error('Email sudah terdaftar')
        }

        const { data: createdUserId, error: createError } = await supabase.rpc('create_admin_user', {
          p_email: normalizedEmail,
          p_password: form.password,
          p_nama: normalizedNama,
          p_role: form.role,
        })

        if (createError) {
          throw new Error(createError.message || 'Gagal menambah admin')
        }

        if (typeof createdUserId !== 'string' || createdUserId.length === 0) {
          throw new Error('ID admin baru tidak valid')
        }

        await writeActivityLog('CREATE_ADMIN', `Created ${form.role} account: ${normalizedEmail}`)

        setAdmins(prev => [...prev, {
          id: createdUserId,
          nama: normalizedNama,
          email: normalizedEmail,
          role: form.role,
          created_at: new Date().toISOString(),
        }])
        setForm({ nama: '', email: '', password: '', role: 'admin' })
        setAddOpen(false)
        router.refresh()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Gagal menambah admin')
      }
    })
  }

  function handleDelete() {
    if (!deleteId) return
    startTransition(async () => {
      try {
        const adminToDelete = admins.find(admin => admin.id === deleteId)

        const { error: deleteError } = await supabase.rpc('delete_admin_user', {
          p_user_id: deleteId,
        })

        if (deleteError) {
          if (deleteError.code === 'PGRST202') {
            throw new Error('Fungsi hapus admin belum tersedia di database. Jalankan migrasi Supabase terbaru terlebih dulu.')
          }

          throw new Error(deleteError.message || 'Gagal menghapus admin')
        }

        await writeActivityLog(
          'DELETE_ADMIN',
          `Deleted admin account: ${adminToDelete?.email ?? deleteId}`,
        )

        setAdmins(prev => prev.filter(a => a.id !== deleteId))
        setDeleteId(null)
        router.refresh()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Gagal menghapus admin')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Admin</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Kelola akun admin sistem LCC</p>
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus className="w-4 h-4" />
          Tambah Admin
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {admins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <ShieldCheck className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Belum ada admin terdaftar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-10">#</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nama</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {admins.map((admin, i) => (
                    <tr key={admin.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-medium flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-accent-foreground">
                            {admin.nama.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {admin.nama}
                        {admin.id === currentUserId && (
                          <span className="text-xs text-muted-foreground">(Anda)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{admin.email}</td>
                      <td className="px-4 py-3">
                        {admin.role === 'super_admin' ? (
                          <Badge className="gap-1 font-normal">
                            <ShieldAlert className="w-3 h-3" />
                            Super Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 font-normal">
                            <ShieldCheck className="w-3 h-3" />
                            Admin
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {admin.id !== currentUserId && (
                          <Button
                            variant="ghost" size="icon"
                            className="w-7 h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteId(admin.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
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
            <DialogTitle>Tambah Admin</DialogTitle>
            <DialogDescription>Tambahkan akun admin baru untuk mengelola sistem</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input
                placeholder="Nama lengkap"
                value={form.nama}
                onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="email@lcc.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Min. 6 karakter"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as 'admin' | 'super_admin' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setError(null) }}>Batal</Button>
            <Button
              onClick={handleAdd}
              disabled={isPending || !form.nama.trim() || !form.email.trim() || !form.password.trim()}
            >
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Admin?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun admin ini akan dihapus permanen dari sistem. Tindakan ini tidak dapat dibatalkan.
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
    </div>
  )
}
