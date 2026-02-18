'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Dna,
  Trophy,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Play,
  Send,
  Star,
  Shield,
  Loader2,
  ArrowLeft,
  Sparkles,
  Target,
  Award,
  Zap,
  Code,
  Pen,
  BarChart3,
  Palette,
} from 'lucide-react'

interface Challenge {
  id: string
  skill_name: string
  difficulty: string
  challenge_type: string
  title: string
  description: string
  prompt?: string
  time_limit_seconds: number
  evaluation_criteria?: Array<{ criterion: string; weight: number; description: string }>
}

interface VerifiedSkill {
  id: string
  skill_name: string
  badge_level: 'bronze' | 'silver' | 'gold' | 'diamond'
  score: number
  verified_at: string
  expires_at: string
}

interface EvaluationResult {
  verification_id: string
  score: number
  badge_level: string
  criteria_scores: Array<{ criterion: string; score: number; maxScore: number; feedback: string }>
  overall_feedback: string
  strengths: string[]
  improvements: string[]
  is_new_best: boolean
}

const badgeConfig: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  diamond: { color: 'text-cyan-700', bg: 'bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200', icon: '💎', label: 'Diamond' },
  gold: { color: 'text-amber-700', bg: 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200', icon: '🥇', label: 'Gold' },
  silver: { color: 'text-gray-600', bg: 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200', icon: '🥈', label: 'Silver' },
  bronze: { color: 'text-orange-700', bg: 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200', icon: '🥉', label: 'Bronze' },
}

const typeIcons: Record<string, typeof Code> = {
  code: Code,
  writing: Pen,
  analysis: BarChart3,
  design: Palette,
  quiz: Target,
}

export default function SkillDNAPage() {
  const { user, profile } = useAuth()
  const [verifiedSkills, setVerifiedSkills] = useState<VerifiedSkill[]>([])
  const [categories, setCategories] = useState<Array<{ skill: string; difficulties: string[]; types: string[] }>>([])
  const [loading, setLoading] = useState(true)

  // Challenge flow state
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null)
  const [challengeStarted, setChallengeStarted] = useState(false)
  const [response, setResponse] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<EvaluationResult | null>(null)
  const [canRetake, setCanRetake] = useState(true)
  const [loadingChallenges, setLoadingChallenges] = useState(false)

  useEffect(() => {
    if (!user) return
    Promise.all([
      fetch('/api/skilldna?action=my-skills').then(r => r.json()),
      fetch('/api/skilldna?action=categories').then(r => r.json()),
    ]).then(([skillsData, catData]) => {
      setVerifiedSkills(skillsData.skills || [])
      setCategories(catData.categories || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [user])

  // Load challenges for a skill
  const loadChallenges = async (skill: string) => {
    setSelectedSkill(skill)
    setLoadingChallenges(true)
    setActiveChallenge(null)
    setResult(null)
    setChallengeStarted(false)
    try {
      const res = await fetch(`/api/skilldna?action=challenges&skill=${encodeURIComponent(skill)}`)
      const data = await res.json()
      setChallenges(data.challenges || [])
      setCanRetake(data.canRetake !== false)
    } catch {}
    setLoadingChallenges(false)
  }

  // Start a challenge
  const startChallenge = async (challenge: Challenge) => {
    try {
      const res = await fetch('/api/skilldna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', challenge_id: challenge.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Cannot start challenge')
        return
      }
      setActiveChallenge(data.challenge)
      setChallengeStarted(true)
      setResponse('')
      setResult(null)
      setTimeLeft(data.challenge.time_limit_seconds)
      setStartTime(Date.now())
    } catch {
      alert('Network error')
    }
  }

  // Timer
  useEffect(() => {
    if (!challengeStarted || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [challengeStarted, timeLeft])

  // Submit response
  const submitResponse = useCallback(async () => {
    if (!activeChallenge || submitting) return
    setSubmitting(true)
    const timeTaken = Math.round((Date.now() - startTime) / 1000)
    try {
      const res = await fetch('/api/skilldna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          challenge_id: activeChallenge.id,
          response,
          time_taken_seconds: timeTaken,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult(data)
        setChallengeStarted(false)
        // Refresh verified skills
        const skillsRes = await fetch('/api/skilldna?action=my-skills')
        const skillsData = await skillsRes.json()
        setVerifiedSkills(skillsData.skills || [])
      } else {
        alert(data.error || 'Submission failed')
      }
    } catch {
      alert('Network error')
    }
    setSubmitting(false)
  }, [activeChallenge, response, startTime, submitting])

  // Auto-submit when time runs out
  useEffect(() => {
    if (challengeStarted && timeLeft === 0 && response.length > 0) {
      submitResponse()
    }
  }, [timeLeft, challengeStarted, response, submitResponse])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  // Result view
  if (result) {
    const badge = badgeConfig[result.badge_level] || badgeConfig.bronze
    return (
      <div className="p-4 lg:p-6 xl:p-8 pb-24 lg:pb-8 max-w-3xl mx-auto">
        <button onClick={() => { setResult(null); setActiveChallenge(null) }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to challenges
        </button>

        {/* Score Card */}
        <div className={`rounded-2xl border p-6 lg:p-8 mb-6 text-center ${badge.bg}`}>
          <div className="text-5xl mb-3">{badge.icon}</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {result.is_new_best ? '🎉 New Personal Best!' : 'Challenge Complete!'}
          </h2>
          <p className={`text-lg font-semibold ${badge.color}`}>{badge.label} Badge — {result.score}/100</p>
          <p className="text-sm text-gray-600 mt-2">{result.overall_feedback}</p>
        </div>

        {/* Criteria Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-green-600" /> Score Breakdown
          </h3>
          <div className="space-y-3">
            {result.criteria_scores.map((cs, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{cs.criterion}</span>
                  <span className="text-sm font-bold text-gray-900">{cs.score}/{cs.maxScore}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                  <div
                    className={`h-2 rounded-full transition-all ${cs.score / cs.maxScore >= 0.75 ? 'bg-green-500' : cs.score / cs.maxScore >= 0.5 ? 'bg-amber-500' : 'bg-red-400'}`}
                    style={{ width: `${(cs.score / cs.maxScore) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{cs.feedback}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Improvements */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 rounded-xl border border-green-200 p-4">
            <h4 className="font-semibold text-green-800 text-sm mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Strengths
            </h4>
            <ul className="space-y-1.5">
              {result.strengths.map((s, i) => (
                <li key={i} className="text-xs text-green-700 flex items-start gap-1.5">
                  <Star className="w-3 h-3 mt-0.5 shrink-0" /> {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <h4 className="font-semibold text-amber-800 text-sm mb-2 flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> Areas to Improve
            </h4>
            <ul className="space-y-1.5">
              {result.improvements.map((s, i) => (
                <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                  <Target className="w-3 h-3 mt-0.5 shrink-0" /> {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => { setResult(null); setActiveChallenge(null); setSelectedSkill(null) }}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors">
            Try Another Skill
          </button>
          <Link href="/dashboard/settings?tab=profile"
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm text-center transition-colors">
            View My Profile
          </Link>
        </div>
      </div>
    )
  }

  // Active challenge view
  if (activeChallenge && challengeStarted) {
    const isTimeWarning = timeLeft <= 30
    const isTimeUp = timeLeft === 0
    return (
      <div className="p-4 lg:p-6 xl:p-8 pb-24 lg:pb-8 max-w-3xl mx-auto">
        {/* Timer Bar */}
        <div className={`sticky top-0 z-10 rounded-xl p-3 mb-4 flex items-center justify-between ${isTimeWarning ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${isTimeWarning ? 'text-red-600' : 'text-green-600'}`} />
            <span className={`font-mono font-bold text-lg ${isTimeWarning ? 'text-red-700' : 'text-green-700'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{activeChallenge.skill_name} • {activeChallenge.difficulty}</span>
            <button
              onClick={submitResponse}
              disabled={submitting || response.trim().length < 10}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Submit
            </button>
          </div>
        </div>

        {/* Challenge */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <h2 className="font-bold text-gray-900 text-lg mb-1">{activeChallenge.title}</h2>
          <p className="text-sm text-gray-500 mb-4">{activeChallenge.description}</p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
            {activeChallenge.prompt}
          </div>
        </div>

        {/* Response Area */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Your Response</span>
            <span className="text-xs text-gray-400">{response.length} characters</span>
          </div>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full p-4 text-sm font-mono min-h-[300px] resize-y focus:outline-none"
            autoFocus
            disabled={isTimeUp}
          />
        </div>
      </div>
    )
  }

  // Challenge selection view
  if (selectedSkill) {
    return (
      <div className="p-4 lg:p-6 xl:p-8 pb-24 lg:pb-8 max-w-3xl mx-auto">
        <button onClick={() => setSelectedSkill(null)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to skills
        </button>

        <h1 className="text-xl font-bold text-gray-900 mb-1">
          <Dna className="w-5 h-5 inline text-green-600 mr-1" /> {selectedSkill} Verification
        </h1>
        <p className="text-sm text-gray-500 mb-6">Complete a micro-challenge to earn your SkillDNA badge</p>

        {!canRetake && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Cooldown Active</p>
              <p className="text-xs text-amber-700">You can retake this skill challenge in 7 days. Try a different skill in the meantime!</p>
            </div>
          </div>
        )}

        {loadingChallenges ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No challenges available for this skill yet.</p>
            <p className="text-gray-400 text-xs mt-1">We're adding new challenges regularly!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {challenges.map((challenge) => {
              const TypeIcon = typeIcons[challenge.challenge_type] || Target
              return (
                <div key={challenge.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                        <TypeIcon className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900">{challenge.title}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{challenge.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium capitalize">{challenge.difficulty}</span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {Math.round(challenge.time_limit_seconds / 60)} min
                          </span>
                          <span className="text-xs text-gray-400 capitalize">{challenge.challenge_type}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => startChallenge(challenge)}
                      disabled={!canRetake}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" /> Start
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Main SkillDNA dashboard
  return (
    <div className="p-4 lg:p-6 xl:p-8 pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-green-800 to-teal-900 rounded-2xl p-6 lg:p-8 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Dna className="w-5 h-5 text-green-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">SkillDNA™</h1>
              <p className="text-green-200 text-sm">Prove your skills. Earn verified badges.</p>
            </div>
          </div>
          <p className="text-green-100/70 text-xs mt-3 max-w-lg">
            Complete AI-powered micro-challenges to verify your skills. Clients see your badges on your profile — proof of ability, not just claims.
          </p>
        </div>
      </div>

      {/* Verified Skills */}
      {verifiedSkills.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" /> Your Verified Skills
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {verifiedSkills.map((skill) => {
              const badge = badgeConfig[skill.badge_level] || badgeConfig.bronze
              return (
                <div key={skill.id} className={`rounded-xl border p-4 ${badge.bg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">{badge.icon}</span>
                    <span className={`text-xs font-bold ${badge.color}`}>{skill.score}/100</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{skill.skill_name}</h3>
                  <p className={`text-xs font-medium ${badge.color}`}>{badge.label} Verified</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Verified {new Date(skill.verified_at).toLocaleDateString()}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Available Skills to Verify */}
      <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-green-600" /> Available Challenges
      </h2>
      {categories.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No challenges available yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => {
            const existing = verifiedSkills.find(s => s.skill_name.toLowerCase() === cat.skill.toLowerCase())
            const existingBadge = existing ? badgeConfig[existing.badge_level] : null
            const TypeIcon = typeIcons[cat.types[0]] || Target
            return (
              <button
                key={cat.skill}
                onClick={() => loadChallenges(cat.skill)}
                className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md hover:border-green-300 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <TypeIcon className="w-4 h-4 text-green-600" />
                  </div>
                  {existingBadge && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${existingBadge.bg} ${existingBadge.color}`}>
                      {existingBadge.icon} {existingBadge.label}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 text-sm group-hover:text-green-700 transition-colors">{cat.skill}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {cat.difficulties.map(d => (
                    <span key={d} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded capitalize">{d}</span>
                  ))}
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-green-600 font-medium">
                  {existing ? 'Retake Challenge' : 'Take Challenge'} <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* How it works */}
      <div className="mt-8 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-600" /> How SkillDNA Works
        </h3>
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { step: '1', title: 'Choose a Skill', desc: 'Pick from available skill challenges' },
            { step: '2', title: 'Complete Challenge', desc: 'Solve a timed micro-challenge' },
            { step: '3', title: 'Get Evaluated', desc: 'AI scores your response on multiple criteria' },
            { step: '4', title: 'Earn Badge', desc: 'Bronze → Silver → Gold → Diamond' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">
                {item.step}
              </div>
              <p className="font-semibold text-gray-900 text-xs">{item.title}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
