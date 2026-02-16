'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  DollarSign, ChevronLeft, ChevronRight, X, ArrowUpRight, ArrowDownRight
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
    } catch { /* */ }
    setLoading(false)
  }, [page, statusFilter])

  useEffect(() => { fetchEscrows() }, [fetchEscrows])

  const handleForceRelease = async (id: string) => {
    if (!confirm('Force release escrow funds to freelancer?')) return
    await fetch(`/api/escrow/${id}/release`, { method: 'POST' })
    fetchEscrows()
  }

  const handleForceRefund = async (id: string) => {
    if (!confirm('Force refund escrow funds to client?')) return
    await fetch(`/api/escrow/${id}/refund`, { method: 'POST' })
    fetchEscrows()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-7 h-7 text-amber-500" /> Escrow Transactions
        </h1>
        <p className="text-sm text-gray-500 mt-1">{total} total transactions</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30">
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Held">Held</option>
            <option value="Released">Released</option>
            <option value="Refunded">Refunded</option>
            <option value="Disputed">Disputed</option>
          </select>
          {statusFilter && (
            <button onClick={() => { setStatusFilter(''); setPage(1) }} className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
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
                    {e.status === 'Held' && (
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => handleForceRelease(e.id)} className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3" /> Release
                        </button>
                        <button onClick={() => handleForceRefund(e.id)} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition flex items-center gap-1">
                          <ArrowDownRight className="w-3 h-3" /> Refund
                        </button>
                      </div>
                    )}
                    {e.status === 'Disputed' && (
                      <span className="text-xs text-red-500">See Disputes</span>
                    )}
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
