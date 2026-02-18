'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import {
  Bell,
  MessageSquare,
  Briefcase,
  CheckCircle2,
  XCircle,
  FileCheck,
  RotateCcw,
  Crown,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Loader2,
  BellOff,
  Settings,
  Shield,
  Wallet,
  AlertTriangle,
  DollarSign,
  Zap,
} from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string
  read: boolean
  created_at: string
}

const typeIcons: Record<string, typeof MessageSquare> = {
  message: MessageSquare,
  hire: CheckCircle2,
  rejection: XCircle,
  proposal: Briefcase,
  submission: FileCheck,
  revision: RotateCcw,
  subscription: Crown,
  escrow: Shield,
  payment: Wallet,
  dispute: AlertTriangle,
  earning: DollarSign,
  system: Zap,
}

const typeColors: Record<string, string> = {
  message: 'bg-green-100 text-green-600',
  hire: 'bg-emerald-100 text-emerald-600',
  rejection: 'bg-red-100 text-red-600',
  proposal: 'bg-blue-100 text-blue-600',
  submission: 'bg-amber-100 text-amber-600',
  revision: 'bg-orange-100 text-orange-600',
  subscription: 'bg-amber-100 text-amber-700',
  escrow: 'bg-indigo-100 text-indigo-600',
  payment: 'bg-green-100 text-green-700',
  dispute: 'bg-red-100 text-red-600',
  earning: 'bg-emerald-100 text-emerald-600',
  system: 'bg-gray-100 text-gray-600',
}

const typeLabels: Record<string, string> = {
  message: 'Messages',
  hire: 'Hired',
  rejection: 'Rejections',
  proposal: 'Proposals',
  submission: 'Submissions',
  revision: 'Revisions',
  subscription: 'Subscription',
  escrow: 'Escrow',
  payment: 'Payments',
  dispute: 'Disputes',
  earning: 'Earnings',
  system: 'System',
}

export default function NotificationsPage() {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      if (data.notifications) {
        setNotifications(data.notifications)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAsRead = async (ids: string[]) => {
    setActionLoading(true)
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n))
      setSelectedIds(new Set())
    } catch {
      // silently fail
    } finally {
      setActionLoading(false)
    }
  }

  const markAllRead = async () => {
    setActionLoading(true)
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setSelectedIds(new Set())
    } catch {
      // silently fail
    } finally {
      setActionLoading(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredNotifications.map(n => n.id)))
    }
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })
  }

  // Get unique notification types for filter tabs
  const uniqueTypes = Array.from(new Set(notifications.map(n => n.type)))

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read
    if (filter !== 'all') return n.type === filter
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <div className="p-4 lg:p-6 xl:p-8">
        <div className="animate-pulse">
          <div className="h-7 w-40 bg-gray-200 rounded-lg mb-2" />
          <div className="h-4 w-56 bg-gray-100 rounded mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-64 bg-gray-100 rounded" />
                </div>
                <div className="h-3 w-12 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 xl:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'} · {notifications.length} total
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={actionLoading}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
              Mark All Read
            </button>
          )}
          <Link
            href="/dashboard/settings?tab=notifications"
            className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <Settings className="w-4 h-4" /> Preferences
          </Link>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto scrollbar-hide pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`shrink-0 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`shrink-0 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'unread' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Unread ({unreadCount})
        </button>
        {uniqueTypes.map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`shrink-0 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === type ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {typeLabels[type] || type} ({notifications.filter(n => n.type === type).length})
          </button>
        ))}
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-sm text-green-700 font-medium">{selectedIds.size} selected</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => markAsRead(Array.from(selectedIds))}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              <Check className="w-3.5 h-3.5" /> Mark Read
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Notifications list */}
      {filteredNotifications.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Select all header */}
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
            <button
              onClick={selectAll}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                selectedIds.size === filteredNotifications.length && filteredNotifications.length > 0
                  ? 'bg-green-600 border-green-600'
                  : 'border-gray-300 hover:border-green-400'
              }`}
            >
              {selectedIds.size === filteredNotifications.length && filteredNotifications.length > 0 && (
                <Check className="w-3 h-3 text-white" />
              )}
            </button>
            <span className="text-xs text-gray-500 font-medium">
              {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Notification items */}
          <div className="divide-y divide-gray-50">
            {filteredNotifications.map((n) => {
              const Icon = typeIcons[n.type] || Bell
              const color = typeColors[n.type] || 'bg-gray-100 text-gray-600'
              const isSelected = selectedIds.has(n.id)

              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50/50 ${
                    !n.read ? 'bg-green-50/30' : ''
                  } ${isSelected ? 'bg-green-50/50' : ''}`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleSelect(n.id)}
                    className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'bg-green-600 border-green-600' : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </button>

                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'} truncate`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">{timeAgo(n.created_at)}</span>
                        {!n.read && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                      </div>
                    </div>

                    {/* Action row */}
                    <div className="flex items-center gap-3 mt-2">
                      {n.link && (
                        <Link
                          href={n.link}
                          className="text-xs text-green-600 hover:text-green-700 font-medium"
                        >
                          View →
                        </Link>
                      )}
                      {!n.read && (
                        <button
                          onClick={() => markAsRead([n.id])}
                          className="text-xs text-gray-400 hover:text-green-600 font-medium"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BellOff className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">
            {filter === 'unread' ? 'No unread notifications' : filter !== 'all' ? `No ${typeLabels[filter] || filter} notifications` : 'No notifications yet'}
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            {filter === 'all'
              ? "When you receive messages, proposals, or updates, they'll appear here."
              : 'Try a different filter to see other notifications.'}
          </p>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              View all notifications
            </button>
          )}
        </div>
      )}
    </div>
  )
}
