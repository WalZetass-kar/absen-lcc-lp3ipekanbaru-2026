import 'server-only'

import type { User } from '@supabase/supabase-js'

import { ValidationError } from './errors'
import { createAdminClient, createCredentialClient } from './supabase/admin'

const MEMBER_EMAIL_DOMAIN = 'mcc.local'
const SUPABASE_MIN_PASSWORD_LENGTH = 6

type EnsureMemberAuthUserInput = {
  memberId?: string
  nim: string
  nama: string
  prodi: string
  password?: string
  mustChangePassword?: boolean
  syncPassword?: boolean
}

type MemberAuthFlags = {
  mustChangePassword: boolean
}

type SyncMemberAuthUserByIdInput = {
  userId: string
} & Omit<EnsureMemberAuthUserInput, 'password' | 'syncPassword'>

function getAuthErrorMessage(error: { message?: string } | null | undefined) {
  return error?.message?.toLowerCase() ?? ''
}

function isMemberAuthUser(user: User) {
  return user.app_metadata?.account_type === 'member'
    || user.email?.toLowerCase().endsWith(`@${MEMBER_EMAIL_DOMAIN}`) === true
}

export function normalizeNim(value: string) {
  const normalized = value.trim()

  if (!normalized) {
    throw new ValidationError('NIM wajib diisi')
  }

  if (normalized.length < 3) {
    throw new ValidationError('NIM minimal 3 karakter')
  }

  if (normalized.length > 50) {
    throw new ValidationError('NIM maksimal 50 karakter')
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(normalized)) {
    throw new ValidationError('NIM hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda minus')
  }

  return normalized.toLowerCase()
}

export function buildMemberEmail(nim: string) {
  return `${normalizeNim(nim)}@${MEMBER_EMAIL_DOMAIN}`
}

function getPasswordCandidates(nim: string, password: string) {
  const normalizedNim = normalizeNim(nim)
  const candidates = [password]

  // Try lowercase version of password
  if (password !== password.toLowerCase()) {
    candidates.push(password.toLowerCase())
  }

  // Try normalized NIM as password
  if (!candidates.includes(normalizedNim)) {
    candidates.push(normalizedNim)
  }

  // Akun mahasiswa lama menggunakan password default = NIM.
  // Jika NIM lebih pendek dari 6 karakter, password disimpan dengan padding
  // karena Supabase Auth mewajibkan panjang minimal 6 karakter.
  if (normalizedNim.length < SUPABASE_MIN_PASSWORD_LENGTH) {
    const paddedPassword = normalizedNim.padEnd(SUPABASE_MIN_PASSWORD_LENGTH, '0')
    if (!candidates.includes(paddedPassword)) {
      candidates.push(paddedPassword)
    }
  }

  return candidates
}


async function findAuthUserByEmail(email: string) {
  const admin = createAdminClient()
  let page = 1

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    })

    if (error) {
      throw new Error(error.message || 'Gagal membaca data user Supabase Auth')
    }

    const users = data.users ?? []
    const existingUser = users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null

    if (existingUser) {
      return existingUser
    }

    if (users.length < 200) {
      return null
    }

    page += 1
  }
}

export async function listMemberAuthUsers() {
  const admin = createAdminClient()
  const users: User[] = []
  let page = 1

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    })

    if (error) {
      throw new Error(error.message || 'Gagal membaca data user Supabase Auth')
    }

    const currentUsers = (data.users ?? []).filter(isMemberAuthUser)
    users.push(...currentUsers)

    if ((data.users ?? []).length < 200) {
      return users
    }

    page += 1
  }
}

export async function getMemberAuthUserIdByNim(nim: string) {
  const normalizedNim = normalizeNim(nim)
  const email = buildMemberEmail(normalizedNim)
  const user = await findAuthUserByEmail(email)

  return user?.id ?? null
}

export async function getMemberAuthUserIdsByNim(nims: string[]) {
  const normalizedNims = Array.from(new Set(
    nims
      .map((nim) => nim?.trim())
      .filter((nim): nim is string => Boolean(nim))
      .map((nim) => normalizeNim(nim)),
  ))

  if (normalizedNims.length === 0) {
    return new Map<string, string>()
  }

  const users = await listMemberAuthUsers()
  const userIdsByNim = new Map<string, string>()

  for (const user of users) {
    const userNim = typeof user.user_metadata?.nim === 'string'
      ? normalizeNim(user.user_metadata.nim)
      : typeof user.email === 'string'
        ? normalizeNim(user.email.split('@')[0] ?? '')
        : null

    if (userNim && normalizedNims.includes(userNim)) {
      userIdsByNim.set(userNim, user.id)
    }
  }

  return userIdsByNim
}

export async function getAuthUserById(userId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.getUserById(userId)

  if (error) {
    throw new Error(error.message || 'Gagal membaca user Supabase Auth')
  }

  return data.user
}

export async function getMemberAuthFlags(userId: string): Promise<MemberAuthFlags> {
  const user = await getAuthUserById(userId)

  return {
    mustChangePassword: Boolean(user.app_metadata?.must_change_password),
  }
}

