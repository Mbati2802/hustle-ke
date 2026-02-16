'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, Search, ChevronLeft, ChevronRight, X,
  Eye, DollarSign, Clock
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

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const limit = 20

  const fetchDisputes = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (statusFilter) params.set('status', statusFilter)
    try {
      const res = await fetch(`/api/admin/disputes?${params}`)
      const data = await res.json()
      setDisputes(data.disputes || [])
      setTotal(data.pagination?.total || 0)
      setHasMore(data.pagination?.hasMore || false)
    } catch { /* */ }
    setLoading(false)
  }, [page, statusFilter])

  useEffect(() => { fetchDisputes() }, [fetchDisputes])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="w-7 h-7 text-red-500" /> Disputes
        </h1>
        <p className="text-sm text-gray-500 mt-1">{total} total disputes</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30">
            <option value="">All Status</option>
            <option value="Open">Open</option>
            <option value="Resolved">Resolved</option>
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
                <th className="text-left px-4 py-3 font-medium text-gray-500">Initiator</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Respondent</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Escrow</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Reason</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse">{[...Array(8)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>)}</tr>)
              ) : disputes.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No disputes found</td></tr>
              ) : disputes.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[160px] truncate">{d.job?.title || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{d.initiator?.full_name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{d.respondent?.full_name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-700">
                    {d.escrow ? <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> KES {d.escrow.amount.toLocaleString()}</span> : '—'}
                  </td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[d.status] || 'bg-gray-100 text-gray-600'}`}>{d.status}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-[200px] truncate">{d.reason}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(d.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/disputes/${d.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition">
                      <Eye className="w-3.5 h-3.5" /> {d.status === 'Open' ? 'Resolve' : 'View'}
                    </Link>
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
