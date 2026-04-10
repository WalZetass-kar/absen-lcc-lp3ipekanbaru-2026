import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

import { getStudentSessionSecret } from './supabase/config'

const STUDENT_SESSION_COOKIE = 'student_session_id'
const STUDENT_SESSION_MAX_AGE = 60 * 60 * 24 * 7

function sign(payload: string) {
  return createHmac('sha256', getStudentSessionSecret()).update(payload).digest('hex')
}

function buildToken(userId: string) {
  const expiresAt = Date.now() + STUDENT_SESSION_MAX_AGE * 1000
  const payload = `${userId}.${expiresAt}`
  const signature = sign(payload)

  return `${payload}.${signature}`
}

function parseToken(token: string) {
  const [userId, expiresAtRaw, signature] = token.split('.')

  if (!userId || !expiresAtRaw || !signature) {
    return null
  }

  const payload = `${userId}.${expiresAtRaw}`
  const expectedSignature = sign(payload)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null
  }

  const expiresAt = Number(expiresAtRaw)
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return null
  }

  return { userId }
}

export async function setStudentSessionCookie(userId: string) {
  const cookieStore = await cookies()
  cookieStore.set(STUDENT_SESSION_COOKIE, buildToken(userId), {
    httpOnly: true,
    maxAge: STUDENT_SESSION_MAX_AGE,
    path: '/',
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  })
}

export async function clearStudentSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(STUDENT_SESSION_COOKIE)
}

export async function getStudentSessionUserId() {
  const cookieStore = await cookies()
  const token = cookieStore.get(STUDENT_SESSION_COOKIE)?.value

  if (!token) {
    return null
  }

  return parseToken(token)?.userId ?? null
}
