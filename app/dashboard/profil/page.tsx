import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfilClient from '@/components/dashboard/profil-client'

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/x7Kp2m/gateway')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).limit(1).maybeSingle()
  return <ProfilClient profile={profile} />
}
