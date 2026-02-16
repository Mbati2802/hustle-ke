'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAuth } from '@/contexts/AuthContext'
import { usePostJobModal } from '../components/PostJobModalContext'
import {
  Sparkles,
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
  Clock,
  FileText,
  Lightbulb,
  Briefcase,
  ArrowRight,
  RefreshCw,
  Send,
  ChevronDown,
  ChevronUp,
  BarChart3,
  type LucideIcon,
} from 'lucide-react'

interface BriefResult {
  generated_title: string
  generated_description: string
  category: string
  suggested_skills: string[]
  budget_suggestion: {
    low: number
    median: number
    high: number
    data_points: number
    currency: string
  }
  timeline: {
    estimate: string
    days: number
  }
  deliverables: string[]
  requirements: string[]
  similar_projects: Array<{
    title: string
    budget_range: string
    proposals: number
    skills: string[]
  }>
  available_freelancers: number
  tips: string[]
}

const EXAMPLE_DESCRIPTIONS = [
  {
    label: 'E-commerce Website',
    text: 'I need someone to build an online store for my clothing brand. It should have product listings with photos, M-Pesa payment integration, customer accounts, order tracking, and a simple admin panel to manage inventory. Must be mobile-friendly.',
  },
  {
    label: 'Logo Design',
    text: 'I need a modern, professional logo for my tech startup called NexaFlow. We do cloud computing services. Looking for something clean and minimal, maybe with an abstract icon. Need the logo in multiple formats for web and print.',
  },
  {
    label: 'Content Writing',
    text: 'I need 10 SEO-optimized blog articles for my health and wellness website. Each article should be about 1500 words, well-researched, and engaging. Topics include nutrition, fitness, mental health, and healthy living tips for Kenyans.',
  },
  {
    label: 'Mobile App',
    text: 'Build a food delivery mobile app for restaurants in Nairobi. Customers should be able to browse menus, place orders, track delivery in real-time, and pay via M-Pesa. Need both Android and iOS versions.',
  },
]

