'use client'

import { useEffect, useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Assignment {
  id: string
  ticket: {
    id: string
    subject: string
    urgency: string
  }
}

export default function AssignmentNotificationPopup() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [showPopup, setShowPopup] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await fetch('/api/admin/support/assignments')
        if (res.ok) {
          const data = await res.json()
          if (data.assignments && data.assignments.length > 0) {
            setAssignments(data.assignments)
            
            // Show popup after 10 seconds if not dismissed
            const timer = setTimeout(() => {
              if (!dismissed) {
                setShowPopup(true)
              }
            }, 10000)
            
            return () => clearTimeout(timer)
          }
        }
      } catch {
        // Ignore errors
      }
    }

    fetchAssignments()
    // Check every 60 seconds for new assignments
    const interval = setInterval(fetchAssignments, 60000)
    return () => clearInterval(interval)
  }, [dismissed])

  const handleDismiss = () => {
    setShowPopup(false)
    setDismissed(true)
  }

  const handleView = async () => {
    // Mark all as viewed
    for (const assignment of assignments) {
      try {
        await fetch('/api/admin/support/assignments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignment_id: assignment.id }),
        })
      } catch {
        // Ignore errors
      }
    }
    setShowPopup(false)
    setDismissed(true)
  }

  if (!showPopup || assignments.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">New Support Assignment{assignments.length > 1 ? 's' : ''}</h3>
              <p className="text-xs text-red-100">You have {assignments.length} unread ticket{assignments.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
          {assignments.slice(0, 3).map((assignment) => (
            <div key={assignment.id} className="border-l-4 border-red-500 pl-3 py-2">
              <p className="font-semibold text-gray-900 text-sm">{assignment.ticket.subject}</p>
              <p className="text-xs text-gray-500 mt-1">
                Urgency: <span className={`font-semibold ${
                  assignment.ticket.urgency === 'high' ? 'text-red-600' :
                  assignment.ticket.urgency === 'medium' ? 'text-amber-600' :
                  'text-gray-600'
                }`}>{assignment.ticket.urgency}</span>
              </p>
            </div>
          ))}
          {assignments.length > 3 && (
            <p className="text-xs text-gray-500 text-center">+ {assignments.length - 3} more</p>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
          >
            Dismiss
          </button>
          <Link
            href="/admin/support"
            onClick={handleView}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition text-center"
          >
            View Now
          </Link>
        </div>
      </div>
    </div>
  )
}
