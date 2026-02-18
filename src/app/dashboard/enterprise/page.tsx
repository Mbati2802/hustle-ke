'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { usePostJobModal } from '../../components/PostJobModalContext'
import {
  Building2,
  Users,
  Briefcase,
  TrendingUp,
  DollarSign,
  Star,
  Plus,
  Mail,
  Shield,
  Crown,
  ArrowRight,
  UserPlus,
  Heart,
  Trash2,
  Edit3,
  BarChart3,
  Activity,
  ChevronDown,
  CheckCircle2,
  Clock,
  Globe,
  Zap,
  Award,
  Target,
  Loader2,
  Copy,
  RefreshCw,
  Search,
  X,
  Eye,
  MoreVertical,
  Smartphone,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
} from 'lucide-react'

type Tab = 'overview' | 'team' | 'bench' | 'wallet' | 'analytics'

export default function EnterpriseDashboard() {
  const { profile } = useAuth()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const tab = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null
    return (tab && ['overview', 'team', 'bench', 'wallet', 'analytics'].includes(tab)) ? tab as Tab : 'overview'
  })
  const [org, setOrg] = useState<any>(null)
  const [orgRole, setOrgRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<any[]>([])
  const [invites, setInvites] = useState<any[]>([])
  const [bench, setBench] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30d')
  const [orgWallet, setOrgWallet] = useState<any>(null)
  const [orgWalletTxs, setOrgWalletTxs] = useState<any[]>([])
  const [walletIsAdmin, setWalletIsAdmin] = useState(false)
  const [depositForm, setDepositForm] = useState({ amount: '', phone: '' })
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', phone: '' })
  const [walletAction, setWalletAction] = useState<'deposit' | 'withdraw' | null>(null)
  const [walletProcessing, setWalletProcessing] = useState(false)
  const [walletMsg, setWalletMsg] = useState('')
  const [showCreateOrg, setShowCreateOrg] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '', industry: '', size: '1-10', county: '', website: '' })
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'member' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showBrowseTalent, setShowBrowseTalent] = useState(false)
  const [talentResults, setTalentResults] = useState<any[]>([])
  const [talentSearch, setTalentSearch] = useState('')
  const [talentLoading, setTalentLoading] = useState(false)
  const [savingFreelancerId, setSavingFreelancerId] = useState<string | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const talentSearchTimeout = useRef<NodeJS.Timeout | null>(null)
  const { openModal: openPostJobModal } = usePostJobModal()

  // Fetch org data
  const fetchOrg = useCallback(async () => {
    try {
      const res = await fetch('/api/enterprise')
      const data = await res.json()
      if (data.organization) {
        setOrg(data.organization)
        setOrgRole(data.role || 'member')
      }
    } catch (err) {
      console.error('Failed to fetch org:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMembers = useCallback(async () => {
    if (!org) return
    try {
      const res = await fetch('/api/enterprise/members')
      const data = await res.json()
      setMembers(data.members || [])
      setInvites(data.invites || [])
    } catch (err) { console.error('Failed to fetch members:', err) }
  }, [org])

  const fetchBench = useCallback(async () => {
    if (!org) return
    try {
      const res = await fetch('/api/enterprise/bench')
      const data = await res.json()
      setBench(data.bench || [])
    } catch (err) { console.error('Failed to fetch bench:', err) }
  }, [org])

  const fetchAnalytics = useCallback(async () => {
    if (!org) return
    try {
      const res = await fetch(`/api/enterprise/analytics?period=${analyticsPeriod}`)
      const data = await res.json()
      setAnalytics(data)
    } catch (err) { console.error('Failed to fetch analytics:', err) }
  }, [org, analyticsPeriod])

  const fetchOrgWallet = useCallback(async () => {
    if (!org) return
    try {
      const res = await fetch('/api/enterprise/wallet?limit=30')
      const data = await res.json()
      setOrgWallet(data.wallet || null)
      setOrgWalletTxs(data.transactions || [])
      setWalletIsAdmin(data.is_admin || false)
    } catch (err) { console.error('Failed to fetch org wallet:', err) }
  }, [org])

  // Sync tab from URL ?tab= param
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['overview', 'team', 'bench', 'wallet', 'analytics'].includes(tab)) {
      setActiveTab(tab as Tab)
    }
  }, [searchParams])

  useEffect(() => { fetchOrg() }, [fetchOrg])
  useEffect(() => {
    if (org) {
      fetchMembers()
      fetchBench()
      fetchAnalytics()
      fetchOrgWallet()
    }
  }, [org, fetchMembers, fetchBench, fetchAnalytics, fetchOrgWallet])

  const handleCreateOrg = async () => {
    if (!createForm.name.trim()) { setError('Organization name is required'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/enterprise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create organization'); return }
      setOrg(data.organization)
      setOrgRole('owner')
      setShowCreateOrg(false)
      setSuccess('Organization created successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch { setError('Failed to create organization') }
    finally { setSaving(false) }
  }

  const handleInvite = async () => {
    if (!inviteForm.email.includes('@')) { setError('Valid email is required'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/enterprise/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to send invite'); return }
      setShowInviteModal(false)
      setInviteForm({ email: '', role: 'member' })
      setSuccess('Invite sent!')
      setTimeout(() => setSuccess(''), 3000)
      fetchMembers()
    } catch { setError('Failed to send invite') }
    finally { setSaving(false) }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this member from the organization?')) return
    try {
      await fetch('/api/enterprise/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId, action: 'remove' }),
      })
      fetchMembers()
    } catch { console.error('Failed to remove member') }
  }

  const handleRemoveFromBench = async (benchId: string) => {
    try {
      await fetch(`/api/enterprise/bench?id=${benchId}`, { method: 'DELETE' })
      fetchBench()
    } catch { console.error('Failed to remove from bench') }
  }

  // Browse Talent modal
  const searchTalent = useCallback(async (query: string) => {
    setTalentLoading(true)
    try {
      const params = new URLSearchParams({ limit: '12', sort: 'score' })
      if (query.trim()) params.set('search', query.trim())
      const res = await fetch(`/api/talent?${params.toString()}`)
      const data = await res.json()
      setTalentResults(data.profiles || [])
    } catch { setTalentResults([]) }
    finally { setTalentLoading(false) }
  }, [])

  useEffect(() => {
    if (showBrowseTalent) searchTalent(talentSearch)
  }, [showBrowseTalent]) // eslint-disable-line

  const handleTalentSearchInput = (val: string) => {
    setTalentSearch(val)
    if (talentSearchTimeout.current) clearTimeout(talentSearchTimeout.current)
    talentSearchTimeout.current = setTimeout(() => searchTalent(val), 400)
  }

  const handleSaveToBench = async (freelancerId: string) => {
    setSavingFreelancerId(freelancerId)
    try {
      const res = await fetch('/api/enterprise/bench', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freelancer_id: freelancerId }),
      })
      if (res.ok) {
        setSavedIds(prev => new Set(prev).add(freelancerId))
        fetchBench()
      }
    } catch { /* ignore */ }
    finally { setSavingFreelancerId(null) }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <p className="text-sm text-gray-500">Loading Enterprise...</p>
        </div>
      </div>
    )
  }

  // No org — show setup screen
  if (!org) {
    return (
      <div className="p-6 lg:p-8">
        {/* Hero */}
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 lg:p-12 text-white mb-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          </div>
          <div className="absolute top-10 right-10 w-48 h-48 bg-green-500/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-green-500/15 text-green-400 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
              <Building2 className="w-4 h-4" />
              Enterprise
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              HustleKE <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">Enterprise</span>
            </h1>
            <p className="text-gray-300 text-lg mb-8 max-w-lg leading-relaxed">
              Scale your hiring with team management, a dedicated freelancer bench, bulk job posting, and the lowest fees on the platform.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: DollarSign, label: '2% Service Fee', desc: 'Lowest on the platform' },
                { icon: Users, label: 'Up to 10 Seats', desc: 'Invite your whole team' },
                { icon: Zap, label: 'Unlimited Proposals', desc: 'No daily limits' },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-3 bg-white/[0.06] rounded-xl px-4 py-3">
                  <f.icon className="w-5 h-5 text-green-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">{f.label}</p>
                    <p className="text-xs text-gray-400">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowCreateOrg(true)}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-8 py-3.5 rounded-xl font-semibold transition-colors"
            >
              Create Your Organization <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Advantages grid */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Enterprise Advantages</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[
            { icon: DollarSign, title: '2% Service Fee', desc: 'Save 66% vs Free plan. On a KES 100K project, that\'s KES 4,000 saved.', color: 'green' },
            { icon: Users, title: 'Team Seats (Up to 10)', desc: 'Invite hiring managers, admins, and viewers with granular permissions.', color: 'blue' },
            { icon: Heart, title: 'Freelancer Bench', desc: 'Save top freelancers to your private bench. Rate, tag, and re-hire instantly.', color: 'pink' },
            { icon: BarChart3, title: 'Team Analytics', desc: 'Spending trends, hiring velocity, ROI reports — all in one dashboard.', color: 'purple' },
            { icon: Shield, title: 'Compliance & Audit Trail', desc: 'Full activity log for every action. Tax-ready, KRA-compliant records.', color: 'amber' },
            { icon: Globe, title: 'API & Webhooks', desc: 'Integrate HustleKE into your existing tools with REST API access.', color: 'cyan' },
            { icon: Smartphone, title: 'M-Pesa Bulk Payments', desc: 'Pay multiple freelancers at once via M-Pesa. No bank transfers needed.', color: 'green' },
            { icon: Target, title: 'Priority AI Matching', desc: 'Enterprise jobs get matched first with the highest-rated freelancers.', color: 'indigo' },
            { icon: Award, title: 'Dedicated Support', desc: '2-hour SLA response time. A real person, not a chatbot.', color: 'rose' },
          ].map((a) => {
            const colorMap: Record<string, { bg: string; icon: string }> = {
              green: { bg: 'bg-green-50', icon: 'text-green-600' },
              blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
              pink: { bg: 'bg-pink-50', icon: 'text-pink-600' },
              purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
              amber: { bg: 'bg-amber-50', icon: 'text-amber-600' },
              cyan: { bg: 'bg-cyan-50', icon: 'text-cyan-600' },
              indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600' },
              rose: { bg: 'bg-rose-50', icon: 'text-rose-600' },
            }
            const c = colorMap[a.color] || colorMap.green
            return (
              <div key={a.title} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-green-200 transition-all">
                <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <a.icon className={`w-5 h-5 ${c.icon}`} />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{a.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{a.desc}</p>
              </div>
            )
          })}
        </div>

        {/* Create Org Modal */}
        {showCreateOrg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create Organization</h2>
                <button onClick={() => setShowCreateOrg(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm mb-4">{error}</div>}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name *</label>
                  <input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500/20 outline-none" placeholder="e.g. Acme Digital Agency" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500/20 outline-none" rows={3} placeholder="What does your organization do?" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <select value={createForm.industry} onChange={e => setCreateForm(f => ({ ...f, industry: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-green-500 outline-none">
                      <option value="">Select...</option>
                      {['Technology', 'Marketing', 'Design', 'Finance', 'Education', 'Healthcare', 'Media', 'E-commerce', 'Construction', 'Other'].map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Team Size</label>
                    <select value={createForm.size} onChange={e => setCreateForm(f => ({ ...f, size: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-green-500 outline-none">
                      {['1-10', '11-50', '51-200', '200+'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input value={createForm.website} onChange={e => setCreateForm(f => ({ ...f, website: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500/20 outline-none" placeholder="https://..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowCreateOrg(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
                <button onClick={handleCreateOrg} disabled={saving} className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
                  Create Organization
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Org exists — show dashboard
  const isAdmin = ['owner', 'admin'].includes(orgRole)
  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'team', label: 'Team', icon: Users },
    { key: 'bench', label: 'Freelancer Bench', icon: Heart },
    { key: 'wallet', label: 'Wallet', icon: Wallet },
    { key: 'analytics', label: 'Analytics', icon: TrendingUp },
  ]

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                <Crown className="w-3 h-3" /> Enterprise
              </span>
              <span>{org.industry || 'Organization'}</span>
              {org.size && <span>• {org.size} people</span>}
            </p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowInviteModal(true)} className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
              <UserPlus className="w-4 h-4" /> Invite Member
            </button>
          </div>
        )}
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 mb-8 overflow-x-auto scrollbar-hide">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
      {activeTab === 'overview' && (
        <div>
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Team Members', value: members.length, icon: Users, color: 'blue' },
              { label: 'Jobs Posted', value: analytics?.overview?.total_jobs_posted || 0, icon: Briefcase, color: 'green' },
              { label: 'Total Spent', value: `KES ${((analytics?.overview?.total_spent || 0) / 1000).toFixed(0)}K`, icon: DollarSign, color: 'amber' },
              { label: 'Bench Size', value: bench.length, icon: Heart, color: 'pink' },
            ].map((s) => {
              const colors: Record<string, { bg: string; icon: string }> = {
                blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
                green: { bg: 'bg-green-50', icon: 'text-green-600' },
                amber: { bg: 'bg-amber-50', icon: 'text-amber-600' },
                pink: { bg: 'bg-pink-50', icon: 'text-pink-600' },
              }
              const c = colors[s.color]
              return (
                <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 ${c.bg} rounded-lg flex items-center justify-center`}>
                      <s.icon className={`w-4 h-4 ${c.icon}`} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              )
            })}
          </div>

          {/* Quick Actions + Recent Activity */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Quick actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: 'Post a New Job', icon: Plus, desc: 'Create a job under your organization', color: 'bg-green-600', action: () => openPostJobModal() },
                  { label: 'Invite Team Member', icon: UserPlus, desc: 'Add people to your organization', color: 'bg-blue-600', action: () => setShowInviteModal(true) },
                  { label: 'Browse Freelancers', icon: Search, desc: 'Find talent & save to your bench', color: 'bg-purple-600', action: () => setShowBrowseTalent(true) },
                  { label: 'View Analytics', icon: BarChart3, desc: 'Track spending and hiring trends', color: 'bg-amber-600', action: () => setActiveTab('analytics') },
                ].map((a) => (
                  <button
                    key={a.label}
                    onClick={a.action}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className={`w-9 h-9 ${a.color} rounded-lg flex items-center justify-center`}>
                      <a.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{a.label}</p>
                      <p className="text-xs text-gray-500">{a.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 ml-auto" />
                  </button>
                ))}
              </div>
            </div>

            {/* Recent activity */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Recent Activity</h3>
              {analytics?.recent_activity?.length > 0 ? (
                <div className="space-y-3">
                  {analytics.recent_activity.slice(0, 8).map((a: any) => (
                    <div key={a.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                        <Activity className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{formatAction(a.action, a.details)}</p>
                        <p className="text-xs text-gray-400">{a.profiles?.full_name || 'System'} • {new Date(a.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No activity yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Enterprise advantage banner */}
          <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Fee Savings</p>
                <p className="text-sm text-gray-600">Your 2% Enterprise rate saves you <span className="font-semibold text-green-600">KES {analytics?.fee_savings?.toLocaleString() || 0}</span> vs the standard 6% rate.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TEAM TAB ═══ */}
      {activeTab === 'team' && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Team Members</h2>
              <p className="text-sm text-gray-500">{members.length} of {org.max_seats || 10} seats used</p>
            </div>
            {isAdmin && (
              <button onClick={() => setShowInviteModal(true)} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
                <UserPlus className="w-4 h-4" /> Invite
              </button>
            )}
          </div>

          {/* Seat progress */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Seat Usage</span>
              <span className="font-semibold text-gray-900">{members.length} / {org.max_seats || 10}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.min(100, (members.length / (org.max_seats || 10)) * 100)}%` }} />
            </div>
          </div>

          {/* Members list */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b min-w-[500px]">
              <span>Member</span>
              <span>Role</span>
              <span>Joined</span>
              <span></span>
            </div>
            {members.map((m) => {
              const p = m.profiles
              const initials = (p?.full_name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
              const roleColors: Record<string, string> = {
                owner: 'bg-amber-100 text-amber-700',
                admin: 'bg-blue-100 text-blue-700',
                hiring_manager: 'bg-purple-100 text-purple-700',
                member: 'bg-gray-100 text-gray-700',
                viewer: 'bg-gray-100 text-gray-500',
              }
              return (
                <div key={m.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50/50 min-w-[500px]">
                  <div className="flex items-center gap-3">
                    {p?.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold">{initials}</div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{p?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{p?.email || p?.title || ''}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roleColors[m.role] || 'bg-gray-100 text-gray-600'}`}>
                    {m.role.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(m.joined_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <div>
                    {isAdmin && m.role !== 'owner' && (
                      <button onClick={() => handleRemoveMember(m.id)} className="text-gray-400 hover:text-red-500 p-1" title="Remove member">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pending invites */}
          {invites.length > 0 && (
            <div className="mt-6">
              <h3 className="font-bold text-gray-900 mb-3">Pending Invites</h3>
              <div className="bg-white rounded-xl border border-gray-200 divide-y">
                {invites.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-amber-50 rounded-full flex items-center justify-center">
                        <Mail className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{inv.email}</p>
                        <p className="text-xs text-gray-400">Invited as {inv.role} • Expires {new Date(inv.expires_at).toLocaleDateString('en-KE')}</p>
                      </div>
                    </div>
                    <span className="text-xs bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full font-medium">Pending</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ BENCH TAB ═══ */}
      {activeTab === 'bench' && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Freelancer Bench</h2>
              <p className="text-sm text-gray-500">{bench.length} freelancers saved • Quick re-hire your best talent</p>
            </div>
            <button onClick={() => setShowBrowseTalent(true)} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
              <Search className="w-4 h-4" /> Find & Save Talent
            </button>
          </div>

          {bench.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bench.map((b) => {
                const f = b.freelancer
                const initials = (f?.full_name || 'F').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                return (
                  <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-green-200 transition-all">
                    <div className="flex items-start gap-3 mb-4">
                      {f?.avatar_url ? (
                        <img src={f.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover" />
                      ) : (
                        <div className="w-11 h-11 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">{initials}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{f?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 truncate">{f?.title || 'Freelancer'}</p>
                      </div>
                      <button onClick={() => handleRemoveFromBench(b.id)} className="text-gray-300 hover:text-red-500 shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Skills */}
                    {f?.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {f.skills.slice(0, 3).map((s: string) => (
                          <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                        {f.skills.length > 3 && <span className="text-[10px] text-gray-400">+{f.skills.length - 3}</span>}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                      {f?.hustle_score > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" /> {f.hustle_score}</span>}
                      {f?.hourly_rate > 0 && <span>KES {f.hourly_rate}/hr</span>}
                      {f?.jobs_completed > 0 && <span>{f.jobs_completed} jobs</span>}
                    </div>

                    {/* Internal rating + tags */}
                    {b.internal_rating && (
                      <div className="flex items-center gap-1 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < b.internal_rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                        ))}
                        <span className="text-xs text-gray-400 ml-1">Internal</span>
                      </div>
                    )}

                    {b.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {b.tags.map((t: string) => (
                          <span key={t} className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    )}

                    {b.notes && <p className="text-xs text-gray-400 italic truncate">&ldquo;{b.notes}&rdquo;</p>}

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                      <Link href={`/talent/${f?.id}`} className="flex-1 text-center py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors">
                        View Profile
                      </Link>
                      <Link
                        href={`/dashboard/messages?to=${f?.id}&name=${encodeURIComponent(f?.full_name || 'Freelancer')}`}
                        className="flex-1 text-center py-2 bg-green-600 hover:bg-green-500 rounded-lg text-xs font-semibold text-white transition-colors"
                      >
                        {b.times_hired > 0 ? 'Hire Again' : 'Hire Freelancer'}
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <div className="text-center mb-8">
                <Heart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Your Bench is Empty</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">Save your best freelancers here for quick re-hiring.</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                {[
                  { step: '1', title: 'Browse Talent', desc: 'Click "Find & Save Talent" above or use the button below to search freelancers', icon: Search },
                  { step: '2', title: 'Save to Bench', desc: 'Click the heart icon on any freelancer card to save them to your organization\'s bench', icon: Heart },
                  { step: '3', title: 'Re-hire Anytime', desc: 'Your saved freelancers appear here. One click to hire them again for new projects', icon: Zap },
                ].map(s => (
                  <div key={s.step} className="bg-gray-50 rounded-xl p-5 text-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <s.icon className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-xs font-bold text-green-600 mb-1">Step {s.step}</div>
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">{s.title}</h4>
                    <p className="text-xs text-gray-500">{s.desc}</p>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <button onClick={() => setShowBrowseTalent(true)} className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
                  <Search className="w-4 h-4" /> Browse & Save Freelancers
                </button>
                <p className="text-xs text-gray-400 mt-2">You can also save freelancers from their profile page on the <Link href="/talent" className="text-green-600 hover:underline">talent directory</Link></p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ WALLET TAB ═══ */}
      {activeTab === 'wallet' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Organization Wallet</h2>
              <p className="text-sm text-gray-500">{walletIsAdmin ? 'Admin: Top up & withdraw' : 'View balance & transactions'}</p>
            </div>
            <button onClick={() => fetchOrgWallet()} className="text-gray-400 hover:text-green-600">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Balance Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 mb-6 text-white">
            <p className="text-sm text-slate-400 mb-1">Available Balance</p>
            <p className="text-3xl font-bold">KES {(orgWallet?.balance || 0).toLocaleString()}</p>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 pt-4 border-t border-slate-700">
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Total Deposited</p>
                <p className="text-sm font-semibold">KES {(orgWallet?.total_deposited || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Total Spent</p>
                <p className="text-sm font-semibold">KES {(orgWallet?.total_spent || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Total Withdrawn</p>
                <p className="text-sm font-semibold">KES {(orgWallet?.total_withdrawn || 0).toLocaleString()}</p>
              </div>
            </div>

            {walletIsAdmin && (
              <div className="flex items-center gap-3 mt-5">
                <button
                  onClick={() => { setWalletAction('deposit'); setWalletMsg('') }}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  <ArrowDownLeft className="w-4 h-4" /> Top Up
                </button>
                <button
                  onClick={() => { setWalletAction('withdraw'); setWalletMsg('') }}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  <ArrowUpRight className="w-4 h-4" /> Withdraw
                </button>
              </div>
            )}
          </div>

          {/* Wallet Action Form */}
          {walletAction && walletIsAdmin && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">{walletAction === 'deposit' ? 'Top Up via M-Pesa' : 'Withdraw to M-Pesa'}</h3>
                <button onClick={() => { setWalletAction(null); setWalletMsg('') }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              {walletMsg && (
                <div className={`px-4 py-2 rounded-lg text-sm mb-4 ${walletMsg.includes('error') || walletMsg.includes('Insufficient') || walletMsg.includes('Invalid') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {walletMsg}
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES) *</label>
                  <input
                    type="number"
                    value={walletAction === 'deposit' ? depositForm.amount : withdrawForm.amount}
                    onChange={e => walletAction === 'deposit' ? setDepositForm(f => ({ ...f, amount: e.target.value })) : setWithdrawForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder={walletAction === 'deposit' ? 'Min 10' : 'Min 100'}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa Phone *</label>
                  <input
                    type="text"
                    value={walletAction === 'deposit' ? depositForm.phone : withdrawForm.phone}
                    onChange={e => walletAction === 'deposit' ? setDepositForm(f => ({ ...f, phone: e.target.value })) : setWithdrawForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="07XXXXXXXX"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none"
                  />
                </div>
              </div>
              <button
                onClick={async () => {
                  setWalletProcessing(true)
                  setWalletMsg('')
                  const form = walletAction === 'deposit' ? depositForm : withdrawForm
                  try {
                    const res = await fetch('/api/enterprise/wallet', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: walletAction, amount: Number(form.amount), phone: form.phone }),
                    })
                    const data = await res.json()
                    if (res.ok) {
                      setWalletMsg(data.message || 'Success!')
                      if (walletAction === 'deposit') setDepositForm({ amount: '', phone: '' })
                      else setWithdrawForm({ amount: '', phone: '' })
                      fetchOrgWallet()
                    } else {
                      setWalletMsg(data.error || 'Failed')
                    }
                  } catch { setWalletMsg('Network error') }
                  finally { setWalletProcessing(false) }
                }}
                disabled={walletProcessing}
                className="mt-4 w-full bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {walletProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : walletAction === 'deposit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                {walletAction === 'deposit' ? 'Send STK Push' : 'Withdraw Funds'}
              </button>
            </div>
          )}

          {/* Transaction History */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Transaction History</h3>
            </div>
            {orgWalletTxs.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {orgWalletTxs.map((tx: any) => {
                  const isCredit = tx.amount > 0
                  return (
                    <div key={tx.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isCredit ? 'bg-green-50' : 'bg-red-50'}`}>
                        {isCredit ? <ArrowDownLeft className="w-4 h-4 text-green-600" /> : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{tx.type}</p>
                        <p className="text-xs text-gray-400 truncate">{tx.description || tx.type}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-semibold ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                          {isCredit ? '+' : ''}KES {Math.abs(tx.amount).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-gray-400">{new Date(tx.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      {tx.performed_by_profile && (
                        <span className="text-[10px] text-gray-400 shrink-0">by {tx.performed_by_profile.full_name}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="px-5 py-12 text-center">
                <Wallet className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No transactions yet</p>
                {walletIsAdmin && <p className="text-xs text-gray-400 mt-1">Top up the org wallet to get started</p>}
              </div>
            )}
          </div>

          {!walletIsAdmin && (
            <p className="text-xs text-gray-400 mt-4 text-center">Only organization admins can deposit and withdraw funds.</p>
          )}
        </div>
      )}

      {/* ═══ ANALYTICS TAB ═══ */}
      {activeTab === 'analytics' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Team Analytics</h2>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {['7d', '30d', '90d', 'all'].map(p => (
                <button
                  key={p}
                  onClick={() => setAnalyticsPeriod(p)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${analyticsPeriod === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {p === 'all' ? 'All Time' : p}
                </button>
              ))}
            </div>
          </div>

          {analytics ? (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Jobs Posted', value: analytics.overview.jobs_in_period, icon: Briefcase, color: 'green' },
                  { label: 'Completed', value: analytics.overview.completed_in_period, icon: CheckCircle2, color: 'blue' },
                  { label: 'Total Spent', value: `KES ${(analytics.overview.total_spent / 1000).toFixed(0)}K`, icon: DollarSign, color: 'amber' },
                  { label: 'Avg Project', value: `KES ${(analytics.overview.avg_project_value / 1000).toFixed(0)}K`, icon: Target, color: 'purple' },
                ].map(kpi => {
                  const colors: Record<string, { bg: string; icon: string }> = {
                    green: { bg: 'bg-green-50', icon: 'text-green-600' },
                    blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
                    amber: { bg: 'bg-amber-50', icon: 'text-amber-600' },
                    purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
                  }
                  const c = colors[kpi.color]
                  return (
                    <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className={`w-9 h-9 ${c.bg} rounded-lg flex items-center justify-center mb-3`}>
                        <kpi.icon className={`w-4 h-4 ${c.icon}`} />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
                      <div className="text-xs text-gray-500">{kpi.label}</div>
                    </div>
                  )
                })}
              </div>

              {/* Monthly spending chart (simple bar visualization) */}
              {analytics.monthly_spending && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                  <h3 className="font-bold text-gray-900 mb-4">Monthly Spending</h3>
                  <div className="flex items-end gap-4 h-40">
                    {analytics.monthly_spending.map((m: any) => {
                      const maxSpend = Math.max(...analytics.monthly_spending.map((s: any) => s.amount), 1)
                      const pct = (m.amount / maxSpend) * 100
                      return (
                        <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full relative" style={{ height: '120px' }}>
                            <div
                              className="absolute bottom-0 w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all hover:from-green-400 hover:to-green-300"
                              style={{ height: `${Math.max(pct, 4)}%` }}
                              title={`KES ${m.amount.toLocaleString()}`}
                            />
                          </div>
                          <span className="text-[10px] text-gray-500 font-medium">{m.month}</span>
                          <span className="text-[10px] text-gray-400">KES {(m.amount / 1000).toFixed(0)}K</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Fee savings callout */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Enterprise Fee Savings</p>
                    <p className="text-sm text-gray-600">
                      At your {analytics.fee_rate}% rate, you&apos;ve saved <span className="font-semibold text-green-600">KES {analytics.fee_savings?.toLocaleString() || 0}</span> compared to the standard 6% rate.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Invite Team Member</h2>
              <button onClick={() => { setShowInviteModal(false); setError('') }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm mb-4">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500/20 outline-none" placeholder="colleague@company.com" type="email" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-green-500 outline-none">
                  <option value="admin">Admin — Full access</option>
                  <option value="hiring_manager">Hiring Manager — Post jobs & manage projects</option>
                  <option value="member">Member — Post jobs & view analytics</option>
                  <option value="viewer">Viewer — Read-only access</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowInviteModal(false); setError('') }} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
              <button onClick={handleInvite} disabled={saving} className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Browse Talent Modal */}
      {showBrowseTalent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Browse Freelancers</h2>
                <p className="text-xs text-gray-500">Search talent and save them to your bench</p>
              </div>
              <button onClick={() => { setShowBrowseTalent(false); setTalentSearch(''); setTalentResults([]) }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-gray-100 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={talentSearch}
                  onChange={e => handleTalentSearchInput(e.target.value)}
                  placeholder="Search by name, skill, or title..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-green-500 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-6">
              {talentLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                </div>
              ) : talentResults.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No freelancers found. Try a different search.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {talentResults.map((person: any) => {
                    const initials = (person.full_name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                    const isSaved = savedIds.has(person.id) || bench.some((b: any) => b.freelancer?.id === person.id)
                    const isSaving = savingFreelancerId === person.id
                    return (
                      <div key={person.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start gap-3">
                          {person.avatar_url ? (
                            <img src={person.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">{initials}</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-gray-900 text-sm truncate">{person.full_name}</p>
                              {person.verification_status === 'Verified' && <Shield className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{person.title || 'Freelancer'}</p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                              {person.hustle_score > 0 && <span className="flex items-center gap-0.5"><Award className="w-3 h-3 text-green-500" /> {person.hustle_score}</span>}
                              {person.jobs_completed > 0 && <span>{person.jobs_completed} jobs</span>}
                              {person.hourly_rate > 0 && <span className="text-green-600 font-semibold">KES {person.hourly_rate}/hr</span>}
                            </div>
                            {person.skills?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {person.skills.slice(0, 3).map((s: string) => (
                                  <span key={s} className="text-[10px] bg-white text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">{s}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                          <Link href={`/talent/${person.id}`} target="_blank" className="flex-1 text-center py-1.5 bg-white rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors border border-gray-200">
                            View Profile
                          </Link>
                          <button
                            onClick={() => handleSaveToBench(person.id)}
                            disabled={isSaved || isSaving}
                            className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                              isSaved
                                ? 'bg-green-50 text-green-600 border border-green-200'
                                : 'bg-gray-900 hover:bg-gray-800 text-white'
                            } disabled:opacity-60`}
                          >
                            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : isSaved ? <CheckCircle2 className="w-3 h-3" /> : <Heart className="w-3 h-3" />}
                            {isSaved ? 'On Bench' : 'Save to Bench'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
              <p className="text-xs text-gray-400">{talentResults.length} freelancers shown</p>
              <Link href="/talent" className="text-xs text-green-600 hover:text-green-700 font-semibold flex items-center gap-1">
                View Full Directory <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatAction(action: string, details: any): string {
  const map: Record<string, string> = {
    organization_created: 'Organization created',
    organization_updated: `Settings updated (${details?.fields?.join(', ') || 'details'})`,
    member_invited: `Invited ${details?.email || 'a member'} as ${details?.role || 'member'}`,
    member_removed: 'Removed a team member',
    member_role_updated: `Updated member role to ${details?.new_role || 'unknown'}`,
    bench_freelancer_added: `Added ${details?.freelancer_name || 'a freelancer'} to bench`,
    job_posted: `Posted a new job: ${details?.title || ''}`,
    payment_made: `Released payment of KES ${details?.amount?.toLocaleString() || '0'}`,
  }
  return map[action] || action.replace(/_/g, ' ')
}
