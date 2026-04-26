import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdmins } from '@/lib/actions'
import AdminClient from '@/components/dashboard/admin-client'
import { AlertCircle } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/x7Kp2m/gateway')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, nama')
    .eq('id', user.id)
    .limit(1)
    .maybeSingle()

  if (profileError) {
    console.error('Failed to load admin profile:', profileError)
    return <AdminPageError message={profileError.message} />
  }

  if (profile?.role !== 'super_admin') redirect('/dashboard')

  try {
    const admins = await getAdmins()

    return (
      <AdminClient
        initialAdmins={admins ?? []}
        currentUserId={user.id}
        currentUserName={profile.nama}
      />
    )
  } catch (error) {
    console.error('Failed to render admin management page:', error)

    return (
      <AdminPageError
        message={error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat data admin.'}
      />
    )
  }
}

function AdminPageError({ message }: { message: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Admin</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Kelola akun admin sistem LCC</p>
      </div>

      <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Halaman admin belum bisa dimuat.</p>
            <p className="mt-1">{message}</p>
            <p className="mt-2 text-destructive/80">
              Periksa koneksi Supabase, data tabel `profiles`, dan permission akun super admin pada environment website.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
