'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import {
  User,
  Briefcase,
  Camera,
  Plus,
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Loader2,
  Sparkles,
  Search,
  FileText,
  Rocket,
  Star,
  MapPin,
  DollarSign,
  Zap,
} from 'lucide-react'

const KENYAN_COUNTIES = [
  'Baringo','Bomet','Bungoma','Busia','Elgeyo-Marakwet','Embu','Garissa','Homa Bay',
  'Isiolo','Kajiado','Kakamega','Kericho','Kiambu','Kilifi','Kirinyaga','Kisii','Kisumu',
  'Kitui','Kwale','Laikipia','Lamu','Machakos','Makueni','Mandera','Marsabit','Meru',
  'Migori','Mombasa','Murang\'a','Nairobi','Nakuru','Nandi','Narok','Nyamira','Nyandarua',
  'Nyeri','Samburu','Siaya','Taita-Taveta','Tana River','Tharaka-Nithi','Trans-Nzoia',
  'Turkana','Uasin Gishu','Vihiga','Wajir','West Pokot',
]

const POPULAR_SKILLS = [
  'Web Development', 'Mobile App Development', 'Graphic Design', 'UI/UX Design',
  'Content Writing', 'Copywriting', 'SEO', 'Social Media Marketing',
  'Data Entry', 'Virtual Assistant', 'Video Editing', 'Photography',
  'Translation', 'Accounting', 'Customer Service', 'WordPress',
  'React', 'Node.js', 'Python', 'Flutter',
]

interface StepProps {
  onNext: () => void
  onBack?: () => void
}

