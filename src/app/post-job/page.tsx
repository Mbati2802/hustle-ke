'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePostJobModal } from '../components/PostJobModalContext'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '../components/AuthModalContext'

export default function PostJobPage() {
  const router = useRouter()
  const { openModal: openPostJobModal } = usePostJobModal()
  const { user, loading } = useAuth()
  const { openLogin } = useAuthModal()

  useEffect(() => {
    if (loading) return
    if (!user) {
      // Not logged in — open auth modal and go home
      openLogin()
      router.replace('/')
    } else {
      // Logged in — open post job modal and go to dashboard
      openPostJobModal()
      router.replace('/dashboard')
    }
  }, [user, loading, router, openPostJobModal, openLogin])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
    </div>
  )
}
