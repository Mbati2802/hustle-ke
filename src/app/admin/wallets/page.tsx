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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="w-7 h-7 text-green-500" /> Wallet Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">{total.toLocaleString()} total wallets</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Wallets</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_wallets.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">KES {stats.total_balance.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Average Balance</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                KES {stats.total_wallets > 0 ? Math.round(stats.total_balance / stats.total_wallets).toLocaleString() : 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
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
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-xs font-bold shrink-0">
                          {w.profile.full_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{w.profile.full_name}</p>
                          <p className="text-xs text-gray-500 truncate">{w.profile.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{w.profile.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-green-500" />
                        <span className="font-semibold text-gray-900">KES {w.balance.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(w.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/wallets/${w.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition">
                        <Eye className="w-3.5 h-3.5" /> View
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
