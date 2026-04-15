import { updateSession } from '@/lib/supabase/proxy'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const adminLoginRoutes = ['/auth/x7Kp2m/gateway', '/auth/login']
  const studentLoginRoutes = ['/auth/mahasiswa/login', '/student/login']
  const publicRoutes = [...adminLoginRoutes, ...studentLoginRoutes, '/login', '/lcc']
  const isPublicRoute = publicRoutes.includes(pathname)

  const { response: supabaseResponse, user } = await updateSession(request)
  const studentSessionId = request.cookies.get('student_session_id')?.value

  if (user && adminLoginRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (studentSessionId && studentLoginRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/student/dashboard', request.url))
  }

  if (studentSessionId && pathname === '/') {
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
    if (!studentSessionId) {
      return NextResponse.redirect(new URL('/auth/mahasiswa/login', request.url))
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
