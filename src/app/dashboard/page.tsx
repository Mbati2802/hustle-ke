'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { cachedFetch } from '@/lib/fetch-cache'
import { usePostJobModal } from '../components/PostJobModalContext'
import {
  Briefcase,
  FileText,
  MessageSquare,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  TrendingUp,
  DollarSign,
  Star,
  PlusCircle,
  ArrowUpRight,
  Zap,
  Users,
  Crown,
  BarChart3,
  Mail,
  X,
} from 'lucide-react'

interface DashboardJob {
  id: string
  title: string
  budget_min: number
  budget_max: number
  deadline?: string
  status: string
  client_id: string
  proposals_count?: number
  created_at?: string
  client?: { full_name: string }
}

interface DashboardProposal {
  id: string
  status: string
  bid_amount?: number
  job?: {
    id: string
    title: string
    status: string
  }
}

interface WalletData {
  balance: number
}

export default function DashboardPage() {
  const { user, profile, orgMode, activeOrg } = useAuth()
  const { openModal: openPostJobModal } = usePostJobModal()
  const [jobs, setJobs] = useState<DashboardJob[]>([])
  const [proposals, setProposals] = useState<DashboardProposal[]>([])
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<{ plan: string; status: string; plan_details?: { service_fee_percent: number; max_proposals_per_day: number } } | null>(null)
  const [showVerificationBanner, setShowVerificationBanner] = useState(false)

  const isClient = profile?.role === 'Client'
  const isOrgView = orgMode && activeOrg

  const hasMounted = useRef(false)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const clientRole = profile?.role === 'Client'
    const isOrg = orgMode && activeOrg
    const jobsUrl = isOrg
      ? `/api/jobs?organization_id=${activeOrg.id}&limit=5`
      : clientRole ? '/api/jobs?my=true&limit=5' : '/api/jobs?limit=5&status=Open'
    const proposalsUrl = isOrg
      ? `/api/proposals?organization_id=${activeOrg.id}&limit=5`
      : '/api/proposals?limit=5'

    if (!hasMounted.current) {
      hasMounted.current = true
      // Show cached data instantly
      const cJobs = cachedFetch<{ jobs?: DashboardJob[] }>(jobsUrl, d => { if (d.jobs) setJobs(d.jobs) })
      const cProps = cachedFetch<{ proposals?: DashboardProposal[] }>(proposalsUrl, d => { if (d.proposals) setProposals(d.proposals) })
      const cWallet = cachedFetch<{ wallet?: WalletData }>('/api/wallet', d => { if (d.wallet) setWallet(d.wallet) })
      cachedFetch<{ subscription?: { plan: string; status: string }; plan_details?: { service_fee_percent: number; max_proposals_per_day: number } }>('/api/subscription', d => {
        if (d.subscription) setSubscription({ ...d.subscription, plan_details: d.plan_details })
      })

      if (cJobs?.jobs) setJobs(cJobs.jobs)
      if (cProps?.proposals) setProposals(cProps.proposals)
      if (cWallet?.wallet) setWallet(cWallet.wallet)
      // If any cache existed, stop loading immediately
      if (cJobs || cProps || cWallet) setLoading(false)
      // When all background fetches complete, stop loading
      setTimeout(() => setLoading(false), 100)
    } else {
      const fetchData = async () => {
        const [jobsData, proposalsData, walletData] = await Promise.all([
          fetch(jobsUrl).then(r => r.json()).catch(() => ({})),
          fetch(proposalsUrl).then(r => r.json()).catch(() => ({})),
          fetch('/api/wallet').then(r => r.json()).catch(() => ({})),
        ])
        if (jobsData.jobs) setJobs(jobsData.jobs)
        if (proposalsData.proposals) setProposals(proposalsData.proposals)
        if (walletData.wallet) setWallet(walletData.wallet)
        setLoading(false)
      }
      fetchData()
    }
  }, [user, profile, orgMode, activeOrg])

  // Check email verification status
  useEffect(() => {
    if (user && profile && !profile.verification_status) {
      setShowVerificationBanner(true)
    }
  }, [user, profile])

  const activeJobs = jobs.filter(j => j.status === 'In-Progress' || j.status === 'Open' || j.status === 'Review')
  const pendingProposals = proposals.filter(p => p.status === 'Pending')
  const totalEarned = wallet?.balance ?? 0
  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="p-4 lg:p-6 xl:p-8 pb-24 lg:pb-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 lg:p-8 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-50"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                {isOrgView ? (
                  <>{activeOrg.name} Dashboard</>
                ) : isClient ? (
                  `Hey ${firstName}`
                ) : (
                  `Welcome back, ${firstName}`
                )} 👋
              </h1>
              <p className="text-slate-400 text-sm lg:text-base">
                {isOrgView ? (
                  'Manage organization jobs, team, and proposals'
                ) : isClient ? (
                  'Manage your projects and find top talent'
                ) : (
                  "Here's what's happening with your hustles today"
                )}
              </p>
            </div>
            {isClient && !isOrgView && (
              <button onClick={() => openPostJobModal()}
                className="hidden sm:flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shrink-0">
                <PlusCircle className="w-4 h-4" /> Post a Job
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Email Verification Banner */}
      {showVerificationBanner && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-amber-900 mb-1">Verify Your Email Address</h3>
              <p className="text-sm text-amber-700 mb-3">
                Please verify your email to unlock all features and receive important notifications about your jobs and payments.
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/verify-email"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Mail className="w-4 h-4" /> Verify Email
                </Link>
                <button
                  onClick={() => setShowVerificationBanner(false)}
                  className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowVerificationBanner(false)}
              className="text-amber-400 hover:text-amber-600 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Profile Completeness Nudge */}
      {!isClient && profile && !isOrgView && (
        (() => {
          const checks = [
            !!profile.full_name,
            !!profile.title,
            !!profile.bio && profile.bio.length > 30,
            !!profile.avatar_url,
            !!profile.phone,
            !!profile.county,
            (profile.skills?.length || 0) >= 3,
            !!profile.hourly_rate && profile.hourly_rate > 0,
          ]
          const done = checks.filter(Boolean).length
          const pct = Math.round((done / checks.length) * 100)
          if (pct >= 100) return null
          return (
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex items-center gap-4">
              <div className="relative w-12 h-12 shrink-0">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke={pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444'} strokeWidth="3" strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">{pct}%</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">Complete your profile</p>
                <p className="text-xs text-gray-500">A complete profile gets up to 3x more views from clients.</p>
              </div>
              <Link href="/dashboard/settings?tab=profile" className="text-green-600 hover:text-green-700 text-sm font-medium whitespace-nowrap flex items-center gap-1">
                Complete <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )
        })()
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 lg:p-5 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">KES</span>
          </div>
          <p className="text-xl lg:text-2xl font-bold text-gray-900">{totalEarned.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isOrgView ? 'Org Wallet Balance' : isClient ? 'Wallet Balance' : 'Total Earned'}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 lg:p-5 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-xl lg:text-2xl font-bold text-gray-900">{activeJobs.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isOrgView ? 'Org Jobs' : isClient ? 'Active Projects' : 'Active Hustles'}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 lg:p-5 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-amber-600" />
            </div>
            {pendingProposals.length > 0 && (
              <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">{pendingProposals.length} new</span>
            )}
          </div>
          <p className="text-xl lg:text-2xl font-bold text-gray-900">{proposals.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isOrgView ? 'Org Proposals' : isClient ? 'Received Proposals' : 'My Proposals'}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 lg:p-5 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
              <Star className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          {!isOrgView ? (
            <>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{profile?.hustle_score ?? 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">Hustle Score</p>
            </>
          ) : (
            <>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">—</p>
              <p className="text-xs text-gray-500 mt-0.5">Team Members</p>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ─── Main Column ─── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Jobs / Projects Section */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">
                {isOrgView ? 'Organization Jobs' : isClient ? 'Your Projects' : 'Recent Jobs'}
              </h2>
              <Link href={isOrgView ? '/dashboard/projects' : isClient ? '/dashboard/projects' : '/jobs'} className="text-green-600 hover:text-green-700 font-medium text-xs flex items-center gap-1">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="p-5 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-50 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activeJobs.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Briefcase className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  {isOrgView ? "No organization jobs posted yet" : isClient ? "You haven't posted any jobs yet" : 'No active jobs yet'}
                </p>
                {isOrgView ? (
                  <Link href="/dashboard/projects" className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg font-medium text-sm inline-block transition-colors">
                    Manage Organization Jobs
                  </Link>
                ) : isClient ? (
                  <button onClick={() => openPostJobModal()}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium text-sm inline-flex items-center gap-2 transition-colors">
                    <PlusCircle className="w-4 h-4" /> Post Your First Job
                  </button>
                ) : (
                  <Link href="/jobs" className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium text-sm inline-block transition-colors">
                    Browse Jobs
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {activeJobs.slice(0, 5).map((job) => (
                  <Link key={job.id} href={isClient ? `/jobs/${job.id}` : `/jobs/${job.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      job.status === 'Open' ? 'bg-green-100' : job.status === 'In-Progress' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Briefcase className={`w-4 h-4 ${
                        job.status === 'Open' ? 'text-green-600' : job.status === 'In-Progress' ? 'text-blue-600' : 'text-gray-500'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate group-hover:text-green-700 transition-colors">{job.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-500">KES {job.budget_min?.toLocaleString()}{job.budget_max && job.budget_max !== job.budget_min ? ` - ${job.budget_max.toLocaleString()}` : ''}</span>
                        {isClient && job.proposals_count != null && (
                          <span className="text-xs text-gray-400 flex items-center gap-1"><Users className="w-3 h-3" /> {job.proposals_count}</span>
                        )}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold shrink-0 ${
                      job.status === 'Open' ? 'text-green-700 bg-green-50' :
                      job.status === 'In-Progress' ? 'text-blue-700 bg-blue-50' :
                      'text-gray-600 bg-gray-100'
                    }`}>
                      {job.status}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-green-500 shrink-0 transition-colors" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Proposals */}
          {proposals.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Recent Proposals</h2>
                <Link href="/dashboard/proposals" className="text-green-600 hover:text-green-700 font-medium text-xs flex items-center gap-1">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {proposals.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      p.status === 'Pending' ? 'bg-amber-400' :
                      p.status === 'Accepted' ? 'bg-green-500' :
                      p.status === 'Rejected' ? 'bg-red-400' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 font-medium truncate">{p.job?.title || 'Proposal'}</p>
                      {p.bid_amount && <p className="text-xs text-gray-500">Bid: KES {p.bid_amount.toLocaleString()}</p>}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      p.status === 'Pending' ? 'text-amber-700 bg-amber-50' :
                      p.status === 'Accepted' ? 'text-green-700 bg-green-50' :
                      p.status === 'Rejected' ? 'text-red-700 bg-red-50' :
                      'text-gray-600 bg-gray-100'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── Right Sidebar ─── */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Quick Actions</h3>
            </div>
            <div className="p-3 space-y-1">
              {isOrgView ? (
                <>
                  <button onClick={() => openPostJobModal()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-purple-50 transition-colors text-left group">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <PlusCircle className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">Post Org Job</span>
                  </button>
                  <Link href="/dashboard/projects" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-colors group">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">Manage Org Jobs</span>
                  </Link>
                  <Link href="/dashboard/proposals" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-amber-50 transition-colors group">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                      <FileText className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">Review Proposals</span>
                  </Link>
                </>
              ) : isClient ? (
                <>
                  <button onClick={() => openPostJobModal()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-green-50 transition-colors text-left group">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <PlusCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">Post a New Job</span>
                  </button>
                  <Link href="/dashboard/projects" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-colors group">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">Manage Projects</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/jobs" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-green-50 transition-colors group">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <Zap className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">Find Work</span>
                  </Link>
                  <Link href="/dashboard/proposals" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-amber-50 transition-colors group">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                      <FileText className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">My Proposals</span>
                  </Link>
                </>
              )}
              <Link href="/dashboard/messages" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-purple-50 transition-colors group">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm text-gray-700 font-medium">Messages</span>
              </Link>
              <Link href="/dashboard/wallet" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <DollarSign className="w-4 h-4 text-gray-600" />
                </div>
                <span className="text-sm text-gray-700 font-medium">Wallet &amp; Payments</span>
              </Link>
              <Link href="/dashboard/settings" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <TrendingUp className="w-4 h-4 text-gray-600" />
                </div>
                <span className="text-sm text-gray-700 font-medium">Update Profile</span>
              </Link>
            </div>
          </div>

          {/* Profile Completion */}
          {profile && !profile.is_verified && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold text-amber-900 text-sm">Complete Your Profile</h3>
              </div>
              <p className="text-xs text-amber-700 mb-3">Verified profiles get 3x more job invites and build trust faster.</p>
              <Link href="/dashboard/settings" className="inline-flex items-center gap-1 text-amber-800 hover:text-amber-900 font-semibold text-xs">
                Go to Settings <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Pro Analytics (Pro users only) */}
          {!isOrgView && subscription?.plan === 'pro' && subscription?.status === 'active' && (
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-amber-200 flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold text-amber-900 text-sm">Pro Analytics</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Service Fee</span>
                  <span className="text-xs font-bold text-green-600">{subscription.plan_details?.service_fee_percent || 4}% <span className="text-gray-400 font-normal line-through">6%</span></span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Proposals/Day</span>
                  <span className="text-xs font-bold text-amber-700">{subscription.plan_details?.max_proposals_per_day || 20}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Acceptance Rate</span>
                  <span className="text-xs font-bold text-blue-600">{proposals.length > 0 ? Math.round((proposals.filter(p => p.status === 'Accepted').length / proposals.length) * 100) : 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Jobs Completed</span>
                  <span className="text-xs font-bold text-gray-900">{profile?.jobs_completed || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Profile Status</span>
                  <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full"><Crown className="w-2.5 h-2.5" />Featured</span>
                </div>
                <Link href="/dashboard/settings?tab=subscription" className="block text-center text-xs text-amber-700 hover:text-amber-800 font-medium pt-1">
                  Manage Subscription →
                </Link>
              </div>
            </div>
          )}

          {/* Upgrade CTA for free users */}
          {!isOrgView && (!subscription || subscription.plan === 'free') && !isClient && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold text-amber-900 text-sm">Upgrade to Pro</h3>
              </div>
              <p className="text-xs text-amber-700 mb-2">Save 33% on fees, get featured, and send 20 proposals/day.</p>
              <p className="text-lg font-bold text-amber-900 mb-3">KES 500<span className="text-xs font-normal text-amber-600">/month</span></p>
              <Link href="/dashboard/settings?tab=subscription" className="block text-center bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg text-xs font-semibold transition-colors">
                Upgrade Now
              </Link>
            </div>
          )}

          {/* Tips */}
          <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl p-5 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h3 className="font-semibold text-gray-900 text-sm">
                {isOrgView ? 'Organization Tips' : isClient ? 'Hiring Tips' : 'Boost Your Profile'}
              </h3>
            </div>
            <ul className="space-y-2.5 text-xs text-gray-600">
              {isOrgView ? (
                <>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" /> Assign team members to follow up on accepted proposals</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" /> Keep org wallet funded for smooth project payments</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" /> Review and respond to proposals within 48 hours</li>
                </>
              ) : isClient ? (
                <>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" /> Write clear job descriptions with specific requirements</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" /> Set realistic budgets to attract quality freelancers</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" /> Review proposals promptly to secure top talent</li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" /> Complete your profile to increase visibility</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" /> Write personalized proposals for each job</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" /> Deliver quality work to boost your Hustle Score</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
