'use client'

import Link from 'next/link'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { cachedFetch } from '@/lib/fetch-cache'
import { usePostJobModal } from '../components/PostJobModalContext'
import ProfileCompletionBanner from '../components/ProfileCompletionBanner'
import {
  Briefcase, FileText, MessageSquare, ChevronRight, CheckCircle2,
  AlertCircle, Sparkles, TrendingUp, DollarSign, Star, PlusCircle,
  ArrowUpRight, Zap, Users, Crown, Mail, X, Activity, Clock,
  TrendingDown, Wallet, Bell, Shield, RotateCcw, CheckCheck,
  ArrowRight, Target, Award,
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
  created_at?: string
  job?: { id: string; title: string; status: string }
}

interface WalletData { balance: number }

interface Transaction {
  id: string
  type: string
  amount: number
  created_at: string
  description?: string
}

interface RecentNotification {
  id: string
  type: string
  title: string
  message: string
  link: string
  read: boolean
  created_at: string
}

// ── Inline Sparkline ──────────────────────────────────────────────────────────
function Sparkline({ data, color = '#22c55e', height = 36, width = 120 }: {
  data: number[]; color?: string; height?: number; width?: number
}) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 3
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2)
    const y = height - pad - ((v - min) / range) * (height - pad * 2)
    return `${x},${y}`
  })
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="spGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`M${pts.join('L')}L${width - pad},${height}L${pad},${height}Z`}
        fill="url(#spGrad)"
      />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]} r="3" fill={color} />
    </svg>
  )
}

// ── Bar Chart (7-day activity) ────────────────────────────────────────────────
function MiniBarChart({ data, color = '#22c55e', height = 40 }: {
  data: number[]; color?: string; height?: number
}) {
  if (!data.length) return null
  const max = Math.max(...data, 1)
  const barW = 100 / data.length
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      {data.map((v, i) => {
        const bh = (v / max) * (height - 4)
        return (
          <rect
            key={i}
            x={i * barW + barW * 0.1}
            y={height - bh - 2}
            width={barW * 0.8}
            height={bh + 2}
            rx="2"
            fill={color}
            opacity={v === 0 ? 0.15 : 0.8}
          />
        )
      })}
    </svg>
  )
}

// ── Notification type config ──────────────────────────────────────────────────
const NOTIF_ICON: Record<string, typeof Bell> = {
  message: MessageSquare, hire: CheckCircle2, rejection: X,
  proposal: Briefcase, submission: CheckCheck, revision: RotateCcw,
  escrow: Wallet, subscription: Crown, security: Shield,
  review_request: Star, info: Bell, system: Bell,
}
const NOTIF_COLOR: Record<string, string> = {
  message: 'text-green-600 bg-green-100', hire: 'text-emerald-600 bg-emerald-100',
  rejection: 'text-red-600 bg-red-100', proposal: 'text-blue-600 bg-blue-100',
  submission: 'text-amber-600 bg-amber-100', revision: 'text-orange-600 bg-orange-100',
  escrow: 'text-green-700 bg-green-100', subscription: 'text-amber-700 bg-amber-100',
  security: 'text-red-600 bg-red-100', review_request: 'text-purple-600 bg-purple-100',
  info: 'text-blue-600 bg-blue-100', system: 'text-gray-600 bg-gray-100',
}

