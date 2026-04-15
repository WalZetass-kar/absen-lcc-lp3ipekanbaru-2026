import { updateSession } from '@/lib/supabase/proxy'
import { type NextRequest, NextResponse } from 'next/server'

const STUDENT_SESSION_COOKIE = 'student_session_id'

function sanitizeSecret(value: string | undefined) {
  return value?.trim().replace(/^<|>$/g, '') ?? ''
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) {
    return false
  }

  let mismatch = 0

  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }

  return mismatch === 0
}

async function signStudentSessionPayload(payload: string) {
  const secret = sanitizeSecret(process.env.STUDENT_SESSION_SECRET)

  if (!secret) {
    return null
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function hasValidStudentSessionToken(token?: string) {
  if (!token) {
    return false
  }

  const [userId, expiresAtRaw, signature] = token.split('.')

  if (!userId || !expiresAtRaw || !signature) {
    return false
  }

  const expiresAt = Number(expiresAtRaw)

  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return false
  }

  const expectedSignature = await signStudentSessionPayload(`${userId}.${expiresAtRaw}`)

  if (!expectedSignature) {
    return false
  }

  return constantTimeEqual(signature, expectedSignature)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const adminLoginRoutes = ['/auth/x7Kp2m/gateway', '/auth/login']
  const studentLoginRoutes = ['/auth/mahasiswa/login', '/student/login']
  const publicRoutes = [...adminLoginRoutes, ...studentLoginRoutes, '/login', '/lcc']
  const isPublicRoute = publicRoutes.includes(pathname)

  const { response: supabaseResponse, user } = await updateSession(request)
  const studentSessionToken = request.cookies.get(STUDENT_SESSION_COOKIE)?.value
  const hasStudentSession = await hasValidStudentSessionToken(studentSessionToken)

  if (studentSessionToken && !hasStudentSession) {
    supabaseResponse.cookies.delete(STUDENT_SESSION_COOKIE)
  }

  if (user && adminLoginRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (hasStudentSession && studentLoginRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/student/dashboard', request.url))
  }

  if (hasStudentSession && pathname === '/') {
    return NextResponse.redirect(new URL('/student/dashboard', request.url))
  }

  if (isPublicRoute) {
    return supabaseResponse
  }

  // Protect admin dashboard - requires Supabase auth
  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/x7Kp2m/gateway', request.url))
  }

  // Protect student routes - requires student session
  if (pathname.startsWith('/student') && pathname !== '/student/login') {
    if (!hasStudentSession) {
      const response = NextResponse.redirect(new URL('/auth/mahasiswa/login', request.url))

      if (studentSessionToken) {
        response.cookies.delete(STUDENT_SESSION_COOKIE)
      }

      return response
    }
  }

  if (user && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
