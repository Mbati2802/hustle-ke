'use client'

import Link from 'next/link'
import { usePostJobModal } from './components/PostJobModalContext'
import Header from './components/Header'
import Footer from './components/Footer'
import { usePageContent } from '@/hooks/usePageContent'
import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Bot, 
  Smartphone, 
  Shield, 
  Star, 
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Zap,
  Loader2,
  Briefcase,
  Quote,
  MessageSquare,
  DollarSign,
  Users,
  Search,
  Crown,
  Megaphone,
  Send,
  UserPlus,
  CheckCircle,
  Activity,
  Radio,
  Brain,
  type LucideIcon
} from 'lucide-react'

// Ad icon and color mappings for system-intelligence ads
const AD_ICONS: Record<string, LucideIcon> = {
  Briefcase, TrendingUp, DollarSign, Users, Zap, Shield, Smartphone, Crown, Search, Bot, Star, Megaphone,
}

const AD_COLORS: Record<string, { bg: string; border: string; icon: string; text: string; cta: string }> = {
  green:  { bg: 'from-green-50 to-emerald-50', border: 'border-green-200', icon: 'bg-green-600', text: 'text-green-900', cta: 'bg-green-600 hover:bg-green-700 text-white' },
  blue:   { bg: 'from-blue-50 to-indigo-50', border: 'border-blue-200', icon: 'bg-blue-600', text: 'text-blue-900', cta: 'bg-blue-600 hover:bg-blue-700 text-white' },
  purple: { bg: 'from-purple-50 to-pink-50', border: 'border-purple-200', icon: 'bg-purple-600', text: 'text-purple-900', cta: 'bg-purple-600 hover:bg-purple-700 text-white' },
  amber:  { bg: 'from-amber-50 to-yellow-50', border: 'border-amber-200', icon: 'bg-amber-600', text: 'text-amber-900', cta: 'bg-amber-600 hover:bg-amber-700 text-white' },
  red:    { bg: 'from-red-50 to-orange-50', border: 'border-red-200', icon: 'bg-red-600', text: 'text-red-900', cta: 'bg-red-600 hover:bg-red-700 text-white' },
  gray:   { bg: 'from-gray-50 to-slate-50', border: 'border-gray-200', icon: 'bg-gray-700', text: 'text-gray-900', cta: 'bg-gray-700 hover:bg-gray-800 text-white' },
}

