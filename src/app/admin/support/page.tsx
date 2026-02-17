'use client'

import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import {
  LifeBuoy,
  Search,
  ChevronLeft,
  ChevronRight,
  Inbox,
  User,
  Clock,
  CheckCircle2,
} from 'lucide-react'

interface Ticket {
  id: string
  subject: string
  category: string
  sub_category: string
  urgency: 'low' | 'medium' | 'high'
  status: 'Open' | 'Pending' | 'Resolved' | 'Closed'
  assigned_admin_id?: string | null
  assigned_to?: string | null
  created_at: string
  updated_at: string
  last_message_at: string
  user?: { id: string; full_name: string; email: string; avatar_url?: string }
  assigned_admin?: { id: string; full_name: string; email: string; avatar_url?: string }
}

interface SupportMessage {
  id: string
  ticket_id: string
  sender_type: 'user' | 'admin' | 'system'
  message: string
  created_at: string
  sender_name?: string
  sender?: { id: string; full_name: string; avatar_url?: string } | null
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const statusBadge: Record<string, string> = {
  Open: 'bg-green-100 text-green-700',
  Pending: 'bg-blue-100 text-blue-700',
  Resolved: 'bg-gray-100 text-gray-700',
  Closed: 'bg-red-100 text-red-700',
}

const urgencyBadge: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [assigned, setAssigned] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const limit = 20

