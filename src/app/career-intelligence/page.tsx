'use client'

import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Flame,
  Snowflake,
  Target,
  DollarSign,
  Users,
  Briefcase,
  Star,
  Shield,
  Zap,
  ArrowRight,
  ArrowUpRight,
  Search,
  Loader2,
  BarChart3,
  PieChart,
  Lightbulb,
  Rocket,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  X,
  Sparkles,
  Crown,
  type LucideIcon,
} from 'lucide-react'

interface SkillIntel {
  skill: string
  demand: number
  supply: number
  demandSupplyRatio: number
  avgBudget: number
  maxBudget: number
  completedJobs: number
  totalEarnings: number
  trend: 'hot' | 'rising' | 'stable' | 'cooling'
  competitionLevel: 'low' | 'medium' | 'high' | 'saturated'
  opportunityScore: number
}

interface MarketPulse {
  totalOpenJobs: number
  totalFreelancers: number
  totalCompletedJobs: number
  avgJobBudget: number
  topPayingSkill: string
  topPayingAmount: number
  biggestGapSkill: string
  biggestGapRatio: number
  platformGrowthRate: number
}

interface EarningsProjection {
  matchedSkills: string[]
  avgJobValue: number
  estimatedMonthlyLow: number
  estimatedMonthlyHigh: number
  recommendedSkills: {
    skill: string
    reason: string
    potentialEarningsBoost: number
    opportunityScore: number
  }[]
  competitiveEdge: string[]
  saturatedSkills: string[]
}

