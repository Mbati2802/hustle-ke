'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  MessageSquare, Search, ChevronLeft, ChevronRight, X, Eye
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
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const limit = 30

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.set('search', search)
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
  }, [page, search])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-7 h-7 text-blue-500" /> Messages
        </h1>
        <p className="text-sm text-gray-500 mt-1">Monitor platform communications</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search messages..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500" />
          </div>
          {search && (
            <button onClick={() => { setSearch(''); setPage(1) }} className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1">
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
                <th className="text-left px-4 py-3 font-medium text-gray-500">Sender</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Receiver</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Job</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Message</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Read</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse">{[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>)}</tr>)
              ) : messages.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No messages found</td></tr>
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