  const [activeTicketId, setActiveTicketId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [msgLoading, setMsgLoading] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [adminUsers, setAdminUsers] = useState<Array<{id: string; full_name: string; email: string}>>([])
  const [selectedAssignee, setSelectedAssignee] = useState<string>('')
  const [showAssignDropdown, setShowAssignDropdown] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (status) params.set('status', status)
    if (assigned) params.set('assigned', assigned)
    try {
      const res = await fetch(`/api/admin/support/tickets?${params}`)
      const data = await res.json()
      setTickets(data.tickets || [])
      setTotal(data.pagination?.total || 0)
      setHasMore(data.pagination?.hasMore || false)
    } catch {
      setTickets([])
    }
    setLoading(false)
  }, [page, status, assigned])

  const filteredTickets = useMemo(() => {
    if (!search.trim()) return tickets
    const s = search.trim().toLowerCase()
    return tickets.filter(t =>
      t.subject?.toLowerCase().includes(s)
      || t.user?.full_name?.toLowerCase().includes(s)
      || t.user?.email?.toLowerCase().includes(s)
      || t.category?.toLowerCase().includes(s)
      || t.sub_category?.toLowerCase().includes(s)
    )
  }, [tickets, search])

  const fetchMessages = useCallback(async (ticketId: string) => {
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}/messages?limit=200`)
      const data = await res.json()
      const newMessages = data.messages || []
      
      // Only update if messages have actually changed (compare count and IDs)
      setMessages(prev => {
        // If count is different, definitely update
        if (prev.length !== newMessages.length) return newMessages
        
        // If count is same, check if all IDs match
        const prevIds = prev.map(m => m.id).join(',')
        const newIds = newMessages.map((m: any) => m.id).join(',')
        if (prevIds !== newIds) return newMessages
        
        // No changes detected
        return prev
      })
    } catch {
      // Don't clear messages on error, keep existing ones
    }
  }, [])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  useEffect(() => {
    // Fetch admin users for assignment dropdown
    fetch('/api/admin/users/simple')
      .then(res => res.json())
      .then(data => setAdminUsers(data.admins || []))
      .catch(() => setAdminUsers([]))
  }, [])

  useEffect(() => {
    if (!activeTicketId) return
    fetchMessages(activeTicketId)
    // Poll for new messages every 1.5 seconds for faster real-time updates
    const interval = setInterval(() => {
      fetchMessages(activeTicketId)
    }, 1500)
    return () => clearInterval(interval)
  }, [activeTicketId, fetchMessages])

  const activeTicket = useMemo(() => tickets.find(t => t.id === activeTicketId) || null, [tickets, activeTicketId])

  const handleAssign = async (assigneeId?: string) => {
    if (!activeTicketId) return
    setAssigning(true)
    try {
      await fetch(`/api/admin/support/tickets?id=${activeTicketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'assign',
          assigned_admin_id: assigneeId || undefined
        }),
      })
      setShowAssignDropdown(false)
      setSelectedAssignee('')
      fetchTickets()
    } finally {
      setAssigning(false)
    }
  }

  const handleResolve = async () => {
    if (!activeTicketId) return
    const res = await fetch(`/api/admin/support/tickets?id=${activeTicketId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resolve' }),
    })
    if (res.ok) {
      // Update ticket status locally without clearing messages
      setTickets(prev => prev.map(t => 
        t.id === activeTicketId ? { ...t, status: 'Resolved' as const } : t
      ))
    }
  }

  const handleClose = async () => {
    if (!activeTicketId) return
    const res = await fetch(`/api/admin/support/tickets?id=${activeTicketId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'close' }),
    })
    if (res.ok) {
      // Update ticket status locally without clearing messages
      setTickets(prev => prev.map(t => 
        t.id === activeTicketId ? { ...t, status: 'Closed' as const } : t
      ))
    }
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeTicketId || !reply.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/support/tickets/${activeTicketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply.trim() }),
      })
      if (res.ok) {
        setReply('')
        // Fetch messages immediately to show the new message
        await fetchMessages(activeTicketId)
        // Don't call fetchTickets() here as it causes the page to reload and clear messages
      }
    } catch {
      // ignore
    }
    setSending(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <LifeBuoy className="w-7 h-7 text-indigo-600" /> Support Inbox
        </h1>
        <p className="text-sm text-gray-500 mt-1">Handle Live Chat escalations and support tickets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Ticket list */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tickets..."
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                <option value="">All status</option>
                <option value="Open">Open</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
              <select value={assigned} onChange={(e) => { setAssigned(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                <option value="">All</option>
                <option value="me">Assigned to me</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-gray-100 max-h-[640px] overflow-y-auto">
            {loading ? (
              <div className="p-6 text-sm text-gray-500">Loading tickets...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">
                <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                No tickets found.
              </div>
            ) : (
              filteredTickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTicketId(t.id)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition ${activeTicketId === t.id ? 'bg-indigo-50/60' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{t.subject}</p>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${urgencyBadge[t.urgency] || urgencyBadge.low}`}>{t.urgency}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{t.user?.full_name || 'User'} • {t.user?.email || ''}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${statusBadge[t.status] || 'bg-gray-100 text-gray-700'}`}>{t.status}</span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(t.last_message_at)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}</p>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-gray-700 px-2">Page {page}</span>
              <button disabled={!hasMore} onClick={() => setPage(p => p + 1)} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Thread */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col min-h-[680px]">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">{activeTicket ? activeTicket.subject : 'Select a ticket'}</p>
              {activeTicket && (
                <p className="text-xs text-gray-500 mt-0.5">{activeTicket.category} / {activeTicket.sub_category}</p>
              )}
            </div>
            {activeTicket && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button 
                    onClick={() => setShowAssignDropdown(!showAssignDropdown)} 
                    disabled={assigning}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    {assigning ? 'Assigning...' : activeTicket.assigned_to ? 'Reassign' : 'Assign'}
                  </button>
                  {showAssignDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]">
                      <div className="p-2 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-700">Assign to:</p>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        <button
                          onClick={() => handleAssign()}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                        >
                          <div className="font-medium text-gray-900">Assign to me</div>
                        </button>
                        {adminUsers.map(admin => (
                          <button
                            key={admin.id}
                            onClick={() => handleAssign(admin.id)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-t border-gray-50"
                          >
                            <div className="font-medium text-gray-900">{admin.full_name}</div>
                            <div className="text-xs text-gray-500">{admin.email}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={handleResolve} className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Resolve
                </button>
                <button onClick={handleClose} className="px-3 py-2 rounded-lg border border-red-200 text-red-700 text-sm hover:bg-red-50">Close</button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {!activeTicket ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">Choose a ticket to view messages.</div>
            ) : msgLoading ? (
              <div className="text-sm text-gray-500">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-sm text-gray-500">No messages yet.</div>
            ) : (
              <div className="space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${
                      m.sender_type === 'admin'
                        ? 'bg-indigo-600 text-white'
                        : m.sender_type === 'system'
                        ? 'bg-gray-200 text-gray-800'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}>
                      {m.message}
                      <div className={`mt-1 text-[11px] ${m.sender_type === 'admin' ? 'text-indigo-100' : 'text-gray-400'}`}>{new Date(m.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {activeTicket && activeTicket.status !== 'Closed' && (
            <form onSubmit={handleSendReply} className="p-4 border-t border-gray-100 flex gap-2">
              <input
                value={reply}
                onChange={(e) => {
                  setReply(e.target.value)
                  // Send typing status
                  if (activeTicketId) {
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
                    fetch('/api/support/typing', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ticket_id: activeTicketId, is_typing: true })
                    }).catch(() => {})
                    typingTimeoutRef.current = setTimeout(() => {
                      fetch('/api/support/typing', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ticket_id: activeTicketId, is_typing: false })
                      }).catch(() => {})
                    }, 3000)
                  }
                }}
                placeholder="Type a reply..."
                className="flex-1 px-4 py-3 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500/30 text-sm"
              />
              <button
                type="submit"
                disabled={!reply.trim() || sending}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
