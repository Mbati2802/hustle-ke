'use client'

import { useState } from 'react'
import {
  X,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react'

interface RevisionRequestModalProps {
  jobId: string
  jobTitle: string
  onClose: () => void
  onSuccess: () => void
}

interface RevisionItem {
  id: string
  section: string
  issue: string
  expected: string
}

const priorityOptions = [
  { value: 'low', label: 'Low', desc: 'Minor tweaks, no rush', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'medium', label: 'Medium', desc: 'Noticeable issues that need fixing', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'high', label: 'High', desc: 'Critical — blocks acceptance', color: 'bg-red-50 text-red-700 border-red-200' },
]

export default function RevisionRequestModal({ jobId, jobTitle, onClose, onSuccess }: RevisionRequestModalProps) {
  const [step, setStep] = useState(1)
  const [overallFeedback, setOverallFeedback] = useState('')
  const [revisionItems, setRevisionItems] = useState<RevisionItem[]>([
    { id: '1', section: '', issue: '', expected: '' },
  ])
  const [priority, setPriority] = useState('medium')
  const [deadline, setDeadline] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const addRevisionItem = () => {
    setRevisionItems(prev => [
      ...prev,
      { id: Math.random().toString(36).slice(2), section: '', issue: '', expected: '' },
    ])
  }

  const updateRevisionItem = (id: string, field: keyof RevisionItem, value: string) => {
    setRevisionItems(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  const removeRevisionItem = (id: string) => {
    if (revisionItems.length <= 1) return
    setRevisionItems(prev => prev.filter(item => item.id !== id))
  }

  const filledItems = revisionItems.filter(item => item.section.trim() || item.issue.trim())
  const canProceedStep1 = overallFeedback.trim().length >= 10
  const canProceedStep2 = filledItems.length > 0 && filledItems.every(item => item.issue.trim().length > 0)

  const handleSubmit = async () => {
    if (!overallFeedback.trim()) {
      setError('Please provide overall feedback.')
      return
    }
    setSubmitting(true)
    setError('')

    try {
      // Build structured revision message
      const revisionData = {
        action: 'revision',
        message: overallFeedback.trim(),
        revision_details: {
          overall_feedback: overallFeedback.trim(),
          items: filledItems.map(item => ({
            section: item.section.trim(),
            issue: item.issue.trim(),
            expected: item.expected.trim(),
          })),
          priority,
          deadline: deadline || null,
          additional_notes: additionalNotes.trim() || null,
          requested_at: new Date().toISOString(),
        },
      }

      const res = await fetch(`/api/jobs/${jobId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(revisionData),
      })

      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 2000)
      } else {
        setError(data.error || 'Failed to request revision.')
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setSubmitting(false)
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <RotateCcw className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Revision Requested</h3>
          <p className="text-gray-600 text-sm">The freelancer has been notified and will receive a detailed message with your revision requirements. They&apos;ll also get a popup notification if they&apos;re away from the dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Request Revision</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{jobTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 border-b border-gray-100">
          {[
            { n: 1, label: 'Overview' },
            { n: 2, label: 'Specifics' },
            { n: 3, label: 'Review & Send' },
          ].map((s) => (
            <button
              key={s.n}
              onClick={() => s.n < step ? setStep(s.n) : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                step === s.n
                  ? 'bg-amber-600 text-white'
                  : step > s.n
                    ? 'bg-amber-100 text-amber-700 cursor-pointer'
                    : 'bg-gray-200 text-gray-400'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                {step > s.n ? '✓' : s.n}
              </span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Step 1: Overall Feedback */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-medium text-amber-800">Help the freelancer understand what needs to change</p>
                <p className="text-xs text-amber-600 mt-1">Be specific and constructive. The more detail you provide, the faster the freelancer can deliver what you need.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Overall Feedback <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={overallFeedback}
                  onChange={(e) => setOverallFeedback(e.target.value)}
                  placeholder="Describe your overall impression of the submitted work. What was done well? What needs improvement? What are the main areas that need revision?"
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {overallFeedback.length}/10 minimum characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Revision Priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {priorityOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setPriority(opt.value)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        priority === opt.value
                          ? `${opt.color} border-current ring-1 ring-current/20`
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <p className="text-sm font-semibold">{opt.label}</p>
                      <p className="text-[10px] mt-0.5 opacity-70">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Revision Deadline <span className="text-xs text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
                <p className="text-xs text-gray-400 mt-1">When do you need the revised work by?</p>
              </div>
            </div>
          )}

          {/* Step 2: Specific Revision Items */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-800">Break down exactly what needs to change</p>
                <p className="text-xs text-blue-600 mt-1">Add each revision as a separate item so the freelancer can track and address them one by one.</p>
              </div>

              <div className="space-y-4">
                {revisionItems.map((item, index) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Revision #{index + 1}</span>
                      {revisionItems.length > 1 && (
                        <button
                          onClick={() => removeRevisionItem(item.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Section / Area
                        </label>
                        <input
                          type="text"
                          value={item.section}
                          onChange={(e) => updateRevisionItem(item.id, 'section', e.target.value)}
                          placeholder="e.g., Homepage hero section, Logo colors, Chapter 3..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          What&apos;s wrong / What needs to change <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={item.issue}
                          onChange={(e) => updateRevisionItem(item.id, 'issue', e.target.value)}
                          placeholder="Describe the problem or what doesn't meet your requirements..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          What you expect instead <span className="text-xs text-gray-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                          value={item.expected}
                          onChange={(e) => updateRevisionItem(item.id, 'expected', e.target.value)}
                          placeholder="Describe exactly what you'd like to see instead. Reference examples if possible..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addRevisionItem}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-amber-400 hover:text-amber-600 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Another Revision Item
              </button>
            </div>
          )}

          {/* Step 3: Review & Send */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <p className="text-sm font-medium text-amber-900 mb-1">Ready to send</p>
                <p className="text-xs text-amber-700">The freelancer will be notified immediately — both via message and a popup notification if they&apos;re away.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Overall Feedback</p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{overallFeedback}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Priority</p>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                      priority === 'high' ? 'bg-red-100 text-red-700' :
                      priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </span>
                  </div>
                  {deadline && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Deadline</p>
                      <p className="text-sm text-gray-900">{new Date(deadline).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</p>
                    </div>
                  )}
                </div>

                {filledItems.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Revision Items ({filledItems.length})
                    </p>
                    <div className="space-y-2">
                      {filledItems.map((item, idx) => (
                        <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm font-semibold text-gray-900">
                            {idx + 1}. {item.section || 'General'}
                          </p>
                          <p className="text-sm text-gray-700 mt-1">{item.issue}</p>
                          {item.expected && (
                            <p className="text-xs text-gray-500 mt-1 italic">Expected: {item.expected}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {additionalNotes.trim() && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Additional Notes</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{additionalNotes}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Additional Notes <span className="text-xs text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Any other context, reference links, examples, or instructions..."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-6 py-2 bg-red-50 border-t border-red-100 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 whitespace-pre-wrap">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {step > 1 ? '← Back' : 'Cancel'}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !canProceedStep1}
              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !canProceedStep1}
              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" /> Request Revision
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
