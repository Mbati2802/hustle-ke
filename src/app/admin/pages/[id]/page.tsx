'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Save, Plus, Trash2, CheckCircle2, XCircle,
  Globe, Eye, EyeOff, Type, AlignLeft, List, Image, ExternalLink
} from 'lucide-react'

interface SitePage {
  id: string; slug: string; title: string; content: Record<string, unknown>
  meta_title?: string; meta_description?: string; is_published: boolean
  nav_category?: string; sort_order?: number
  created_at: string; updated_at: string
}

const FRONTEND_ROUTES: Record<string, string> = {
  homepage: '/', about: '/about', 'how-it-works': '/how-it-works',
  pricing: '/pricing', faqs: '/faqs', contact: '/contact',
  'success-stories': '/success-stories', 'mpesa-tariffs': '/mpesa-tariffs',
  privacy: '/privacy', terms: '/terms',
}

const CATEGORY_LABELS: Record<string, string> = {
  main: 'Main', find_work: 'Find Work', how_it_works: 'How It Works',
  about: 'About', legal: 'Legal', other: 'Other',
}

export default function AdminPageEditorPage() {
  const params = useParams()
  const router = useRouter()
  const [page, setPage] = useState<SitePage | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Editable fields
  const [title, setTitle] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [isPublished, setIsPublished] = useState(true)
  const [contentFields, setContentFields] = useState<Array<{ key: string; value: string; type: 'text' | 'textarea' | 'array' | 'json' }>>([])
  const [newFieldKey, setNewFieldKey] = useState('')

  useEffect(() => {
    if (!params.id) return
    fetch(`/api/admin/pages/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.page) {
          setPage(data.page)
          setTitle(data.page.title)
          setMetaTitle(data.page.meta_title || '')
          setMetaDescription(data.page.meta_description || '')
          setIsPublished(data.page.is_published)
          // Convert content object to editable array
          const fields: Array<{ key: string; value: string; type: 'text' | 'textarea' | 'array' | 'json' }> = []
          for (const [key, val] of Object.entries(data.page.content || {})) {
            if (Array.isArray(val)) {
              if (val.length > 0 && typeof val[0] === 'object') {
                fields.push({ key, value: JSON.stringify(val, null, 2), type: 'json' })
              } else {
                fields.push({ key, value: val.join('\n'), type: 'array' })
              }
            } else if (typeof val === 'object' && val !== null) {
              fields.push({ key, value: JSON.stringify(val, null, 2), type: 'json' })
            } else if (typeof val === 'string' && val.length > 100) {
              fields.push({ key, value: String(val), type: 'textarea' })
            } else {
              fields.push({ key, value: String(val), type: 'text' })
            }
          }
          setContentFields(fields)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.id])

  const addField = () => {
    if (!newFieldKey) return
    const sanitizedKey = newFieldKey.toLowerCase().replace(/[^a-z0-9_]/g, '_')
    if (contentFields.some(f => f.key === sanitizedKey)) return
    setContentFields(prev => [...prev, { key: sanitizedKey, value: '', type: 'text' }])
    setNewFieldKey('')
  }

  const removeField = (key: string) => {
    setContentFields(prev => prev.filter(f => f.key !== key))
  }

  const updateFieldValue = (key: string, value: string) => {
    setContentFields(prev => prev.map(f => f.key === key ? { ...f, value } : f))
  }

  const updateFieldType = (key: string, type: 'text' | 'textarea' | 'array' | 'json') => {
    setContentFields(prev => prev.map(f => f.key === key ? { ...f, type } : f))
  }

  const handleSave = async () => {
    setSaving(true); setMessage(null)
    try {
      // Build content object from fields
      const content: Record<string, unknown> = {}
      for (const field of contentFields) {
        if (field.type === 'array') {
          content[field.key] = field.value.split('\n').map(s => s.trim()).filter(Boolean)
        } else if (field.type === 'json') {
          try {
            content[field.key] = JSON.parse(field.value)
          } catch {
            setMessage({ type: 'error', text: `Invalid JSON in field "${field.key}"` })
            setSaving(false)
            return
          }
        } else {
          content[field.key] = field.value
        }
      }

      const res = await fetch(`/api/admin/pages/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, meta_title: metaTitle, meta_description: metaDescription, is_published: isPublished }),
      })
      const data = await res.json()
      if (res.ok) {
        setPage(data.page)
        setMessage({ type: 'success', text: 'Page saved successfully' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' })
      }
    } catch { setMessage({ type: 'error', text: 'Network error' }) }
    setSaving(false)
  }

  if (loading) return <div className="animate-pulse space-y-6"><div className="h-8 bg-gray-200 rounded w-48" /><div className="bg-white rounded-xl border p-6"><div className="h-48 bg-gray-100 rounded" /></div></div>
  if (!page) return <p className="text-red-500">Page not found</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-500" /> Edit: {page.title}
            </h1>
            <p className="text-sm text-gray-500">/{page.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPublished(!isPublished)}
            className={`px-3 py-2 text-sm rounded-lg transition flex items-center gap-2 ${isPublished ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {isPublished ? <><Eye className="w-4 h-4" /> Published</> : <><EyeOff className="w-4 h-4" /> Draft</>}
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Page'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />} {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Page meta */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Page Info</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Page Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Meta Title (SEO)</label>
                <input type="text" value={metaTitle} onChange={e => setMetaTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Meta Description (SEO)</label>
                <textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value)} rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
              </div>
            </div>
          </div>

          {/* Content Fields */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Content Fields</h2>
              <span className="text-xs text-gray-400">{contentFields.length} fields</span>
            </div>

            {contentFields.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No content fields yet. Add your first field below.</p>
            )}

            {contentFields.map((field) => (
              <div key={field.key} className="border border-gray-100 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 font-mono bg-gray-50 px-2 py-0.5 rounded">{field.key}</span>
                    <select value={field.type} onChange={e => updateFieldType(field.key, e.target.value as 'text' | 'textarea' | 'array' | 'json')}
                      className="text-xs px-2 py-1 border border-gray-200 rounded text-gray-500 focus:outline-none">
                      <option value="text">Text</option>
                      <option value="textarea">Long Text</option>
                      <option value="array">List (one per line)</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>
                  <button onClick={() => removeField(field.key)} className="p-1 text-gray-400 hover:text-red-500 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {field.type === 'text' && (
                  <input type="text" value={field.value} onChange={e => updateFieldValue(field.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                )}
                {field.type === 'textarea' && (
                  <textarea value={field.value} onChange={e => updateFieldValue(field.key, e.target.value)} rows={4}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                )}
                {field.type === 'array' && (
                  <div>
                    <textarea value={field.value} onChange={e => updateFieldValue(field.key, e.target.value)} rows={4}
                      placeholder="One item per line..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 font-mono" />
                    <p className="text-xs text-gray-400 mt-1">{field.value.split('\n').filter(Boolean).length} items</p>
                  </div>
                )}
                {field.type === 'json' && (
                  <div>
                    <textarea value={field.value} onChange={e => updateFieldValue(field.key, e.target.value)} rows={8}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500/30 font-mono" />
                    <p className="text-xs text-gray-400 mt-1">Must be valid JSON</p>
                  </div>
                )}
              </div>
            ))}

            {/* Add new field */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <input type="text" value={newFieldKey} onChange={e => setNewFieldKey(e.target.value)}
                placeholder="field_name" onKeyDown={e => e.key === 'Enter' && addField()}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500/30" />
              <button onClick={addField} disabled={!newFieldKey}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-40 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Field
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
            <h2 className="font-semibold text-gray-900">Page Info</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Slug</span><span className="font-mono text-gray-700">/{page.slug}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Category</span><span className="text-gray-700">{CATEGORY_LABELS[page.nav_category || 'other'] || page.nav_category}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">Created</span><span className="text-gray-700">{new Date(page.created_at).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Updated</span><span className="text-gray-700">{new Date(page.updated_at).toLocaleDateString()}</span></div>
            </div>
            {FRONTEND_ROUTES[page.slug] && (
              <a href={FRONTEND_ROUTES[page.slug]} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition font-medium mt-3">
                <ExternalLink className="w-4 h-4" /> View on Frontend
              </a>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
            <p className="font-medium mb-1">How to use content fields</p>
            <ul className="text-xs space-y-1 text-blue-600">
              <li>• <strong>Text</strong>: Single-line headings, titles</li>
              <li>• <strong>Long Text</strong>: Paragraphs, descriptions</li>
              <li>• <strong>List</strong>: Comma-free lists, one item per line</li>
              <li>• <strong>JSON</strong>: Complex structured data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
