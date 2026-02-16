'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from './AuthModalContext'
import { usePostJobModal } from './PostJobModalContext'
import {
  Menu,
  X,
  Bell,
  ChevronRight,
  ChevronDown,
  Zap,
  Search,
  Briefcase,
  Users,
  Star,
  TrendingUp,
  UserPlus,
  FileText,
  Send,
  Shield,
  Wallet,
  Building2,
  HelpCircle,
  Heart,
  Phone,
  CreditCard,
  BookOpen,
  Brain,
  Sparkles,
  Scale,
  FileEdit,
  type LucideIcon,
} from 'lucide-react'

interface HeaderProps {
  activeLink?: string
}

const BANNER_H = 52

type BannerTheme = 'dark' | 'light' | 'green'

const THEME_CONFIG: Record<BannerTheme, {
  bg: string
  text: string
  muted: string
  highlight: string
  offer: string
  codeBg: string
  codeText: string
  cta: string
  ctaHover: string
  dismiss: string
  dismissHover: string
  separator: string
  shimmerOpacity: string
}> = {
  dark: {
    bg: 'from-gray-900 via-gray-800 to-gray-900',
    text: 'text-white',
    muted: 'text-gray-300',
    highlight: 'text-yellow-400',
    offer: 'text-orange-400',
    codeBg: 'hk-code-badge-amber',
    codeText: 'text-gray-900',
    cta: 'text-yellow-400 hover:text-yellow-300',
    ctaHover: 'group-hover:translate-x-0.5',
    dismiss: 'text-gray-500 hover:text-white',
    dismissHover: 'hover:bg-white/10',
    separator: 'text-gray-600',
    shimmerOpacity: 'rgba(255,255,255,0.12)',
  },
  light: {
    bg: 'from-white via-gray-50 to-white',
    text: 'text-gray-900',
    muted: 'text-gray-600',
    highlight: 'text-orange-600',
    offer: 'text-red-600',
    codeBg: 'hk-code-badge-red',
    codeText: 'text-white',
    cta: 'text-orange-600 hover:text-orange-500',
    ctaHover: 'group-hover:translate-x-0.5',
    dismiss: 'text-gray-400 hover:text-gray-700',
    dismissHover: 'hover:bg-black/5',
    separator: 'text-gray-300',
    shimmerOpacity: 'rgba(0,0,0,0.06)',
  },
  green: {
    bg: 'from-amber-500 via-orange-500 to-red-500',
    text: 'text-white',
    muted: 'text-orange-100',
    highlight: 'text-white',
    offer: 'text-yellow-200',
    codeBg: 'hk-code-badge-white',
    codeText: 'text-orange-700',
    cta: 'text-white hover:text-yellow-100',
    ctaHover: 'group-hover:translate-x-0.5',
    dismiss: 'text-orange-200 hover:text-white',
    dismissHover: 'hover:bg-white/15',
    separator: 'text-orange-300',
    shimmerOpacity: 'rgba(255,255,255,0.12)',
  },
}

function parseRgb(color: string): [number, number, number] | null {
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (m) return [+m[1], +m[2], +m[3]]
  return null
}

function getLuminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

function isGreenish(r: number, g: number, b: number): boolean {
  return g > 80 && g > r * 1.1 && g > b * 1.1
}

