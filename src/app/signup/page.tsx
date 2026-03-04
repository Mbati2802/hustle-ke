'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthModal } from '../components/AuthModalContext'
import { useAuth } from '@/contexts/AuthContext'
import LoadingLogo from '../components/LoadingLogo'

function SignupRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { openSignup } = useAuthModal()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      router.replace('/dashboard')
    } else {
      const type = searchParams.get('type') === 'client' ? 'client' : 'freelancer'
      openSignup(type)
      router.replace('/')
    }
  }, [user, router, openSignup, searchParams])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoadingLogo size="md" />
    </div>
  )
}

export default function SignupPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingLogo size="md" />
      </div>
    }>
      <SignupRedirect />
    </Suspense>
  )
}
