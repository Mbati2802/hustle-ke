'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthModal } from '../components/AuthModalContext'
import { useAuth } from '@/contexts/AuthContext'
import LoadingLogo from '../components/LoadingLogo'

export default function LoginPage() {
  const router = useRouter()
  const { openLogin } = useAuthModal()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      router.replace('/dashboard')
    } else {
      openLogin()
      router.replace('/')
    }
  }, [user, router, openLogin])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoadingLogo size="md" />
    </div>
  )
}
