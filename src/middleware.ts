import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase-middleware'
import { enforceCSRF, getOrGenerateCSRFToken, setCSRFCookie } from '@/lib/csrf'

const PROTECTED_ROUTES = ['/dashboard', '/post-job']
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password']

// Security headers applied to every response
function applySecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://www.google.com https://vercel.live wss://*.supabase.co",
    "frame-src 'self' https://www.google.com https://vercel.live",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')
  response.headers.set('Content-Security-Policy', csp)
}

// Helper: create a redirect with security headers + CSRF cookie
function secureRedirect(url: URL, req: NextRequest): NextResponse {
  const redirect = NextResponse.redirect(url)
  applySecurityHeaders(redirect)
  const csrfToken = getOrGenerateCSRFToken(req)
  setCSRFCookie(redirect, csrfToken)
  return redirect
}

export async function middleware(req: NextRequest) {
  const { supabase, res } = createMiddlewareClient(req)
  
  // CSRF Protection: Enforce for state-changing operations
  const csrfError = enforceCSRF(req)
  if (csrfError) {
    return csrfError
  }
  
  // Handle auth errors gracefully (e.g., expired refresh tokens)
  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error && error.message?.includes('refresh_token_not_found')) {
      res.cookies.delete('sb-access-token')
      res.cookies.delete('sb-refresh-token')
    } else {
      user = data.user
    }
  } catch (error) {
    console.error('Auth error in middleware:', error)
  }

  const path = req.nextUrl.pathname

  // Redirect authenticated users away from auth pages
  if (user && AUTH_ROUTES.some((r) => path.startsWith(r))) {
    return secureRedirect(new URL('/dashboard', req.url), req)
  }

  // Redirect unauthenticated users away from protected pages
  if (!user && PROTECTED_ROUTES.some((r) => path.startsWith(r))) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirect', path)
    return secureRedirect(redirectUrl, req)
  }

  // Admin route protection
  if (path.startsWith('/admin')) {
    if (!user) {
      return secureRedirect(new URL('/login', req.url), req)
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'Admin') {
      return secureRedirect(new URL('/', req.url), req)
    }
  }

  // Apply security headers and CSRF cookie to the normal response
  applySecurityHeaders(res)
  const csrfToken = getOrGenerateCSRFToken(req)
  setCSRFCookie(res, csrfToken)

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|icons|api/auth/callback|api/mpesa/callback|api/wallet/deposit/callback).*)',
  ],
}
