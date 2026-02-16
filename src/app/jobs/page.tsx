'use client'

import Link from 'next/link'
import { usePostJobModal } from '../components/PostJobModalContext'
import { useApplyJobModal } from '../components/ApplyJobModalContext'
import { useAuth } from '@/contexts/AuthContext'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Shield,
  Clock,
  Bookmark,
  Briefcase,
  Loader2,
  TrendingUp,
  Zap,
  Users,
  DollarSign,
  ChevronDown,
  ArrowRight,
  Eye,
  MessageSquare,
  Globe,
  Filter,
  X,
  CheckCircle2,
  Star,
  Crown,
  Building2,
  Heart,
} from 'lucide-react'

const tabs = [
  { key: 'All', label: 'All Jobs', icon: Briefcase },
  { key: 'Enterprise', label: 'Enterprise', icon: Building2 },
  { key: 'Remote', label: 'Remote', icon: Globe },
  { key: 'High Pay', label: 'High Pay', icon: TrendingUp },
  { key: 'Recent', label: 'Recent', icon: Zap },
]

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
  status: string
  proposals_count: number
  views_count: number
  created_at: string
  organization_id?: string
  client?: {
    id: string
    full_name: string
    avatar_url?: string
    verification_status?: string
    hustle_score?: number
  }
  organization?: {
    id: string
    name: string
    logo_url?: string
  } | null
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function getBudgetColor(min: number, max: number): string {
  const avg = max ? (min + max) / 2 : min
  if (avg >= 100000) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
  if (avg >= 50000) return 'text-green-600 bg-green-50 border-green-200'
  if (avg >= 20000) return 'text-blue-600 bg-blue-50 border-blue-200'
  return 'text-gray-600 bg-gray-50 border-gray-200'
}

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState('All')
  const { openModal } = usePostJobModal()
  const { openModal: openApplyModal } = useApplyJobModal()
  const { user, profile } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('newest')
  const [total, setTotal] = useState(0)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState<Set<string>>(new Set())

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: 'Open', sort, limit: '50' })
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      if (activeTab === 'Enterprise') params.set('enterprise', 'true')
      if (activeTab === 'Remote') params.set('county', 'Remote')
      if (activeTab === 'High Pay') params.set('sort', 'budget_high')
      if (activeTab === 'Recent') params.set('sort', 'newest')

      const res = await fetch(`/api/jobs?${params}`)
      const data = await res.json()
      if (data.jobs) {
        setJobs(data.jobs)
        setTotal(data.pagination?.total || data.jobs.length)
      }
    } catch {
      // Network error — leave empty
    }
    setLoading(false)
  }, [searchQuery, sort, activeTab])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  // Load saved jobs for logged-in freelancers
  useEffect(() => {
    if (user && profile?.role === 'Freelancer') {
      loadSavedJobs()
    }
  }, [user, profile])

  const loadSavedJobs = async () => {
    try {
      const res = await fetch('/api/saved-jobs')
      const data = await res.json()
      if (data.savedJobs) {
        const savedIds = new Set(data.savedJobs.map((sj: any) => sj.job_id)) as Set<string>
        setSavedJobs(savedIds)
      }
    } catch {}
  }

  const handleSaveJob = async (jobId: string) => {
    if (!user) return
    setSaving(prev => new Set(prev).add(jobId))
    try {
      const res = await fetch('/api/saved-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId }),
      })
      if (res.ok) {
        setSavedJobs(prev => new Set(prev).add(jobId))
      }
    } catch {}
    setSaving(prev => {
      const next = new Set(prev)
      next.delete(jobId)
      return next
    })
  }

  const handleUnsaveJob = async (jobId: string) => {
    if (!user) return
    setSaving(prev => new Set(prev).add(jobId))
    try {
      const res = await fetch(`/api/saved-jobs/${jobId}`, { method: 'DELETE' })
      if (res.ok) {
        setSavedJobs(prev => {
          const next = new Set(prev)
          next.delete(jobId)
          return next
        })
      }
    } catch {}
    setSaving(prev => {
      const next = new Set(prev)
      next.delete(jobId)
      return next
    })
  }

  // Debounced search
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null)
  const handleSearch = (value: string) => {
    setSearchQuery(value)
    if (searchTimer) clearTimeout(searchTimer)
    setSearchTimer(setTimeout(() => fetchJobs(), 400))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">
      <Header activeLink="/jobs" />

      {/* Hero search header */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        </div>
        <div className="absolute top-10 right-20 w-72 h-72 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">
              Find Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">Hustle</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-lg mx-auto">
              {total > 0 ? `${total} open jobs waiting for talented freelancers like you` : 'Browse open jobs from verified Kenyan clients'}
            </p>
          </div>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by skill, title, or keyword..."
                className="w-full pl-12 pr-32 py-4 bg-white rounded-2xl text-gray-900 placeholder-gray-400 border-2 border-transparent focus:border-green-500 focus:outline-none shadow-lg text-base"
              />
              <button
                onClick={() => fetchJobs()}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                Search
              </button>
            </div>
            {searchQuery && (
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="text-xs text-gray-400">Searching for &ldquo;{searchQuery}&rdquo;</span>
                <button onClick={() => { setSearchQuery(''); fetchJobs() }} className="text-xs text-green-400 hover:text-green-300 font-medium flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear
                </button>
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="flex items-center justify-center gap-6 mt-8">
            {[
              { icon: Briefcase, label: `${total} Open Jobs`, color: 'text-green-400' },
              { icon: Shield, label: 'Verified Clients', color: 'text-blue-400' },
              { icon: Zap, label: 'Instant Apply', color: 'text-amber-400' },
              { icon: DollarSign, label: 'Escrow Protected', color: 'text-emerald-400' },
            ].map((stat, i) => (
              <div key={i} className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabs bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.key
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-green-500 focus:outline-none bg-gray-50"
              >
                <option value="newest">Most Recent</option>
                <option value="budget_high">Budget: High to Low</option>
                <option value="budget_low">Budget: Low to High</option>
                <option value="most_proposals">Most Proposals</option>
              </select>
              <button
                onClick={() => openModal()}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
              >
                Post a Job
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile filter button */}
            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="md:hidden p-2 bg-gray-100 rounded-xl"
            >
              <SlidersHorizontal className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-20 space-y-5">
              {/* Filter Card */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-900 text-sm">Filters</h3>
                  </div>
                  <button className="text-xs text-green-600 hover:text-green-700 font-medium">Reset</button>
                </div>

                <div className="p-5 space-y-5">
                  {/* Categories */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Category</p>
                    <div className="space-y-2">
                      {['Web Development', 'Mobile Apps', 'Design', 'Writing', 'Marketing', 'Data Entry'].map((cat) => (
                        <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                          <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{cat}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* Budget */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Budget Range</p>
                    <div className="space-y-2">
                      {[
                        { label: 'Under KES 5K', range: 'Entry level' },
                        { label: 'KES 5K - 20K', range: 'Mid range' },
                        { label: 'KES 20K - 50K', range: 'Professional' },
                        { label: 'KES 50K+', range: 'Premium' },
                      ].map((b) => (
                        <label key={b.label} className="flex items-center gap-2.5 cursor-pointer group">
                          <input type="radio" name="budget" className="w-4 h-4 text-green-600 focus:ring-green-500" />
                          <div>
                            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{b.label}</span>
                            <span className="text-[10px] text-gray-400 ml-1.5">{b.range}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* Location */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Location</p>
                    <div className="space-y-2">
                      {[
                        { loc: 'Remote', icon: '🌍' },
                        { loc: 'Nairobi', icon: '📍' },
                        { loc: 'Mombasa', icon: '📍' },
                        { loc: 'Kisumu', icon: '📍' },
                      ].map((item) => (
                        <label key={item.loc} className="flex items-center gap-2.5 cursor-pointer group">
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                          <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                            {item.icon} {item.loc}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Post a Job CTA */}
              <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-5 text-white">
                <h4 className="font-bold mb-1">Looking to hire?</h4>
                <p className="text-xs text-green-100 mb-4">Post a job and get proposals from top Kenyan freelancers within hours.</p>
                <button
                  onClick={() => openModal()}
                  className="w-full bg-white text-green-700 hover:bg-green-50 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  Post a Job Free
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>

          {/* Job Listings */}
          <div className="flex-1 min-w-0">
            {/* Results info bar */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-gray-500">
                {loading ? 'Loading...' : `Showing ${jobs.length} of ${total} jobs`}
                {activeTab !== 'All' && <span className="text-green-600 font-medium"> · {activeTab}</span>}
              </p>
              <div className="md:hidden">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:border-green-500 focus:outline-none"
                >
                  <option value="newest">Recent</option>
                  <option value="budget_high">Budget ↓</option>
                  <option value="budget_low">Budget ↑</option>
                </select>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
                        <div className="h-4 bg-gray-100 rounded w-full mb-2" />
                        <div className="h-4 bg-gray-100 rounded w-3/4" />
                      </div>
                      <div className="h-8 bg-gray-100 rounded-lg w-28 ml-4" />
                    </div>
                    <div className="flex gap-2 mb-4">
                      <div className="h-6 bg-gray-100 rounded-lg w-20" />
                      <div className="h-6 bg-gray-100 rounded-lg w-16" />
                      <div className="h-6 bg-gray-100 rounded-lg w-24" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-gray-100 rounded w-40" />
                      <div className="h-10 bg-gray-100 rounded-xl w-28" />
                    </div>
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 border border-gray-200 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-900 font-semibold text-lg mb-2">No jobs found</p>
                <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">
                  {searchQuery ? `No results for "${searchQuery}". Try adjusting your search or filters.` : 'Check back soon — new jobs are posted daily on HustleKE.'}
                </p>
                <div className="flex gap-3 justify-center">
                  {searchQuery && (
                    <button onClick={() => { setSearchQuery(''); fetchJobs() }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors">
                      Clear Search
                    </button>
                  )}
                  <button onClick={() => openModal()} className="bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2">
                    Post a Job Instead
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Job Cards — single column, detailed */
              <div className="space-y-4">
                {jobs.map((job) => {
                  const budgetColor = getBudgetColor(job.budget_min, job.budget_max)
                  const isOrgJob = !!job.organization_id && !!job.organization
                  return (
                    <div
                      key={job.id}
                      className={`bg-white rounded-2xl border transition-all group ${
                        isOrgJob
                          ? 'border-gray-300 hover:border-slate-400 hover:shadow-md'
                          : 'border-gray-200 hover:border-green-200 hover:shadow-md'
                      }`}
                    >
                      <div className="p-4 sm:p-6">
                        {/* Top row: title + budget + org logo */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            {isOrgJob && (
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Enterprise</span>
                              </div>
                            )}
                            <h3 className={`font-bold text-gray-900 text-lg transition-colors line-clamp-2 ${
                              isOrgJob ? 'group-hover:text-slate-700' : 'group-hover:text-green-600'
                            }`}>
                              <Link href={`/jobs/${job.id}`}>
                                {job.title}
                              </Link>
                            </h3>
                          </div>
                          <div className="shrink-0 flex items-center gap-2 self-start">
                            {isOrgJob && job.organization?.logo_url && (
                              <img
                                src={job.organization.logo_url}
                                alt={job.organization.name}
                                className="w-8 h-8 rounded-lg object-cover border border-gray-200"
                              />
                            )}
                            {isOrgJob && !job.organization?.logo_url && (
                              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center border border-slate-600">
                                <Building2 className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <div className={`px-4 py-2 rounded-xl border font-bold text-sm ${budgetColor}`}>
                              KES {job.budget_min?.toLocaleString()}{job.budget_max && job.budget_max !== job.budget_min ? ` - ${job.budget_max.toLocaleString()}` : ''}
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">{job.description}</p>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {(job.skills_required || []).slice(0, 5).map((skill) => (
                            <span
                              key={skill}
                              className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${
                                isOrgJob
                                  ? 'bg-slate-50 text-slate-700 border-slate-200'
                                  : 'bg-green-50 text-green-700 border-green-100'
                              }`}
                            >
                              {skill}
                            </span>
                          ))}
                          {(job.skills_required || []).length > 5 && (
                            <span className="text-xs text-gray-400 px-2 py-1">+{job.skills_required.length - 5} more</span>
                          )}
                        </div>

                        {/* Meta row */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-500 flex-wrap min-w-0">
                            {/* Client/Org info */}
                            <div className="flex items-center gap-1.5">
                              {isOrgJob ? (
                                <div className="flex items-center gap-1 text-slate-700">
                                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                                  <span className="font-medium">{job.organization?.name}</span>
                                </div>
                              ) : job.client?.verification_status === 'Verified' ? (
                                <div className="flex items-center gap-1 text-green-600">
                                  <Shield className="w-3.5 h-3.5" />
                                  <span className="font-medium">{job.client?.full_name || 'Client'}</span>
                                </div>
                              ) : (
                                <span className="text-gray-600">{job.client?.full_name || 'Client'}</span>
                              )}
                            </div>
                            <span className="text-gray-200">|</span>

                            {/* Time */}
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {timeAgo(job.created_at)}
                            </div>
                            <span className="text-gray-200">|</span>

                            {/* Location */}
                            <div className="flex items-center gap-1">
                              {job.remote_allowed ? (
                                <><Globe className="w-3.5 h-3.5 text-blue-500" /> <span className="text-blue-600 font-medium">Remote</span></>
                              ) : (
                                <><MapPin className="w-3.5 h-3.5" /> {job.location_preference || 'Any'}</>
                              )}
                            </div>
                            <span className="hidden sm:inline text-gray-200">|</span>

                            {/* Proposals */}
                            <div className="hidden sm:flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              <span>{job.proposals_count || 0} proposals</span>
                            </div>
                          </div>

                          {/* Save button for freelancers */}
                          {user && profile?.role === 'Freelancer' && (
                            <button
                              onClick={() => savedJobs.has(job.id) ? handleUnsaveJob(job.id) : handleSaveJob(job.id)}
                              disabled={saving.has(job.id)}
                              className={`shrink-0 p-2.5 rounded-lg transition-colors ${
                                savedJobs.has(job.id)
                                  ? 'text-red-500 hover:text-red-700 hover:bg-red-50'
                                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                              } disabled:opacity-50`}
                              title={savedJobs.has(job.id) ? 'Unsave job' : 'Save job'}
                            >
                              <Heart className={`w-4.5 h-4.5 ${saving.has(job.id) ? 'animate-pulse' : ''} ${savedJobs.has(job.id) ? 'fill-current' : ''}`} />
                            </button>
                          )}

                          {/* Apply button — dark grey for org jobs, green for personal */}
                          <Link
                            href={`/jobs/${job.id}`}
                            className={`shrink-0 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 w-full sm:w-auto justify-center ${
                              isOrgJob
                                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                                : 'bg-green-600 hover:bg-green-500 text-white'
                            }`}
                          >
                            View & Apply
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Load more hint */}
            {!loading && jobs.length > 0 && jobs.length < total && (
              <div className="mt-8 text-center">
                <button className="bg-white border border-gray-200 hover:border-green-300 text-gray-700 hover:text-green-600 px-8 py-3 rounded-xl font-medium text-sm transition-all">
                  Load More Jobs
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between sticky top-0">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <h3 className="font-semibold text-gray-900">Filters</h3>
              </div>
              <button onClick={() => setMobileFiltersOpen(false)} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Category</p>
                <div className="space-y-2">
                  {['Web Development', 'Mobile Apps', 'Design', 'Writing', 'Marketing', 'Data Entry'].map((cat) => (
                    <label key={cat} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                      <span className="text-sm text-gray-600">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-100" />
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Budget Range</p>
                <div className="space-y-2">
                  {['Under KES 5K', 'KES 5K - 20K', 'KES 20K - 50K', 'KES 50K+'].map((b) => (
                    <label key={b} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="radio" name="budget-m" className="w-4 h-4 text-green-600 focus:ring-green-500" />
                      <span className="text-sm text-gray-600">{b}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-100" />
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Location</p>
                <div className="space-y-2">
                  {['Remote', 'Nairobi', 'Mombasa', 'Kisumu'].map((loc) => (
                    <label key={loc} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                      <span className="text-sm text-gray-600">{loc}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
