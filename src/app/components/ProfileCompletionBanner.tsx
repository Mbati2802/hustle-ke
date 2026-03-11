'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, AlertCircle, CheckCircle2, ChevronRight, UserCircle2, Camera, FileText, Briefcase, Star, DollarSign, MapPin } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface MissingItem {
  key: string
  label: string
  icon: React.ElementType
  href: string
  points: number
  quality?: boolean // true = quality issue (e.g. bio too short), not just missing
}

function calcCompletion(profile: any): { score: number; missing: MissingItem[]; qualityWarnings: string[] } {
  const missing: MissingItem[] = []
  const qualityWarnings: string[] = []

  if (!profile?.avatar_url) {
    missing.push({ key: 'photo', label: 'Profile photo', icon: Camera, href: '/dashboard/settings?tab=profile', points: 15 })
  }
  if (!profile?.title || profile.title.trim().length < 5) {
    missing.push({ key: 'title', label: 'Professional title', icon: Briefcase, href: '/dashboard/settings?tab=profile', points: 10 })
  }
  if (!profile?.bio || profile.bio.trim().length < 20) {
    missing.push({ key: 'bio', label: 'Bio / About Me', icon: FileText, href: '/dashboard/settings?tab=profile', points: 20 })
  } else if (profile.bio.trim().length < 100) {
    qualityWarnings.push('Your bio is very short. A detailed bio attracts more clients.')
  }
  const skills = profile?.skills || []
  if (skills.length === 0) {
    missing.push({ key: 'skills', label: 'Skills', icon: Star, href: '/dashboard/settings?tab=profile', points: 20 })
  } else if (skills.length < 3) {
    qualityWarnings.push('Add at least 3 skills to improve visibility in search results.')
  }
  if (!profile?.phone) {
    missing.push({ key: 'phone', label: 'Phone number', icon: UserCircle2, href: '/dashboard/settings?tab=profile', points: 10 })
  }
  if (!profile?.county) {
    missing.push({ key: 'county', label: 'Location (county)', icon: MapPin, href: '/dashboard/settings?tab=profile', points: 5 })
  }
  if (!profile?.hourly_rate || profile.hourly_rate <= 0) {
    missing.push({ key: 'rate', label: 'Hourly rate', icon: DollarSign, href: '/dashboard/settings?tab=profile', points: 10 })
  }

  const totalPossible = 90
  const missingPoints = missing.reduce((s, m) => s + m.points, 0)
  const score = Math.max(0, Math.round(((totalPossible - missingPoints) / totalPossible) * 100))

  return { score, missing, qualityWarnings }
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 50) return 'text-amber-600'
  return 'text-red-500'
}

function getBarColor(score: number) {
  if (score >= 80) return 'bg-green-500'
  if (score >= 50) return 'bg-amber-400'
  return 'bg-red-400'
}

export default function ProfileCompletionBanner() {
  const { profile } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if dismissed this session
    const key = `profile_banner_dismissed_${profile?.id}`
    if (sessionStorage.getItem(key) === '1') {
      setDismissed(true)
    }
  }, [profile?.id])

  const handleDismiss = () => {
    setDismissed(true)
    if (profile?.id) {
      sessionStorage.setItem(`profile_banner_dismissed_${profile.id}`, '1')
    }
  }

  if (!mounted || !profile) return null

  // Only show for Freelancers
  if (profile.role !== 'Freelancer') return null

  const { score, missing, qualityWarnings } = calcCompletion(profile)

  // Don't show if profile is complete enough (≥ 85%) and no quality warnings
  if (score >= 85 && qualityWarnings.length === 0) return null

  if (dismissed) return null

  const topMissing = missing.slice(0, 3)

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-amber-400 hover:text-amber-600 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="pr-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-amber-900 text-sm">
                Profile {score}% complete
              </p>
              <span className={`text-xs font-bold ${getScoreColor(score)}`}>{score}%</span>
            </div>
            {/* Progress bar */}
            <div className="mt-1 h-1.5 bg-amber-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getBarColor(score)}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quality warning */}
        {score >= 50 && qualityWarnings.length > 0 && missing.length === 0 && (
          <p className="text-xs text-amber-700 mb-3 italic">
            {qualityWarnings[0]}
          </p>
        )}

        {/* Low score warning */}
        {score < 50 && (
          <p className="text-xs text-amber-700 mb-3">
            Your profile may not attract clients yet. Complete the sections below to increase your chances of getting hired.
          </p>
        )}

        {/* Missing items */}
        {topMissing.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {topMissing.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className="flex items-center gap-1.5 bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50 text-amber-800 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                  <ChevronRight className="w-3 h-3 opacity-60" />
                </Link>
              )
            })}
            {missing.length > 3 && (
              <Link
                href="/dashboard/settings?tab=profile"
                className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-medium px-2 py-1.5"
              >
                +{missing.length - 3} more <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        )}

        {/* Quality-only warnings (when no missing items) */}
        {missing.length === 0 && qualityWarnings.map((w, i) => (
          <div key={i} className="flex items-start gap-2 mt-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">{w}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