export default function OnboardingPage() {
  const { profile, refreshProfile } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [fullName, setFullName] = useState('')
  const [title, setTitle] = useState('')
  const [bio, setBio] = useState('')
  const [county, setCounty] = useState('')
  const [phone, setPhone] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)

  // Pre-fill from existing profile
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setTitle(profile.title || '')
      setBio(profile.bio || '')
      setCounty(profile.county || '')
      setPhone(profile.phone || '')
      setHourlyRate(profile.hourly_rate?.toString() || '')
      setSkills(profile.skills || [])
      if (profile.avatar_url) setAvatarPreview(profile.avatar_url)
    }
  }, [profile])

  const isFreelancer = profile?.role === 'Freelancer'

  const steps = isFreelancer
    ? [
        { icon: User, label: 'Your Info', desc: 'Basic details' },
        { icon: Briefcase, label: 'Professional', desc: 'Skills & rate' },
        { icon: Camera, label: 'Photo', desc: 'Stand out' },
        { icon: Rocket, label: 'Ready!', desc: 'Start hustling' },
      ]
    : [
        { icon: User, label: 'Your Info', desc: 'Basic details' },
        { icon: Camera, label: 'Photo', desc: 'Build trust' },
        { icon: Rocket, label: 'Ready!', desc: 'Start hiring' },
      ]

  const totalSteps = steps.length

  const handleSaveProfile = async () => {
    setSaving(true)
    setError('')
    try {
      const body: Record<string, unknown> = {
        full_name: fullName.trim(),
        title: title.trim(),
        bio: bio.trim(),
        county,
        phone: phone.trim(),
      }
      if (isFreelancer) {
        body.hourly_rate = hourlyRate ? Number(hourlyRate) : null
        body.skills = skills
      }
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      await refreshProfile()
    } catch (e: any) {
      setError(e.message || 'Save failed')
      throw e
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setAvatarPreview(data.avatar_url || '')
        await refreshProfile()
      }
    } catch {
      // silently fail
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleNext = async () => {
    // Save profile on step transitions (except last step)
    if (step < totalSteps - 1) {
      try {
        await handleSaveProfile()
      } catch {
        return // don't advance if save fails
      }
    }
    if (step < totalSteps - 1) {
      setStep(step + 1)
    }
  }

  const addSkill = (skill: string) => {
    const trimmed = skill.trim()
    if (trimmed && !skills.includes(trimmed) && skills.length < 20) {
      setSkills([...skills, trimmed])
      setNewSkill('')
    }
  }

  const initials = (fullName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-[calc(100vh-56px-64px)] lg:min-h-[calc(100vh-64px)] flex flex-col">
      {/* Progress bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-900">Setup Your Profile</span>
            <span className="text-xs text-gray-400">Step {step + 1} of {totalSteps}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>
          {/* Step indicators */}
          <div className="flex items-center justify-between mt-3">
            {steps.map((s, i) => (
              <button
                key={i}
                onClick={() => i <= step && setStep(i)}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  i <= step ? 'text-green-600' : 'text-gray-400'
                } ${i < step ? 'cursor-pointer' : i === step ? '' : 'cursor-default'}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i < step ? 'bg-green-600 text-white' : i === step ? 'bg-green-100 text-green-700 ring-2 ring-green-500' : 'bg-gray-100 text-gray-400'
                }`}>
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-6">
              {error}
            </div>
          )}

          {/* STEP 0: Basic Info */}
          {step === 0 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <User className="w-7 h-7 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Let&apos;s get to know you</h2>
                <p className="text-sm text-gray-500 mt-1">Fill in your basic info to get started</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Wanjiku Muthoni"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFreelancer ? 'Professional Title *' : 'Company / Role'}
                  </label>
                  <input
                    type="text" value={title} onChange={e => setTitle(e.target.value)}
                    placeholder={isFreelancer ? 'e.g. Full-Stack Developer' : 'e.g. CEO at TechCo'}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    value={bio} onChange={e => setBio(e.target.value)}
                    placeholder={isFreelancer ? 'Tell clients about your experience, skills, and what makes you great...' : 'Tell freelancers about your company and what you\'re looking for...'}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm resize-none"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
                    <select
                      value={county} onChange={e => setCounty(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm bg-white"
                    >
                      <option value="">Select county...</option>
                      {KENYAN_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa Phone</label>
                    <input
                      type="text" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="07XXXXXXXX"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1 (Freelancer): Skills & Rate */}
          {step === 1 && isFreelancer && (
            <div>
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Briefcase className="w-7 h-7 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Your skills & expertise</h2>
                <p className="text-sm text-gray-500 mt-1">Help clients find you for the right projects</p>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (KES)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)}
                      placeholder="e.g. 2000"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Average Kenyan freelancer rate: KES 1,500 — 5,000/hr</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills ({skills.length}/20)
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)}
                      placeholder="Type a skill..."
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill(newSkill))}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm"
                    />
                    <button
                      onClick={() => addSkill(newSkill)}
                      disabled={!newSkill.trim() || skills.length >= 20}
                      className="px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>

                  {/* Current skills */}
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {skills.map(s => (
                        <span key={s} className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-medium">
                          {s}
                          <button onClick={() => setSkills(skills.filter(sk => sk !== s))} className="hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Popular skills */}
                  <p className="text-xs font-medium text-gray-500 mb-2">Popular skills — click to add:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_SKILLS.filter(s => !skills.includes(s)).slice(0, 12).map(s => (
                      <button
                        key={s}
                        onClick={() => addSkill(s)}
                        className="text-xs bg-gray-100 hover:bg-green-50 hover:text-green-700 text-gray-600 px-2.5 py-1.5 rounded-full transition-colors"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PHOTO STEP */}
          {((step === 2 && isFreelancer) || (step === 1 && !isFreelancer)) && (
            <div>
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Camera className="w-7 h-7 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Add a profile photo</h2>
                <p className="text-sm text-gray-500 mt-1">Profiles with photos get 40% more engagement</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="relative mb-6">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-green-100" />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-green-100">
                      {initials}
                    </div>
                  )}
                  <button
                    onClick={() => avatarRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center text-white border-3 border-white shadow-lg transition-colors disabled:opacity-50"
                  >
                    {uploadingAvatar ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                  </button>
                  <input
                    ref={avatarRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setAvatarFile(file)
                        setAvatarPreview(URL.createObjectURL(file))
                        handleAvatarUpload(file)
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 text-center max-w-xs">
                  Upload a clear headshot. JPG, PNG or WebP, max 2MB.
                </p>
                <button
                  onClick={() => avatarRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="mt-4 inline-flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                </button>
                {!avatarPreview && (
                  <button onClick={handleNext} className="mt-3 text-xs text-gray-400 hover:text-gray-600">
                    Skip for now →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* FINAL STEP: Ready! */}
          {step === totalSteps - 1 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re all set!</h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                {isFreelancer
                  ? 'Your profile is ready. Start browsing jobs or wait for clients to find you.'
                  : 'Your profile is ready. Post your first job or browse our talented freelancers.'}
              </p>

              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 max-w-lg mx-auto">
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-lg font-bold text-green-600">{fullName ? '✓' : '—'}</p>
                  <p className="text-[10px] text-gray-500">Name</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-lg font-bold text-green-600">{title ? '✓' : '—'}</p>
                  <p className="text-[10px] text-gray-500">Title</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-lg font-bold text-green-600">{skills.length > 0 ? skills.length : '—'}</p>
                  <p className="text-[10px] text-gray-500">Skills</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-lg font-bold text-green-600">{avatarPreview ? '✓' : '—'}</p>
                  <p className="text-[10px] text-gray-500">Photo</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid sm:grid-cols-2 gap-3 max-w-md mx-auto">
                {isFreelancer ? (
                  <>
                    <Link
                      href="/jobs"
                      className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-colors"
                    >
                      <Search className="w-4 h-4" /> Browse Jobs
                    </Link>
                    <Link
                      href="/dashboard"
                      className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-3 rounded-xl font-semibold text-sm transition-colors"
                    >
                      <Star className="w-4 h-4" /> Go to Dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/post-job"
                      className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-colors"
                    >
                      <FileText className="w-4 h-4" /> Post a Job
                    </Link>
                    <Link
                      href="/talent"
                      className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-3 rounded-xl font-semibold text-sm transition-colors"
                    >
                      <Search className="w-4 h-4" /> Find Freelancers
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          {step < totalSteps - 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              {step > 0 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600">
                  Skip setup →
                </Link>
              )}
              <button
                onClick={handleNext}
                disabled={saving || (step === 0 && !fullName.trim())}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {step === totalSteps - 2 ? 'Finish' : 'Continue'}
                {!saving && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
