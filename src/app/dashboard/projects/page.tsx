'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePostJobModal } from '../../components/PostJobModalContext'
import { cachedFetch, invalidateCache } from '@/lib/fetch-cache'
import RevisionRequestModal from '@/app/components/RevisionRequestModal'
import PostApprovalFlow from '@/app/components/PostApprovalFlow'
import ClientReviewModal from '@/app/components/ClientReviewModal'
import ReviewReminderPopup from '@/app/components/ReviewReminderPopup'
import EditJobModal from '@/app/components/EditJobModal'
import {
  Briefcase,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  DollarSign,
  Star,
  Shield,
  Loader2,
  Plus,
  FileCheck,
  Send,
  RotateCcw,
  Eye,
  Download,
  Image,
  FileText,
  File,
  BarChart3,
  Crown,
  ExternalLink,
} from 'lucide-react'

interface SubmissionFile {
  name: string
  size: number
  type: string
  path: string
  url: string | null
}

interface SubmissionDetails {
  description: string
  deliverables: string
  notes: string
  files: SubmissionFile[]
  submitted_at: string
  submitted_by: string
  freelancer_name: string
}

interface Job {
  id: string
  title: string
  description: string
  budget_min: number
  budget_max: number
  status: string
  created_at: string
  deadline?: string
  category?: string
  proposals_count?: number
  submission_details?: SubmissionDetails | null
  work_progress?: number
  revision_progress?: number
}

interface Proposal {
  id: string
  freelancer_id: string
  bid_amount: number
  cover_letter: string
  status: string
  submitted_at: string
  freelancer?: {
    id: string
    full_name: string
    avatar_url?: string
    title?: string
    hustle_score?: number
    verification_status?: string
    jobs_completed?: number
    hourly_rate?: number
    is_pro?: boolean
  }
}

const statusConfig: Record<string, { color: string; label: string }> = {
  Open: { color: 'bg-green-50 text-green-700', label: 'Open' },
  'In-Progress': { color: 'bg-blue-50 text-blue-700', label: 'In Progress' },
  Review: { color: 'bg-amber-50 text-amber-700', label: 'Awaiting Review' },
  Completed: { color: 'bg-gray-100 text-gray-600', label: 'Completed' },
  Cancelled: { color: 'bg-red-50 text-red-700', label: 'Cancelled' },
  Draft: { color: 'bg-yellow-50 text-yellow-700', label: 'Draft' },
}

