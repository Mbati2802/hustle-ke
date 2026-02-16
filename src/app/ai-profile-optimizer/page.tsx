'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAuth } from '@/contexts/AuthContext'
import {
  Brain,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  Shield,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  User,
  Camera,
  FileText,
  Award,
  Briefcase,
  Star,
  Copy,
  Check,
  ChevronRight,
  Zap,
  Crown,
  BarChart3,
  Eye,
  Lightbulb,
  XCircle,
} from 'lucide-react'

interface ProfileSection {
  name: string
  score: number
  maxScore: number
  status: 'excellent' | 'good' | 'needs_work' | 'missing'
  tips: string[]
}

interface TopEarnerComparison {
  metric: string
  yours: string
  topEarners: string
  gap: 'ahead' | 'on_track' | 'behind'
}

interface AnalysisResult {
  overallScore: number
  maxScore: number
  sections: ProfileSection[]
  suggestedBio: string
  suggestedTitle: string
  suggestedSkills: string[]
  topEarnerComparison: TopEarnerComparison[]
  actionPlan: string[]
}

const STATUS_CONFIG = {
  excellent: { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 },
  good: { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100', icon: CheckCircle2 },
  needs_work: { label: 'Needs Work', color: 'text-amber-600', bg: 'bg-amber-100', icon: AlertTriangle },
  missing: { label: 'Missing', color: 'text-red-600', bg: 'bg-red-100', icon: XCircle },
}

const GAP_CONFIG = {
  ahead: { label: 'Ahead', color: 'text-green-600', bg: 'bg-green-50' },
  on_track: { label: 'On Track', color: 'text-blue-600', bg: 'bg-blue-50' },
  behind: { label: 'Behind', color: 'text-red-600', bg: 'bg-red-50' },
}

const SECTION_ICONS: Record<string, typeof User> = {
  'Basic Info & Photo': Camera,
  'Professional Title': Award,
  'Bio / About': FileText,
  'Skills': Zap,
  'Hourly Rate': DollarSign,
  'Portfolio': Briefcase,
  'Education & Certifications': Award,
  'Verification & Experience': Shield,
}

function getScoreGrade(score: number) {
  if (score >= 85) return { label: 'A+', color: 'text-green-600', desc: 'Outstanding profile' }
  if (score >= 70) return { label: 'A', color: 'text-green-600', desc: 'Strong profile' }
  if (score >= 55) return { label: 'B', color: 'text-blue-600', desc: 'Good — room to improve' }
  if (score >= 40) return { label: 'C', color: 'text-amber-600', desc: 'Needs attention' }
  if (score >= 25) return { label: 'D', color: 'text-orange-600', desc: 'Significant gaps' }
  return { label: 'F', color: 'text-red-600', desc: 'Incomplete profile' }
}

export default function AIProfileOptimizerPage() {
  const { profile, loading: authLoading } = useAuth()
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedBio, setCopiedBio] = useState(false)
  const [copiedTitle, setCopiedTitle] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const runAnalysis = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai-profile-optimizer')
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to analyze profile')
        return
      }
      const data = await res.json()
      setAnalysis(data)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile && !authLoading) {
      runAnalysis()
    }
  }, [profile, authLoading])

  const copyToClipboard = (text: string, type: 'bio' | 'title') => {
    navigator.clipboard.writeText(text)
    if (type === 'bio') { setCopiedBio(true); setTimeout(() => setCopiedBio(false), 2000) }
    else { setCopiedTitle(true); setTimeout(() => setCopiedTitle(false), 2000) }
  }

  const grade = analysis ? getScoreGrade(analysis.overallScore) : null
  const excellentCount = analysis?.sections.filter(s => s.status === 'excellent').length || 0
  const needsWorkCount = analysis?.sections.filter(s => s.status === 'needs_work' || s.status === 'missing').length || 0

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          </div>
          <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-10 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                AI Profile Optimizer
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
                Optimize Your Profile to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Win More Jobs</span>
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                Our AI scans your profile section by section, scores it against top earners, and generates actionable improvements — including an AI-written bio and title.
              </p>
              <div className="flex flex-wrap gap-3 justify-center mt-6">
                {[
                  { icon: Target, text: 'Score 0-100', color: 'text-green-400' },
                  { icon: Eye, text: '8 Section Deep-Scan', color: 'text-blue-400' },
                  { icon: Lightbulb, text: 'AI Suggestions', color: 'text-amber-400' },
                ].map(item => (
                  <div key={item.text} className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <span className="text-sm text-gray-300">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Not logged in */}
        {!authLoading && !profile && (
          <section className="py-20">
            <div className="max-w-md mx-auto px-4 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Sign In to Analyze Your Profile</h2>
              <p className="text-gray-500 mb-6">You need to be logged in so our AI can scan your profile data.</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3.5 rounded-xl font-bold transition-colors"
              >
                Sign In <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        )}

        {/* Loading */}
        {loading && (
          <section className="py-20">
            <div className="max-w-md mx-auto px-4 text-center">
              <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-5" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">AI is Analyzing Your Profile...</h2>
              <p className="text-gray-500 text-sm">Scanning 8 sections and comparing against top earners</p>
            </div>
          </section>
        )}

        {/* Error */}
        {error && (
          <section className="py-20">
            <div className="max-w-md mx-auto px-4 text-center">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Analysis Failed</h2>
              <p className="text-gray-500 mb-4">{error}</p>
              <button onClick={runAnalysis} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors">
                Try Again
              </button>
            </div>
          </section>
        )}

        {/* Results */}
        {analysis && !loading && (
          <section className="py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

              {/* Overall Score Card */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 md:p-8 mb-8 text-white">
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                  {/* Score Circle */}
                  <div className="relative w-36 h-36 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                      <circle
                        cx="60" cy="60" r="52" fill="none"
                        stroke={analysis.overallScore >= 70 ? '#22c55e' : analysis.overallScore >= 40 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${(analysis.overallScore / 100) * 327} 327`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold">{analysis.overallScore}</span>
                      <span className="text-xs text-gray-400">/ 100</span>
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                      <span className={`text-3xl font-bold ${grade?.color}`}>{grade?.label}</span>
                      <span className="text-gray-400">—</span>
                      <span className="text-gray-300">{grade?.desc}</span>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">
                      {excellentCount} section{excellentCount !== 1 ? 's' : ''} excellent, {needsWorkCount} need{needsWorkCount !== 1 ? '' : 's'} attention
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      <Link
                        href="/dashboard/settings"
                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                      >
                        Edit Profile <ArrowRight className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={runAnalysis}
                        className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                      >
                        <Sparkles className="w-4 h-4" /> Re-Analyze
                      </button>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 shrink-0">
                    {[
                      { label: 'Excellent', value: excellentCount, color: 'text-green-400' },
                      { label: 'Good', value: analysis.sections.filter(s => s.status === 'good').length, color: 'text-blue-400' },
                      { label: 'Fix', value: needsWorkCount, color: 'text-red-400' },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-[10px] text-gray-500 uppercase font-semibold">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left — Section Scores (2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Section Breakdown */}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-emerald-500" />
                      Section-by-Section Analysis
                    </h2>
                    <div className="space-y-2">
                      {analysis.sections.map(section => {
                        const config = STATUS_CONFIG[section.status]
                        const Icon = SECTION_ICONS[section.name] || User
                        const StatusIcon = config.icon
                        const pct = Math.round((section.score / section.maxScore) * 100)
                        const isExpanded = expandedSection === section.name
                        return (
                          <div key={section.name} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <button
                              onClick={() => setExpandedSection(isExpanded ? null : section.name)}
                              className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
                            >
                              <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center shrink-0`}>
                                <Icon className={`w-5 h-5 ${config.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-semibold text-gray-900 text-sm">{section.name}</h3>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm font-bold ${config.color}`}>{section.score}/{section.maxScore}</span>
                                    <StatusIcon className={`w-4 h-4 ${config.color}`} />
                                  </div>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${
                                      pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                              <ChevronRight className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>
                            {isExpanded && section.tips.length > 0 && (
                              <div className="px-4 pb-4 pt-1 ml-14">
                                <ul className="space-y-1.5">
                                  {section.tips.map((tip, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                      <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                      {tip}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {isExpanded && section.tips.length === 0 && (
                              <div className="px-4 pb-4 ml-14">
                                <p className="text-sm text-green-600 flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" /> This section looks great — no improvements needed!
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Top Earner Comparison */}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Crown className="w-5 h-5 text-amber-500" />
                      How You Compare to Top Earners
                    </h2>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="grid grid-cols-4 bg-gray-50 border-b border-gray-200 px-4 py-3">
                        <div className="text-[11px] font-bold text-gray-500 uppercase">Metric</div>
                        <div className="text-[11px] font-bold text-gray-500 uppercase text-center">You</div>
                        <div className="text-[11px] font-bold text-gray-500 uppercase text-center">Top Earners</div>
                        <div className="text-[11px] font-bold text-gray-500 uppercase text-center">Status</div>
                      </div>
                      {analysis.topEarnerComparison.map(row => {
                        const gap = GAP_CONFIG[row.gap]
                        return (
                          <div key={row.metric} className="grid grid-cols-4 items-center px-4 py-3 border-b border-gray-100 last:border-0">
                            <div className="text-sm font-medium text-gray-700">{row.metric}</div>
                            <div className="text-sm text-gray-900 font-semibold text-center">{row.yours}</div>
                            <div className="text-sm text-gray-500 text-center">{row.topEarners}</div>
                            <div className="text-center">
                              <span className={`inline-flex items-center gap-1 ${gap.bg} ${gap.color} px-2 py-0.5 rounded-full text-[11px] font-bold`}>
                                {gap.label}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Right — AI Suggestions (1 col) */}
                <div className="space-y-6">
                  {/* Action Plan */}
                  {analysis.actionPlan.length > 0 && (
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-2xl p-5">
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Target className="w-5 h-5 text-red-500" />
                        Priority Action Plan
                      </h3>
                      <ol className="space-y-2.5">
                        {analysis.actionPlan.map((action, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-sm text-gray-700">{action}</span>
                          </li>
                        ))}
                      </ol>
                      <Link
                        href="/dashboard/settings"
                        className="mt-4 inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors w-full justify-center"
                      >
                        Fix Now <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}

                  {/* AI Suggested Title */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      Suggested Title
                    </h3>
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-2">
                      <p className="text-sm text-purple-800 font-medium">{analysis.suggestedTitle}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(analysis.suggestedTitle, 'title')}
                      className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      {copiedTitle ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Title</>}
                    </button>
                  </div>

                  {/* AI Suggested Bio */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      AI-Generated Bio
                    </h3>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-2">
                      <p className="text-sm text-emerald-800 leading-relaxed">{analysis.suggestedBio}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(analysis.suggestedBio, 'bio')}
                      className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      {copiedBio ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Bio</>}
                    </button>
                  </div>

                  {/* Suggested Skills */}
                  {analysis.suggestedSkills.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-5">
                      <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        In-Demand Skills to Add
                      </h3>
                      <p className="text-xs text-gray-500 mb-3">Based on current job market demand</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.suggestedSkills.map(skill => (
                          <span key={skill} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                            + {skill}
                          </span>
                        ))}
                      </div>
                      <Link
                        href="/dashboard/settings"
                        className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Add to profile <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* How it works — show when not logged in */}
        {!profile && !authLoading && (
          <section className="py-16 bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">What the AI Analyzes</h2>
                <p className="text-gray-500">8 critical sections of your freelancer profile</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: 'Photo & Info', desc: 'Name, photo, phone, county', icon: Camera, color: 'from-pink-500 to-rose-600' },
                  { title: 'Title & Bio', desc: 'Professional headline and about section', icon: FileText, color: 'from-purple-500 to-indigo-600' },
                  { title: 'Skills', desc: 'Number and relevance of listed skills', icon: Zap, color: 'from-amber-500 to-orange-600' },
                  { title: 'Rate', desc: 'Competitive pricing vs market average', icon: DollarSign, color: 'from-green-500 to-emerald-600' },
                  { title: 'Portfolio', desc: 'Project showcases with images', icon: Briefcase, color: 'from-blue-500 to-cyan-600' },
                  { title: 'Education', desc: 'Degrees and certifications', icon: Award, color: 'from-teal-500 to-emerald-600' },
                  { title: 'Verification', desc: 'ID verification and experience', icon: Shield, color: 'from-indigo-500 to-purple-600' },
                  { title: 'vs Top Earners', desc: 'How you stack up against the best', icon: Crown, color: 'from-yellow-500 to-amber-600' },
                ].map(item => (
                  <div key={item.title} className="bg-white rounded-2xl border border-gray-200 p-5 text-center hover:shadow-md transition-shadow">
                    <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-16 bg-gradient-to-br from-emerald-600 to-teal-700">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Sparkles className="w-10 h-10 text-emerald-200 mx-auto mb-5" />
            <h2 className="text-3xl font-bold text-white mb-4">Build a Profile That Wins</h2>
            <p className="text-emerald-100 text-lg mb-8 max-w-xl mx-auto">
              Top-scoring profiles get 4x more views, 3x more proposals accepted, and earn 2x more on average.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {profile ? (
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 px-8 py-4 rounded-xl font-bold text-lg transition-colors"
                >
                  <User className="w-5 h-5" />
                  Edit My Profile
                </Link>
              ) : (
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 px-8 py-4 rounded-xl font-bold text-lg transition-colors"
                >
                  <Star className="w-5 h-5" />
                  Create Free Account
                </Link>
              )}
              <Link
                href="/ai-job-matcher"
                className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
              >
                <Brain className="w-5 h-5" />
                AI Job Matcher
              </Link>
            </div>
            <p className="mt-6 text-sm text-emerald-200 flex items-center justify-center gap-4 flex-wrap">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Free analysis</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> AI-generated content</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Actionable tips</span>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
