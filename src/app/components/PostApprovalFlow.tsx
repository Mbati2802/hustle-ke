'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Star,
  CheckCircle2,
  Loader2,
  Clock,
  DollarSign,
  X,
  Shield,
} from 'lucide-react'

interface PostApprovalFlowProps {
  jobId: string
  jobTitle: string
  onComplete: () => void
}

type FlowStep = 'review' | 'escrow' | 'done'

export default function PostApprovalFlow({ jobId, jobTitle, onComplete }: PostApprovalFlowProps) {
  const [step, setStep] = useState<FlowStep>('review')

  // Review state
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [communicationRating, setCommunicationRating] = useState(0)
  const [qualityRating, setQualityRating] = useState(0)
  const [timelinessRating, setTimelinessRating] = useState(0)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState('')

  // Escrow state
  const [escrowId, setEscrowId] = useState<string | null>(null)
  const [escrowAmount, setEscrowAmount] = useState(0)
  const [escrowNet, setEscrowNet] = useState(0)
  const [escrowFee, setEscrowFee] = useState(0)
  const [escrowReleasing, setEscrowReleasing] = useState(false)
  const [escrowError, setEscrowError] = useState('')
  const [countdown, setCountdown] = useState(60)
  const [freelancerId, setFreelancerId] = useState<string | null>(null)
  const [freelancerName, setFreelancerName] = useState('')
  const [escrowStatus, setEscrowStatus] = useState('')

  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const autoReleaseTriggered = useRef(false)

  // Fetch job details (freelancer info + escrow)
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get freelancer from accepted proposal
        const propRes = await fetch(`/api/jobs/${jobId}/proposals`)
        const propData = await propRes.json()
        const accepted = propData.proposals?.find((p: Record<string, string>) => p.status === 'Accepted')
        if (accepted) {
          setFreelancerId(accepted.freelancer_id)
          const fl = accepted.freelancer as Record<string, string> | undefined
          setFreelancerName(fl?.full_name || 'the freelancer')
        }

        // Get escrow for this job
        const escRes = await fetch('/api/escrow')
        const escData = await escRes.json()
        console.log('[PostApproval] Escrows for user:', escData.escrows?.length, 'looking for job:', jobId)
        const jobEscrow = escData.escrows?.find(
          (e: Record<string, string>) => e.job_id === jobId && ['Held', 'Pending', 'Released'].indexOf(e.status) === -1 ? false : true
        ) || escData.escrows?.find(
          (e: Record<string, string>) => e.job_id === jobId
        )
        console.log('[PostApproval] Found escrow:', jobEscrow?.id, 'status:', jobEscrow?.status)
        if (jobEscrow && jobEscrow.status !== 'Released' && jobEscrow.status !== 'Refunded') {
          setEscrowId(jobEscrow.id)
          setEscrowAmount(jobEscrow.amount || 0)
          const fee = (jobEscrow.service_fee || 0) + (jobEscrow.tax_amount || 0)
          setEscrowFee(fee)
          setEscrowNet((jobEscrow.amount || 0) - fee)
          setEscrowStatus(jobEscrow.status)
        }
      } catch (err) { console.error('[PostApproval] Error loading data:', err) }
    }
    loadData()
  }, [jobId])

  // Auto-release escrow when countdown reaches 0
  const releaseEscrow = useCallback(async () => {
    if (!escrowId || escrowReleasing || autoReleaseTriggered.current) return

    autoReleaseTriggered.current = true
    setEscrowReleasing(true)
    setEscrowError('')

    try {
      const res = await fetch(`/api/escrow/${escrowId}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setStep('done')
      } else {
        setEscrowError(data.error || 'Failed to release escrow')
        autoReleaseTriggered.current = false
      }
    } catch {
      setEscrowError('Network error releasing escrow')
      autoReleaseTriggered.current = false
    }
    setEscrowReleasing(false)
  }, [escrowId, escrowReleasing, escrowStatus])

  // Countdown timer for auto-release (only when escrow is Held)
  useEffect(() => {
    if (step !== 'escrow' || !escrowId || escrowStatus !== 'Held') return

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [step, escrowId, escrowStatus])

  // Trigger auto-release when countdown hits 0
  useEffect(() => {
    if (countdown === 0 && step === 'escrow' && !autoReleaseTriggered.current) {
      releaseEscrow()
    }
  }, [countdown, step, releaseEscrow])

  const handleSubmitReview = async () => {
    if (rating === 0) {
      setReviewError('Please select a star rating')
      return
    }
    if (!freelancerId) {
      setReviewError('Could not find freelancer to review')
      return
    }
    setReviewSubmitting(true)
    setReviewError('')

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
        // Move to escrow step if there's an active escrow
        if (escrowId) {
          setStep('escrow')
        } else {
          // No escrow to release — done
          setStep('done')
        }
      } else {
        // If duplicate review, still move forward
        if (res.status === 409) {
          if (escrowId) {
            setStep('escrow')
          } else {
            setStep('done')
          }
        } else {
          setReviewError(data.error || 'Failed to submit review')
        }
      }
    } catch {
      setReviewError('Network error. Please try again.')
    }
    setReviewSubmitting(false)
  }

  const handleSkipReview = () => {
    if (escrowId) {
      setStep('escrow')
    } else {
      setStep('done')
    }
  }

  const StarRatingInput = ({
    value,
    onChange,
    size = 'lg',
    hover,
    onHover,
  }: {
    value: number
    onChange: (v: number) => void
    size?: 'lg' | 'sm'
    hover?: number
    onHover?: (v: number) => void
  }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => onHover?.(star)}
          onMouseLeave={() => onHover?.(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`${size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'} transition-colors ${
              star <= (hover || value) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  )

  // Done step
  if (step === 'done') {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">All Done!</h3>
          <p className="text-gray-600 text-sm mb-1">
            Job &quot;{jobTitle}&quot; is complete.
          </p>
          <p className="text-gray-500 text-xs mb-6">
            {escrowId ? 'Payment has been released to the freelancer.' : 'The freelancer has been notified.'}
          </p>
          <button
            onClick={onComplete}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-medium text-sm transition-colors"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Review step
  if (step === 'review') {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Work Approved!</h2>
                <p className="text-xs text-gray-500 truncate max-w-xs">{jobTitle}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-sm font-medium text-amber-800">How was your experience with {freelancerName}?</p>
              <p className="text-xs text-amber-600 mt-1">Your review helps other clients make informed decisions.</p>
            </div>

            {/* Overall Rating */}
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700 mb-2">Overall Rating</p>
              <StarRatingInput
                value={rating}
                onChange={setRating}
                size="lg"
                hover={hoverRating}
                onHover={setHoverRating}
              />
              <p className="text-xs text-gray-400 mt-1">
                {rating === 0 ? 'Click to rate' : ['', 'Poor', 'Below Average', 'Good', 'Very Good', 'Excellent'][rating]}
              </p>
            </div>

            {/* Detailed Ratings */}
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: 'Communication', value: communicationRating, set: setCommunicationRating },
                { label: 'Quality of Work', value: qualityRating, set: setQualityRating },
                { label: 'Timeliness', value: timelinessRating, set: setTimelinessRating },
              ].map(({ label, value, set }) => (
                <div key={label} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5">
                  <span className="text-sm text-gray-700">{label}</span>
                  <StarRatingInput value={value} onChange={set} size="sm" />
                </div>
              ))}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Comment <span className="text-xs text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share details about your experience working with this freelancer..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20 resize-none"
              />
            </div>

            {reviewError && (
              <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg">{reviewError}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleSkipReview}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Skip for now
            </button>
            <button
              onClick={handleSubmitReview}
              disabled={reviewSubmitting || rating === 0}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors"
            >
              {reviewSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
              ) : (
                <><Star className="w-4 h-4" /> Submit Review</>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Escrow release step
  if (step === 'escrow') {
    const canRelease = escrowStatus === 'Held'
    const progress = canRelease ? ((60 - countdown) / 60) * 100 : 0

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
          {/* Countdown progress bar — only if releasable */}
          {canRelease && (
            <div className="h-1.5 bg-gray-100 relative">
              <div
                className={`h-full transition-all duration-1000 ease-linear ${
                  countdown <= 10 ? 'bg-red-500' : countdown <= 30 ? 'bg-amber-500' : 'bg-green-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <div className="px-6 py-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${canRelease ? 'bg-green-100' : 'bg-amber-100'}`}>
                <Shield className={`w-6 h-6 ${canRelease ? 'text-green-600' : 'text-amber-600'}`} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{canRelease ? 'Release Payment' : 'Escrow Status'}</h2>
                <p className="text-xs text-gray-500">
                  {canRelease ? 'Funds held in escrow' : `Escrow is ${escrowStatus}`} for &quot;{jobTitle}&quot;
                </p>
              </div>
            </div>

            {/* Payment breakdown */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Escrow Amount</span>
                <span className="font-semibold text-gray-900">KES {escrowAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Platform Fee + Tax</span>
                <span className="text-red-600">- KES {escrowFee.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-900">Freelancer Receives</span>
                <span className="font-bold text-green-600 text-base">KES {escrowNet.toLocaleString()}</span>
              </div>
            </div>

            {canRelease ? (
              <>
                {/* Timer */}
                <div className={`text-center mb-5 p-3 rounded-xl ${
                  countdown <= 10 ? 'bg-red-50 border border-red-200' :
                  countdown <= 30 ? 'bg-amber-50 border border-amber-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Clock className={`w-4 h-4 ${countdown <= 10 ? 'text-red-500' : countdown <= 30 ? 'text-amber-500' : 'text-blue-500'}`} />
                    <span className={`text-sm font-medium ${countdown <= 10 ? 'text-red-700' : countdown <= 30 ? 'text-amber-700' : 'text-blue-700'}`}>
                      Auto-releasing in {countdown}s
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Payment will be automatically released to protect the freelancer.
                  </p>
                </div>

                {escrowError && (
                  <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg mb-4">{escrowError}</p>
                )}

                <button
                  onClick={releaseEscrow}
                  disabled={escrowReleasing}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors mb-3"
                >
                  {escrowReleasing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Releasing...</>
                  ) : (
                    <><DollarSign className="w-4 h-4" /> Release Payment Now</>
                  )}
                </button>
                <p className="text-xs text-gray-400 text-center">
                  By releasing payment, you confirm the work has been completed satisfactorily.
                </p>
              </>
            ) : (
              <>
                {/* Not releasable yet */}
                <div className="text-center mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <Clock className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-amber-800">
                    Escrow is currently &quot;{escrowStatus}&quot;
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    {escrowStatus === 'Pending'
                      ? 'This escrow needs to be funded before it can be released. You can release it from the Escrow page once it\'s active.'
                      : 'You can manage this escrow from the Escrow page.'}
                  </p>
                </div>

                <button
                  onClick={() => setStep('done')}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" /> Continue
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
