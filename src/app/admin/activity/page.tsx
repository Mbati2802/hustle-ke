'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Activity, ChevronLeft, ChevronRight, X, User,
  FileCode, Settings, Star, AlertTriangle, Briefcase, Users, Trash2
} from 'lucide-react'

interface ActivityEntry {
  id: string; action: string; entity_type: string; entity_id?: string
  details?: Record<string, unknown>; ip_address?: string; created_at: string
  admin?: { id: string; full_name: string; email: string; avatar_url?: string }
}

const actionIcons: Record<string, React.ElementType> = {
  update_settings: Settings, create_page: FileCode, update_page: FileCode,
  delete_page: Trash2, hide_review: Star, update_review: Star,
  delete_review: Trash2, update_user: Users, delete_user: Trash2,
  resolve_dispute: AlertTriangle,
}

const entityColors: Record<string, string> = {
  site_settings: 'bg-blue-100 text-blue-700',
  site_pages: 'bg-indigo-100 text-indigo-700',
  reviews: 'bg-amber-100 text-amber-700',
  profiles: 'bg-green-100 text-green-700',
  disputes: 'bg-red-100 text-red-700',
  jobs: 'bg-purple-100 text-purple-700',
}

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [entityFilter, setEntityFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const limit = 30

  const fetchActivity = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (entityFilter) params.set('entity_type', entityFilter)
    try {
      const res = await fetch(`/api/admin/activity?${params}`)
      const data = await res.json()
      setActivities(data.activities || [])
      setTotal(data.pagination?.total || 0)
      setHasMore(data.pagination?.hasMore || false)
    } catch { /* */ }
    setLoading(false)
  }, [page, entityFilter])

  useEffect(() => { fetchActivity() }, [fetchActivity])

  function formatAction(action: string) {
    return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-7 h-7 text-green-500" /> Activity Log
        </h1>
        <p className="text-sm text-gray-500 mt-1">Track all admin actions on the platform</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30">
            <option value="">All Types</option>
            <option value="site_settings">Settings</option>
            <option value="site_pages">Pages</option>
            <option value="reviews">Reviews</option>
            <option value="profiles">Users</option>
            <option value="disputes">Disputes</option>
            <option value="jobs">Jobs</option>
          </select>
          {entityFilter && (
            <button onClick={() => { setEntityFilter(''); setPage(1) }} className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="divide-y divide-gray-100">
          {loading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="p-4 animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-64" /><div className="h-3 bg-gray-100 rounded w-40" /></div>
              </div>
            ))
          ) : activities.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No activity logged yet</div>
          ) : activities.map(a => {
            const Icon = actionIcons[a.action] || Activity
            return (
              <div key={a.id} className="p-4 flex items-start gap-4 hover:bg-gray-50 transition">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${entityColors[a.entity_type] || 'bg-gray-100 text-gray-600'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{a.admin?.full_name || 'System'}</span>
                    {' '}
                    <span className="text-gray-600">{formatAction(a.action)}</span>
                    {a.entity_type && (
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${entityColors[a.entity_type] || 'bg-gray-100 text-gray-600'}`}>
                        {a.entity_type.replace(/_/g, ' ')}
                      </span>
                    )}
                  </p>
                  {a.details && Object.keys(a.details).length > 0 && (
                    <p className="text-xs text-gray-400 mt-1 truncate max-w-lg">
                      {JSON.stringify(a.details).slice(0, 120)}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>{new Date(a.created_at).toLocaleString()}</span>
                    {a.ip_address && <span>IP: {a.ip_address}</span>}
                    {a.entity_id && <span>ID: {a.entity_id.slice(0, 8)}...</span>}
                  </div>
                </div>
              </div>
            )
          })}
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
    </div>
  )
}