async function updateMemberMetadata(user: User, input: EnsureMemberAuthUserInput) {
  const admin = createAdminClient()
  const nextAppMetadata: Record<string, unknown> = {
    ...user.app_metadata,
    account_type: 'member',
    must_change_password: Boolean(input.mustChangePassword),
  }

  if (input.memberId) {
    nextAppMetadata.member_id = input.memberId
  }

  const nextUserMetadata = {
    ...user.user_metadata,
    nim: normalizeNim(input.nim),
    nama: input.nama.trim(),
    prodi: input.prodi,
  }

  const updatePayload: {
    app_metadata: Record<string, unknown>
    email_confirm?: boolean
    password?: string
    user_metadata: Record<string, unknown>
  } = {
    app_metadata: nextAppMetadata,
    email_confirm: true,
    user_metadata: nextUserMetadata,
  }

  if (input.password && input.syncPassword) {
    updatePayload.password = input.password
  }

  const { data, error } = await admin.auth.admin.updateUserById(user.id, updatePayload)

  if (error || !data.user) {
    throw new Error(error?.message || 'Gagal memperbarui metadata user anggota')
  }

  return data.user
}

export async function ensureMemberAuthUser(input: EnsureMemberAuthUserInput) {
  const admin = createAdminClient()
  const normalizedNim = normalizeNim(input.nim)
  const email = buildMemberEmail(normalizedNim)
  
  console.log('[ensureMemberAuthUser] Starting', { nim: input.nim, normalizedNim, email })
  
  const nextAppMetadata: Record<string, unknown> = {
    account_type: 'member',
    must_change_password: Boolean(input.mustChangePassword),
  }

  if (input.memberId) {
    nextAppMetadata.member_id = input.memberId
  }

  const nextUserMetadata = {
    nim: normalizedNim,
    nama: input.nama.trim(),
    prodi: input.prodi,
  }

  let created = false
  let user = await findAuthUserByEmail(email)

  console.log('[ensureMemberAuthUser] User lookup result:', { found: !!user, email })

  if (!user) {
    // Supabase requires passwords of at least 6 characters.
    // If the NIM is shorter, pad it to meet the minimum requirement.
    let password = input.password ?? normalizedNim
    if (password.length < SUPABASE_MIN_PASSWORD_LENGTH) {
      password = password.padEnd(SUPABASE_MIN_PASSWORD_LENGTH, '0')
    }

    console.log('[ensureMemberAuthUser] Creating new user', { 
      email, 
      passwordLength: password.length,
      metadata: nextUserMetadata 
    })

    const { data, error } = await admin.auth.admin.createUser({
      app_metadata: nextAppMetadata,
      email,
      email_confirm: true,
      password,
      user_metadata: nextUserMetadata,
    })

    if (error || !data.user) {
      console.error('[ensureMemberAuthUser] Supabase createUser failed:', {
        email,
        errorMessage: error?.message,
        errorStatus: (error as any)?.status,
        errorCode: (error as any)?.code,
        fullError: error,
      })
      throw new Error(error?.message || 'Gagal membuat akun anggota di Supabase Auth')
    }

    console.log('[ensureMemberAuthUser] User created successfully', { 
      userId: data.user.id, 
      email: data.user.email 
    })

    created = true
    user = data.user
  } else {
    console.log('[ensureMemberAuthUser] User already exists, updating metadata')
    user = await updateMemberMetadata(user, input)
  }

  console.log('[ensureMemberAuthUser] Completed', { 
    created, 
    userId: user.id, 
    email 
  })

  return {
    created,
    email,
    userId: user.id,
  }
}

export async function syncMemberAuthUserById(input: SyncMemberAuthUserByIdInput) {
  const user = await getAuthUserById(input.userId)
  const updatedUser = await updateMemberMetadata(user, input)

  return {
    email: updatedUser.email ?? buildMemberEmail(input.nim),
    userId: updatedUser.id,
  }
}

export async function verifyMemberCredentials(nim: string, password: string) {
  const credentialClient = createCredentialClient()
  const email = buildMemberEmail(nim)
  const passwordCandidates = getPasswordCandidates(nim, password)

  console.log('[verifyMemberCredentials] Attempting login:', {
    nim,
    email,
    passwordCandidatesCount: passwordCandidates.length,
  })

  for (const candidatePassword of passwordCandidates) {
    console.log('[verifyMemberCredentials] Trying password candidate')
    const { data, error } = await credentialClient.auth.signInWithPassword({
      email,
      password: candidatePassword,
    })

    if (error) {
      console.log('[verifyMemberCredentials] Login failed:', error.message)
      continue
    }

    if (data.user) {
      console.log('[verifyMemberCredentials] Login successful')
      return {
        email,
        mustChangePassword: Boolean(data.user.app_metadata?.must_change_password),
        userId: data.user.id,
      }
    }
  }

  console.log('[verifyMemberCredentials] All password candidates failed')
  return null
}

export async function updateMemberPassword(
  userId: string,
  password: string,
  mustChangePassword: boolean,
) {
  const admin = createAdminClient()
  const user = await getAuthUserById(userId)
  const { data, error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...user.app_metadata,
      must_change_password: mustChangePassword,
    },
    password,
  })

  if (error || !data.user) {
    throw new Error(error?.message || 'Gagal memperbarui password anggota')
  }

  return data.user
}

export async function deleteMemberAuthUser(userId: string) {
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)

  const message = getAuthErrorMessage(error)
  if (message.includes('user not found')) {
    return
  }

  if (error) {
    throw new Error(error.message || 'Gagal menghapus akun Supabase Auth anggota')
  }
}
