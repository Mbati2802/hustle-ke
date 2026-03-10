'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FileWarning, Search, ChevronLeft, ChevronRight, X,
  AlertTriangle, Info, Shield, User, Calendar
} from 'lucide-react'

interface AuditLog {
  id: string
  action: string
  entity_type: string
  entity_id: string
  created_at: string
  ip_address: string
  severity?: string
  profile?: {
    id: string
    full_name: string
    email: string
  }
  details?: any
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [entityTypeFilter, setEntityTypeFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [stats, setStats] = useState({ total: 0, critical: 0, warning: 0, action_counts: {} as Record<string, number> })
  const limit = 50

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit), sort: sortBy })
    if (search) params.set('search', search)
    if (actionFilter) params.set('action', actionFilter)
    if (entityTypeFilter) params.set('entity_type', entityTypeFilter)
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)

    try {
      const res = await fetch(`/api/admin/audit-logs?${params}`)
      const data = await res.json()
      setLogs(data.logs || [])
      setTotal(data.pagination?.total || 0)
      setHasMore(data.pagination?.hasMore || false)
      setStats(data.stats || { total: 0, critical: 0, warning: 0, action_counts: {} })
    } catch (err) {
      console.error('Failed to fetch audit logs:', err)
    }
    setLoading(false)
  }, [page, search, actionFilter, entityTypeFilter, startDate, endDate, sortBy])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600'
      case 'warning': return 'text-amber-600'
      case 'info': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const topActions = Object.entries(stats.action_counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileWarning className="w-7 h-7 text-indigo-500" /> Audit Logs
          </h1>
          <p className="text-sm text-gray-500 mt-1">{total.toLocaleString()} total log entries</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Logs</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Critical Events</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.critical}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Warnings</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.warning}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Top Action</p>
          <p className="text-sm font-bold text-gray-900 mt-1 truncate">
            {topActions[0]?.[0] || 'N/A'}
          </p>
          <p className="text-xs text-gray-500">{topActions[0]?.[1] || 0} times</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>
          <input
            type="text"
            placeholder="Filter by action..."
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <input
            type="text"
            placeholder="Filter by entity type..."
            value={entityTypeFilter}
            onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
            <span className="text-sm text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
          {(search || actionFilter || entityTypeFilter || startDate || endDate) && (
            <button onClick={() => { setSearch(''); setActionFilter(''); setEntityTypeFilter(''); setStartDate(''); setEndDate(''); setPage(1) }} className="text-sm text-gray-500 hover:text-indigo-500 flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Timestamp</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Action</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Entity</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">IP Address</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-28" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No audit logs found</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {log.profile ? (
                        <div>
                          <p className="font-medium text-gray-900 text-xs">{log.profile.full_name}</p>
                          <p className="text-xs text-gray-500">{log.profile.email}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">
                        <p className="text-gray-900">{log.entity_type}</p>
                        <p className="text-gray-400 font-mono truncate max-w-[100px]">{log.entity_id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 font-mono">{log.ip_address}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium capitalize ${getSeverityColor(log.severity)}`}>
                        {log.severity || 'info'}
                      </span>
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
