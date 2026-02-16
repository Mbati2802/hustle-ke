'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import {
  Star,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Loader2,
  MessageSquare,
  Shield,
  Quote,
  X,
  TrendingUp,
  Award,
  Users,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'

interface Review {
  id: string
  rating: number
  comment: string
  communication_rating: number | null
  quality_rating: number | null
  timeliness_rating: number | null
  created_at: string
  reviewer: {
    id: string
    full_name: string
    avatar_url: string | null
    title: string | null
    county: string | null
  }
  reviewee: {
    id: string
    full_name: string
    avatar_url: string | null
    title: string | null
    skills: string[] | null
    verification_status: string | null
    hustle_score: number | null
    hourly_rate: number | null
  }
  job: {
    id: string
    title: string
    skills_required: string[] | null
  }
}

interface Stats {
  total: number
  average: number
  distribution: Record<number, number>
}

interface SkillFilter {
  name: string
  count: number
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, average: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } })
  const [skills, setSkills] = useState<SkillFilter[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)
  const [skillFilter, setSkillFilter] = useState('')
  const [sort, setSort] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)

  // Pagination
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const limit = 12

  const fetchReviews = useCallback(async (pageNum: number, append = false) => {
    if (append) setLoadingMore(true)
    else setLoading(true)

    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(pageNum * limit),
        sort,
      })
      if (ratingFilter) params.set('rating', String(ratingFilter))
      if (skillFilter) params.set('skill', skillFilter)
      if (search.trim()) params.set('search', search.trim())

      const res = await fetch(`/api/reviews/all?${params}`)
      const data = await res.json()

      if (data.reviews) {
        if (append) {
          setReviews(prev => [...prev, ...data.reviews])
        } else {
          setReviews(data.reviews)
        }
      }
      if (data.stats) setStats(data.stats)
      if (data.filters?.skills) setSkills(data.filters.skills)
      if (data.pagination) {
        setHasMore(data.pagination.hasMore)
        setTotal(data.pagination.total)
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [sort, ratingFilter, skillFilter, search])

  useEffect(() => {
    setPage(0)
    fetchReviews(0)
  }, [fetchReviews])

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchReviews(nextPage, true)
  }

  const clearFilters = () => {
    setSearch('')
    setRatingFilter(null)
    setSkillFilter('')
    setSort('newest')
  }

  const hasActiveFilters = !!search || !!ratingFilter || !!skillFilter || sort !== 'newest'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header activeLink="/reviews" />

      <main className="flex-1">
        {/* Hero Banner */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-300 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <Star className="w-4 h-4 fill-yellow-300" />
                Freelancer Reviews
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                Trusted by <span className="text-green-400">Real Clients</span>
              </h1>
              <p className="text-lg text-gray-300 max-w-xl">
                Browse verified reviews from clients who hired freelancers on HustleKE. Every review is tied to a completed job.
              </p>
            </div>

            {/* Stats summary */}
            {stats.total > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-10 pt-8 border-t border-white/10">
                <div>
                  <div className="text-3xl font-bold text-green-400">{stats.total}</div>
                  <div className="text-gray-400 text-sm">Total Reviews</div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-yellow-400">{stats.average}</span>
                    <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                  </div>
                  <div className="text-gray-400 text-sm">Average Rating</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-400">
                    {stats.distribution[5] || 0}
                  </div>
                  <div className="text-gray-400 text-sm">5-Star Reviews</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-400">
                    {stats.total > 0 ? Math.round(((stats.distribution[4] || 0) + (stats.distribution[5] || 0)) / stats.total * 100) : 0}%
                  </div>
                  <div className="text-gray-400 text-sm">Satisfaction Rate</div>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search + Filter Bar */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search reviews..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm"
                />
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm bg-white cursor-pointer min-w-[140px]"
                >
                  <option value="newest">Newest First</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Toggle filters */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${
                  showFilters || hasActiveFilters
                    ? 'border-green-500 text-green-700 bg-green-50'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="w-5 h-5 bg-green-600 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                    {[ratingFilter, skillFilter, search].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>

            {/* Expanded filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                {/* Rating filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Rating</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setRatingFilter(null)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        !ratingFilter ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    {[5, 4, 3, 2, 1].map((r) => (
                      <button
                        key={r}
                        onClick={() => setRatingFilter(ratingFilter === r ? null : r)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                          ratingFilter === r ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {r} <Star className={`w-3.5 h-3.5 ${ratingFilter === r ? 'fill-white' : 'fill-yellow-400 text-yellow-400'}`} />
                        <span className="text-xs opacity-70">({stats.distribution[r] || 0})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating distribution bar */}
                {stats.total > 0 && (
                  <div className="space-y-1.5">
                    {[5, 4, 3, 2, 1].map((r) => {
                      const count = stats.distribution[r] || 0
                      const pct = stats.total > 0 ? (count / stats.total) * 100 : 0
                      return (
                        <button
                          key={r}
                          onClick={() => setRatingFilter(ratingFilter === r ? null : r)}
                          className="flex items-center gap-2 w-full group"
                        >
                          <span className="text-xs text-gray-500 w-4 text-right">{r}</span>
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${ratingFilter === r ? 'bg-green-500' : 'bg-yellow-400 group-hover:bg-yellow-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Skill filter */}
                {skills.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Skill / Category</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSkillFilter('')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          !skillFilter ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        All Categories
                      </button>
                      {skills.slice(0, 15).map((s) => (
                        <button
                          key={s.name}
                          onClick={() => setSkillFilter(skillFilter === s.name ? '' : s.name)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            skillFilter === s.name
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {s.name} <span className="opacity-60">({s.count})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clear filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Active filter pills */}
          {hasActiveFilters && !showFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {ratingFilter && (
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                  {ratingFilter} <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <button onClick={() => setRatingFilter(null)}><X className="w-3 h-3 ml-0.5" /></button>
                </span>
              )}
              {skillFilter && (
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                  {skillFilter}
                  <button onClick={() => setSkillFilter('')}><X className="w-3 h-3 ml-0.5" /></button>
                </span>
              )}
              {search && (
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                  &ldquo;{search}&rdquo;
                  <button onClick={() => setSearch('')}><X className="w-3 h-3 ml-0.5" /></button>
                </span>
              )}
            </div>
          )}

          {/* Results count */}
          {!loading && (
            <p className="text-sm text-gray-500 mb-6">
              Showing {reviews.length} of {total} review{total !== 1 ? 's' : ''}
              {hasActiveFilters && ' (filtered)'}
            </p>
          )}

          {/* Reviews Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} className="w-5 h-5 bg-gray-200 rounded" />
                    ))}
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-5/6 mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-3/5 mb-6" />
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-28 mb-1.5" />
                      <div className="h-3 bg-gray-100 rounded w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : reviews.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
                >
                  <div className="p-6 flex flex-col flex-1">
                    {/* Quote watermark */}
                    <div className="relative">
                      <Quote className="w-10 h-10 text-green-50 absolute -top-1 -left-1" />
                    </div>

                    {/* Star rating + time */}
                    <div className="flex items-center justify-between mb-3 relative z-10">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">{timeAgo(review.created_at)}</span>
                    </div>

                    {/* Sub-ratings */}
                    {(review.communication_rating || review.quality_rating || review.timeliness_rating) && (
                      <div className="flex flex-wrap gap-3 mb-3">
                        {review.communication_rating && (
                          <span className="text-[10px] text-gray-500">
                            Communication: <span className="font-semibold text-gray-700">{review.communication_rating}/5</span>
                          </span>
                        )}
                        {review.quality_rating && (
                          <span className="text-[10px] text-gray-500">
                            Quality: <span className="font-semibold text-gray-700">{review.quality_rating}/5</span>
                          </span>
                        )}
                        {review.timeliness_rating && (
                          <span className="text-[10px] text-gray-500">
                            Timeliness: <span className="font-semibold text-gray-700">{review.timeliness_rating}/5</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Comment */}
                    <p className="text-gray-600 leading-relaxed mb-4 flex-1">
                      &ldquo;{review.comment}&rdquo;
                    </p>

                    {/* Job tag */}
                    {review.job?.title && (
                      <div className="mb-4">
                        <Link
                          href={`/jobs/${review.job.id}`}
                          className="text-xs bg-gray-100 text-gray-500 hover:text-green-600 hover:bg-green-50 px-2.5 py-1 rounded-full transition-colors inline-block"
                        >
                          {review.job.title}
                        </Link>
                      </div>
                    )}

                    {/* Reviewer */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                      {review.reviewer?.avatar_url ? (
                        <img
                          src={review.reviewer.avatar_url}
                          alt={review.reviewer.full_name}
                          className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-100"
                        />
                      ) : (
                        <div className="w-11 h-11 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white font-bold text-sm ring-2 ring-gray-100">
                          {review.reviewer?.full_name?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{review.reviewer?.full_name || 'Client'}</p>
                        <p className="text-xs text-gray-400 truncate">{review.reviewer?.title || review.reviewer?.county || 'Client'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Freelancer bar */}
                  {review.reviewee && (
                    <Link
                      href={`/talent/${review.reviewee.id}`}
                      className="flex items-center gap-3 px-6 py-3 bg-green-50/70 border-t border-green-100 hover:bg-green-50 transition-colors"
                    >
                      {review.reviewee.avatar_url ? (
                        <img src={review.reviewee.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {review.reviewee.full_name?.charAt(0)?.toUpperCase() || 'F'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-600">
                          Review for{' '}
                          <span className="font-semibold text-green-700">{review.reviewee.full_name}</span>
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">{review.reviewee.title || 'Freelancer'}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {review.reviewee.verification_status === 'ID-Verified' && (
                          <Shield className="w-3.5 h-3.5 text-green-500" />
                        )}
                        {review.reviewee.hustle_score != null && review.reviewee.hustle_score > 0 && (
                          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                            <TrendingUp className="w-3 h-3" /> {review.reviewee.hustle_score}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
              <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No reviews found</h3>
              <p className="text-gray-500 mb-6">
                {hasActiveFilters
                  ? 'Try adjusting your filters to see more reviews.'
                  : 'Reviews will appear here as freelancers complete jobs and receive feedback.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
                >
                  <X className="w-4 h-4" /> Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Load More */}
          {hasMore && !loading && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-700 hover:text-green-700 px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More Reviews
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
