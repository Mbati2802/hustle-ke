'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  X,
  Sparkles,
  Send,
  Clock,
  MapPin,
  Shield,
  CheckCircle2,
  Loader2,
  Briefcase,
  AlertTriangle,
  Brain,
  Zap,
  ChevronDown,
  ChevronUp,
  Target,
  TrendingUp,
  BarChart3,
} from 'lucide-react'
import { useApplyJobModal, ApplyJob } from './ApplyJobModalContext'
import { useAuth } from '@/contexts/AuthContext'

interface ApplicationProgress {
  jobId: string
  jobTitle: string
  coverLetter: string
  bidAmount: number
  duration: number
  startedAt: number
  lastSaved: number
}

interface ApplyJobModalProps {
  isOpen: boolean
  onClose: () => void
  job: ApplyJob
}

interface AiResult {
  proposal: string
  bid_suggestion: { low: number; high: number; recommended: number; market_data_points: number; currency: string }
  win_probability: number
  skill_analysis: { matched: string[]; missing: string[]; bonus: string[]; match_percentage: number }
  suggestions: string[]
  tone_used: string
  word_count: number
  competing_freelancers: number
}

export default function ApplyJobModal({ isOpen, onClose, job }: ApplyJobModalProps) {
  const { profile } = useAuth()
  const [coverLetter, setCoverLetter] = useState('')
  const [polishedLetter, setPolishedLetter] = useState('')
  const [bidAmount, setBidAmount] = useState(job.budget_max || job.budget_min)
  const [duration, setDuration] = useState(30)
  const [submitError, setSubmitError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isPolishing, setIsPolishing] = useState(false)
  const [showPolished, setShowPolished] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResumeNotification, setShowResumeNotification] = useState(false)
  const [hasUnsavedProgress, setHasUnsavedProgress] = useState(false)
  const [aiProposalAvailable, setAiProposalAvailable] = useState<{
    cover_letter: string
    bid_amount: number
    bid_low: number
    bid_high: number
    tone: string
    win_probability: number
  } | null>(null)
  const [aiProposalApplied, setAiProposalApplied] = useState(false)

  // Inline AI generation state
  const [aiTone, setAiTone] = useState<'professional' | 'casual' | 'technical'>('professional')
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [aiResult, setAiResult] = useState<AiResult | null>(null)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [aiError, setAiError] = useState('')

  // Load saved progress when modal opens + check for AI proposal
  useEffect(() => {
    if (isOpen && job) {
      loadSavedProgress()
      checkAiProposal()
    }
  }, [isOpen, job?.id])

  // Auto-save progress every 30 seconds
  useEffect(() => {
    if (!isOpen || !job) return

    const saveInterval = setInterval(() => {
      saveProgress()
    }, 30000) // Save every 30 seconds

    return () => clearInterval(saveInterval)
  }, [isOpen, job, coverLetter, bidAmount, duration])

  // Save progress when form fields change
  useEffect(() => {
    if (isOpen && job && (coverLetter || bidAmount !== (job.budget_max || job.budget_min) || duration !== 30)) {
      setHasUnsavedProgress(true)
      const timeout = setTimeout(() => {
        saveProgress()
        setHasUnsavedProgress(false)
      }, 2000) // Save 2 seconds after user stops typing

      return () => clearTimeout(timeout)
    }
  }, [coverLetter, bidAmount, duration, isOpen, job])

  // Check for incomplete applications on mount
  useEffect(() => {
    checkIncompleteApplications()
  }, [])

  const loadSavedProgress = () => {
    try {
      const saved = localStorage.getItem(`application_${job.id}`)
      if (saved) {
        const progress: ApplicationProgress = JSON.parse(saved)
        const timeSinceLastSave = Date.now() - progress.lastSaved
        
        // Only restore if saved within last 7 days
        if (timeSinceLastSave < 7 * 24 * 60 * 60 * 1000) {
          setCoverLetter(progress.coverLetter)
          setBidAmount(progress.bidAmount)
          setDuration(progress.duration)
          setShowResumeNotification(true)
          
          // Hide notification after 5 seconds
          setTimeout(() => setShowResumeNotification(false), 5000)
        }
      }
    } catch (error) {
      console.error('Error loading saved progress:', error)
    }
  }

  const saveProgress = useCallback(() => {
    if (!job) return

    try {
      const progress: ApplicationProgress = {
        jobId: job.id,
        jobTitle: job.title,
        coverLetter,
        bidAmount,
        duration,
        startedAt: Date.now(),
        lastSaved: Date.now(),
      }
      
      localStorage.setItem(`application_${job.id}`, JSON.stringify(progress))
    } catch (error) {
      console.error('Error saving progress:', error)
    }
  }, [job, coverLetter, bidAmount, duration])

  const clearSavedProgress = () => {
    if (!job) return
    localStorage.removeItem(`application_${job.id}`)
  }

  const checkIncompleteApplications = () => {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('application_'))
      const incompleteApps: Array<{jobId: string, timeElapsed: number}> = []

      keys.forEach(key => {
        try {
          const progress: ApplicationProgress = JSON.parse(localStorage.getItem(key)!)
          const timeElapsed = Date.now() - progress.lastSaved
          
          // Check if application is incomplete and older than 30 minutes
          if (timeElapsed > 30 * 60 * 1000) { // 30 minutes
            incompleteApps.push({
              jobId: progress.jobId,
              timeElapsed
            })
          }
        } catch (error) {
          console.error('Error checking application:', error)
        }
      })

      if (incompleteApps.length > 0) {
        // Show notification for incomplete applications
        showIncompleteApplicationNotification(incompleteApps)
      }
    } catch (error) {
      console.error('Error checking incomplete applications:', error)
    }
  }

  const showIncompleteApplicationNotification = (incompleteApps: Array<{jobId: string, timeElapsed: number}>) => {
    incompleteApps.forEach(app => {
      const hours = Math.floor(app.timeElapsed / (60 * 60 * 1000))
      const minutes = Math.floor((app.timeElapsed % (60 * 60 * 1000)) / (60 * 1000))
      
      // You could integrate with a toast notification system here
      console.log(`Incomplete application for job ${app.jobId} - ${hours}h ${minutes}m ago`)
      
      // For now, we'll use a simple browser notification if permissions are granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Incomplete Job Application', {
          body: `You have an incomplete application that's been pending for ${hours}h ${minutes}m. Click to resume.`,
          icon: '/favicon.ico'
        })
      }
    })
  }

  const checkAiProposal = () => {
    try {
      const stored = sessionStorage.getItem('ai_proposal')
      if (stored) {
        const data = JSON.parse(stored)
        // Only use if generated within last 2 hours
        if (data.generated_at && Date.now() - data.generated_at < 2 * 60 * 60 * 1000) {
          setAiProposalAvailable(data)
        } else {
          sessionStorage.removeItem('ai_proposal')
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  const useAiProposal = () => {
    if (!aiProposalAvailable) return
    setCoverLetter(aiProposalAvailable.cover_letter)
    setBidAmount(aiProposalAvailable.bid_amount)
    setAiProposalApplied(true)
    setAiProposalAvailable(null)
    sessionStorage.removeItem('ai_proposal')
    // Hide the applied confirmation after 4 seconds
    setTimeout(() => setAiProposalApplied(false), 4000)
  }

  const dismissAiProposal = () => {
    setAiProposalAvailable(null)
  }

  // Inline AI proposal generation
  const generateAiProposal = async () => {
    setIsGeneratingAi(true)
    setAiError('')
    setAiResult(null)

    try {
      const res = await fetch('/api/ai-proposal-writer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          job_title: job.title,
          job_description: job.description,
          job_skills: job.skills_required || [],
          job_budget_min: job.budget_min,
          job_budget_max: job.budget_max,
          freelancer_skills: profile?.skills || [],
          freelancer_experience: profile?.years_experience || 0,
          freelancer_rate: profile?.hourly_rate || 0,
          freelancer_name: profile?.full_name || '',
          tone: aiTone,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAiError(data.error || 'Failed to generate proposal')
      } else {
        setAiResult(data)
      }
    } catch {
      setAiError('Network error. Please try again.')
    }
    setIsGeneratingAi(false)
  }

  const applyAiResult = () => {
    if (!aiResult) return
    setCoverLetter(aiResult.proposal)
    setBidAmount(aiResult.bid_suggestion.recommended)
    setShowAiPanel(false)
    setAiResult(null)
    saveProgress()
  }

  const clientName = job.client?.full_name || 'the client'

  const handlePolish = async () => {
    if (!coverLetter.trim()) return
    
    setIsPolishing(true)
    
    // Simulate AI processing
    setTimeout(() => {
      const polished = `Dear Hiring Manager,

I am excited to submit my proposal for the ${job.title} position at ${clientName}. With extensive experience in this field and a proven track record, I am confident in my ability to deliver exceptional results for your project.

${coverLetter}

I have reviewed your requirements and can complete this project within your timeline while maintaining the highest quality standards. I look forward to discussing how I can contribute to your success.

Best regards,
[Your Name]`
      
      setPolishedLetter(polished)
      setShowPolished(true)
      setIsPolishing(false)
    }, 2000)
  }

  const usePolished = () => {
    setCoverLetter(polishedLetter)
    setShowPolished(false)
    saveProgress()
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError('')
    
    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          cover_letter: coverLetter,
          bid_amount: bidAmount,
          estimated_duration_days: duration,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data.error || 'Failed to submit proposal')
        setIsSubmitting(false)
        return
      }
      clearSavedProgress()
      setIsSubmitting(false)
      setIsSuccess(true)
    } catch {
      setSubmitError('Network error. Please try again.')
      setIsSubmitting(false)
    }
  }

  const getApplicationsInProgress = () => {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('application_'))
      return keys.length
    } catch (error) {
      return 0
    }
  }

  const handleClose = () => {
    if (hasUnsavedProgress) {
      saveProgress()
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Apply for Job</h2>
                <p className="text-green-100 text-sm">{job.title}</p>
              </div>
              <div className="flex items-center gap-3">
                {getApplicationsInProgress() > 1 && (
                  <div className="bg-green-500 bg-opacity-30 px-3 py-1 rounded-full">
                    <span className="text-green-100 text-xs font-medium">
                      {getApplicationsInProgress() - 1} other application{getApplicationsInProgress() > 2 ? 's' : ''} in progress
                    </span>
                  </div>
                )}
                <button
                  onClick={handleClose}
                  className="text-white hover:text-green-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Resume Notification */}
          {showResumeNotification && (
            <div className="bg-green-50 border-b border-green-200 px-6 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-green-800 text-sm">
                  Previous progress restored. You can continue where you left off.
                </p>
              </div>
            </div>
          )}

          {/* AI Proposal Available Banner */}
          {aiProposalAvailable && !isSuccess && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-200 px-6 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                    <Brain className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-purple-900 text-sm font-semibold">AI Proposal Ready</p>
                    <p className="text-purple-600 text-xs truncate">
                      {aiProposalAvailable.tone} tone • KES {aiProposalAvailable.bid_amount.toLocaleString()} bid • {aiProposalAvailable.win_probability}% win rate
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={useAiProposal}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Use AI Proposal
                  </button>
                  <button
                    onClick={dismissAiProposal}
                    className="text-purple-400 hover:text-purple-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Proposal Applied Confirmation */}
          {aiProposalApplied && !isSuccess && (
            <div className="bg-purple-50 border-b border-purple-200 px-6 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
                <p className="text-purple-800 text-sm">
                  AI proposal loaded! Cover letter and bid amount have been filled in. Review and submit when ready.
                </p>
              </div>
            </div>
          )}

          {/* Success State */}
          {isSuccess && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Proposal Submitted!</h3>
              <p className="text-gray-500 mb-6">Your proposal for &quot;{job.title}&quot; has been sent to the client.</p>
              <button
                onClick={onClose}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {/* Content */}
          {!isSuccess && <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="p-6">
              {/* Job Card */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-lg">{job.title}</h3>
                  <span className="text-lg font-bold text-green-600">
                    KES {(job.budget_max || job.budget_min)?.toLocaleString()}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                  {job.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-3">
                  {(job.skills_required || []).map((skill) => (
                    <span
                      key={skill}
                      className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {job.client && (
                    <div className="flex items-center gap-1">
                      {job.client.verification_status === 'ID-Verified' && <Shield className="w-4 h-4 text-green-500" />}
                      {job.client.full_name}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {job.remote_allowed ? 'Remote' : job.location_preference || 'Any'}
                  </div>
                  {job.proposals_count != null && (
                    <span>{job.proposals_count} proposals</span>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                {/* Bid Amount */}
                <div>
                  <label className="block font-medium text-gray-900 mb-3">
                    Your Bid
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      KES
                    </span>
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(Number(e.target.value))}
                      className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-lg font-semibold"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Client budget: KES {job.budget_min?.toLocaleString()}{job.budget_max && job.budget_max !== job.budget_min ? ` – ${job.budget_max.toLocaleString()}` : ''}
                  </p>
                  {bidAmount > (job.budget_max || job.budget_min) && (
                    <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Your bid is above the client&apos;s budget. The client may prefer bids within their range.
                    </p>
                  )}
                </div>

                {/* Duration */}
                <div>
                  <label className="block font-medium text-gray-900 mb-3">
                    Estimated Duration
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-24 px-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none font-semibold"
                    />
                    <span className="text-gray-600">days</span>
                  </div>
                </div>

                {/* Cover Letter */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block font-medium text-gray-900">
                      Cover Letter
                    </label>
                    <div className="flex items-center gap-2">
                      {coverLetter.trim() && (
                        <button
                          onClick={handlePolish}
                          disabled={isPolishing}
                          className="bg-purple-100 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed text-purple-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                        >
                          {isPolishing ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Polishing...</>
                          ) : (
                            <><Sparkles className="w-3.5 h-3.5" /> Polish</>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => setShowAiPanel(!showAiPanel)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                          showAiPanel
                            ? 'bg-purple-600 text-white'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                        }`}
                      >
                        <Brain className="w-3.5 h-3.5" />
                        {showAiPanel ? 'Hide AI Writer' : 'Generate with AI'}
                        {showAiPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Inline AI Proposal Generator Panel */}
                  {showAiPanel && (
                    <div className="mb-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Brain className="w-5 h-5 text-purple-600" />
                          <h4 className="font-semibold text-gray-900 text-sm">AI Proposal Writer</h4>
                          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                            Auto-fills from job details
                          </span>
                        </div>

                        {/* Tone selector + Generate */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-600 font-medium">Tone:</span>
                            {(['professional', 'casual', 'technical'] as const).map((tone) => (
                              <button
                                key={tone}
                                onClick={() => setAiTone(tone)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${
                                  aiTone === tone
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-purple-100 border border-gray-200'
                                }`}
                              >
                                {tone}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={generateAiProposal}
                            disabled={isGeneratingAi}
                            className="ml-auto bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                          >
                            {isGeneratingAi ? (
                              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                            ) : (
                              <><Zap className="w-3.5 h-3.5" /> Generate Proposal</>
                            )}
                          </button>
                        </div>

                        {aiError && (
                          <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">
                            {aiError}
                          </div>
                        )}

                        {/* AI Result */}
                        {aiResult && (
                          <div className="space-y-3">
                            {/* Stats row */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-white rounded-lg p-2.5 border border-purple-100 text-center">
                                <div className="flex items-center justify-center gap-1 mb-0.5">
                                  <Target className="w-3.5 h-3.5 text-purple-500" />
                                  <span className="text-xs text-gray-500">Win Rate</span>
                                </div>
                                <span className={`text-lg font-bold ${
                                  aiResult.win_probability >= 70 ? 'text-green-600' :
                                  aiResult.win_probability >= 50 ? 'text-amber-600' : 'text-red-500'
                                }`}>{aiResult.win_probability}%</span>
                              </div>
                              <div className="bg-white rounded-lg p-2.5 border border-purple-100 text-center">
                                <div className="flex items-center justify-center gap-1 mb-0.5">
                                  <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                                  <span className="text-xs text-gray-500">Skill Match</span>
                                </div>
                                <span className={`text-lg font-bold ${
                                  aiResult.skill_analysis.match_percentage >= 70 ? 'text-green-600' :
                                  aiResult.skill_analysis.match_percentage >= 40 ? 'text-amber-600' : 'text-red-500'
                                }`}>{aiResult.skill_analysis.match_percentage}%</span>
                              </div>
                              <div className="bg-white rounded-lg p-2.5 border border-purple-100 text-center">
                                <div className="flex items-center justify-center gap-1 mb-0.5">
                                  <BarChart3 className="w-3.5 h-3.5 text-purple-500" />
                                  <span className="text-xs text-gray-500">Suggested Bid</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900">
                                  KES {aiResult.bid_suggestion.recommended.toLocaleString()}
                                </span>
                              </div>
                            </div>

                            {/* Skill analysis */}
                            {(aiResult.skill_analysis.matched.length > 0 || aiResult.skill_analysis.missing.length > 0) && (
                              <div className="flex flex-wrap gap-1.5">
                                {aiResult.skill_analysis.matched.map((s) => (
                                  <span key={s} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ {s}</span>
                                ))}
                                {aiResult.skill_analysis.missing.map((s) => (
                                  <span key={s} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">✗ {s}</span>
                                ))}
                              </div>
                            )}

                            {/* Generated proposal preview */}
                            <div className="bg-white rounded-lg p-3 border border-purple-100 max-h-48 overflow-y-auto">
                              <p className="text-gray-700 whitespace-pre-line text-xs leading-relaxed">
                                {aiResult.proposal}
                              </p>
                            </div>

                            {/* Suggestions */}
                            {aiResult.suggestions.length > 0 && (
                              <div className="text-xs text-purple-700">
                                <span className="font-semibold">Tips: </span>
                                {aiResult.suggestions.slice(0, 2).join(' • ')}
                              </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-2">
                              <button
                                onClick={applyAiResult}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Use This Proposal
                              </button>
                              <button
                                onClick={generateAiProposal}
                                disabled={isGeneratingAi}
                                className="px-4 py-2 border border-purple-300 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-100 transition-colors flex items-center gap-1.5"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                Regenerate
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Loading state */}
                        {isGeneratingAi && (
                          <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                              <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
                              <p className="text-sm text-purple-700 font-medium">Analyzing job & generating proposal...</p>
                              <p className="text-xs text-purple-500 mt-1">Using your profile skills & market data</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Write your cover letter or use the AI Writer above to generate one automatically..."
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none resize-none"
                  />

                  {/* Character count */}
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-gray-500">
                      {coverLetter.length} characters
                    </span>
                    {coverLetter.length > 0 && coverLetter.length < 100 && (
                      <span className="text-amber-600">
                        Add more detail for better results
                      </span>
                    )}
                  </div>
                </div>

                {/* AI Polished Version */}
                {showPolished && (
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border-2 border-purple-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold text-gray-900">AI Enhanced Version</h3>
                      <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        +45% more professional
                      </span>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
                      <p className="text-gray-700 whitespace-pre-line text-sm">
                        {polishedLetter}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={usePolished}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Use This Version
                      </button>
                      <button
                        onClick={() => setShowPolished(false)}
                        className="px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>}

          {/* Error Display */}
          {submitError && (
            <div className="px-6 py-3 bg-red-50 text-red-700 text-sm border-t border-red-100">
              {submitError}
            </div>
          )}

          {/* Footer */}
          {!isSuccess && (
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {hasUnsavedProgress && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <AlertTriangle className="w-4 h-4" />
                      Saving progress...
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!coverLetter.trim() || isSubmitting}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Submit Proposal
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Wrapper component that uses the context
export function ApplyJobModalWrapper() {
  const { isOpen, job, closeModal } = useApplyJobModal()
  
  if (!job) return null
  
  return (
    <ApplyJobModal
      isOpen={isOpen}
      onClose={closeModal}
      job={job}
    />
  )
}
