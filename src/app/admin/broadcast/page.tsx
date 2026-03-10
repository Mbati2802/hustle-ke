'use client'

import { useState, useEffect } from 'react'
import {
  Radio, Users, Send, Loader2, CheckCircle2, XCircle, X,
  AlertCircle, Info, AlertTriangle, CheckCircle
} from 'lucide-react'

interface BroadcastHistory {
  id: string
  created_at: string
  details: {
    title: string
    target_audience: string
    recipient_count: number
  }
}

export default function AdminBroadcastPage() {
  const [history, setHistory] = useState<BroadcastHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    target_audience: 'all' as 'all' | 'freelancers' | 'clients' | 'pro_users',
    link: ''
  })

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/broadcast')
      const data = await res.json()
      setHistory(data.broadcasts || [])
    } catch (err) {
      console.error('Failed to fetch broadcast history:', err)
    }
    setLoading(false)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ 
          type: 'success', 
          text: `Broadcast sent successfully to ${data.recipient_count} users!` 
        })
        setFormData({
          title: '',
          message: '',
          type: 'info',
          target_audience: 'all',
          link: ''
        })
        fetchHistory()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send broadcast' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    }

    setSending(false)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />
      default: return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Radio className="w-7 h-7 text-purple-500" /> Broadcast Notifications
          </h1>
          <p className="text-sm text-gray-500 mt-1">Send notifications to user segments</p>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Broadcast Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Send New Broadcast</h2>
        <form onSubmit={handleSend} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notification Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(p => ({ ...p, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <select
                value={formData.target_audience}
                onChange={(e) => setFormData(p => ({ ...p, target_audience: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              >
                <option value="all">All Users</option>
                <option value="freelancers">Freelancers Only</option>
                <option value="clients">Clients Only</option>
                <option value="pro_users">Pro Users Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              placeholder="Notification title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <textarea
              required
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              placeholder="Notification message..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link (optional)</label>
            <input
              type="text"
              value={formData.link}
              onChange={(e) => setFormData(p => ({ ...p, link: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              placeholder="/dashboard or https://..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setFormData({ title: '', message: '', type: 'info', target_audience: 'all', link: '' })}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Send Broadcast
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Broadcast History */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Broadcast History</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse p-4 border border-gray-100 rounded-lg">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <p className="text-center py-8 text-gray-400">No broadcasts sent yet</p>
        ) : (
          <div className="space-y-3">
            {history.map((broadcast) => (
              <div key={broadcast.id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-purple-500" />
                      <h3 className="font-medium text-gray-900">{broadcast.details.title}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {broadcast.details.recipient_count} recipients
                      </span>
                      <span className="capitalize">{broadcast.details.target_audience.replace('_', ' ')}</span>
                      <span>{new Date(broadcast.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
