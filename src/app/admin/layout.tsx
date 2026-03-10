'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Briefcase, FileText, DollarSign,
  AlertTriangle, Star, MessageSquare, Settings, FileCode,
  ChevronLeft, ChevronRight, LogOut, Menu, X, Bell, Search,
  Shield, Activity, LifeBuoy, Wallet, CreditCard, Tag,
  BookOpen, Radio, Lock, FileWarning, Mail, ChevronDown,
  Globe, Home
} from 'lucide-react'
import AssignmentNotificationPopup from '@/app/components/AssignmentNotificationPopup'

interface AdminUser {
  id: string
  email: string
  profile: { id: string; full_name: string; role: string; avatar_url?: string } | null
}

const navGroups = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    label: 'Users & Jobs',
    items: [
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/jobs', label: 'Jobs', icon: Briefcase },
      { href: '/admin/proposals', label: 'Proposals', icon: FileText },
      { href: '/admin/reviews', label: 'Reviews', icon: Star },
    ]
  },
  {
    label: 'Finance',
    items: [
      { href: '/admin/wallets', label: 'Wallets', icon: Wallet },
      { href: '/admin/escrow', label: 'Escrow', icon: DollarSign },
      { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
      { href: '/admin/promo-codes', label: 'Promo Codes', icon: Tag },
    ]
  },
  {
    label: 'Issues',
    items: [
      { href: '/admin/disputes', label: 'Disputes', icon: AlertTriangle },
      { href: '/admin/fraud', label: 'Fraud Alerts', icon: Shield },
    ]
  },
  {
    label: 'Communication',
    items: [
      { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
      { href: '/admin/contacts', label: 'Contact Messages', icon: Mail },
      { href: '/admin/support', label: 'Support', icon: LifeBuoy },
      { href: '/admin/broadcast', label: 'Broadcast', icon: Radio },
    ]
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/blog', label: 'Blog', icon: BookOpen },
      { href: '/admin/pages', label: 'Pages', icon: FileCode },
      { href: '/admin/saved-searches', label: 'Job Alerts', icon: Bell },
    ]
  },
  {
    label: 'System',
    items: [
      { href: '/admin/security', label: 'Security', icon: Lock },
      { href: '/admin/sessions', label: 'Sessions', icon: Activity },
      { href: '/admin/audit-logs', label: 'Audit Logs', icon: FileWarning },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ]
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreadAssignments, setUnreadAssignments] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function checkAdmin() {
      try {
        const [statsRes, profileRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/profile'),
        ])
        if (statsRes.status === 401) { router.push('/login?redirect=/admin'); return }
        if (statsRes.status === 403) { setError('Access denied. Admin role required.'); return }
        if (profileRes.ok) {
          const data = await profileRes.json()
          setUser({ id: data.profile.user_id, email: data.profile.email, profile: data.profile })
        }
      } catch {
        setError('Failed to verify admin access')
      } finally {
        setLoading(false)
      }
    }
    checkAdmin()
  }, [router])

  useEffect(() => {
    if (!user) return
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/admin/support/assignments')
        if (res.ok) { const d = await res.json(); setUnreadAssignments(d.count || 0) }
      } catch { /* */ }
    }
    fetchUnread()
    const t = setInterval(fetchUnread, 30000)
    return () => clearInterval(t)
  }, [user])

  const handleLogout = useCallback(async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }) } catch {}
    try { sessionStorage.removeItem('hk_profile') } catch {}
    window.location.href = '/'
  }, [])

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <Shield className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <Link href="/" className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition">
            Go to Homepage
          </Link>
        </div>
      </div>
    )
  }

  const isActive = (href: string) => href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen bg-gray-950 text-white flex flex-col transition-all duration-300
        ${collapsed ? 'w-[68px]' : 'w-60'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center h-14 px-3.5 border-b border-gray-800 shrink-0">
          {!collapsed ? (
            <Link href="/admin" className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0">H</div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-base truncate">HustleKE</span>
                <span className="text-[9px] bg-green-600/30 text-green-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">Admin</span>
              </div>
            </Link>
          ) : (
            <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-xs mx-auto">H</div>
          )}
          <button onClick={() => setMobileOpen(false)} className="ml-auto lg:hidden text-gray-400 hover:text-white shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navGroups.map((group) => {
            const isGroupCollapsed = collapsedGroups.has(group.label)
            const hasActive = group.items.some(i => isActive(i.href))
            return (
              <div key={group.label} className="mb-1">
                {!collapsed && (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition"
                  >
                    <span>{group.label}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isGroupCollapsed ? '-rotate-90' : ''}`} />
                  </button>
                )}
                {collapsed && !isGroupCollapsed && <div className="h-px bg-gray-800 mx-2 my-1" />}
                {!isGroupCollapsed && group.items.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  const showBadge = item.href === '/admin/support' && unreadAssignments > 0
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-0.5 transition-all text-xs font-medium relative group
                        ${active ? 'bg-green-600/20 text-green-400 border border-green-600/20' : 'text-gray-400 hover:bg-gray-800/70 hover:text-white border border-transparent'}`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-green-400' : ''}`} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {showBadge && !collapsed && (
                        <span className="ml-auto bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center shrink-0">
                          {unreadAssignments > 99 ? '99+' : unreadAssignments}
                        </span>
                      )}
                      {showBadge && collapsed && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-gray-950" />
                      )}
                      {collapsed && (
                        <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* Visit site + Collapse */}
        <div className="border-t border-gray-800 p-2.5 shrink-0 space-y-1">
          {!collapsed && (
            <Link href="/" target="_blank" className="flex items-center gap-2 px-2.5 py-2 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition">
              <Globe className="w-4 h-4" /><span>View Live Site</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-2.5 py-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition text-xs hidden lg:flex"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky top bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200 h-14 flex items-center px-4 lg:px-5 shrink-0 gap-3">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-900 p-1">
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb-style page title (hidden on mobile, shown on desktop) */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
            <Home className="w-3.5 h-3.5" />
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-700 font-medium capitalize">
              {pathname === '/admin' ? 'Dashboard' : pathname.split('/').filter(Boolean).slice(1).join(' / ')}
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (searchQuery.trim()) router.push(`/admin/users?search=${encodeURIComponent(searchQuery)}`)
            }}
            className="relative flex-1 max-w-sm ml-2"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search users, jobs..."
              className="w-full pl-9 pr-4 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 focus:bg-white transition"
            />
          </form>

          <div className="flex items-center gap-2 ml-auto">
            {/* Quick nav links */}
            <div className="hidden xl:flex items-center gap-1">
              {[
                { href: '/admin/users', label: 'Users', icon: Users },
                { href: '/admin/disputes', label: 'Disputes', icon: AlertTriangle },
                { href: '/admin/escrow', label: 'Escrow', icon: DollarSign },
              ].map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive(href) ? 'bg-green-50 text-green-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </Link>
              ))}
            </div>

            <div className="h-6 w-px bg-gray-200" />

            <button className="relative p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user?.profile?.full_name?.charAt(0) || 'A'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-gray-800 leading-tight">{user?.profile?.full_name || 'Admin'}</p>
                <p className="text-[10px] text-gray-400 leading-tight">Administrator</p>
              </div>
            </div>

            <button onClick={handleLogout} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Sign Out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-5 overflow-y-auto">
          {children}
        </main>
      </div>

      {user && <AssignmentNotificationPopup />}
    </div>
  )
}
