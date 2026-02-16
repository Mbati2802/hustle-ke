'use client'

import { useState, useRef } from 'react'
import {
  X,
  Upload,
  FileText,
  Image,
  File,
  Trash2,
  Send,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Loader2,
} from 'lucide-react'

// Allowed file types and limits
const ALLOWED_EXTENSIONS = [
  // Documents
  '.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt',
  // Spreadsheets
  '.xls', '.xlsx', '.csv',
  // Presentations
  '.ppt', '.pptx',
  // Images
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  // Archives
  '.zip', '.rar', '.7z', '.tar', '.gz',
  // Code
  '.html', '.css', '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.php',
  // Design
  '.psd', '.ai', '.fig', '.sketch', '.xd',
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB per file
const MAX_TOTAL_SIZE = 200 * 1024 * 1024 // 200MB total
const MAX_FILES = 10

const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.msi', '.scr', '.com', '.vbs', '.js.exe', '.ps1', '.sh']

interface SubmitWorkModalProps {
  jobId: string
  jobTitle: string
  onClose: () => void
  onSuccess: () => void
}

interface FileItem {
  file: File
  id: string
  preview?: string
}

const getFileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return Image
  if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext)) return FileText
  return File
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function SubmitWorkModal({ jobId, jobTitle, onClose, onSuccess }: SubmitWorkModalProps) {
  const [step, setStep] = useState(1) // 1: details, 2: files, 3: review
  const [description, setDescription] = useState('')
  const [deliverables, setDeliverables] = useState('')
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<FileItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0)

  const validateFile = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      return `"${file.name}" is a blocked file type (executable). This is not allowed for security.`
    }
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `"${file.name}" has an unsupported file type (${ext}).`
    }
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" exceeds the 50MB file size limit.`
    }
    if (totalSize + file.size > MAX_TOTAL_SIZE) {
      return `Adding "${file.name}" would exceed the 200MB total upload limit.`
    }
    if (files.length >= MAX_FILES) {
      return `Maximum ${MAX_FILES} files allowed.`
    }
    return null
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const newFiles: FileItem[] = []
    const errors: string[] = []

    for (const file of Array.from(e.target.files)) {
      const err = validateFile(file)
      if (err) {
        errors.push(err)
        continue
      }
      newFiles.push({
        file,
        id: Math.random().toString(36).slice(2),
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      })
    }

    if (errors.length > 0) {
      setError(errors.join('\n'))
      setTimeout(() => setError(''), 8000)
    }

    setFiles(prev => [...prev, ...newFiles])
    e.target.value = '' // reset input
  }

  const removeFile = (id: string) => {
    setFiles(prev => {
      const removed = prev.find(f => f.id === id)
      if (removed?.preview) URL.revokeObjectURL(removed.preview)
      return prev.filter(f => f.id !== id)
    })
  }

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError('Please provide a description of your completed work.')
      return
    }
    setSubmitting(true)
    setError('')

    try {
      // Step 1: Upload files to Supabase Storage
      const uploadedFiles: Array<{ name: string; size: number; type: string; path: string; url: string | null }> = []

      for (const item of files) {
        const formData = new FormData()
        formData.append('file', item.file)

        const uploadRes = await fetch(`/api/jobs/${jobId}/upload`, {
          method: 'POST',
          body: formData,
        })

        if (!uploadRes.ok) {
          const errData = await uploadRes.json()
          setError(`Failed to upload "${item.file.name}": ${errData.error || 'Unknown error'}`)
          setSubmitting(false)
          return
        }

        const uploadData = await uploadRes.json()
        if (uploadData.file) {
          uploadedFiles.push(uploadData.file)
        }
      }

      // Step 2: Submit structured data to the API
      const res = await fetch(`/api/jobs/${jobId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          deliverables: deliverables.trim(),
          notes: notes.trim(),
          files: uploadedFiles,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 2000)
      } else {
        setError(data.error || 'Failed to submit work. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    }
    setSubmitting(false)
  }

  const canProceedStep1 = description.trim().length >= 20
  const canProceedStep2 = true // files are optional
  const canSubmit = canProceedStep1

  if (success) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Work Submitted!</h3>
          <p className="text-gray-600 text-sm">Your work has been submitted for review. The client will be notified and can approve or request revisions.</p>
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
            <h2 className="font-bold text-gray-900">Submit Work</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{jobTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 border-b border-gray-100">
          {[
            { n: 1, label: 'Details' },
            { n: 2, label: 'Files' },
            { n: 3, label: 'Review & Submit' },
          ].map((s) => (
            <button
              key={s.n}
              onClick={() => s.n < step ? setStep(s.n) : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                step === s.n
                  ? 'bg-green-600 text-white'
                  : step > s.n
                    ? 'bg-green-100 text-green-700 cursor-pointer'
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
          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Work Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe in detail what you've completed. Include any key features, specifications, or requirements you've fulfilled..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {description.length}/20 minimum characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Deliverables List
                </label>
                <textarea
                  value={deliverables}
                  onChange={(e) => setDeliverables(e.target.value)}
                  placeholder="List each deliverable item, e.g.:&#10;1. Homepage design (desktop + mobile)&#10;2. Logo in PNG and SVG formats&#10;3. Brand guidelines PDF"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Additional Notes for Client
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any instructions, access details, or important notes the client should know..."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20 resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Files */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Upload Files <span className="text-xs text-gray-400 font-normal">(optional)</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Upload your deliverable files. Max 50MB per file, 200MB total, up to {MAX_FILES} files.
                </p>

                {/* Drop Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition-colors"
                >
                  <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 font-medium">Click to upload files</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, ZIP, images, documents, code files</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ALLOWED_EXTENSIONS.join(',')}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{files.length} file(s)</p>
                    <p className="text-xs text-gray-500">Total: {formatSize(totalSize)}</p>
                  </div>
                  {files.map((item) => {
                    const Icon = getFileIcon(item.file.name)
                    return (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {item.preview ? (
                          <img src={item.preview} alt="" className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-white rounded flex items-center justify-center border border-gray-200">
                            <Icon className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">{item.file.name}</p>
                          <p className="text-xs text-gray-400">{formatSize(item.file.size)}</p>
                        </div>
                        <button onClick={() => removeFile(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Security Notice */}
              <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">File Security</p>
                  <ul className="text-xs text-blue-700 mt-1 space-y-0.5">
                    <li>• Executable files (.exe, .bat, .cmd, etc.) are blocked</li>
                    <li>• Files are scanned for malicious content</li>
                    <li>• All uploads are encrypted in transit and at rest</li>
                    <li>• Only the client and you can access these files</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <p className="text-sm font-medium text-green-900 mb-1">Ready to submit</p>
                <p className="text-xs text-green-700">Review your submission below before sending it to the client.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{description || '—'}</p>
                </div>
                {deliverables.trim() && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Deliverables</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{deliverables}</p>
                  </div>
                )}
                {notes.trim() && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{notes}</p>
                  </div>
                )}
                {files.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Files ({files.length})
                    </p>
                    <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                      {files.map(f => (
                        <p key={f.id} className="text-sm text-gray-700">
                          📎 {f.file.name} <span className="text-gray-400">({formatSize(f.file.size)})</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}
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
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !canSubmit}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Submit Work
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
