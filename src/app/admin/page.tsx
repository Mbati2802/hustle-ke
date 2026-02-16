'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users, Briefcase, DollarSign, AlertTriangle, TrendingUp,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, FileText, Eye
} from 'lucide-react'

interface Stats {
  users: { total: number }
  jobs: { total: number; open: number }
  proposals: { total: number }
  disputes: { total: number; open: number }
  escrows: { total: number }
  revenue: { service_fees: number; tax_collected: number; total: number }
}

interface RecentUser {
  id: string; full_name: string; email: string; role: string; created_at: string
}

interface RecentJob {
  id: string; title: string; status: string; created_at: string; budget_min: number; budget_max: number
}

function formatKES(amount: number) {
  return `KES ${amount.toLocaleString()}`
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

const statusColor: Record<string, string> = {
  Open: 'bg-green-100 text-green-700',
  'In-Progress': 'bg-blue-100 text-blue-700',
  Completed: 'bg-gray-100 text-gray-700',
  Disputed: 'bg-red-100 text-red-700',
  Cancelled: 'bg-yellow-100 text-yellow-700',
  Draft: 'bg-gray-100 text-gray-500',
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => {
        setStats(data.stats)
        setRecentUsers(data.recent_users || [])
        setRecentJobs(data.recent_jobs || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) return <p className="text-red-500">Failed to load dashboard data.</p>

  const cards = [
    { label: 'Total Users', value: stats.users.total, icon: Users, color: 'bg-blue-500', href: '/admin/users' },
    { label: 'Total Jobs', value: stats.jobs.total, icon: Briefcase, color: 'bg-green-500', href: '/admin/jobs', sub: `${stats.jobs.open} open` },
    { label: 'Total Proposals', value: stats.proposals.total, icon: FileText, color: 'bg-purple-500', href: '/admin/proposals' },
    { label: 'Total Escrows', value: stats.escrows.total, icon: DollarSign, color: 'bg-amber-500', href: '/admin/escrow' },
    { label: 'Open Disputes', value: stats.disputes.open, icon: AlertTriangle, color: 'bg-red-500', href: '/admin/disputes', sub: `${stats.disputes.total} total` },
    { label: 'Service Fees', value: formatKES(stats.revenue.service_fees), icon: TrendingUp, color: 'bg-emerald-500', isText: true },
    { label: 'Tax Collected', value: formatKES(stats.revenue.tax_collected), icon: DollarSign, color: 'bg-teal-500', isText: true },
    { label: 'Total Revenue', value: formatKES(stats.revenue.total), icon: CheckCircle2, color: 'bg-green-600', isText: true },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your platform</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          const inner = (
            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">{card.label}</span>
                <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {card.isText ? card.value : (card.value as number).toLocaleString()}
              </p>
              {card.sub && <p className="text-xs text-gray-400 mt-1">{card.sub}</p>}
            </div>
          )
          return card.href ? <Link key={card.label} href={card.href}>{inner}</Link> : <div key={card.label}>{inner}</div>
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Users</h2>
            <Link href="/admin/users" className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers.slice(0, 6).map((u) => (
              <Link key={u.id} href={`/admin/users/${u.id}`} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition">
                <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-sm font-bold shrink-0">
                  {u.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'Admin' ? 'bg-purple-100 text-purple-700' : u.role === 'Client' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {u.role}
                  </span>
                  <p className="text-[11px] text-gray-400 mt-1">{timeAgo(u.created_at)}</p>
                </div>
              </Link>
            ))}
            {recentUsers.length === 0 && <p className="p-4 text-sm text-gray-400 text-center">No users yet</p>}
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Jobs</h2>
            <Link href="/admin/jobs" className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentJobs.slice(0, 6).map((j) => (
              <Link key={j.id} href={`/admin/jobs/${j.id}`} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition">
                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{j.title}</p>
                  <p className="text-xs text-gray-500">KES {j.budget_min.toLocaleString()} – {j.budget_max.toLocaleString()}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[j.status] || 'bg-gray-100 text-gray-600'}`}>
                    {j.status}
                  </span>
                  <p className="text-[11px] text-gray-400 mt-1">{timeAgo(j.created_at)}</p>
                </div>
              </Link>
            ))}
            {recentJobs.length === 0 && <p className="p-4 text-sm text-gray-400 text-center">No jobs yet</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
