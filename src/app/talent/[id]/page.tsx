'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import {
  Star,
  MapPin,
  Shield,
  Briefcase,
  Clock,
  Award,
  MessageSquare,
  ArrowLeft,
  Globe,
  Calendar,
  Crown,
  Loader2,
  GraduationCap,
  ExternalLink,
  FolderOpen,
  ImageIcon,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Share2,
  Heart,
  Building2,
} from 'lucide-react'

interface PortfolioImage {
  id: string
  url: string
  alt_text: string | null
  is_cover: boolean
}

interface PortfolioItem {
  id: string
  title: string
  description: string | null
  client_name: string | null
  project_url: string | null
  category_id: string | null
  tags: string[]
  images: PortfolioImage[]
}

interface PortfolioCategory {
  id: string
  name: string
  description: string | null
  items: PortfolioItem[]
}

interface TalentProfileData {
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
  swahili_speaking: boolean
  is_pro?: boolean
  created_at: string
  years_experience?: number
  availability?: string
  available_from?: string
  education?: Array<{ school: string; degree: string; field: string; year: string }>
  certifications?: Array<{ name: string; issuer: string; year: string; url: string }>
  portfolio?: PortfolioCategory[]
}

interface ReviewData {
  id: string
  rating: number
  communication_rating?: number
  quality_rating?: number
  timeliness_rating?: number
  comment: string
  created_at: string
  reviewer?: { id: string; full_name: string; avatar_url?: string }
  job?: { id: string; title: string }
}

