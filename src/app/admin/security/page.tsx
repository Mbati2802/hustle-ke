'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Lock, Search, ChevronLeft, ChevronRight, X,
  AlertTriangle, Shield, Eye, Clock, CheckCircle2
} from 'lucide-react'

interface SecurityAlert {
  id: string
  user_id: string
  alert_type: string
  severity: string
  status: string
  description: string
  created_at: string
  profile: {
    id: string
    full_name: string
    email: string
    role: string
    avatar_url?: string
  }
}

export default function AdminSecurityPage() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [stats, setStats] = useState({ total: 0, active: 0, investigating: 0, resolved: 0, critical: 0 })
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const limit = 20

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit), sort: sortBy })
    if (search) params.set('search', search)
    if (severityFilter) params.set('severity', severityFilter)
    if (statusFilter) params.set('status', statusFilter)

    try {
      const res = await fetch(`/api/admin/security?${params}`)
      const data = await res.json()
      setAlerts(data.alerts || [])
      setTotal(data.pagination?.total || 0)
      setHasMore(data.pagination?.hasMore || false)
      setStats(data.stats || { total: 0, active: 0, investigating: 0, resolved: 0, critical: 0 })
    } catch (err) {
      console.error('Failed to fetch security alerts:', err)
    }
    setLoading(false)
  }, [page, search, severityFilter, statusFilter, sortBy])

  useEffect(() => { fetchAlerts() }, [fetchAlerts])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700'
      case 'high': return 'bg-orange-100 text-orange-700'
      case 'medium': return 'bg-amber-100 text-amber-700'
      case 'low': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'investigating': return <Eye className="w-4 h-4 text-blue-500" />
      case 'active': return <AlertTriangle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const handleAction = async (alertId: string, action: string) => {
    setSelectedAlert(alertId)
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/security/${alertId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      if (res.ok) {
        await fetchAlerts()
      }
    } catch (err) {
      console.error('Failed to perform action:', err)
    }
    setActionLoading(false)
    setSelectedAlert(null)
  }

  const secStatCards = [
    { label: 'Critical', value: stats.critical, dot: 'bg-red-600', text: 'text-red-600', sFilter: '', svFilter: 'critical' },
    { label: 'Active', value: stats.active, dot: 'bg-orange-500', text: 'text-orange-600', sFilter: 'active', svFilter: '' },
    { label: 'Investigating', value: stats.investigating, dot: 'bg-blue-500', text: 'text-blue-600', sFilter: 'investigating', svFilter: '' },
    { label: 'Resolved', value: stats.resolved, dot: 'bg-green-500', text: 'text-green-600', sFilter: 'resolved', svFilter: '' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-red-500" /> Security Alerts
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{stats.critical} critical · {stats.active} active · {total.toLocaleString()} total</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {secStatCards.map(s => (
          <button key={s.label}
            onClick={() => {
              if (s.svFilter) setSeverityFilter(severityFilter === s.svFilter ? '' : s.svFilter)
              if (s.sFilter) setStatusFilter(statusFilter === s.sFilter ? '' : s.sFilter)
              setPage(1)
            }}
            className={`text-left bg-white rounded-xl border p-3 hover:shadow-sm transition-all ${
              (s.sFilter && statusFilter === s.sFilter) || (s.svFilter && severityFilter === s.svFilter)
                ? 'ring-1 ring-red-200 border-red-200' : 'border-gray-200'
            }`}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className="text-xs text-gray-500">{s.label}</span>
            </div>
            <p className={`text-xl font-bold ${s.text}`}>{s.value}</p>
            {stats.total > 0 && (
              <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${s.dot} rounded-full`} style={{ width: `${Math.min(100,(s.value/stats.total)*100)}%` }} />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
            />
          </div>
          <select value={severityFilter} onChange={(e) => { setSeverityFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
          </select>
          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="severity">Highest Severity</option>
          </select>
          {(search || severityFilter || statusFilter) && (
            <button onClick={() => { setSearch(''); setSeverityFilter(''); setStatusFilter(''); setPage(1) }} className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Alert Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Severity</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Description</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Created</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-48" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                  </tr>
                ))
              ) : alerts.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No security alerts found</td></tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{alert.profile.full_name}</p>
                        <p className="text-xs text-gray-500">{alert.profile.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{alert.alert_type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(alert.status)}
                        <span className="text-xs capitalize">{alert.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-600 truncate max-w-xs">{alert.description}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(alert.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleAction(alert.id, 'view')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition"
                      >
                        <Shield className="w-3.5 h-3.5" /> Actions
                      </button>
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
