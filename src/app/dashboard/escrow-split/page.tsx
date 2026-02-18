'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import {
  Milestone,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Send,
  Eye,
  ChevronRight,
  ArrowLeft,
  Shield,
  Timer,
  FileText,
  RotateCcw,
  Sparkles,
  TrendingUp,
  XCircle,
} from 'lucide-react'

interface JobMilestone {
  id: string
  job_id: string
  title: string
  description?: string
  amount: number
  percentage?: number
  due_date?: string
  status: string
  order_index: number
  submitted_at?: string
  auto_release_at?: string
  submission_note?: string
  review_note?: string
  partial_approval_pct?: number
  revision_requested?: boolean
  revision_note?: string
  auto_release_hours: number
  completed_at?: string
  paid_at?: string
}

interface MilestonePayment {
  id: string
  milestone_id: string
  amount: number
  net_amount: number
  payment_type: string
  created_at: string
}

interface JobSummary {
  id: string
  title: string
  status: string
  milestones_enabled: boolean
}

interface MilestoneSummary {
  totalBudget: number
  totalPaid: number
  remaining: number
  completedMilestones: number
  totalMilestones: number
  progressPercent: number
}

const statusConfig: Record<string, { color: string; bg: string; icon: typeof CheckCircle2 }> = {
  Pending: { color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', icon: Clock },
  'In Progress': { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: TrendingUp },
  Submitted: { color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: Send },
  'Revision Requested': { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: RotateCcw },
  Approved: { color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: CheckCircle2 },
  'Partially Approved': { color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200', icon: CheckCircle2 },
  Completed: { color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: CheckCircle2 },
  Paid: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: DollarSign },
}

export default function EscrowSplitPage() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [jobId, setJobId] = useState('')
  const [job, setJob] = useState<JobSummary | null>(null)
  const [milestones, setMilestones] = useState<JobMilestone[]>([])
  const [payments, setPayments] = useState<MilestonePayment[]>([])
  const [summary, setSummary] = useState<MilestoneSummary | null>(null)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Create milestones form
  const [showCreate, setShowCreate] = useState(false)
  const [newMilestones, setNewMilestones] = useState([
    { title: '', description: '', amount: 0, percentage: 25, due_date: '', auto_release_hours: 72 },
  ])
  const [creating, setCreating] = useState(false)

  // Submission form
  const [submitMilestoneId, setSubmitMilestoneId] = useState<string | null>(null)
  const [submitNote, setSubmitNote] = useState('')

  // Review form
  const [reviewMilestoneId, setReviewMilestoneId] = useState<string | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [reviewAction, setReviewAction] = useState<'approve' | 'partial' | 'revision'>('approve')
  const [partialPct, setPartialPct] = useState(80)
  const [revisionNote, setRevisionNote] = useState('')

  const loadJob = async () => {
    if (!jobId.trim()) return
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/escrow-split?job_id=${jobId}`)
      const data = await res.json()
      if (res.ok) {
        setJob(data.job)
        setMilestones(data.milestones || [])
        setPayments(data.payments || [])
        setSummary(data.summary)
      } else {
        setMsg({ type: 'error', text: data.error || 'Job not found' })
      }
    } catch {
      setMsg({ type: 'error', text: 'Network error' })
    }
    setLoading(false)
  }

  const createMilestones = async () => {
    if (!job) return
    setCreating(true)
    setMsg(null)
    try {
      const res = await fetch('/api/escrow-split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          job_id: job.id,
          milestones: newMilestones.filter(m => m.title.trim()),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setMsg({ type: 'success', text: 'Milestones created!' })
        setShowCreate(false)
        loadJob()
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed' })
      }
    } catch {
      setMsg({ type: 'error', text: 'Network error' })
    }
    setCreating(false)
  }

  const submitMilestone = async () => {
    if (!submitMilestoneId) return
    setActionLoading(submitMilestoneId)
    try {
      const res = await fetch('/api/escrow-split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          milestone_id: submitMilestoneId,
          submission_note: submitNote,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setMsg({ type: 'success', text: data.message || 'Milestone submitted!' })
        setSubmitMilestoneId(null)
        setSubmitNote('')
        loadJob()
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed' })
      }
    } catch {
      setMsg({ type: 'error', text: 'Network error' })
    }
    setActionLoading(null)
  }

  const reviewMilestone = async () => {
    if (!reviewMilestoneId) return
    setActionLoading(reviewMilestoneId)
    try {
      let action = 'approve'
      const payload: Record<string, unknown> = { milestone_id: reviewMilestoneId }

      if (reviewAction === 'approve') {
        action = 'approve'
        payload.review_note = reviewNote
      } else if (reviewAction === 'partial') {
        action = 'approve'
        payload.review_note = reviewNote
        payload.partial_approval_pct = partialPct
      } else {
        action = 'request-revision'
        payload.revision_note = revisionNote || reviewNote
      }

      const res = await fetch('/api/escrow-split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      })
      const data = await res.json()
      if (res.ok) {
        setMsg({ type: 'success', text: data.message || 'Review submitted!' })
        setReviewMilestoneId(null)
        setReviewNote('')
        loadJob()
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed' })
      }
    } catch {
      setMsg({ type: 'error', text: 'Network error' })
    }
    setActionLoading(null)
  }

  const addMilestoneRow = () => {
    setNewMilestones(prev => [...prev, { title: '', description: '', amount: 0, percentage: 0, due_date: '', auto_release_hours: 72 }])
  }

  const updateMilestoneRow = (index: number, field: string, value: string | number) => {
    setNewMilestones(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m))
  }

  const removeMilestoneRow = (index: number) => {
    if (newMilestones.length <= 1) return
    setNewMilestones(prev => prev.filter((_, i) => i !== index))
  }

  const totalPct = newMilestones.reduce((s, m) => s + m.percentage, 0)

  return (
    <div className="p-4 lg:p-6 xl:p-8 pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-800 to-green-900 rounded-2xl p-6 lg:p-8 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Milestone className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">EscrowSplit™</h1>
              <p className="text-emerald-200 text-sm">Milestone-based smart payments</p>
            </div>
          </div>
          <p className="text-emerald-100/70 text-xs mt-3 max-w-lg">
            Break projects into milestones with auto-release timers, partial approvals, and per-milestone dispute resolution.
          </p>
        </div>
      </div>

      {/* Message */}
      {msg && (
        <div className={`p-3 rounded-xl mb-4 text-sm font-medium flex items-center justify-between ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="text-xs">✕</button>
        </div>
      )}

      {/* Job Lookup */}
      {!job && (
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4 text-teal-600" /> View Job Milestones
            </h2>
            <div className="flex gap-2">
              <input
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                placeholder="Enter Job ID..."
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none"
              />
              <button onClick={loadJob} disabled={loading || !jobId.trim()}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />} View
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Enter the Job ID from your project to view or manage milestones</p>
          </div>

          {/* How it works */}
          <div className="mt-6 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-600" /> How EscrowSplit Works
            </h3>
            <div className="space-y-3">
              {[
                { icon: Plus, title: 'Define Milestones', desc: 'Break your project into milestones with amounts and deadlines' },
                { icon: Send, title: 'Submit Work', desc: 'Freelancer submits each milestone for review' },
                { icon: Timer, title: 'Auto-Release Timer', desc: 'If client doesn\'t review in 72h, payment auto-releases' },
                { icon: CheckCircle2, title: 'Approve & Pay', desc: 'Client approves fully, partially, or requests revision' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-teal-100 rounded-lg flex items-center justify-center shrink-0">
                    <item.icon className="w-3.5 h-3.5 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-xs">{item.title}</p>
                    <p className="text-[10px] text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Job View */}
      {job && (
        <div>
          <button onClick={() => { setJob(null); setMilestones([]); setPayments([]); setSummary(null) }}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {/* Job Header */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <h2 className="font-bold text-gray-900 text-lg">{job.title}</h2>
            <p className="text-sm text-gray-500">Status: {job.status}</p>
          </div>

          {/* Summary */}
          {summary && summary.totalMilestones > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                <p className="text-lg font-bold text-gray-900">KES {summary.totalBudget.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500">Total Budget</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                <p className="text-lg font-bold text-green-600">KES {summary.totalPaid.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500">Paid</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                <p className="text-lg font-bold text-amber-600">KES {summary.remaining.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500">Remaining</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                <p className="text-lg font-bold text-teal-600">{summary.progressPercent}%</p>
                <p className="text-[10px] text-gray-500">Progress</p>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {summary && summary.totalMilestones > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">Milestone Progress</span>
                <span className="text-xs text-gray-500">{summary.completedMilestones}/{summary.totalMilestones}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="h-3 bg-gradient-to-r from-teal-500 to-green-500 rounded-full transition-all"
                  style={{ width: `${summary.progressPercent}%` }} />
              </div>
            </div>
          )}

          {/* Milestones */}
          {milestones.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <Milestone className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No milestones defined yet</p>
              <button onClick={() => setShowCreate(true)}
                className="mt-3 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Create Milestones
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {milestones.map((m, i) => {
                const sc = statusConfig[m.status] || statusConfig.Pending
                const StatusIcon = sc.icon
                const isAutoReleasing = m.auto_release_at && new Date(m.auto_release_at) > new Date()
                const autoReleaseIn = m.auto_release_at ? Math.max(0, Math.ceil((new Date(m.auto_release_at).getTime() - Date.now()) / 3600000)) : 0

                return (
                  <div key={m.id} className={`bg-white rounded-xl border p-5 ${m.status === 'Submitted' ? 'border-purple-200 shadow-sm' : 'border-gray-200'}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold text-teal-700">
                          {i + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{m.title}</h3>
                          {m.description && <p className="text-sm text-gray-500 mt-0.5">{m.description}</p>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-gray-900">KES {Number(m.amount).toLocaleString()}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sc.bg} ${sc.color}`}>
                          <StatusIcon className="w-2.5 h-2.5" /> {m.status}
                        </span>
                      </div>
                    </div>

                    {/* Auto-release warning */}
                    {isAutoReleasing && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-3 flex items-center gap-2">
                        <Timer className="w-4 h-4 text-amber-600 shrink-0" />
                        <p className="text-xs text-amber-700">
                          <span className="font-semibold">Auto-release in {autoReleaseIn}h</span> — Review before the timer expires or payment will auto-release to the freelancer.
                        </p>
                      </div>
                    )}

                    {/* Submission note */}
                    {m.submission_note && (
                      <div className="bg-purple-50 rounded-lg p-2.5 mb-3 text-xs text-purple-700">
                        <span className="font-semibold">Freelancer note:</span> {m.submission_note}
                      </div>
                    )}

                    {/* Revision note */}
                    {m.revision_note && (
                      <div className="bg-amber-50 rounded-lg p-2.5 mb-3 text-xs text-amber-700">
                        <span className="font-semibold">Revision requested:</span> {m.revision_note}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-2">
                      {['Pending', 'In Progress', 'Revision Requested'].includes(m.status) && (
                        <button onClick={() => setSubmitMilestoneId(m.id)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1">
                          <Send className="w-3 h-3" /> Submit for Review
                        </button>
                      )}
                      {m.status === 'Submitted' && (
                        <button onClick={() => setReviewMilestoneId(m.id)}
                          className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Review
                        </button>
                      )}
                    </div>

                    {/* Submit form */}
                    {submitMilestoneId === m.id && (
                      <div className="mt-3 bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <textarea value={submitNote} onChange={(e) => setSubmitNote(e.target.value)}
                          placeholder="Add a note about what you've completed..."
                          rows={2}
                          className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:border-purple-400" />
                        <div className="flex gap-2">
                          <button onClick={submitMilestone} disabled={actionLoading === m.id}
                            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1">
                            {actionLoading === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Submit
                          </button>
                          <button onClick={() => setSubmitMilestoneId(null)} className="text-xs text-gray-500">Cancel</button>
                        </div>
                      </div>
                    )}

                    {/* Review form */}
                    {reviewMilestoneId === m.id && (
                      <div className="mt-3 bg-teal-50 rounded-lg p-3 border border-teal-200">
                        <div className="flex gap-2 mb-3">
                          {(['approve', 'partial', 'revision'] as const).map(a => (
                            <button key={a} onClick={() => setReviewAction(a)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                reviewAction === a ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
                              }`}>
                              {a === 'approve' ? '✅ Approve' : a === 'partial' ? '⚡ Partial' : '🔄 Revision'}
                            </button>
                          ))}
                        </div>
                        {reviewAction === 'partial' && (
                          <div className="mb-2">
                            <label className="text-xs font-medium text-gray-700">Approval %: {partialPct}%</label>
                            <input type="range" min={10} max={99} value={partialPct} onChange={(e) => setPartialPct(Number(e.target.value))}
                              className="w-full mt-1" />
                            <p className="text-[10px] text-gray-500">Release KES {Math.round(Number(m.amount) * partialPct / 100).toLocaleString()} of KES {Number(m.amount).toLocaleString()}</p>
                          </div>
                        )}
                        <textarea value={reviewAction === 'revision' ? revisionNote : reviewNote}
                          onChange={(e) => reviewAction === 'revision' ? setRevisionNote(e.target.value) : setReviewNote(e.target.value)}
                          placeholder={reviewAction === 'revision' ? 'Describe what needs to be revised...' : 'Optional review note...'}
                          rows={2}
                          className="w-full border border-teal-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:border-teal-400" />
                        <div className="flex gap-2">
                          <button onClick={reviewMilestone} disabled={actionLoading === m.id}
                            className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1">
                            {actionLoading === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Confirm
                          </button>
                          <button onClick={() => setReviewMilestoneId(null)} className="text-xs text-gray-500">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Create Milestones Form */}
          {showCreate && (
            <div className="mt-4 bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-600" /> Define Milestones
              </h3>
              <div className="space-y-3">
                {newMilestones.map((m, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-500">Milestone {i + 1}</span>
                      {newMilestones.length > 1 && (
                        <button onClick={() => removeMilestoneRow(i)} className="text-red-400 hover:text-red-600">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      <input value={m.title} onChange={(e) => updateMilestoneRow(i, 'title', e.target.value)}
                        placeholder="Milestone title *" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-teal-500 outline-none" />
                      <input type="number" value={m.amount || ''} onChange={(e) => updateMilestoneRow(i, 'amount', Number(e.target.value))}
                        placeholder="Amount (KES)" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-teal-500 outline-none" />
                      <input type="number" value={m.percentage || ''} onChange={(e) => updateMilestoneRow(i, 'percentage', Number(e.target.value))}
                        placeholder="Percentage %" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-teal-500 outline-none" />
                      <input type="number" value={m.auto_release_hours} onChange={(e) => updateMilestoneRow(i, 'auto_release_hours', Number(e.target.value))}
                        placeholder="Auto-release hours" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-teal-500 outline-none" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-3">
                <button onClick={addMilestoneRow} className="text-teal-600 hover:text-teal-700 text-xs font-medium flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Milestone
                </button>
                <span className={`text-xs font-medium ${Math.abs(totalPct - 100) <= 1 ? 'text-green-600' : 'text-red-600'}`}>
                  Total: {totalPct}% {Math.abs(totalPct - 100) <= 1 ? '✓' : '(must be 100%)'}
                </span>
              </div>

              <div className="flex gap-2 mt-4">
                <button onClick={createMilestones} disabled={creating || Math.abs(totalPct - 100) > 1}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Create Milestones
                </button>
                <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 text-gray-600 hover:text-gray-800 text-sm">Cancel</button>
              </div>
            </div>
          )}

          {/* Create button if no milestones */}
          {milestones.length > 0 && !showCreate && (
            <button onClick={() => setShowCreate(true)}
              className="mt-4 w-full bg-white border-2 border-dashed border-gray-300 hover:border-teal-400 rounded-xl p-4 text-center text-sm text-gray-500 hover:text-teal-600 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add More Milestones
            </button>
          )}
        </div>
      )}
    </div>
  )
}
