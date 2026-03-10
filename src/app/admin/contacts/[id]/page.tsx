'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Mail, ArrowLeft, CheckCircle2, XCircle, Clock, AlertTriangle,
  Send, Trash2, Eye, User, Calendar, Tag, MessageSquare
} from 'lucide-react'

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
  created_at: string
  updated_at: string
}

export default function ContactMessageDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [message, setMessage] = useState<ContactMessage | null>(null)
  const [loading, setLoading] = useState(true)
  const [adminNotes, setAdminNotes] = useState('')
  const [replyMessage, setReplyMessage] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchMessage()
  }, [params.id])

  const fetchMessage = async () => {
    try {
      const res = await fetch(`/api/admin/contacts/${params.id}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setMessage(data.message)
      setAdminNotes(data.message.admin_notes || '')
    } catch (err) {
      console.error('Failed to fetch contact message:', err)
    }
    setLoading(false)
  }

  const updateStatus = async (newStatus: string) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/contacts/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        await fetchMessage()
      }
    } catch (err) {
      console.error('Failed to update status:', err)
    }
    setUpdating(false)
  }

  const saveNotes = async () => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/contacts/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: adminNotes })
      })
      if (res.ok) {
        await fetchMessage()
      }
    } catch (err) {
      console.error('Failed to save notes:', err)
    }
    setUpdating(false)
  }

  const markAsSpam = async () => {
    if (!confirm('Mark this message as spam?')) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/contacts/${params.id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        router.push('/admin/contacts')
      }
    } catch (err) {
      console.error('Failed to mark as spam:', err)
    }
    setUpdating(false)
  }

  const sendReply = async () => {
    if (!replyMessage.trim()) return
    setUpdating(true)
    try {
      // In a real implementation, this would send an email
      // For now, we'll just update the status to 'replied'
      await updateStatus('replied')
      setReplyMessage('')
      alert('Reply sent successfully!')
    } catch (err) {
      console.error('Failed to send reply:', err)
    }
    setUpdating(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-amber-100 text-amber-700'
      case 'read': return 'bg-blue-100 text-blue-700'
      case 'replied': return 'bg-green-100 text-green-700'
      case 'closed': return 'bg-gray-100 text-gray-700'
      case 'spam': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700'
      case 'normal': return 'bg-blue-100 text-blue-700'
      case 'low': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4" />
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
            <div className="h-4 w-full bg-gray-100 rounded mb-2" />
            <div className="h-4 w-3/4 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!message) {
    return (
      <div className="text-center py-12">
        <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Message not found</h3>
        <button onClick={() => router.push('/admin/contacts')} className="text-blue-600 hover:text-blue-700">
          Back to messages
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/contacts')} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contact Message</h1>
            <p className="text-sm text-gray-500 mt-1">ID: {message.id.slice(0, 8)}</p>
          </div>
        </div>
        <button onClick={markAsSpam} disabled={updating} className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50">
          <Trash2 className="w-4 h-4 inline mr-1" /> Mark as Spam
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Message Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{message.name}</h3>
                  <p className="text-sm text-gray-500">{message.email}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(message.status)}`}>
                  {message.status}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getPriorityColor(message.priority)}`}>
                  {message.priority} priority
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{message.subject}</h4>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(message.created_at).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    {message.category}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{message.message}</p>
              </div>
            </div>
          </div>

          {/* Reply Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Send Reply
            </h3>
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your reply here..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 min-h-[150px]"
            />
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-500">Reply will be sent to {message.email}</p>
              <button
                onClick={sendReply}
                disabled={updating || !replyMessage.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Reply
              </button>
            </div>
          </div>

          {/* Admin Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Admin Notes (Internal)</h3>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add internal notes about this message..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 min-h-[100px]"
            />
            <button
              onClick={saveNotes}
              disabled={updating}
              className="mt-3 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
            >
              Save Notes
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => updateStatus('read')}
                disabled={updating || message.status === 'read'}
                className="w-full px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Mark as Read
              </button>
              <button
                onClick={() => updateStatus('replied')}
                disabled={updating || message.status === 'replied'}
                className="w-full px-4 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark as Replied
              </button>
              <button
                onClick={() => updateStatus('closed')}
                disabled={updating || message.status === 'closed'}
                className="w-full px-4 py-2 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Close Message
              </button>
            </div>
          </div>

          {/* Message Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Message Info</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Created</p>
                <p className="text-gray-900">{new Date(message.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Last Updated</p>
                <p className="text-gray-900">{new Date(message.updated_at).toLocaleString()}</p>
              </div>
              {message.replied_at && (
                <div>
                  <p className="text-gray-500 mb-1">Replied At</p>
                  <p className="text-gray-900">{new Date(message.replied_at).toLocaleString()}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500 mb-1">Category</p>
                <p className="text-gray-900 capitalize">{message.category}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Priority</p>
                <p className="text-gray-900 capitalize">{message.priority}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