const TREND_CONFIG = {
  hot: { label: 'Hot', icon: Flame, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
  rising: { label: 'Rising', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' },
  stable: { label: 'Stable', icon: Target, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
  cooling: { label: 'Cooling', icon: Snowflake, color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200' },
}

const COMPETITION_CONFIG = {
  low: { label: 'Low Competition', color: 'text-green-600', bg: 'bg-green-100' },
  medium: { label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  high: { label: 'High', color: 'text-orange-600', bg: 'bg-orange-100' },
  saturated: { label: 'Saturated', color: 'text-red-600', bg: 'bg-red-100' },
}

export default function CareerIntelligencePage() {
  const [skills, setSkills] = useState<SkillIntel[]>([])
  const [marketPulse, setMarketPulse] = useState<MarketPulse | null>(null)
  const [projection, setProjection] = useState<EarningsProjection | null>(null)
  const [loading, setLoading] = useState(true)
  const [simLoading, setSimLoading] = useState(false)
  const [generatedAt, setGeneratedAt] = useState('')

  // Filters
  const [trendFilter, setTrendFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('opportunity')
  const [searchSkill, setSearchSkill] = useState('')

  // Earnings simulator
  const [simSkills, setSimSkills] = useState<string[]>([])
  const [simInput, setSimInput] = useState('')

  const fetchIntelligence = async (userSkills?: string[]) => {
    if (userSkills) setSimLoading(true)
    else setLoading(true)

    try {
      const params = new URLSearchParams()
      if (userSkills && userSkills.length > 0) {
        params.set('skills', userSkills.join(','))
      }
      const res = await fetch(`/api/career-intelligence?${params}`)
      const data = await res.json()

      if (data.skills) setSkills(data.skills)
      if (data.marketPulse) setMarketPulse(data.marketPulse)
      if (data.earningsProjection) setProjection(data.earningsProjection)
      if (data.generatedAt) setGeneratedAt(data.generatedAt)
    } catch (error) {
      console.error('Failed to fetch career intelligence:', error)
    } finally {
      setLoading(false)
      setSimLoading(false)
    }
  }

  useEffect(() => { fetchIntelligence() }, [])

  const runSimulation = () => {
    if (simSkills.length === 0) return
    fetchIntelligence(simSkills)
  }

  const addSimSkill = () => {
    const trimmed = simInput.trim()
    if (trimmed && !simSkills.includes(trimmed)) {
      const updated = [...simSkills, trimmed]
      setSimSkills(updated)
      setSimInput('')
    }
  }

  const removeSimSkill = (skill: string) => {
    setSimSkills(simSkills.filter(s => s !== skill))
  }

  // Filtered & sorted skills
  const filteredSkills = useMemo(() => {
    let result = [...skills]
    if (trendFilter) result = result.filter(s => s.trend === trendFilter)
    if (searchSkill) {
      const q = searchSkill.toLowerCase()
      result = result.filter(s => s.skill.toLowerCase().includes(q))
    }
    switch (sortBy) {
      case 'opportunity': result.sort((a, b) => b.opportunityScore - a.opportunityScore); break
      case 'demand': result.sort((a, b) => b.demand - a.demand); break
      case 'pay': result.sort((a, b) => b.avgBudget - a.avgBudget); break
      case 'gap': result.sort((a, b) => b.demandSupplyRatio - a.demandSupplyRatio); break
    }
    return result
  }, [skills, trendFilter, sortBy, searchSkill])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 text-white py-16 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          </div>
          <div className="absolute top-10 right-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <Brain className="w-4 h-4" />
                AI-Powered Market Intelligence
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                Career <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Intelligence</span>
              </h1>
              <p className="text-lg text-gray-300 max-w-xl mb-2">
                Real-time market data from the HustleKE platform. Know which skills pay the most, where demand outstrips supply, and exactly how to maximize your earnings.
              </p>
              {generatedAt && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Last analyzed: {new Date(generatedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
          {/* Market Pulse Cards */}
          {marketPulse && !loading && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{marketPulse.totalOpenJobs}</div>
                    <div className="text-xs text-gray-500">Open Jobs</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{marketPulse.totalFreelancers}</div>
                    <div className="text-xs text-gray-500">Freelancers</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">KES {marketPulse.avgJobBudget.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Avg Job Budget</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{marketPulse.platformGrowthRate > 0 ? '+' : ''}{marketPulse.platformGrowthRate}%</div>
                    <div className="text-xs text-gray-500">Growth (30d)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Key Insights */}
          {marketPulse && !loading && (
            <div className="grid md:grid-cols-2 gap-4 mb-10">
              {marketPulse.topPayingSkill && (
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-800">Highest Paying Skill</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{marketPulse.topPayingSkill}</p>
                  <p className="text-sm text-gray-600">Average budget: <span className="font-semibold text-amber-700">KES {marketPulse.topPayingAmount.toLocaleString()}</span> per job</p>
                </div>
              )}
              {marketPulse.biggestGapSkill && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Rocket className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-800">Biggest Opportunity Gap</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{marketPulse.biggestGapSkill}</p>
                  <p className="text-sm text-gray-600">Demand is <span className="font-semibold text-green-700">{marketPulse.biggestGapRatio}x</span> higher than supply</p>
                </div>
              )}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Skills Intelligence Table */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        Skills Market Map
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">Every skill ranked by opportunity</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={searchSkill}
                          onChange={(e) => setSearchSkill(e.target.value)}
                          placeholder="Search skill..."
                          className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-purple-500 focus:outline-none w-40"
                        />
                      </div>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-purple-500 focus:outline-none bg-white"
                      >
                        <option value="opportunity">By Opportunity</option>
                        <option value="demand">By Demand</option>
                        <option value="pay">By Pay</option>
                        <option value="gap">By Supply Gap</option>
                      </select>
                    </div>
                  </div>

                  {/* Trend filters */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setTrendFilter('')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!trendFilter ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      All
                    </button>
                    {Object.entries(TREND_CONFIG).map(([key, config]) => {
                      const Icon = config.icon
                      return (
                        <button
                          key={key}
                          onClick={() => setTrendFilter(trendFilter === key ? '' : key)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${trendFilter === key ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {config.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Skills list */}
                <div className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="p-4 animate-pulse">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                          <div className="flex-1">
                            <div className="h-4 bg-gray-100 rounded w-32 mb-2" />
                            <div className="h-3 bg-gray-50 rounded w-48" />
                          </div>
                          <div className="h-8 bg-gray-100 rounded-full w-16" />
                        </div>
                      </div>
                    ))
                  ) : filteredSkills.length > 0 ? (
                    filteredSkills.map((skill, idx) => {
                      const trend = TREND_CONFIG[skill.trend]
                      const competition = COMPETITION_CONFIG[skill.competitionLevel]
                      const TrendIcon = trend.icon
                      const scoreColor = skill.opportunityScore >= 70 ? 'text-green-600 bg-green-50 border-green-200'
                        : skill.opportunityScore >= 50 ? 'text-amber-600 bg-amber-50 border-amber-200'
                        : 'text-gray-500 bg-gray-50 border-gray-200'
                      return (
                        <div key={skill.skill} className="p-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-4">
                            {/* Score badge */}
                            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${scoreColor}`}>
                              <span className="text-lg font-bold">{skill.opportunityScore}</span>
                            </div>

                            {/* Skill info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="font-semibold text-gray-900">{skill.skill}</h3>
                                <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${trend.bg} ${trend.color} ${trend.border} border`}>
                                  <TrendIcon className="w-3 h-3" />
                                  {trend.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span><span className="font-medium text-gray-700">{skill.demand}</span> jobs</span>
                                <span className="text-gray-300">|</span>
                                <span><span className="font-medium text-gray-700">{skill.supply}</span> freelancers</span>
                                <span className="text-gray-300">|</span>
                                <span className={`font-medium ${competition.color}`}>{competition.label}</span>
                              </div>
                            </div>

                            {/* Pay */}
                            <div className="text-right shrink-0 hidden sm:block">
                              {skill.avgBudget > 0 ? (
                                <>
                                  <div className="font-bold text-gray-900 text-sm">KES {skill.avgBudget.toLocaleString()}</div>
                                  <div className="text-[10px] text-gray-400">avg/job</div>
                                </>
                              ) : (
                                <div className="text-xs text-gray-400">No data</div>
                              )}
                            </div>

                            {/* Demand/Supply bar */}
                            <div className="w-20 shrink-0 hidden md:block">
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${skill.demandSupplyRatio > 1 ? 'bg-green-500' : skill.demandSupplyRatio > 0.5 ? 'bg-amber-400' : 'bg-red-400'}`}
                                  style={{ width: `${Math.min(100, skill.demandSupplyRatio * 50)}%` }}
                                />
                              </div>
                              <div className="text-[10px] text-gray-400 mt-0.5 text-center">
                                {skill.demandSupplyRatio > 1 ? 'More demand' : 'More supply'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-12 text-center">
                      <Search className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-gray-500">No skills match your filters</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-6">
              {/* Earnings Simulator */}
              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-purple-200" />
                  <h3 className="font-bold text-lg">Earnings Simulator</h3>
                </div>
                <p className="text-purple-200 text-sm mb-4">
                  Enter your skills to see projected earnings and personalized recommendations.
                </p>

                {/* Skill input */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={simInput}
                    onChange={(e) => setSimInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addSimSkill() }}
                    placeholder="Add a skill..."
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/50"
                  />
                  <button
                    onClick={addSimSkill}
                    className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>

                {/* Selected skills */}
                {simSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {simSkills.map(s => (
                      <span key={s} className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full text-xs font-medium">
                        {s}
                        <button onClick={() => removeSimSkill(s)} className="hover:text-red-300"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}

                <button
                  onClick={runSimulation}
                  disabled={simSkills.length === 0 || simLoading}
                  className="w-full bg-white text-purple-700 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {simLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Brain className="w-4 h-4" /> Analyze My Earnings</>
                  )}
                </button>
              </div>

              {/* Projection Results */}
              {projection && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-1">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      Your Earnings Potential
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-green-600">KES {projection.estimatedMonthlyLow.toLocaleString()}</span>
                      <span className="text-gray-400 mx-1">-</span>
                      <span className="text-3xl font-bold text-green-600">{projection.estimatedMonthlyHigh.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Estimated monthly (2-3 jobs)</p>
                  </div>

                  {/* Competitive edge */}
                  {projection.competitiveEdge.length > 0 && (
                    <div className="p-5 border-b border-gray-100">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your Competitive Edge</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {projection.competitiveEdge.map(s => (
                          <span key={s} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Saturated warning */}
                  {projection.saturatedSkills.length > 0 && (
                    <div className="p-5 border-b border-gray-100">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">High Competition</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {projection.saturatedSkills.map(s => (
                          <span key={s} className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended skills */}
                  {projection.recommendedSkills.length > 0 && (
                    <div className="p-5">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                        AI Recommends Learning
                      </h4>
                      <div className="space-y-3">
                        {projection.recommendedSkills.slice(0, 4).map(rec => (
                          <div key={rec.skill} className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-purple-600">{rec.opportunityScore}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900">{rec.skill}</p>
                              <p className="text-xs text-gray-500">{rec.reason}</p>
                              {rec.potentialEarningsBoost > 0 && (
                                <p className="text-xs text-green-600 font-medium mt-0.5">
                                  +KES {rec.potentialEarningsBoost.toLocaleString()}/job potential
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quick tips */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  Pro Tips
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-green-600">1</span>
                    </div>
                    <p className="text-sm text-gray-600">Focus on skills with <span className="font-semibold text-green-600">high opportunity scores</span> (70+) — these have the best demand-to-supply ratio.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-purple-600">2</span>
                    </div>
                    <p className="text-sm text-gray-600"><span className="font-semibold text-red-500">Hot</span> and <span className="font-semibold text-green-500">Rising</span> skills mean demand is growing — learn them before the competition catches up.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-amber-600">3</span>
                    </div>
                    <p className="text-sm text-gray-600">Combine a <span className="font-semibold">high-paying skill</span> with a <span className="font-semibold">low-competition skill</span> to stand out and earn more.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom spacer */}
        <div className="h-16" />
      </main>

      <Footer />
    </div>
  )
}
