'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  FileCode, Plus, Eye, EyeOff, Pencil, Trash2, MoreVertical,
  CheckCircle2, XCircle, Globe, Home, Search, Briefcase, HelpCircle,
  ExternalLink, ChevronRight, Shield
} from 'lucide-react'

interface SitePage {
  id: string; slug: string; title: string; content: Record<string, unknown>
  meta_title?: string; meta_description?: string; is_published: boolean
  nav_category?: string; sort_order?: number
  created_at: string; updated_at: string
}

const NAV_CATEGORIES = [
  { key: 'all', label: 'All Pages', icon: Globe, color: 'text-gray-600' },
  { key: 'main', label: 'Main', icon: Home, color: 'text-blue-600', desc: 'Homepage & landing' },
  { key: 'find_work', label: 'Find Work', icon: Search, color: 'text-green-600', desc: 'Jobs, stories, pricing' },
  { key: 'how_it_works', label: 'How It Works', icon: Briefcase, color: 'text-purple-600', desc: 'Process & guides' },
  { key: 'about', label: 'About', icon: HelpCircle, color: 'text-orange-600', desc: 'About, FAQs, contact' },
  { key: 'legal', label: 'Legal', icon: Shield, color: 'text-gray-500', desc: 'Privacy, terms' },
  { key: 'other', label: 'Other', icon: FileCode, color: 'text-indigo-500', desc: 'Custom pages' },
]

const FRONTEND_ROUTES: Record<string, string> = {
  homepage: '/', about: '/about', 'how-it-works': '/how-it-works',
  pricing: '/pricing', faqs: '/faqs', contact: '/contact',
  'success-stories': '/success-stories', 'mpesa-tariffs': '/mpesa-tariffs',
  privacy: '/privacy', terms: '/terms',
}

export default function AdminPagesPage() {
  const [pages, setPages] = useState<SitePage[]>([])
  const [loading, setLoading] = useState(true)
  const [actionMenu, setActionMenu] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [newSlug, setNewSlug] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('other')
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchPages = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pages')
      const data = await res.json()
      setPages(data.pages || [])
    } catch { /* */ }
    setLoading(false)
  }

  useEffect(() => { fetchPages() }, [])

  const filteredPages = useMemo(() => {
    const sorted = [...pages].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    if (activeCategory === 'all') return sorted
    return sorted.filter(p => (p.nav_category || 'other') === activeCategory)
  }, [pages, activeCategory])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: pages.length }
    for (const p of pages) {
      const cat = p.nav_category || 'other'
      counts[cat] = (counts[cat] || 0) + 1
    }
    return counts
  }, [pages])

  const handleCreate = async () => {
    if (!newSlug || !newTitle) return
    setCreating(true); setMessage(null)
    try {
      const res = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: newSlug, title: newTitle, content: {}, nav_category: newCategory }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: 'Page created' })
        setShowCreate(false); setNewSlug(''); setNewTitle(''); setNewCategory('other')
        fetchPages()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create' })
      }
    } catch { setMessage({ type: 'error', text: 'Network error' }) }
    setCreating(false)
  }

  const handleTogglePublish = async (id: string, currentlyPublished: boolean) => {
    await fetch(`/api/admin/pages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !currentlyPublished }),
    })
    fetchPages()
    setActionMenu(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this page permanently?')) return
    await fetch(`/api/admin/pages/${id}`, { method: 'DELETE' })
    fetchPages()
    setActionMenu(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileCode className="w-7 h-7 text-indigo-500" /> Site Pages
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage frontend page content — organized by navigation menu</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Page
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />} {message.text}
        </div>
      )}

      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Create New Page</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Page Slug</label>
              <input type="text" placeholder="e.g. about-us" value={newSlug} onChange={e => setNewSlug(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Page Title</label>
              <input type="text" placeholder="e.g. About Us" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nav Category</label>
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30">
                {NAV_CATEGORIES.filter(c => c.key !== 'all').map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button onClick={handleCreate} disabled={creating || !newSlug || !newTitle}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50">
              {creating ? 'Creating...' : 'Create Page'}
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {NAV_CATEGORIES.map(cat => {
          const count = categoryCounts[cat.key] || 0
          if (cat.key !== 'all' && count === 0) return null
          const Icon = cat.icon
          return (
            <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeCategory === cat.key
                  ? 'bg-white shadow-md border border-gray-200 text-gray-900'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent'
              }`}>
              <Icon className={`w-4 h-4 ${activeCategory === cat.key ? cat.color : 'text-gray-400'}`} />
              {cat.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeCategory === cat.key ? 'bg-gray-100 text-gray-700' : 'bg-gray-200/50 text-gray-400'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-20" />
            </div>
          ))
        ) : filteredPages.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            {pages.length === 0 ? 'No pages yet. Run the migration SQL to seed pages with frontend content.' : 'No pages in this category.'}
          </div>
        ) : filteredPages.map(p => {
          const frontendRoute = FRONTEND_ROUTES[p.slug]
          const fieldCount = Object.keys(p.content).length
          const catInfo = NAV_CATEGORIES.find(c => c.key === (p.nav_category || 'other'))
          const CatIcon = catInfo?.icon || FileCode
          return (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow relative group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-100 transition`}>
                    <CatIcon className={`w-5 h-5 ${catInfo?.color || 'text-gray-400'}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{p.title}</h3>
                    <p className="text-xs text-gray-400 font-mono">/{p.slug}</p>
                  </div>
                </div>
                <button onClick={() => setActionMenu(actionMenu === p.id ? null : p.id)} className="p-1 hover:bg-gray-100 rounded transition flex-shrink-0">
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
                {actionMenu === p.id && (
                  <div className="absolute right-4 top-14 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-44">
                    <Link href={`/admin/pages/${p.id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setActionMenu(null)}>
                      <Pencil className="w-4 h-4" /> Edit Content
                    </Link>
                    {frontendRoute && (
                      <a href={frontendRoute} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <ExternalLink className="w-4 h-4" /> View on Site
                      </a>
                    )}
                    <button onClick={() => handleTogglePublish(p.id, p.is_published)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
                      {p.is_published ? <><EyeOff className="w-4 h-4" /> Unpublish</> : <><Eye className="w-4 h-4" /> Publish</>}
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {p.is_published ? 'Published' : 'Draft'}
                </span>
                <span className="text-xs text-gray-400">{fieldCount} field{fieldCount !== 1 ? 's' : ''}</span>
              </div>
              {/* Preview of content keys */}
              <div className="flex flex-wrap gap-1 mb-3">
                {Object.keys(p.content).slice(0, 4).map(key => (
                  <span key={key} className="text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded font-mono">{key}</span>
                ))}
                {fieldCount > 4 && <span className="text-[10px] text-gray-400">+{fieldCount - 4} more</span>}
              </div>
              <Link href={`/admin/pages/${p.id}`} className="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium group/btn">
                Edit Content <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
