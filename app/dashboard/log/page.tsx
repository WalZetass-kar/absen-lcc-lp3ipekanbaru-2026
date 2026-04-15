import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogClient from '@/components/dashboard/log-client'

export default async function LogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/x7Kp2m/gateway')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const { data } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  return <LogClient initialData={data ?? []} />
}
