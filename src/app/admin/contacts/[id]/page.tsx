'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Mail, ArrowLeft, CheckCircle2, XCircle, AlertTriangle,
  Send, Trash2, Eye, User, Calendar, Tag, MessageSquare,
  Reply, Clock, ShieldAlert, Loader2, ChevronDown
} from 'lucide-react'

interface ReplyThread {
  admin_name: string
  admin_id: string
  message: string
  sent_at: string
  subject: string
}

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  category: string
  message: string
  priority: string
  status: string
  admin_notes: string | null
  replied_at: string | null
  replies?: ReplyThread[]
  created_at: string
  updated_at: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  new:     { label: 'New',     color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',  icon: Clock },
  read:    { label: 'Read',    color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',    icon: Eye },
  replied: { label: 'Replied', color: 'text-green-700',  bg: 'bg-green-50 border-green-200',  icon: CheckCircle2 },
  closed:  { label: 'Closed',  color: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200',    icon: XCircle },
  spam:    { label: 'Spam',    color: 'text-red-700',    bg: 'bg-red-50 border-red-200',      icon: ShieldAlert },
}

const PRIORITY_CONFIG: Record<string, { label: string; dot: string }> = {
  urgent: { label: 'Urgent', dot: 'bg-red-500' },
  normal: { label: 'Normal', dot: 'bg-blue-500' },
  low:    { label: 'Low',    dot: 'bg-gray-400' },
}

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-gray-100 text-gray-700',
  support: 'bg-blue-100 text-blue-700',
  billing: 'bg-green-100 text-green-700',
  technical: 'bg-purple-100 text-purple-700',
  partnership: 'bg-amber-100 text-amber-700',
  complaint: 'bg-red-100 text-red-700',
}

function timeAgo(date: string) {
  const d = new Date(date)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return d.toLocaleDateString()
}

export default function ContactMessageDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [message, setMessage] = useState<ContactMessage | null>(null)
  const [loading, setLoading] = useState(true)
  const [adminNotes, setAdminNotes] = useState('')
  const [replyMessage, setReplyMessage] = useState('')
  const [replySubject, setReplySubject] = useState('')
  const [sending, setSending] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showReplyForm, setShowReplyForm] = useState(false)

  useEffect(() => { fetchMessage() }, [params.id])

  const fetchMessage = async () => {
    try {
      const res = await fetch(`/api/admin/contacts/${params.id}`)
      if (!res.ok) throw new Error('Not found')
      const data = await res.json()
      setMessage(data.message)
      setAdminNotes(data.message.admin_notes || '')
      setReplySubject(`Re: ${data.message.subject}`)
    } catch {
      setFeedback({ type: 'error', text: 'Failed to load message' })
    }
    setLoading(false)
  }

  const updateStatus = async (newStatus: string) => {
    try {
      await fetch(`/api/admin/contacts/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      await fetchMessage()
    } catch { /* ignore */ }
  }

  const saveNotes = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/contacts/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: adminNotes })
      })
      if (res.ok) {
        setFeedback({ type: 'success', text: 'Notes saved' })
        setTimeout(() => setFeedback(null), 3000)
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  const markAsSpam = async () => {
    if (!confirm('Mark this message as spam and archive it?')) return
    await fetch(`/api/admin/contacts/${params.id}`, { method: 'DELETE' })
    router.push('/admin/contacts')
  }

  const sendReply = async () => {
    if (!replyMessage.trim()) return
    setSending(true)
    setFeedback(null)
    try {
      const res = await fetch(`/api/admin/contacts/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply_message: replyMessage, subject: replySubject })
      })
      const data = await res.json()
      if (res.ok) {
        setFeedback({ type: 'success', text: `Reply sent and recorded. User notified at: ${data.recipient_email}` })
        setReplyMessage('')
        setShowReplyForm(false)
        await fetchMessage()
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to send reply' })
      }
    } catch {
      setFeedback({ type: 'error', text: 'Network error' })
    }
    setSending(false)
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg w-64" />
        <div className="bg-white rounded-2xl border p-8">
          <div className="h-5 bg-gray-200 rounded w-48 mb-3" />
          <div className="h-4 bg-gray-100 rounded w-full mb-2" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </div>
      </div>
    )
  }

  if (!message) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Message not found</h3>
        <p className="text-gray-500 mb-6">This message may have been deleted or moved.</p>
        <button onClick={() => router.push('/admin/contacts')} className="px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition">
          Back to Messages
        </button>
      </div>
    )
  }

  const sc = STATUS_CONFIG[message.status] || STATUS_CONFIG.new
  const pc = PRIORITY_CONFIG[message.priority] || PRIORITY_CONFIG.normal
  const StatusIcon = sc.icon

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/contacts')}
            className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contact Message</h1>
            <p className="text-xs text-gray-400 mt-0.5">#{message.id.slice(0, 8).toUpperCase()} · {timeAgo(message.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowReplyForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2 text-sm font-medium">
            <Reply className="w-4 h-4" /> Reply
          </button>
          <button onClick={markAsSpam}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition flex items-center gap-2 text-sm font-medium border border-red-200">
            <Trash2 className="w-4 h-4" /> Mark Spam
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 text-sm ${
          feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />}
          <p>{feedback.text}</p>
          <button onClick={() => setFeedback(null)} className="ml-auto shrink-0"><XCircle className="w-4 h-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Original Message Card */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Message header strip */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {message.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{message.name}</h3>
                    <a href={`mailto:${message.email}`} className="text-sm text-slate-300 hover:text-white transition">{message.email}</a>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${sc.bg} ${sc.color}`}>
                    <StatusIcon className="w-3 h-3 inline mr-1" />{sc.label}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full inline-block ${pc.dot}`} />
                    {pc.label} Priority
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              {/* Subject + meta */}
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900 mb-2">{message.subject}</h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(message.created_at).toLocaleString()}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full ${CATEGORY_COLORS[message.category] || 'bg-gray-100 text-gray-600'}`}>
                    <Tag className="w-3 h-3 inline mr-1" />{message.category}
                  </span>
                </div>
              </div>

              {/* Message body */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">{message.message}</p>
              </div>
            </div>
          </div>

          {/* Reply Thread */}
          {message.replies && message.replies.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  Reply Thread
                  <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{message.replies.length}</span>
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {message.replies.map((reply, idx) => (
                  <div key={idx} className="px-6 py-5">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {reply.admin_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900">{reply.admin_name}</span>
                          <span className="text-xs text-gray-400">{timeAgo(reply.sent_at)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">Subject: {reply.subject}</p>
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reply Compose Form */}
          {showReplyForm && (
            <div className="bg-white rounded-2xl border-2 border-blue-300 shadow-lg overflow-hidden">
              <div className="bg-blue-600 px-6 py-3 flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Send className="w-4 h-4" /> Compose Reply
                </h3>
                <button onClick={() => setShowReplyForm(false)} className="text-white/70 hover:text-white">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-sm text-blue-800 font-medium">To: {message.email}</span>
                  <span className="text-xs text-blue-500 ml-auto">{message.name}</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Subject</label>
                  <input
                    type="text"
                    value={replySubject}
                    onChange={e => setReplySubject(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Message</label>
                  <textarea
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    placeholder={`Dear ${message.name},\n\nThank you for reaching out to us...`}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 min-h-[180px] resize-none"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Reply is saved in system. Notify user via email externally.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setShowReplyForm(false)}
                      className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition">
                      Cancel
                    </button>
                    <button onClick={sendReply} disabled={sending || !replyMessage.trim()}
                      className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2 font-medium">
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {sending ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Notes */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide text-gray-500">Internal Notes</h3>
              <p className="text-xs text-gray-400 mt-0.5">These notes are only visible to admins</p>
            </div>
            <div className="p-6">
              <textarea
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                placeholder="Add private notes, escalation details, follow-up actions..."
                className="w-full px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/50 min-h-[100px] resize-none text-gray-700 placeholder:text-amber-300"
              />
              <div className="flex justify-end mt-3">
                <button onClick={saveNotes} disabled={saving}
                  className="px-4 py-2 text-sm bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Status Actions */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-700 text-sm">Update Status</h3>
            </div>
            <div className="p-4 space-y-2">
              {[
                { s: 'read',    label: 'Mark as Read',    cls: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',   icon: Eye },
                { s: 'replied', label: 'Mark as Replied', cls: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200', icon: CheckCircle2 },
                { s: 'closed',  label: 'Close Message',   cls: 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200',   icon: XCircle },
              ].map(({ s, label, cls, icon: Icon }) => (
                <button key={s} onClick={() => updateStatus(s)}
                  disabled={message.status === s}
                  className={`w-full px-4 py-2.5 text-sm rounded-xl border transition disabled:opacity-40 flex items-center gap-2 font-medium ${cls}`}>
                  <Icon className="w-4 h-4" /> {label}
                  {message.status === s && <span className="ml-auto text-xs opacity-60">Current</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-700 text-sm">Contact Details</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0">
                  {message.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{message.name}</p>
                  <a href={`mailto:${message.email}`} className="text-xs text-blue-600 hover:underline">{message.email}</a>
                </div>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-500">Category</span>
                  <span className={`px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[message.category] || 'bg-gray-100 text-gray-600'}`}>{message.category}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-500">Priority</span>
                  <span className="flex items-center gap-1.5 font-medium text-gray-700">
                    <span className={`w-2 h-2 rounded-full ${pc.dot}`} />{pc.label}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-500">Received</span>
                  <span className="text-gray-700 font-medium">{new Date(message.created_at).toLocaleDateString()}</span>
                </div>
                {message.replied_at && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-500">Replied</span>
                    <span className="text-green-700 font-medium">{timeAgo(message.replied_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Reply Button (if not showing form) */}
          {!showReplyForm && (
            <button onClick={() => setShowReplyForm(true)}
              className="w-full py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition font-semibold text-sm flex items-center justify-center gap-2 shadow-sm">
              <Reply className="w-4 h-4" /> Compose Reply
            </button>
          )}

          {/* Reply count info */}
          {message.replies && message.replies.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm">
              <div className="flex items-center gap-2 text-green-700 font-semibold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                {message.replies.length} {message.replies.length === 1 ? 'Reply' : 'Replies'} Sent
              </div>
              <p className="text-green-600 text-xs">Last reply: {timeAgo(message.replies[message.replies.length - 1]?.sent_at)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
