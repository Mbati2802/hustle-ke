'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback, useRef } from 'react'
import { usePostJobModal } from '../components/PostJobModalContext'
import Header from '../components/Header'
import Footer from '../components/Footer'
import {
  Search,
  MapPin,
  Briefcase,
  Shield,
  Award,
  Crown,
  Loader2,
  ChevronDown,
  Users,
  SlidersHorizontal,
  ArrowRight,
  Star,
  Globe,
  Zap,
  DollarSign,
  Filter,
  X,
  Code,
  Smartphone,
  Palette,
  PenTool,
  Megaphone,
  Headphones,
  CheckCircle2,
  TrendingUp,
  Eye,
} from 'lucide-react'

interface TalentProfile {
  id: string
  full_name: string
  avatar_url?: string
  title?: string
  bio?: string
  skills: string[]
  hourly_rate?: number
  location?: string
  county?: string
  verification_status: string
  hustle_score: number
  jobs_completed: number
  total_earned: number
  languages: string[]
  is_pro?: boolean
  created_at: string
  years_experience?: number
  availability?: string
}

const skillCategories: Record<string, { skills: string[]; icon: any }> = {
  'All Talent': { skills: [], icon: Users },
  'Web Development': { skills: ['React', 'Next.js', 'Node.js', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Vue', 'Angular', 'PHP', 'Laravel', 'Django', 'WordPress'], icon: Code },
  'Mobile Apps': { skills: ['React Native', 'Flutter', 'iOS', 'Android', 'Swift', 'Kotlin', 'Dart'], icon: Smartphone },
  'Design': { skills: ['Figma', 'Adobe XD', 'UI/UX', 'Graphic Design', 'Illustrator', 'Photoshop', 'Canva'], icon: Palette },
  'Writing': { skills: ['SEO Writing', 'Copywriting', 'Content Writing', 'Blogging', 'Editing', 'Technical Writing'], icon: PenTool },
  'Marketing': { skills: ['SEO', 'Social Media', 'Google Ads', 'Facebook Ads', 'Email Marketing', 'Analytics', 'Digital Marketing'], icon: Megaphone },
  'Virtual Assistant': { skills: ['Data Entry', 'Email Management', 'Scheduling', 'Research', 'Admin Support'], icon: Headphones },
}

const sortOptions = [
  { value: 'score', label: 'Hustle Score' },
  { value: 'newest', label: 'Newest' },
  { value: 'most_jobs', label: 'Most Jobs' },
  { value: 'rate_high', label: 'Rate: High to Low' },
  { value: 'rate_low', label: 'Rate: Low to High' },
]

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
  if (score >= 60) return 'text-green-600 bg-green-50 border-green-200'
  if (score >= 40) return 'text-blue-600 bg-blue-50 border-blue-200'
  return 'text-gray-600 bg-gray-50 border-gray-200'
}

export default function TalentPage() {
  const [activeCategory, setActiveCategory] = useState('All Talent')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sort, setSort] = useState('score')
  const [availabilityFilter, setAvailabilityFilter] = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [profiles, setProfiles] = useState<TalentProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const { openModal } = usePostJobModal()
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const fetchTalent = useCallback(async (pageNum: number, append = false) => {
    if (append) setLoadingMore(true)
    else setLoading(true)

    try {
      const params = new URLSearchParams()
      params.set('page', String(pageNum))
      params.set('limit', '12')
      params.set('sort', sort)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      if (availabilityFilter) params.set('availability', availabilityFilter)
      if (verifiedOnly) params.set('verified', 'true')
      if (activeCategory !== 'All Talent') {
        const cat = skillCategories[activeCategory]
        if (cat && cat.skills.length > 0) params.set('skills', cat.skills.join(','))
      }

      const res = await fetch(`/api/talent?${params.toString()}`)
      const data = await res.json()

      if (data.profiles) {
        if (append) {
          setProfiles(prev => [...prev, ...data.profiles])
        } else {
          setProfiles(data.profiles)
        }
        setTotal(data.pagination?.total || 0)
        setHasMore(data.pagination?.hasMore || false)
      }
    } catch (err) {
      console.error('Failed to fetch talent:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [searchQuery, activeCategory, sort, availabilityFilter, verifiedOnly])

  useEffect(() => {
    setPage(1)
    fetchTalent(1)
  }, [fetchTalent])

  const handleSearchInput = (value: string) => {
    setSearchInput(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setSearchQuery(value)
    }, 400)
  }

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchTalent(nextPage, true)
  }

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'
  }

  const FilterContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="space-y-5">
      {/* Category */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Category</p>
        <div className="space-y-1.5">
          {Object.entries(skillCategories).map(([cat, data]) => {
            const Icon = data.icon
            return (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); if (mobile) setMobileFiltersOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Availability */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Availability</p>
        <div className="space-y-2">
          {[
            { value: '', label: 'All Status' },
            { value: 'available', label: '🟢 Available Now' },
            { value: 'busy', label: '🟡 Busy' },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name={`availability${mobile ? '-m' : ''}`}
                checked={availabilityFilter === opt.value}
                onChange={() => setAvailabilityFilter(opt.value)}
                className="w-4 h-4 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Verification */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Verification</p>
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={() => setVerifiedOnly(!verifiedOnly)}
            className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-green-500" />
            Verified only
          </span>
        </label>
      </div>

      <div className="border-t border-gray-100" />

      {/* Rate Range */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Hourly Rate</p>
        <div className="space-y-2">
          {[
            { label: 'Under KES 500/hr', range: 'Budget friendly' },
            { label: 'KES 500 - 2K/hr', range: 'Mid range' },
            { label: 'KES 2K - 5K/hr', range: 'Professional' },
            { label: 'KES 5K+/hr', range: 'Expert' },
          ].map((b) => (
            <label key={b.label} className="flex items-center gap-2.5 cursor-pointer group">
              <input type="radio" name={`rate${mobile ? '-m' : ''}`} className="w-4 h-4 text-green-600 focus:ring-green-500" />
              <div>
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{b.label}</span>
                <span className="text-[10px] text-gray-400 ml-1.5">{b.range}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">
      <Header activeLink="/talent" />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        </div>
        <div className="absolute top-10 right-20 w-72 h-72 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">
              Find Top <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">Kenyan Talent</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-lg mx-auto">
              {total > 0 ? `Browse ${total} verified freelancers ready for your project` : 'Connect with skilled, verified freelancers across Kenya'}
            </p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="Search by skill, name, or role..."
                className="w-full pl-12 pr-32 py-4 bg-white rounded-2xl text-gray-900 placeholder-gray-400 border-2 border-transparent focus:border-green-500 focus:outline-none shadow-lg text-base"
              />
              <button
                onClick={() => fetchTalent(1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                Search
              </button>
            </div>
            {searchInput && (
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="text-xs text-gray-400">Searching for &ldquo;{searchInput}&rdquo;</span>
                <button onClick={() => { setSearchInput(''); setSearchQuery('') }} className="text-xs text-green-400 hover:text-green-300 font-medium flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear
                </button>
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="flex items-center justify-center gap-6 mt-8">
            {[
              { icon: Users, label: `${total} Freelancers`, color: 'text-green-400' },
              { icon: Shield, label: 'ID Verified', color: 'text-blue-400' },
              { icon: DollarSign, label: 'Escrow Protected', color: 'text-amber-400' },
              { icon: Zap, label: 'Instant Hire', color: 'text-emerald-400' },
            ].map((stat, i) => (
              <div key={i} className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sticky toolbar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-500">
                {loading ? 'Loading...' : `${total} freelancer${total !== 1 ? 's' : ''}`}
                {activeCategory !== 'All Talent' && <span className="text-green-600 font-medium"> · {activeCategory}</span>}
              </p>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-green-500 focus:outline-none bg-gray-50"
              >
                {sortOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button
                onClick={() => openModal()}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
              >
                Post a Job
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="md:hidden p-2 bg-gray-100 rounded-xl"
            >
              <SlidersHorizontal className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-20 space-y-5">
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-900 text-sm">Filters</h3>
                  </div>
                  <button
                    onClick={() => { setActiveCategory('All Talent'); setVerifiedOnly(false); setAvailabilityFilter('') }}
                    className="text-xs text-green-600 hover:text-green-700 font-medium"
                  >
                    Reset
                  </button>
                </div>
                <div className="p-5">
                  <FilterContent />
                </div>
              </div>

              {/* Post a Job CTA */}
              <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-5 text-white">
                <h4 className="font-bold mb-1">Need to hire?</h4>
                <p className="text-xs text-green-100 mb-4">Post a job and receive proposals from top talent within hours.</p>
                <button
                  onClick={() => openModal()}
                  className="w-full bg-white text-green-700 hover:bg-green-50 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  Post a Job Free
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>

          {/* Talent grid */}
          <div className="flex-1 min-w-0">
            {/* Mobile sort */}
            <div className="md:hidden flex items-center justify-between mb-5">
              <p className="text-sm text-gray-500">
                {loading ? 'Loading...' : `${profiles.length} of ${total}`}
              </p>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:border-green-500 focus:outline-none"
              >
                {sortOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Loading */}
            {loading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-2xl shrink-0" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-2/3 mb-1.5" />
                        <div className="h-3 bg-gray-100 rounded w-1/3" />
                      </div>
                    </div>
                    <div className="flex gap-2 mb-4">
                      <div className="h-7 bg-gray-100 rounded-lg w-16" />
                      <div className="h-7 bg-gray-100 rounded-lg w-20" />
                      <div className="h-7 bg-gray-100 rounded-lg w-14" />
                    </div>
                    <div className="h-10 bg-gray-100 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : profiles.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 border border-gray-200 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-900 font-semibold text-lg mb-2">No freelancers found</p>
                <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">
                  {searchInput ? `No results for "${searchInput}". Try adjusting your search or filters.` : 'Try a different category or clear your filters.'}
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => { setSearchInput(''); setSearchQuery(''); setActiveCategory('All Talent'); setVerifiedOnly(false); setAvailabilityFilter('') }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
                  >
                    Clear Filters
                  </button>
                  <button onClick={() => openModal()} className="bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2">
                    Post a Job Instead
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  {profiles.map((person) => {
                    const scoreColor = getScoreColor(person.hustle_score)
                    return (
                      <Link
                        key={person.id}
                        href={`/talent/${person.id}`}
                        className="bg-white rounded-2xl border border-gray-200 hover:border-green-200 hover:shadow-md transition-all group block"
                      >
                        <div className="p-5">
                          {/* Header row */}
                          <div className="flex items-start gap-4 mb-4">
                            <div className="relative shrink-0">
                              {person.avatar_url ? (
                                <img src={person.avatar_url} alt={person.full_name} className="w-14 h-14 rounded-2xl object-cover" />
                              ) : (
                                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
                                  {getInitials(person.full_name)}
                                </div>
                              )}
                              {person.availability === 'available' && (
                                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 border-2 border-white rounded-full" title="Available now" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">{person.full_name}</h3>
                                {person.verification_status === 'Verified' && (
                                  <Shield className="w-4 h-4 text-green-500 shrink-0" />
                                )}
                                {person.is_pro && (
                                  <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    <Crown className="w-2.5 h-2.5" />PRO
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 truncate">{person.title || 'Freelancer'}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                {(person.county || person.location) && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {person.county || person.location}
                                  </span>
                                )}
                                {person.years_experience != null && person.years_experience > 0 && (
                                  <span>{person.years_experience}yr exp</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Stats row */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${scoreColor}`}>
                              <Award className="w-3.5 h-3.5" />
                              {person.hustle_score}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Briefcase className="w-3.5 h-3.5" />
                              {person.jobs_completed} jobs
                            </div>
                            {person.hourly_rate != null && person.hourly_rate > 0 && (
                              <div className="flex items-center gap-1 text-xs font-semibold text-green-600 ml-auto">
                                KES {person.hourly_rate.toLocaleString()}<span className="text-gray-400 font-normal">/hr</span>
                              </div>
                            )}
                            {person.availability && person.availability !== 'available' && (
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ml-auto ${
                                person.availability === 'busy' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-red-50 text-red-500 border border-red-200'
                              }`}>
                                {person.availability === 'busy' ? 'Busy' : 'Unavailable'}
                              </span>
                            )}
                          </div>

                          {/* Skills */}
                          {person.skills && person.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {person.skills.slice(0, 4).map((skill) => (
                                <span key={skill} className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-lg font-medium border border-green-100">{skill}</span>
                              ))}
                              {person.skills.length > 4 && (
                                <span className="text-xs text-gray-400 px-2 py-1">+{person.skills.length - 4}</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Bottom bar */}
                        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 rounded-b-2xl flex items-center justify-between">
                          <span className="text-xs text-gray-400">
                            {person.availability === 'available'
                              ? '🟢 Available now'
                              : person.availability === 'busy'
                              ? '🟡 Busy'
                              : '⚪ View profile'
                            }
                          </span>
                          <span className="text-xs font-semibold text-green-600 group-hover:text-green-500 flex items-center gap-1 transition-colors">
                            View Profile <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="text-center mt-8">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-green-300 text-gray-700 hover:text-green-600 px-8 py-3 rounded-xl font-medium text-sm transition-all disabled:opacity-50"
                    >
                      {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                      Load More Talent
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between sticky top-0">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <h3 className="font-semibold text-gray-900">Filters</h3>
              </div>
              <button onClick={() => setMobileFiltersOpen(false)} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5">
              <FilterContent mobile />
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold transition-colors mt-5"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
