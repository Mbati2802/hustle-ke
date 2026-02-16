'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  Star,
  MessageSquare,
  Clock,
  Loader2,
} from 'lucide-react'

interface Review {
  id: string
  job_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment: string
  communication_rating?: number
  quality_rating?: number
  timeliness_rating?: number
  created_at: string
  reviewer?: { full_name: string; avatar_url?: string }
  reviewee?: { full_name: string }
  job?: { title: string }
}

function StarRating({ rating, onChange, readonly = false }: { rating: number; onChange?: (r: number) => void; readonly?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <Star className={`w-5 h-5 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  )
}

interface ReviewableJob {
  id: string
  title: string
  other_party_id: string
  other_party_name: string
}

export default function ReviewsPage() {
  const { user, profile } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [reviewableJobs, setReviewableJobs] = useState<ReviewableJob[]>([])

  // Review form state
  const [formData, setFormData] = useState({
    job_id: '',
    reviewee_id: '',
    rating: 0,
    comment: '',
    communication_rating: 0,
    quality_rating: 0,
    timeliness_rating: 0,
  })

  const isClient = profile?.role === 'Client'

  useEffect(() => {
    if (!user || !profile?.id) return
    fetch(`/api/reviews/${profile.id}`)
      .then(r => r.json())
      .then(data => { if (data.reviews) setReviews(data.reviews) })
      .catch(() => {})
      .finally(() => setLoading(false))

    // Fetch completed jobs for the review form
    if (isClient) {
      // Client: fetch their completed jobs
      fetch('/api/jobs?my=true&limit=50')
        .then(r => r.json())
        .then(data => {
          if (data.jobs) {
            const completed = data.jobs.filter((j: { status: string }) => j.status === 'Completed')
            // For each completed job, we need the freelancer info
            // The job response includes proposals or we fetch them
            setReviewableJobs(completed.map((j: { id: string; title: string }) => ({
              id: j.id,
              title: j.title,
              other_party_id: '', // Will be resolved when selected
              other_party_name: 'Freelancer',
            })))
          }
        })
        .catch(() => {})
    } else {
      // Freelancer: fetch their accepted proposals for completed jobs
      fetch('/api/proposals?limit=50')
        .then(r => r.json())
        .then(data => {
          if (data.proposals) {
            const completed = data.proposals.filter((p: { status: string; job?: { status: string } }) =>
              p.status === 'Accepted' && p.job?.status === 'Completed'
            )
            setReviewableJobs(completed.map((p: { job: { id: string; title: string; client?: { id: string; full_name: string } } }) => ({
              id: p.job.id,
              title: p.job.title,
              other_party_id: p.job.client?.id || '',
              other_party_name: p.job.client?.full_name || 'Client',
            })))
          }
        })
        .catch(() => {})
    }
  }, [user, profile, isClient])

  const handleJobSelect = async (jobId: string) => {
    const job = reviewableJobs.find(j => j.id === jobId)
    if (!job) return

    let revieweeId = job.other_party_id

    // If client, we need to fetch the accepted freelancer for this job
    if (isClient && !revieweeId) {
      try {
        const res = await fetch(`/api/jobs/${jobId}/proposals`)
        const data = await res.json()
        if (data.proposals) {
          const accepted = data.proposals.find((p: { status: string }) => p.status === 'Accepted')
          if (accepted) {
            revieweeId = accepted.freelancer_id || accepted.freelancer?.id || ''
            // Update the cached job
            setReviewableJobs(prev => prev.map(j =>
              j.id === jobId ? { ...j, other_party_id: revieweeId, other_party_name: accepted.freelancer?.full_name || 'Freelancer' } : j
            ))
          }
        }
      } catch {}
    }

    setFormData(prev => ({ ...prev, job_id: jobId, reviewee_id: revieweeId }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.rating === 0) {
      setMessage('Please select a rating')
      return
    }
    if (!formData.job_id || !formData.reviewee_id) {
      setMessage('Please select a job to review')
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage('Review submitted successfully!')
        setShowForm(false)
        setFormData({ job_id: '', reviewee_id: '', rating: 0, comment: '', communication_rating: 0, quality_rating: 0, timeliness_rating: 0 })
        const revRes = await fetch(`/api/reviews/${profile!.id}`)
        const revData = await revRes.json()
        if (revData.reviews) setReviews(revData.reviews)
      } else {
        setMessage(data.error || 'Failed to submit review')
      }
    } catch {
      setMessage('Network error')
    }
    setSubmitting(false)
  }

  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0'
  const selectedJob = reviewableJobs.find(j => j.id === formData.job_id)

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          {reviewableJobs.length > 0 && !showForm && (
            <button onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors">
              Write a Review
            </button>
          )}
        </div>

        {message && (
          <div className={`p-3 rounded-xl mb-6 text-sm ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="text-2xl font-bold text-gray-900">{avgRating}</span>
            </div>
            <p className="text-sm text-gray-500">Average Rating</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
            <p className="text-sm text-gray-500">Total Reviews</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <p className="text-2xl font-bold text-green-600">{reviews.filter(r => r.rating >= 4).length}</p>
            <p className="text-sm text-gray-500">Positive (4-5★)</p>
          </div>
        </div>

        {/* Review Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Write a Review</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Completed Job</label>
              <select
                value={formData.job_id}
                onChange={e => handleJobSelect(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm bg-white"
              >
                <option value="">Choose a job...</option>
                {reviewableJobs.map(j => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            </div>
            {selectedJob && (
              <div className="bg-gray-50 rounded-lg px-4 py-2.5 text-sm text-gray-600">
                Reviewing: <span className="font-medium text-gray-900">{selectedJob.other_party_name}</span>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating</label>
              <StarRating rating={formData.rating} onChange={r => setFormData({ ...formData, rating: r })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Communication</label>
                <StarRating rating={formData.communication_rating} onChange={r => setFormData({ ...formData, communication_rating: r })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Quality</label>
                <StarRating rating={formData.quality_rating} onChange={r => setFormData({ ...formData, quality_rating: r })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Timeliness</label>
                <StarRating rating={formData.timeliness_rating} onChange={r => setFormData({ ...formData, timeliness_rating: r })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
              <textarea value={formData.comment} onChange={e => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Share your experience..." rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm resize-none" />
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 font-medium text-sm">Cancel</button>
            </div>
          </form>
        )}

        {/* Reviews List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-full mb-2" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">No reviews yet</p>
            <p className="text-sm text-gray-400">Reviews will appear after completing jobs</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {review.reviewer?.avatar_url ? (
                      <img src={review.reviewer.avatar_url} alt={review.reviewer.full_name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {review.reviewer?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{review.reviewer?.full_name || 'User'}</p>
                      {review.job?.title && <p className="text-xs text-gray-500">Re: {review.job.title}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} readonly />
                    <span className="text-sm font-semibold text-gray-900">{review.rating}.0</span>
                  </div>
                </div>
                {review.comment && <p className="text-sm text-gray-600 mb-3">{review.comment}</p>}
                {(review.communication_rating || review.quality_rating || review.timeliness_rating) && (
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    {review.communication_rating && <span>Communication: {review.communication_rating}★</span>}
                    {review.quality_rating && <span>Quality: {review.quality_rating}★</span>}
                    {review.timeliness_rating && <span>Timeliness: {review.timeliness_rating}★</span>}
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" /> {new Date(review.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
