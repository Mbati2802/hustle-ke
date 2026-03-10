'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Users, Briefcase, DollarSign, AlertTriangle, TrendingUp,
  ArrowUpRight, FileText, RefreshCw,
  Crown, Shield, Activity, BarChart3, Zap, Eye
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

interface Stats {
  users: { total: number; freelancers: number; clients: number }
  jobs: { total: number; open: number }
  proposals: { total: number }
  disputes: { total: number; open: number }
  escrows: { total: number }
  revenue: { service_fees: number; tax_collected: number; total: number }
  subscriptions: { pro: number }
}

interface ChartPoint {
  date: string; label?: string
  users: number; jobs: number; proposals: number; revenue: number; escrow_volume: number
}

interface PieEntry { name: string; value: number; color: string }

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

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!target) { setValue(0); return }
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return value
}

function StatCard({ label, value, numValue, icon: Icon, color, href, sub }: {
  label: string; value: string; numValue: number; icon: React.ElementType
  color: string; href?: string; sub?: string
}) {
  const animated = useCountUp(numValue)
  const inner = (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
      <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-[0.07] ${color}`} />
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">{label}</span>
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-sm shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">
        {numValue > 0 ? animated.toLocaleString() : value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 text-white text-xs px-3 py-2.5 rounded-xl shadow-2xl border border-gray-700">
      <p className="font-semibold mb-1.5 text-gray-300">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <p key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: p.color }}>{p.name}:</span>
          <span className="font-semibold">{p.value > 500 ? `KES ${p.value.toLocaleString()}` : p.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([])
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [weeklyData, setWeeklyData] = useState<ChartPoint[]>([])
  const [escrowBreakdown, setEscrowBreakdown] = useState<PieEntry[]>([])
  const [userBreakdown, setUserBreakdown] = useState<PieEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [activeChart, setActiveChart] = useState<'users' | 'jobs' | 'proposals' | 'revenue'>('users')

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const r = await fetch('/api/admin/stats')
      const data = await r.json()
      setStats(data.stats)
      setRecentUsers(data.recent_users || [])
      setRecentJobs(data.recent_jobs || [])
      setChartData(data.chart_data || [])
      setWeeklyData(data.weekly_data || [])
      setEscrowBreakdown(data.escrow_breakdown || [])
      setUserBreakdown(data.user_breakdown || [])
      setLastUpdated(new Date())
    } catch { /* */ }
    if (isRefresh) setRefreshing(false)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => {
    const t = setInterval(() => fetchData(true), 60000)
    return () => clearInterval(t)
  }, [fetchData])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="h-3 bg-gray-200 rounded w-20 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-24" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 h-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-200 h-56" />)}
        </div>
      </div>
    )
  }

  if (!stats) return <p className="text-red-500 p-4">Failed to load dashboard data.</p>

  const chartMetrics = [
    { key: 'users' as const,     label: 'New Users',    color: '#3B82F6' },
    { key: 'jobs' as const,      label: 'Jobs Posted',  color: '#22C55E' },
    { key: 'proposals' as const, label: 'Proposals',    color: '#8B5CF6' },
    { key: 'revenue' as const,   label: 'Revenue (KES)', color: '#F59E0B' },
  ]
  const activeMetric = chartMetrics.find(m => m.key === activeChart)!

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time platform overview</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Live · {lastUpdated.toLocaleTimeString()}
          </div>
          <button onClick={() => fetchData(true)} disabled={refreshing}
            className="p-2 rounded-xl hover:bg-gray-100 transition disabled:opacity-50" title="Refresh">
            <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.users.total.toLocaleString()}
          numValue={stats.users.total} icon={Users} color="bg-blue-500" href="/admin/users"
          sub={`${stats.users.freelancers ?? 0} freelancers · ${stats.users.clients ?? 0} clients`} />
        <StatCard label="Total Jobs" value={stats.jobs.total.toLocaleString()}
          numValue={stats.jobs.total} icon={Briefcase} color="bg-green-500" href="/admin/jobs"
          sub={`${stats.jobs.open} currently open`} />
        <StatCard label="Proposals" value={stats.proposals.total.toLocaleString()}
          numValue={stats.proposals.total} icon={FileText} color="bg-purple-500" href="/admin/proposals" />
        <StatCard label="Escrow Transactions" value={stats.escrows.total.toLocaleString()}
          numValue={stats.escrows.total} icon={Shield} color="bg-amber-500" href="/admin/escrow" />
        <StatCard label="Open Disputes" value={stats.disputes.open.toLocaleString()}
          numValue={stats.disputes.open} icon={AlertTriangle} color="bg-red-500" href="/admin/disputes"
          sub={`${stats.disputes.total} total`} />
        <StatCard label="Pro Subscribers" value={(stats.subscriptions?.pro ?? 0).toLocaleString()}
          numValue={stats.subscriptions?.pro ?? 0} icon={Crown} color="bg-violet-500" />
        <StatCard label="Platform Revenue" value={formatKES(stats.revenue.total)}
          numValue={0} icon={TrendingUp} color="bg-emerald-500"
          sub={`${formatKES(stats.revenue.service_fees)} fees + ${formatKES(stats.revenue.tax_collected)} tax`} />
        <StatCard label="Tax Collected" value={formatKES(stats.revenue.tax_collected)}
          numValue={0} icon={DollarSign} color="bg-teal-500" />
      </div>

      {/* 30-Day Activity Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">30-Day Platform Activity</h2>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            {chartMetrics.map(m => (
              <button key={m.key} onClick={() => setActiveChart(m.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  activeChart === m.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={activeMetric.color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={activeMetric.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} interval={4}
              tickFormatter={v => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
            <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey={activeChart} stroke={activeMetric.color}
              fill="url(#chartGrad)" strokeWidth={2.5} dot={false} name={activeMetric.label} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Weekly Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">This Week&apos;s Activity</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="users" name="Users" fill="#3B82F6" radius={[4,4,0,0]} />
              <Bar dataKey="jobs" name="Jobs" fill="#22C55E" radius={[4,4,0,0]} />
              <Bar dataKey="proposals" name="Proposals" fill="#8B5CF6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Escrow Status Pie */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Escrow Status</h2>
          </div>
          {escrowBreakdown.some(e => e.value > 0) ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={escrowBreakdown} cx="50%" cy="50%" innerRadius={42} outerRadius={68}
                    paddingAngle={3} dataKey="value">
                    {escrowBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3">
                {escrowBreakdown.filter(e => e.value > 0).map(e => (
                  <div key={e.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: e.color }} />{e.name}
                    </span>
                    <span className="font-semibold text-gray-900">{e.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-300 text-sm">No escrow data</div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* User Role Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">User Breakdown</h2>
          </div>
          {userBreakdown.some(u => u.value > 0) ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={userBreakdown} cx="50%" cy="50%" outerRadius={62} paddingAngle={4} dataKey="value">
                    {userBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5 mt-3">
                {userBreakdown.map(u => (
                  <div key={u.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: u.color }} />{u.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ background: u.color, width: `${stats.users.total > 0 ? Math.min(100, u.value / stats.users.total * 100) : 0}%` }} />
                      </div>
                      <span className="text-xs font-bold text-gray-900 w-5 text-right">{u.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-300 text-sm">No data yet</div>
          )}
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Recent Signups</h2>
            <Link href="/admin/users" className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 font-medium">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers.slice(0, 5).map(u => (
              <Link key={u.id} href={`/admin/users/${u.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition group">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                  u.role === 'Admin' ? 'bg-purple-500' : u.role === 'Client' ? 'bg-blue-500' : 'bg-green-500'
                }`}>
                  {(u.full_name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">{u.full_name || 'Unknown'}</p>
                  <p className="text-[11px] text-gray-400">{u.role} · {timeAgo(u.created_at)}</p>
                </div>
                <Eye className="w-3.5 h-3.5 text-gray-200 group-hover:text-gray-400 shrink-0 transition" />
              </Link>
            ))}
            {recentUsers.length === 0 && <p className="px-5 py-8 text-xs text-gray-400 text-center">No users yet</p>}
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Recent Jobs</h2>
            <Link href="/admin/jobs" className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 font-medium">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentJobs.slice(0, 5).map(j => (
              <Link key={j.id} href={`/admin/jobs/${j.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                  <Briefcase className="w-3.5 h-3.5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">{j.title}</p>
                  <p className="text-[11px] text-gray-400">{formatKES(j.budget_min)} · {timeAgo(j.created_at)}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColor[j.status] || 'bg-gray-100 text-gray-600'}`}>
                  {j.status}
                </span>
              </Link>
            ))}
            {recentJobs.length === 0 && <p className="px-5 py-8 text-xs text-gray-400 text-center">No jobs yet</p>}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" /> Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Manage Users',    href: '/admin/users',      icon: Users,          color: 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30 text-blue-300' },
            { label: 'Review Disputes', href: '/admin/disputes',   icon: AlertTriangle,  color: 'bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-300' },
            { label: 'Escrow Monitor',  href: '/admin/escrow',     icon: Shield,         color: 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/30 text-amber-300' },
            { label: 'Promo Codes',     href: '/admin/promo-codes', icon: TrendingUp,    color: 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/30 text-purple-300' },
          ].map(({ label, href, icon: Icon, color }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition ${color}`}>
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium text-white">{label}</span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
