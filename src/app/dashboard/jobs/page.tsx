'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { cachedFetch } from '@/lib/fetch-cache'
import {
  Briefcase,
  Clock,
  CheckCircle2,
  MessageSquare,
  Send,
  DollarSign,
  ArrowUpRight,
  Zap,
  Loader2,
  FileCheck,
  BarChart3,
  Star,
  Bell,
  XCircle,
} from 'lucide-react'
import SubmitWorkModal from '@/app/components/SubmitWorkModal'
import FreelancerReviewModal from '@/app/components/FreelancerReviewModal'

interface HustleJob {
  id: string
  title: string
  budget_min: number
  budget_max: number
  deadline?: string
  status: string
  created_at: string
  client?: { id: string; full_name: string; avatar_url?: string }
  work_progress?: number
  revision_progress?: number
}

interface HustleProposal {
  id: string
  bid_amount: number
  status: string
  accepted_at?: string
  job: HustleJob
}

const jobStatusConfig: Record<string, { color: string; label: string }> = {
  Open: { color: 'bg-green-50 text-green-700', label: 'Open' },
  'In-Progress': { color: 'bg-blue-50 text-blue-700', label: 'In Progress' },
  Review: { color: 'bg-amber-50 text-amber-700', label: 'Awaiting Review' },
  Completed: { color: 'bg-gray-100 text-gray-600', label: 'Completed' },
  Cancelled: { color: 'bg-red-50 text-red-700', label: 'Cancelled' },
}

