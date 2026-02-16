'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  Star,
  MessageSquare,
  Clock,
  Briefcase,
  DollarSign,
  MapPin,
  Globe,
  Shield,
  Users,
  TrendingUp,
  Filter,
  ChevronDown,
  Search,
  Loader2,
  Tag,
} from 'lucide-react'

interface Review {
  id: string
  rating: number
  comment?: string
  communication_rating?: number
  quality_rating?: number
  timeliness_rating?: number
  created_at: string
  reviewer: {
    id: string
    full_name: string
    avatar_url?: string
    title?: string
  }
  reviewee: {
    id: string
    full_name: string
    avatar_url?: string
    title?: string
    skills?: string[]
    verification_status?: string
    hustle_score?: number
    hourly_rate?: number
  }
  job: {
    id: string
    title: string
    category?: string
    budget_min?: number
    budget_max?: number
    deadline?: string
    created_at: string
  }
}

export default function OrgReviewsPage() {
  const { user, profile, orgMode, activeOrg } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [ratingFilter, setRatingFilter] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0, hasMore: false })
  const [stats, setStats] = useState({
    total: 0,
    averageRating: 0,
    ratingCounts: {} as Record<number, number>,
  })

  useEffect(() => {
    if (!orgMode || !activeOrg) return
    loadReviews()
  }, [orgMode, activeOrg, search, ratingFilter, sortBy])

  const loadReviews = async () => {
    if (!activeOrg) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        organization_id: activeOrg.id,
        limit: '20',
        offset: pagination.offset.toString(),
        ...(search && { search }),
        ...(ratingFilter && { rating: ratingFilter }),
        ...(sortBy && { sort: sortBy }),
      })
      const res = await fetch(`/api/reviews/organization?${params}`)
      const data = await res.json()
      if (data.reviews) {
        setReviews(data.reviews)
        setPagination(data.pagination)
        setStats(data.stats)
      }
    } catch {}
    setLoading(false)
  }

  const StarRow = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`${size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} ${
            star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  )

  const timeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString()
  }

  return (
    <div className="p-4 lg:p-6 xl:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Organization Reviews</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Reviews received on {activeOrg?.name || 'organization'} jobs
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
              <p className="text-xs text-gray-500">Average Rating</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Reviews</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.ratingCounts[5] || 0}</p>
              <p className="text-xs text-gray-500">5-Star Reviews</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.ratingCounts[4] || 0}</p>
              <p className="text-xs text-gray-500">4-Star Reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Rating Distribution</h3>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map(rating => (
            <div key={rating} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-12">{rating}★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all"
                  style={{ width: `${stats.total > 0 ? (stats.ratingCounts[rating] || 0) / stats.total * 100 : 0}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-12 text-right">
                {stats.ratingCounts[rating] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20"
          />
        </div>
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20"
        >
          <option value="">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20"
        >
          <option value="newest">Newest First</option>
          <option value="highest">Highest Rating</option>
          <option value="lowest">Lowest Rating</option>
        </select>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-50 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl p-10 border border-gray-200 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-900 font-semibold mb-1">No reviews yet</p>
          <p className="text-gray-500 text-sm">Reviews will appear here once clients start reviewing completed jobs.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start gap-4">
                {/* Reviewer */}
                <div className="shrink-0">
                  {review.reviewer.avatar_url ? (
                    <img src={review.reviewer.avatar_url} alt={review.reviewer.full_name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {review.reviewer.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900">{review.reviewer.full_name}</p>
                    {review.reviewer.title && (
                      <span className="text-xs text-gray-500">{review.reviewer.title}</span>
                    )}
                    <span className="text-xs text-gray-400">• {timeAgo(review.created_at)}</span>
                  </div>

                  {/* Rating */}
                  <div className="mb-2">
                    <StarRow rating={review.rating} />
                    <div className="flex gap-4 mt-1 text-xs text-gray-500">
                      {review.communication_rating && (
                        <span>Communication: {review.communication_rating}/5</span>
                      )}
                      {review.quality_rating && (
                        <span>Quality: {review.quality_rating}/5</span>
                      )}
                      {review.timeliness_rating && (
                        <span>Timeliness: {review.timeliness_rating}/5</span>
                      )}
                    </div>
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-sm text-gray-700 mb-3">{review.comment}</p>
                  )}

                  {/* Reviewee Info */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Reviewed:</span>
                    {review.reviewee.avatar_url ? (
                      <img src={review.reviewee.avatar_url} alt={review.reviewee.full_name} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {review.reviewee.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                      </div>
                    )}
                    <span className="font-medium">{review.reviewee.full_name}</span>
                    {review.reviewee.title && <span>• {review.reviewee.title}</span>}
                    {review.reviewee.verification_status === 'Verified' && (
                      <Shield className="w-3 h-3 text-green-600" />
                    )}
                  </div>

                  {/* Job Info */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      {review.job.title}
                    </span>
                    {review.job.category && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        {review.job.category}
                      </span>
                    )}
                    {review.job.budget_min && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        KES {review.job.budget_min.toLocaleString()}
                        {review.job.budget_max && ` - ${review.job.budget_max.toLocaleString()}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
