import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdmins } from '@/lib/actions'
import AdminClient from '@/components/dashboard/admin-client'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/admin/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const admins = await getAdmins()

  return <AdminClient initialAdmins={admins ?? []} currentUserId={user.id} />
}
