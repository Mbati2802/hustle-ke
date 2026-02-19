'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import {
  BookOpen,
  Calendar,
  Eye,
  Search,
  ArrowRight,
  User,
  TrendingUp,
  Sparkles,
  Mail,
  CheckCircle2,
  Briefcase,
  CreditCard,
  Lightbulb,
  Star,
  Clock,
} from 'lucide-react'

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  cover_image: string | null
  category: string
  tags: string[]
  published_at: string
  views: number
  profiles: { full_name: string; avatar_url: string | null } | null
}

const categoryConfig: Record<string, { bg: string; text: string; icon: typeof BookOpen }> = {
  guides: { bg: 'bg-blue-100', text: 'text-blue-700', icon: BookOpen },
  payments: { bg: 'bg-green-100', text: 'text-green-700', icon: CreditCard },
  industry: { bg: 'bg-purple-100', text: 'text-purple-700', icon: TrendingUp },
  platform: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Star },
  tips: { bg: 'bg-teal-100', text: 'text-teal-700', icon: Lightbulb },
  general: { bg: 'bg-gray-100', text: 'text-gray-600', icon: BookOpen },
}

const topicCards = [
  { label: 'Getting Started', desc: 'New to freelancing?', icon: Sparkles, href: '/how-it-works' },
  { label: 'M-Pesa Payments', desc: 'Escrow & withdrawals', icon: CreditCard, href: '/how-it-works/escrow' },
  { label: 'Career Tips', desc: 'Grow your income', icon: TrendingUp, href: '/career-intelligence' },
  { label: 'Find Work', desc: 'Browse all jobs', icon: Briefcase, href: '/jobs' },
]

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeCategory) params.set('category', activeCategory)
      const res = await fetch(`/api/blog?${params.toString()}`)
      const data = await res.json()
      if (data.posts) setPosts(data.posts)
      if (data.categories) setCategories(data.categories)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [activeCategory])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const filteredPosts = searchQuery
    ? posts.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : posts

  const featuredPost = filteredPosts[0]
  const gridPosts = filteredPosts.slice(1)

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })
  const readTime = (text: string) => `${Math.max(3, Math.ceil((text?.length || 500) / 800))} min read`

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Hero with animated bg */}
      <section className="relative bg-gradient-to-br from-green-600 to-green-700 pt-16 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center text-white mb-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-medium">HustleKE Blog</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              Insights, Guides & Tips
            </h1>
            <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto mb-8">
              Everything you need to succeed as a freelancer in Kenya. Career tips, platform guides, and industry insights.
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-12 pr-4 py-3.5 sm:py-4 rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm shadow-lg"
              />
            </div>
          </div>

          {/* Quick topic cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {topicCards.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="group bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-5 text-center border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300"
              >
                <card.icon className="w-6 h-6 sm:w-8 sm:h-8 text-green-300 mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
                <p className="font-semibold text-white text-sm sm:text-base">{card.label}</p>
                <p className="text-xs text-green-200 mt-0.5 hidden sm:block">{card.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Category pills */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-5 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveCategory('')}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                !activeCategory ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Posts
            </button>
            {categories.map(cat => {
              const cfg = categoryConfig[cat] || categoryConfig.general
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors capitalize ${
                    activeCategory === cat ? 'bg-green-600 text-white shadow-md' : `${cfg.bg} ${cfg.text} hover:opacity-80`
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Featured post + grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {loading ? (
          <div className="space-y-8">
            {/* Featured skeleton */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
              <div className="md:flex">
                <div className="md:w-1/2 h-56 sm:h-64 md:h-80 bg-gray-100" />
                <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-center">
                  <div className="h-4 w-20 bg-gray-200 rounded-full mb-4" />
                  <div className="h-6 w-3/4 bg-gray-200 rounded mb-3" />
                  <div className="h-4 w-full bg-gray-100 rounded mb-2" />
                  <div className="h-4 w-2/3 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
            {/* Grid skeleton */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
                  <div className="h-44 bg-gray-100" />
                  <div className="p-5">
                    <div className="h-4 w-16 bg-gray-100 rounded-full mb-3" />
                    <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-full bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="space-y-10">
            {/* Featured post — large card */}
            {featuredPost && (
              <Link
                href={`/blog/${featuredPost.slug}`}
                className="group block bg-white rounded-2xl md:rounded-3xl border-2 border-gray-100 overflow-hidden hover:shadow-2xl hover:border-green-200 transition-all duration-500"
              >
                <div className="md:flex">
                  <div className="md:w-1/2 h-56 sm:h-64 md:h-80 bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center relative overflow-hidden">
                    {featuredPost.cover_image ? (
                      <img src={featuredPost.cover_image} alt={featuredPost.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <BookOpen className="w-16 h-16 text-green-300" />
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                        Featured
                      </span>
                    </div>
                  </div>
                  <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${(categoryConfig[featuredPost.category] || categoryConfig.general).bg} ${(categoryConfig[featuredPost.category] || categoryConfig.general).text}`}>
                        {featuredPost.category}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(featuredPost.published_at)}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {readTime(featuredPost.excerpt)}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 group-hover:text-green-600 transition-colors mb-3 leading-tight">
                      {featuredPost.title}
                    </h2>
                    {featuredPost.excerpt && (
                      <p className="text-gray-500 text-sm sm:text-base line-clamp-3 mb-4 leading-relaxed">{featuredPost.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        {featuredPost.profiles?.avatar_url ? (
                          <img src={featuredPost.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-green-600" />
                          </div>
                        )}
                        <span className="text-sm text-gray-600 font-medium">{featuredPost.profiles?.full_name || 'HustleKE Team'}</span>
                      </div>
                      <span className="text-green-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read Article <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid of remaining posts */}
            {gridPosts.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Latest Articles</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                  {gridPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="group bg-white rounded-2xl border-2 border-gray-100 overflow-hidden hover:shadow-xl hover:border-green-200 transition-all duration-500 hover:-translate-y-1"
                    >
                      <div className="h-44 sm:h-48 bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center relative overflow-hidden">
                        {post.cover_image ? (
                          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        ) : (
                          <BookOpen className="w-10 h-10 text-green-300" />
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${(categoryConfig[post.category] || categoryConfig.general).bg} ${(categoryConfig[post.category] || categoryConfig.general).text}`}>
                            {post.category}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {formatDate(post.published_at)}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors mb-2 text-base leading-snug line-clamp-2">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>
                        )}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            {post.profiles?.avatar_url ? (
                              <img src={post.profiles.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <User className="w-3 h-3 text-green-600" />
                              </div>
                            )}
                            <span className="text-xs text-gray-500">{post.profiles?.full_name || 'HustleKE Team'}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.views}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No articles found</h3>
            <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
              {searchQuery ? `No results for "${searchQuery}". Try a different search term.` : 'Check back soon for new content!'}
            </p>
            {(searchQuery || activeCategory) && (
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('') }}
                className="text-sm text-green-600 hover:text-green-700 font-semibold"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </section>

      {/* Newsletter Section */}
      <section className="py-12 sm:py-20 px-4 bg-gradient-to-br from-green-600 to-green-700 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-400/20 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-6">
            <Mail className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">Stay Updated</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Get the Latest Tips & Guides
          </h2>
          <p className="text-green-100 mb-8 max-w-xl mx-auto text-sm sm:text-base">
            Join thousands of Kenyan freelancers. Get career tips, platform updates, and industry insights delivered to your inbox.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto" onSubmit={(e) => { e.preventDefault(); if (email.trim()) { setEmail(''); setSubscribed(true) } }}>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setSubscribed(false) }}
              placeholder="Enter your email"
              className="flex-1 px-5 py-3.5 sm:py-4 rounded-xl border-0 focus:ring-2 focus:ring-white/50 text-gray-900 text-sm"
              required
            />
            <button type="submit" className="px-6 sm:px-8 py-3.5 sm:py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors whitespace-nowrap text-sm">
              Subscribe
            </button>
          </form>
          {subscribed ? (
            <p className="text-white text-sm mt-4 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> You&apos;re subscribed! We&apos;ll keep you updated.
            </p>
          ) : (
            <p className="text-green-200 text-sm mt-4">No spam, unsubscribe at any time</p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">Ready to Start Your Hustle?</h2>
          <p className="text-gray-600 mb-8 max-w-lg mx-auto">
            Join thousands of Kenyan freelancers earning via M-Pesa on HustleKE.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl font-bold transition-all hover:shadow-xl hover:scale-105"
            >
              Get Started Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/jobs"
              className="inline-flex items-center justify-center gap-2 border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-2xl font-semibold transition-all"
            >
              Browse Jobs
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap justify-center items-center gap-6 sm:gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> Free to join</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> No hidden fees</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> Instant M-Pesa payouts</div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
