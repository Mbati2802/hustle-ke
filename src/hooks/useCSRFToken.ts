/**
 * CSRF Token Management
 * 
 * Provides CSRF token for client-side API requests.
 * Includes a global fetch interceptor that auto-injects the CSRF header
 * into all state-changing requests (POST/PUT/DELETE/PATCH).
 */

import { useEffect, useState } from 'react'

const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH']

export function useCSRFToken() {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    setToken(getCSRFToken())
  }, [])

  return token
}

/**
 * Get CSRF token from cookie (synchronous)
 */
export function getCSRFToken(): string | null {
  if (typeof document === 'undefined') return null
  
  const cookies = document.cookie.split(';')
  const csrfCookie = cookies.find(c => c.trim().startsWith(`${CSRF_COOKIE_NAME}=`))
  
  if (csrfCookie) {
    return csrfCookie.split('=')[1]?.trim() || null
  }
  
  return null
}

/**
 * Add CSRF token to fetch headers
 */
export function withCSRF(headers: HeadersInit = {}): HeadersInit {
  const token = getCSRFToken()
  
  if (!token) {
    return headers
  }

  return {
    ...headers,
    [CSRF_HEADER_NAME]: token,
  }
}

/**
 * Install a global fetch interceptor that auto-injects CSRF tokens.
 * Call once at app startup. Safe to call multiple times (idempotent).
 */
let _installed = false
export function installCSRFInterceptor(): void {
  if (_installed) return
  if (typeof window === 'undefined') return
  _installed = true

  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const method = (init?.method || 'GET').toUpperCase()

    // Only inject for state-changing methods
    if (STATE_CHANGING_METHODS.includes(method)) {
      const token = getCSRFToken()
      if (token) {
        const headers = new Headers(init?.headers)
        // Don't overwrite if already set
        if (!headers.has(CSRF_HEADER_NAME)) {
          headers.set(CSRF_HEADER_NAME, token)
        }
        init = { ...init, headers }
      }
    }

    const response = await originalFetch(input, init)

    // Auto-retry once on CSRF failure — the 403 response sets a fresh cookie
    if (response.status === 403 && STATE_CHANGING_METHODS.includes(method)) {
      try {
        const cloned = response.clone()
        const body = await cloned.json()
        if (body?.code === 'CSRF_FAILED') {
          // Small delay for the browser to process the Set-Cookie from the 403 response
          await new Promise(r => setTimeout(r, 50))
          const freshToken = getCSRFToken()
          if (freshToken) {
            const retryHeaders = new Headers(init?.headers)
            retryHeaders.set(CSRF_HEADER_NAME, freshToken)
            return originalFetch(input, { ...init, headers: retryHeaders })
          }
        }
      } catch {
        // If retry parsing fails, return the original response
      }
    }

    return response
  }
}
