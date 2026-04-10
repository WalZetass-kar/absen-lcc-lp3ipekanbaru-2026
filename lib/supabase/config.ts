function sanitizeEnvValue(value: string | undefined, name: string) {
  const sanitized = value?.trim().replace(/^<|>$/g, '')

  if (!sanitized) {
    throw new Error(`Missing Supabase environment variable: ${name}`)
  }

  return sanitized
}

export function getSupabaseEnv() {
  return {
    url: sanitizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: sanitizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  }
}

export function getSupabaseServiceRoleKey() {
  return sanitizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY')
}

export function getStudentSessionSecret() {
  return sanitizeEnvValue(process.env.STUDENT_SESSION_SECRET, 'STUDENT_SESSION_SECRET')
}
