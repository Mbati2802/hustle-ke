'use client'

import { useState, useEffect } from 'react'
import { Star, Loader2, X, CheckCircle2 } from 'lucide-react'

interface ClientReviewModalProps {
  jobId: string
  jobTitle: string
  onClose: () => void
  onSuccess: () => void
}

export default function ClientReviewModal({
  jobId,
  jobTitle,
  onClose,
  onSuccess,
}: ClientReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [communicationRating, setCommunicationRating] = useState(0)
  const [qualityRating, setQualityRating] = useState(0)
  const [timelinessRating, setTimelinessRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [freelancerId, setFreelancerId] = useState<string | null>(null)
  const [freelancerName, setFreelancerName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFreelancer = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}/proposals`)
        const data = await res.json()
        const accepted = data.proposals?.find((p: Record<string, string>) => p.status === 'Accepted')
        if (accepted) {
          setFreelancerId(accepted.freelancer_id)
          const fl = accepted.freelancer as Record<string, string> | undefined
          setFreelancerName(fl?.full_name || 'the freelancer')
        }
      } catch {}
      setLoading(false)
    }
    loadFreelancer()
  }, [jobId])

  const handleSubmit = async () => {
    if (rating === 0) { setError('Please select a star rating'); return }
    if (!freelancerId) { setError('Could not find freelancer to review'); return }
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          reviewee_id: freelancerId,
          rating,
          comment: comment.trim() || undefined,
          communication_rating: communicationRating || undefined,
          quality_rating: qualityRating || undefined,
          timeliness_rating: timelinessRating || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => { onSuccess(); onClose() }, 1500)
      } else if (res.status === 409) {
        setError('You already reviewed this freelancer for this job.')
        setTimeout(onClose, 1500)
      } else {
        setError(data.error || 'Failed to submit review')
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setSubmitting(false)
  }

  const StarRow = ({ value, onChange, size = 'lg' }: { value: number; onChange: (v: number) => void; size?: 'lg' | 'sm' }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => size === 'lg' ? setHoverRating(star) : undefined}
          onMouseLeave={() => size === 'lg' ? setHoverRating(0) : undefined}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`${size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'} transition-colors ${
              star <= (size === 'lg' ? (hoverRating || value) : value)
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  )

  if (success) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Review Submitted!</h3>
          <p className="text-gray-600 text-sm">Thank you for your feedback on {freelancerName}.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Review Freelancer</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{jobTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-green-500" />
          </div>
        ) : !freelancerId ? (
          <div className="flex-1 px-6 py-8 text-center">
            <p className="text-gray-500 text-sm">Could not find the freelancer for this job.</p>
          </div>
        ) : (
          <>
            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-sm font-medium text-green-800">How was your experience with {freelancerName}?</p>
                <p className="text-xs text-green-600 mt-1">Your review helps freelancers build their reputation.</p>
              </div>

              {/* Overall Rating */}
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700 mb-2">Overall Rating</p>
                <StarRow value={rating} onChange={setRating} size="lg" />
                <p className="text-xs text-gray-400 mt-1">
                  {rating === 0 ? 'Click to rate' : ['', 'Poor', 'Below Average', 'Good', 'Very Good', 'Excellent'][rating]}
                </p>
              </div>

              {/* Sub-ratings */}
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5">
                  <span className="text-sm text-gray-700">Communication</span>
                  <StarRow value={communicationRating} onChange={setCommunicationRating} size="sm" />
                </div>
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5">
                  <span className="text-sm text-gray-700">Quality of Work</span>
                  <StarRow value={qualityRating} onChange={setQualityRating} size="sm" />
                </div>
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5">
                  <span className="text-sm text-gray-700">Timeliness</span>
                  <StarRow value={timelinessRating} onChange={setTimelinessRating} size="sm" />
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Comment <span className="text-xs text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience working with this freelancer..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20 resize-none"
                />
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={onClose}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Later
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || rating === 0}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                ) : (
                  <><Star className="w-4 h-4" /> Submit Review</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