const defaultContent = {
  hero_badge: "Kenya's Leading Freelance Marketplace",
  hero_title: "The Future of Work is Kenyan",
  hero_subtitle: "Connect with global clients. Get paid instantly via M-Pesa. Only 6% service fee. Join the revolution of African talent.",
  hero_cta_primary: "Start Hustling",
  hero_cta_primary_link: "/signup?type=freelancer",
  hero_cta_secondary: "Hire Talent",
  hero_cta_secondary_link: "/signup?type=client",
  stats: [
    { value: '10K+', label: 'Freelancers' },
    { value: 'KES 50M+', label: 'Paid Out' },
    { value: '2K+', label: 'Jobs Completed' },
  ],
  trust_partners: ['Safaricom', 'Standard Bank', 'Google Developers', 'Techno', 'Andela', 'iHub Nairobi'],
  value_props_title: 'Why Choose HustleKE?',
  value_props_subtitle: 'Built for Kenyans, by Kenyans. We understand the local hustle.',
  value_props: [
    { title: 'AI Power', description: 'Our AI polishes your proposals, optimizes your profile, and matches you with perfect jobs automatically.', features: ['Smart proposal enhancement', 'Profile optimization', 'Job matching algorithm'] },
    { title: 'Instant M-Pesa', description: 'Get paid directly to your M-Pesa instantly. No waiting 5 days like other platforms. Your money, when you need it.', features: ['Instant withdrawals', 'Secure escrow system', 'Only 6% service fee'] },
    { title: 'Verified Talent', description: 'Every freelancer is verified with ID checks and skill tests. Our Hustle Score system ensures quality.', features: ['ID verification', 'Skill testing', 'Hustle Score trust system'] },
  ],
    cta_title: 'Ready to Start Your Hustle?',
  cta_subtitle: 'Join thousands of Kenyans earning through their skills. Connect with clients, get paid instantly, and build your future.',
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

// Animated counter hook for live stats
function useAnimatedCounter(target: number, duration = 1800) {
  const [count, setCount] = useState(0)
  const prevTarget = useRef(0)
  useEffect(() => {
    if (target === prevTarget.current) return
    const start = prevTarget.current
    prevTarget.current = target
    const startTime = performance.now()
    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(start + (target - start) * eased))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return count
}

const HERO_ROTATIONS = [
  { line1: "Hire Kenya\u2019s Best", word: 'Designers', color: 'from-pink-400 to-rose-500', subtitle: 'Get paid via M-Pesa. Escrow-protected. Only 6% fee. The freelance platform built for Kenya.' },
  { line1: 'Find World-Class', word: 'Developers', color: 'from-blue-400 to-cyan-500', subtitle: 'Post a job in 60 seconds. Get proposals within hours. Hire with confidence through secure escrow.' },
  { line1: 'Work With Top', word: 'Writers', color: 'from-amber-400 to-orange-500', subtitle: 'AI-powered matching. ID-verified talent. Instant M-Pesa payouts. No hidden fees, ever.' },
  { line1: 'Connect With Expert', word: 'Marketers', color: 'from-purple-400 to-violet-500', subtitle: 'From Nairobi to Mombasa \u2014 Kenya\u2019s top freelancers are here. Your next hire is one click away.' },
  { line1: 'Discover Talented', word: 'Consultants', color: 'from-emerald-400 to-green-500', subtitle: 'Secure escrow payments. Hustle Score trust system. Build your freelance career in Kenya.' },
  { line1: 'Engage Elite', word: 'Creatives', color: 'from-red-400 to-pink-500', subtitle: 'Join thousands of Kenyans earning through their skills. The future of work is here.' },
]

export default function LandingPage() {
  const { openModal } = usePostJobModal()
  const content = usePageContent('homepage', defaultContent)
  const [featuredTalent, setFeaturedTalent] = useState<any[]>([])
  const [talentLoading, setTalentLoading] = useState(true)
  const [featuredReviews, setFeaturedReviews] = useState<any[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [internalAds, setInternalAds] = useState<any[]>([])
  const [adsLoading, setAdsLoading] = useState(true)
  const [liveFeed, setLiveFeed] = useState<any[]>([])
  const [liveStats, setLiveStats] = useState<any>(null)
  const [feedLoading, setFeedLoading] = useState(true)
  const [visibleFeedIndex, setVisibleFeedIndex] = useState(0)
  const feedIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [careerSkills, setCareerSkills] = useState<any[]>([])
  const [heroIndex, setHeroIndex] = useState(0)
  const [isHeroTransitioning, setIsHeroTransitioning] = useState(false)

  // Animated live counters
  const animatedJobs = useAnimatedCounter(liveStats?.active_jobs || 0)
  const animatedMembers = useAnimatedCounter(liveStats?.new_members_this_week || 0)
  const animatedPaidOut = useAnimatedCounter(liveStats?.total_paid_out || 0)
  const animatedCompleted = useAnimatedCounter(liveStats?.total_completed || 0)
  const animatedTotalMembers = useAnimatedCounter(liveStats?.total_members || 0)

  // Rotate hero content (line1, word, subtitle all change together)
  useEffect(() => {
    const interval = setInterval(() => {
      setIsHeroTransitioning(true)
      setTimeout(() => {
        setHeroIndex(prev => (prev + 1) % HERO_ROTATIONS.length)
        setIsHeroTransitioning(false)
      }, 400)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Fetch featured talent (top 4 freelancers by hustle score)
  useEffect(() => {
    const fetchFeaturedTalent = async () => {
      try {
        // Fetch top freelancers (without verified filter for now)
        const talentRes = await fetch('/api/talent?sort=score&limit=4')
        const talentData = await talentRes.json()
        
        if (talentData.profiles && talentData.profiles.length > 0) {
          // Get ratings for each freelancer
          const profilesWithRatings = await Promise.all(
            talentData.profiles.map(async (profile: any) => {
              try {
                const reviewsRes = await fetch(`/api/reviews/${profile.id}`)
                const reviewsData = await reviewsRes.json()
                return {
                  ...profile,
                  average_rating: reviewsData.stats?.average_rating || 0,
                  total_reviews: reviewsData.stats?.total_reviews || 0
                }
              } catch {
                return {
                  ...profile,
                  average_rating: 0,
                  total_reviews: 0
                }
              }
            })
          )
          setFeaturedTalent(profilesWithRatings)
        }
      } catch (error) {
        console.error('Failed to fetch featured talent:', error)
      } finally {
        setTalentLoading(false)
      }
    }

    fetchFeaturedTalent()
  }, [])

  // Fetch featured reviews (top 8 reviews)
  useEffect(() => {
    const fetchFeaturedReviews = async () => {
      try {
        const res = await fetch('/api/reviews/featured?limit=8&min_rating=4')
        const data = await res.json()
        if (data.reviews) {
          setFeaturedReviews(data.reviews)
        }
      } catch (error) {
        console.error('Failed to fetch featured reviews:', error)
      } finally {
        setReviewsLoading(false)
      }
    }
    fetchFeaturedReviews()
  }, [])

  // Fetch internal ads (system-intelligence generated)
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await fetch('/api/internal-ads?limit=6&audience=all')
        const data = await res.json()
        if (data.ads) setInternalAds(data.ads)
      } catch (error) {
        console.error('Failed to fetch internal ads:', error)
      } finally {
        setAdsLoading(false)
      }
    }
    fetchAds()
  }, [])

  // Fetch live feed data
  useEffect(() => {
    const fetchLiveFeed = async () => {
      try {
        const res = await fetch('/api/live-feed')
        const data = await res.json()
        if (data.events) setLiveFeed(data.events)
        if (data.stats) setLiveStats(data.stats)
      } catch (error) {
        console.error('Failed to fetch live feed:', error)
      } finally {
        setFeedLoading(false)
      }
    }
    fetchLiveFeed()
    // Refresh every 60 seconds
    const refresh = setInterval(fetchLiveFeed, 60000)
    return () => clearInterval(refresh)
  }, [])

  // Fetch career intelligence top skills for teaser
  useEffect(() => {
    const fetchCareerSkills = async () => {
      try {
        const res = await fetch('/api/career-intelligence')
        const data = await res.json()
        if (data.skills) setCareerSkills(data.skills)
      } catch (error) {
        console.error('Failed to fetch career skills:', error)
      }
    }
    fetchCareerSkills()
  }, [])

  // Auto-cycle through feed events
  useEffect(() => {
    if (liveFeed.length <= 1) return
    feedIntervalRef.current = setInterval(() => {
      setVisibleFeedIndex(prev => (prev + 1) % liveFeed.length)
    }, 3500)
    return () => { if (feedIntervalRef.current) clearInterval(feedIntervalRef.current) }
  }, [liveFeed.length])

  const currentRotation = HERO_ROTATIONS[heroIndex]

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* ═══════════════════ HERO SECTION ═══════════════════ */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        <style jsx>{`
          @keyframes hk-hero-fade-up { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
          @keyframes hk-hero-scale-in { from { opacity:0; transform:scale(0.92) translateY(16px); } to { opacity:1; transform:scale(1) translateY(0); } }
          @keyframes hk-hero-glow-btn { 0%,100% { box-shadow:0 0 20px rgba(34,197,94,0.25), 0 0 60px rgba(34,197,94,0.08); } 50% { box-shadow:0 0 30px rgba(34,197,94,0.45), 0 0 80px rgba(34,197,94,0.15); } }
          @keyframes hk-hero-ring-ping { 0% { transform:scale(1); opacity:0.6; } 100% { transform:scale(2.5); opacity:0; } }
          @keyframes hk-hero-word-in { 0% { opacity:0; transform:translateY(100%) rotateX(-40deg); filter:blur(4px); } 100% { opacity:1; transform:translateY(0) rotateX(0deg); filter:blur(0); } }
          @keyframes hk-hero-word-out { 0% { opacity:1; transform:translateY(0) rotateX(0deg); filter:blur(0); } 100% { opacity:0; transform:translateY(-100%) rotateX(40deg); filter:blur(4px); } }
          @keyframes hk-hero-marquee-scroll { 0% { transform:translateX(0); } 100% { transform:translateX(-50%); } }
          @keyframes hk-hero-float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); } }

          .hk3-anim { opacity:0; animation: hk-hero-fade-up 0.75s cubic-bezier(0.16,1,0.3,1) forwards; }
          .hk3-d1 { animation-delay:0.08s; }
          .hk3-d2 { animation-delay:0.18s; }
          .hk3-d3 { animation-delay:0.3s; }
          .hk3-d4 { animation-delay:0.42s; }
          .hk3-d5 { animation-delay:0.55s; }

          .hk3-word-enter { animation: hk-hero-word-in 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
          .hk3-word-exit { animation: hk-hero-word-out 0.4s cubic-bezier(0.7,0,0.84,0) forwards; }
          .hk3-ring { animation: hk-hero-ring-ping 2s ease-out infinite; }
          .hk3-glow-btn { animation: hk-hero-glow-btn 2.5s ease-in-out infinite; }
          .hk3-card-enter { opacity:0; animation: hk-hero-scale-in 0.9s cubic-bezier(0.16,1,0.3,1) forwards; animation-delay:0.5s; }
          .hk3-float { animation: hk-hero-float 5s ease-in-out infinite; }
          .hk3-marquee { animation: hk-hero-marquee-scroll 35s linear infinite; }
          .hk3-marquee:hover { animation-play-state:paused; }
        `}</style>

        {/* ── Background ── */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        </div>
        <div className="absolute top-20 right-20 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />

        {/* ── Content — Split Layout ── */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* ── Left: Text ── */}
            <div className="text-center lg:text-left">
              {/* Live badge */}
              <div className="hk3-anim hk3-d1 inline-flex items-center gap-2 bg-green-500/15 text-green-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="hk3-ring absolute inline-flex h-full w-full rounded-full bg-green-400" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                </span>
                {liveStats?.active_jobs ? `${animatedJobs} jobs live now` : content.hero_badge}
              </div>

              {/* Headline — both lines rotate */}
              <h1 className="hk3-anim hk3-d2 text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
                <span
                  className={`block transition-all duration-300 ${isHeroTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}
                >
                  {currentRotation.line1}
                </span>
                <span className="relative inline-flex items-center h-[1.2em] overflow-hidden align-bottom">
                  <span
                    key={heroIndex}
                    className={`inline-block bg-gradient-to-r ${currentRotation.color} bg-clip-text text-transparent ${isHeroTransitioning ? 'hk3-word-exit' : 'hk3-word-enter'}`}
                    style={{ willChange: 'transform, opacity, filter' }}
                  >
                    {currentRotation.word}
                  </span>
                </span>
              </h1>

              {/* Rotating subtitle */}
              <p
                className={`hk3-anim hk3-d3 text-base sm:text-lg text-gray-300 mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0 transition-all duration-300 ${isHeroTransitioning ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}
              >
                {currentRotation.subtitle}
              </p>

              {/* CTAs */}
              <div className="hk3-anim hk3-d4 flex flex-row gap-3 sm:gap-4 mb-8 justify-center lg:justify-start">
                <Link
                  href={content.hero_cta_primary_link}
                  className="hk3-glow-btn group inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl font-semibold transition-colors text-sm sm:text-base"
                >
                  {content.hero_cta_primary}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
                <button
                  onClick={() => openModal()}
                  className="group inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl font-medium transition-colors text-sm sm:text-base"
                >
                  {content.hero_cta_secondary}
                  <Briefcase className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                </button>
              </div>

              {/* Trust indicators */}
              <div className="hk3-anim hk3-d5 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>M-Pesa Payouts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Escrow Protected</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-green-500" />
                  <span>Only 6% Fee</span>
                </div>
              </div>
            </div>

            {/* ── Right: Live Platform Card ── */}
            <div className="hidden lg:block hk3-card-enter">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-3xl blur-xl" />
                <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-auto">
                  {/* Card header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">HustleKE Platform</h3>
                      <p className="text-xs text-gray-500">Live overview</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5 bg-green-50 px-2.5 py-1 rounded-full">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="hk3-ring absolute inline-flex h-full w-full rounded-full bg-green-400" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                      </span>
                      <span className="text-green-600 text-[10px] font-semibold">Live</span>
                    </div>
                  </div>

                  {/* Live stats grid */}
                  {liveStats ? (
                    <div className="grid grid-cols-3 gap-2.5 mb-5">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-lg font-bold text-gray-900">{animatedJobs}</div>
                        <div className="text-[10px] text-gray-500">Open Jobs</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-lg font-bold text-gray-900">{animatedTotalMembers}</div>
                        <div className="text-[10px] text-gray-500">Members</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-lg font-bold text-green-600">{animatedCompleted}</div>
                        <div className="text-[10px] text-gray-500">Completed</div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2.5 mb-5">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-3 animate-pulse">
                          <div className="h-5 bg-gray-200 rounded w-10 mx-auto mb-1" />
                          <div className="h-3 bg-gray-100 rounded w-14 mx-auto" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Live activity feed */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-gray-500 font-medium">Live Activity</p>
                      <div className="flex items-center gap-1">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="hk3-ring absolute inline-flex h-full w-full rounded-full bg-red-400" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                        </span>
                        <span className="text-[10px] text-red-500 font-semibold">Live</span>
                      </div>
                    </div>
                    {feedLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2.5 bg-gray-50 rounded-lg px-3 py-2 animate-pulse">
                          <div className="w-7 h-7 bg-gray-200 rounded-lg shrink-0" />
                          <div className="flex-1"><div className="h-3 bg-gray-200 rounded w-3/4" /></div>
                        </div>
                      ))
                    ) : liveFeed.length > 0 ? (
                      liveFeed.slice(0, 4).map((event) => {
                        const FEED_ICONS: Record<string, LucideIcon> = { Briefcase, Send, CheckCircle, DollarSign, UserPlus, TrendingUp }
                        const FEED_ICON_BG: Record<string, string> = { green: 'bg-green-500', blue: 'bg-blue-500', amber: 'bg-amber-500', purple: 'bg-purple-500', red: 'bg-red-500' }
                        const Icon = FEED_ICONS[event.icon] || Activity
                        const iconBg = FEED_ICON_BG[event.color] || 'bg-green-500'
                        return (
                          <div key={event.id} className="flex items-center gap-2.5 bg-gray-50 rounded-lg px-3 py-2">
                            <div className={`w-7 h-7 ${iconBg} rounded-lg flex items-center justify-center shrink-0`}>
                              <Icon className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-700 font-medium truncate">{event.message}</p>
                              <p className="text-[10px] text-gray-400 truncate">{event.detail}</p>
                            </div>
                            <span className="text-[9px] text-gray-400 shrink-0">{getTimeAgo(event.timestamp)}</span>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-xs text-gray-400">Activity will appear here</p>
                      </div>
                    )}
                  </div>

                  {/* Trust badges */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                    <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-600 border border-green-200 px-2 py-1 rounded-full font-medium">
                      <Shield className="w-3 h-3" /> Escrow
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-1 rounded-full font-medium">
                      <Smartphone className="w-3 h-3" /> M-Pesa
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] bg-purple-50 text-purple-600 border border-purple-200 px-2 py-1 rounded-full font-medium">
                      <Bot className="w-3 h-3" /> AI Powered
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FEATURES STRIP (replaced trust partners) ═══════════════════ */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
              { icon: Smartphone, label: 'Instant M-Pesa Payouts', desc: 'Get paid in seconds', color: 'text-green-600', bg: 'bg-green-50' },
              { icon: Shield, label: 'Escrow Protection', desc: 'Funds held securely', color: 'text-blue-600', bg: 'bg-blue-50' },
              { icon: Bot, label: 'AI-Powered Matching', desc: 'Smart job recommendations', color: 'text-purple-600', bg: 'bg-purple-50' },
              { icon: Star, label: 'Verified Talent', desc: 'ID-checked freelancers', color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{f.label}</p>
                  <p className="text-xs text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {content.value_props_title}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {content.value_props_subtitle}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {content.value_props.map((prop: { title: string; description: string; features: string[] }, i: number) => {
              const icons = [Bot, Smartphone, Shield]
              const colors = [
                { bg: 'from-blue-50 to-indigo-50', border: 'border-blue-100', icon: 'bg-blue-600', check: 'text-blue-600' },
                { bg: 'from-green-50 to-emerald-50', border: 'border-green-100', icon: 'bg-green-600', check: 'text-green-600' },
                { bg: 'from-purple-50 to-pink-50', border: 'border-purple-100', icon: 'bg-purple-600', check: 'text-purple-600' },
              ]
              const Icon = icons[i] || Bot
              const color = colors[i] || colors[0]
              return (
                <div key={prop.title} className={`bg-gradient-to-br ${color.bg} rounded-2xl p-8 border ${color.border}`}>
                  <div className={`w-14 h-14 ${color.icon} rounded-xl flex items-center justify-center mb-6`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{prop.title}</h3>
                  <p className="text-gray-600 mb-4">{prop.description}</p>
                  <ul className="space-y-2">
                    {prop.features.map((f: string) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 className={`w-4 h-4 ${color.check}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured Talent */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Featured Talent
              </h2>
              <p className="text-xl text-gray-600">
                Top-rated freelancers ready to work on your projects
              </p>
            </div>
            <Link 
              href="/talent"
              className="hidden md:flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold"
            >
              View All Talent
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {talentLoading ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-gray-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="h-4 bg-gray-200 rounded w-12" />
                    <div className="h-4 bg-gray-200 rounded w-20" />
                  </div>
                </div>
              ))
            ) : featuredTalent.length > 0 ? (
              featuredTalent.map((talent) => (
                <Link
                  key={talent.id}
                  href={`/talent/${talent.id}`}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all border border-gray-100 block group overflow-hidden"
                >
                  {/* Top color accent */}
                  <div className="h-1.5 bg-gradient-to-r from-green-500 to-emerald-400" />

                  <div className="p-5">
                    {/* Avatar + Name */}
                    <div className="flex items-center gap-3 mb-3">
                      {talent.avatar_url ? (
                        <img
                          src={talent.avatar_url}
                          alt={talent.full_name}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-green-100"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg ring-2 ring-green-100">
                          {talent.full_name?.charAt(0)?.toUpperCase() || 'T'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold text-gray-900 truncate group-hover:text-green-600 transition-colors">{talent.full_name || 'Anonymous'}</h3>
                          {talent.verification_status === 'ID-Verified' && (
                            <Shield className="w-4 h-4 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{talent.title || 'Freelancer'}</p>
                      </div>
                    </div>

                    {/* Bio snippet */}
                    {talent.bio && (
                      <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">{talent.bio}</p>
                    )}

                    {/* Skills */}
                    {talent.skills && talent.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {talent.skills.slice(0, 3).map((skill: string) => (
                          <span key={skill} className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            {skill}
                          </span>
                        ))}
                        {talent.skills.length > 3 && (
                          <span className="text-[10px] text-gray-400 px-1 py-0.5">+{talent.skills.length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      {talent.jobs_completed > 0 && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {talent.jobs_completed} job{talent.jobs_completed !== 1 ? 's' : ''}
                        </span>
                      )}
                      {talent.hustle_score > 0 && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          Score {talent.hustle_score}
                        </span>
                      )}
                      {talent.is_pro && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">PRO</span>
                      )}
                    </div>

                    {/* Rating + Rate */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-semibold text-gray-900 text-sm">
                          {talent.average_rating > 0 ? talent.average_rating.toFixed(1) : 'New'}
                        </span>
                        {talent.total_reviews > 0 && (
                          <span className="text-[10px] text-gray-400">({talent.total_reviews})</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-green-600 font-bold text-sm">
                          {talent.hourly_rate ? `KES ${talent.hourly_rate.toLocaleString()}` : 'Negotiable'}
                        </span>
                        {talent.hourly_rate ? <span className="text-gray-400 text-xs">/hr</span> : null}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <Shield className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No featured talent yet</p>
                <p className="text-sm text-gray-400 mt-1">Check back soon for top-rated freelancers</p>
              </div>
            )}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link 
              href="/talent"
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold"
            >
              View All Talent
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Reviews */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                Client Reviews
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                What Clients Are Saying
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl">
                Real reviews from real clients about our talented freelancers
              </p>
            </div>
            <Link
              href="/reviews"
              className="hidden md:flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold"
            >
              View All Reviews
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {reviewsLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-2xl p-5 animate-pulse">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} className="w-4 h-4 bg-gray-200 rounded" />
                    ))}
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-4/5 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-4" />
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                    <div className="w-6 h-6 bg-gray-200 rounded-full" />
                    <div className="h-3 bg-gray-200 rounded w-28" />
                  </div>
                </div>
              ))
            ) : featuredReviews.length > 0 ? (
              featuredReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col relative group"
                >
                  {/* Quote icon */}
                  <Quote className="w-8 h-8 text-green-100 absolute top-4 right-4" />

                  {/* Star rating */}
                  <div className="flex items-center gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                      />
                    ))}
                    {review.rating === 5 && (
                      <span className="ml-1.5 text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">Excellent</span>
                    )}
                  </div>

                  {/* Review text */}
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4 flex-1">
                    &ldquo;{review.comment}&rdquo;
                  </p>

                  {/* Job tag */}
                  {review.job?.title && (
                    <div className="mb-3">
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full truncate inline-block max-w-full">
                        {review.job.title}
                      </span>
                    </div>
                  )}

                  {/* Reviewed freelancer */}
                  {review.reviewee && (
                    <Link
                      href={`/talent/${review.reviewee.id}`}
                      className="mt-3 flex items-center gap-2 bg-green-50/50 rounded-lg px-3 py-2 hover:bg-green-50 transition-colors"
                    >
                      {review.reviewee.avatar_url ? (
                        <img src={review.reviewee.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-[10px]">
                          {review.reviewee.full_name?.charAt(0)?.toUpperCase() || 'F'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="text-xs text-gray-600 truncate block">
                          Review for <span className="font-medium text-green-700">{review.reviewee.full_name}</span>
                        </span>
                      </div>
                      {review.reviewee.verification_status === 'ID-Verified' && (
                        <Shield className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      )}
                    </Link>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No reviews yet</p>
                <p className="text-sm text-gray-400 mt-1">Reviews will appear here as freelancers complete jobs</p>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* System Intelligence — Internal Ads */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Animated CSS */}
        <style jsx>{`
          @keyframes hk-float-1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-40px) scale(1.1); } }
          @keyframes hk-float-2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-40px,30px) scale(1.15); } }
          @keyframes hk-float-3 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px,50px) scale(1.05); } }
          @keyframes hk-pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); } 70% { box-shadow: 0 0 0 12px rgba(34,197,94,0); } 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); } }
          @keyframes hk-card-in { from { opacity:0; transform: translateY(32px) scale(0.97); } to { opacity:1; transform: translateY(0) scale(1); } }
          @keyframes hk-icon-bounce { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
          @keyframes hk-shimmer-sweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
          @keyframes hk-badge-glow { 0%,100% { box-shadow: 0 0 8px rgba(34,197,94,0.3); } 50% { box-shadow: 0 0 24px rgba(34,197,94,0.6); } }
          .hk-orb-1 { animation: hk-float-1 8s ease-in-out infinite; }
          .hk-orb-2 { animation: hk-float-2 10s ease-in-out infinite; }
          .hk-orb-3 { animation: hk-float-3 12s ease-in-out infinite; }
          .hk-ad-card { animation: hk-card-in 0.6s ease-out both; }
          .hk-ad-card:nth-child(1) { animation-delay: 0.05s; }
          .hk-ad-card:nth-child(2) { animation-delay: 0.15s; }
          .hk-ad-card:nth-child(3) { animation-delay: 0.25s; }
          .hk-ad-card:nth-child(4) { animation-delay: 0.35s; }
          .hk-ad-card:nth-child(5) { animation-delay: 0.45s; }
          .hk-ad-card:nth-child(6) { animation-delay: 0.55s; }
          .hk-ad-icon { animation: hk-icon-bounce 2s ease-in-out infinite; }
          .hk-ad-card:nth-child(2) .hk-ad-icon { animation-delay: 0.3s; }
          .hk-ad-card:nth-child(3) .hk-ad-icon { animation-delay: 0.6s; }
          .hk-ad-card:nth-child(4) .hk-ad-icon { animation-delay: 0.9s; }
          .hk-ad-card:nth-child(5) .hk-ad-icon { animation-delay: 1.2s; }
          .hk-ad-card:nth-child(6) .hk-ad-icon { animation-delay: 1.5s; }
          .hk-badge-pulse { animation: hk-badge-glow 2s ease-in-out infinite; }
          .hk-ad-card .hk-shimmer { position:absolute; inset:0; overflow:hidden; border-radius:1rem; pointer-events:none; }
          .hk-ad-card .hk-shimmer::after { content:''; position:absolute; top:0; left:0; width:100%; height:100%; background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%); animation: hk-shimmer-sweep 3s ease-in-out infinite; }
          .hk-ad-card:nth-child(2) .hk-shimmer::after { animation-delay: 0.5s; }
          .hk-ad-card:nth-child(3) .hk-shimmer::after { animation-delay: 1s; }
          .hk-ad-card:nth-child(4) .hk-shimmer::after { animation-delay: 1.5s; }
          .hk-ad-card:nth-child(5) .hk-shimmer::after { animation-delay: 2s; }
          .hk-ad-card:nth-child(6) .hk-shimmer::after { animation-delay: 2.5s; }
          .hk-ad-card:hover { transform: translateY(-4px) scale(1.02); }
        `}</style>

        {/* Floating gradient orbs */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-green-500/10 rounded-full blur-3xl hk-orb-1" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl hk-orb-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl hk-orb-3" />

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4 hk-badge-pulse">
              <Zap className="w-4 h-4 animate-pulse" />
              Powered by HustleKE Intelligence
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Opportunities For You
            </h2>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              Personalized highlights from across the platform, updated in real time
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {adsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 animate-pulse">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl" />
                    <div className="flex-1">
                      <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-white/5 rounded w-full mb-1" />
                      <div className="h-3 bg-white/5 rounded w-2/3" />
                    </div>
                  </div>
                  <div className="h-9 bg-white/10 rounded-lg w-28" />
                </div>
              ))
            ) : internalAds.length > 0 ? (
              internalAds.map((ad) => {
                const colors = AD_COLORS[ad.color_scheme] || AD_COLORS.green
                const IconComponent = AD_ICONS[ad.icon] || Zap
                return (
                  <div
                    key={ad.id}
                    className={`hk-ad-card relative bg-gradient-to-br ${colors.bg} rounded-2xl p-6 border ${colors.border} shadow-lg transition-all duration-300 group cursor-pointer`}
                  >
                    <div className="hk-shimmer" />
                    <div className="relative z-10">
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`hk-ad-icon w-12 h-12 ${colors.icon} rounded-xl flex items-center justify-center shrink-0 shadow-lg`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div className="min-w-0">
                          <h3 className={`font-bold ${colors.text} mb-1 leading-tight`}>{ad.title}</h3>
                          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{ad.description}</p>
                        </div>
                      </div>
                      <Link
                        href={ad.cta_link || '/'}
                        className={`inline-flex items-center gap-2 ${colors.cta} px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg`}
                      >
                        {ad.cta_text || 'Learn More'}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </Link>

                      {ad.is_system_generated && (
                        <div className="mt-3 flex items-center gap-1 text-[10px] text-gray-400">
                          <Zap className="w-3 h-3 animate-pulse" />
                          AI recommended
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <Megaphone className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50 font-medium">No highlights right now</p>
                <p className="text-sm text-white/30 mt-1">Check back soon for personalized recommendations</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in minutes. Whether you are hiring or hustling, we have made it simple.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                step: '01',
                title: 'Create Profile',
                description: 'Sign up and build your profile. Add your skills, portfolio, and verify your ID.',
                icon: TrendingUp,
              },
              {
                step: '02',
                title: 'Post or Apply',
                description: 'Clients post jobs with AI assistance. Freelancers apply with enhanced proposals.',
                icon: Bot,
              },
              {
                step: '03',
                title: 'Secure Escrow',
                description: 'Funds held securely in escrow. Client pays via M-Pesa, freelancer gets instant assurance.',
                icon: Shield,
              },
              {
                step: '04',
                title: 'Get Paid Instantly',
                description: 'Work delivered, client approves, money hits your M-Pesa instantly. No waiting!',
                icon: Smartphone,
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-4xl sm:text-6xl font-bold text-gray-100 mb-2 sm:mb-4">{item.step}</div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                  <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">{item.title}</h3>
                <p className="text-sm sm:text-base text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Hustle Feed — Real-time platform activity */}
      <section className="py-20 bg-white relative overflow-hidden">
        <style jsx>{`
          @keyframes hk-feed-in { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform: translateY(0); } }
          @keyframes hk-feed-out { from { opacity:1; transform: translateY(0); } to { opacity:0; transform: translateY(-16px); } }
          @keyframes hk-live-dot { 0%,100% { opacity:1; transform: scale(1); } 50% { opacity:0.5; transform: scale(0.7); } }
          @keyframes hk-counter-tick { 0% { transform: translateY(100%); opacity:0; } 15% { transform: translateY(0); opacity:1; } 85% { transform: translateY(0); opacity:1; } 100% { transform: translateY(-100%); opacity:0; } }
          @keyframes hk-marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .hk-live-dot { animation: hk-live-dot 1.5s ease-in-out infinite; }
          .hk-feed-event { animation: hk-feed-in 0.5s ease-out; }
          .hk-marquee-track { animation: hk-marquee 30s linear infinite; }
          .hk-marquee-track:hover { animation-play-state: paused; }
        `}</style>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="hk-live-dot absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
                Live Activity
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                The Hustle is <span className="text-green-600">Happening Now</span>
              </h2>
              <p className="text-lg text-gray-500 max-w-lg">
                Real activity from the platform right now. Jobs posted, talent hired, money earned.
              </p>
            </div>

            {/* Live stats counters */}
            {liveStats && (
              <div className="flex gap-6 mt-6 md:mt-0">
                {liveStats.active_jobs > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{liveStats.active_jobs}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide font-medium">Open Jobs</div>
                  </div>
                )}
                {liveStats.new_members_this_week > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">+{liveStats.new_members_this_week}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide font-medium">New This Week</div>
                  </div>
                )}
                {liveStats.total_paid_out > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">KES {(liveStats.total_paid_out / 1000).toFixed(0)}K+</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide font-medium">Paid Out</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Scrolling marquee ticker */}
          {!feedLoading && liveFeed.length > 0 && (
            <div className="relative mb-10 overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 py-4">
              <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-900 to-transparent z-10" />
              <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-800 to-transparent z-10" />
              <div className="hk-marquee-track flex items-center gap-8 whitespace-nowrap px-4">
                {[...liveFeed, ...liveFeed].map((event, i) => {
                  const FEED_ICONS: Record<string, LucideIcon> = { Briefcase, Send, CheckCircle, DollarSign, UserPlus, TrendingUp }
                  const FEED_COLORS: Record<string, string> = { green: 'text-green-400', blue: 'text-blue-400', amber: 'text-amber-400', purple: 'text-purple-400', red: 'text-red-400' }
                  const Icon = FEED_ICONS[event.icon] || Activity
                  const color = FEED_COLORS[event.color] || 'text-green-400'
                  return (
                    <div key={`${event.id}-${i}`} className="flex items-center gap-2.5 shrink-0">
                      <Icon className={`w-4 h-4 ${color} shrink-0`} />
                      <span className="text-sm text-white/90 font-medium">{event.message}</span>
                      <span className="text-xs text-white/40">{event.detail}</span>
                      <span className="text-white/10 mx-2">|</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Feed cards grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feedLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-3.5 bg-gray-200 rounded w-3/4 mb-1.5" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))
            ) : liveFeed.length > 0 ? (
              liveFeed.slice(0, 6).map((event, idx) => {
                const FEED_ICONS: Record<string, LucideIcon> = { Briefcase, Send, CheckCircle, DollarSign, UserPlus, TrendingUp }
                const FEED_BG: Record<string, string> = {
                  green: 'bg-green-50 border-green-100',
                  blue: 'bg-blue-50 border-blue-100',
                  amber: 'bg-amber-50 border-amber-100',
                  purple: 'bg-purple-50 border-purple-100',
                }
                const FEED_ICON_BG: Record<string, string> = {
                  green: 'bg-green-500',
                  blue: 'bg-blue-500',
                  amber: 'bg-amber-500',
                  purple: 'bg-purple-500',
                }
                const Icon = FEED_ICONS[event.icon] || Activity
                const bg = FEED_BG[event.color] || FEED_BG.green
                const iconBg = FEED_ICON_BG[event.color] || FEED_ICON_BG.green
                const timeAgo = getTimeAgo(event.timestamp)
                return (
                  <div
                    key={event.id}
                    className={`hk-feed-event ${bg} border rounded-xl p-4 hover:shadow-md transition-all duration-300`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{event.message}</p>
                        <p className="text-xs text-gray-500 truncate">{event.detail}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0 whitespace-nowrap">{timeAgo}</span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-full text-center py-8">
                <Activity className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Activity will appear here as the platform grows</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Career Intelligence Teaser */}
      <section className="py-16 bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <Brain className="w-4 h-4" />
                AI-Powered — Only on HustleKE
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Career Intelligence
              </h2>
              <p className="text-gray-300 mb-6 max-w-md">
                Know which skills pay the most. See where demand beats supply. Get AI-powered earnings projections based on real market data. No other platform offers this.
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="text-xs bg-white/10 text-white/80 px-3 py-1.5 rounded-full">Skills Demand Map</span>
                <span className="text-xs bg-white/10 text-white/80 px-3 py-1.5 rounded-full">Earnings Simulator</span>
                <span className="text-xs bg-white/10 text-white/80 px-3 py-1.5 rounded-full">Market Trends</span>
                <span className="text-xs bg-white/10 text-white/80 px-3 py-1.5 rounded-full">Competition Analysis</span>
              </div>
              <Link
                href="/career-intelligence"
                className="inline-flex items-center gap-2 bg-white text-purple-700 hover:bg-purple-50 px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                <Brain className="w-5 h-5" />
                Explore Career Intelligence
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="w-full md:w-80 shrink-0">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50 uppercase tracking-wide font-medium">Top Opportunity</span>
                  <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-medium">Hot</span>
                </div>
                {careerSkills.length > 0 ? (
                  careerSkills.slice(0, 3).map((s: any, i: number) => (
                    <div key={s.skill} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-green-500/20 text-green-400' : i === 1 ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {s.opportunityScore}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{s.skill}</p>
                        <p className="text-[10px] text-white/40">{s.demand} jobs · KES {s.avgBudget.toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 text-white/20 mx-auto animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-green-600 to-green-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            {content.cta_title}
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            {content.cta_subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/signup?type=freelancer"
              className="bg-white text-green-700 hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold text-lg transition-all"
            >
              I am a Freelancer
            </Link>
            <Link 
              href="/signup?type=client"
              className="bg-green-500 text-white hover:bg-green-400 px-8 py-4 rounded-xl font-semibold text-lg transition-all"
            >
              I want to Hire
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
