/**
 * React hook for CSRF token management
 * 
 * Provides CSRF token for client-side API requests
 */

import { useEffect, useState } from 'react'

export function useCSRFToken() {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Extract CSRF token from cookie
    const cookies = document.cookie.split(';')
    const csrfCookie = cookies.find(c => c.trim().startsWith('csrf-token='))
    
    if (csrfCookie) {
      const tokenValue = csrfCookie.split('=')[1]
      setToken(tokenValue)
    }
  }, [])

  return token
}

/**
 * Get CSRF token from cookie (synchronous)
 */
export function getCSRFToken(): string | null {
  if (typeof document === 'undefined') return null
  
  const cookies = document.cookie.split(';')
  const csrfCookie = cookies.find(c => c.trim().startsWith('csrf-token='))
  
  if (csrfCookie) {
    return csrfCookie.split('=')[1]
  }
  
  return null
}

/**
 * Add CSRF token to fetch headers
 */
export function withCSRF(headers: HeadersInit = {}): HeadersInit {
  const token = getCSRFToken()
  
  if (!token) {
    console.warn('CSRF token not found. Request may fail.')
    return headers
  }

  return {
    ...headers,
    'x-csrf-token': token,
  }
}
