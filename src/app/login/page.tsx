'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthModal } from '../components/AuthModalContext'
import { useAuth } from '@/contexts/AuthContext'

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
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
    </div>
  )
}
