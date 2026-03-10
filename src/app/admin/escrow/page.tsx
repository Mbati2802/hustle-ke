'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  DollarSign, ChevronLeft, ChevronRight, X, ArrowUpRight, ArrowDownRight,
  Eye, AlertTriangle, CheckCircle2, RefreshCw, ExternalLink, MoreVertical,
  Clock, Shield, FileText
} from 'lucide-react'

interface Escrow {
  id: string; amount: number; status: string; service_fee: number; tax_amount: number
  initiated_at: string; released_at?: string; refunded_at?: string
  job?: { id: string; title: string }
  client?: { id: string; full_name: string; email: string }
  freelancer?: { id: string; full_name: string; email: string }
}

const statusColor: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-700', Held: 'bg-blue-100 text-blue-700',
  Released: 'bg-green-100 text-green-700', Refunded: 'bg-gray-100 text-gray-600',
  Disputed: 'bg-red-100 text-red-700',
}

export default function AdminEscrowPage() {
  const [escrows, setEscrows] = useState<Escrow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [stats, setStats] = useState({ total_held: 0, total_released: 0, pending_releases: 0, disputed: 0 })
  const limit = 20

  const fetchEscrows = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (statusFilter) params.set('status', statusFilter)
    try {
      const res = await fetch(`/api/admin/escrow?${params}`)
      const data = await res.json()
      setEscrows(data.escrows || [])
      setTotal(data.pagination?.total || 0)
      setHasMore(data.pagination?.hasMore || false)
      setStats(data.stats || { total_held: 0, total_released: 0, pending_releases: 0, disputed: 0 })
    } catch { /* */ }
    setLoading(false)
  }, [page, statusFilter])

  useEffect(() => { fetchEscrows() }, [fetchEscrows])

  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const handleForceRelease = async (id: string) => {
    if (!confirm('Force release escrow funds to freelancer? This cannot be undone.')) return
    setActionLoading(id)
    await fetch(`/api/escrow/${id}/release`, { method: 'POST' })
    setActionLoading(null)
    fetchEscrows()
  }

  const handleForceRefund = async (id: string) => {
    if (!confirm('Force refund escrow funds to client? This cannot be undone.')) return
    setActionLoading(id)
    await fetch(`/api/escrow/${id}/refund`, { method: 'POST' })
    setActionLoading(null)
    fetchEscrows()
  }

  return (
    <div className="space-y-5" onClick={() => setOpenMenu(null)}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-500" /> Escrow
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{total} transactions · {stats.disputed} disputed · {stats.pending_releases} pending</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/disputes" className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Disputes
          </Link>
          <button onClick={() => fetchEscrows()} className="p-1.5 hover:bg-gray-100 rounded-lg transition" title="Refresh">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Held', value: `KES ${stats.total_held.toLocaleString()}`, dot: 'bg-blue-500', text: 'text-blue-600', filter: 'Held' },
          { label: 'Released', value: `KES ${stats.total_released.toLocaleString()}`, dot: 'bg-green-500', text: 'text-green-600', filter: 'Released' },
          { label: 'Pending', value: stats.pending_releases, dot: 'bg-amber-500', text: 'text-amber-600', filter: 'Pending' },
          { label: 'Disputed', value: stats.disputed, dot: 'bg-red-500', text: 'text-red-600', filter: 'Disputed' },
        ].map((s) => (
          <button key={s.label}
            onClick={() => { setStatusFilter(statusFilter === s.filter ? '' : s.filter); setPage(1) }}
            className={`text-left bg-white rounded-xl border p-3 hover:shadow-sm transition-all ${
              statusFilter === s.filter ? 'ring-1 ring-amber-200 border-amber-200' : 'border-gray-200'
            }`}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className="text-xs text-gray-500">{s.label}</span>
            </div>
            <p className={`text-lg font-bold ${s.text}`}>{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <div className="flex flex-wrap items-center gap-2">
          {['', 'Pending', 'Held', 'Released', 'Refunded', 'Disputed'].map(s => (
            <button key={s || 'all'} onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                statusFilter === s ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>{s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Job</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Client</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Freelancer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Fee</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse">{[...Array(8)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>)}</tr>)
              ) : escrows.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No escrow transactions</td></tr>
              ) : escrows.map(e => (
                <tr key={e.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[160px] truncate">
                    {e.job ? <Link href={`/admin/jobs/${e.job.id}`} className="hover:text-green-600">{e.job.title}</Link> : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {e.client ? <Link href={`/admin/users/${e.client.id}`} className="hover:text-green-600">{e.client.full_name}</Link> : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {e.freelancer ? <Link href={`/admin/users/${e.freelancer.id}`} className="hover:text-green-600">{e.freelancer.full_name}</Link> : '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">KES {e.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">KES {e.service_fee.toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[e.status] || 'bg-gray-100 text-gray-600'}`}>{e.status}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(e.initiated_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      {/* View job link — always available */}
                      {e.job && (
                        <Link href={`/admin/jobs/${e.job.id}`}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-700" title="View Job">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}

                      {/* Held: Release or Refund */}
                      {e.status === 'Held' && (
                        <>
                          <button onClick={(ev) => { ev.stopPropagation(); handleForceRelease(e.id) }}
                            disabled={actionLoading === e.id}
                            className="px-2.5 py-1.5 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition flex items-center gap-1 font-medium disabled:opacity-50">
                            <ArrowUpRight className="w-3 h-3" /> Release
                          </button>
                          <button onClick={(ev) => { ev.stopPropagation(); handleForceRefund(e.id) }}
                            disabled={actionLoading === e.id}
                            className="px-2.5 py-1.5 text-xs bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition flex items-center gap-1 font-medium disabled:opacity-50">
                            <ArrowDownRight className="w-3 h-3" /> Refund
                          </button>
                        </>
                      )}

                      {/* Pending: Release or Refund too */}
                      {e.status === 'Pending' && (
                        <>
                          <button onClick={(ev) => { ev.stopPropagation(); handleForceRelease(e.id) }}
                            disabled={actionLoading === e.id}
                            className="px-2.5 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition flex items-center gap-1 font-medium disabled:opacity-50">
                            <CheckCircle2 className="w-3 h-3" /> Approve
                          </button>
                          <button onClick={(ev) => { ev.stopPropagation(); handleForceRefund(e.id) }}
                            disabled={actionLoading === e.id}
                            className="px-2.5 py-1.5 text-xs bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition flex items-center gap-1 font-medium disabled:opacity-50">
                            <X className="w-3 h-3" /> Cancel
                          </button>
                        </>
                      )}

                      {/* Disputed: Force release, force refund, or view dispute */}
                      {e.status === 'Disputed' && (
                        <div className="relative" onClick={ev => ev.stopPropagation()}>
                          <button onClick={() => setOpenMenu(openMenu === e.id ? null : e.id)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition text-red-600">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                          {openMenu === e.id && (
                            <div className="absolute right-0 top-8 bg-white rounded-xl shadow-xl border border-gray-200 z-20 min-w-[170px] py-1">
                              <button onClick={() => { handleForceRelease(e.id); setOpenMenu(null) }}
                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-green-700">
                                <ArrowUpRight className="w-4 h-4" /> Release to Freelancer
                              </button>
                              <button onClick={() => { handleForceRefund(e.id); setOpenMenu(null) }}
                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-amber-700">
                                <ArrowDownRight className="w-4 h-4" /> Refund to Client
                              </button>
                              <div className="border-t border-gray-100 my-1" />
                              <Link href="/admin/disputes"
                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-blue-700">
                                <FileText className="w-4 h-4" /> View Dispute
                              </Link>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Released / Refunded — view only */}
                      {(e.status === 'Released' || e.status === 'Refunded') && (
                        <span className={`text-xs px-2 py-1 rounded-lg font-medium ${e.status === 'Released' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {e.status === 'Released' ? `${new Date(e.released_at!).toLocaleDateString()}` : `${new Date(e.refunded_at!).toLocaleDateString()}`}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
