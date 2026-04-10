import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import { getSupabaseEnv, getSupabaseServiceRoleKey } from './config'

export function createAdminClient() {
  const { url } = getSupabaseEnv()
  const serviceRoleKey = getSupabaseServiceRoleKey()

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function createCredentialClient() {
  const { url, anonKey } = getSupabaseEnv()

  return createSupabaseClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
