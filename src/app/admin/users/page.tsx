'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Users, Search, ChevronLeft, ChevronRight,
  Shield, ShieldCheck, Star, MoreVertical, Eye, Pencil, Trash2, X,
  Plus, Loader2, CheckCircle2, XCircle, Clock, Key, LogOut
} from 'lucide-react'

interface User {
  id: string
  full_name: string
  email: string
  role: string
  verification_status: string
  hustle_score: number
  total_earned: number
  jobs_completed: number
  jobs_posted: number
  created_at: string
  avatar_url?: string
}

const roleColors: Record<string, string> = {
  Admin: 'bg-purple-100 text-purple-700',
  Client: 'bg-blue-100 text-blue-700',
  Freelancer: 'bg-green-100 text-green-700',
}

const verColors: Record<string, string> = {
  Unverified: 'bg-gray-100 text-gray-600',
  'ID-Verified': 'bg-blue-100 text-blue-700',
  'Skill-Tested': 'bg-green-100 text-green-700',
}

const defaultNewUser = {
  full_name: '', email: '', password: '', role: 'Freelancer',
  phone: '', county: '', bio: '', title: '',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [verFilter, setVerFilter] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const limit = 20
  const [actionMenu, setActionMenu] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newUser, setNewUser] = useState(defaultNewUser)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [roleStats, setRoleStats] = useState({ total: 0, freelancers: 0, clients: 0, admins: 0, verified: 0 })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit), sort: sortBy })
    if (search) params.set('search', search)
    if (roleFilter) params.set('role', roleFilter)
    if (verFilter) params.set('verification', verFilter)

    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch(`/api/admin/users?${params}`),
        page === 1 && !search && !roleFilter && !verFilter ? fetch('/api/admin/stats') : Promise.resolve(null),
      ])
      const data = await usersRes.json()
      setUsers(data.users || [])
      setTotal(data.pagination?.total || 0)
      setHasMore(data.pagination?.hasMore || false)
      if (statsRes?.ok) {
        const statsData = await statsRes.json()
        const s = statsData.stats
        setRoleStats({
          total: s?.users?.total || 0,
          freelancers: s?.users?.freelancers || 0,
          clients: s?.users?.clients || 0,
          admins: s?.users?.admins || 0,
          verified: s?.users?.verified || 0,
        })
      }
    } catch { /* */ }
    setLoading(false)
  }, [page, search, roleFilter, verFilter, sortBy])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    fetchUsers()
    setActionMenu(null)
  }

  const handleUserAction = async (userId: string, action: string) => {
    const confirmations: Record<string, string> = {
      ban: 'Ban this user? They will be logged out and unable to access the platform.',
      suspend: 'Suspend this user for 7 days?',
      reset_password: 'Send password reset email to this user?',
      force_logout: 'Force logout all sessions for this user?',
    }
    
    if (confirmations[action] && !confirm(confirmations[action])) return
    
    try {
      const res = await fetch(`/api/admin/users/${userId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, duration: 7 }),
      })
      if (res.ok) {
        fetchUsers()
        setActionMenu(null)
      }
    } catch (err) {
      console.error('Failed to perform action:', err)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true); setMessage(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: `User "${newUser.full_name}" created successfully` })
        setShowCreateModal(false)
        setNewUser(defaultNewUser)
        fetchUsers()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create user' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    }
    setCreating(false)
  }

  const statCards = [
    { label: 'Total Users', value: roleStats.total || total, color: 'bg-blue-500', textColor: 'text-blue-600', bg: 'bg-blue-50', filter: '' },
    { label: 'Freelancers', value: roleStats.freelancers, color: 'bg-green-500', textColor: 'text-green-600', bg: 'bg-green-50', filter: 'Freelancer' },
    { label: 'Clients', value: roleStats.clients, color: 'bg-purple-500', textColor: 'text-purple-600', bg: 'bg-purple-50', filter: 'Client' },
    { label: 'Admins', value: roleStats.admins, color: 'bg-red-500', textColor: 'text-red-600', bg: 'bg-red-50', filter: 'Admin' },
  ]

  return (
    <div className="space-y-5" onClick={() => setActionMenu(null)}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" /> Users
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{total.toLocaleString()} total · {roleStats.verified} verified</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/subscriptions" className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Subscriptions
          </Link>
          <button onClick={() => setShowCreateModal(true)} className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map(s => (
          <button key={s.label}
            onClick={() => { setRoleFilter(s.filter); setPage(1) }}
            className={`text-left bg-white rounded-xl border p-3 hover:shadow-sm transition-all ${
              roleFilter === s.filter ? `border-current ${s.textColor}` : 'border-gray-200'
            }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500">{s.label}</span>
              <div className={`w-2 h-2 rounded-full ${s.color}`} />
            </div>
            <p className={`text-xl font-bold ${s.textColor}`}>{s.value.toLocaleString()}</p>
            {roleStats.total > 0 && (
              <div className="mt-2">
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full transition-all`}
                    style={{ width: `${Math.min(100, (s.value / (roleStats.total || 1)) * 100)}%` }} />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {roleStats.total > 0 ? Math.round((s.value / roleStats.total) * 100) : 0}% of total
                </p>
              </div>
            )}
          </button>
        ))}
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
            />
          </div>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30">
            <option value="">All Roles</option>
            <option value="Freelancer">Freelancer</option>
            <option value="Client">Client</option>
            <option value="Admin">Admin</option>
          </select>
          <select value={verFilter} onChange={(e) => { setVerFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30">
            <option value="">All Verification</option>
            <option value="Unverified">Unverified</option>
            <option value="ID-Verified">ID-Verified</option>
            <option value="Skill-Tested">Skill-Tested</option>
          </select>
          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="score_high">Highest Score</option>
            <option value="most_earned">Most Earned</option>
          </select>
          {(search || roleFilter || verFilter) && (
            <button onClick={() => { setSearch(''); setRoleFilter(''); setVerFilter(''); setPage(1) }} className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Verification</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Score</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Earned</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jobs</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Joined</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-10" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-10" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">No users found</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                          u.role === 'Admin' ? 'bg-purple-500' : u.role === 'Client' ? 'bg-blue-500' : 'bg-green-500'
                        }`}>
                          {(u.full_name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">{u.full_name}</p>
                          <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${roleColors[u.role] || 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 w-fit ${verColors[u.verification_status] || 'bg-gray-100 text-gray-600'}`}>
                        {u.verification_status === 'Skill-Tested' ? <ShieldCheck className="w-3 h-3" /> : u.verification_status === 'ID-Verified' ? <Shield className="w-3 h-3" /> : null}
                        {u.verification_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min(100, u.hustle_score)}%` }} />
                        </div>
                        <span className="text-xs text-gray-600">{u.hustle_score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">KES {u.total_earned.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">{u.jobs_completed}<span className="text-gray-400">/{u.jobs_posted}</span></td>
                    <td className="px-4 py-3 text-[11px] text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right relative">
                      <button onClick={() => setActionMenu(actionMenu === u.id ? null : u.id)} className="p-1 hover:bg-gray-100 rounded transition">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                      {actionMenu === u.id && (
                        <div className="absolute right-4 top-10 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-48">
                          <Link href={`/admin/users/${u.id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setActionMenu(null)}>
                            <Eye className="w-4 h-4" /> View Details
                          </Link>
                          <Link href={`/admin/users/${u.id}?edit=true`} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setActionMenu(null)}>
                            <Pencil className="w-4 h-4" /> Edit User
                          </Link>
                          <button onClick={() => handleUserAction(u.id, 'ban')} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
                            <Shield className="w-4 h-4" /> Ban User
                          </button>
                          <button onClick={() => handleUserAction(u.id, 'suspend')} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
                            <Clock className="w-4 h-4" /> Suspend (7 days)
                          </button>
                          <button onClick={() => handleUserAction(u.id, 'reset_password')} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
                            <Key className="w-4 h-4" /> Reset Password
                          </button>
                          <button onClick={() => handleUserAction(u.id, 'force_logout')} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
                            <LogOut className="w-4 h-4" /> Force Logout
                          </button>
                          <button onClick={() => handleDelete(u.id)} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                            <Trash2 className="w-4 h-4" /> Delete User
                          </button>
                        </div>
                      )}
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Create New User</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Full Name *</label>
                  <input type="text" required value={newUser.full_name} onChange={e => setNewUser(p => ({ ...p, full_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email *</label>
                  <input type="email" required value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" placeholder="user@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Password *</label>
                  <input type="password" required minLength={6} value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" placeholder="Min 6 characters" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                  <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30">
                    <option value="Freelancer">Freelancer</option>
                    <option value="Client">Client</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                  <input type="text" value={newUser.phone} onChange={e => setNewUser(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" placeholder="254712345678" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">County</label>
                  <input type="text" value={newUser.county} onChange={e => setNewUser(p => ({ ...p, county: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" placeholder="Nairobi" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                  <input type="text" value={newUser.title} onChange={e => setNewUser(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" placeholder="e.g., Web Developer" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Bio</label>
                  <textarea rows={2} value={newUser.bio} onChange={e => setNewUser(p => ({ ...p, bio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" placeholder="Brief description..." />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={creating} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2">
                  {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create User</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
