import 'server-only'

import type { User } from '@supabase/supabase-js'

import { ValidationError } from './errors'
import { createAdminClient, createCredentialClient } from './supabase/admin'

const MEMBER_EMAIL_DOMAIN = 'mcc.local'

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

function getAuthErrorMessage(error: { message?: string } | null | undefined) {
  return error?.message?.toLowerCase() ?? ''
}

export function normalizeNim(value: string) {
  const normalized = value.trim()

  if (!normalized) {
    throw new ValidationError('NIM wajib diisi')
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(normalized)) {
    throw new ValidationError('NIM hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda minus')
  }

  return normalized.toLowerCase()
}

export function buildMemberEmail(nim: string) {
  return `${normalizeNim(nim)}@${MEMBER_EMAIL_DOMAIN}`
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

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      app_metadata: nextAppMetadata,
      email,
      email_confirm: true,
      password: input.password ?? normalizedNim,
      user_metadata: nextUserMetadata,
    })

    if (error || !data.user) {
      throw new Error(error?.message || 'Gagal membuat akun anggota di Supabase Auth')
    }

    created = true
    user = data.user
  } else {
    user = await updateMemberMetadata(user, input)
  }

  return {
    created,
    email,
    userId: user.id,
  }
}

export async function verifyMemberCredentials(nim: string, password: string) {
  const credentialClient = createCredentialClient()
  const email = buildMemberEmail(nim)
  const { data, error } = await credentialClient.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.user) {
    return null
  }

  return {
    email,
    mustChangePassword: Boolean(data.user.app_metadata?.must_change_password),
    userId: data.user.id,
  }
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
