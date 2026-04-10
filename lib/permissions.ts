import { createClient } from '@/lib/supabase/server'

export type Permission = 'view_mahasiswa' | 'edit_mahasiswa' | 'view_absensi' | 'edit_absensi' | 'view_riwayat' | 'view_rekap' | 'view_log' | 'manage_admin' | 'change_password'

export async function checkPermission(permission: Permission): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isSuperAdmin = profile?.role === 'super_admin'

  // Define permission matrix
  const permissions: Record<string, string[]> = {
    'view_mahasiswa': ['admin', 'super_admin'],
    'edit_mahasiswa': ['admin', 'super_admin'],
    'view_absensi': ['admin', 'super_admin'],
    'edit_absensi': ['admin', 'super_admin'],
    'view_riwayat': ['admin', 'super_admin'],
    'view_rekap': ['admin', 'super_admin'],
    'view_log': ['super_admin'],
    'manage_admin': ['super_admin'],
    'change_password': ['admin', 'super_admin'],
  }

  return permissions[permission]?.includes(profile?.role || '') ?? false
}

export async function requirePermission(permission: Permission): Promise<void> {
  const allowed = await checkPermission(permission)
  if (!allowed) throw new Error(`Permission denied: ${permission}`)
}

export async function getCurrentUserRole(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role || null
}
