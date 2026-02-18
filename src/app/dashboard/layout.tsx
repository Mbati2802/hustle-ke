'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import type { OrgContext } from '@/contexts/AuthContext'
import { usePostJobModal } from '../components/PostJobModalContext'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Briefcase,
  Search,
  FileText,
  MessageSquare,
  Shield,
  Wallet,
  StarHalf,
  Building2,
  Settings,
  PlusCircle,
  Users,
  Heart,
  BarChart3,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  CreditCard,
  Zap,
  AlertTriangle,
  Star,
  ChevronRight,
  Crown,
  MoreHorizontal,
  Dna,
  Milestone,
  Wand2,
  Link2,
  BellRing,
  LineChart,
  Gift,
  Receipt,
  FileCheck,
} from 'lucide-react'
import NotificationDropdown from '../components/NotificationDropdown'
import NotificationPermission from '../components/NotificationPermission'

const freelancerItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Briefcase, label: 'My Hustles', href: '/dashboard/jobs' },
  { icon: Search, label: 'Find Work', href: '/jobs' },
  { icon: Heart, label: 'Saved Jobs', href: '/dashboard/saved-jobs' },
  { icon: Bell, label: 'Job Alerts', href: '/dashboard/job-alerts' },
  { icon: FileText, label: 'My Proposals', href: '/dashboard/proposals' },
  { icon: Wand2, label: 'ProposalForge™', href: '/dashboard/proposalforge' },
  { icon: MessageSquare, label: 'Messages', href: '/dashboard/messages' },
  { icon: BellRing, label: 'Notifications', href: '/dashboard/notifications' },
  { icon: Shield, label: 'Escrow', href: '/dashboard/escrow' },
  { icon: Milestone, label: 'EscrowSplit™', href: '/dashboard/escrow-split' },
  { icon: Wallet, label: 'Wallet / M-Pesa', href: '/dashboard/wallet' },
  { icon: LineChart, label: 'Earnings', href: '/dashboard/earnings' },
  { icon: Receipt, label: 'Invoices', href: '/dashboard/invoices' },
  { icon: FileCheck, label: 'Contracts', href: '/dashboard/contracts' },
  { icon: Dna, label: 'SkillDNA™', href: '/dashboard/skilldna' },
  { icon: Link2, label: 'TrustChain™', href: '/dashboard/trustchain' },
  { icon: Zap, label: 'LiveHustle™', href: '/dashboard/livehustle' },
  { icon: StarHalf, label: 'Reviews', href: '/dashboard/reviews' },
  { icon: AlertTriangle, label: 'Disputes', href: '/dashboard/disputes' },
  { icon: Gift, label: 'Referrals', href: '/dashboard/referrals' },
  { icon: Building2, label: 'Enterprise', href: '/dashboard/enterprise' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

const clientItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Briefcase, label: 'My Projects', href: '/dashboard/projects' },
  { icon: PlusCircle, label: 'Post a Job', href: '', action: 'postJob' as const },
  { icon: Search, label: 'Find Freelancers', href: '/talent' },
  { icon: MessageSquare, label: 'Messages', href: '/dashboard/messages' },
  { icon: BellRing, label: 'Notifications', href: '/dashboard/notifications' },
  { icon: Shield, label: 'Escrow', href: '/dashboard/escrow' },
  { icon: Milestone, label: 'EscrowSplit™', href: '/dashboard/escrow-split' },
  { icon: Wallet, label: 'Wallet / M-Pesa', href: '/dashboard/wallet' },
  { icon: LineChart, label: 'Earnings', href: '/dashboard/earnings' },
  { icon: Receipt, label: 'Invoices', href: '/dashboard/invoices' },
  { icon: FileCheck, label: 'Contracts', href: '/dashboard/contracts' },
  { icon: Zap, label: 'LiveHustle™', href: '/dashboard/livehustle' },
  { icon: StarHalf, label: 'Reviews', href: '/dashboard/reviews' },
  { icon: AlertTriangle, label: 'Disputes', href: '/dashboard/disputes' },
  { icon: Gift, label: 'Referrals', href: '/dashboard/referrals' },
  { icon: Building2, label: 'Enterprise', href: '/dashboard/enterprise' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

// Org-mode sidebar items — shown when user switches to org context
const orgModeItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Briefcase, label: 'Org Jobs', href: '/dashboard/projects' },
  { icon: PlusCircle, label: 'Post Org Job', href: '', action: 'postJob' as const },
  { icon: FileText, label: 'Org Proposals', href: '/dashboard/proposals' },
  { icon: Users, label: 'Team', href: '/dashboard/enterprise?tab=team' },
  { icon: Heart, label: 'Bench', href: '/dashboard/enterprise?tab=bench' },
  { icon: Wallet, label: 'Org Wallet', href: '/dashboard/enterprise?tab=wallet' },
  { icon: MessageSquare, label: 'Messages', href: '/dashboard/messages' },
  { icon: BellRing, label: 'Notifications', href: '/dashboard/notifications' },
  { icon: Shield, label: 'Escrow', href: '/dashboard/escrow' },
  { icon: AlertTriangle, label: 'Disputes', href: '/dashboard/disputes' },
  { icon: StarHalf, label: 'Reviews', href: '/dashboard/enterprise/reviews' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/enterprise?tab=analytics' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, loading, logout, userOrg, userOrgRole, activeOrg, orgRole, orgMode, pendingInvites, switchToOrg, switchToPersonal, refreshOrg, refreshInvites } = useAuth()
  const { openModal: openPostJobModal } = usePostJobModal()
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [showInviteBanner, setShowInviteBanner] = useState(true)
  const [moreOpen, setMoreOpen] = useState(false)

  // Auth guard — redirect to home if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-green-600 border-t-transparent" />
          <p className="text-sm text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const title = profile?.title || profile?.role || ''
  const hustleScore = profile?.hustle_score ?? 0
  const personalItems = profile?.role === 'Client' ? clientItems : freelancerItems
  const sidebarItems = orgMode ? orgModeItems : personalItems
  const isClient = profile?.role === 'Client'

  const handleAcceptInvite = async (inviteId: string) => {
    try {
      const res = await fetch('/api/enterprise/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_id: inviteId, action: 'accept' }),
      })
      const data = await res.json()
      if (res.ok) {
        await refreshOrg()
        await refreshInvites()
      }
    } catch {}
  }

  const handleDeclineInvite = async (inviteId: string) => {
    try {
      await fetch('/api/enterprise/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_id: inviteId, action: 'decline' }),
      })
      await refreshInvites()
    } catch {}
  }

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      <NotificationPermission />
      {/* Mobile Header */}
      <header className={`lg:hidden sticky top-0 z-50 ${orgMode ? 'bg-indigo-950' : 'bg-slate-900'}`}>
        <div className="flex items-center justify-between px-3 sm:px-4 h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${orgMode ? 'bg-purple-500' : 'bg-green-500'}`}>
              <span className="text-white font-bold text-sm">{orgMode ? 'O' : 'H'}</span>
            </div>
            <span className="font-bold text-white text-sm sm:text-base truncate max-w-[120px] sm:max-w-[200px]">{orgMode && activeOrg ? activeOrg.name : 'HustleKE'}</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationDropdown variant="mobile" />
            <Link href="/dashboard/settings" className="flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  {initials}
                </div>
              )}
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* ─── Sidebar - Desktop ─── */}
        <aside className={`hidden lg:flex flex-col w-[260px] h-screen sticky top-0 shrink-0 transition-colors duration-300 ${orgMode ? 'bg-indigo-950' : 'bg-slate-900'}`}>
          {/* Logo */}
          <div className="px-6 py-5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${orgMode ? 'bg-purple-500' : 'bg-green-500'}`}>
                <span className="text-white font-bold text-lg">{orgMode ? 'O' : 'H'}</span>
              </div>
              <span className="text-lg font-bold text-white">{orgMode && activeOrg ? activeOrg.name : 'HustleKE'}</span>
            </Link>
          </div>

          {/* Context Switcher */}
          <div className="mx-4 mb-2 relative">
            <button
              onClick={() => setShowSwitcher(!showSwitcher)}
              className={`w-full p-3 rounded-xl border transition-colors text-left ${orgMode ? 'bg-indigo-900/60 border-indigo-700/50 hover:border-indigo-500' : 'bg-slate-800/80 border-slate-700/50 hover:border-slate-600'}`}
            >
              <div className="flex items-center gap-3">
                {orgMode && activeOrg ? (
                  <>
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white text-sm truncate">{activeOrg.name}</p>
                      <p className="text-[10px] text-purple-300 uppercase tracking-wider font-semibold">Org Mode • {orgRole}</p>
                    </div>
                  </>
                ) : (
                  <>
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={displayName} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white text-sm truncate">{displayName}</p>
                      <p className="text-xs text-slate-400 truncate">{isClient ? 'Client' : title || 'Freelancer'}</p>
                    </div>
                  </>
                )}
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${showSwitcher ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Switcher Dropdown */}
            {showSwitcher && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 rounded-xl border border-slate-700 shadow-xl z-50 overflow-hidden">
                {/* Personal mode option */}
                <button
                  onClick={() => { switchToPersonal(); setShowSwitcher(false); router.push('/dashboard') }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 transition-colors text-left ${!orgMode ? 'bg-green-500/10 border-l-2 border-green-400' : ''}`}
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs">{initials}</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{displayName}</p>
                    <p className="text-[10px] text-slate-400">Personal Account</p>
                  </div>
                  {!orgMode && <div className="w-2 h-2 bg-green-400 rounded-full" />}
                </button>

                {/* Org mode option */}
                {userOrg && (
                  <button
                    onClick={() => { switchToOrg(userOrg, userOrgRole || 'member'); setShowSwitcher(false); router.push('/dashboard') }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 transition-colors text-left ${orgMode ? 'bg-purple-500/10 border-l-2 border-purple-400' : ''}`}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{userOrg.name}</p>
                      <p className="text-[10px] text-slate-400">Organization • {userOrgRole}</p>
                    </div>
                    {orgMode && <div className="w-2 h-2 bg-purple-400 rounded-full" />}
                  </button>
                )}

                {/* Pending invites */}
                {pendingInvites.length > 0 && (
                  <div className="border-t border-slate-700">
                    <p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Pending Invites</p>
                    {pendingInvites.map(inv => (
                      <div key={inv.id} className="px-4 py-2 flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-white truncate">{(inv.organization as any)?.name || 'Organization'}</p>
                          <p className="text-[10px] text-slate-400">as {inv.role}</p>
                        </div>
                        <button onClick={() => handleAcceptInvite(inv.id)} className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-[10px] font-semibold rounded-md">Join</button>
                        <button onClick={() => handleDeclineInvite(inv.id)} className="px-2 py-1 text-slate-400 hover:text-red-400 text-[10px]">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hustle Score */}
          {!orgMode && (
            <div className="mx-4 mb-4 px-3.5 py-2 bg-slate-800/40 rounded-lg">
              <div className="flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-slate-300">Hustle Score: <span className="font-semibold text-amber-400">{hustleScore}</span></span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
            <p className={`px-3 pt-2 pb-2 text-[10px] font-semibold uppercase tracking-wider ${orgMode ? 'text-indigo-400' : 'text-slate-500'}`}>{orgMode ? 'Organization' : 'Menu'}</p>
            {sidebarItems.map((item) => {
              const isActive = item.href ? (item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)) : false
              const baseClass = 'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all w-full text-sm'
              const activeClass = isActive
                ? (orgMode ? 'bg-purple-500/15 text-purple-300 font-medium' : 'bg-green-500/15 text-green-400 font-medium')
                : (orgMode ? 'text-indigo-300/70 hover:bg-indigo-900/50 hover:text-indigo-200' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200')

              if ('action' in item && item.action === 'postJob') {
                return (
                  <button key={item.label} onClick={() => openPostJobModal()} className={`${baseClass} ${activeClass}`}>
                    <item.icon className="w-[18px] h-[18px]" />
                    <span>{item.label}</span>
                  </button>
                )
              }

              return (
                <Link key={item.label} href={item.href} className={`${baseClass} ${activeClass}`}>
                  <item.icon className="w-[18px] h-[18px]" />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
                </Link>
              )
            })}
          </nav>

          {/* Pro Upgrade — hidden in org mode */}
          {!orgMode && (
            <div className="px-4 py-3">
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-xl p-4 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-1.5">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-amber-300 text-sm">Go Pro</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">10% lower fees &amp; priority support</p>
                <button className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 py-2 rounded-lg font-semibold text-xs transition-colors">
                  KES 500/mo
                </button>
              </div>
            </div>
          )}

          {/* Logout */}
          <div className={`px-4 py-3 border-t ${orgMode ? 'border-indigo-800' : 'border-slate-800'}`}>
            <button
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:text-red-400 w-full rounded-lg hover:bg-red-500/10 transition-colors text-sm"
            >
              <LogOut className="w-[18px] h-[18px]" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* ─── Main Content ─── */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">
          {/* Top Bar - Desktop */}
          <div className="hidden lg:flex items-center justify-between px-8 h-16 bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="flex items-center gap-4 flex-1">
              {orgMode && activeOrg && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-700">{activeOrg.name}</span>
                  <button onClick={switchToPersonal} className="text-purple-400 hover:text-purple-600 ml-1 text-xs">✕</button>
                </div>
              )}
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={orgMode ? 'Search org jobs...' : isClient ? 'Search projects...' : 'Search jobs...'}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-transparent rounded-lg text-sm focus:bg-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20 transition-all"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationDropdown variant="desktop" />
              <div className="w-px h-8 bg-gray-200"></div>
              <Link href="/dashboard/settings" className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors">
                <div className="text-right hidden xl:block">
                  <p className="text-sm font-medium text-gray-900">{displayName}</p>
                  <p className="text-xs text-gray-500">{title}</p>
                </div>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={displayName} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {initials}
                  </div>
                )}
              </Link>
            </div>
          </div>

          {/* Pending Invite Banner */}
          {pendingInvites.length > 0 && showInviteBanner && !orgMode && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-8 py-3">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-800">
                    You have {pendingInvites.length} organization invite{pendingInvites.length > 1 ? 's' : ''} pending
                  </p>
                  <p className="text-xs text-amber-600">Click the switcher in the sidebar to accept or decline</p>
                </div>
                <button onClick={() => setShowInviteBanner(false)} className="text-amber-400 hover:text-amber-600 text-sm shrink-0">✕</button>
              </div>
            </div>
          )}

          {children}
        </main>
      </div>

      {/* ─── Mobile More Drawer ─── */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMoreOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[70vh] overflow-y-auto animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="font-bold text-gray-900 text-sm">All Menu</h3>
              <button onClick={() => setMoreOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-3 py-2 pb-8">
              {sidebarItems.map((item) => {
                const Icon = item.icon
                const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : item.href ? pathname.startsWith(item.href) : false
                const accentColor = orgMode ? 'text-purple-600 bg-purple-50' : 'text-green-600 bg-green-50'
                const handleClick = () => {
                  setMoreOpen(false)
                  if ('action' in item && item.action === 'postJob') {
                    openPostJobModal()
                  }
                }
                if ('action' in item && item.action === 'postJob') {
                  return (
                    <button
                      key={item.label}
                      onClick={handleClick}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  )
                }
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive ? accentColor : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
              <button
                onClick={() => { setMoreOpen(false); logout() }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors mt-1"
              >
                <LogOut className="w-5 h-5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Mobile Bottom Navigation ─── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe shadow-lg">
        <div className="flex items-center justify-around h-16 px-1 max-w-full overflow-x-hidden">
          {(() => {
            const accent = orgMode ? 'text-purple-600' : 'text-green-600'
            const hoverAccent = orgMode ? 'hover:text-purple-600 hover:bg-purple-50' : 'hover:text-green-600 hover:bg-green-50'
            const bottomItems = orgMode
              ? [
                  { icon: LayoutDashboard, label: 'Org', href: '/dashboard', match: pathname === '/dashboard' },
                  { icon: Briefcase, label: 'Jobs', href: '/dashboard/projects', match: pathname.startsWith('/dashboard/projects') },
                  { icon: MessageSquare, label: 'Messages', href: '/dashboard/messages', match: pathname.startsWith('/dashboard/messages') },
                  { icon: Shield, label: 'Escrow', href: '/dashboard/escrow', match: pathname.startsWith('/dashboard/escrow') },
                ]
              : isClient
              ? [
                  { icon: LayoutDashboard, label: 'Home', href: '/dashboard', match: pathname === '/dashboard' },
                  { icon: Search, label: 'Talent', href: '/talent', match: pathname === '/talent' },
                  { icon: MessageSquare, label: 'Messages', href: '/dashboard/messages', match: pathname.startsWith('/dashboard/messages') },
                  { icon: Wallet, label: 'Wallet', href: '/dashboard/wallet', match: pathname.startsWith('/dashboard/wallet') },
                ]
              : [
                  { icon: LayoutDashboard, label: 'Home', href: '/dashboard', match: pathname === '/dashboard' },
                  { icon: Search, label: 'Jobs', href: '/jobs', match: pathname === '/jobs' },
                  { icon: MessageSquare, label: 'Messages', href: '/dashboard/messages', match: pathname.startsWith('/dashboard/messages') },
                  { icon: Wallet, label: 'Wallet', href: '/dashboard/wallet', match: pathname.startsWith('/dashboard/wallet') },
                ]
            return (
              <>
                {bottomItems.map((item) => (
                  <Link key={item.label} href={item.href} className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg ${item.match ? accent : `text-gray-400 ${hoverAccent}`}`}>
                    <item.icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </Link>
                ))}
                <button onClick={() => setMoreOpen(true)} className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg ${moreOpen ? accent : `text-gray-400 ${hoverAccent}`}`}>
                  <MoreHorizontal className="w-5 h-5" />
                  <span className="text-[10px] font-medium">More</span>
                </button>
              </>
            )
          })()}
        </div>
      </nav>
    </div>
  )
}
