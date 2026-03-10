'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Activity, Search, ChevronLeft, ChevronRight, X,
  Monitor, LogOut, CheckCircle2, XCircle, Clock
} from 'lucide-react'

interface UserSession {
  id: string
  user_id: string
  is_active: boolean
  ip_address: string
  user_agent: string
  last_activity: string
  created_at: string
  profile: {
    id: string
    full_name: string
    email: string
    role: string
    avatar_url?: string
  }
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeOnly, setActiveOnly] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [stats, setStats] = useState({ total: 0, active: 0, today: 0 })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const limit = 20

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.set('search', search)
    if (activeOnly) params.set('active_only', 'true')

    try {
      const res = await fetch(`/api/admin/sessions?${params}`)
      const data = await res.json()
      setSessions(data.sessions || [])
      setTotal(data.pagination?.total || 0)
      setHasMore(data.pagination?.hasMore || false)
      setStats(data.stats || { total: 0, active: 0, today: 0 })
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
    }
    setLoading(false)
  }, [page, search, activeOnly])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const handleForceLogout = async (sessionId: string, userName: string) => {
    if (!confirm(`Force logout ${userName}?`)) return

    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}`, { method: 'DELETE' })
      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Session terminated successfully' })
        fetchSessions()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to terminate session' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-7 h-7 text-green-500" /> Session Monitoring
          </h1>
          <p className="text-sm text-gray-500 mt-1">{total.toLocaleString()} sessions</p>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <Monitor className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Sessions</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today's Sessions</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.today}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user name, email, or IP..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
            />
          </div>
          <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => { setActiveOnly(e.target.checked); setPage(1) }}
              className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500/30"
            />
            <span className="text-sm text-gray-700">Active only</span>
          </label>
          {search && (
            <button onClick={() => { setSearch(''); setPage(1) }} className="text-sm text-gray-500 hover:text-green-500 flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">IP Address</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Last Activity</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Created</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : sessions.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No sessions found</td></tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{session.profile.full_name}</p>
                        <p className="text-xs text-gray-500">{session.profile.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {session.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{session.ip_address}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(session.last_activity).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(session.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      {session.is_active && (
                        <button
                          onClick={() => handleForceLogout(session.id, session.profile.full_name)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Force Logout
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-700 px-2">Page {page}</span>
              <button disabled={!hasMore} onClick={() => setPage(p => p + 1)} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
