'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import {
  BookOpen,
  Calendar,
  Eye,
  Tag,
  Search,
  ArrowRight,
  Loader2,
  Filter,
  User,
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

const categoryColors: Record<string, string> = {
  guides: 'bg-blue-100 text-blue-700',
  payments: 'bg-green-100 text-green-700',
  industry: 'bg-purple-100 text-purple-700',
  platform: 'bg-amber-100 text-amber-700',
  tips: 'bg-teal-100 text-teal-700',
  general: 'bg-gray-100 text-gray-600',
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

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

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-600 to-emerald-700 pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <BookOpen className="w-4 h-4" /> HustleKE Blog
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Insights, Guides & Tips
          </h1>
          <p className="text-green-100 text-lg max-w-2xl mx-auto mb-8">
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
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
            />
          </div>
        </div>
      </section>

      {/* Category filters */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
          <button
            onClick={() => setActiveCategory('')}
            className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors ${
              !activeCategory ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            All Posts
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors capitalize ${
                activeCategory === cat ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Blog posts grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-100" />
                <div className="p-5">
                  <div className="h-4 w-16 bg-gray-100 rounded-full mb-3" />
                  <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-full bg-gray-100 rounded mb-1" />
                  <div className="h-3 w-2/3 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post, i) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className={`group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-green-200 transition-all ${
                  i === 0 ? 'md:col-span-2 lg:col-span-2' : ''
                }`}
              >
                {/* Cover Image */}
                <div className={`bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center ${
                  i === 0 ? 'h-64' : 'h-48'
                }`}>
                  {post.cover_image ? (
                    <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-12 h-12 text-green-300" />
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${categoryColors[post.category] || categoryColors.general}`}>
                      {post.category}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {formatDate(post.published_at)}
                    </span>
                  </div>

                  <h2 className={`font-bold text-gray-900 group-hover:text-green-600 transition-colors mb-2 ${
                    i === 0 ? 'text-xl' : 'text-base'
                  }`}>
                    {post.title}
                  </h2>

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
                      <span className="text-green-600 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Read <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 mb-1">No articles found</h3>
            <p className="text-sm text-gray-500">
              {searchQuery ? 'Try a different search term.' : 'Check back soon for new content!'}
            </p>
            {(searchQuery || activeCategory) && (
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('') }}
                className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-8 sm:p-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to Start Your Hustle?</h2>
          <p className="text-green-100 mb-6 max-w-lg mx-auto">Join thousands of Kenyan freelancers earning via M-Pesa on HustleKE.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="bg-white text-green-700 hover:bg-green-50 px-6 py-3 rounded-xl font-semibold text-sm transition-colors">
              Get Started Free
            </Link>
            <Link href="/jobs" className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors">
              Browse Jobs
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
