'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '../../components/AuthModalContext'
import { useApplyJobModal } from '../../components/ApplyJobModalContext'
import {
  MapPin,
  Shield,
  Clock,
  Briefcase,
  DollarSign,
  Eye,
  FileText,
  Users,
  Star,
  Globe,
  CheckCircle2,
  Loader2,
  Share2,
  Bookmark,
  AlertCircle,
  Pencil,
  Trash2,
  XCircle,
  ExternalLink,
  TrendingUp,
  Zap,
  MessageSquare,
  ChevronRight,
  X,
  Save,
  Building2,
} from 'lucide-react'

interface Job {
  id: string
  title: string
  description: string
  budget_min: number
  budget_max: number
  payment_type: string
  skills_required: string[]
  tags: string[]
  location_preference: string
  remote_allowed: boolean
  requires_verified_only: boolean
  requires_swahili: boolean
  min_hustle_score: number
  status: string
  proposals_count: number
  views_count: number
  deadline: string | null
  created_at: string
  organization_id?: string
  client?: {
    id: string
    full_name: string
    avatar_url?: string
    verification_status?: string
    hustle_score?: number
    location?: string
    county?: string
  }
  organization?: {
    id: string
    name: string
    logo_url?: string
  } | null
}

interface SimilarJob {
  id: string
  title: string
  budget_min: number
  budget_max: number
  skills_required: string[]
  created_at: string
  proposals_count: number
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user, profile } = useAuth()
  const { openLogin } = useAuthModal()
  const { openModal: openApplyModal } = useApplyJobModal()

  const [job, setJob] = useState<Job | null>(null)
  const [similarJobs, setSimilarJobs] = useState<SimilarJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Owner state
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', description: '', budget_min: 0, budget_max: 0 })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [actionMsg, setActionMsg] = useState({ text: '', type: '' })
  const [statusChanging, setStatusChanging] = useState(false)

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${params.id}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Job not found')
      } else {
        setJob(data.job)
      }
    } catch {
      setError('Failed to load job')
    }
    setLoading(false)
  }, [params.id])

  useEffect(() => {
    fetchJob()
  }, [fetchJob])

  // Fetch similar jobs
  useEffect(() => {
    if (!job) return
    fetch(`/api/jobs?limit=4&status=Open`)
      .then(r => r.json())
      .then(data => {
        if (data.jobs) {
          setSimilarJobs(data.jobs.filter((j: SimilarJob) => j.id !== job.id).slice(0, 3))
        }
      })
      .catch(() => {})
  }, [job])

  const isOwner = !!(profile?.id && job?.client?.id && profile.id === job.client.id)
  const canEdit = isOwner && (job?.proposals_count || 0) === 0

  const handleApply = () => {
    if (!user) {
      openLogin()
      return
    }
    if (job) openApplyModal(job)
  }

  const startEdit = () => {
    if (!job) return
    setEditForm({
      title: job.title,
      description: job.description,
      budget_min: job.budget_min,
      budget_max: job.budget_max,
    })
    setIsEditing(true)
    setActionMsg({ text: '', type: '' })
  }

  const handleSaveEdit = async () => {
    if (!job) return
    setSaving(true)
    setActionMsg({ text: '', type: '' })
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (!res.ok) {
        setActionMsg({ text: data.error || 'Failed to save', type: 'error' })
      } else {
        setJob(data.job)
        setIsEditing(false)
        setActionMsg({ text: 'Job updated successfully', type: 'success' })
      }
    } catch {
      setActionMsg({ text: 'Network error', type: 'error' })
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!job) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/jobs/${job.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        setActionMsg({ text: data.error || 'Failed to delete', type: 'error' })
        setDeleting(false)
      } else {
        router.push('/dashboard/projects')
      }
    } catch {
      setActionMsg({ text: 'Network error', type: 'error' })
      setDeleting(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!job) return
    setStatusChanging(true)
    setActionMsg({ text: '', type: '' })
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) {
        setActionMsg({ text: data.error || 'Failed to update status', type: 'error' })
      } else {
        setJob(data.job)
        setActionMsg({ text: `Status changed to ${newStatus}`, type: 'success' })
      }
    } catch {
      setActionMsg({ text: 'Network error', type: 'error' })
    }
    setStatusChanging(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header activeLink="/jobs" />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/jobs" className="hover:text-green-600 transition-colors">Jobs</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900 font-medium truncate max-w-xs">{job?.title || 'Loading...'}</span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl p-16 border border-gray-200 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-green-600 animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Loading job details...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-white rounded-2xl p-16 border border-gray-200 text-center">
            <AlertCircle className="w-14 h-14 text-red-300 mx-auto mb-4" />
            <p className="text-gray-700 font-semibold text-lg mb-2">{error}</p>
            <p className="text-gray-500 text-sm mb-6">The job may have been removed or the link is incorrect.</p>
            <Link href="/jobs" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors inline-block">
              Browse All Jobs
            </Link>
          </div>
        )}

        {/* Job Detail */}
        {job && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ─── Main Content ─── */}
            <div className="lg:col-span-8 space-y-6">
              {/* Action Message */}
              {actionMsg.text && (
                <div className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between ${
                  actionMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <span>{actionMsg.text}</span>
                  <button onClick={() => setActionMsg({ text: '', type: '' })}><X className="w-4 h-4" /></button>
                </div>
              )}

              {/* Header Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Status bar */}
                <div className={`px-6 py-2.5 text-xs font-semibold tracking-wide uppercase ${
                  job.status === 'Open' ? 'bg-green-600 text-white' :
                  job.status === 'In-Progress' ? 'bg-blue-600 text-white' :
                  job.status === 'Completed' ? 'bg-gray-600 text-white' :
                  job.status === 'Cancelled' ? 'bg-red-600 text-white' :
                  'bg-yellow-500 text-white'
                }`}>
                  {job.status === 'Open' ? '🟢 Open for Proposals' :
                   job.status === 'In-Progress' ? '🔵 In Progress' :
                   job.status === 'Completed' ? '✅ Completed' :
                   job.status === 'Cancelled' ? '❌ Cancelled' : job.status}
                </div>

                <div className="p-6">
                  {/* Title + actions */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                          className="w-full text-2xl font-bold text-gray-900 border border-gray-300 rounded-xl px-4 py-2 focus:border-green-500 focus:outline-none"
                        />
                      ) : (
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{job.title}</h1>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-2">
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {timeAgo(job.created_at)}</span>
                        <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {job.views_count || 0} views</span>
                        <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> {job.proposals_count || 0} proposals</span>
                        {job.payment_type && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{job.payment_type}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Save"><Bookmark className="w-5 h-5 text-gray-400" /></button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Share"><Share2 className="w-5 h-5 text-gray-400" /></button>
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border border-green-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-green-600 uppercase tracking-wide mb-1">Budget</p>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-sm">KES</span>
                            <input type="number" value={editForm.budget_min} onChange={e => setEditForm(f => ({ ...f, budget_min: +e.target.value }))}
                              className="w-28 border border-gray-300 rounded-lg px-3 py-1.5 font-bold text-lg focus:border-green-500 focus:outline-none" />
                            <span className="text-gray-400">—</span>
                            <input type="number" value={editForm.budget_max} onChange={e => setEditForm(f => ({ ...f, budget_max: +e.target.value }))}
                              className="w-28 border border-gray-300 rounded-lg px-3 py-1.5 font-bold text-lg focus:border-green-500 focus:outline-none" />
                          </div>
                        ) : (
                          <p className="text-2xl font-bold text-green-700">
                            KES {job.budget_min?.toLocaleString()}
                            {job.budget_max && job.budget_max !== job.budget_min && ` – ${job.budget_max.toLocaleString()}`}
                          </p>
                        )}
                      </div>
                      <DollarSign className="w-10 h-10 text-green-200" />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-2">
                    <h2 className="font-semibold text-gray-900 mb-3 text-lg">Job Description</h2>
                    {isEditing ? (
                      <textarea
                        value={editForm.description}
                        onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                        rows={10}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-700 leading-relaxed focus:border-green-500 focus:outline-none resize-none"
                      />
                    ) : (
                      <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">{job.description}</div>
                    )}
                  </div>

                  {/* Edit actions */}
                  {isEditing && (
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                      <button onClick={handleSaveEdit} disabled={saving}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                      </button>
                      <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills */}
              {job.skills_required?.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h2 className="font-semibold text-gray-900 mb-3">Skills Required</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.skills_required.map(skill => (
                      <Link key={skill} href={`/jobs?search=${encodeURIComponent(skill)}`}
                        className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors">
                        {skill}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements */}
              {(job.requires_verified_only || job.requires_swahili || (job.min_hustle_score && job.min_hustle_score > 0)) && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h2 className="font-semibold text-gray-900 mb-3">Requirements</h2>
                  <div className="space-y-3">
                    {job.requires_verified_only && (
                      <div className="flex items-center gap-3 text-sm"><Shield className="w-5 h-5 text-green-600" /><span className="text-gray-700">Verified freelancers only</span></div>
                    )}
                    {job.requires_swahili && (
                      <div className="flex items-center gap-3 text-sm"><Globe className="w-5 h-5 text-blue-600" /><span className="text-gray-700">Swahili speaker required</span></div>
                    )}
                    {job.min_hustle_score > 0 && (
                      <div className="flex items-center gap-3 text-sm"><Star className="w-5 h-5 text-yellow-500" /><span className="text-gray-700">Minimum Hustle Score: {job.min_hustle_score}</span></div>
                    )}
                  </div>
                </div>
              )}

              {/* Similar Jobs — shown to freelancers / non-owners */}
              {!isOwner && similarJobs.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-900">Similar Jobs</h2>
                    <Link href="/jobs" className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1">
                      View all <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {similarJobs.map(sj => (
                      <Link key={sj.id} href={`/jobs/${sj.id}`}
                        className="block p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all group">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 group-hover:text-green-700 transition-colors truncate">{sj.title}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span>KES {(sj.budget_max || sj.budget_min)?.toLocaleString()}</span>
                              <span>{sj.proposals_count || 0} proposals</span>
                              <span>{timeAgo(sj.created_at)}</span>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-green-500 shrink-0 mt-1" />
                        </div>
                        {sj.skills_required?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {sj.skills_required.slice(0, 3).map(s => (
                              <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s}</span>
                            ))}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ─── Sidebar ─── */}
            <div className="lg:col-span-4 space-y-6">
              {/* Apply CTA — Freelancers / logged-out users */}
              {job.status === 'Open' && !isOwner && (
                <div className={`bg-white rounded-2xl p-6 border shadow-sm ${job.organization_id && job.organization ? 'border-slate-300' : 'border-gray-200'}`}>
                  <button onClick={handleApply}
                    className={`w-full py-3.5 rounded-xl font-semibold text-center transition-colors flex items-center justify-center gap-2 text-lg mb-3 text-white ${
                      job.organization_id && job.organization
                        ? 'bg-slate-700 hover:bg-slate-600'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}>
                    <Zap className="w-5 h-5" /> Apply Now
                  </button>
                  <p className="text-xs text-gray-500 text-center mb-4">
                    {job.proposals_count || 0} freelancers have already applied
                  </p>
                  {!user && (
                    <p className="text-xs text-amber-600 text-center bg-amber-50 rounded-lg p-2">
                      You need to be logged in to apply
                    </p>
                  )}
                </div>
              )}

              {/* ─── Owner Actions ─── */}
              {isOwner && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3">
                    <p className="text-white font-semibold text-sm">Manage Your Job</p>
                  </div>
                  <div className="p-5 space-y-3">
                    {/* View proposals */}
                    <Link href="/dashboard/projects"
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-sm transition-colors">
                      <FileText className="w-5 h-5" />
                      View Proposals ({job.proposals_count || 0})
                    </Link>

                    {/* Edit */}
                    {canEdit && !isEditing && (
                      <button onClick={startEdit}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium text-sm transition-colors">
                        <Pencil className="w-5 h-5" /> Edit Job
                      </button>
                    )}
                    {!canEdit && (job?.proposals_count || 0) > 0 && (
                      <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-100">
                        <p className="text-xs text-amber-700">Editing is disabled because this job has received proposals.</p>
                      </div>
                    )}

                    {/* Status change */}
                    {job.status === 'Open' && (
                      <button onClick={() => handleStatusChange('Cancelled')} disabled={statusChanging}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 font-medium text-sm transition-colors">
                        <XCircle className="w-5 h-5" /> {statusChanging ? 'Updating...' : 'Close Job'}
                      </button>
                    )}
                    {job.status === 'Cancelled' && (
                      <button onClick={() => handleStatusChange('Open')} disabled={statusChanging}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 font-medium text-sm transition-colors">
                        <CheckCircle2 className="w-5 h-5" /> {statusChanging ? 'Updating...' : 'Reopen Job'}
                      </button>
                    )}

                    {/* Delete */}
                    {['Draft', 'Open'].includes(job.status) && (
                      <>
                        {!confirmDelete ? (
                          <button onClick={() => setConfirmDelete(true)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-medium text-sm transition-colors">
                            <Trash2 className="w-5 h-5" /> Delete Job
                          </button>
                        ) : (
                          <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                            <p className="text-sm text-red-700 font-medium mb-3">Are you sure? This cannot be undone.</p>
                            <div className="flex gap-2">
                              <button onClick={handleDelete} disabled={deleting}
                                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                                {deleting ? 'Deleting...' : 'Yes, Delete'}
                              </button>
                              <button onClick={() => setConfirmDelete(false)}
                                className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Messages */}
                    <Link href="/dashboard/messages"
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium text-sm transition-colors">
                      <MessageSquare className="w-5 h-5" /> Messages
                    </Link>
                  </div>
                </div>
              )}

              {/* Client / Organization Info */}
              {job.organization_id && job.organization ? (
                <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    About the Organization
                  </h3>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 border border-slate-200">
                      {job.organization.logo_url ? (
                        <img src={job.organization.logo_url} alt={job.organization.name} className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <Building2 className="w-6 h-6 text-slate-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{job.organization.name}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Enterprise</span>
                      </div>
                    </div>
                  </div>
                  {job.client && (
                    <div className="text-sm border-t border-gray-100 pt-3">
                      <span className="text-gray-500">Posted by</span>
                      <span className="ml-1 font-medium text-gray-700">{job.client.full_name}</span>
                    </div>
                  )}
                </div>
              ) : job.client ? (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">About the Client</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                      {job.client.avatar_url ? (
                        <img src={job.client.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <span className="text-green-700 font-bold text-lg">{job.client.full_name?.charAt(0) || 'C'}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{job.client.full_name}</p>
                      <div className="flex items-center gap-1">
                        {job.client.verification_status === 'ID-Verified' ? (
                          <><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /><span className="text-xs text-green-600 font-medium">Verified</span></>
                        ) : (
                          <span className="text-xs text-gray-500">Unverified</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2.5 text-sm">
                    {(job.client.location || job.client.county) && (
                      <div className="flex items-center justify-between py-1.5 border-t border-gray-100">
                        <span className="text-gray-500 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location</span>
                        <span className="font-medium text-gray-900">{job.client.county || job.client.location}</span>
                      </div>
                    )}
                    {job.client.hustle_score != null && (
                      <div className="flex items-center justify-between py-1.5 border-t border-gray-100">
                        <span className="text-gray-500 flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> Hustle Score</span>
                        <span className="font-semibold text-gray-900">{job.client.hustle_score}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Job Details Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Job Details</h3>
                <div className="space-y-0">
                  {[
                    { icon: Briefcase, label: 'Type', value: job.payment_type || 'Fixed' },
                    { icon: MapPin, label: 'Location', value: job.remote_allowed ? 'Remote' : job.location_preference || 'Any' },
                    ...(job.deadline ? [{ icon: Clock, label: 'Deadline', value: new Date(job.deadline).toLocaleDateString() }] : []),
                    { icon: Users, label: 'Proposals', value: String(job.proposals_count || 0) },
                    { icon: Eye, label: 'Views', value: String(job.views_count || 0) },
                  ].map((item, i) => (
                    <div key={item.label} className={`flex items-center justify-between py-2.5 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                      <span className="text-sm text-gray-500 flex items-center gap-2"><item.icon className="w-4 h-4" /> {item.label}</span>
                      <span className="text-sm font-medium text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Links — Freelancers */}
              {!isOwner && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-3">Quick Links</h3>
                  <div className="space-y-1.5">
                    <Link href="/jobs" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                      <Briefcase className="w-4 h-4 text-gray-400" /> Browse All Jobs
                    </Link>
                    {user && (
                      <>
                        <Link href="/dashboard/proposals" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                          <FileText className="w-4 h-4 text-gray-400" /> My Proposals
                        </Link>
                        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                          <TrendingUp className="w-4 h-4 text-gray-400" /> Dashboard
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Tips for freelancers */}
              {!isOwner && job.status === 'Open' && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-5 border border-purple-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900 text-sm">Tips for a Winning Proposal</h3>
                  </div>
                  <ul className="space-y-2 text-xs text-purple-800">
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-500 mt-0.5 shrink-0" /> Personalize your cover letter to this specific job</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-500 mt-0.5 shrink-0" /> Highlight relevant experience and portfolio pieces</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-500 mt-0.5 shrink-0" /> Set a competitive bid within the client&apos;s budget</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-500 mt-0.5 shrink-0" /> Be realistic about your timeline estimate</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
