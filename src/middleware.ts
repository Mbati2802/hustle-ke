import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase-middleware'

const PROTECTED_ROUTES = ['/dashboard', '/post-job']
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password']
const ADMIN_ROUTES = ['/admin']

export async function middleware(req: NextRequest) {
  const { supabase, res } = createMiddlewareClient(req)
  const { data: { user } } = await supabase.auth.getUser()

  const path = req.nextUrl.pathname

  // Security headers
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Redirect authenticated users away from auth pages
  if (user && AUTH_ROUTES.some((r) => path.startsWith(r))) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Redirect unauthenticated users away from protected pages
  if (!user && PROTECTED_ROUTES.some((r) => path.startsWith(r))) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  // Admin route protection
  if (path.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'Admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|icons|api/auth/callback|api/mpesa/callback|api/wallet/deposit/callback).*)',
  ],
}
