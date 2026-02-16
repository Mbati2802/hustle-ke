'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Briefcase, FileText, DollarSign,
  AlertTriangle, Star, MessageSquare, Settings, FileCode,
  ChevronLeft, ChevronRight, LogOut, Menu, X, Bell, Search,
  Shield, Activity
} from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  profile: { id: string; full_name: string; role: string; avatar_url?: string } | null
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/admin/proposals', label: 'Proposals', icon: FileText },
  { href: '/admin/escrow', label: 'Escrow', icon: DollarSign },
  { href: '/admin/disputes', label: 'Disputes', icon: AlertTriangle },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { href: '/admin/pages', label: 'Pages', icon: FileCode },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/activity', label: 'Activity Log', icon: Activity },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch('/api/admin/stats')
        if (res.status === 401) {
          router.push('/login?redirect=/admin')
          return
        }
        if (res.status === 403) {
          setError('Access denied. Admin role required.')
          return
        }
        // Get user profile
        const profileRes = await fetch('/api/profile')
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

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/" className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
            Go to Homepage
          </Link>
        </div>
      </div>
    )
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen bg-gray-900 text-white flex flex-col transition-all duration-300
        ${collapsed ? 'w-[72px]' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-gray-800 shrink-0">
          {!collapsed && (
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">H</div>
              <span className="font-bold text-lg">HustleKE</span>
              <span className="text-[10px] bg-green-600/30 text-green-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Admin</span>
            </Link>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-sm mx-auto">H</div>
          )}
          <button onClick={() => setMobileOpen(false)} className="ml-auto lg:hidden text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors text-sm font-medium
                  ${active
                    ? 'bg-green-600/20 text-green-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }
                `}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-gray-800 p-3 shrink-0 hidden lg:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition text-sm"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <><ChevronLeft className="w-5 h-5" /><span>Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 flex items-center px-4 lg:px-6 shrink-0">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden mr-3 text-gray-600 hover:text-gray-900">
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 flex items-center gap-4">
            <div className="relative hidden md:block max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users, jobs, disputes..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div className="h-8 w-px bg-gray-200" />

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900 leading-tight">{user?.profile?.full_name || 'Admin'}</p>
                <p className="text-xs text-gray-500">{user?.profile?.role || 'Administrator'}</p>
              </div>
              <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {user?.profile?.full_name?.charAt(0) || 'A'}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
