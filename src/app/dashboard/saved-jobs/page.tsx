'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  Briefcase,
  Clock,
  DollarSign,
  Search,
  Bookmark,
  ExternalLink,
  Heart,
  Loader2,
  Filter,
} from 'lucide-react'

interface SavedJob {
  id: string
  user_id: string
  job_id: string
  created_at: string
  updated_at: string
  job: {
    id: string
    title: string
    description: string
    budget_min: number
    budget_max: number
    status: string
    deadline?: string
    category?: string
    created_at: string
    proposals_count?: number
    client?: {
      id: string
      full_name: string
      avatar_url?: string
    }
  }
}

const statusConfig: Record<string, { color: string; label: string }> = {
  Open: { color: 'bg-green-50 text-green-700', label: 'Open' },
  'In-Progress': { color: 'bg-blue-50 text-blue-700', label: 'In Progress' },
  Review: { color: 'bg-amber-50 text-amber-700', label: 'Review' },
  Completed: { color: 'bg-gray-100 text-gray-600', label: 'Completed' },
  Cancelled: { color: 'bg-red-50 text-red-700', label: 'Cancelled' },
}

export default function SavedJobsPage() {
  const { user, profile } = useAuth()
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [unsaving, setUnsaving] = useState<Set<string>>(new Set())
  const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0, hasMore: false })

  useEffect(() => {
    if (!user) return
    loadSavedJobs()
  }, [user, search])

  const loadSavedJobs = async () => {
    setLoading(true)
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : ''
      const res = await fetch(`/api/saved-jobs${query}`)
      const data = await res.json()
      if (data.savedJobs) {
        setSavedJobs(data.savedJobs)
        setPagination(data.pagination)
      }
    } catch {}
    setLoading(false)
  }

  const handleUnsave = async (jobId: string) => {
    setUnsaving(prev => new Set(prev).add(jobId))
    try {
      const res = await fetch(`/api/saved-jobs/${jobId}`, { method: 'DELETE' })
      if (res.ok) {
        setSavedJobs(prev => prev.filter(sj => sj.job_id !== jobId))
        setPagination(prev => ({ ...prev, total: prev.total - 1 }))
      }
    } catch {}
    setUnsaving(prev => {
      const next = new Set(prev)
      next.delete(jobId)
      return next
    })
  }

  return (
    <div className="p-4 lg:p-6 xl:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Saved Jobs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Jobs you've bookmarked to apply later</p>
        </div>
        <Link href="/jobs" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors shadow-sm">
          <Search className="w-4 h-4" /> Find Work
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search saved jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <Heart className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{pagination.total}</p>
            <p className="text-xs text-gray-500">Saved Jobs</p>
          </div>
        </div>
      </div>

      {/* Saved Jobs List */}
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
      ) : savedJobs.length === 0 ? (
        <div className="bg-white rounded-xl p-10 border border-gray-200 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-900 font-semibold mb-1">
            {search ? 'No saved jobs found' : 'No saved jobs yet'}
          </p>
          <p className="text-gray-500 text-sm mb-5">
            {search 
              ? 'Try adjusting your search terms' 
              : 'Save interesting jobs while browsing to apply later'
            }
          </p>
          <Link href="/jobs" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm inline-flex items-center gap-2 transition-colors">
            <Search className="w-4 h-4" /> Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {savedJobs.map((savedJob) => {
            const job = savedJob.job
            if (!job) return null
            const statusCfg = statusConfig[job.status] || { color: 'bg-gray-50 text-gray-600', label: job.status }

            return (
              <div key={savedJob.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <Link href={`/jobs/${job.id}`} className="font-semibold text-gray-900 hover:text-green-700 transition-colors text-base">
                        {job.title}
                      </Link>
                      {job.category && <p className="text-xs text-gray-500 mt-0.5">{job.category}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                      <button
                        onClick={() => handleUnsave(job.id)}
                        disabled={unsaving.has(job.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Unsave job"
                      >
                        <Heart className={`w-4 h-4 ${unsaving.has(job.id) ? 'animate-pulse' : ''} fill-current`} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> KES {job.budget_min?.toLocaleString()}{job.budget_max && job.budget_max !== job.budget_min ? ` – ${job.budget_max.toLocaleString()}` : ''}
                    </span>
                    {job.deadline && (
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Due: {new Date(job.deadline).toLocaleDateString()}</span>
                    )}
                    <span>Posted: {new Date(job.created_at).toLocaleDateString()}</span>
                    {job.proposals_count !== undefined && (
                      <span>{job.proposals_count} proposal{job.proposals_count !== 1 ? 's' : ''}</span>
                    )}
                  </div>

                  {job.client && (
                    <div className="flex items-center gap-2 mb-4">
                      {job.client.avatar_url ? (
                        <img src={job.client.avatar_url} alt={job.client.full_name} className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {job.client.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                        </div>
                      )}
                      <p className="text-xs text-gray-500">Client: {job.client.full_name}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 flex-wrap">
                    <Link href={`/jobs/${job.id}/apply`} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors">
                      <Briefcase className="w-3.5 h-3.5" /> Apply Now
                    </Link>
                    <Link href={`/jobs/${job.id}`} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium text-sm transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" /> View Details
                    </Link>
                    <span className="flex items-center gap-1 text-gray-400 text-xs font-medium ml-auto">
                      <Bookmark className="w-3.5 h-3.5" /> Saved {new Date(savedJob.created_at).toLocaleDateString()}
                    </span>
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
