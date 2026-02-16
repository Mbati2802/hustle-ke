'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAuth } from '@/contexts/AuthContext'
import {
  Brain,
  Search,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  Shield,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowRight,
  Briefcase,
  MapPin,
  Eye,
  Crown,
  Zap,
  ChevronDown,
  ChevronUp,
  Star,
  Send,
  BarChart3,
} from 'lucide-react'

interface MatchedJob {
  id: string
  title: string
  description: string
  skills_required: string[]
  budget_min: number
  budget_max: number
  payment_type: string
  location_preference: string
  remote_allowed: boolean
  created_at: string
  views: number
  matchScore: number
  matchedSkills: string[]
  missingSkills: string[]
  reasons: string[]
  winProbability: number
  competitionLevel: 'low' | 'medium' | 'high' | 'saturated'
  daysOld: number
  client: {
    id: string
    full_name: string
    avatar_url: string | null
    verification_status: string
    hustle_score: number
  }
}

interface SalaryInsight {
  skill: string
  supply: number
  avgRate: number
  minRate: number
  maxRate: number
}

const POPULAR_SKILLS = [
  'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'Next.js',
  'Graphic Design', 'UI/UX Design', 'Figma', 'WordPress', 'PHP', 'Laravel',
  'Flutter', 'React Native', 'Data Analysis', 'Excel', 'SEO', 'Content Writing',
  'Video Editing', 'Photography', 'Social Media', 'Accounting', 'Translation',
  'Mobile Development', 'AWS', 'Docker', 'MongoDB', 'PostgreSQL',
]

const COMPETITION_COLORS = {
  low: { text: 'text-green-600', bg: 'bg-green-100', label: 'Low Competition' },
  medium: { text: 'text-amber-600', bg: 'bg-amber-100', label: 'Medium' },
  high: { text: 'text-orange-600', bg: 'bg-orange-100', label: 'High' },
  saturated: { text: 'text-red-600', bg: 'bg-red-100', label: 'Very High' },
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-gray-500'
}

function getScoreBg(score: number) {
  if (score >= 80) return 'from-green-500 to-emerald-600'
  if (score >= 60) return 'from-emerald-500 to-teal-600'
  if (score >= 40) return 'from-amber-500 to-orange-600'
  return 'from-gray-400 to-gray-500'
}

