'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Briefcase, Search, ChevronLeft, ChevronRight, MoreVertical,
  Eye, Pencil, Trash2, X, DollarSign, Users as UsersIcon,
  Plus, Loader2, CheckCircle2, XCircle
} from 'lucide-react'

interface Job {
  id: string; title: string; status: string; budget_min: number; budget_max: number
  payment_type: string; proposals_count: number; views_count: number
  created_at: string; is_boosted: boolean
  client?: { id: string; full_name: string; email: string }
}

const statusColor: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-500', Open: 'bg-green-100 text-green-700',
  'In-Progress': 'bg-blue-100 text-blue-700', Completed: 'bg-gray-200 text-gray-700',
  Disputed: 'bg-red-100 text-red-700', Cancelled: 'bg-yellow-100 text-yellow-700',
}

const defaultNewJob = {
  client_id: '', title: '', description: '', budget_min: '', budget_max: '',
  payment_type: 'Fixed', status: 'Open', skills_required: '', location_preference: '',
  remote_allowed: true, deadline: '',
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const limit = 20
  const [actionMenu, setActionMenu] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newJob, setNewJob] = useState(defaultNewJob)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [clients, setClients] = useState<Array<{ id: string; full_name: string; email: string }>>([])

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit), sort: sortBy })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    try {
      const res = await fetch(`/api/admin/jobs?${params}`)
      const data = await res.json()
      setJobs(data.jobs || [])
      setTotal(data.pagination?.total || 0)
      setHasMore(data.pagination?.hasMore || false)
    } catch { /* */ }
    setLoading(false)
  }, [page, search, statusFilter, sortBy])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const fetchClients = async () => {
    const res = await fetch('/api/admin/users?role=Client&limit=100')
    const data = await res.json()
    setClients(data.users || [])
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this job? This cannot be undone.')) return
    await fetch(`/api/admin/jobs/${id}`, { method: 'DELETE' })
    fetchJobs()
    setActionMenu(null)
  }

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/admin/jobs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchJobs()
    setActionMenu(null)
  }

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true); setMessage(null)
    try {
      const payload = {
        ...newJob,
        budget_min: Number(newJob.budget_min),
        budget_max: Number(newJob.budget_max),
        skills_required: newJob.skills_required ? newJob.skills_required.split(',').map(s => s.trim()).filter(Boolean) : [],
      }
      const res = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: `Job "${newJob.title}" created successfully` })
        setShowCreateModal(false)
        setNewJob(defaultNewJob)
        fetchJobs()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create job' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    }
    setCreating(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-green-500" /> Jobs
          </h1>
          <p className="text-sm text-gray-500 mt-1">{total.toLocaleString()} total jobs</p>
        </div>
        <button onClick={() => { setShowCreateModal(true); fetchClients() }} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Job
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search jobs..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30">
            <option value="">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Open">Open</option>
            <option value="In-Progress">In-Progress</option>
            <option value="Completed">Completed</option>
            <option value="Disputed">Disputed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="budget_high">Budget (High)</option>
            <option value="most_proposals">Most Proposals</option>
          </select>
          {(search || statusFilter) && (
            <button onClick={() => { setSearch(''); setStatusFilter(''); setPage(1) }} className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Job</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Client</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Budget</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Proposals</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Views</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Created</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : jobs.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No jobs found</td></tr>
              ) : (
                jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate max-w-[220px]">{j.title}</p>
                        <p className="text-xs text-gray-400">{j.payment_type}{j.is_boosted ? ' · Boosted' : ''}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {j.client ? (
                        <Link href={`/admin/users/${j.client.id}`} className="hover:text-green-600">{j.client.full_name}</Link>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[j.status] || 'bg-gray-100 text-gray-600'}`}>{j.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-gray-400" /> {j.budget_min.toLocaleString()} – {j.budget_max.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <span className="flex items-center gap-1"><UsersIcon className="w-3 h-3 text-gray-400" /> {j.proposals_count}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-gray-400" /> {j.views_count}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(j.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right relative">
                      <button onClick={() => setActionMenu(actionMenu === j.id ? null : j.id)} className="p-1 hover:bg-gray-100 rounded transition">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                      {actionMenu === j.id && (
                        <div className="absolute right-4 top-10 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-48">
                          <Link href={`/admin/jobs/${j.id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setActionMenu(null)}>
                            <Eye className="w-4 h-4" /> View / Edit
                          </Link>
                          {j.status === 'Draft' && (
                            <button onClick={() => handleStatusChange(j.id, 'Open')} className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 w-full text-left">
                              <CheckCircle2 className="w-4 h-4" /> Publish
                            </button>
                          )}
                          {j.status === 'Open' && (
                            <button onClick={() => handleStatusChange(j.id, 'Cancelled')} className="flex items-center gap-2 px-3 py-2 text-sm text-yellow-600 hover:bg-yellow-50 w-full text-left">
                              <X className="w-4 h-4" /> Cancel Job
                            </button>
                          )}
                          {j.status === 'In-Progress' && (
                            <button onClick={() => handleStatusChange(j.id, 'Completed')} className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 w-full text-left">
                              <CheckCircle2 className="w-4 h-4" /> Mark Complete
                            </button>
                          )}
                          <button onClick={() => handleDelete(j.id)} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                            <Trash2 className="w-4 h-4" /> Delete Job
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {total > limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}</p>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-gray-700 px-2">Page {page}</span>
              <button disabled={!hasMore} onClick={() => setPage(p => p + 1)} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Create New Job</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleCreateJob} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Client *</label>
                <select required value={newJob.client_id} onChange={e => setNewJob(p => ({ ...p, client_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30">
                  <option value="">Select a client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Title *</label>
                <input type="text" required value={newJob.title} onChange={e => setNewJob(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" placeholder="Job title" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description *</label>
                <textarea required rows={4} value={newJob.description} onChange={e => setNewJob(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" placeholder="Detailed job description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Budget Min (KES) *</label>
                  <input type="number" required min={0} value={newJob.budget_min} onChange={e => setNewJob(p => ({ ...p, budget_min: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Budget Max (KES) *</label>
                  <input type="number" required min={0} value={newJob.budget_max} onChange={e => setNewJob(p => ({ ...p, budget_max: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Payment Type</label>
                  <select value={newJob.payment_type} onChange={e => setNewJob(p => ({ ...p, payment_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30">
                    <option value="Fixed">Fixed</option>
                    <option value="Hourly">Hourly</option>
                    <option value="Milestone">Milestone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select value={newJob.status} onChange={e => setNewJob(p => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30">
                    <option value="Draft">Draft</option>
                    <option value="Open">Open</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Skills Required (comma-separated)</label>
                <input type="text" value={newJob.skills_required} onChange={e => setNewJob(p => ({ ...p, skills_required: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" placeholder="Web Dev, UI/UX" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
                  <input type="text" value={newJob.location_preference} onChange={e => setNewJob(p => ({ ...p, location_preference: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" placeholder="Nairobi" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Deadline</label>
                  <input type="date" value={newJob.deadline} onChange={e => setNewJob(p => ({ ...p, deadline: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={newJob.remote_allowed} onChange={e => setNewJob(p => ({ ...p, remote_allowed: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-green-600" />
                Remote allowed
              </label>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={creating} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2">
                  {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Job</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