export default function DashboardPage() {
  const { user, profile, orgMode, activeOrg } = useAuth()
  const { openModal: openPostJobModal } = usePostJobModal()
  const router = useRouter()

  useEffect(() => {
    if (profile?.role === 'Admin') router.replace('/admin')
  }, [profile, router])

  const [jobs, setJobs] = useState<DashboardJob[]>([])
  const [proposals, setProposals] = useState<DashboardProposal[]>([])
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [recentNotifs, setRecentNotifs] = useState<RecentNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<{
    plan: string; status: string
    plan_details?: { service_fee_percent: number; max_proposals_per_day: number }
  } | null>(null)
  const [showVerificationBanner, setShowVerificationBanner] = useState(false)

  const isClient = profile?.role === 'Client'
  const isOrgView = orgMode && activeOrg
  const hasMounted = useRef(false)

  const timeAgo = useCallback((d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'Just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }, [])

  useEffect(() => {
    if (!user) { setLoading(false); return }
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
      const cJobs = cachedFetch<{ jobs?: DashboardJob[] }>(jobsUrl, d => { if (d.jobs) setJobs(d.jobs) })
      const cProps = cachedFetch<{ proposals?: DashboardProposal[] }>(proposalsUrl, d => { if (d.proposals) setProposals(d.proposals) })
      const cWallet = cachedFetch<{ wallet?: WalletData }>('/api/wallet', d => { if (d.wallet) setWallet(d.wallet) })
      cachedFetch<{ subscription?: { plan: string; status: string }; plan_details?: { service_fee_percent: number; max_proposals_per_day: number } }>('/api/subscription', d => {
        if (d.subscription) setSubscription({ ...d.subscription, plan_details: d.plan_details })
      })
      if (cJobs?.jobs) setJobs(cJobs.jobs)
      if (cProps?.proposals) setProposals(cProps.proposals)
      if (cWallet?.wallet) setWallet(cWallet.wallet)
      if (cJobs || cProps || cWallet) setLoading(false)
      setTimeout(() => setLoading(false), 100)
    } else {
      Promise.all([
        fetch(jobsUrl).then(r => r.json()).catch(() => ({})),
        fetch(proposalsUrl).then(r => r.json()).catch(() => ({})),
        fetch('/api/wallet').then(r => r.json()).catch(() => ({})),
      ]).then(([jd, pd, wd]) => {
        if (jd.jobs) setJobs(jd.jobs)
        if (pd.proposals) setProposals(pd.proposals)
        if (wd.wallet) setWallet(wd.wallet)
        setLoading(false)
      })
    }
  }, [user, profile, orgMode, activeOrg])

  // Fetch transactions for sparkline
  useEffect(() => {
    if (!user) return
    fetch('/api/wallet/transactions?limit=14')
      .then(r => r.json())
      .then(d => { if (d.transactions) setTransactions(d.transactions) })
      .catch(() => {})
  }, [user])

  // Fetch recent notifications for activity feed
  useEffect(() => {
    if (!user) return
    fetch('/api/notifications')
      .then(r => r.json())
      .then(d => { if (d.notifications) setRecentNotifs(d.notifications.slice(0, 6)) })
      .catch(() => {})
  }, [user])

  useEffect(() => {
    if (user && profile && !profile.verification_status) setShowVerificationBanner(true)
  }, [user, profile])

  // Derived stats
  const activeJobs = jobs.filter(j => ['In-Progress', 'Open', 'Review'].includes(j.status))
  const pendingProposals = proposals.filter(p => p.status === 'Pending')
  const acceptedProposals = proposals.filter(p => p.status === 'Accepted')
  const winRate = proposals.length > 0 ? Math.round((acceptedProposals.length / proposals.length) * 100) : 0
  const totalBalance = wallet?.balance ?? 0
  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  // Sparkline: last 7 days of earnings (deposits/payments received)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toDateString()
  })
  const earningsByDay = last7Days.map(day =>
    transactions
      .filter(t => new Date(t.created_at).toDateString() === day && t.amount > 0 && ['Deposit', 'Escrow Release', 'Payment'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0)
  )
  const hasEarningsData = earningsByDay.some(v => v > 0)

  // Proposal activity last 7 days
  const proposalsByDay = last7Days.map(day =>
    proposals.filter(p => p.created_at && new Date(p.created_at).toDateString() === day).length
  )

  return (
    <div className="p-3 sm:p-4 lg:p-6 pb-24 lg:pb-6 space-y-3 sm:space-y-4">

      {/* ── Welcome Banner ── compact on mobile ─────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl sm:rounded-2xl p-3 sm:p-5 lg:p-7 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(34,197,94,0.15) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(99,102,241,0.1) 0%, transparent 40%)`
        }} />
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white leading-tight">
              {isOrgView ? `${activeOrg.name}` : isClient ? `Hey ${firstName}` : `Hi, ${firstName}`} 👋
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5 truncate">
              {isOrgView ? 'Organization dashboard' : isClient ? 'Manage your projects' : "Here's your hustle overview"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isClient && !isOrgView && (
              <button onClick={() => openPostJobModal()}
                className="flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap">
                <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Post a Job</span>
                <span className="sm:hidden">Post</span>
              </button>
            )}
            {!isClient && !isOrgView && (
              <Link href="/jobs"
                className="flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Find Work</span>
                <span className="sm:hidden">Jobs</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Profile Completion Banner ── */}
      <ProfileCompletionBanner />

      {/* ── Email Verification Banner ── */}
      {showVerificationBanner && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-900 text-sm">Verify your email</p>
              <p className="text-xs text-amber-700 mt-0.5 hidden sm:block">Unlock all features and receive important notifications.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/auth/verify-email" className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap">
                Verify
              </Link>
              <button onClick={() => setShowVerificationBanner(false)} className="text-amber-400 hover:text-amber-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats Grid ── 2x2 mobile, 4-col desktop ──────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {/* Wallet Balance */}
        <Link href="/dashboard/wallet" className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 hover:shadow-md hover:border-green-200 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-green-500 transition-colors" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
            {totalBalance >= 1000 ? `${(totalBalance / 1000).toFixed(1)}k` : totalBalance.toLocaleString()}
          </p>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
            {isOrgView ? 'Org Balance' : isClient ? 'Wallet' : 'Earnings'} <span className="text-gray-400">KES</span>
          </p>
        </Link>

        {/* Active Jobs / Projects */}
        <Link href={isClient ? '/dashboard/projects' : '/dashboard/jobs'} className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Briefcase className="w-4 h-4 text-blue-600" />
            </div>
            {activeJobs.length > 0 && (
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">{activeJobs.length}</span>
            )}
          </div>
          <p className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{activeJobs.length}</p>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
            {isOrgView ? 'Org Jobs' : isClient ? 'Projects' : 'Active Hustles'}
          </p>
        </Link>

        {/* Proposals */}
        <Link href="/dashboard/proposals" className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 hover:shadow-md hover:border-amber-200 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <FileText className="w-4 h-4 text-amber-600" />
            </div>
            {pendingProposals.length > 0 && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">{pendingProposals.length} new</span>
            )}
          </div>
          <p className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{proposals.length}</p>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
            {isClient ? 'Received' : 'Proposals'}
          </p>
        </Link>

        {/* Win Rate / Hustle Score */}
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              {!isClient ? <Star className="w-4 h-4 text-purple-600" /> : <Target className="w-4 h-4 text-purple-600" />}
            </div>
            {!isClient && winRate > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${winRate >= 50 ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'}`}>
                {winRate}% win
              </span>
            )}
          </div>
          {!isOrgView ? (
            <>
              <p className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{profile?.hustle_score ?? 0}</p>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">Hustle Score</p>
            </>
          ) : (
            <>
              <p className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{acceptedProposals.length}</p>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">Accepted</p>
            </>
          )}
        </div>
      </div>

      {/* ── Main Grid ─────────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-3 sm:gap-4">

        {/* ── Left / Main Column ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">

          {/* Earnings Chart (Freelancers) */}
          {!isClient && !isOrgView && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Earnings Overview</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Last 7 days</p>
                </div>
                <div className="text-right">
                  <p className="text-base sm:text-lg font-bold text-gray-900">KES {totalBalance.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400">Current balance</p>
                </div>
              </div>
              {hasEarningsData ? (
                <div className="h-16 sm:h-20">
                  <MiniBarChart data={earningsByDay} color="#22c55e" height={80} />
                </div>
              ) : (
                <div className="h-16 sm:h-20 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <div className="text-center">
                    <TrendingUp className="w-5 h-5 text-gray-300 mx-auto mb-1" />
                    <p className="text-xs text-gray-400">Complete jobs to track earnings</p>
                  </div>
                </div>
              )}
              <div className="flex justify-between mt-2">
                {last7Days.map((d, i) => (
                  <span key={i} className="text-[9px] sm:text-[10px] text-gray-400 flex-1 text-center">
                    {new Date(d).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}
                  </span>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-[10px] text-gray-400">Accepted</p>
                    <p className="text-sm font-bold text-gray-900">{acceptedProposals.length}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Win Rate</p>
                    <p className={`text-sm font-bold ${winRate >= 50 ? 'text-green-600' : winRate >= 25 ? 'text-amber-600' : 'text-gray-900'}`}>
                      {winRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Score</p>
                    <p className="text-sm font-bold text-purple-600">{profile?.hustle_score ?? 0}</p>
                  </div>
                </div>
                <Link href="/dashboard/wallet" className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                  Wallet <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Proposal Activity Chart */}
          {!isClient && !isOrgView && proposalsByDay.some(v => v > 0) && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Proposal Activity</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Submissions last 7 days</p>
                </div>
                <Link href="/dashboard/proposals" className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="h-10">
                <MiniBarChart data={proposalsByDay} color="#6366f1" height={40} />
              </div>
              <div className="flex justify-between mt-1">
                {last7Days.map((d, i) => (
                  <span key={i} className="text-[9px] text-gray-400 flex-1 text-center">
                    {new Date(d).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Jobs / Projects */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">
                {isOrgView ? 'Organization Jobs' : isClient ? 'Your Projects' : 'Recent Jobs'}
              </h2>
              <Link href={isClient || isOrgView ? '/dashboard/projects' : '/jobs'} className="text-green-600 hover:text-green-700 font-medium text-xs flex items-center gap-0.5">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-lg shrink-0" />
                    <div className="flex-1"><div className="h-3.5 bg-gray-100 rounded w-3/4 mb-1.5" /><div className="h-3 bg-gray-50 rounded w-1/2" /></div>
                  </div>
                ))}
              </div>
            ) : activeJobs.length === 0 ? (
              <div className="p-6 sm:p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm mb-3">
                  {isClient ? "No projects yet" : 'No active jobs'}
                </p>
                {isClient ? (
                  <button onClick={() => openPostJobModal()}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm inline-flex items-center gap-2 transition-colors">
                    <PlusCircle className="w-4 h-4" /> Post a Job
                  </button>
                ) : (
                  <Link href="/jobs" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm inline-block transition-colors">
                    Browse Jobs
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {activeJobs.slice(0, 5).map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}
                    className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-gray-50 transition-colors group">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      job.status === 'Open' ? 'bg-green-100' : job.status === 'In-Progress' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Briefcase className={`w-3.5 h-3.5 ${
                        job.status === 'Open' ? 'text-green-600' : job.status === 'In-Progress' ? 'text-blue-600' : 'text-gray-500'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate group-hover:text-green-700 transition-colors">{job.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-gray-500">KES {job.budget_min?.toLocaleString()}{job.budget_max && job.budget_max !== job.budget_min ? `–${job.budget_max.toLocaleString()}` : ''}</span>
                        {isClient && job.proposals_count != null && (
                          <span className="text-[11px] text-gray-400 flex items-center gap-0.5"><Users className="w-2.5 h-2.5" /> {job.proposals_count}</span>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                      job.status === 'Open' ? 'text-green-700 bg-green-50' :
                      job.status === 'In-Progress' ? 'text-blue-700 bg-blue-50' : 'text-gray-600 bg-gray-100'
                    }`}>{job.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Proposals */}
          {proposals.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 text-sm">Recent Proposals</h2>
                <Link href="/dashboard/proposals" className="text-green-600 hover:text-green-700 font-medium text-xs flex items-center gap-0.5">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {proposals.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      p.status === 'Pending' ? 'bg-amber-400' :
                      p.status === 'Accepted' ? 'bg-green-500' :
                      p.status === 'Rejected' ? 'bg-red-400' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 font-medium truncate">{p.job?.title || 'Proposal'}</p>
                      {p.bid_amount && <p className="text-[11px] text-gray-500">KES {p.bid_amount.toLocaleString()}</p>}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      p.status === 'Pending' ? 'text-amber-700 bg-amber-50' :
                      p.status === 'Accepted' ? 'text-green-700 bg-green-50' :
                      p.status === 'Rejected' ? 'text-red-700 bg-red-50' : 'text-gray-600 bg-gray-100'
                    }`}>{p.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Sidebar ──────────────────────────────────────────────── */}
        <div className="space-y-3 sm:space-y-4">

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Quick Actions</h3>
            </div>
            <div className="p-2 space-y-0.5">
              {isOrgView ? (
                <>
                  <ActionItem icon={PlusCircle} label="Post Org Job" color="bg-purple-100 text-purple-600 group-hover:bg-purple-200" onClick={() => openPostJobModal()} />
                  <ActionItem icon={Briefcase} label="Manage Org Jobs" color="bg-blue-100 text-blue-600 group-hover:bg-blue-200" href="/dashboard/projects" />
                  <ActionItem icon={FileText} label="Review Proposals" color="bg-amber-100 text-amber-600 group-hover:bg-amber-200" href="/dashboard/proposals" />
                </>
              ) : isClient ? (
                <>
                  <ActionItem icon={PlusCircle} label="Post a New Job" color="bg-green-100 text-green-600 group-hover:bg-green-200" onClick={() => openPostJobModal()} />
                  <ActionItem icon={Briefcase} label="Manage Projects" color="bg-blue-100 text-blue-600 group-hover:bg-blue-200" href="/dashboard/projects" />
                  <ActionItem icon={FileText} label="Review Proposals" color="bg-amber-100 text-amber-600 group-hover:bg-amber-200" href="/dashboard/proposals" />
                </>
              ) : (
                <>
                  <ActionItem icon={Zap} label="Find Work" color="bg-green-100 text-green-600 group-hover:bg-green-200" href="/jobs" />
                  <ActionItem icon={FileText} label="My Proposals" color="bg-amber-100 text-amber-600 group-hover:bg-amber-200" href="/dashboard/proposals" />
                  <ActionItem icon={Award} label="My Portfolio" color="bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200" href="/dashboard/settings?tab=portfolio" />
                </>
              )}
              <ActionItem icon={MessageSquare} label="Messages" color="bg-purple-100 text-purple-600 group-hover:bg-purple-200" href="/dashboard/messages" />
              <ActionItem icon={Wallet} label="Wallet" color="bg-gray-100 text-gray-600 group-hover:bg-gray-200" href="/dashboard/wallet" />
            </div>
          </div>

          {/* Activity Feed */}
          {recentNotifs.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-gray-400" /> Activity
                </h3>
                <Link href="/dashboard/notifications" className="text-xs text-green-600 hover:text-green-700 font-medium">
                  See all
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {recentNotifs.map(n => {
                  const Icon = NOTIF_ICON[n.type] || Bell
                  const colorCls = NOTIF_COLOR[n.type] || 'text-gray-600 bg-gray-100'
                  const href = n.link || '/dashboard/notifications'
                  return (
                    <Link key={n.id} href={href}
                      className={`flex items-start gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/30' : ''}`}>
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${colorCls}`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-tight truncate ${n.read ? 'text-gray-600' : 'font-semibold text-gray-900'}`}>
                          {n.title}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                      </div>
                      {!n.read && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Profile/Verification nudge */}
          {profile && !profile.is_verified && !isOrgView && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <h3 className="font-semibold text-amber-900 text-sm">Complete Your Profile</h3>
              </div>
              <p className="text-xs text-amber-700 mb-2.5">Verified profiles get 3x more job invites.</p>
              <Link href="/dashboard/settings" className="inline-flex items-center gap-1 text-amber-800 hover:text-amber-900 font-semibold text-xs">
                Go to Settings <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Pro Analytics */}
          {!isOrgView && subscription?.plan === 'pro' && subscription?.status === 'active' && (
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-amber-200 flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold text-amber-900 text-sm">Pro Analytics</h3>
              </div>
              <div className="p-3 space-y-2">
                {[
                  ['Service Fee', `${subscription.plan_details?.service_fee_percent || 4}%`, 'text-green-600', '6%'],
                  ['Proposals/Day', `${subscription.plan_details?.max_proposals_per_day || 20}`, 'text-amber-700', ''],
                  ['Win Rate', `${winRate}%`, winRate >= 50 ? 'text-green-600' : 'text-gray-900', ''],
                  ['Jobs Done', `${profile?.jobs_completed || 0}`, 'text-gray-900', ''],
                ].map(([label, val, cls, old]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{label}</span>
                    <span className={`text-xs font-bold ${cls}`}>
                      {val} {old && <span className="text-gray-400 font-normal line-through ml-1">{old}</span>}
                    </span>
                  </div>
                ))}
                <Link href="/dashboard/settings?tab=subscription" className="block text-center text-xs text-amber-700 hover:text-amber-800 font-medium pt-1">
                  Manage Subscription →
                </Link>
              </div>
            </div>
          )}

          {/* Upgrade CTA */}
          {!isOrgView && (!subscription || subscription.plan === 'free') && !isClient && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-white text-sm">Go Pro</h3>
              </div>
              <p className="text-xs text-slate-400 mb-1.5">4% fee • 20 proposals/day • Featured profile</p>
              <p className="text-base font-bold text-white mb-3">KES 500<span className="text-xs font-normal text-slate-400">/mo</span></p>
              <Link href="/dashboard/settings?tab=subscription" className="block text-center bg-amber-500 hover:bg-amber-400 text-white py-2 rounded-lg text-xs font-semibold transition-colors">
                Upgrade Now
              </Link>
            </div>
          )}

          {/* Tips */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <h3 className="font-semibold text-gray-900 text-sm">
                {isOrgView ? 'Org Tips' : isClient ? 'Hiring Tips' : 'Boost Your Profile'}
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-gray-600">
              {(isOrgView ? [
                'Assign team members to accepted proposals',
                'Keep org wallet funded for smooth payments',
                'Review proposals within 48 hours',
              ] : isClient ? [
                'Write clear job descriptions with specific requirements',
                'Set realistic budgets to attract quality talent',
                'Review proposals promptly to secure top freelancers',
              ] : [
                'Complete your profile to increase visibility',
                'Write personalized proposals for each job',
                'Deliver quality work to boost your Hustle Score',
              ]).map(tip => (
                <li key={tip} className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Reusable action row ───────────────────────────────────────────────────────
function ActionItem({ icon: Icon, label, color, href, onClick }: {
  icon: typeof Briefcase; label: string; color: string
  href?: string; onClick?: () => void
}) {
  const cls = `w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left group`
  const inner = (
    <>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${color}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <span className="text-sm text-gray-700 font-medium">{label}</span>
      <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-gray-500 ml-auto transition-colors" />
    </>
  )
  if (onClick) return <button className={cls} onClick={onClick}>{inner}</button>
  return <Link className={cls} href={href!}>{inner}</Link>
}
