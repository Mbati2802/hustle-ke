'use client'

import { installCSRFInterceptor } from '@/hooks/useCSRFToken'

// Install immediately when this module loads on the client.
// This ensures the interceptor is ready BEFORE any React useEffect hooks run,
// since useEffect runs bottom-up (children first) and CSRFProvider's effect
// would run AFTER all child component effects — too late for early POST calls.
if (typeof window !== 'undefined') {
  installCSRFInterceptor()
}

export default function CSRFProvider() {
  return null
}
