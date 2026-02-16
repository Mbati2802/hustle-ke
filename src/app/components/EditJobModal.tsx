'use client'

import { useState, useEffect } from 'react'
import { Loader2, X, FileText, DollarSign, Calendar, MapPin, Globe, Tag } from 'lucide-react'

interface EditJobModalProps {
  jobId: string
  jobTitle: string
  onClose: () => void
  onSuccess: () => void
}

export default function EditJobModal({ jobId, jobTitle, onClose, onSuccess }: EditJobModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget_min: 0,
    budget_max: 0,
    deadline: '',
    category: '',
    location_preference: '',
    remote_allowed: false,
    skills_required: [] as string[],
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [skillInput, setSkillInput] = useState('')

  useEffect(() => {
    loadJob()
  }, [jobId])

  const loadJob = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`)
      const data = await res.json()
      if (data.job) {
        setFormData({
          title: data.job.title || '',
          description: data.job.description || '',
          budget_min: data.job.budget_min || 0,
          budget_max: data.job.budget_max || 0,
          deadline: data.job.deadline || '',
          category: data.job.category || '',
          location_preference: data.job.location_preference || '',
          remote_allowed: data.job.remote_allowed || false,
          skills_required: data.job.skills_required || [],
        })
      }
    } catch {}
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/jobs/${jobId}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok) {
        onSuccess()
        onClose()
      } else {
        setError(data.error || 'Failed to update job')
      }
    } catch {
      setError('Network error')
    }
    setSubmitting(false)
  }

  const addSkill = () => {
    const skill = skillInput.trim()
    if (skill && !formData.skills_required.includes(skill) && formData.skills_required.length < 10) {
      setFormData(prev => ({
        ...prev,
        skills_required: [...prev.skills_required, skill]
      }))
      setSkillInput('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills_required: prev.skills_required.filter(skill => skill !== skillToRemove)
    }))
  }

  const categories = [
    'Web Development', 'Mobile Development', 'UI/UX Design', 'Graphic Design',
    'Content Writing', 'Digital Marketing', 'SEO', 'Social Media Marketing',
    'Video Editing', 'Animation', 'Data Entry', 'Virtual Assistant',
    'Translation', 'Customer Support', 'Sales', 'Accounting',
    'Consulting', 'Engineering', 'Other'
  ]

  if (loading) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Edit Job</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{jobTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20"
              required
              minLength={3}
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the job requirements, responsibilities, and what you're looking for..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20 resize-none"
              required
              minLength={10}
              maxLength={5000}
            />
          </div>

          {/* Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Minimum Budget (KES) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.budget_min || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, budget_min: Number(e.target.value) || 0 }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20"
                required
                min={1000}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Maximum Budget (KES)
              </label>
              <input
                type="number"
                value={formData.budget_max || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, budget_max: Number(e.target.value) || 0 }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20"
                min={1000}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20"
            >
              <option value="">Select category...</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Deadline</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Location Preference</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.remote_allowed}
                  onChange={(e) => setFormData(prev => ({ ...prev, remote_allowed: e.target.checked }))}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Remote work allowed</span>
              </label>
              {!formData.remote_allowed && (
                <input
                  type="text"
                  value={formData.location_preference}
                  onChange={(e) => setFormData(prev => ({ ...prev, location_preference: e.target.value }))}
                  placeholder="e.g., Nairobi, Kenya"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20"
                  maxLength={100}
                />
              )}
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Required Skills</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  placeholder="Add a skill and press Enter"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20"
                  maxLength={30}
                />
                <button
                  type="button"
                  onClick={addSkill}
                  disabled={!skillInput.trim() || formData.skills_required.length >= 10}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Add
                </button>
              </div>
              {formData.skills_required.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.skills_required.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-green-500 hover:text-green-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : <>Update Job</>}
          </button>
        </div>
      </div>
    </div>
  )
}
