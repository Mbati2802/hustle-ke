/**
 * CSRF Protection Utilities
 * 
 * Implements Cross-Site Request Forgery protection for all state-changing operations.
 * Uses double-submit cookie pattern with cryptographically secure tokens.
 * 
 * IMPORTANT: Uses Web Crypto API (not Node.js crypto) for Edge Runtime compatibility.
 */

import { NextRequest, NextResponse } from 'next/server'

const CSRF_TOKEN_LENGTH = 32
const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Convert a Uint8Array to hex string
 */
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate a cryptographically secure CSRF token using Web Crypto API
 */
export function generateCSRFToken(): string {
  const bytes = new Uint8Array(CSRF_TOKEN_LENGTH)
  crypto.getRandomValues(bytes)
  return toHex(bytes)
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Uses XOR comparison — runs in constant time regardless of where strings differ.
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Validate CSRF token from request
 * Uses constant-time comparison to prevent timing attacks
 */
export function validateCSRFToken(req: NextRequest): boolean {
  const headerToken = req.headers.get(CSRF_HEADER_NAME)
  const cookieToken = req.cookies.get(CSRF_COOKIE_NAME)?.value

  // Both tokens must be present
  if (!headerToken || !cookieToken) {
    return false
  }

  // Validate hex format and matching length
  if (headerToken.length !== CSRF_TOKEN_LENGTH * 2 || cookieToken.length !== CSRF_TOKEN_LENGTH * 2) {
    return false
  }

  // Constant-time comparison
  return constantTimeEqual(headerToken, cookieToken)
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
  '/api/ai/chat', // Live chat AI (auth-protected separately)
  '/api/support/tickets', // Support ticket creation/listing (auth-protected)
  '/api/support/typing', // Typing indicator (auth-protected)
  '/api/support/disputes', // Dispute creation from chat (auth-protected)
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
