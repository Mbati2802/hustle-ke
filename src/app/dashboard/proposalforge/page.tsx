'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'
import {
  Wand2,
  Sparkles,
  Target,
  TrendingUp,
  DollarSign,
  Clock,
  Copy,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Eye,
  Edit3,
  Send,
  BarChart3,
  Users,
  Lightbulb,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react'

interface ProposalDraft {
  id?: string
  job_analysis: {
    keyRequirements: string[]
    painPoints: string[]
    budgetSignals: { min: number; max: number; flexibility: string }
    tone: string
    urgency: string
    projectType: string
    estimatedComplexity: string
  }
  client_analysis: {
    hiringHistory: { totalJobs: number; avgBudget: number; preferredSkills: string[] }
    reviewPatterns: { avgRating: number; commonPraise: string[]; commonComplaints: string[] }
    responseRate: number
    prefersBriefProposals: boolean
  }
  freelancer_match: {
    relevantSkills: string[]
    matchingExperience: string[]
    strengths: string[]
    hustleScore: number
    completionRate: number
    verifiedSkills: string[]
  }
  strategy: {
    recommendedBid: number
    bidRationale: string
    openingHook: string
    keyPoints: string[]
    closingQuestion: string
    estimatedDuration: number
    tone: string
  }
  generated_cover_letter: string
  generated_bid_amount?: number
  generated_duration_days?: number
}

export default function ProposalForgePage() {
  const { user } = useAuth()
  const [jobId, setJobId] = useState('')
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState<ProposalDraft | null>(null)
  const [isExisting, setIsExisting] = useState(false)
  const [editedLetter, setEditedLetter] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)

  const generateProposal = async () => {
    if (!jobId.trim()) return
    setLoading(true)
    setMsg(null)
    setDraft(null)
    try {
      const res = await fetch(`/api/proposalforge?job_id=${jobId}`)
      const data = await res.json()
      if (res.ok) {
        setDraft(data.draft)
        setIsExisting(data.is_existing || false)
        setEditedLetter(data.draft.generated_cover_letter || data.draft.final_cover_letter || '')
        if (data.is_existing) {
          setMsg({ type: 'success', text: 'Found your existing draft for this job!' })
        }
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed to generate proposal' })
      }
    } catch {
      setMsg({ type: 'error', text: 'Network error' })
    }
    setLoading(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editedLetter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const saveDraft = async () => {
    if (!draft?.id) return
    try {
      await fetch('/api/proposalforge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          draft_id: draft.id,
          final_cover_letter: editedLetter,
        }),
      })
      setMsg({ type: 'success', text: 'Draft saved!' })
      setIsEditing(false)
    } catch {}
  }

  const urgencyColors: Record<string, string> = {
    high: 'text-red-600 bg-red-50',
    medium: 'text-amber-600 bg-amber-50',
    normal: 'text-green-600 bg-green-50',
  }

  const complexityColors: Record<string, string> = {
    high: 'text-purple-600 bg-purple-50',
    medium: 'text-blue-600 bg-blue-50',
    low: 'text-green-600 bg-green-50',
  }

  return (
    <div className="p-4 lg:p-6 xl:p-8 pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-900 via-orange-800 to-red-900 rounded-2xl p-6 lg:p-8 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">ProposalForge™</h1>
              <p className="text-amber-200 text-sm">AI-powered winning proposals</p>
            </div>
          </div>
          <p className="text-amber-100/70 text-xs mt-3 max-w-lg">
            Enter a Job ID and our AI analyzes the job, the client&apos;s history, and your profile to generate a personalized, strategy-optimized proposal.
          </p>
        </div>
      </div>

      {/* Message */}
      {msg && (
        <div className={`p-3 rounded-xl mb-4 text-sm font-medium flex items-center justify-between ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="text-xs">✕</button>
        </div>
      )}

      {/* Job ID Input */}
      {!draft && (
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" /> Generate a Winning Proposal
            </h2>
            <div className="flex gap-2">
              <input
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                placeholder="Enter Job ID..."
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && generateProposal()}
              />
              <button onClick={generateProposal} disabled={loading || !jobId.trim()}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Generate
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Find the Job ID on the job listing page</p>
          </div>

          {/* How it works */}
          <div className="mt-6 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-600" /> How ProposalForge Works
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { icon: Eye, title: 'Analyzes the Job', desc: 'Extracts requirements, pain points, and budget signals' },
                { icon: Users, title: 'Studies the Client', desc: 'Reviews hiring history, spending patterns, and preferences' },
                { icon: Target, title: 'Matches Your Profile', desc: 'Identifies your most relevant skills and experience' },
                { icon: Wand2, title: 'Generates Proposal', desc: 'Creates a personalized, strategy-optimized cover letter' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                    <item.icon className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-xs">{item.title}</p>
                    <p className="text-[10px] text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Generated Proposal */}
      {draft && (
        <div>
          <button onClick={() => { setDraft(null); setIsEditing(false) }}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="w-4 h-4" /> New Proposal
          </button>

          <div className="grid lg:grid-cols-3 gap-4">
            {/* Left: Analysis (collapsible on mobile) */}
            <div className="lg:col-span-1 space-y-3">
              <button onClick={() => setShowAnalysis(!showAnalysis)}
                className="w-full lg:hidden bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between text-sm font-semibold text-gray-700">
                <span className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-amber-600" /> AI Analysis</span>
                <ChevronRight className={`w-4 h-4 transition-transform ${showAnalysis ? 'rotate-90' : ''}`} />
              </button>

              <div className={`space-y-3 ${showAnalysis ? 'block' : 'hidden lg:block'}`}>
                {/* Strategy */}
                <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                  <h3 className="font-semibold text-amber-900 text-xs mb-2 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" /> Strategy
                  </h3>
                  {draft.strategy.recommendedBid > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm font-bold text-green-700">KES {draft.strategy.recommendedBid.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500">{draft.strategy.bidRationale}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <p className="text-xs text-gray-700">{draft.strategy.estimatedDuration} days estimated</p>
                  </div>
                  <p className="text-[10px] text-gray-500 italic">&ldquo;{draft.strategy.closingQuestion}&rdquo;</p>
                </div>

                {/* Job Analysis */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900 text-xs mb-2 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-amber-600" /> Job Analysis
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${urgencyColors[draft.job_analysis.urgency] || ''}`}>
                      {draft.job_analysis.urgency} urgency
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${complexityColors[draft.job_analysis.estimatedComplexity] || ''}`}>
                      {draft.job_analysis.estimatedComplexity} complexity
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                      {draft.job_analysis.tone} tone
                    </span>
                  </div>
                  {draft.job_analysis.painPoints.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[10px] font-semibold text-gray-500 mb-1">Pain Points Detected:</p>
                      {draft.job_analysis.painPoints.map((p, i) => (
                        <p key={i} className="text-[10px] text-gray-600 flex items-start gap-1 mb-0.5">
                          <AlertCircle className="w-2.5 h-2.5 text-amber-500 shrink-0 mt-0.5" /> {p}
                        </p>
                      ))}
                    </div>
                  )}
                  {draft.job_analysis.keyRequirements.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[10px] font-semibold text-gray-500 mb-1">Key Requirements:</p>
                      {draft.job_analysis.keyRequirements.slice(0, 4).map((r, i) => (
                        <p key={i} className="text-[10px] text-gray-600 flex items-start gap-1 mb-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5 text-green-500 shrink-0 mt-0.5" /> {r}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Client Analysis */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900 text-xs mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" /> Client Insights
                  </h3>
                  <div className="space-y-1.5 text-[10px] text-gray-600">
                    <p><span className="font-semibold">{draft.client_analysis.hiringHistory.totalJobs}</span> jobs posted</p>
                    {draft.client_analysis.hiringHistory.avgBudget > 0 && (
                      <p>Avg budget: <span className="font-semibold">KES {draft.client_analysis.hiringHistory.avgBudget.toLocaleString()}</span></p>
                    )}
                    <p>Response rate: <span className="font-semibold">{draft.client_analysis.responseRate}%</span></p>
                    {draft.client_analysis.prefersBriefProposals && (
                      <p className="text-amber-600 font-medium">💡 This client prefers brief proposals</p>
                    )}
                  </div>
                </div>

                {/* Your Match */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900 text-xs mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-green-600" /> Your Match
                  </h3>
                  {draft.freelancer_match.strengths.length > 0 && (
                    <div className="space-y-1">
                      {draft.freelancer_match.strengths.map((s, i) => (
                        <p key={i} className="text-[10px] text-green-700 flex items-start gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 shrink-0 mt-0.5" /> {s}
                        </p>
                      ))}
                    </div>
                  )}
                  {draft.freelancer_match.verifiedSkills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {draft.freelancer_match.verifiedSkills.map((s, i) => (
                        <span key={i} className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Generated Proposal */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-amber-600" />
                    {isEditing ? 'Edit Proposal' : 'Generated Proposal'}
                  </h3>
                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <>
                        <button onClick={() => setIsEditing(true)}
                          className="text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={copyToClipboard}
                          className="text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                          {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={saveDraft}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Save
                        </button>
                        <button onClick={() => { setIsEditing(false); setEditedLetter(draft.generated_cover_letter) }}
                          className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <textarea
                    value={editedLetter}
                    onChange={(e) => setEditedLetter(e.target.value)}
                    className="w-full p-5 text-sm leading-relaxed min-h-[400px] resize-y focus:outline-none"
                  />
                ) : (
                  <div className="p-5 text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
                    {editedLetter.split('\n').map((line, i) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={i} className="font-bold text-gray-900 mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>
                      }
                      if (line.startsWith('• ')) {
                        return <p key={i} className="ml-4 text-gray-700">• {line.slice(2)}</p>
                      }
                      if (line.startsWith('— ')) {
                        return <p key={i} className="mt-2 font-semibold text-gray-900">{line}</p>
                      }
                      if (line.trim() === '') {
                        return <br key={i} />
                      }
                      return <p key={i}>{line}</p>
                    })}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-4">
                <button onClick={copyToClipboard}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Proposal'}
                </button>
                <button onClick={() => setIsEditing(!isEditing)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                  <Edit3 className="w-4 h-4" /> {isEditing ? 'Preview' : 'Edit'}
                </button>
              </div>

              {/* Tips */}
              <div className="mt-4 bg-amber-50 rounded-xl border border-amber-200 p-4">
                <h4 className="font-semibold text-amber-900 text-xs mb-2 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" /> Pro Tips
                </h4>
                <ul className="space-y-1 text-[10px] text-amber-800">
                  <li>• Personalize the opening — mention something specific about the client&apos;s project</li>
                  <li>• Add a portfolio link or relevant past project</li>
                  <li>• Keep it concise — clients read dozens of proposals</li>
                  <li>• End with a question to encourage a response</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
