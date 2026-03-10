'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  MessageSquare, Search, ChevronLeft, ChevronRight, X
} from 'lucide-react'

interface Message {
  id: string; content: string; is_read: boolean; created_at: string; job_id: string
  sender?: { id: string; full_name: string; email: string }
  receiver?: { id: string; full_name: string; email: string }
  job?: { id: string; title: string }
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [readFilter, setReadFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const limit = 30

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.set('search', search)
    if (readFilter) params.set('is_read', readFilter)
    try {
      const res = await fetch(`/api/admin/messages?${params}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        setTotal(data.pagination?.total || 0)
        setHasMore(data.pagination?.hasMore || false)
      }
    } catch { /* */ }
    setLoading(false)
  }, [page, search, readFilter])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  const unread = messages.filter(m => !m.is_read).length
  const read = messages.filter(m => m.is_read).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" /> Messages
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{total.toLocaleString()} total · {unread} unread on this page</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: total, dot: 'bg-blue-500', text: 'text-blue-600', filter: '' },
          { label: 'Read', value: read, dot: 'bg-green-500', text: 'text-green-600', filter: 'true' },
          { label: 'Unread', value: unread, dot: 'bg-gray-400', text: 'text-gray-600', filter: 'false' },
        ].map(s => (
          <button key={s.label}
            onClick={() => { setReadFilter(readFilter === s.filter && s.filter !== '' ? '' : s.filter); setPage(1) }}
            className={`text-left bg-white rounded-xl border p-3 hover:shadow-sm transition-all ${
              readFilter === s.filter && s.filter !== '' ? 'ring-1 ring-blue-200 border-blue-200' : 'border-gray-200'
            }`}>
            <div className="flex items-center gap-1.5 mb-1"><div className={`w-2 h-2 rounded-full ${s.dot}`} /><span className="text-xs text-gray-500">{s.label}</span></div>
            <p className={`text-xl font-bold ${s.text}`}>{s.value.toLocaleString()}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" placeholder="Search messages..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          {search && (
            <button onClick={() => { setSearch(''); setPage(1) }} className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Sender</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Receiver</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Job</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Message</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Read</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse">{[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>)}</tr>)
              ) : messages.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No messages found</td></tr>
              ) : messages.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-xs">
                    {m.sender ? <Link href={`/admin/users/${m.sender.id}`} className="text-gray-900 font-medium hover:text-green-600">{m.sender.full_name}</Link> : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {m.receiver ? <Link href={`/admin/users/${m.receiver.id}`} className="text-gray-900 font-medium hover:text-green-600">{m.receiver.full_name}</Link> : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs max-w-[140px] truncate">
                    {m.job ? <Link href={`/admin/jobs/${m.job.id}`} className="text-gray-600 hover:text-green-600">{m.job.title}</Link> : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-[280px] truncate">{m.content}</td>
                  <td className="px-4 py-3">
                    <span className={`w-2 h-2 rounded-full inline-block ${m.is_read ? 'bg-green-400' : 'bg-gray-300'}`} title={m.is_read ? 'Read' : 'Unread'} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(m.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/jobs/${m.job_id}`} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition">
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
