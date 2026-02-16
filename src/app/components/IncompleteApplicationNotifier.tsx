'use client'

import { useEffect, useState } from 'react'
import { Bell, X, Clock, AlertTriangle } from 'lucide-react'

interface ApplicationProgress {
  jobId: string
  jobTitle: string
  coverLetter: string
  bidAmount: number
  duration: number
  startedAt: number
  lastSaved: number
}

interface IncompleteApplication {
  jobId: string
  timeElapsed: number
  jobTitle: string
}

export default function IncompleteApplicationNotifier() {
  const [showNotifications, setShowNotifications] = useState(false)
  const [incompleteApplications, setIncompleteApplications] = useState<IncompleteApplication[]>([])

  useEffect(() => {
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Check for incomplete applications every 5 minutes
    checkIncompleteApplications()
    const interval = setInterval(checkIncompleteApplications, 5 * 60 * 1000)

    // Add keyboard shortcut to view applications (Ctrl+Shift+A)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        setShowNotifications(true)
        checkIncompleteApplications()
      }
    }

    document.addEventListener('keydown', handleKeyPress)

    return () => {
      clearInterval(interval)
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [])

  const checkIncompleteApplications = () => {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('application_'))
      const incompleteApps: IncompleteApplication[] = []

      keys.forEach(key => {
        try {
          const progress: ApplicationProgress = JSON.parse(localStorage.getItem(key)!)
          const timeElapsed = Date.now() - progress.lastSaved
          
          // Clean up applications older than 7 days
          if (timeElapsed > 7 * 24 * 60 * 60 * 1000) {
            localStorage.removeItem(key)
            return
          }
          
          // Check if application is incomplete and older than 30 minutes
          if (timeElapsed > 30 * 60 * 1000) { // 30 minutes
            incompleteApps.push({
              jobId: progress.jobId,
              timeElapsed,
              jobTitle: progress.jobTitle
            })
          }
        } catch (error) {
          console.error('Error checking application:', error)
          // Remove corrupted entries
          localStorage.removeItem(key)
        }
      })

      if (incompleteApps.length > 0) {
        setIncompleteApplications(incompleteApps)
        setShowNotifications(true)
        sendBrowserNotifications(incompleteApps)
      }
    } catch (error) {
      console.error('Error checking incomplete applications:', error)
    }
  }

  const sendBrowserNotifications = (apps: IncompleteApplication[]) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      apps.forEach(app => {
        const hours = Math.floor(app.timeElapsed / (60 * 60 * 1000))
        const minutes = Math.floor((app.timeElapsed % (60 * 60 * 1000)) / (60 * 1000))
        
        new Notification('Incomplete Job Application', {
          body: `You have an incomplete application for ${app.jobTitle} that's been pending for ${hours}h ${minutes}m.`,
          icon: '/favicon.ico',
          tag: `incomplete-app-${app.jobId}`,
          requireInteraction: true
        })
      })
    }
  }

  const formatTimeElapsed = (timeElapsed: number) => {
    const hours = Math.floor(timeElapsed / (60 * 60 * 1000))
    const minutes = Math.floor((timeElapsed % (60 * 60 * 1000)) / (60 * 1000))
    
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days} day${days > 1 ? 's' : ''} ago`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ago`
    } else {
      return `${minutes} minutes ago`
    }
  }

  const clearApplication = (jobId: string) => {
    localStorage.removeItem(`application_${jobId}`)
    setIncompleteApplications(prev => prev.filter(app => app.jobId !== jobId))
    
    if (incompleteApplications.length === 1) {
      setShowNotifications(false)
    }
  }

  const clearAllApplications = () => {
    incompleteApplications.forEach(app => {
      localStorage.removeItem(`application_${app.jobId}`)
    })
    setIncompleteApplications([])
    setShowNotifications(false)
  }

  if (!showNotifications || incompleteApplications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-white" />
              <h3 className="font-semibold text-white">
                Incomplete Applications
              </h3>
            </div>
            <button
              onClick={() => setShowNotifications(false)}
              className="text-white hover:text-amber-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-amber-100 text-sm mt-1">
            {incompleteApplications.length} application{incompleteApplications.length > 1 ? 's' : ''} pending
          </p>
          <p className="text-amber-200 text-xs mt-1 opacity-75">
            Press Ctrl+Shift+A to view anytime
          </p>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {incompleteApplications.map((app) => (
            <div key={app.jobId} className="border-b border-gray-100 last:border-b-0">
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {app.jobTitle}
                    </h4>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        Last saved: {formatTimeElapsed(app.timeElapsed)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => clearApplication(app.jobId)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      // Navigate to job page
                      window.location.href = `/jobs/${app.jobId}`
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                  >
                    Resume Application
                  </button>
                  <button
                    onClick={() => clearApplication(app.jobId)}
                    className="px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Discard
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <button
            onClick={clearAllApplications}
            className="w-full text-center text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Clear All Incomplete Applications
          </button>
        </div>
      </div>
    </div>
  )
}