export default function MyHustlesPage() {
  const { user, profile } = useAuth()
  const [hustles, setHustles] = useState<HustleProposal[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [submitModalJob, setSubmitModalJob] = useState<{ id: string; title: string } | null>(null)
  const [reviewModalJob, setReviewModalJob] = useState<{ id: string; title: string; clientId: string; clientName: string } | null>(null)
  const [reviewedJobs, setReviewedJobs] = useState<Set<string>>(new Set())
  const [reviewRequested, setReviewRequested] = useState<Set<string>>(new Set())
  const [requestingReview, setRequestingReview] = useState<string | null>(null)
  const [progressUpdating, setProgressUpdating] = useState<string | null>(null)
  const progressTimers = useRef<Record<string, NodeJS.Timeout>>({})

  const refreshHustles = async () => {
    const r = await fetch('/api/proposals?limit=50')
    const d = await r.json()
    if (d.proposals) setHustles(d.proposals)
  }

  const handleProgressChange = (jobId: string, type: 'work' | 'revision', value: number) => {
    // Optimistically update UI
    setHustles(prev => prev.map(h => {
      if (h.job?.id !== jobId) return h
      const updatedJob = { ...h.job }
      if (type === 'work') updatedJob.work_progress = value
      else updatedJob.revision_progress = value
      return { ...h, job: updatedJob }
    }))

    // Debounce the API call
    const key = `${jobId}-${type}`
    if (progressTimers.current[key]) clearTimeout(progressTimers.current[key])
    progressTimers.current[key] = setTimeout(async () => {
      setProgressUpdating(key)
      try {
        await fetch(`/api/jobs/${jobId}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, progress: value }),
        })
      } catch {}
      setProgressUpdating(null)
    }, 600)
  }

  const getProgressColor = (value: number) => {
    if (value >= 75) return 'from-green-500 to-emerald-500'
    if (value >= 50) return 'from-amber-400 to-yellow-500'
    if (value >= 25) return 'from-blue-400 to-cyan-500'
    return 'from-gray-300 to-gray-400'
  }

  const hasMounted = useRef(false)

  useEffect(() => {
    if (!user) return

    if (!hasMounted.current) {
      hasMounted.current = true
      const cached = cachedFetch<{ proposals?: HustleProposal[] }>('/api/proposals?limit=50', (data) => {
        if (data.proposals) setHustles(data.proposals)
        setLoading(false)
      })
      if (cached?.proposals) {
        setHustles(cached.proposals)
        setLoading(false)
      }
    } else {
      fetch('/api/proposals?limit=50')
        .then(r => r.json())
        .then(data => { if (data.proposals) setHustles(data.proposals) })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [user])

  // Separate into active hustles (accepted proposals with In-Progress jobs) and others
  const acceptedHustles = hustles.filter(h => h.status === 'Accepted')
  const pendingHustles = hustles.filter(h => h.status === 'Pending')
  const completedHustles = hustles.filter(h => h.job?.status === 'Completed' || h.status === 'Withdrawn' || h.status === 'Rejected')

  const filteredHustles = filter === 'all' ? hustles :
    filter === 'active' ? acceptedHustles :
    filter === 'pending' ? pendingHustles :
    completedHustles

  const filters = [
    { key: 'all', label: 'All', count: hustles.length },
    { key: 'active', label: 'Active', count: acceptedHustles.length },
    { key: 'pending', label: 'Pending', count: pendingHustles.length },
    { key: 'completed', label: 'Past', count: completedHustles.length },
  ]

  return (
    <div className="p-4 lg:p-6 xl:p-8 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">My Hustles</h1>
          <p className="text-sm text-gray-500 mt-0.5">Jobs you&apos;ve applied to and been hired for</p>
        </div>
        <Link href="/jobs" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors shadow-sm">
          <Zap className="w-4 h-4" /> Find Work
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{hustles.length}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <Send className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-blue-600">{acceptedHustles.length}</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-amber-600">{pendingHustles.length}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{completedHustles.length}</p>
              <p className="text-xs text-gray-500">Past</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === f.key ? 'bg-green-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Hustles List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-50 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredHustles.length === 0 ? (
        <div className="bg-white rounded-xl p-10 border border-gray-200 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-900 font-semibold mb-1">
            {filter === 'all' ? 'No hustles yet' : `No ${filter} hustles`}
          </p>
          <p className="text-gray-500 text-sm mb-5">Browse jobs and submit proposals to get started</p>
          <Link href="/jobs" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm inline-flex items-center gap-2 transition-colors">
            <Zap className="w-4 h-4" /> Find Work
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHustles.map((hustle) => {
            const job = hustle.job
            if (!job) return null
            const statusCfg = jobStatusConfig[job.status] || { color: 'bg-gray-50 text-gray-600', label: job.status }

            return (
              <div key={hustle.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <Link href={`/jobs/${job.id}`} className="font-semibold text-gray-900 hover:text-green-700 transition-colors text-base">
                        {job.title}
                      </Link>
                      {job.client?.full_name && (
                        <p className="text-xs text-gray-500 mt-0.5">Client: {job.client.full_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {hustle.status === 'Accepted' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-green-50 text-green-700">Hired</span>
                      )}
                      {hustle.status === 'Pending' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">Proposal Pending</span>
                      )}
                      {hustle.status === 'Rejected' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-red-50 text-red-700">Not Selected</span>
                      )}
                      {hustle.status === 'Withdrawn' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">Withdrawn</span>
                      )}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> Your Bid: <strong className="text-green-600">KES {hustle.bid_amount?.toLocaleString()}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> Budget: KES {job.budget_min?.toLocaleString()}{job.budget_max && job.budget_max !== job.budget_min ? ` – ${job.budget_max.toLocaleString()}` : ''}
                    </span>
                    {job.deadline && (
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Due: {new Date(job.deadline).toLocaleDateString()}</span>
                    )}
                  </div>

                  {/* Progress Sliders for In-Progress jobs */}
                  {hustle.status === 'Accepted' && job.status === 'In-Progress' && (
                    <div className="space-y-3 mb-4">
                      {/* Work Progress */}
                      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-semibold text-gray-900">Work Progress</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {progressUpdating === `${job.id}-work` && (
                              <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                            )}
                            <span className={`text-sm font-bold ${(job.work_progress || 0) >= 75 ? 'text-green-600' : (job.work_progress || 0) >= 50 ? 'text-amber-600' : 'text-blue-600'}`}>
                              {job.work_progress || 0}%
                            </span>
                          </div>
                        </div>
                        <div className="relative">
                          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(job.work_progress || 0)} transition-all duration-300`}
                              style={{ width: `${job.work_progress || 0}%` }}
                            />
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={job.work_progress || 0}
                            onChange={(e) => handleProgressChange(job.id, 'work', Number(e.target.value))}
                            className="absolute inset-0 w-full h-3 opacity-0 cursor-pointer"
                            title="Drag to update work progress"
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-gray-400">Just started</span>
                          <span className="text-[10px] text-gray-400">Ready to submit</span>
                        </div>
                      </div>

                      {/* Revision Progress — only show if there's been a revision request (revision_progress > 0 or job had prior submission) */}
                      {(job.revision_progress !== undefined && job.revision_progress > 0 || (job.work_progress || 0) >= 100) && (() => {
                        const revProg = job.revision_progress || 0
                        return (
                          <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-amber-600" />
                                <span className="text-sm font-semibold text-gray-900">Revision Progress</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {progressUpdating === `${job.id}-revision` && (
                                  <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                                )}
                                <span className={`text-sm font-bold ${revProg >= 75 ? 'text-green-600' : revProg >= 50 ? 'text-amber-600' : 'text-blue-600'}`}>
                                  {revProg}%
                                </span>
                              </div>
                            </div>
                            <div className="relative">
                              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(revProg)} transition-all duration-300`}
                                  style={{ width: `${revProg}%` }}
                                />
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                step={5}
                                value={revProg}
                                onChange={(e) => handleProgressChange(job.id, 'revision', Number(e.target.value))}
                                className="absolute inset-0 w-full h-3 opacity-0 cursor-pointer"
                                title="Drag to update revision progress"
                              />
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-[10px] text-gray-400">Started revisions</span>
                              <span className="text-[10px] text-gray-400">Revisions complete</span>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  <div className="flex items-center gap-3 flex-wrap">
                    <Link href={`/jobs/${job.id}`} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium text-sm transition-colors">
                      View Job <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                    {hustle.status === 'Accepted' && (
                      <Link href={`/dashboard/messages?job_id=${job.id}&to=${job.client?.id || ''}&name=${encodeURIComponent(job.client?.full_name || 'Client')}&title=${encodeURIComponent(job.title)}`} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 font-medium text-sm transition-colors">
                        <MessageSquare className="w-3.5 h-3.5" /> Message Client
                      </Link>
                    )}
                    {hustle.status === 'Accepted' && job.status === 'In-Progress' && (
                      <>
                        <button
                          onClick={() => setSubmitModalJob({ id: job.id, title: job.title })}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium text-sm transition-colors"
                        >
                          <FileCheck className="w-3.5 h-3.5" /> Submit Work
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Are you sure you want to withdraw from "${job.title}"? This action cannot be undone and the client will be notified.`)) return
                            try {
                              const res = await fetch(`/api/proposals/${hustle.id}/withdraw`, { method: 'POST' })
                              const data = await res.json()
                              if (res.ok) {
                                refreshHustles()
                              } else {
                                alert(data.error || 'Failed to withdraw')
                              }
                            } catch {
                              alert('Network error')
                            }
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-medium text-sm transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Withdraw
                        </button>
                      </>
                    )}
                    {hustle.status === 'Accepted' && job.status === 'Open' && (
                      <button
                        onClick={async () => {
                          if (!confirm(`Are you sure you want to withdraw from "${job.title}"? This action cannot be undone and the client will be notified.`)) return
                          try {
                            const res = await fetch(`/api/proposals/${hustle.id}/withdraw`, { method: 'POST' })
                            const data = await res.json()
                            if (res.ok) {
                              refreshHustles()
                            } else {
                              alert(data.error || 'Failed to withdraw')
                            }
                          } catch {
                            alert('Network error')
                          }
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-medium text-sm transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Withdraw
                      </button>
                    )}
                    {job.status === 'Review' && (
                      <span className="flex items-center gap-1 text-amber-600 text-sm font-medium">
                        <Clock className="w-4 h-4" /> Awaiting Client Review
                      </span>
                    )}
                    {job.status === 'Completed' && !reviewedJobs.has(job.id) && job.client?.id && (
                      <button
                        onClick={() => setReviewModalJob({
                          id: job.id,
                          title: job.title,
                          clientId: job.client!.id,
                          clientName: job.client!.full_name || 'Client',
                        })}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium text-sm transition-colors"
                      >
                        <Star className="w-3.5 h-3.5" /> Leave Review
                      </button>
                    )}
                    {job.status === 'Completed' && !reviewRequested.has(job.id) && (
                      <button
                        onClick={async () => {
                          setRequestingReview(job.id)
                          try {
                            const res = await fetch('/api/reviews/request', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ job_id: job.id }),
                            })
                            if (res.ok || res.status === 409) {
                              setReviewRequested(prev => { const next = new Set(Array.from(prev)); next.add(job.id); return next })
                            }
                          } catch {}
                          setRequestingReview(null)
                        }}
                        disabled={requestingReview === job.id}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-sm transition-colors disabled:opacity-50"
                      >
                        {requestingReview === job.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
                        Request Review
                      </button>
                    )}
                    {job.status === 'Completed' && reviewRequested.has(job.id) && (
                      <span className="flex items-center gap-1 text-blue-500 text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Review Requested
                      </span>
                    )}
                    {job.status === 'Completed' && (
                      <span className="flex items-center gap-1 text-green-600 text-sm font-medium ml-auto">
                        <CheckCircle2 className="w-4 h-4" /> Completed
                      </span>
                    )}
                  </div>

                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Submit Work Modal */}
      {submitModalJob && (
        <SubmitWorkModal
          jobId={submitModalJob.id}
          jobTitle={submitModalJob.title}
          onClose={() => setSubmitModalJob(null)}
          onSuccess={refreshHustles}
        />
      )}

      {/* Review Client Modal */}
      {reviewModalJob && (
        <FreelancerReviewModal
          jobId={reviewModalJob.id}
          jobTitle={reviewModalJob.title}
          clientId={reviewModalJob.clientId}
          clientName={reviewModalJob.clientName}
          onClose={() => setReviewModalJob(null)}
          onSuccess={() => {
            setReviewedJobs(prev => { const next = new Set(Array.from(prev)); next.add(reviewModalJob.id); return next })
            setReviewModalJob(null)
          }}
        />
      )}
    </div>
  )
}
