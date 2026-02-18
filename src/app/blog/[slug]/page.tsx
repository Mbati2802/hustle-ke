'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import {
  BookOpen,
  Calendar,
  Eye,
  Tag,
  ArrowLeft,
  Share2,
  Copy,
  Check,
  User,
  Clock,
  ChevronRight,
} from 'lucide-react'

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  cover_image: string | null
  category: string
  tags: string[]
  published_at: string
  views: number
  meta_title: string
  meta_description: string
  profiles: { full_name: string; avatar_url: string | null } | null
}

interface RelatedPost {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  published_at: string
}

const categoryColors: Record<string, string> = {
  guides: 'bg-blue-100 text-blue-700',
  payments: 'bg-green-100 text-green-700',
  industry: 'bg-purple-100 text-purple-700',
  platform: 'bg-amber-100 text-amber-700',
  tips: 'bg-teal-100 text-teal-700',
  general: 'bg-gray-100 text-gray-600',
}

export default function BlogPostPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [post, setPost] = useState<BlogPost | null>(null)
  const [related, setRelated] = useState<RelatedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!slug) return
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/blog/${slug}`)
        if (res.status === 404) {
          setNotFound(true)
          return
        }
        const data = await res.json()
        if (data.post) setPost(data.post)
        if (data.related) setRelated(data.related)
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [slug])

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })

  const readingTime = (content: string) => {
    const words = content.split(/\s+/).length
    return Math.max(1, Math.ceil(words / 200))
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  // Simple markdown-to-HTML converter for blog content
  const renderContent = (md: string) => {
    let html = md
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-gray-900 mt-8 mb-3">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-gray-900 mt-10 mb-4">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-gray-900 mt-10 mb-4">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 text-gray-600 list-disc">$1</li>')
      .replace(/^\| (.+) \|$/gm, (match) => {
        const cells = match.slice(1, -1).split('|').map(c => c.trim())
        return `<tr>${cells.map(c => `<td class="border border-gray-200 px-3 py-2 text-sm">${c}</td>`).join('')}</tr>`
      })
      .replace(/^\|[-| ]+\|$/gm, '')
      .replace(/\n\n/g, '</p><p class="text-gray-600 leading-relaxed mb-4">')

    // Wrap consecutive <li> in <ul>
    html = html.replace(/(<li[^>]*>.*?<\/li>\n?)+/g, '<ul class="mb-4 space-y-1">$&</ul>')

    // Wrap consecutive <tr> in <table>
    html = html.replace(/(<tr>.*?<\/tr>\n?)+/g, '<table class="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden mb-6">$&</table>')

    return `<p class="text-gray-600 leading-relaxed mb-4">${html}</p>`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-3xl mx-auto px-4 pt-28 pb-16 animate-pulse">
          <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
          <div className="h-8 w-3/4 bg-gray-200 rounded mb-3" />
          <div className="h-4 w-1/2 bg-gray-100 rounded mb-8" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-3xl mx-auto px-4 pt-28 pb-16 text-center">
          <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Article Not Found</h1>
          <p className="text-gray-500 mb-6">This article may have been removed or doesn&apos;t exist.</p>
          <Link href="/blog" className="text-green-600 hover:text-green-700 font-medium text-sm">
            ← Back to Blog
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/blog" className="hover:text-green-600">Blog</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="capitalize text-gray-600">{post.category}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${categoryColors[post.category] || categoryColors.general}`}>
              {post.category}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-lg text-gray-500 mb-6">{post.excerpt}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              {post.profiles?.avatar_url ? (
                <img src={post.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-green-600" />
                </div>
              )}
              <span className="font-medium text-gray-700">{post.profiles?.full_name || 'HustleKE Team'}</span>
            </div>
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDate(post.published_at)}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {readingTime(post.content)} min read</span>
            <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {post.views} views</span>
          </div>
        </header>

        {/* Content */}
        <div
          className="prose prose-gray max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: renderContent(post.content) }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-8 pb-8 border-b border-gray-200">
            <Tag className="w-4 h-4 text-gray-400" />
            {post.tags.map(tag => (
              <Link
                key={tag}
                href={`/blog?tag=${tag}`}
                className="text-xs bg-gray-100 hover:bg-green-50 hover:text-green-700 text-gray-600 px-3 py-1.5 rounded-full transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        {/* Share */}
        <div className="flex items-center gap-3 mb-12">
          <span className="text-sm font-medium text-gray-700">Share this article:</span>
          <button
            onClick={copyLink}
            className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${
              copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy link</>}
          </button>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            X/Twitter
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(post.title + ' ' + (typeof window !== 'undefined' ? window.location.href : ''))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            WhatsApp
          </a>
        </div>

        {/* Related Posts */}
        {related.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Articles</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {related.map(r => (
                <Link
                  key={r.id}
                  href={`/blog/${r.slug}`}
                  className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-green-200 hover:shadow-md transition-all"
                >
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${categoryColors[r.category] || categoryColors.general}`}>
                    {r.category}
                  </span>
                  <h3 className="font-bold text-gray-900 group-hover:text-green-600 mt-2 mb-1 text-sm line-clamp-2">
                    {r.title}
                  </h3>
                  <p className="text-xs text-gray-400">{formatDate(r.published_at)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back to blog */}
        <div className="mt-12 text-center">
          <Link href="/blog" className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to all articles
          </Link>
        </div>
      </article>

      <Footer />
    </div>
  )
}
