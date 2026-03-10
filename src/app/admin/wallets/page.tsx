'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Wallet, Search, ChevronLeft, ChevronRight, DollarSign,
  TrendingUp, TrendingDown, Users, Eye, Plus, Minus, X
} from 'lucide-react'

interface Wallet {
  id: string
  user_id: string
  balance: number
  created_at: string
  profile: {
    id: string
    full_name: string
    email: string
    role: string
    avatar_url?: string
  }
}

export default function AdminWalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [minBalance, setMinBalance] = useState('')
  const [maxBalance, setMaxBalance] = useState('')
  const [sortBy, setSortBy] = useState('balance_desc')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [stats, setStats] = useState({ total_wallets: 0, total_balance: 0 })
  const limit = 20

  const fetchWallets = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit), sort: sortBy })
    if (search) params.set('search', search)
    if (minBalance) params.set('min_balance', minBalance)
    if (maxBalance) params.set('max_balance', maxBalance)

    try {
      const res = await fetch(`/api/admin/wallets?${params}`)
      const data = await res.json()
      setWallets(data.wallets || [])
      setTotal(data.pagination?.total || 0)
      setHasMore(data.pagination?.hasMore || false)
      setStats(data.stats || { total_wallets: 0, total_balance: 0 })
    } catch (err) {
      console.error('Failed to fetch wallets:', err)
    }
    setLoading(false)
  }, [page, search, minBalance, maxBalance, sortBy])

  useEffect(() => { fetchWallets() }, [fetchWallets])

  const maxBal = wallets.length > 0 ? Math.max(...wallets.map(w => w.balance)) : 1

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-green-500" /> Wallets
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{total.toLocaleString()} wallets · KES {stats.total_balance.toLocaleString()} total</p>
        </div>
        <Link href="/admin/subscriptions" className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" /> Subscriptions
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Wallets', value: stats.total_wallets.toLocaleString(), icon: Users, color: 'text-blue-600', dot: 'bg-blue-500' },
          { label: 'Total Balance', value: `KES ${stats.total_balance.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', dot: 'bg-green-500' },
          { label: 'Avg Balance', value: `KES ${stats.total_wallets > 0 ? Math.round(stats.total_balance / stats.total_wallets).toLocaleString() : 0}`, icon: TrendingUp, color: 'text-amber-600', dot: 'bg-amber-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className="text-xs text-gray-500">{s.label}</span>
            </div>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
            />
          </div>
          <input
            type="number"
            placeholder="Min balance"
            value={minBalance}
            onChange={(e) => { setMinBalance(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 w-32"
          />
          <input
            type="number"
            placeholder="Max balance"
            value={maxBalance}
            onChange={(e) => { setMaxBalance(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 w-32"
          />
          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30">
            <option value="balance_desc">Highest Balance</option>
            <option value="balance_asc">Lowest Balance</option>
            <option value="newest">Newest</option>
          </select>
          {(search || minBalance || maxBalance) && (
            <button onClick={() => { setSearch(''); setMinBalance(''); setMaxBalance(''); setPage(1) }} className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1">
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
                <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Balance</th>
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
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : wallets.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No wallets found</td></tr>
              ) : (
                wallets.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                          w.profile.role === 'Freelancer' ? 'bg-green-500' : w.profile.role === 'Client' ? 'bg-blue-500' : 'bg-purple-500'
                        }`}>{(w.profile.full_name || '?').charAt(0).toUpperCase()}</div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">{w.profile.full_name}</p>
                          <p className="text-[11px] text-gray-400 truncate">{w.profile.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{w.profile.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100,(w.balance/maxBal)*100)}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-900">KES {w.balance.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-gray-400">{new Date(w.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/wallets/${w.id}`} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition font-medium">
                        <Eye className="w-3 h-3" /> View
                      </Link>
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