export default function TalentProfilePage({ params }: { params: { id: string } }) {
  const { profile: authProfile } = useAuth()
  const [talent, setTalent] = useState<TalentProfileData | null>(null)
  const [reviews, setReviews] = useState<ReviewData[]>([])
  const [reviewStats, setReviewStats] = useState({ average_rating: 0, total_reviews: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [lightboxItem, setLightboxItem] = useState<PortfolioItem | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const [hasOrg, setHasOrg] = useState(false)
  const [savedToBench, setSavedToBench] = useState(false)
  const [savingToBench, setSavingToBench] = useState(false)
  const [benchMsg, setBenchMsg] = useState('')

  // Check if user has an enterprise org
  useEffect(() => {
    if (!authProfile) return
    fetch('/api/enterprise')
      .then(r => r.json())
      .then(d => { if (d.organization) setHasOrg(true) })
      .catch(() => {})
  }, [authProfile])

  const handleSaveToBench = async () => {
    if (!talent || savingToBench) return
    setSavingToBench(true)
    setBenchMsg('')
    try {
      const res = await fetch('/api/enterprise/bench', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freelancer_id: talent.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setSavedToBench(true)
        setBenchMsg('Saved to your bench!')
      } else {
        setBenchMsg(data.error || 'Failed to save')
      }
    } catch {
      setBenchMsg('Network error')
    } finally {
      setSavingToBench(false)
      setTimeout(() => setBenchMsg(''), 3000)
    }
  }

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxItem) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxItem(null)
      if (e.key === 'ArrowRight') setLightboxIndex(i => (i + 1) % (lightboxItem.images?.length || 1))
      if (e.key === 'ArrowLeft') setLightboxIndex(i => (i - 1 + (lightboxItem.images?.length || 1)) % (lightboxItem.images?.length || 1))
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxItem])

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const [profileRes, reviewsRes] = await Promise.all([
          fetch(`/api/profile/${params.id}`),
          fetch(`/api/reviews/${params.id}?limit=20`),
        ])

        const profileData = await profileRes.json()
        const reviewsData = await reviewsRes.json()

        if (profileData.profile) {
          setTalent(profileData.profile)
          document.title = `${profileData.profile.full_name} — ${profileData.profile.title || 'Freelancer'} | HustleKE`
        } else {
          setError('Profile not found')
        }

        if (reviewsData.reviews) {
          setReviews(reviewsData.reviews)
          setReviewStats(reviewsData.stats || { average_rating: 0, total_reviews: 0 })
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err)
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [params.id])

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })
  }

  const memberSince = talent?.created_at ? formatDate(talent.created_at) : ''

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header activeLink="/talent" />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !talent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header activeLink="/talent" />
        <div className="text-center py-32">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-500 mb-4">{error || 'This freelancer profile does not exist.'}</p>
          <Link href="/talent" className="text-green-600 hover:text-green-700 font-medium flex items-center gap-1 justify-center">
            <ArrowLeft className="w-4 h-4" /> Back to Talent
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeLink="/talent" />

      {/* Profile Header */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Link href="/talent" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Talent
          </Link>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {talent.avatar_url ? (
              <img src={talent.avatar_url} alt={talent.full_name} className="w-24 h-24 rounded-2xl object-cover shadow-md shrink-0" />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shrink-0 shadow-md">
                {getInitials(talent.full_name)}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{talent.full_name}</h1>
                {talent.verification_status === 'Verified' && <Shield className="w-5 h-5 text-green-500" />}
                {talent.is_pro && (
                  <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full"><Crown className="w-3 h-3" />PRO</span>
                )}
              </div>
              <p className="text-gray-600 mb-2">{talent.title || 'Freelancer'}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                {(talent.county || talent.location) && (
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {talent.county || talent.location}</span>
                )}
                {memberSince && (
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Member since {memberSince}</span>
                )}
                {talent.languages && talent.languages.length > 0 && (
                  <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> {talent.languages.join(', ')}</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {reviewStats.total_reviews > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-gray-900">{reviewStats.average_rating}</span>
                    <span className="text-gray-500">({reviewStats.total_reviews} review{reviewStats.total_reviews !== 1 ? 's' : ''})</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Award className="w-5 h-5 text-green-500" />
                  <span className="font-semibold text-gray-900">Hustle Score: {talent.hustle_score}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Briefcase className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-700">{talent.jobs_completed} jobs completed</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              {talent.hourly_rate != null && talent.hourly_rate > 0 && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">KES {talent.hourly_rate.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">per hour</p>
                </div>
              )}
              {authProfile && authProfile.id !== talent.id && (
                <div className="flex flex-col gap-2 items-end">
                  <Link
                    href={`/dashboard/messages?to=${talent.id}&name=${encodeURIComponent(talent.full_name)}`}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 w-full justify-center"
                  >
                    <MessageSquare className="w-5 h-5" /> Hire {talent.full_name.split(' ')[0]}
                  </Link>
                  {hasOrg && (
                    <button
                      onClick={handleSaveToBench}
                      disabled={savingToBench || savedToBench}
                      className={`w-full px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 justify-center ${
                        savedToBench
                          ? 'bg-green-50 text-green-600 border border-green-200'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                      } disabled:opacity-60`}
                    >
                      {savingToBench ? <Loader2 className="w-4 h-4 animate-spin" /> : savedToBench ? <CheckCircle2 className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
                      {savedToBench ? 'Saved to Bench' : 'Save to Bench'}
                    </button>
                  )}
                  {benchMsg && !savedToBench && <p className="text-xs text-red-500">{benchMsg}</p>}
                </div>
              )}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="text-gray-400 hover:text-green-600 transition-colors flex items-center gap-1.5 text-sm"
              >
                {copied ? <><CheckCircle2 className="w-4 h-4 text-green-500" /> Copied!</> : <><Share2 className="w-4 h-4" /> Share Profile</>}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-6">
            {['overview', 'portfolio', 'reviews'].map((tab) => {
              const totalPortfolio = talent?.portfolio?.reduce((sum, cat) => sum + (cat.items?.length || 0), 0) || 0
              const label = tab === 'reviews' ? `Reviews (${reviewStats.total_reviews})` : tab === 'portfolio' ? `Portfolio${totalPortfolio > 0 ? ` (${totalPortfolio})` : ''}` : tab.charAt(0).toUpperCase() + tab.slice(1)
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              {/* About */}
              {talent.bio && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h2 className="font-bold text-gray-900 mb-3">About</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{talent.bio}</p>
                </div>
              )}

              {/* Skills */}
              {talent.skills && talent.skills.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h2 className="font-bold text-gray-900 mb-4">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {talent.skills.map((skill: string) => (
                      <span key={skill} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {talent.education && talent.education.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <GraduationCap className="w-5 h-5 text-green-600" />
                    <h2 className="font-bold text-gray-900">Education</h2>
                  </div>
                  <div className="space-y-3">
                    {talent.education.map((edu, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 shrink-0"></div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</p>
                          <p className="text-xs text-gray-500">{edu.school}{edu.year ? ` — ${edu.year}` : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {talent.certifications && talent.certifications.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-green-600" />
                    <h2 className="font-bold text-gray-900">Certifications</h2>
                  </div>
                  <div className="space-y-3">
                    {talent.certifications.map((cert, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{cert.name}</p>
                          <p className="text-xs text-gray-500">{cert.issuer}{cert.year ? ` — ${cert.year}` : ''}</p>
                          {cert.url && (
                            <a href={cert.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 mt-0.5"><ExternalLink className="w-3 h-3" />Verify</a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-gray-500 text-sm">Jobs Completed</span><span className="font-semibold">{talent.jobs_completed}</span></div>
                  {talent.hourly_rate != null && talent.hourly_rate > 0 && (
                    <div className="flex justify-between"><span className="text-gray-500 text-sm">Hourly Rate</span><span className="font-semibold text-green-600">KES {talent.hourly_rate.toLocaleString()}</span></div>
                  )}
                  {talent.years_experience != null && talent.years_experience > 0 && (
                    <div className="flex justify-between"><span className="text-gray-500 text-sm">Experience</span><span className="font-semibold">{talent.years_experience} year{talent.years_experience !== 1 ? 's' : ''}</span></div>
                  )}
                  {talent.total_earned > 0 && (
                    <div className="flex justify-between"><span className="text-gray-500 text-sm">Total Earned</span><span className="font-semibold text-green-600">KES {talent.total_earned.toLocaleString()}</span></div>
                  )}
                  {talent.languages && talent.languages.length > 0 && (
                    <div className="flex justify-between"><span className="text-gray-500 text-sm">Languages</span><span className="font-semibold text-right">{talent.languages.join(', ')}</span></div>
                  )}
                </div>
              </div>

              {/* Availability */}
              {talent.availability && (
                <div className={`rounded-2xl p-6 border ${
                  talent.availability === 'available' ? 'bg-green-50 border-green-200' :
                  talent.availability === 'busy' ? 'bg-amber-50 border-amber-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-5 h-5" />
                    <h3 className="font-bold">Availability</h3>
                  </div>
                  <p className="text-sm font-medium">
                    {talent.availability === 'available' ? 'Available Now' :
                     talent.availability === 'busy' ? 'Currently Busy' :
                     talent.availability === 'unavailable' ? 'Unavailable' :
                     talent.availability === 'available_from' && talent.available_from ? `Available from ${new Date(talent.available_from).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}` :
                     'Available'}
                  </p>
                </div>
              )}

              {/* Hustle Score */}
              <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-green-600" />
                  <h3 className="font-bold text-green-800">Hustle Score</h3>
                </div>
                <div className="text-4xl font-bold text-green-600 mb-2">{talent.hustle_score}</div>
                <div className="h-2 bg-green-200 rounded-full"><div className="h-2 bg-green-600 rounded-full" style={{ width: `${Math.min(talent.hustle_score, 100)}%` }}></div></div>
                <p className="text-xs text-green-700 mt-2">
                  {talent.hustle_score >= 90 ? 'Top performer' : talent.hustle_score >= 70 ? 'Experienced freelancer' : 'Rising talent'}
                </p>
              </div>

              {/* Pro badge */}
              {talent.is_pro && (
                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5 text-amber-600" />
                    <h3 className="font-bold text-amber-800">Pro Member</h3>
                  </div>
                  <p className="text-xs text-amber-700">This freelancer is a HustleKE Pro member with reduced fees, featured profile, and priority support.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div className="space-y-8">
            {talent.portfolio && talent.portfolio.length > 0 ? (
              talent.portfolio.map(category => (
                <div key={category.id}>
                  <div className="flex items-center gap-2 mb-4">
                    <FolderOpen className="w-5 h-5 text-green-600" />
                    <h2 className="text-lg font-bold text-gray-900">{category.name}</h2>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{category.items?.length || 0} project{(category.items?.length || 0) !== 1 ? 's' : ''}</span>
                  </div>

                  <div className="space-y-6">
                    {category.items?.map(item => (
                      <div key={item.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        {/* Project Info */}
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                              {item.description && <p className="text-sm text-gray-500 mb-2">{item.description}</p>}
                              <div className="flex items-center gap-3 flex-wrap">
                                {item.client_name && (
                                  <span className="text-xs text-gray-400 flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{item.client_name}</span>
                                )}
                                {item.project_url && (
                                  <a href={item.project_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5" />View Project</a>
                                )}
                              </div>
                              {item.tags && item.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {item.tags.map(tag => (
                                    <span key={tag} className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{tag}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Image Thumbnails Grid */}
                        {item.images && item.images.length > 0 && (
                          <div className="px-5 pb-5">
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                              {item.images.map((img, imgIdx) => (
                                <button
                                  key={img.id}
                                  onClick={() => { setLightboxItem(item); setLightboxIndex(imgIdx) }}
                                  className="aspect-square rounded-xl overflow-hidden bg-gray-100 group cursor-pointer relative"
                                >
                                  <img
                                    src={img.url}
                                    alt={img.alt_text || item.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl" />
                                  {img.is_cover && (
                                    <span className="absolute top-1 left-1 bg-green-600 text-white text-[8px] px-1.5 py-0.5 rounded font-medium">Cover</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* No images placeholder */}
                        {(!item.images || item.images.length === 0) && (
                          <div className="px-5 pb-5">
                            <div className="bg-gray-50 rounded-xl py-6 flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-gray-200" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <FolderOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No portfolio items yet</p>
                <p className="text-xs text-gray-400 mt-1">This freelancer hasn&apos;t added any work samples.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {reviews.length > 0 ? (
              <>
                {/* Review Summary */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900">{reviewStats.average_rating}</div>
                      <div className="flex gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`w-4 h-4 ${s <= Math.round(reviewStats.average_rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{reviewStats.total_reviews} review{reviewStats.total_reviews !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>

                {reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{review.reviewer?.full_name || 'Client'}</p>
                        {review.job?.title && <p className="text-xs text-gray-500">for: {review.job.title}</p>}
                        <p className="text-xs text-gray-400">{formatDate(review.created_at)}</p>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{review.comment}</p>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-16">
                <Star className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No reviews yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Portfolio Image Lightbox */}
      {lightboxItem && lightboxItem.images && lightboxItem.images.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxItem(null)}>
          {/* Close button */}
          <button onClick={() => setLightboxItem(null)} className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-10">
            <X className="w-6 h-6" />
          </button>

          {/* Image counter */}
          <div className="absolute top-4 left-4 text-white/70 text-sm">
            {lightboxIndex + 1} / {lightboxItem.images.length}
          </div>

          {/* Previous */}
          {lightboxItem.images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => (i - 1 + lightboxItem.images.length) % lightboxItem.images.length) }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 bg-black/30 rounded-full"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Main image */}
          <div className="max-w-4xl max-h-[80vh] px-16" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxItem.images[lightboxIndex].url}
              alt={lightboxItem.images[lightboxIndex].alt_text || lightboxItem.title}
              className="max-w-full max-h-[75vh] object-contain mx-auto rounded-lg"
            />
            <div className="text-center mt-4">
              <h3 className="text-white font-semibold">{lightboxItem.title}</h3>
              {lightboxItem.client_name && <p className="text-white/60 text-sm mt-1">{lightboxItem.client_name}</p>}
              {lightboxItem.description && <p className="text-white/50 text-xs mt-1 max-w-lg mx-auto line-clamp-2">{lightboxItem.description}</p>}
            </div>
          </div>

          {/* Next */}
          {lightboxItem.images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => (i + 1) % lightboxItem.images.length) }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 bg-black/30 rounded-full"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Thumbnails */}
          {lightboxItem.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {lightboxItem.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(i) }}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === lightboxIndex ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Footer />
    </div>
  )
}
