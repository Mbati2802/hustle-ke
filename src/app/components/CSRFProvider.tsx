'use client'

import { useEffect } from 'react'
import { installCSRFInterceptor } from '@/hooks/useCSRFToken'

export default function CSRFProvider() {
  useEffect(() => {
    installCSRFInterceptor()
  }, [])

  return null
}
