'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  FileText, ChevronLeft, ChevronRight, X, DollarSign,
  CheckCircle2, Clock, TrendingUp, Briefcase
} from 'lucide-react'

interface Proposal {
  id: string; bid_amount: number; status: string; submitted_at: string
  cover_letter: string; estimated_duration_days?: number
  job?: { id: string; title: string; budget_min: number; budget_max: number; status: string; client?: { id: string; full_name: string } }
  freelancer?: { id: string; full_name: string; hustle_score: number; verification_status: string }
}

const statusColor: Record<string, string> = {
  Pending: 'bg-blue-100 text-blue-700', Accepted: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700', Withdrawn: 'bg-gray-100 text-gray-500',
}

export default function AdminProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, _setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const limit = 20
  const [pStats, setPStats] = useState({ pending: 0, accepted: 0, rejected: 0, withdrawn: 0 })

  const fetchProposals = useCallback(async () => {
    setLoading(true)
    // Use admin jobs endpoint to get all proposals across jobs
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (statusFilter) params.set('status', statusFilter)
    if (search) params.set('search', search)
    try {
      const res = await fetch(`/api/proposals?${params}`)
      const data = await res.json()
      const list: Proposal[] = data.proposals || []
      setProposals(list)
      setTotal(data.pagination?.total || 0)
      setHasMore(data.pagination?.hasMore || false)
      if (page === 1 && !statusFilter) {
        setPStats({
          pending: list.filter(p => p.status === 'Pending').length,
          accepted: list.filter(p => p.status === 'Accepted').length,
          rejected: list.filter(p => p.status === 'Rejected').length,
          withdrawn: list.filter(p => p.status === 'Withdrawn').length,
        })
      }
    } catch { /* */ }
    setLoading(false)
  }, [page, statusFilter, search])

  useEffect(() => { fetchProposals() }, [fetchProposals])

  const total4 = pStats.pending + pStats.accepted + pStats.rejected + pStats.withdrawn
  const acceptRate = total4 > 0 ? Math.round((pStats.accepted / total4) * 100) : 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-500" /> Proposals
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{total} total · {acceptRate}% acceptance rate</p>
        </div>
        <Link href="/admin/jobs" className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5" /> View Jobs
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending', value: pStats.pending, color: 'bg-blue-500', text: 'text-blue-600', status: 'Pending', icon: Clock },
          { label: 'Accepted', value: pStats.accepted, color: 'bg-green-500', text: 'text-green-600', status: 'Accepted', icon: CheckCircle2 },
          { label: 'Rejected', value: pStats.rejected, color: 'bg-red-400', text: 'text-red-600', status: 'Rejected', icon: X },
          { label: 'Accept Rate', value: acceptRate, color: 'bg-purple-500', text: 'text-purple-600', status: '', icon: TrendingUp, suffix: '%' },
        ].map(s => (
          <button key={s.label}
            onClick={() => s.status && (setStatusFilter(statusFilter === s.status ? '' : s.status), setPage(1))}
            className={`text-left bg-white rounded-xl border p-3 hover:shadow-sm transition-all ${
              statusFilter === s.status && s.status ? 'border-purple-200 ring-1 ring-purple-100' : 'border-gray-200'
            }`}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className={`w-2 h-2 rounded-full ${s.color}`} />
              <span className="text-xs text-gray-500">{s.label}</span>
            </div>
            <p className={`text-xl font-bold ${s.text}`}>{s.value}{s.suffix || ''}</p>
            {s.status && total4 > 0 && (
              <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${s.color} rounded-full`} style={{ width: `${Math.min(100,(s.value/total4)*100)}%` }} />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <div className="flex flex-wrap items-center gap-2">
          {['', 'Pending', 'Accepted', 'Rejected', 'Withdrawn'].map(s => (
            <button key={s || 'all'} onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                statusFilter === s ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                <th className="text-left px-4 py-3 font-medium text-gray-500">Freelancer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Job</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Bid</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Cover Letter</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Submitted</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse">{[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>)}</tr>)
              ) : proposals.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No proposals found</td></tr>
              ) : proposals.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    {p.freelancer ? (
                      <Link href={`/admin/users/${p.freelancer.id}`} className="hover:text-green-600">
                        <p className="font-medium text-gray-900 text-sm">{p.freelancer.full_name}</p>
                        <p className="text-xs text-gray-400">Score: {p.freelancer.hustle_score}</p>
                      </Link>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm max-w-[180px] truncate">
                    {p.job ? (
                      <Link href={`/admin/jobs/${p.job.id}`} className="hover:text-green-600 text-gray-900 font-medium">{p.job.title}</Link>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-gray-400" /> KES {p.bid_amount.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[p.status] || 'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-[200px] truncate">{p.cover_letter}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(p.submitted_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/proposals/${p.id}`} className="px-3 py-1.5 text-xs bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition">
                      View
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