export default function Header({ activeLink }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showBanner, setShowBanner] = useState(true)
  const [isDismissing, setIsDismissing] = useState(false)
  const [bannerTheme, setBannerTheme] = useState<BannerTheme>('dark')
  const { openModal } = usePostJobModal()
  const prevScrolled = useRef(false)
  const bannerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)

  const detectBackground = useCallback(() => {
    if (!bannerRef.current || !showBanner) return
    const rect = bannerRef.current.getBoundingClientRect()
    const sampleY = rect.bottom + 2
    const sampleX = rect.left + rect.width / 2

    bannerRef.current.style.pointerEvents = 'none'
    bannerRef.current.style.visibility = 'hidden'
    const el = document.elementFromPoint(sampleX, sampleY)
    bannerRef.current.style.visibility = ''
    bannerRef.current.style.pointerEvents = ''

    if (!el) return

    let target: HTMLElement | null = el as HTMLElement
    let bgColor = ''
    while (target && target !== document.body) {
      const computed = window.getComputedStyle(target)
      const bg = computed.backgroundColor
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        bgColor = bg
        break
      }
      const bgImage = computed.backgroundImage
      if (bgImage && bgImage !== 'none') {
        const cls = target.className || ''
        if (/from-gray-[89]00|from-green|from-emerald|from-blue|from-purple|from-orange|from-teal/.test(cls)) {
          bgColor = 'rgb(30, 30, 30)'
          break
        }
        if (/from-white|from-gray-[0-5]0/.test(cls)) {
          bgColor = 'rgb(245, 245, 245)'
          break
        }
      }
      target = target.parentElement
    }

    if (!bgColor) bgColor = 'rgb(255, 255, 255)'
    const rgb = parseRgb(bgColor)
    if (!rgb) return

    const [r, g, b] = rgb
    const lum = getLuminance(r, g, b)

    let newTheme: BannerTheme
    if (isGreenish(r, g, b) || (lum > 0.15 && lum < 0.65 && g > 100)) {
      newTheme = 'green'
    } else if (lum < 0.45) {
      newTheme = 'light'
    } else {
      newTheme = 'dark'
    }

    setBannerTheme(prev => prev !== newTheme ? newTheme : prev)
  }, [showBanner])

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 10
      if (scrolled !== prevScrolled.current) {
        prevScrolled.current = scrolled
        setIsScrolled(scrolled)
      }
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(detectBackground)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    const timer = setTimeout(detectBackground, 100)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(rafRef.current)
      clearTimeout(timer)
    }
  }, [detectBackground])

  const dismissBanner = () => {
    setIsDismissing(true)
    setTimeout(() => {
      setShowBanner(false)
      setIsDismissing(false)
    }, 400)
  }

  // Real auth state
  const { user: authUser, profile, logout } = useAuth()
  const { openLogin, openSignup } = useAuthModal()
  const isLoggedIn = !!authUser
  const displayName = profile?.full_name || authUser?.email?.split('@')[0] || ''
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  const [activeMega, setActiveMega] = useState<string | null>(null)
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null)
  const megaTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openMega = (key: string) => {
    if (megaTimeout.current) clearTimeout(megaTimeout.current)
    setActiveMega(key)
  }
  const closeMega = () => {
    megaTimeout.current = setTimeout(() => setActiveMega(null), 150)
  }

  interface MegaItem {
    href: string
    label: string
    desc: string
    icon: LucideIcon
  }
  interface NavItem {
    key: string
    href: string
    label: string
    items: MegaItem[]
    featured?: { title: string; desc: string; href: string; cta: string }
  }

  const navItems: NavItem[] = [
    {
      key: 'work',
      href: '/jobs',
      label: 'Find Work',
      items: [
        { href: '/jobs', label: 'Browse Jobs', desc: 'Explore all available opportunities', icon: Search },
        { href: '/talent', label: 'Talent Profiles', desc: 'See top-rated freelancers', icon: Users },
        { href: '/reviews', label: 'Reviews', desc: 'See what clients are saying', icon: Star },
        { href: '/career-intelligence', label: 'Career Intelligence', desc: 'AI-powered market insights & earnings data', icon: CreditCard },
        { href: '/ai-job-matcher', label: 'AI Job Matcher', desc: 'Find jobs that match your skills with AI', icon: Brain },
        { href: '/ai-profile-optimizer', label: 'AI Profile Optimizer', desc: 'Score & improve your profile with AI', icon: Sparkles },
        { href: '/ai-proposal-writer', label: 'AI Proposal Writer', desc: 'Generate winning proposals with AI', icon: FileEdit },
      ],
      featured: { title: 'AI Job Matching', desc: 'Let our AI find the perfect jobs for your skills automatically.', href: '/ai-job-matcher', cta: 'Try It Free' },
    },
    {
      key: 'talent',
      href: '/talent',
      label: 'Find Talent',
      items: [
        { href: '/talent', label: 'Browse Talent', desc: 'Find verified Kenyan freelancers', icon: Users },
        { href: '/post-job', label: 'Post a Project', desc: 'Describe your project and get proposals', icon: Briefcase },
        { href: '/enterprise', label: 'Enterprise', desc: 'Dedicated solutions for teams', icon: Building2 },
        { href: '/pricing', label: 'Employer Plans', desc: 'Pricing for hiring at scale', icon: CreditCard },
        { href: '/ai-client-brief', label: 'AI Brief Builder', desc: 'AI generates a structured job posting for you', icon: Brain },
      ],
      featured: { title: 'AI Brief Builder', desc: 'Describe your project in plain language and AI creates a professional job posting.', href: '/ai-client-brief', cta: 'Try It Free' },
    },
    {
      key: 'how',
      href: '/how-it-works',
      label: 'How It Works',
      items: [
        { href: '/how-it-works/create-profile', label: 'Create Profile', desc: 'Set up your freelancer account', icon: UserPlus },
        { href: '/how-it-works/find-work', label: 'Find Work', desc: 'Discover matching opportunities', icon: Search },
        { href: '/how-it-works/submit-proposals', label: 'Submit Proposals', desc: 'Win projects with AI-polished pitches', icon: Send },
        { href: '/how-it-works/escrow', label: 'Secure Escrow', desc: 'M-Pesa escrow protects both sides', icon: Shield },
        { href: '/how-it-works/get-paid', label: 'Get Paid', desc: 'Instant M-Pesa payouts', icon: Wallet },
      ],
      featured: { title: 'See the Full Journey', desc: 'From sign-up to first payout — learn how HustleKE works step by step.', href: '/how-it-works', cta: 'Learn More' },
    },
    {
      key: 'about',
      href: '/about',
      label: 'About',
      items: [
        { href: '/about', label: 'About Us', desc: 'Our mission and story', icon: Heart },
        { href: '/faqs', label: 'FAQs', desc: 'Common questions answered', icon: HelpCircle },
        { href: '/contact', label: 'Contact Us', desc: 'Get in touch with our team', icon: Phone },
        { href: '/mpesa-tariffs', label: 'M-Pesa Tariffs', desc: 'Transaction fees breakdown', icon: Wallet },
        { href: '/terms', label: 'Terms of Service', desc: 'Platform rules & legal agreement', icon: Scale },
      ],
    },
  ]

  const bannerVisible = showBanner && !isDismissing

  return (
    <>
      <style jsx global>{`
        @keyframes hk-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes hk-glow-amber {
          0%, 100% { box-shadow: 0 0 6px rgba(251,191,36,0.3), inset 0 0 6px rgba(251,191,36,0.08); }
          50% { box-shadow: 0 0 18px rgba(251,191,36,0.65), inset 0 0 12px rgba(251,191,36,0.15); }
        }
        @keyframes hk-glow-red {
          0%, 100% { box-shadow: 0 0 6px rgba(239,68,68,0.3), inset 0 0 6px rgba(239,68,68,0.08); }
          50% { box-shadow: 0 0 18px rgba(239,68,68,0.65), inset 0 0 12px rgba(239,68,68,0.15); }
        }
        @keyframes hk-glow-white {
          0%, 100% { box-shadow: 0 0 6px rgba(255,255,255,0.4), inset 0 0 6px rgba(255,255,255,0.1); }
          50% { box-shadow: 0 0 18px rgba(255,255,255,0.7), inset 0 0 12px rgba(255,255,255,0.2); }
        }
        @keyframes hk-sparkle {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.25) rotate(12deg); }
          75% { transform: scale(1.15) rotate(-8deg); }
        }
        @keyframes hk-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1.5px); }
        }
        .hk-shimmer-overlay {
          background-size: 200% 100%;
          animation: hk-shimmer 3.5s linear infinite;
        }
        .hk-shimmer-dark {
          background: linear-gradient(110deg,
            rgba(255,255,255,0) 0%, rgba(255,255,255,0.04) 40%,
            rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.04) 60%,
            rgba(255,255,255,0) 100%);
        }
        .hk-shimmer-light {
          background: linear-gradient(110deg,
            rgba(0,0,0,0) 0%, rgba(0,0,0,0.02) 40%,
            rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.02) 60%,
            rgba(0,0,0,0) 100%);
        }
        .hk-code-badge-amber {
          background: linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b);
          background-size: 200% auto;
          animation: hk-glow-amber 2s ease-in-out infinite, hk-bounce 2.5s ease-in-out infinite;
        }
        .hk-code-badge-red {
          background: linear-gradient(90deg, #ef4444, #f87171, #ef4444);
          background-size: 200% auto;
          animation: hk-glow-red 2s ease-in-out infinite, hk-bounce 2.5s ease-in-out infinite;
        }
        .hk-code-badge-white {
          background: linear-gradient(90deg, #fff, #fef3c7, #fff);
          background-size: 200% auto;
          animation: hk-glow-white 2s ease-in-out infinite, hk-bounce 2.5s ease-in-out infinite;
        }
        .hk-zap {
          animation: hk-sparkle 2s ease-in-out infinite;
        }
      `}</style>

      {/* Fixed header wrapper */}
      <div className="fixed top-0 left-0 right-0 z-50">
        {/* === Main Navigation === */}
        <div className="bg-white border-b border-gray-200 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">H</span>
                </div>
                <span className="text-xl font-bold text-gray-900">HustleKE</span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <div
                    key={item.key}
                    className="relative"
                    onMouseEnter={() => openMega(item.key)}
                    onMouseLeave={closeMega}
                  >
                    <Link
                      href={item.href}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                        activeLink === item.href
                          ? 'text-green-600 font-semibold'
                          : 'text-gray-600 hover:text-green-600'
                      }`}
                    >
                      {item.label}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeMega === item.key ? 'rotate-180' : ''}`} />
                    </Link>

                    {/* Mega Menu Panel */}
                    <div
                      className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200 ${
                        activeMega === item.key
                          ? 'opacity-100 translate-y-0 pointer-events-auto visible'
                          : 'opacity-0 -translate-y-2 pointer-events-none invisible'
                      }`}
                      style={{ width: item.featured ? '540px' : '320px' }}
                    >
                      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                        <div className={`${item.featured ? 'grid grid-cols-5' : ''}`}>
                          {/* Sub-links */}
                          <div className={`${item.featured ? 'col-span-3' : ''} p-3`}>
                            {item.items.map((sub) => (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                                onClick={() => setActiveMega(null)}
                              >
                                <div className="w-9 h-9 rounded-lg bg-green-50 group-hover:bg-green-100 flex items-center justify-center flex-shrink-0 transition-colors">
                                  <sub.icon className="w-4.5 h-4.5 text-green-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 group-hover:text-green-600 transition-colors">{sub.label}</p>
                                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{sub.desc}</p>
                                </div>
                              </Link>
                            ))}
                          </div>

                          {/* Featured section */}
                          {item.featured && (
                            <div className="col-span-2 bg-gradient-to-br from-green-50 to-emerald-50 p-5 flex flex-col justify-between border-l border-gray-100">
                              <div>
                                <p className="text-sm font-bold text-gray-900 mb-2">{item.featured.title}</p>
                                <p className="text-xs text-gray-600 leading-relaxed">{item.featured.desc}</p>
                              </div>
                              <Link
                                href={item.featured.href}
                                className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-green-600 hover:text-green-700 transition-colors"
                                onClick={() => setActiveMega(null)}
                              >
                                {item.featured.cta}
                                <ChevronRight className="w-4 h-4" />
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Standalone Enterprise link — bold green for visibility */}
                <Link
                  href="/enterprise"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-green-600 hover:bg-green-50 transition-colors"
                >
                  <Building2 className="w-4 h-4" />
                  Enterprise
                </Link>
              </nav>

              <div className="hidden md:flex items-center gap-4">
                {isLoggedIn ? (
                  <div className="flex items-center gap-3">
                    <button className="relative p-2 text-gray-600 hover:text-green-600 transition-colors">
                      <Bell className="w-5 h-5" />
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>
                    <Link href={profile?.role === 'Admin' ? '/admin' : '/dashboard'} className="flex items-center gap-2 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-700 font-semibold text-sm">{initials}</span>
                        </div>
                      )}
                      <span className="hidden lg:block text-sm font-medium text-gray-700">{displayName}</span>
                    </Link>
                    <button onClick={logout} className="text-gray-400 hover:text-red-500 p-2 rounded-lg transition-colors" title="Log out">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <button onClick={openLogin} className="text-green-600 font-semibold hover:text-green-700">Log In</button>
                    <button onClick={() => openSignup()} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">Sign Up</button>
                  </>
                )}
              </div>

              <button
                className="md:hidden p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {mobileMenuOpen && (
              <div className="md:hidden border-t border-gray-100 py-2 pb-4 max-h-[80vh] overflow-y-auto">
                {navItems.map((item) => (
                  <div key={item.key}>
                    <button
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-lg font-medium ${
                        activeLink === item.href
                          ? 'text-green-600 bg-green-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setMobileAccordion(mobileAccordion === item.key ? null : item.key)}
                    >
                      {item.label}
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileAccordion === item.key ? 'rotate-180' : ''}`} />
                    </button>
                    {mobileAccordion === item.key && (
                      <div className="pl-4 pr-2 pb-2 space-y-0.5">
                        {item.items.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:text-green-600 hover:bg-green-50/50 transition-colors"
                            onClick={() => { setMobileMenuOpen(false); setMobileAccordion(null) }}
                          >
                            <sub.icon className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium">{sub.label}</p>
                              <p className="text-xs text-gray-400">{sub.desc}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Enterprise link — mobile */}
                <Link
                  href="/enterprise"
                  className="flex items-center gap-3 mx-2 px-4 py-3 rounded-lg font-bold text-green-600 bg-green-50 hover:bg-green-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Building2 className="w-5 h-5" />
                  Enterprise
                </Link>

                <hr className="border-gray-100 my-2" />
                {isLoggedIn ? (
                  <div className="px-4 pt-2 space-y-2">
                    <Link href={profile?.role === 'Admin' ? '/admin' : '/dashboard'} className="block text-center py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                    <button onClick={() => { setMobileMenuOpen(false); logout() }} className="w-full text-center py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">Log Out</button>
                  </div>
                ) : (
                  <div className="flex gap-3 px-4 pt-2">
                    <button onClick={() => { setMobileMenuOpen(false); openLogin() }} className="flex-1 text-center py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">Log In</button>
                    <button onClick={() => { setMobileMenuOpen(false); openSignup() }} className="flex-1 text-center py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">Sign Up</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* === Promo Banner — opacity-crossfade backgrounds for smooth gradient transitions === */}
        {showBanner && (() => {
          const t = THEME_CONFIG[bannerTheme]
          const shimmerClass = bannerTheme === 'light' ? 'hk-shimmer-light' : 'hk-shimmer-dark'
          const themes: BannerTheme[] = ['dark', 'light', 'green']
          return (
            <div
              ref={bannerRef}
              className="overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                maxHeight: isDismissing ? 0 : `${BANNER_H}px`,
                opacity: isDismissing ? 0 : 1,
                transform: isDismissing ? 'translateY(-100%)' : 'translateY(0)',
              }}
            >
              <div className="relative" style={{ height: `${BANNER_H}px` }}>
                {/* Stacked gradient layers — only active one fades to opacity:1 */}
                {themes.map((theme) => (
                  <div
                    key={theme}
                    className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                    style={{
                      opacity: bannerTheme === theme ? 1 : 0,
                      background: theme === 'dark'
                        ? 'linear-gradient(to right, #111827, #1f2937, #111827)'
                        : theme === 'light'
                          ? 'linear-gradient(to right, #ffffff, #f9fafb, #ffffff)'
                          : 'linear-gradient(to right, #f59e0b, #f97316, #ef4444)',
                    }}
                  />
                ))}

                {/* Light theme bottom border */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-px transition-opacity duration-700 ease-in-out bg-gray-200"
                  style={{ opacity: bannerTheme === 'light' ? 1 : 0 }}
                />

                {/* Shimmer sweep */}
                <div className={`hk-shimmer-overlay ${shimmerClass} absolute inset-0 pointer-events-none`} style={{ backgroundSize: '200% 100%' }} />

                {/* Content — positioned above the backgrounds */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative h-full">
                  <div className="flex items-center justify-between h-full">
                    {/* Promo content */}
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm overflow-hidden min-w-0">
                      <span className="hk-zap flex-shrink-0">
                        <Zap className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${t.highlight} transition-colors duration-700`} style={{ fill: 'currentColor' }} />
                      </span>
                      <span className="truncate">
                        <span className={`${t.offer} font-extrabold sm:text-[15px] transition-colors duration-700`}>50% OFF</span>
                        <span className={`${t.muted} transition-colors duration-700`}> <span className="hidden sm:inline">first</span> <span className="sm:hidden">First</span> Pro <span className="sm:hidden">Month</span><span className="hidden sm:inline">month</span></span>
                        <span className={`${t.separator} mx-1 sm:mx-2 transition-colors duration-700`}>|</span>
                        <span className={`${t.muted} transition-colors duration-700`}>Code: </span>
                      </span>
                      <code className={`${t.codeBg} ${t.codeText} font-black text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md tracking-widest flex-shrink-0`}>
                        HUSTLE50
                      </code>
                    </div>

                    {/* CTA + Dismiss */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2 sm:ml-4">
                      <Link
                        href="/pricing"
                        className={`inline-flex items-center gap-1 text-xs sm:text-sm font-bold ${t.cta} transition-colors duration-700 group whitespace-nowrap`}
                      >
                        <span className="hidden sm:inline">Claim</span><span className="sm:hidden font-bold">Claim Now</span>
                        <ChevronRight className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform ${t.ctaHover}`} />
                      </Link>
                      <button
                        onClick={dismissBanner}
                        className={`p-0.5 sm:p-1 ${t.dismissHover} rounded-full transition-colors duration-700 ${t.dismiss}`}
                        aria-label="Dismiss banner"
                      >
                        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Spacer — accounts for nav (64px) + visible banner */}
      <div
        className="transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ height: `${64 + (showBanner && !isDismissing ? BANNER_H : 0)}px` }}
      />
    </>
  )
}
