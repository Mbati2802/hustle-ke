'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Mail, Search, ChevronLeft, ChevronRight, Eye, X,
  CheckCircle2, XCircle, Clock, AlertTriangle
} from 'lucide-react'

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: string
  created_at: string
}

export default function AdminContactsPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [stats, setStats] = useState({ total: 0, new: 0, read: 0, replied: 0, spam: 0 })
  const limit = 20

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit), sort: sortBy })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)

    try {
      const res = await fetch(`/api/admin/contacts?${params}`)
      const data = await res.json()
      setMessages(data.messages || [])
      setTotal(data.pagination?.total || 0)
      setHasMore(data.pagination?.hasMore || false)
      setStats(data.stats || { total: 0, new: 0, read: 0, replied: 0, spam: 0 })
    } catch (err) {
      console.error('Failed to fetch contact messages:', err)
    }
    setLoading(false)
  }, [page, search, statusFilter, sortBy])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case 'read': return <Eye className="w-4 h-4 text-blue-500" />
      case 'replied': return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'spam': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const contactStatCards = [
    { label: 'New', value: stats.new, dot: 'bg-amber-500', text: 'text-amber-600', filter: 'new' },
    { label: 'Read', value: stats.read, dot: 'bg-blue-500', text: 'text-blue-600', filter: 'read' },
    { label: 'Replied', value: stats.replied, dot: 'bg-green-500', text: 'text-green-600', filter: 'replied' },
    { label: 'Spam', value: stats.spam, dot: 'bg-red-500', text: 'text-red-600', filter: 'spam' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-500" /> Contacts
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{stats.new} unread · {total.toLocaleString()} total</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {contactStatCards.map(s => (
          <button key={s.label}
            onClick={() => { setStatusFilter(statusFilter === s.filter ? '' : s.filter); setPage(1) }}
            className={`text-left bg-white rounded-xl border p-3 hover:shadow-sm transition-all ${
              statusFilter === s.filter ? 'ring-1 ring-blue-200 border-blue-200' : 'border-gray-200'
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
              placeholder="Search messages..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="spam">Spam</option>
          </select>
          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
          {(search || statusFilter) && (
            <button onClick={() => { setSearch(''); setStatusFilter(''); setPage(1) }} className="text-sm text-gray-500 hover:text-blue-500 flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">From</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Subject</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-48" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : messages.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No contact messages found</td></tr>
              ) : (
                messages.map((msg) => (
                  <tr key={msg.id} className={`hover:bg-gray-50 transition ${msg.status === 'new' ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{msg.name}</p>
                        <p className="text-xs text-gray-500">{msg.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900 truncate max-w-xs">{msg.subject}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(msg.status)}
                        <span className="text-xs capitalize">{msg.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(msg.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/contacts/${msg.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition">
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
