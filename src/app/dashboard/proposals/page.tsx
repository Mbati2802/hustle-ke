'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { cachedFetch, invalidateCache } from '@/lib/fetch-cache'
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  Zap,
  ArrowUpRight,
  MessageSquare,
  Star,
  Shield,
  Crown,
  User,
  Loader2,
  Briefcase,
  Building2,
  ChevronDown,
  ChevronUp,
  Users,
} from 'lucide-react'

interface Freelancer {
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

interface Proposal {
  id: string
  job_id: string
  freelancer_id: string
  bid_amount: number
  cover_letter: string
  status: string
  created_at: string
  submitted_at?: string
  estimated_duration_days?: number
  job?: {
    id: string
    title: string
    budget_min: number
    budget_max: number
    status: string
    organization_id?: string
    client?: { id: string; full_name: string; avatar_url?: string }
  }
  freelancer?: Freelancer
}

const statusConfig: Record<string, { color: string; icon: typeof Clock; label: string }> = {
  Pending: { color: 'bg-amber-50 text-amber-700', icon: Clock, label: 'Pending' },
  Accepted: { color: 'bg-green-50 text-green-700', icon: CheckCircle2, label: 'Accepted' },
  Rejected: { color: 'bg-red-50 text-red-700', icon: XCircle, label: 'Rejected' },
  Withdrawn: { color: 'bg-gray-100 text-gray-600', icon: XCircle, label: 'Withdrawn' },
}

interface TeamMember {
  user_id: string
  role: string
  profiles: { id: string; full_name: string; avatar_url?: string; title?: string }
}

export default function ProposalsPage() {
  const { user, orgMode, activeOrg } = useAuth()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [expandedProposal, setExpandedProposal] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [assignMap, setAssignMap] = useState<Record<string, string>>({}) // proposalId -> memberId
  const [showAssignFor, setShowAssignFor] = useState<string | null>(null)

  const isOrgView = orgMode && activeOrg

  const hasMounted = useRef(false)

  // Fetch team members for org mode
  useEffect(() => {
    if (!isOrgView) { setTeamMembers([]); return }
    fetch('/api/enterprise/members')
      .then(r => r.json())
      .then(data => { if (data.members) setTeamMembers(data.members) })
      .catch(() => {})
  }, [orgMode, activeOrg])

  useEffect(() => {
    if (!user) return
    const query = isOrgView ? `/api/proposals?organization_id=${activeOrg.id}&limit=50` : '/api/proposals?limit=50'
    if (!hasMounted.current) {
      hasMounted.current = true
      const cached = cachedFetch<{ proposals?: Proposal[] }>(query, (data) => {
        if (data.proposals) setProposals(data.proposals)
        setLoading(false)
      })
      if (cached?.proposals) {
        setProposals(cached.proposals)
        setLoading(false)
      }
    } else {
      setLoading(true)
      fetch(query)
        .then(r => r.json())
        .then(data => { if (data.proposals) setProposals(data.proposals) })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [user, orgMode, activeOrg])

  const refreshProposals = async () => {
    const query = isOrgView ? `/api/proposals?organization_id=${activeOrg.id}&limit=50` : '/api/proposals?limit=50'
    try {
      const res = await fetch(query)
      const data = await res.json()
      if (data.proposals) setProposals(data.proposals)
    } catch {}
  }

  const handleProposalAction = async (proposalId: string, action: 'accept' | 'reject') => {
    setActionLoading(proposalId)
    setActionMsg(null)
    try {
      const payload: Record<string, unknown> = { action }
      if (action === 'accept' && assignMap[proposalId]) {
        payload.assigned_member_id = assignMap[proposalId]
      }
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        const assignedName = assignMap[proposalId]
          ? teamMembers.find(m => m.user_id === assignMap[proposalId])?.profiles?.full_name
          : null
        if (action === 'accept') {
          setActionMsg({
            type: 'success',
            text: assignedName
              ? `Freelancer hired & escrow funded! ${assignedName} has been assigned to follow up.`
              : 'Freelancer hired & escrow funded! Payment is held securely until you approve the work.',
          })
        } else {
          setActionMsg({ type: 'success', text: 'Proposal rejected.' })
        }
        // Invalidate cache and refresh
        if (isOrgView) invalidateCache(`/api/proposals?organization_id=${activeOrg.id}&limit=50`)
        setShowAssignFor(null)
        await refreshProposals()
      } else {
        setActionMsg({ type: 'error', text: data.error || 'Action failed. Please try again.' })
      }
    } catch {
      setActionMsg({ type: 'error', text: 'Network error. Please check your connection.' })
    }
    setActionLoading(null)
  }

  const filteredProposals = filter === 'all' ? proposals : proposals.filter(p => p.status === filter)

  const filters = [
    { key: 'all', label: 'All', count: proposals.length },
    { key: 'Pending', label: 'Pending', count: proposals.filter(p => p.status === 'Pending').length },
    { key: 'Accepted', label: 'Accepted', count: proposals.filter(p => p.status === 'Accepted').length },
    { key: 'Rejected', label: 'Rejected', count: proposals.filter(p => p.status === 'Rejected').length },
    { key: 'Withdrawn', label: 'Withdrawn', count: proposals.filter(p => p.status === 'Withdrawn').length },
  ]

  // Group proposals by job for org view
  const proposalsByJob = isOrgView
    ? filteredProposals.reduce<Record<string, { title: string; jobId: string; proposals: Proposal[] }>>((acc, p) => {
        const jobId = p.job?.id || p.job_id
        if (!acc[jobId]) {
          acc[jobId] = { title: p.job?.title || 'Job', jobId, proposals: [] }
        }
        acc[jobId].proposals.push(p)
        return acc
      }, {})
    : {}

  return (
    <div className="p-4 lg:p-6 xl:p-8 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            {isOrgView ? 'Organization Proposals' : 'My Proposals'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isOrgView
              ? `${proposals.length} proposals received on org jobs`
              : `${proposals.length} total proposals submitted`
            }
          </p>
        </div>
        {!isOrgView && (
          <Link href="/jobs" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm">
            <Zap className="w-4 h-4" /> Find Jobs
          </Link>
        )}
        {isOrgView && (
          <Link href="/dashboard/projects" className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm">
            <Briefcase className="w-4 h-4" /> View Org Jobs
          </Link>
        )}
      </div>

      {/* Action Message */}
      {actionMsg && (
        <div className={`p-4 rounded-xl mb-6 flex items-start justify-between gap-3 ${actionMsg.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={`text-sm font-medium ${actionMsg.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{actionMsg.text}</p>
          <button onClick={() => setActionMsg(null)} className={`text-xs font-medium shrink-0 ${actionMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>✕</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isOrgView ? 'bg-purple-100' : 'bg-gray-100'}`}>
              <FileText className={`w-4 h-4 ${isOrgView ? 'text-purple-600' : 'text-gray-600'}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{proposals.length}</p>
              <p className="text-xs text-gray-500">{isOrgView ? 'Received' : 'Total'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-amber-600">{proposals.filter(p => p.status === 'Pending').length}</p>
              <p className="text-xs text-gray-500">{isOrgView ? 'Awaiting Review' : 'Pending'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{proposals.filter(p => p.status === 'Accepted').length}</p>
              <p className="text-xs text-gray-500">{isOrgView ? 'Hired' : 'Accepted'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-red-600">{proposals.filter(p => p.status === 'Rejected').length}</p>
              <p className="text-xs text-gray-500">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === f.key ? (isOrgView ? 'bg-purple-600 text-white shadow-sm' : 'bg-green-600 text-white shadow-sm') : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Proposals List */}
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
      ) : filteredProposals.length === 0 ? (
        <div className="bg-white rounded-xl p-10 border border-gray-200 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isOrgView ? 'bg-purple-50' : 'bg-gray-100'}`}>
            <FileText className={`w-7 h-7 ${isOrgView ? 'text-purple-400' : 'text-gray-400'}`} />
          </div>
          <p className="text-gray-900 font-semibold mb-1">
            {filter === 'all'
              ? (isOrgView ? 'No proposals received yet' : 'No proposals yet')
              : `No ${filter.toLowerCase()} proposals`
            }
          </p>
          <p className="text-gray-500 text-sm mb-5">
            {isOrgView ? 'Post org jobs to start receiving proposals from freelancers' : 'Browse jobs and submit proposals to get started'}
          </p>
          {!isOrgView && (
            <Link href="/jobs" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm inline-flex items-center gap-2 transition-colors">
              <Zap className="w-4 h-4" /> Browse Jobs
            </Link>
          )}
        </div>
      ) : isOrgView ? (
        /* ─── ORG VIEW: Proposals grouped by job with accept/reject ─── */
        <div className="space-y-4">
          {Object.values(proposalsByJob).map((group) => (
            <div key={group.jobId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Job header */}
              <div className="px-5 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <Link href={`/jobs/${group.jobId}`} className="font-semibold text-gray-900 hover:text-purple-700 transition-colors truncate block">
                        {group.title}
                      </Link>
                      <p className="text-xs text-purple-600">{group.proposals.length} proposal{group.proposals.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-semibold shrink-0">
                    {group.proposals.filter(p => p.status === 'Pending').length} pending
                  </span>
                </div>
              </div>

              {/* Proposals for this job */}
              <div className="divide-y divide-gray-100">
                {group.proposals.map((proposal) => {
                  const config = statusConfig[proposal.status] || statusConfig.Pending
                  const StatusIcon = config.icon
                  const fl = proposal.freelancer
                  const isExpanded = expandedProposal === proposal.id

                  return (
                    <div key={proposal.id} className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Freelancer avatar */}
                        <div className="shrink-0">
                          {fl?.avatar_url ? (
                            <img src={fl.avatar_url} alt={fl.full_name} className="w-11 h-11 rounded-full object-cover" />
                          ) : (
                            <div className="w-11 h-11 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {(fl?.full_name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                          )}
                        </div>

                        {/* Freelancer info + proposal */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <Link href={`/talent/${fl?.id}`} className="font-semibold text-gray-900 hover:text-purple-700 transition-colors">
                                  {fl?.full_name || 'Freelancer'}
                                </Link>
                                {fl?.is_pro && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-bold">
                                    <Crown className="w-2.5 h-2.5" /> PRO
                                  </span>
                                )}
                                {fl?.verification_status === 'ID-Verified' && (
                                  <Shield className="w-3.5 h-3.5 text-green-500" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 truncate">{fl?.title || 'Freelancer'}</p>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold shrink-0 ${config.color}`}>
                              <StatusIcon className="w-3 h-3" /> {config.label}
                            </span>
                          </div>

                          {/* Stats row */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-2">
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5" /> Bid: <strong className="text-green-600">KES {proposal.bid_amount?.toLocaleString()}</strong>
                            </span>
                            {fl?.hustle_score != null && (
                              <span className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-amber-400" /> Score: {fl.hustle_score}
                              </span>
                            )}
                            {fl?.jobs_completed != null && fl.jobs_completed > 0 && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-3.5 h-3.5" /> {fl.jobs_completed} jobs done
                              </span>
                            )}
                            {proposal.estimated_duration_days && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> {proposal.estimated_duration_days} days
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {new Date(proposal.submitted_at || proposal.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Cover letter (expandable) */}
                          {proposal.cover_letter && (
                            <div className="mb-3">
                              <p className={`text-sm text-gray-600 leading-relaxed whitespace-pre-line ${isExpanded ? '' : 'line-clamp-2'}`}>
                                {proposal.cover_letter}
                              </p>
                              {proposal.cover_letter.length > 150 && (
                                <button
                                  onClick={() => setExpandedProposal(isExpanded ? null : proposal.id)}
                                  className="text-xs text-purple-600 hover:text-purple-700 font-medium mt-1 flex items-center gap-0.5"
                                >
                                  {isExpanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Read more</>}
                                </button>
                              )}
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="space-y-2">
                            {proposal.status === 'Pending' && showAssignFor === proposal.id && teamMembers.length > 0 && (
                              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5" /> Assign a team member to follow up (optional)
                                </p>
                                <select
                                  value={assignMap[proposal.id] || ''}
                                  onChange={(e) => setAssignMap(prev => ({ ...prev, [proposal.id]: e.target.value }))}
                                  className="w-full text-sm border border-purple-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 mb-2"
                                >
                                  <option value="">No assignment (owner manages)</option>
                                  {teamMembers.map(m => (
                                    <option key={m.user_id} value={m.user_id}>
                                      {m.profiles?.full_name || 'Member'} ({m.role})
                                    </option>
                                  ))}
                                </select>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleProposalAction(proposal.id, 'accept')}
                                    disabled={actionLoading === proposal.id}
                                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
                                  >
                                    {actionLoading === proposal.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                    Confirm Hire
                                  </button>
                                  <button onClick={() => setShowAssignFor(null)} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-2">Cancel</button>
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              {proposal.status === 'Pending' && showAssignFor !== proposal.id && (
                                <>
                                  <button
                                    onClick={() => teamMembers.length > 0 ? setShowAssignFor(proposal.id) : handleProposalAction(proposal.id, 'accept')}
                                    disabled={actionLoading === proposal.id}
                                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
                                  >
                                    {actionLoading === proposal.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    )}
                                    Hire
                                  </button>
                                  <button
                                    onClick={() => handleProposalAction(proposal.id, 'reject')}
                                    disabled={actionLoading === proposal.id}
                                    className="border border-red-200 hover:bg-red-50 disabled:opacity-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                                  >
                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                  </button>
                                </>
                              )}
                              <Link href={`/talent/${fl?.id}`} className="px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium text-xs transition-colors flex items-center gap-1">
                                <User className="w-3.5 h-3.5" /> View Profile
                              </Link>
                              {proposal.status === 'Accepted' && (
                                <Link href={`/dashboard/messages?job_id=${proposal.job_id}&to=${proposal.freelancer_id}&name=${encodeURIComponent(fl?.full_name || 'Freelancer')}`} className="px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 font-medium text-xs transition-colors flex items-center gap-1">
                                  <MessageSquare className="w-3.5 h-3.5" /> Message
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ─── FREELANCER VIEW: Personal proposals ─── */
        <div className="space-y-3">
          {filteredProposals.map((proposal) => {
            const config = statusConfig[proposal.status] || statusConfig.Pending
            const StatusIcon = config.icon
            return (
              <div key={proposal.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <Link href={`/jobs/${proposal.job?.id || proposal.job_id}`} className="font-semibold text-gray-900 hover:text-green-700 transition-colors text-base">
                        {proposal.job?.title || 'Job'}
                      </Link>
                      {proposal.job?.client?.full_name && (
                        <p className="text-xs text-gray-500 mt-0.5">Client: {proposal.job.client.full_name}</p>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold shrink-0 ${config.color}`}>
                      <StatusIcon className="w-3 h-3" /> {config.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> Your Bid: <strong className="text-green-600">KES {proposal.bid_amount?.toLocaleString()}</strong>
                    </span>
                    {proposal.job?.budget_min != null && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" /> Budget: KES {proposal.job.budget_min.toLocaleString()}{proposal.job.budget_max && proposal.job.budget_max !== proposal.job.budget_min ? ` – ${proposal.job.budget_max.toLocaleString()}` : ''}
                      </span>
                    )}
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(proposal.created_at).toLocaleDateString()}</span>
                  </div>

                  {proposal.cover_letter && <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">{proposal.cover_letter}</p>}

                  <div className="flex items-center gap-3 flex-wrap">
                    <Link href={`/jobs/${proposal.job?.id || proposal.job_id}`} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium text-sm transition-colors">
                      View Job <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                    {proposal.status === 'Accepted' && (
                      <Link href="/dashboard/messages" className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 font-medium text-sm transition-colors">
                        <MessageSquare className="w-3.5 h-3.5" /> Message Client
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
