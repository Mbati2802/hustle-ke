'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAuth } from '@/contexts/AuthContext'
import {
  Sparkles,
  Send,
  Loader2,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Target,
  DollarSign,
  TrendingUp,
  Users,
  Zap,
  RefreshCw,
  ChevronDown,
  FileText,
  Lightbulb,
  BarChart3,
  Shield,
  Briefcase,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'

interface ProposalResult {
  proposal: string
  bid_suggestion: {
    low: number
    high: number
    recommended: number
    market_data_points: number
    currency: string
  }
  win_probability: number
  skill_analysis: {
    matched: string[]
    missing: string[]
    bonus: string[]
    match_percentage: number
  }
  suggestions: string[]
  tone_used: string
  word_count: number
  competing_freelancers: number
}

const TONES = [
  { id: 'professional', label: 'Professional', desc: 'Formal and polished', icon: Briefcase, color: 'from-blue-500 to-indigo-600' },
  { id: 'casual', label: 'Casual', desc: 'Friendly and approachable', icon: Users, color: 'from-green-500 to-emerald-600' },
  { id: 'technical', label: 'Technical', desc: 'Detailed and precise', icon: Brain, color: 'from-purple-500 to-violet-600' },
]

const POPULAR_SKILLS = [
  'React', 'Next.js', 'Node.js', 'TypeScript', 'Python', 'Figma', 'UI/UX Design',
  'WordPress', 'Flutter', 'SEO', 'Copywriting', 'Data Analysis', 'PHP', 'Laravel',
  'Graphic Design', 'Video Editing', 'Social Media', 'Excel', 'Mobile App', 'AWS',
]

export default function AIProposalWriterPage() {
  const { profile } = useAuth()

  // Input state
  const [jobDescription, setJobDescription] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [jobSkills, setJobSkills] = useState<string[]>([])
  const [jobBudgetMin, setJobBudgetMin] = useState(0)
  const [jobBudgetMax, setJobBudgetMax] = useState(0)
  const [freelancerSkills, setFreelancerSkills] = useState<string[]>([])
  const [freelancerExperience, setFreelancerExperience] = useState(0)
  const [freelancerRate, setFreelancerRate] = useState(0)
  const [tone, setTone] = useState('professional')
  const [skillInput, setSkillInput] = useState('')
  const [jobSkillInput, setJobSkillInput] = useState('')

  // Result state
  const [result, setResult] = useState<ProposalResult | null>(null)
  const [editedProposal, setEditedProposal] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [savedForApply, setSavedForApply] = useState(false)

  const resultRef = useRef<HTMLDivElement>(null)

  // Pre-fill from profile
  useEffect(() => {
    if (profile) {
      setFreelancerSkills(profile.skills || [])
      setFreelancerExperience(profile.years_experience || 0)
      setFreelancerRate(profile.hourly_rate || 0)
    }
  }, [profile])

  const addJobSkill = (skill: string) => {
    const trimmed = skill.trim()
    if (trimmed && !jobSkills.includes(trimmed)) {
      setJobSkills(prev => [...prev, trimmed])
    }
    setJobSkillInput('')
  }

  const addFreelancerSkill = (skill: string) => {
    const trimmed = skill.trim()
    if (trimmed && !freelancerSkills.includes(trimmed)) {
      setFreelancerSkills(prev => [...prev, trimmed])
    }
    setSkillInput('')
  }

  const handleGenerate = async () => {
    if (!jobDescription.trim() || jobDescription.trim().length < 20) {
      setError('Please enter a job description of at least 20 characters')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/ai-proposal-writer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_description: jobDescription,
          job_title: jobTitle,
          job_skills: jobSkills,
          job_budget_min: jobBudgetMin,
          job_budget_max: jobBudgetMax,
          freelancer_skills: freelancerSkills,
          freelancer_experience: freelancerExperience,
          freelancer_rate: freelancerRate,
          freelancer_name: profile?.full_name || '',
          tone,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate proposal')

      setResult(data)
      setEditedProposal(data.proposal)

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 200)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = () => {
    handleGenerate()
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(editedProposal)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveForApplication = () => {
    if (!result) return
    sessionStorage.setItem('ai_proposal', JSON.stringify({
      cover_letter: editedProposal,
      bid_amount: result.bid_suggestion.recommended,
      bid_low: result.bid_suggestion.low,
      bid_high: result.bid_suggestion.high,
      tone: result.tone_used,
      win_probability: result.win_probability,
      generated_at: Date.now(),
    }))
    setSavedForApply(true)
    setTimeout(() => setSavedForApply(false), 3000)
  }

  const getWinColor = (score: number) => {
    if (score >= 70) return 'text-green-600'
    if (score >= 50) return 'text-amber-600'
    return 'text-red-500'
  }

  const getWinBg = (score: number) => {
    if (score >= 70) return 'from-green-500 to-emerald-600'
    if (score >= 50) return 'from-amber-500 to-orange-600'
    return 'from-red-500 to-rose-600'
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
            <div className="inline-flex items-center gap-2 bg-purple-500/15 border border-purple-400/20 text-purple-200 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
              <Sparkles className="w-4 h-4" />
              AI-Powered Proposal Generator
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">Write Winning Proposals in Seconds</h1>
            <p className="text-purple-200/70 text-lg max-w-2xl mx-auto mb-6">
              Paste a job description and let AI craft a personalized, compelling proposal. Choose your tone, get bid suggestions, and see your win probability.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-purple-300/60">
              {[
                { icon: Target, text: 'Win probability scoring' },
                { icon: DollarSign, text: 'Market-rate bid suggestions' },
                { icon: FileText, text: '3 tone styles' },
              ].map(b => (
                <div key={b.text} className="flex items-center gap-2">
                  <b.icon className="w-4 h-4" />
                  <span>{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-8">

              {/* Left — Input Panel */}
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      Job Details
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Paste the job description or enter details manually</p>
                  </div>
                  <div className="p-6 space-y-5">
                    {/* Job title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Title</label>
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={e => setJobTitle(e.target.value)}
                        placeholder="e.g. Build an e-commerce website with M-Pesa"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none text-sm"
                      />
                    </div>

                    {/* Job description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Description *</label>
                      <textarea
                        value={jobDescription}
                        onChange={e => setJobDescription(e.target.value)}
                        placeholder="Paste the full job description here. The more detail you provide, the better the AI can tailor your proposal..."
                        rows={7}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none resize-none text-sm leading-relaxed"
                      />
                      <p className="text-xs text-gray-400 mt-1">{jobDescription.length} characters {jobDescription.length < 20 && jobDescription.length > 0 ? '(min 20)' : ''}</p>
                    </div>

                    {/* Job skills */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Required Skills</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={jobSkillInput}
                          onChange={e => setJobSkillInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addJobSkill(jobSkillInput))}
                          placeholder="Add skill..."
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
                        />
                        <button
                          onClick={() => addJobSkill(jobSkillInput)}
                          disabled={!jobSkillInput.trim()}
                          className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 disabled:opacity-40 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      {jobSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {jobSkills.map(s => (
                            <span key={s} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                              {s}
                              <button onClick={() => setJobSkills(prev => prev.filter(x => x !== s))} className="text-purple-400 hover:text-purple-600">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {POPULAR_SKILLS.filter(s => !jobSkills.includes(s)).slice(0, 10).map(s => (
                          <button key={s} onClick={() => addJobSkill(s)} className="text-xs text-gray-500 bg-gray-100 hover:bg-purple-50 hover:text-purple-600 px-2 py-0.5 rounded transition-colors">
                            + {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Budget range */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Budget Min (KES)</label>
                        <input
                          type="number"
                          value={jobBudgetMin || ''}
                          onChange={e => setJobBudgetMin(Number(e.target.value))}
                          placeholder="5,000"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Budget Max (KES)</label>
                        <input
                          type="number"
                          value={jobBudgetMax || ''}
                          onChange={e => setJobBudgetMax(Number(e.target.value))}
                          placeholder="50,000"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Your Profile */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-600" />
                      Your Profile
                      {profile && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-2">Pre-filled</span>}
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Years of Experience</label>
                        <input
                          type="number"
                          value={freelancerExperience || ''}
                          onChange={e => setFreelancerExperience(Number(e.target.value))}
                          placeholder="3"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Hourly Rate (KES)</label>
                        <input
                          type="number"
                          value={freelancerRate || ''}
                          onChange={e => setFreelancerRate(Number(e.target.value))}
                          placeholder="2,500"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Skills</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={skillInput}
                          onChange={e => setSkillInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFreelancerSkill(skillInput))}
                          placeholder="Add your skill..."
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
                        />
                        <button
                          onClick={() => addFreelancerSkill(skillInput)}
                          disabled={!skillInput.trim()}
                          className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 disabled:opacity-40 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      {freelancerSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {freelancerSkills.map(s => (
                            <span key={s} className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                              {s}
                              <button onClick={() => setFreelancerSkills(prev => prev.filter(x => x !== s))} className="text-green-400 hover:text-green-600">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tone Selector */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      Proposal Tone
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-3">
                      {TONES.map(t => {
                        const Icon = t.icon
                        const isActive = tone === t.id
                        return (
                          <button
                            key={t.id}
                            onClick={() => setTone(t.id)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                              isActive
                                ? 'border-purple-500 bg-purple-50 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <div className={`w-8 h-8 bg-gradient-to-br ${t.color} rounded-lg flex items-center justify-center mb-2`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <p className="font-semibold text-gray-900 text-sm">{t.label}</p>
                            <p className="text-xs text-gray-500">{t.desc}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={loading || jobDescription.trim().length < 20}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-purple-500/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Generating Proposal...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6" />
                      Generate AI Proposal
                    </>
                  )}
                </button>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </div>

              {/* Right — Result Panel */}
              <div ref={resultRef} className="space-y-6">
                {!result && !loading && (
                  <div className="bg-gradient-to-br from-gray-50 to-purple-50/30 border border-gray-200 rounded-2xl p-10 text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">Your AI Proposal Will Appear Here</h3>
                    <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                      Fill in the job details on the left and click &quot;Generate AI Proposal&quot; to get started.
                    </p>
                    <div className="space-y-3 text-left max-w-xs mx-auto">
                      {[
                        'Personalized to the job requirements',
                        'Bid amount based on market rates',
                        'Win probability estimation',
                        'Side-by-side editing',
                        'Improvement suggestions',
                      ].map(item => (
                        <div key={item} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                          <span className="text-sm text-gray-600">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {loading && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                    <h3 className="font-bold text-gray-900 text-lg mb-2">Crafting Your Proposal...</h3>
                    <p className="text-gray-500 text-sm">Analyzing job requirements, market data, and your profile</p>
                  </div>
                )}

                {result && (
                  <>
                    {/* Score Cards */}
                    <div className="grid grid-cols-3 gap-3">
                      {/* Win Probability */}
                      <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
                        <div className={`text-3xl font-bold bg-gradient-to-br ${getWinBg(result.win_probability)} bg-clip-text text-transparent`}>
                          {result.win_probability}%
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Win Probability</p>
                      </div>

                      {/* Skill Match */}
                      <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
                        <div className="text-3xl font-bold text-blue-600">{result.skill_analysis.match_percentage}%</div>
                        <p className="text-xs text-gray-500 mt-1">Skill Match</p>
                      </div>

                      {/* Competition */}
                      <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
                        <div className="text-3xl font-bold text-gray-900">{result.competing_freelancers}</div>
                        <p className="text-xs text-gray-500 mt-1">Competitors</p>
                      </div>
                    </div>

                    {/* Bid Suggestion */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5">
                      <h3 className="font-bold text-green-900 text-sm mb-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Suggested Bid Range
                      </h3>
                      <div className="flex items-end gap-4">
                        <div>
                          <p className="text-xs text-green-700/60">Low</p>
                          <p className="text-lg font-bold text-green-800">KES {result.bid_suggestion.low.toLocaleString()}</p>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                          <div className="bg-green-600 text-white px-4 py-2 rounded-xl">
                            <p className="text-xs text-green-200">Recommended</p>
                            <p className="text-xl font-bold">KES {result.bid_suggestion.recommended.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-green-700/60">High</p>
                          <p className="text-lg font-bold text-green-800">KES {result.bid_suggestion.high.toLocaleString()}</p>
                        </div>
                      </div>
                      <p className="text-xs text-green-700/60 mt-2">Based on {result.bid_suggestion.market_data_points} similar jobs</p>
                    </div>

                    {/* Skill Analysis */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5">
                      <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-600" />
                        Skill Analysis
                      </h3>
                      <div className="space-y-2">
                        {result.skill_analysis.matched.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Matched Skills</p>
                            <div className="flex flex-wrap gap-1.5">
                              {result.skill_analysis.matched.map(s => (
                                <span key={s} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-lg">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {result.skill_analysis.missing.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Missing Skills</p>
                            <div className="flex flex-wrap gap-1.5">
                              {result.skill_analysis.missing.map(s => (
                                <span key={s} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-lg">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {result.skill_analysis.bonus.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Bonus Skills</p>
                            <div className="flex flex-wrap gap-1.5">
                              {result.skill_analysis.bonus.map(s => (
                                <span key={s} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Generated Proposal — Editable */}
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                      <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4 text-purple-600" />
                          Generated Proposal
                          <span className="text-xs text-gray-400 font-normal ml-1">{result.word_count} words • {result.tone_used}</span>
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleRegenerate}
                            disabled={loading}
                            className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Regenerate
                          </button>
                          <button
                            onClick={handleCopy}
                            className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                          >
                            {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>
                      <div className="p-5">
                        <textarea
                          value={editedProposal}
                          onChange={e => setEditedProposal(e.target.value)}
                          rows={16}
                          className="w-full border border-gray-200 rounded-xl p-4 text-sm leading-relaxed focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none resize-none"
                        />
                      </div>
                    </div>

                    {/* AI Suggestions */}
                    {result.suggestions.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                        <h3 className="font-bold text-amber-900 text-sm mb-3 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4" />
                          Improvement Suggestions
                        </h3>
                        <ul className="space-y-2">
                          {result.suggestions.map((s, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <span className="w-5 h-5 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                              <span className="text-sm text-amber-800">{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* CTA */}
                    <div className="bg-gray-900 rounded-2xl p-5 space-y-3">
                      <p className="text-gray-300 text-sm">Ready to submit? Save your proposal and apply to any job — it will auto-fill the application form.</p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={handleSaveForApplication} className={`inline-flex items-center justify-center gap-2 ${savedForApply ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-500'} text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors`}>
                          {savedForApply ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                          {savedForApply ? 'Saved! Now apply to a job' : 'Use in Next Application'}
                        </button>
                        <button onClick={handleCopy} className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                          <Copy className="w-4 h-4" />
                          {copied ? 'Copied!' : 'Copy Text'}
                        </button>
                        <Link href="/jobs" className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                          Browse Jobs
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                      {savedForApply && (
                        <p className="text-green-400 text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Proposal saved! When you click &quot;Apply&quot; on any job, it will be auto-filled.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
