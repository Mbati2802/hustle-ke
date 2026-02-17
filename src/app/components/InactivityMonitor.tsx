'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { InactivityTimer } from '@/lib/inactivity-timeout'
import { AlertTriangle, X } from 'lucide-react'

export default function InactivityMonitor() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (!user) return

    const timer = new InactivityTimer(
      // On warning (25 minutes)
      () => {
        setShowWarning(true)
        setCountdown(5)
      },
      // On logout (30 minutes)
      async () => {
        await logout()
        router.push('/')
      }
    )

    timer.start()

    return () => {
      timer.stop()
    }
  }, [user, logout, router])

  useEffect(() => {
    if (!showWarning) return

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [showWarning])

  const handleStayLoggedIn = () => {
    setShowWarning(false)
    setCountdown(5)
    // Activity will reset the timer automatically
  }

  if (!showWarning || !user) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Still there?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              You've been inactive for a while. For your security, you'll be logged out in{' '}
              <span className="font-semibold text-amber-600">{countdown} minute{countdown !== 1 ? 's' : ''}</span>{' '}
              unless you continue your session.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleStayLoggedIn}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
              >
                Stay Logged In
              </button>
              <button
                onClick={async () => {
                  await logout()
                  router.push('/')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium text-sm"
              >
                Log Out
              </button>
            </div>
          </div>
          <button
            onClick={handleStayLoggedIn}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
