import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/history', '/api-keys', '/profile', '/settings', '/admin']
const AUTH_PATHS = ['/login', '/signup']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth_token')?.value
  const isAuthenticated = !!token

  if (PROTECTED_PATHS.some(path => pathname.startsWith(path))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (pathname.startsWith('/admin')) {
      const userRole = request.cookies.get('user_role')?.value
      if (userRole !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
  }

  if (AUTH_PATHS.some(path => pathname.startsWith(path))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/history/:path*',
    '/api-keys/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/login',
    '/signup',
  ],
}
