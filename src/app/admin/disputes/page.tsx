'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, ChevronLeft, ChevronRight, X, DollarSign, Eye,
  Clock, CheckCircle2, Shield, TrendingDown
} from 'lucide-react'

interface Dispute {
  id: string; reason: string; status: string; created_at: string
  job?: { id: string; title: string }
  initiator?: { id: string; full_name: string; email: string }
  respondent?: { id: string; full_name: string; email: string }
  escrow?: { id: string; amount: number; status: string }
}

const statusColor: Record<string, string> = {
  Open: 'bg-red-100 text-red-700',
  'Under Review': 'bg-amber-100 text-amber-700',
  Resolved: 'bg-green-100 text-green-700',
  Dismissed: 'bg-gray-100 text-gray-500',
}

function daysAgo(date: string) {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const limit = 20
  const [stats, setStats] = useState({ open: 0, resolved: 0, total: 0, escrowAtRisk: 0 })

  const fetchDisputes = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (statusFilter) params.set('status', statusFilter)
    try {
      const [res, statsRes] = await Promise.all([
        fetch(`/api/admin/disputes?${params}`),
        page === 1 && !statusFilter ? fetch('/api/admin/stats') : Promise.resolve(null),
      ])
      const data = await res.json()
      setDisputes(data.disputes || [])
      setTotal(data.pagination?.total || 0)
      setHasMore(data.pagination?.hasMore || false)
      if (statsRes?.ok) {
        const s = await statsRes.json()
        const d = s.stats?.disputes || {}
        setStats({ open: d.open||0, resolved: d.resolved||0, total: d.total||0, escrowAtRisk: d.escrow_at_risk||0 })
      }
    } catch { /* */ }
    setLoading(false)
  }, [page, statusFilter])

  useEffect(() => { fetchDisputes() }, [fetchDisputes])

  const disputeStatCards = [
    { label: 'Open', value: stats.open, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500', filter: 'Open' },
    { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', dot: 'bg-green-500', filter: 'Resolved' },
    { label: 'Total', value: stats.total, icon: Shield, color: 'text-gray-600', bg: 'bg-gray-50', dot: 'bg-gray-400', filter: '' },
    { label: 'Escrow at Risk', value: stats.escrowAtRisk, icon: TrendingDown, color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500', filter: '', prefix: 'KES' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" /> Disputes
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{stats.open} open · {total} total</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/escrow" className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Escrow
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {disputeStatCards.map(s => (
          <button key={s.label}
            onClick={() => s.filter !== undefined && setStatusFilter(statusFilter === s.filter && s.filter !== '' ? '' : s.filter)}
            className={`text-left bg-white rounded-xl border border-gray-200 p-3 hover:shadow-sm transition-all ${
              statusFilter === s.filter && s.filter !== '' ? 'ring-1 ring-red-200 border-red-200' : ''
            }`}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className="text-xs text-gray-500">{s.label}</span>
            </div>
            <p className={`text-xl font-bold ${s.color}`}>
              {s.prefix ? `${s.prefix} ${s.value.toLocaleString()}` : s.value.toLocaleString()}
            </p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <div className="flex flex-wrap items-center gap-2">
          {['', 'Open', 'Resolved'].map(s => (
            <button key={s || 'all'}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                statusFilter === s ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Job</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Parties</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Escrow</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Reason</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Age</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse">{[...Array(8)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>)}</tr>)
              ) : disputes.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No disputes found</td></tr>
              ) : disputes.map(d => {
                const age = daysAgo(d.created_at)
                const urgent = d.status === 'Open' && age >= 3
                return (
                  <tr key={d.id} className={`hover:bg-gray-50 transition ${urgent ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {urgent && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
                        <span className="text-xs font-medium text-gray-900 truncate max-w-[140px]">{d.job?.title || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[11px]">
                        <p className="text-gray-700 font-medium">{d.initiator?.full_name || '—'}</p>
                        <p className="text-gray-400">vs {d.respondent?.full_name || '—'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      {d.escrow ? <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-gray-400" /> {d.escrow.amount.toLocaleString()}</span> : '—'}
                    </td>
                    <td className="px-4 py-3"><span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColor[d.status] || 'bg-gray-100 text-gray-600'}`}>{d.status}</span></td>
                    <td className="px-4 py-3 text-[11px] text-gray-500 max-w-[180px] truncate">{d.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                        age >= 7 ? 'text-red-600' : age >= 3 ? 'text-amber-600' : 'text-gray-500'
                      }`}>
                        <Clock className="w-3 h-3" /> {age}d
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/disputes/${d.id}`}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition ${
                          d.status === 'Open' ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}>
                        <Eye className="w-3 h-3" /> {d.status === 'Open' ? 'Resolve' : 'View'}
                      </Link>
                    </td>
                  </tr>
                )
              })}
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
    </div>
  )
}
