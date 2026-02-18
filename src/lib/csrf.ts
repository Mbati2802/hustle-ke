/**
 * CSRF Protection Utilities
 * 
 * Implements Cross-Site Request Forgery protection for all state-changing operations.
 * Uses double-submit cookie pattern with cryptographically secure tokens.
 */

import { randomBytes, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

const CSRF_TOKEN_LENGTH = 32
const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

/**
 * Validate CSRF token from request
 * Uses timing-safe comparison to prevent timing attacks
 */
export function validateCSRFToken(req: NextRequest): boolean {
  const headerToken = req.headers.get(CSRF_HEADER_NAME)
  const cookieToken = req.cookies.get(CSRF_COOKIE_NAME)?.value

  // Both tokens must be present
  if (!headerToken || !cookieToken) {
    return false
  }

  // Use timing-safe comparison to prevent timing attacks
  try {
    const headerBuffer = Buffer.from(headerToken, 'hex')
    const cookieBuffer = Buffer.from(cookieToken, 'hex')

    // Tokens must be same length
    if (headerBuffer.length !== cookieBuffer.length) {
      return false
    }

    return timingSafeEqual(headerBuffer, cookieBuffer)
  } catch {
    return false
  }
}

/**
 * Set CSRF token cookie on response
 */
export function setCSRFCookie(res: NextResponse, token: string): void {
  res.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  })
}

/**
 * Get or generate CSRF token for request
 */
export function getOrGenerateCSRFToken(req: NextRequest): string {
  const existingToken = req.cookies.get(CSRF_COOKIE_NAME)?.value
  if (existingToken && existingToken.length === CSRF_TOKEN_LENGTH * 2) {
    return existingToken
  }
  return generateCSRFToken()
}

/**
 * Check if request method requires CSRF protection
 */
export function requiresCSRFProtection(method: string): boolean {
  return ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())
}

/**
 * Paths that are exempt from CSRF protection
 * (e.g., webhook callbacks from external services)
 */
const CSRF_EXEMPT_PATHS = [
  '/api/wallet/deposit/callback', // M-Pesa callback
  '/api/auth/callback', // OAuth callback
]

/**
 * Check if path is exempt from CSRF protection
 */
export function isCSRFExempt(pathname: string): boolean {
  return CSRF_EXEMPT_PATHS.some(exemptPath => pathname.startsWith(exemptPath))
}

/**
 * Middleware helper to enforce CSRF protection
 */
export function enforceCSRF(req: NextRequest): NextResponse | null {
  // Skip if method doesn't require CSRF protection
  if (!requiresCSRFProtection(req.method)) {
    return null
  }

  // Skip if path is exempt
  const pathname = new URL(req.url).pathname
  if (isCSRFExempt(pathname)) {
    return null
  }

  // Validate CSRF token
  if (!validateCSRFToken(req)) {
    return new NextResponse(
      JSON.stringify({
        error: 'CSRF token validation failed. Please refresh the page and try again.',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }

  return null
}