export default function AIClientBriefPage() {
  const { profile } = useAuth()
  const { openModal: openPostJobModal } = usePostJobModal()

  // Input state
  const [description, setDescription] = useState('')

  // Result state
  const [result, setResult] = useState<BriefResult | null>(null)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedSkills, setEditedSkills] = useState<string[]>([])
  const [editedBudgetMin, setEditedBudgetMin] = useState(0)
  const [editedBudgetMax, setEditedBudgetMax] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showSimilar, setShowSimilar] = useState(false)
  const [showTips, setShowTips] = useState(false)

  const resultRef = useRef<HTMLDivElement>(null)

  const handleGenerate = async () => {
    if (!description.trim() || description.trim().length < 15) {
      setError('Please describe your project in at least 15 characters')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/ai-client-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate brief')

      setResult(data)
      setEditedTitle(data.generated_title)
      setEditedDescription(data.generated_description)
      setEditedSkills(data.suggested_skills)
      setEditedBudgetMin(data.budget_suggestion.low)
      setEditedBudgetMax(data.budget_suggestion.high)

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 200)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    const fullText = `${editedTitle}\n\n${editedDescription}\n\nBudget: KES ${editedBudgetMin.toLocaleString()} - ${editedBudgetMax.toLocaleString()}\nSkills: ${editedSkills.join(', ')}`
    navigator.clipboard.writeText(fullText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePostJob = () => {
    openPostJobModal({
      title: editedTitle,
      description: editedDescription,
      skills: editedSkills,
      category: result?.category || '',
      budgetMin: editedBudgetMin,
      budgetMax: editedBudgetMax,
      budget: Math.round((editedBudgetMin + editedBudgetMax) / 2),
    })
  }

  const useExample = (text: string) => {
    setDescription(text)
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-400/20 text-emerald-200 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
              <Brain className="w-4 h-4" />
              AI Project Brief Builder
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">Describe It. AI Structures It.</h1>
            <p className="text-emerald-200/70 text-lg max-w-2xl mx-auto mb-6">
              Just tell us what you need in plain language. Our AI will generate a professional job posting with the right budget, skills, timeline, and structure to attract top freelancers.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-emerald-300/60">
              {[
                { icon: DollarSign, text: 'Market-rate budget suggestions' },
                { icon: Clock, text: 'Smart timeline estimation' },
                { icon: Zap, text: 'One-click job posting' },
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
                      <FileText className="w-5 h-5 text-emerald-600" />
                      Describe Your Project
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Tell us what you need in plain, everyday language</p>
                  </div>
                  <div className="p-6 space-y-5">
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder={`Example: "I need someone to build a website for my restaurant. It should show our menu, allow online reservations, have an M-Pesa payment option, and look great on mobile phones..."`}
                      rows={8}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none text-sm leading-relaxed"
                    />
                    <p className="text-xs text-gray-400">{description.length} characters {description.length > 0 && description.length < 15 ? '(min 15)' : ''}</p>

                    {/* Example descriptions */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">Try an example:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {EXAMPLE_DESCRIPTIONS.map(ex => (
                          <button
                            key={ex.label}
                            onClick={() => useExample(ex.text)}
                            className="text-left p-3 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-200 border border-gray-200 rounded-xl transition-colors"
                          >
                            <p className="text-sm font-medium text-gray-900">{ex.label}</p>
                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{ex.text.slice(0, 60)}...</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={loading || description.trim().length < 15}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Building Your Brief...
                    </>
                  ) : (
                    <>
                      <Brain className="w-6 h-6" />
                      Generate Project Brief
                    </>
                  )}
                </button>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* How it works */}
                {!result && !loading && (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                    <h3 className="font-bold text-gray-900 text-sm mb-4">How It Works</h3>
                    <div className="space-y-4">
                      {[
                        { step: '1', title: 'Describe', desc: 'Tell us what you need in plain language — no jargon required' },
                        { step: '2', title: 'AI Structures', desc: 'Our AI analyzes your input and creates a professional job posting' },
                        { step: '3', title: 'Review & Edit', desc: 'Fine-tune the title, description, budget, and skills' },
                        { step: '4', title: 'Post & Hire', desc: 'One click to publish — start receiving proposals from top talent' },
                      ].map(item => (
                        <div key={item.step} className="flex items-start gap-3">
                          <div className="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center text-sm font-bold shrink-0">{item.step}</div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                            <p className="text-xs text-gray-500">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right — Result Panel */}
              <div ref={resultRef} className="space-y-6">
                {!result && !loading && (
                  <div className="bg-gradient-to-br from-gray-50 to-emerald-50/30 border border-gray-200 rounded-2xl p-10 text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Brain className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">Your Project Brief Will Appear Here</h3>
                    <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                      Describe your project on the left and click &quot;Generate Project Brief&quot; to get a structured, ready-to-post job listing.
                    </p>
                    <div className="space-y-3 text-left max-w-xs mx-auto">
                      {[
                        'Professional job title & description',
                        'Suggested budget from market data',
                        'Required skills auto-detected',
                        'Timeline estimation',
                        'Similar successful projects',
                      ].map(item => (
                        <div key={item} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="text-sm text-gray-600">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {loading && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
                    <h3 className="font-bold text-gray-900 text-lg mb-2">Structuring Your Brief...</h3>
                    <p className="text-gray-500 text-sm">Analyzing your project, checking market rates, and finding similar jobs</p>
                  </div>
                )}

                {result && (
                  <>
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-600">
                          KES {result.budget_suggestion.median.toLocaleString()}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Market Median</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{result.available_freelancers}</div>
                        <p className="text-xs text-gray-500 mt-1">Available Freelancers</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900">{result.timeline.estimate}</div>
                        <p className="text-xs text-gray-500 mt-1">Est. Timeline</p>
                      </div>
                    </div>

                    {/* Generated Title — Editable */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5">
                      <label className="block text-sm font-bold text-gray-900 mb-2">Job Title</label>
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={e => setEditedTitle(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-lg font-semibold"
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{result.category}</span>
                      </div>
                    </div>

                    {/* Budget */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5">
                      <h3 className="font-bold text-green-900 text-sm mb-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Suggested Budget
                        <span className="text-xs text-green-700/60 font-normal ml-1">Based on {result.budget_suggestion.data_points} similar jobs</span>
                      </h3>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs text-green-700/60 mb-1">Minimum (KES)</label>
                          <input
                            type="number"
                            value={editedBudgetMin}
                            onChange={e => setEditedBudgetMin(Number(e.target.value))}
                            className="w-full px-3 py-2.5 border border-green-300 rounded-xl focus:border-emerald-500 focus:outline-none text-lg font-bold bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-green-700/60 mb-1">Maximum (KES)</label>
                          <input
                            type="number"
                            value={editedBudgetMax}
                            onChange={e => setEditedBudgetMax(Number(e.target.value))}
                            className="w-full px-3 py-2.5 border border-green-300 rounded-xl focus:border-emerald-500 focus:outline-none text-lg font-bold bg-white"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-green-700/60">
                        <span>Market low: KES {result.budget_suggestion.low.toLocaleString()}</span>
                        <span>Market high: KES {result.budget_suggestion.high.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5">
                      <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-600" />
                        Required Skills
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {editedSkills.map(s => (
                          <span key={s} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                            {s}
                            <button onClick={() => setEditedSkills(prev => prev.filter(x => x !== s))} className="text-blue-400 hover:text-blue-600 ml-0.5">×</button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Deliverables */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5">
                      <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Deliverables
                      </h3>
                      <ul className="space-y-2">
                        {result.deliverables.map((d, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                            <span className="text-sm text-gray-700">{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Generated Description — Editable */}
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                      <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-600" />
                          Full Job Description
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Regenerate
                          </button>
                          <button
                            onClick={handleCopy}
                            className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                          >
                            {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>
                      <div className="p-5">
                        <textarea
                          value={editedDescription}
                          onChange={e => setEditedDescription(e.target.value)}
                          rows={14}
                          className="w-full border border-gray-200 rounded-xl p-4 text-sm leading-relaxed focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none"
                        />
                      </div>
                    </div>

                    {/* Similar Projects */}
                    {result.similar_projects.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                        <button
                          onClick={() => setShowSimilar(!showSimilar)}
                          className="w-full bg-gray-50 px-5 py-3 border-b border-gray-100 flex items-center justify-between hover:bg-gray-100 transition-colors"
                        >
                          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-indigo-600" />
                            Similar Successful Projects ({result.similar_projects.length})
                          </h3>
                          {showSimilar ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </button>
                        {showSimilar && (
                          <div className="p-5 space-y-3">
                            {result.similar_projects.map((p, i) => (
                              <div key={i} className="bg-gray-50 rounded-xl p-4">
                                <p className="font-semibold text-gray-900 text-sm">{p.title}</p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                  <span className="font-medium text-emerald-700">{p.budget_range}</span>
                                  <span>{p.proposals} proposals</span>
                                </div>
                                {p.skills.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {p.skills.map(s => (
                                      <span key={s} className="text-xs bg-white text-gray-600 px-2 py-0.5 rounded border border-gray-200">{s}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tips */}
                    {result.tips.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
                        <button
                          onClick={() => setShowTips(!showTips)}
                          className="w-full px-5 py-3 flex items-center justify-between hover:bg-amber-100/50 transition-colors"
                        >
                          <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            Tips for Attracting Great Talent
                          </h3>
                          {showTips ? <ChevronUp className="w-4 h-4 text-amber-400" /> : <ChevronDown className="w-4 h-4 text-amber-400" />}
                        </button>
                        {showTips && (
                          <div className="px-5 pb-4 space-y-2">
                            {result.tips.map((tip, i) => (
                              <div key={i} className="flex items-start gap-2.5">
                                <span className="w-5 h-5 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                                <span className="text-sm text-amber-800">{tip}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* CTA — Post Job */}
                    <div className="bg-gray-900 rounded-2xl p-6 text-center">
                      <p className="text-gray-300 text-sm mb-4">Your project brief is ready! Post it now to start receiving proposals from skilled freelancers.</p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          onClick={handlePostJob}
                          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-emerald-500/20"
                        >
                          <Send className="w-4 h-4" />
                          Post This Job
                        </button>
                        <button
                          onClick={handleCopy}
                          className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          {copied ? 'Copied!' : 'Copy Brief'}
                        </button>
                        <Link
                          href="/talent"
                          className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
                        >
                          Browse Talent
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
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
