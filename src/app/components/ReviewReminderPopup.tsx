'use client'

import { useState, useEffect } from 'react'
import { Star, X, Clock } from 'lucide-react'

interface UnreviewedJob {
  id: string
  title: string
  completed_at?: string
}

interface ReviewReminderPopupProps {
  onReview: (jobId: string, jobTitle: string) => void
}

export default function ReviewReminderPopup({ onReview }: ReviewReminderPopupProps) {
  const [unreviewedJobs, setUnreviewedJobs] = useState<UnreviewedJob[]>([])
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUnreviewed = async () => {
      try {
        const res = await fetch('/api/reviews/pending')
        const data = await res.json()
        if (data.jobs && data.jobs.length > 0) {
          // Only show if not dismissed in this session
          const dismissedKey = `review_reminder_dismissed_${new Date().toISOString().slice(0, 10)}`
          if (!sessionStorage.getItem(dismissedKey)) {
            setUnreviewedJobs(data.jobs)
          }
        }
      } catch {}
      setLoading(false)
    }

    // Delay popup by 3 seconds so it doesn't appear instantly
    const timer = setTimeout(checkUnreviewed, 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    const dismissedKey = `review_reminder_dismissed_${new Date().toISOString().slice(0, 10)}`
    sessionStorage.setItem(dismissedKey, 'true')
    setDismissed(true)
  }

  const handleReview = (job: UnreviewedJob) => {
    onReview(job.id, job.title)
    setUnreviewedJobs(prev => prev.filter(j => j.id !== job.id))
  }

  if (loading || dismissed || unreviewedJobs.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full animate-in slide-in-from-bottom-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-3 flex items-center justify-between border-b border-amber-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Reviews Pending</p>
              <p className="text-[10px] text-amber-600">{unreviewedJobs.length} completed job{unreviewedJobs.length !== 1 ? 's' : ''} awaiting your review</p>
            </div>
          </div>
          <button onClick={handleDismiss} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Jobs list */}
        <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
          {unreviewedJobs.slice(0, 3).map(job => (
            <div key={job.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-gray-50">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                {job.completed_at && (
                  <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    Completed {new Date(job.completed_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleReview(job)}
                className="shrink-0 bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
              >
                <Star className="w-3 h-3" /> Review
              </button>
            </div>
          ))}
        </div>

        {unreviewedJobs.length > 3 && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 text-center">+{unreviewedJobs.length - 3} more jobs to review</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 text-center">Your reviews help freelancers build trust on the platform</p>
        </div>
      </div>
    </div>
  )
}