export default function AIJobMatcherPage() {
  const { profile } = useAuth()
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [experience, setExperience] = useState(1)
  const [rate, setRate] = useState(0)
  const [matches, setMatches] = useState<MatchedJob[]>([])
  const [salaryInsights, setSalaryInsights] = useState<SalaryInsight[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [expandedJob, setExpandedJob] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Pre-fill from profile
  useEffect(() => {
    if (profile) {
      if (profile.skills && profile.skills.length > 0) {
        setSelectedSkills(profile.skills.slice(0, 10))
      }
      if (profile.hourly_rate) setRate(profile.hourly_rate)
      if (profile.years_experience) setExperience(profile.years_experience)
    }
  }, [profile])

  const addSkill = useCallback((skill: string) => {
    const trimmed = skill.trim()
    if (trimmed && !selectedSkills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setSelectedSkills(prev => [...prev, trimmed])
    }
    setSkillInput('')
    setShowSuggestions(false)
  }, [selectedSkills])

  const removeSkill = (skill: string) => {
    setSelectedSkills(prev => prev.filter(s => s !== skill))
  }

  const filteredSuggestions = skillInput.length >= 1
    ? POPULAR_SKILLS.filter(s =>
        s.toLowerCase().includes(skillInput.toLowerCase()) &&
        !selectedSkills.some(sel => sel.toLowerCase() === s.toLowerCase())
      ).slice(0, 8)
    : []

  const runMatching = async () => {
    if (selectedSkills.length === 0) return
    setLoading(true)
    setHasSearched(true)
    try {
      const params = new URLSearchParams({
        skills: selectedSkills.join(','),
        experience: experience.toString(),
        rate: rate.toString(),
      })
      const res = await fetch(`/api/ai-job-matcher?${params}`)
      const data = await res.json()
      setMatches(data.matches || [])
      setSalaryInsights(data.salaryInsights || [])
    } catch {
      setMatches([])
    } finally {
      setLoading(false)
    }
  }

  const topMatch = matches.length > 0 ? matches[0] : null

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          </div>
          <div className="absolute top-20 right-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <Brain className="w-4 h-4" />
                AI-Powered Job Matching
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
                Find Jobs That Match <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Your Skills</span>
              </h1>
              <p className="text-gray-400 text-lg mb-4 leading-relaxed">
                Our AI analyzes every open job against your skill set, experience, and rate to find your best opportunities — ranked by fit score and win probability.
              </p>
              <div className="flex flex-wrap gap-3 justify-center mt-6">
                {[
                  { icon: Target, text: 'Fit Score 0-100', color: 'text-green-400' },
                  { icon: BarChart3, text: 'Win Probability', color: 'text-blue-400' },
                  { icon: Zap, text: 'Real-Time Matching', color: 'text-amber-400' },
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

        {/* Input Section */}
        <section className="py-12 bg-gray-50 border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Enter Your Skills
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                {profile?.skills ? 'Pre-filled from your profile. Edit as needed.' : 'Add your skills to find matching jobs.'}
              </p>

              {/* Skill Input */}
              <div className="relative mb-4">
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl min-h-[52px]">
                  {selectedSkills.map(skill => (
                    <span key={skill} className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="hover:text-purple-900">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => { setSkillInput(e.target.value); setShowSuggestions(true) }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && skillInput.trim()) {
                        e.preventDefault()
                        addSkill(skillInput)
                      }
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder={selectedSkills.length === 0 ? 'Type a skill and press Enter...' : 'Add more...'}
                    className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm"
                  />
                </div>

                {/* Suggestions dropdown */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {filteredSuggestions.map(skill => (
                      <button
                        key={skill}
                        onClick={() => addSkill(skill)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 hover:text-purple-700 transition-colors"
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick add popular skills */}
              {selectedSkills.length === 0 && (
                <div className="mb-5">
                  <p className="text-xs text-gray-400 mb-2">Popular skills:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_SKILLS.slice(0, 12).map(skill => (
                      <button
                        key={skill}
                        onClick={() => addSkill(skill)}
                        className="px-3 py-1 bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-700 rounded-full text-xs transition-colors"
                      >
                        + {skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience & Rate */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Years of Experience</label>
                  <input
                    type="number"
                    value={experience}
                    onChange={(e) => setExperience(Math.max(0, parseInt(e.target.value) || 0))}
                    min={0}
                    max={30}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 focus:border-purple-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hourly Rate (KES)</label>
                  <input
                    type="number"
                    value={rate || ''}
                    onChange={(e) => setRate(parseInt(e.target.value) || 0)}
                    placeholder="e.g. 2000"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 focus:border-purple-300"
                  />
                </div>
              </div>

              <button
                onClick={runMatching}
                disabled={selectedSkills.length === 0 || loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-300 disabled:to-gray-400 text-white py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    AI is analyzing jobs...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    Find My Best Matches
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Results */}
        {hasSearched && !loading && (
          <section className="py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Summary bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {matches.length > 0 ? `${matches.length} Jobs Match Your Profile` : 'No Matches Found'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {matches.length > 0
                      ? `Ranked by AI fit score. Top match: ${topMatch?.matchScore}% fit.`
                      : 'Try adding more skills or broadening your criteria.'}
                  </p>
                </div>
                {matches.length > 0 && salaryInsights.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-2.5">
                    <p className="text-xs text-purple-500 font-semibold uppercase">Avg Rate for Your Skills</p>
                    <p className="text-lg font-bold text-purple-700">
                      KES {Math.round(salaryInsights.reduce((s, i) => s + i.avgRate, 0) / salaryInsights.filter(i => i.avgRate > 0).length || 0).toLocaleString()}/hr
                    </p>
                  </div>
                )}
              </div>

              {matches.length === 0 && (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-700 mb-2">No matching jobs right now</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                    There are no open jobs matching your skill set at this moment. Try adding more skills or check back later.
                  </p>
                  <Link href="/jobs" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors">
                    Browse All Jobs <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* Salary Insights */}
              {salaryInsights.length > 0 && salaryInsights.some(s => s.avgRate > 0) && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
                  {salaryInsights.filter(s => s.avgRate > 0).slice(0, 5).map(insight => (
                    <div key={insight.skill} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                      <p className="text-xs text-gray-400 font-semibold uppercase truncate">{insight.skill}</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">KES {insight.avgRate.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400">avg/hr &bull; {insight.supply} freelancers</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Job Cards */}
              <div className="space-y-4">
                {matches.map((job, index) => {
                  const isExpanded = expandedJob === job.id
                  const comp = COMPETITION_COLORS[job.competitionLevel]
                  return (
                    <div
                      key={job.id}
                      className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                        index === 0 ? 'border-purple-200 shadow-md ring-1 ring-purple-100' : 'border-gray-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="p-5 md:p-6">
                        <div className="flex items-start gap-4">
                          {/* Score Circle */}
                          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getScoreBg(job.matchScore)} flex flex-col items-center justify-center shrink-0 shadow-lg`}>
                            <span className="text-xl font-bold text-white">{job.matchScore}</span>
                            <span className="text-[9px] text-white/80 font-medium uppercase">Match</span>
                          </div>

                          {/* Job Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                {index === 0 && (
                                  <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[10px] font-bold mb-1.5">
                                    <Star className="w-3 h-3" /> Best Match
                                  </span>
                                )}
                                <h3 className="text-lg font-bold text-gray-900 leading-snug">
                                  <Link href={`/jobs/${job.id}`} className="hover:text-purple-600 transition-colors">
                                    {job.title}
                                  </Link>
                                </h3>
                                <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500 flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="w-3.5 h-3.5" />
                                    KES {(job.budget_min || 0).toLocaleString()} — {(job.budget_max || 0).toLocaleString()}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {job.remote_allowed ? 'Remote' : job.location_preference || 'Any'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {job.daysOld === 0 ? 'Today' : `${job.daysOld}d ago`}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="text-sm font-bold text-gray-900">{job.winProbability}%</div>
                                <div className="text-[10px] text-gray-400 uppercase font-semibold">Win Prob</div>
                              </div>
                            </div>

                            {/* Skills */}
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {job.matchedSkills.map(skill => (
                                <span key={skill} className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium border border-green-200">
                                  <CheckCircle2 className="w-3 h-3" /> {skill}
                                </span>
                              ))}
                              {job.missingSkills.map(skill => (
                                <span key={skill} className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs">
                                  {skill}
                                </span>
                              ))}
                            </div>

                            {/* Reasons + Competition */}
                            <div className="flex items-center gap-3 mt-3 flex-wrap">
                              <span className={`inline-flex items-center gap-1 ${comp.bg} ${comp.text} px-2 py-0.5 rounded-full text-[11px] font-semibold`}>
                                {comp.label}
                              </span>
                              {job.client?.verification_status === 'ID-Verified' && (
                                <span className="inline-flex items-center gap-1 text-blue-600 text-xs">
                                  <Shield className="w-3 h-3" /> Verified Client
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expand/Collapse */}
                        <button
                          onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                          className="mt-4 w-full flex items-center justify-center gap-1 text-sm text-gray-400 hover:text-purple-600 transition-colors py-1"
                        >
                          {isExpanded ? 'Less detail' : 'Why this matches you'}
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-3 pt-4 border-t border-gray-100">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">AI Match Reasons</h4>
                                <ul className="space-y-1.5">
                                  {job.reasons.map((reason, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                      {reason}
                                    </li>
                                  ))}
                                </ul>
                                {job.missingSkills.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-xs text-amber-600 flex items-center gap-1 font-medium">
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                      Skills you could add: {job.missingSkills.join(', ')}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Job Preview</h4>
                                <p className="text-sm text-gray-500 line-clamp-4">{job.description}</p>
                                <div className="mt-3 flex gap-2">
                                  <Link
                                    href={`/jobs/${job.id}`}
                                    className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                                  >
                                    <Eye className="w-4 h-4" /> View Job
                                  </Link>
                                  <Link
                                    href={`/jobs/${job.id}/apply`}
                                    className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                                  >
                                    <Send className="w-4 h-4" /> Apply Now
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {matches.length > 0 && (
                <div className="mt-8 text-center">
                  <Link
                    href="/jobs"
                    className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold text-sm"
                  >
                    Browse all jobs manually <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Not searched yet — features */}
        {!hasSearched && (
          <section className="py-16 bg-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">How AI Matching Works</h2>
                <p className="text-gray-500">Our algorithm scores every job based on 5 factors</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { title: 'Skill Fit', desc: 'How many of your skills match the job requirements', points: '0-50 pts', icon: Target, color: 'from-purple-500 to-indigo-600' },
                  { title: 'Budget Match', desc: 'Does the job budget align with your rate?', points: '0-15 pts', icon: DollarSign, color: 'from-green-500 to-emerald-600' },
                  { title: 'Competition', desc: 'Fewer freelancers with these skills = higher score', points: '0-15 pts', icon: TrendingUp, color: 'from-amber-500 to-orange-600' },
                  { title: 'Freshness', desc: 'Newer jobs get higher scores — apply early', points: '0-10 pts', icon: Clock, color: 'from-blue-500 to-cyan-600' },
                  { title: 'Client Quality', desc: 'Verified clients with high scores rank better', points: '0-10 pts', icon: Shield, color: 'from-pink-500 to-rose-600' },
                ].map(item => (
                  <div key={item.title} className="bg-gray-50 rounded-2xl border border-gray-200 p-5 text-center hover:shadow-md transition-shadow group">
                    <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-105 transition-transform`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{item.points}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-16 bg-gradient-to-br from-purple-600 to-blue-700">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Brain className="w-10 h-10 text-purple-200 mx-auto mb-5" />
            <h2 className="text-3xl font-bold text-white mb-4">Let AI Work for You</h2>
            <p className="text-purple-100 text-lg mb-8 max-w-xl mx-auto">
              Stop scrolling through jobs manually. Our AI finds the best opportunities for your exact skill set in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!profile ? (
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 bg-white text-purple-700 hover:bg-purple-50 px-8 py-4 rounded-xl font-bold text-lg transition-colors"
                >
                  <Sparkles className="w-5 h-5" />
                  Sign Up Free
                </Link>
              ) : (
                <button
                  onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' }) || window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="inline-flex items-center justify-center gap-2 bg-white text-purple-700 hover:bg-purple-50 px-8 py-4 rounded-xl font-bold text-lg transition-colors"
                >
                  <Brain className="w-5 h-5" />
                  Run AI Match
                </button>
              )}
              <Link
                href="/career-intelligence"
                className="inline-flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-400 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
                Career Intelligence
              </Link>
            </div>
            <p className="mt-6 text-sm text-purple-200 flex items-center justify-center gap-4 flex-wrap">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Free to use</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Real-time data</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> No sign-up required</span>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
