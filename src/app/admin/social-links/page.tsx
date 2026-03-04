'use client'

import { useState, useEffect } from 'react'
import {
  Plus, Save, Trash2, ExternalLink, Edit2, Check, X,
  Twitter, Linkedin, Facebook, Instagram, Youtube, Github,
  Globe, MessageCircle, Mail, Phone, MapPin
} from 'lucide-react'

interface SocialLink {
  id: string
  name: string
  url: string
  icon: string
  order_index: number
  is_active: boolean
}

const availableIcons = {
  Twitter, Linkedin, Facebook, Instagram, Youtube, Github,
  Globe, MessageCircle, Mail, Phone, MapPin
}

const iconNames = Object.keys(availableIcons)

export default function SocialLinksPage() {
  const [links, setLinks] = useState<SocialLink[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newLink, setNewLink] = useState({ name: '', url: '', icon: 'Globe' })
  const [editForm, setEditForm] = useState({ name: '', url: '', icon: '', is_active: true })

  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    try {
      const res = await fetch('/api/admin/social-links')
      const data = await res.json()
      setLinks(data.links || [])
    } catch (error) {
      console.error('Failed to fetch social links:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newLink.name || !newLink.url || !newLink.icon) {
      setMessage({ type: 'error', text: 'Please fill all fields' })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/social-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLink),
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Social link added' })
        setNewLink({ name: '', url: '', icon: 'Globe' })
        fetchLinks()
      } else {
        setMessage({ type: 'error', text: 'Failed to add social link' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    }
    setSaving(false)
  }

  const handleUpdate = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/social-links/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Social link updated' })
        setEditingId(null)
        fetchLinks()
      } else {
        setMessage({ type: 'error', text: 'Failed to update social link' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this social link?')) return

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/social-links/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Social link deleted' })
        fetchLinks()
      } else {
        setMessage({ type: 'error', text: 'Failed to delete social link' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    }
    setSaving(false)
  }

  const startEdit = (link: SocialLink) => {
    setEditingId(link.id)
    setEditForm({
      name: link.name,
      url: link.url,
      icon: link.icon,
      is_active: link.is_active
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ name: '', url: '', icon: '', is_active: true })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="bg-white rounded-xl border p-6 animate-pulse">
          <div className="h-48 bg-gray-100 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-7 h-7 text-blue-500" /> Social Links
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage social media and contact links displayed on the site</p>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Add new link */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Social Link</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Name (e.g., Twitter)"
            value={newLink.name}
            onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="url"
            placeholder="URL (e.g., https://twitter.com/hustleke)"
            value={newLink.url}
            onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={newLink.icon}
            onChange={(e) => setNewLink({ ...newLink, icon: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {iconNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> {saving ? 'Adding...' : 'Add Link'}
          </button>
        </div>
      </div>

      {/* Existing links */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Existing Social Links</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {links.map((link) => {
            const IconComponent = availableIcons[link.icon as keyof typeof availableIcons] || Globe
            const isEditing = editingId === link.id
            
            return (
              <div key={link.id} className="p-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="url"
                        value={editForm.url}
                        onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={editForm.icon}
                        onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {iconNames.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editForm.is_active}
                            onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">Active</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdate(link.id)}
                        disabled={saving}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-1"
                      >
                        <Check className="w-4 h-4" /> Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-1"
                      >
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${link.is_active ? 'bg-blue-50' : 'bg-gray-100'}`}>
                        <IconComponent className={`w-5 h-5 ${link.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{link.name}</h3>
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          {link.url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      {!link.is_active && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">Inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(link)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {links.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No social links added yet. Add your first social link above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
