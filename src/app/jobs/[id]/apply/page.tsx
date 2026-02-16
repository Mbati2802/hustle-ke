'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApplyJobModal } from '../../../components/ApplyJobModalContext'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '../../../components/AuthModalContext'

export default function ApplyJobPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { openModal: openApplyModal } = useApplyJobModal()
  const { user, loading } = useAuth()
  const { openLogin } = useAuthModal()
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (loading) return

    if (!user) {
      openLogin()
      router.replace(`/jobs/${params.id}`)
      return
    }

    // Fetch the job and open the apply modal
    fetch(`/api/jobs/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.job) {
          openApplyModal(data.job)
        }
        router.replace(`/jobs/${params.id}`)
      })
      .catch(() => {
        router.replace(`/jobs/${params.id}`)
      })
  }, [loading, user, params.id, router, openApplyModal, openLogin])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
    </div>
  )
}
