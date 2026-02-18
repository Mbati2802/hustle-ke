'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import {
  User,
  MapPin,
  Star,
  Briefcase,
  Clock,
  DollarSign,
  CheckCircle2,
  Crown,
  ExternalLink,
  Mail,
  Calendar,
  Award,
  Loader2,
  Shield,
  Dna,
} from 'lucide-react'

interface PublicProfile {
  id: string
  user_id: string
  full_name: string
  title: string
  bio: string
  county: string
  skills: string[]
  hourly_rate: number
  avatar_url: string | null
  role: string
  hustle_score: number
  jobs_completed: number
  total_earned: number
  verification_status: string
  is_verified: boolean
  years_experience: number
  availability: string
  created_at: string
  is_pro: boolean
  avg_rating: number
  review_count: number
}

export default function VanityProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params?.username as string
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!username) return
    const fetchProfile = async () => {
      try {
        // Try to find profile by username (using full_name slug or referral_code)
        const res = await fetch(`/api/profile/username/${username}`)
        if (res.status === 404) {
          setNotFound(true)
          return
        }
        const data = await res.json()
        if (data.profile) {
          setProfile(data.profile)
        } else {
          setNotFound(true)
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [username])

  const initials = (profile?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-3xl mx-auto px-4 pt-28 pb-16">
          <div className="animate-pulse">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gray-200 rounded-full" />
              <div>
                <div className="h-6 w-48 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-32 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="h-4 w-full bg-gray-100 rounded mb-2" />
            <div className="h-4 w-3/4 bg-gray-100 rounded" />
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-3xl mx-auto px-4 pt-28 pb-16 text-center">
          <User className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
          <p className="text-gray-500 mb-6">The user &ldquo;{username}&rdquo; doesn&apos;t exist or hasn&apos;t set up a public profile.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/talent" className="text-green-600 hover:text-green-700 font-medium text-sm">
              Browse Talent →
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        {/* Profile header */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
          {/* Cover gradient */}
          <div className="h-32 bg-gradient-to-br from-green-500 to-emerald-600" />

          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 mb-4">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{profile.full_name}</h1>
                  {profile.is_verified && (
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  )}
                  {profile.is_pro && (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold">
                      <Crown className="w-3 h-3" /> PRO
                    </span>
                  )}
                </div>
                {profile.title && (
                  <p className="text-gray-500 mt-0.5">{profile.title}</p>
                )}
              </div>
              <Link
                href={`/talent/${profile.id}`}
                className="shrink-0 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                View Full Profile <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500 mb-4">
              {profile.county && (
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {profile.county}, Kenya</span>
              )}
              {profile.hourly_rate > 0 && (
                <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> KES {profile.hourly_rate.toLocaleString()}/hr</span>
              )}
              {profile.avg_rating > 0 && (
                <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-500" /> {profile.avg_rating.toFixed(1)} ({profile.review_count} reviews)</span>
              )}
              {profile.jobs_completed > 0 && (
                <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {profile.jobs_completed} jobs done</span>
              )}
              {profile.years_experience > 0 && (
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {profile.years_experience}+ years exp.</span>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{profile.bio}</p>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map(skill => (
                  <span key={skill} className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Trust indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <Shield className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-gray-900">{profile.hustle_score || 0}</p>
            <p className="text-[10px] text-gray-500 uppercase">Hustle Score</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <Star className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-lg font-bold text-gray-900">{profile.avg_rating > 0 ? profile.avg_rating.toFixed(1) : '—'}</p>
            <p className="text-[10px] text-gray-500 uppercase">Rating</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <Briefcase className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-gray-900">{profile.jobs_completed || 0}</p>
            <p className="text-[10px] text-gray-500 uppercase">Jobs Done</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <Calendar className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-gray-900">
              {profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'short' }) : '—'}
            </p>
            <p className="text-[10px] text-gray-500 uppercase">Member Since</p>
          </div>
        </div>

        {/* Availability */}
        {profile.availability && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${profile.availability === 'Available' ? 'bg-green-500' : profile.availability === 'Busy' ? 'bg-amber-500' : 'bg-gray-400'}`} />
              <span className="text-sm font-medium text-gray-900">
                {profile.availability === 'Available' ? 'Available for work' : profile.availability === 'Busy' ? 'Currently busy' : 'Not available'}
              </span>
            </div>
            <Link href={`/talent/${profile.id}`} className="text-xs text-green-600 hover:text-green-700 font-medium">
              Contact →
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