export default function ClientProjectsPage() {
  const { user, profile, orgMode, activeOrg } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedJob, setExpandedJob] = useState<string | null>(null)
  const [proposals, setProposals] = useState<Record<string, Proposal[]>>({})
  const [loadingProposals, setLoadingProposals] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [reviewingJob, setReviewingJob] = useState<string | null>(null)
  const [reviewMsg, setReviewMsg] = useState('')
  const [hireMsg, setHireMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [previewFile, setPreviewFile] = useState<SubmissionFile | null>(null)
  const [revisionModalJob, setRevisionModalJob] = useState<{ id: string; title: string } | null>(null)
  const [approvalFlowJob, setApprovalFlowJob] = useState<{ id: string; title: string } | null>(null)
  const [clientReviewJob, setClientReviewJob] = useState<{ id: string; title: string } | null>(null)
  const [reviewedJobs, setReviewedJobs] = useState<Set<string>>(new Set())
  const [viewingCompletedJob, setViewingCompletedJob] = useState<string | null>(null)
  const [editJobModal, setEditJobModal] = useState<{ id: string; title: string } | null>(null)
  const { openModal: openPostJobModal } = usePostJobModal()

  const openReview = (jobId: string) => {
    setReviewingJob(reviewingJob === jobId ? null : jobId)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || ''
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return Image
    if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext)) return FileText
    return File
  }

  const isPreviewable = (file: SubmissionFile) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf'].includes(ext)
  }

  const isImage = (file: SubmissionFile) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)
  }

  const handleApproveWork = async (jobId: string, jobTitle: string) => {
    setReviewMsg('')
    setActionLoading(jobId)
    try {
      const res = await fetch(`/api/jobs/${jobId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', message: '' }),
      })
      const data = await res.json()
      if (res.ok) {
        setReviewingJob(null)
        // Launch post-approval flow (review → escrow release)
        setApprovalFlowJob({ id: jobId, title: jobTitle })
      } else {
        setReviewMsg(data.error || 'Action failed')
      }
    } catch {
      setReviewMsg('Network error')
    }
    setActionLoading(null)
  }

  const refreshJobs = async () => {
    const query = orgMode && activeOrg 
      ? `/api/jobs?organization_id=${activeOrg.id}&limit=50`
      : '/api/jobs?my=true&limit=50'
    const jobsRes = await fetch(query)
    const jobsData = await jobsRes.json()
    if (jobsData.jobs) setJobs(jobsData.jobs)
  }

  const hasMounted = useRef(false)

  useEffect(() => {
    if (!user) return

    // On first mount, try to show cached data instantly
    if (!hasMounted.current) {
      hasMounted.current = true
      const query = orgMode && activeOrg ? `/api/jobs?organization_id=${activeOrg.id}&limit=50` : '/api/jobs?my=true&limit=50'
      const cached = cachedFetch<{ jobs?: Job[] }>(query, (data) => {
        if (data.jobs) setJobs(data.jobs)
        setLoading(false)
      })
      if (cached?.jobs) {
        setJobs(cached.jobs)
        setLoading(false)
      }
    } else {
      // Subsequent renders (e.g. after mutation): fresh fetch
      fetch(orgMode && activeOrg ? `/api/jobs?organization_id=${activeOrg.id}&limit=50` : '/api/jobs?my=true&limit=50')
        .then(r => r.json())
        .then(data => { if (data.jobs) setJobs(data.jobs) })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [user, orgMode, activeOrg])

  // Poll for progress updates on active jobs every 10s
  useEffect(() => {
    if (!user || jobs.length === 0) return
    const hasActive = jobs.some(j => ['In-Progress', 'Review'].includes(j.status))
    if (!hasActive) return

    const interval = setInterval(async () => {
      try {
        const query = orgMode && activeOrg ? `/api/jobs?organization_id=${activeOrg.id}&limit=50` : '/api/jobs?my=true&limit=50'
        const res = await fetch(query)
        const data = await res.json()
        if (data.jobs) setJobs(data.jobs)
      } catch {}
    }, 30000)

    return () => clearInterval(interval)
  }, [user, jobs.length])

  // Auto-load proposals for In-Progress/Review jobs so Message links have receiver info
  useEffect(() => {
    if (jobs.length === 0) return
    const activeJobs = jobs.filter(j => ['In-Progress', 'Review'].includes(j.status))
    activeJobs.forEach(async (job) => {
      if (proposals[job.id]) return // already loaded
      try {
        const res = await fetch(`/api/jobs/${job.id}/proposals`)
        const data = await res.json()
        if (data.proposals) {
          setProposals(prev => ({ ...prev, [job.id]: data.proposals }))
        }
      } catch {}
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs])

  const toggleProposals = async (jobId: string) => {
    if (expandedJob === jobId) {
      setExpandedJob(null)
      return
    }
    setExpandedJob(jobId)
    if (!proposals[jobId]) {
      setLoadingProposals(jobId)
      try {
        const res = await fetch(`/api/jobs/${jobId}/proposals`)
        const data = await res.json()
        if (data.proposals) {
          setProposals(prev => ({ ...prev, [jobId]: data.proposals }))
        }
      } catch {}
      setLoadingProposals(null)
    }
  }

  const handleProposalAction = async (proposalId: string, action: 'accept' | 'reject', jobId: string) => {
    setActionLoading(proposalId)
    setHireMsg(null)
    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()

      if (res.ok) {
        // Invalidate cache so next load gets fresh data
        invalidateCache(orgMode && activeOrg ? `/api/jobs?organization_id=${activeOrg.id}&limit=50` : '/api/jobs?my=true&limit=50')

        if (action === 'accept') {
          setHireMsg({ type: 'success', text: 'Freelancer hired & escrow funded! Payment is held securely until you approve the work.' })
        } else {
          setHireMsg({ type: 'success', text: 'Proposal rejected.' })
        }

        // Refresh proposals for this job
        const propRes = await fetch(`/api/jobs/${jobId}/proposals`)
        const propData = await propRes.json()
        if (propData.proposals) {
          setProposals(prev => ({ ...prev, [jobId]: propData.proposals }))
        }
        // Refresh jobs list too (status may have changed)
        const jobsQuery = orgMode && activeOrg ? `/api/jobs?organization_id=${activeOrg.id}&limit=50` : '/api/jobs?my=true&limit=50'
        const jobsRes = await fetch(jobsQuery)
        const jobsData = await jobsRes.json()
        if (jobsData.jobs) setJobs(jobsData.jobs)
      } else {
        setHireMsg({ type: 'error', text: data.error || 'Action failed. Please try again.' })
      }
    } catch {
      setHireMsg({ type: 'error', text: 'Network error. Please check your connection and try again.' })
    }
    setActionLoading(null)
  }

  // Build a message URL with receiver info for a given job
  const getMessageUrl = (job: Job) => {
    const jobProposals = proposals[job.id] || []
    const hired = jobProposals.find(p => p.status === 'Accepted')
    const base = `/dashboard/messages?job_id=${job.id}`
    if (hired?.freelancer) {
      return `${base}&to=${hired.freelancer_id}&name=${encodeURIComponent(hired.freelancer.full_name || 'Freelancer')}&title=${encodeURIComponent(job.title)}`
    }
    return `${base}&title=${encodeURIComponent(job.title)}`
  }

  const openCount = jobs.filter(j => j.status === 'Open').length
  const inProgressCount = jobs.filter(j => j.status === 'In-Progress').length
  const completedCount = jobs.filter(j => j.status === 'Completed').length
  const totalProposals = jobs.reduce((sum, j) => sum + (j.proposals_count || 0), 0)

  return (
    <div className="p-4 lg:p-6 xl:p-8 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{orgMode && activeOrg ? 'Organization Jobs' : 'My Projects'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{jobs.length} total {orgMode && activeOrg ? 'org jobs' : 'projects'}</p>
        </div>
        <button onClick={() => openPostJobModal()} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Post New Job
        </button>
      </div>

      {/* Hire/Action Message */}
      {hireMsg && (
        <div className={`p-4 rounded-xl mb-6 flex items-start justify-between gap-3 ${hireMsg.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div>
            <p className={`text-sm font-medium ${hireMsg.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{hireMsg.text}</p>
            {hireMsg.type === 'success' && hireMsg.text.includes('hired') && (
              <Link href={`/dashboard/messages?job_id=${jobs.find(j => j.status === 'In-Progress')?.id || ''}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:text-green-800 mt-2 transition-colors">
                <MessageSquare className="w-4 h-4" /> Go to Messages →
              </Link>
            )}
          </div>
          <button onClick={() => setHireMsg(null)} className={`text-xs font-medium shrink-0 ${hireMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>✕</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{openCount}</p>
              <p className="text-xs text-gray-500">Open</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-blue-600">{inProgressCount}</p>
              <p className="text-xs text-gray-500">In Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-600">{completedCount}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-amber-600">{totalProposals}</p>
              <p className="text-xs text-gray-500">Proposals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
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
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-xl p-10 border border-gray-200 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-900 font-semibold mb-1">No projects yet</p>
          <p className="text-gray-500 text-sm mb-5">Post your first job to start finding freelancers</p>
          <button onClick={() => openPostJobModal()} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm inline-flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" /> Post Your First Job
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow">
              {/* Job Header */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/jobs/${job.id}`} className="font-semibold text-gray-900 hover:text-green-700 transition-colors text-base">
                      {job.title}
                    </Link>
                    {job.category && <p className="text-xs text-gray-500 mt-0.5">{job.category}</p>}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold shrink-0 ${statusConfig[job.status]?.color || 'bg-gray-50 text-gray-600'}`}>
                    {statusConfig[job.status]?.label || job.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> KES {job.budget_min?.toLocaleString()}{job.budget_max && job.budget_max !== job.budget_min ? ` – ${job.budget_max.toLocaleString()}` : ''}
                  </span>
                  {job.deadline && (
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Due: {new Date(job.deadline).toLocaleDateString()}</span>
                  )}
                  <span>Posted: {new Date(job.created_at).toLocaleDateString()}</span>
                </div>

                {/* Progress Bars for In-Progress / Review jobs */}
                {(job.status === 'In-Progress' || job.status === 'Review') && ((job.work_progress || 0) > 0 || (job.revision_progress || 0) > 0) && (
                  <div className="space-y-2.5 mb-4">
                    {/* Work Progress */}
                    {(job.work_progress || 0) > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-xs font-semibold text-gray-700">Work Progress</span>
                          </div>
                          <span className={`text-xs font-bold ${(job.work_progress || 0) >= 75 ? 'text-green-600' : (job.work_progress || 0) >= 50 ? 'text-amber-600' : 'text-blue-600'}`}>
                            {job.work_progress || 0}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              (job.work_progress || 0) >= 75 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                              (job.work_progress || 0) >= 50 ? 'bg-gradient-to-r from-amber-400 to-yellow-500' :
                              (job.work_progress || 0) >= 25 ? 'bg-gradient-to-r from-blue-400 to-cyan-500' :
                              'bg-gradient-to-r from-gray-300 to-gray-400'
                            }`}
                            style={{ width: `${job.work_progress || 0}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Revision Progress */}
                    {(job.revision_progress || 0) > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-xs font-semibold text-gray-700">Revision Progress</span>
                          </div>
                          <span className={`text-xs font-bold ${(job.revision_progress || 0) >= 75 ? 'text-green-600' : (job.revision_progress || 0) >= 50 ? 'text-amber-600' : 'text-blue-600'}`}>
                            {job.revision_progress || 0}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              (job.revision_progress || 0) >= 75 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                              (job.revision_progress || 0) >= 50 ? 'bg-gradient-to-r from-amber-400 to-yellow-500' :
                              (job.revision_progress || 0) >= 25 ? 'bg-gradient-to-r from-blue-400 to-cyan-500' :
                              'bg-gradient-to-r from-gray-300 to-gray-400'
                            }`}
                            style={{ width: `${job.revision_progress || 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                  {/* View Proposals Button */}
                  {(job.status === 'Open' || job.status === 'In-Progress') && (
                    <button
                      onClick={() => toggleProposals(job.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-sm transition-colors ${
                        expandedJob === job.id ? 'bg-green-100 text-green-700' : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      Proposals ({job.proposals_count || 0})
                      {expandedJob === job.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  <Link href={`/jobs/${job.id}`} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium text-sm transition-colors">
                    View Job
                  </Link>

                  {(job.status === 'In-Progress' || job.status === 'Review') && (
                    <Link href={getMessageUrl(job)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium text-sm transition-colors">
                      <MessageSquare className="w-3.5 h-3.5" /> Message
                    </Link>
                  )}

                  {job.status === 'Open' && (
                    <>
                      <button
                        onClick={() => setEditJobModal({ id: job.id, title: job.title })}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-sm transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" /> Edit Job
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Are you sure you want to close "${job.title}"? This will stop receiving new proposals.`)) return
                          try {
                            const res = await fetch(`/api/jobs/${job.id}/close`, { method: 'POST' })
                            const data = await res.json()
                            if (res.ok) {
                              refreshJobs()
                            } else {
                              alert(data.error || 'Failed to close job')
                            }
                          } catch {
                            alert('Network error')
                          }
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium text-sm transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Close Job
                      </button>
                    </>
                  )}

                  {(job.status === 'In-Progress' || job.status === 'Review') && (
                    <button
                      onClick={() => openReview(job.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium text-sm transition-colors"
                    >
                      <FileCheck className="w-3.5 h-3.5" /> {job.status === 'Review' ? 'Review Work' : 'View Details'}
                    </button>
                  )}

                  {/* Cancel Job Button */}
                  {(job.status === 'In-Progress' || job.status === 'Review') && (
                    <button
                      onClick={async () => {
                        if (!confirm(`Are you sure you want to cancel "${job.title}"? This action cannot be undone and any escrow funds will be refunded.`)) return
                        try {
                          const res = await fetch(`/api/jobs/${job.id}/cancel`, { method: 'POST' })
                          const data = await res.json()
                          if (res.ok) {
                            refreshJobs()
                          } else {
                            alert(data.error || 'Failed to cancel job')
                          }
                        } catch {
                          alert('Network error')
                        }
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-medium text-sm transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel Job
                    </button>
                  )}

                  {/* Completed Job Actions */}
                  {job.status === 'Completed' && (
                    <>
                      {job.submission_details && (
                        <button
                          onClick={() => setViewingCompletedJob(viewingCompletedJob === job.id ? null : job.id)}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium text-sm transition-colors ${
                            viewingCompletedJob === job.id ? 'bg-blue-100 text-blue-700' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" /> View Submission
                          {viewingCompletedJob === job.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      {!reviewedJobs.has(job.id) && (
                        <button
                          onClick={() => setClientReviewJob({ id: job.id, title: job.title })}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium text-sm transition-colors"
                        >
                          <Star className="w-3.5 h-3.5" /> Leave Review
                        </button>
                      )}
                      <Link href={getMessageUrl(job)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium text-sm transition-colors">
                        <MessageSquare className="w-3.5 h-3.5" /> Message
                      </Link>
                      <span className="flex items-center gap-1 text-green-600 text-xs font-medium ml-auto">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                      </span>
                    </>
                  )}
                </div>

                {/* Review Work Panel */}
                {reviewingJob === job.id && job.status === 'Review' && (() => {
                  const sub = job.submission_details
                  return (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                      <p className="text-sm font-medium text-amber-800 mb-1">Work submitted for your review</p>
                      <p className="text-xs text-amber-600">
                        {sub ? `Submitted by ${sub.freelancer_name} on ${new Date(sub.submitted_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}` : 'Review the work below, then approve or request revisions.'}
                      </p>
                    </div>

                    {sub ? (
                      <div className="space-y-4 mb-4">
                        {/* Description */}
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                          <p className="text-sm font-bold text-gray-900 mb-2">Description</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{sub.description}</p>
                        </div>

                        {/* Deliverables */}
                        {sub.deliverables && (
                          <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <p className="text-sm font-bold text-gray-900 mb-2">Deliverables</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{sub.deliverables}</p>
                          </div>
                        )}

                        {/* Notes */}
                        {sub.notes && (
                          <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <p className="text-sm font-bold text-gray-900 mb-2">Notes from Freelancer</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{sub.notes}</p>
                          </div>
                        )}

                        {/* Files */}
                        {sub.files && sub.files.length > 0 && (
                          <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <p className="text-sm font-bold text-gray-900 mb-3">Attached Files ({sub.files.length})</p>
                            <div className="space-y-2">
                              {sub.files.map((file, idx) => {
                                const Icon = getFileIcon(file.name)
                                return (
                                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    {/* Thumbnail / Icon */}
                                    {isImage(file) && file.url ? (
                                      <img src={file.url} alt={file.name} className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                                    ) : (
                                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-gray-200 shrink-0">
                                        <Icon className="w-5 h-5 text-gray-400" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                      <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {isPreviewable(file) && file.url && (
                                        <button
                                          onClick={() => setPreviewFile(file)}
                                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                          title="Preview"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </button>
                                      )}
                                      {file.url && (
                                        <a
                                          href={file.url}
                                          download={file.name}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                          title="Download"
                                        >
                                          <Download className="w-4 h-4" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 mb-4 p-3 bg-gray-50 rounded-lg">
                        No structured submission details available. Check <Link href={getMessageUrl(job)} className="text-green-600 underline">Messages</Link> for details.
                      </div>
                    )}

                    {reviewMsg && (
                      <p className={`text-xs mb-3 ${reviewMsg.includes('approved') ? 'text-green-600' : 'text-red-600'}`}>{reviewMsg}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveWork(job.id, job.title)}
                        disabled={actionLoading === job.id}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                      >
                        {actionLoading === job.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Approve Work
                      </button>
                      <button
                        onClick={() => { setReviewingJob(null); setRevisionModalJob({ id: job.id, title: job.title }) }}
                        className="border border-amber-300 hover:bg-amber-50 text-amber-700 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Request Revision
                      </button>
                      <button
                        onClick={() => { setReviewingJob(null); setReviewMsg('') }}
                        className="text-gray-500 hover:text-gray-700 text-sm font-medium ml-auto"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                  )
                })()}

                {/* Completed Job Submission Viewer */}
                {viewingCompletedJob === job.id && job.status === 'Completed' && (() => {
                  const sub = job.submission_details
                  if (!sub) return null
                  return (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                        <p className="text-sm font-medium text-green-800 mb-1">Completed Work Submission</p>
                        <p className="text-xs text-green-600">
                          Submitted by {sub.freelancer_name} on {new Date(sub.submitted_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                        </p>
                      </div>

                      <div className="space-y-4 mb-4">
                        {sub.description && (
                          <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <p className="text-sm font-bold text-gray-900 mb-2">Description</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{sub.description}</p>
                          </div>
                        )}

                        {sub.deliverables && (
                          <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <p className="text-sm font-bold text-gray-900 mb-2">Deliverables</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{sub.deliverables}</p>
                          </div>
                        )}

                        {sub.notes && (
                          <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <p className="text-sm font-bold text-gray-900 mb-2">Notes from Freelancer</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{sub.notes}</p>
                          </div>
                        )}

                        {sub.files && sub.files.length > 0 && (
                          <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <p className="text-sm font-bold text-gray-900 mb-3">Attached Files ({sub.files.length})</p>
                            <div className="space-y-2">
                              {sub.files.map((file, idx) => {
                                const Icon = getFileIcon(file.name)
                                return (
                                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    {isImage(file) && file.url ? (
                                      <img src={file.url} alt={file.name} className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                                    ) : (
                                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-gray-200 shrink-0">
                                        <Icon className="w-5 h-5 text-gray-400" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                      <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {isPreviewable(file) && file.url && (
                                        <button
                                          onClick={() => setPreviewFile(file)}
                                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                          title="Preview"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </button>
                                      )}
                                      {file.url && (
                                        <a
                                          href={file.url}
                                          download={file.name}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                          title="Download"
                                        >
                                          <Download className="w-4 h-4" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setViewingCompletedJob(null)}
                        className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                      >
                        Close
                      </button>
                    </div>
                  )
                })()}
              </div>

              {/* Expanded Proposals Section */}
              {expandedJob === job.id && (
                <div className="border-t border-gray-100 bg-gray-50/70">
                  {loadingProposals === job.id ? (
                    <div className="p-8 text-center">
                      <Loader2 className="w-6 h-6 text-green-500 animate-spin mx-auto" />
                      <p className="text-sm text-gray-500 mt-2">Loading proposals...</p>
                    </div>
                  ) : !proposals[job.id] || proposals[job.id].length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Users className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">No proposals received yet</p>
                      <p className="text-xs text-gray-400 mt-1">Proposals will appear here when freelancers apply</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      <div className="px-5 py-3 bg-gray-100/50">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{proposals[job.id].length} Proposal{proposals[job.id].length !== 1 ? 's' : ''}</p>
                      </div>
                      {proposals[job.id].map((proposal) => (
                        <div key={proposal.id} className="p-5 bg-white">
                          <div className="flex items-start gap-4">
                            {/* Freelancer Avatar */}
                            {proposal.freelancer?.avatar_url ? (
                              <img src={proposal.freelancer.avatar_url} alt={proposal.freelancer.full_name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-11 h-11 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {proposal.freelancer?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                                    {proposal.freelancer?.full_name}
                                    {proposal.freelancer?.is_pro && (
                                      <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full"><Crown className="w-2.5 h-2.5" />PRO</span>
                                    )}
                                  </p>
                                  {proposal.freelancer?.title && (
                                    <p className="text-xs text-gray-500">{proposal.freelancer.title}</p>
                                  )}
                                </div>
                                <div className="text-right shrink-0 ml-3">
                                  <p className="font-bold text-green-600 text-sm">KES {proposal.bid_amount?.toLocaleString()}</p>
                                  {proposal.status !== 'Pending' && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                      proposal.status === 'Accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                      {proposal.status}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Freelancer Stats */}
                              <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                                {proposal.freelancer?.hustle_score != null && (
                                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" /> {proposal.freelancer.hustle_score}</span>
                                )}
                                {proposal.freelancer?.jobs_completed != null && (
                                  <span>{proposal.freelancer.jobs_completed} jobs</span>
                                )}
                                {(proposal.freelancer?.verification_status === 'Verified' || proposal.freelancer?.verification_status === 'verified') && (
                                  <span className="flex items-center gap-1 text-green-600"><Shield className="w-3 h-3" /> Verified</span>
                                )}
                                {proposal.freelancer?.hourly_rate != null && (
                                  <span>KES {proposal.freelancer.hourly_rate}/hr</span>
                                )}
                              </div>

                              {/* Cover Letter */}
                              <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">{proposal.cover_letter}</p>

                              {/* Action Buttons */}
                              {proposal.status === 'Pending' && (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <button
                                    onClick={() => handleProposalAction(proposal.id, 'accept', job.id)}
                                    disabled={actionLoading === proposal.id}
                                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                                  >
                                    {actionLoading === proposal.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="w-4 h-4" />
                                    )}
                                    Hire &amp; Fund Escrow
                                  </button>
                                  <button
                                    onClick={() => handleProposalAction(proposal.id, 'reject', job.id)}
                                    disabled={actionLoading === proposal.id}
                                    className="border border-gray-300 hover:bg-red-50 hover:border-red-200 hover:text-red-600 disabled:opacity-50 text-gray-600 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                                  >
                                    <XCircle className="w-4 h-4" /> Reject
                                  </button>
                                  <Link href={`/dashboard/messages?job_id=${job.id}&to=${proposal.freelancer_id}&name=${encodeURIComponent(proposal.freelancer?.full_name || 'Freelancer')}&title=${encodeURIComponent(job.title)}`} className="text-gray-400 hover:text-gray-600 text-sm font-medium ml-auto flex items-center gap-1 transition-colors">
                                    <MessageSquare className="w-4 h-4" /> Message
                                  </Link>
                                </div>
                              )}
                              {proposal.status === 'Accepted' && (
                                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                                  <CheckCircle2 className="w-4 h-4" /> Hired
                                  <Link href={`/dashboard/messages?job_id=${job.id}&to=${proposal.freelancer_id}&name=${encodeURIComponent(proposal.freelancer?.full_name || 'Freelancer')}&title=${encodeURIComponent(job.title)}`} className="ml-auto text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
                                    <MessageSquare className="w-4 h-4" /> Message
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Revision Request Modal */}
      {revisionModalJob && (
        <RevisionRequestModal
          jobId={revisionModalJob.id}
          jobTitle={revisionModalJob.title}
          onClose={() => setRevisionModalJob(null)}
          onSuccess={refreshJobs}
        />
      )}

      {/* Post-Approval Flow (Review → Escrow Release) */}
      {approvalFlowJob && (
        <PostApprovalFlow
          jobId={approvalFlowJob.id}
          jobTitle={approvalFlowJob.title}
          onComplete={() => {
            setApprovalFlowJob(null)
            refreshJobs()
          }}
        />
      )}

      {/* Edit Job Modal */}
      {editJobModal && (
        <EditJobModal
          jobId={editJobModal.id}
          jobTitle={editJobModal.title}
          onClose={() => setEditJobModal(null)}
          onSuccess={refreshJobs}
        />
      )}

      {/* Client Review Modal (for completed jobs) */}
      {clientReviewJob && (
        <ClientReviewModal
          jobId={clientReviewJob.id}
          jobTitle={clientReviewJob.title}
          onClose={() => setClientReviewJob(null)}
          onSuccess={() => {
            setReviewedJobs(prev => { const next = new Set(Array.from(prev)); next.add(clientReviewJob.id); return next })
            setClientReviewJob(null)
          }}
        />
      )}

      {/* Review Reminder Popup */}
      <ReviewReminderPopup
        onReview={(jobId, jobTitle) => setClientReviewJob({ id: jobId, title: jobTitle })}
      />

      {/* File Preview Modal */}
      {previewFile && previewFile.url && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewFile(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{previewFile.name}</p>
                <p className="text-xs text-gray-400">{formatFileSize(previewFile.size)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewFile.url}
                  download={previewFile.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <button onClick={() => setPreviewFile(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-50 p-4">
              {isImage(previewFile) ? (
                <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
              ) : previewFile.name.toLowerCase().endsWith('.pdf') ? (
                <iframe src={previewFile.url} className="w-full h-[70vh] rounded-lg border border-gray-200" title={previewFile.name} />
              ) : (
                <div className="text-center py-12">
                  <File className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Preview not available for this file type</p>
                  <a
                    href={previewFile.url}
                    download={previewFile.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download to View
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
