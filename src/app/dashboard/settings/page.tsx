'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  User,
  MapPin,
  Lock,
  Bell,
  Shield,
  Camera,
  Save,
  CheckCircle2,
  Loader2,
  Crown,
  Zap,
  Tag,
  Briefcase,
  GraduationCap,
  Award,
  Plus,
  Trash2,
  ImageIcon,
  FolderOpen,
  X,
  Upload,
  ExternalLink,
  Globe,
} from 'lucide-react'

export default function SettingsPage() {
  const { profile: authProfile, refreshProfile } = useAuth()
  const searchParams = useSearchParams()
  type TabType = 'profile' | 'portfolio' | 'subscription' | 'security' | 'notifications' | 'verification'
  const [activeTab, setActiveTab] = useState<TabType>((searchParams.get('tab') as TabType) || 'profile')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [passwordChanging, setPasswordChanging] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    county: '',
    title: '',
    bio: '',
    hourlyRate: 0,
    yearsExperience: 0,
    availability: 'available' as string,
    availableFrom: '',
    skills: [] as string[],
    languages: [] as string[],
    education: [] as Array<{ school: string; degree: string; field: string; year: string }>,
    certifications: [] as Array<{ name: string; issuer: string; year: string; url: string }>,
  })
  const [newSkill, setNewSkill] = useState('')
  const [newLanguage, setNewLanguage] = useState('')

  // Portfolio state
  const [portfolioCategories, setPortfolioCategories] = useState<Array<{ id: string; name: string; description: string | null; sort_order: number }>>([])
  const [portfolioItems, setPortfolioItems] = useState<Array<{ id: string; title: string; description: string | null; client_name: string | null; project_url: string | null; category_id: string | null; tags: string[]; images: Array<{ id: string; url: string; alt_text: string | null; is_cover: boolean }> }>>([])
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [portfolioMsg, setPortfolioMsg] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItem, setNewItem] = useState({ title: '', description: '', client_name: '', project_url: '', category_id: '', tags: '' })
  const [uploadingImages, setUploadingImages] = useState<string | null>(null) // item ID being uploaded to
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [notifications, setNotifications] = useState({
    email_enabled: true,
    sms_enabled: true,
    push_enabled: true,
    job_alerts: true,
    message_alerts: true,
    proposal_alerts: true,
    subscription_alerts: true,
    escrow_alerts: true,
    marketing: false,
  })
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifMsg, setNotifMsg] = useState('')

  // Load profile data
  useEffect(() => {
    if (authProfile) {
      setProfileForm({
        fullName: authProfile.full_name || '',
        email: authProfile.email || '',
        phone: authProfile.phone || '',
        county: authProfile.county || '',
        title: authProfile.title || '',
        bio: authProfile.bio || '',
        hourlyRate: authProfile.hourly_rate || 0,
        yearsExperience: authProfile.years_experience || 0,
        availability: authProfile.availability || 'available',
        availableFrom: authProfile.available_from || '',
        skills: authProfile.skills || [],
        languages: authProfile.languages || ['English'],
        education: authProfile.education || [],
        certifications: authProfile.certifications || [],
      })

      // Fetch notification preferences
      fetch('/api/notifications/preferences')
        .then(r => r.json())
        .then(data => {
          if (data.preferences) {
            setNotifications(prev => ({ ...prev, ...data.preferences }))
          }
        })
        .catch(() => {})
    }
  }, [authProfile])

  const handleSaveNotifPrefs = async () => {
    setNotifSaving(true)
    setNotifMsg('')
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifications),
      })
      const data = await res.json()
      if (res.ok) {
        setNotifMsg('Notification preferences saved!')
        setTimeout(() => setNotifMsg(''), 3000)
      } else {
        setNotifMsg(data.error || 'Failed to save preferences')
      }
    } catch {
      setNotifMsg('Network error')
    }
    setNotifSaving(false)
  }

  // Portfolio handlers
  const fetchPortfolio = async () => {
    if (!authProfile) return
    setPortfolioLoading(true)
    try {
      const [catRes, itemsRes] = await Promise.all([
        fetch('/api/portfolio/categories'),
        fetch(`/api/portfolio?user_id=${authProfile.id}`),
      ])
      const catData = await catRes.json()
      const itemsData = await itemsRes.json()
      if (catData.categories) setPortfolioCategories(catData.categories)
      if (itemsData.portfolio) {
        const allItems = itemsData.portfolio.flatMap((cat: { items: unknown[] }) => cat.items || [])
        setPortfolioItems(allItems)
      }
    } catch {}
    setPortfolioLoading(false)
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    setPortfolioMsg('')
    try {
      const res = await fetch('/api/portfolio/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setPortfolioCategories(prev => [...prev, data.category])
        setNewCategoryName('')
      } else {
        setPortfolioMsg(data.error || 'Failed to create category')
      }
    } catch { setPortfolioMsg('Network error') }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Items will become uncategorized.')) return
    try {
      const res = await fetch(`/api/portfolio/categories?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setPortfolioCategories(prev => prev.filter(c => c.id !== id))
        setPortfolioItems(prev => prev.map(item => item.category_id === id ? { ...item, category_id: null } : item))
      }
    } catch {}
  }

  const handleAddItem = async () => {
    if (!newItem.title.trim()) { setPortfolioMsg('Title is required'); return }
    setPortfolioMsg('')
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newItem.title.trim(),
          description: newItem.description.trim() || null,
          client_name: newItem.client_name.trim() || null,
          project_url: newItem.project_url.trim() || null,
          category_id: newItem.category_id || null,
          tags: newItem.tags ? newItem.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setPortfolioItems(prev => [...prev, data.item])
        setNewItem({ title: '', description: '', client_name: '', project_url: '', category_id: '', tags: '' })
        setShowAddItem(false)
        setPortfolioMsg('Project added! Now upload images.')
        setTimeout(() => setPortfolioMsg(''), 3000)
      } else {
        setPortfolioMsg(data.error || 'Failed to add project')
      }
    } catch { setPortfolioMsg('Network error') }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Delete this project and all its images?')) return
    try {
      const res = await fetch(`/api/portfolio/${id}`, { method: 'DELETE' })
      if (res.ok) setPortfolioItems(prev => prev.filter(item => item.id !== id))
    } catch {}
  }

  const handleUploadImages = async (itemId: string, files: FileList) => {
    setUploadingImages(itemId)
    setPortfolioMsg('')
    const formData = new FormData()
    Array.from(files).forEach(f => formData.append('images', f))

    try {
      const res = await fetch(`/api/portfolio/${itemId}/images`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok && data.images) {
        setPortfolioItems(prev => prev.map(item =>
          item.id === itemId
            ? { ...item, images: [...(item.images || []), ...data.images.map((img: { id: string; url: string; alt_text: string | null }) => ({ ...img, is_cover: false }))] }
            : item
        ))
        setPortfolioMsg(`${data.count} image(s) uploaded!`)
        setTimeout(() => setPortfolioMsg(''), 3000)
      } else {
        setPortfolioMsg(data.error || 'Upload failed')
      }
    } catch { setPortfolioMsg('Upload failed') }
    setUploadingImages(null)
  }

  const handleDeleteImage = async (itemId: string, imageId: string) => {
    try {
      const res = await fetch(`/api/portfolio/${itemId}/images?image_id=${imageId}`, { method: 'DELETE' })
      if (res.ok) {
        setPortfolioItems(prev => prev.map(item =>
          item.id === itemId
            ? { ...item, images: (item.images || []).filter(img => img.id !== imageId) }
            : item
        ))
      }
    } catch {}
  }

  // Fetch portfolio on load (needed for completeness check) and when tab changes to portfolio
  useEffect(() => {
    if (authProfile && portfolioItems.length === 0 && portfolioCategories.length === 0) {
      fetchPortfolio()
    }
  }, [authProfile])

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true)
    setSaveError('')
    const formData = new FormData()
    formData.append('avatar', file)
    try {
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok && data.avatar_url) {
        // Clear sessionStorage cache so refreshProfile gets fresh data
        try { sessionStorage.removeItem('hk_profile') } catch {}
        await refreshProfile()
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        console.error('Avatar upload failed:', data)
        setSaveError(data.error || 'Failed to upload avatar')
      }
    } catch (err) {
      console.error('Avatar upload error:', err)
      setSaveError('Failed to upload avatar')
    }
    setUploadingAvatar(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    
    const updateData = {
      full_name: profileForm.fullName.trim(),
      phone: profileForm.phone.trim() || null,
      county: profileForm.county.trim() || null,
      title: profileForm.title.trim() || null,
      bio: profileForm.bio.trim() || null,
      hourly_rate: profileForm.hourlyRate,
      years_experience: profileForm.yearsExperience,
      availability: profileForm.availability,
      available_from: profileForm.availability === 'available_from' ? profileForm.availableFrom : null,
      skills: profileForm.skills,
      languages: profileForm.languages,
      education: profileForm.education,
      certifications: profileForm.certifications,
    }
    
    console.log('[Settings] Sending update:', updateData)
    
    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (saving) {
        setSaving(false)
        setSaveError('Request timed out. Please try again.')
      }
    }, 10000) // 10 second timeout
    
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })
      clearTimeout(timeout)
      const data = await res.json()
      if (res.ok) {
        setSaved(true)
        // Refresh profile in background without blocking
        refreshProfile().catch(console.error)
        setTimeout(() => setSaved(false), 3000)
      } else {
        // Handle validation errors
        if (data.details && typeof data.details === 'object') {
          const errorMessages = Object.entries(data.details)
            .map(([field, message]) => `${message}`)
            .join(', ')
          setSaveError(errorMessages)
        } else {
          setSaveError(data.error || 'Failed to save profile')
        }
      }
    } catch (err) {
      clearTimeout(timeout)
      setSaveError('Network error. Please try again.')
    }
    setSaving(false)
  }

  const [subscription, setSubscription] = useState<{ plan: string; status: string; expires_at?: string; auto_renew?: boolean } | null>(null)
  const [lifecycle, setLifecycle] = useState<{ status: string; expires_at?: string; days_until_expiry?: number; auto_renew?: boolean; is_active?: boolean; in_grace_period?: boolean } | null>(null)
  const [subLoading, setSubLoading] = useState(false)
  const [subMsg, setSubMsg] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [promoValidating, setPromoValidating] = useState(false)
  const [promoResult, setPromoResult] = useState<{ valid: boolean; message: string; discount?: string } | null>(null)

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/subscription')
      const data = await res.json()
      if (data.subscription) setSubscription(data.subscription)
      if (data.lifecycle) setLifecycle(data.lifecycle)
    } catch {}
  }

  useEffect(() => {
    if (!authProfile) return
    fetchSubscription()
  }, [authProfile])

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return
    setPromoValidating(true)
    setPromoResult(null)
    try {
      const res = await fetch(`/api/subscription/validate-promo?code=${encodeURIComponent(promoCode.trim())}`)
      const data = await res.json()
      if (res.ok && data.valid) {
        setPromoResult({ valid: true, message: data.message, discount: data.discount })
      } else {
        setPromoResult({ valid: false, message: data.error || 'Invalid promo code' })
      }
    } catch {
      setPromoResult({ valid: false, message: 'Failed to validate code' })
    }
    setPromoValidating(false)
  }

  const handleSubscribe = async (plan: string) => {
    setSubLoading(true)
    setSubMsg('')
    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, promo_code: promoCode.trim() || undefined }),
      })
      const data = await res.json()
      if (res.ok) {
        setSubMsg(data.message || 'Subscription updated!')
        setPromoCode('')
        setPromoResult(null)
        const subRes = await fetch('/api/subscription')
        const subData = await subRes.json()
        if (subData.subscription) setSubscription(subData.subscription)
      } else {
        setSubMsg(data.error || 'Failed to subscribe')
      }
    } catch {
      setSubMsg('Network error')
    }
    setSubLoading(false)
  }

  const handleCancelSub = async () => {
    if (!confirm('Are you sure you want to cancel your Pro subscription? You will keep your Pro benefits until the end of your current billing period.')) return
    setSubLoading(true)
    setSubMsg('')
    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })
      const data = await res.json()
      if (res.ok) {
        setSubMsg(data.message || 'Subscription cancelled')
        await fetchSubscription()
      } else {
        setSubMsg(data.error || 'Failed to cancel')
      }
    } catch {
      setSubMsg('Network error')
    }
    setSubLoading(false)
  }

  const handleToggleAutoRenew = async () => {
    setSubLoading(true)
    setSubMsg('')
    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_auto_renew' }),
      })
      const data = await res.json()
      if (res.ok) {
        setSubMsg(data.message || 'Auto-renewal updated')
        await fetchSubscription()
      } else {
        setSubMsg(data.error || 'Failed to update')
      }
    } catch {
      setSubMsg('Network error')
    }
    setSubLoading(false)
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg('Passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters')
      return
    }

    setPasswordChanging(true)
    setPasswordMsg('')
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setPasswordMsg('Password updated successfully')
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setTimeout(() => setPasswordMsg(''), 3000)
      } else {
        setPasswordMsg(data.error || 'Failed to update password')
      }
    } catch (err) {
      setPasswordMsg('Network error. Please try again.')
    }
    setPasswordChanging(false)
  }

  const isPro = subscription?.plan === 'pro' && (subscription?.status === 'active' || (subscription?.status === 'cancelled' && lifecycle?.is_active))

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'portfolio', label: 'Portfolio', icon: FolderOpen },
    { id: 'subscription', label: isPro ? 'Pro Plan' : 'Upgrade', icon: Crown },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'verification', label: 'Verification', icon: Shield },
  ]

  const initials = (authProfile?.full_name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
  const hustleScore = authProfile?.hustle_score ?? 0

  // Profile completeness calculation — uses form state so it reflects live edits
  const completenessChecks = [
    { label: 'Full name', done: !!profileForm.fullName },
    { label: 'Professional title', done: !!profileForm.title },
    { label: 'Bio / summary', done: !!profileForm.bio && profileForm.bio.length > 30 },
    { label: 'Profile photo', done: !!authProfile?.avatar_url },
    { label: 'Phone number', done: !!profileForm.phone },
    { label: 'County', done: !!profileForm.county },
    { label: 'Skills (3+)', done: profileForm.skills.length >= 3 },
    { label: 'Hourly rate', done: profileForm.hourlyRate > 0 },
    { label: 'Education', done: profileForm.education.length > 0 },
    { label: 'Portfolio project', done: portfolioItems.length > 0 },
  ]
  const completedCount = completenessChecks.filter(c => c.done).length
  const completenessPercent = Math.round((completedCount / completenessChecks.length) * 100)

  return (
    <div className="p-3 sm:p-4 lg:p-6 xl:p-8 pb-24 lg:pb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          {authProfile?.role === 'Freelancer' && authProfile?.id && (
            <a href={`/talent/${authProfile.id}`} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1.5 transition-colors">
              <ExternalLink className="w-4 h-4" /> View Public Profile
            </a>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:-mx-0 sm:px-0">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Completeness — always visible on profile tab */}
        {activeTab === 'profile' && (
          <div className={`rounded-2xl border p-5 mb-6 ${completenessPercent >= 100 ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  {completenessPercent >= 100 ? '🎉 Profile Complete!' : 'Profile Strength'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {completenessPercent >= 100
                    ? 'Great job! Your profile is fully optimized.'
                    : completenessPercent >= 80
                    ? 'Almost there! Just a few more items.'
                    : 'Complete your profile to attract more clients'}
                </p>
              </div>
              <span className={`text-lg font-bold ${completenessPercent >= 80 ? 'text-green-600' : completenessPercent >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{completenessPercent}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full mb-3">
              <div className={`h-2 rounded-full transition-all duration-500 ${completenessPercent >= 80 ? 'bg-green-500' : completenessPercent >= 50 ? 'bg-amber-500' : 'bg-red-400'}`} style={{ width: `${completenessPercent}%` }}></div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {completenessChecks.map(check => (
                <span key={check.label} className={`text-[11px] flex items-center gap-1 ${check.done ? 'text-green-600' : 'text-gray-400'}`}>
                  {check.done ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-gray-300 inline-block" />}
                  {check.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {saved && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-5 h-5" /> Settings saved successfully!
          </div>
        )}

        {saveError && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm">
            <Shield className="w-5 h-5" /> {saveError}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Section 1: Basic Info */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-5 h-5 text-green-600" />
                <h2 className="font-semibold text-gray-900">Basic Information</h2>
              </div>

              {/* Hidden avatar file input */}
              <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleAvatarUpload(e.target.files[0]); e.target.value = '' }} />

              <div className="flex items-center gap-4">
                <div className="relative">
                  {authProfile?.avatar_url ? (
                    <img src={`${authProfile.avatar_url}?t=${Date.now()}`} alt={profileForm.fullName} className="w-20 h-20 rounded-2xl object-cover shadow-md" />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-md">{initials}</div>
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center text-white border-2 border-white transition-colors disabled:opacity-50"
                    title="Change profile photo"
                  >
                    {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{profileForm.fullName || 'Your Name'}</h3>
                  <p className="text-sm text-gray-500">{profileForm.title || authProfile?.role}</p>
                  {isPro && <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold mt-1"><Crown className="w-3 h-3" /> PRO</span>}
                  <p className="text-[10px] text-gray-400 mt-1">Click camera icon — JPEG, PNG, or WebP — max 2MB</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                  <input type="text" value={profileForm.fullName} onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})} placeholder="John Doe" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                  <input type="email" value={profileForm.email} disabled className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-400 text-sm cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">M-Pesa Phone</label>
                  <input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})} placeholder="0712345678" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">County</label>
                  <input type="text" value={profileForm.county} onChange={(e) => setProfileForm({...profileForm, county: e.target.value})} placeholder="Nairobi" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm" />
                </div>
              </div>
            </div>

            {/* Section 2: Professional Details */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="w-5 h-5 text-green-600" />
                <h2 className="font-semibold text-gray-900">Professional Details</h2>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Professional Title</label>
                <input type="text" value={profileForm.title} onChange={(e) => setProfileForm({...profileForm, title: e.target.value})} placeholder="e.g. Full Stack Developer, Graphic Designer, Content Writer" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Professional Summary <span className="text-gray-400">({profileForm.bio.length}/5000)</span></label>
                <textarea value={profileForm.bio} onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})} rows={6} maxLength={5000} placeholder="Write a compelling summary of your expertise, experience, and what makes you stand out. Mention specific industries you've worked in, notable projects, and your approach to work. Clients read this to decide whether to hire you." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm resize-none" />
                <p className="text-[11px] text-gray-400 mt-1">Tip: Mention your years of experience, industries served, tools you use, and your unique value proposition.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Hourly Rate (KES)</label>
                  <input type="number" value={profileForm.hourlyRate} onChange={(e) => setProfileForm({...profileForm, hourlyRate: parseInt(e.target.value) || 0})} placeholder="1500" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Years of Experience</label>
                  <input type="number" value={profileForm.yearsExperience} onChange={(e) => setProfileForm({...profileForm, yearsExperience: parseInt(e.target.value) || 0})} min={0} max={50} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm" />
                </div>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Availability</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'available', label: 'Available Now', color: 'bg-green-50 border-green-200 text-green-700' },
                    { value: 'busy', label: 'Busy', color: 'bg-amber-50 border-amber-200 text-amber-700' },
                    { value: 'unavailable', label: 'Unavailable', color: 'bg-red-50 border-red-200 text-red-700' },
                    { value: 'available_from', label: 'Available From...', color: 'bg-blue-50 border-blue-200 text-blue-700' },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => setProfileForm({...profileForm, availability: opt.value})} className={`flex-grow sm:flex-grow-0 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium border transition-colors ${profileForm.availability === opt.value ? opt.color + ' ring-2 ring-offset-1 ring-current' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {profileForm.availability === 'available_from' && (
                  <input type="date" value={profileForm.availableFrom} onChange={(e) => setProfileForm({...profileForm, availableFrom: e.target.value})} className="mt-2 w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm" />
                )}
              </div>
            </div>

            {/* Section 3: Skills */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Tag className="w-5 h-5 text-green-600" />
                <h2 className="font-semibold text-gray-900">Skills</h2>
                <span className="text-xs text-gray-400 ml-auto">{profileForm.skills.length}/20</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {profileForm.skills.map((skill, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-green-200">
                    {skill}
                    <button onClick={() => setProfileForm({...profileForm, skills: profileForm.skills.filter((_, idx) => idx !== i)})} className="ml-0.5 hover:text-red-600 transition-colors"><X className="w-3 h-3" /></button>
                  </span>
                ))}
                {profileForm.skills.length === 0 && <p className="text-xs text-gray-400">No skills added yet. Add skills to help clients find you.</p>}
              </div>

              <div className="flex gap-2">
                <input type="text" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Add a skill..." className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm" />
                <button onClick={() => {
                  if (newSkill.trim() && profileForm.skills.length < 20) {
                    setProfileForm({...profileForm, skills: [...profileForm.skills, newSkill.trim()]});
                    setNewSkill('');
                  }
                }} className="px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 disabled:opacity-50 whitespace-nowrap" disabled={profileForm.skills.length >= 20}>
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>

            {/* Section 4: Languages */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-5 h-5 text-green-600" />
                <h2 className="font-semibold text-gray-900">Languages</h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {profileForm.languages.map((lang, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-200">
                    {lang}
                    <button onClick={() => setProfileForm({...profileForm, languages: profileForm.languages.filter((_, idx) => idx !== i)})} className="ml-0.5 hover:text-red-600"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input type="text" value={newLanguage} onChange={(e) => setNewLanguage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && newLanguage.trim() && profileForm.languages.length < 10) { setProfileForm({...profileForm, languages: [...profileForm.languages, newLanguage.trim()]}); setNewLanguage('') } }} placeholder="e.g. Swahili, French" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm" />
                <button onClick={() => { if (newLanguage.trim() && profileForm.languages.length < 10) { setProfileForm({...profileForm, languages: [...profileForm.languages, newLanguage.trim()]}); setNewLanguage('') } }} className="px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100"><Plus className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Section 5: Education */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-green-600" />
                  <h2 className="font-semibold text-gray-900">Education</h2>
                </div>
                <button onClick={() => setProfileForm({...profileForm, education: [...profileForm.education, { school: '', degree: '', field: '', year: '' }]})} className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
              </div>

              {profileForm.education.length === 0 && <p className="text-xs text-gray-400">Add your education to build trust with clients.</p>}

              {profileForm.education.map((edu, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50/50">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Education #{i + 1}</span>
                    <button onClick={() => setProfileForm({...profileForm, education: profileForm.education.filter((_, idx) => idx !== i)})} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <input type="text" value={edu.school} onChange={(e) => { const updated = [...profileForm.education]; updated[i] = {...updated[i], school: e.target.value}; setProfileForm({...profileForm, education: updated}) }} placeholder="School / University" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm bg-white" />
                    <input type="text" value={edu.degree} onChange={(e) => { const updated = [...profileForm.education]; updated[i] = {...updated[i], degree: e.target.value}; setProfileForm({...profileForm, education: updated}) }} placeholder="Degree (e.g. BSc, Diploma)" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm bg-white" />
                    <input type="text" value={edu.field} onChange={(e) => { const updated = [...profileForm.education]; updated[i] = {...updated[i], field: e.target.value}; setProfileForm({...profileForm, education: updated}) }} placeholder="Field of Study" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm bg-white" />
                    <input type="text" value={edu.year} onChange={(e) => { const updated = [...profileForm.education]; updated[i] = {...updated[i], year: e.target.value}; setProfileForm({...profileForm, education: updated}) }} placeholder="Year (e.g. 2020)" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm bg-white" />
                  </div>
                </div>
              ))}
            </div>

            {/* Section 6: Certifications */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-600" />
                  <h2 className="font-semibold text-gray-900">Certifications & Licenses</h2>
                </div>
                <button onClick={() => setProfileForm({...profileForm, certifications: [...profileForm.certifications, { name: '', issuer: '', year: '', url: '' }]})} className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
              </div>

              {profileForm.certifications.length === 0 && <p className="text-xs text-gray-400">Add certifications to stand out from other freelancers.</p>}

              {profileForm.certifications.map((cert, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50/50">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Certification #{i + 1}</span>
                    <button onClick={() => setProfileForm({...profileForm, certifications: profileForm.certifications.filter((_, idx) => idx !== i)})} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <input type="text" value={cert.name} onChange={(e) => { const updated = [...profileForm.certifications]; updated[i] = {...updated[i], name: e.target.value}; setProfileForm({...profileForm, certifications: updated}) }} placeholder="Certificate Name" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm bg-white" />
                    <input type="text" value={cert.issuer} onChange={(e) => { const updated = [...profileForm.certifications]; updated[i] = {...updated[i], issuer: e.target.value}; setProfileForm({...profileForm, certifications: updated}) }} placeholder="Issuing Organization" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm bg-white" />
                    <input type="text" value={cert.year} onChange={(e) => { const updated = [...profileForm.certifications]; updated[i] = {...updated[i], year: e.target.value}; setProfileForm({...profileForm, certifications: updated}) }} placeholder="Year" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm bg-white" />
                    <input type="url" value={cert.url} onChange={(e) => { const updated = [...profileForm.certifications]; updated[i] = {...updated[i], url: e.target.value}; setProfileForm({...profileForm, certifications: updated}) }} placeholder="Verification URL (optional)" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm bg-white" />
                  </div>
                </div>
              ))}
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 shadow-sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Profile
              </button>
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            {portfolioMsg && (
              <div className={`p-3 rounded-xl text-sm ${portfolioMsg.includes('added') || portfolioMsg.includes('uploaded') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {portfolioMsg}
              </div>
            )}

            {/* Hidden file input for image uploads */}
            <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => { if (e.target.files && uploadingImages) handleUploadImages(uploadingImages, e.target.files); e.target.value = '' }} />

            {/* Categories Management */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <FolderOpen className="w-5 h-5 text-green-600" />
                <h2 className="font-semibold text-gray-900">Portfolio Categories</h2>
              </div>
              <p className="text-xs text-gray-400">Create categories to organize your work samples (e.g. &quot;Logo Design&quot;, &quot;Web Development&quot;, &quot;Interior Design&quot;).</p>

              <div className="flex flex-wrap gap-2">
                {portfolioCategories.map(cat => (
                  <div key={cat.id} className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-green-200">
                    <FolderOpen className="w-3 h-3" />
                    {cat.name}
                    <button onClick={() => handleDeleteCategory(cat.id)} className="ml-0.5 hover:text-red-600"><X className="w-3 h-3" /></button>
                  </div>
                ))}
                {portfolioCategories.length === 0 && !portfolioLoading && <p className="text-xs text-gray-400">No categories yet.</p>}
                {portfolioLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
              </div>

              <div className="flex gap-2">
                <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory() }} placeholder="New category name" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm" />
                <button onClick={handleAddCategory} className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
              </div>
            </div>

            {/* Add Project Button */}
            {!showAddItem && portfolioCategories.length > 0 && (
              <div className="flex justify-end">
                <button onClick={() => setShowAddItem(true)} className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1.5 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-xl transition-colors">
                  <Plus className="w-4 h-4" /> Add New Project
                </button>
              </div>
            )}

            {/* Add Project Form (global) */}
            {showAddItem && (
              <div className="bg-white rounded-2xl border border-green-200 p-6 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm">Add New Project</h3>
                  <button onClick={() => { setShowAddItem(false); setNewItem({ title: '', description: '', client_name: '', project_url: '', category_id: '', tags: '' }) }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                </div>
                <input type="text" value={newItem.title} onChange={(e) => setNewItem({...newItem, title: e.target.value})} placeholder="Project Title *" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm bg-white" />
                <textarea value={newItem.description} onChange={(e) => setNewItem({...newItem, description: e.target.value})} rows={3} placeholder="Describe what you did, the challenge, and the outcome..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm bg-white resize-none" />
                <div className="grid md:grid-cols-2 gap-3">
                  <input type="text" value={newItem.client_name} onChange={(e) => setNewItem({...newItem, client_name: e.target.value})} placeholder="Client / Business Name" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm bg-white" />
                  <input type="url" value={newItem.project_url} onChange={(e) => setNewItem({...newItem, project_url: e.target.value})} placeholder="Project URL (optional)" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm bg-white" />
                  <select value={newItem.category_id} onChange={(e) => setNewItem({...newItem, category_id: e.target.value})} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm bg-white">
                    <option value="">Select Category *</option>
                    {portfolioCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <input type="text" value={newItem.tags} onChange={(e) => setNewItem({...newItem, tags: e.target.value})} placeholder="Tags (comma-separated)" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm bg-white" />
                </div>
                <button onClick={handleAddItem} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Project
                </button>
              </div>
            )}

            {/* Projects grouped by category */}
            {portfolioCategories.map(cat => {
              const catItems = portfolioItems.filter(item => item.category_id === cat.id)
              return (
                <div key={cat.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  {/* Category Header */}
                  <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-green-600" />
                      <h2 className="font-semibold text-gray-900 text-sm">{cat.name}</h2>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{catItems.length} project{catItems.length !== 1 ? 's' : ''}</span>
                    </div>
                    <button onClick={() => { if (!showAddItem) { setNewItem({ title: '', description: '', client_name: '', project_url: '', category_id: cat.id, tags: '' }) } else { setNewItem(prev => ({ ...prev, category_id: cat.id })) }; setShowAddItem(true) }} className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Add Project Here
                    </button>
                  </div>

                  {catItems.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <ImageIcon className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">No projects in this category yet.</p>
                      <button onClick={() => { if (!showAddItem) { setNewItem({ title: '', description: '', client_name: '', project_url: '', category_id: cat.id, tags: '' }) } else { setNewItem(prev => ({ ...prev, category_id: cat.id })) }; setShowAddItem(true) }} className="text-xs text-green-600 hover:text-green-700 font-medium mt-2 inline-flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add your first project
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {catItems.map(item => (
                        <div key={item.id}>
                          {/* Project Images */}
                          {item.images && item.images.length > 0 ? (
                            <div className="flex gap-1.5 p-3 bg-gray-50/50 overflow-x-auto">
                              {item.images.map(img => (
                                <div key={img.id} className="relative group shrink-0">
                                  <img src={img.url} alt={img.alt_text || item.title} className="w-20 h-20 object-cover rounded-lg" />
                                  <button onClick={() => handleDeleteImage(item.id, img.id)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" title="Delete image">
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              {item.images.length < 10 && (
                                <button onClick={() => { setUploadingImages(item.id); fileInputRef.current?.click() }} disabled={uploadingImages === item.id} className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-green-400 hover:text-green-500 transition-colors shrink-0">
                                  {uploadingImages === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" /><span className="text-[9px] mt-0.5">Add</span></>}
                                </button>
                              )}
                            </div>
                          ) : (
                            <button onClick={() => { setUploadingImages(item.id); fileInputRef.current?.click() }} disabled={uploadingImages === item.id} className="w-full py-4 bg-gray-50/50 flex flex-col items-center justify-center text-gray-400 hover:bg-green-50 hover:text-green-500 transition-colors">
                              {uploadingImages === item.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-5 h-5" /><span className="text-[10px] mt-1">Upload Images</span></>}
                            </button>
                          )}

                          {/* Project Info */}
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                                {item.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>}
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                  {item.client_name && (
                                    <span className="text-[11px] text-gray-400 flex items-center gap-1"><Briefcase className="w-3 h-3" />{item.client_name}</span>
                                  )}
                                  {item.project_url && (
                                    <a href={item.project_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-500 hover:text-blue-600 flex items-center gap-1"><ExternalLink className="w-3 h-3" />View Project</a>
                                  )}
                                  {item.tags && item.tags.length > 0 && item.tags.map(tag => (
                                    <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{tag}</span>
                                  ))}
                                </div>
                              </div>
                              <button onClick={() => handleDeleteItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1" title="Delete project"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Uncategorized Projects */}
            {(() => {
              const uncategorized = portfolioItems.filter(item => !item.category_id || !portfolioCategories.find(c => c.id === item.category_id))
              if (uncategorized.length === 0) return null
              return (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-amber-50/50">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-amber-600" />
                      <h2 className="font-semibold text-gray-900 text-sm">Uncategorized</h2>
                      <span className="text-[10px] text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">{uncategorized.length} project{uncategorized.length !== 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-[10px] text-amber-600">Create a category above and assign these projects</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {uncategorized.map(item => (
                      <div key={item.id}>
                        {/* Project Images */}
                        {item.images && item.images.length > 0 ? (
                          <div className="flex gap-1.5 p-3 bg-gray-50/50 overflow-x-auto">
                            {item.images.map(img => (
                              <div key={img.id} className="relative group shrink-0">
                                <img src={img.url} alt={img.alt_text || item.title} className="w-20 h-20 object-cover rounded-lg" />
                                <button onClick={() => handleDeleteImage(item.id, img.id)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" title="Delete image">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            {item.images.length < 10 && (
                              <button onClick={() => { setUploadingImages(item.id); fileInputRef.current?.click() }} disabled={uploadingImages === item.id} className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-green-400 hover:text-green-500 transition-colors shrink-0">
                                {uploadingImages === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" /><span className="text-[9px] mt-0.5">Add</span></>}
                              </button>
                            )}
                          </div>
                        ) : (
                          <button onClick={() => { setUploadingImages(item.id); fileInputRef.current?.click() }} disabled={uploadingImages === item.id} className="w-full py-4 bg-gray-50/50 flex flex-col items-center justify-center text-gray-400 hover:bg-green-50 hover:text-green-500 transition-colors">
                            {uploadingImages === item.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-5 h-5" /><span className="text-[10px] mt-1">Upload Images</span></>}
                          </button>
                        )}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                              {item.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>}
                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                {item.client_name && (
                                  <span className="text-[11px] text-gray-400 flex items-center gap-1"><Briefcase className="w-3 h-3" />{item.client_name}</span>
                                )}
                                {item.project_url && (
                                  <a href={item.project_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-500 hover:text-blue-600 flex items-center gap-1"><ExternalLink className="w-3 h-3" />View Project</a>
                                )}
                                {item.tags && item.tags.length > 0 && item.tags.map(tag => (
                                  <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{tag}</span>
                                ))}
                              </div>
                            </div>
                            <button onClick={() => handleDeleteItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1" title="Delete project"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Empty state when no categories exist */}
            {portfolioCategories.length === 0 && portfolioItems.length === 0 && !portfolioLoading && !showAddItem && (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <ImageIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">No portfolio yet</p>
                <p className="text-xs text-gray-400 mt-1">Start by creating a category above, then add projects with images.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'subscription' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
            {subMsg && (
              <div className={`p-3 rounded-xl text-sm ${subMsg.includes('success') || subMsg.includes('Successfully') || subMsg.includes('updated') ? 'bg-green-50 text-green-700' : subMsg.includes('cancel') ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                {subMsg}
              </div>
            )}

            {isPro ? (
              <>
                {/* Status Banner */}
                <div className={`flex items-start gap-4 p-5 rounded-xl border ${
                  subscription?.status === 'cancelled'
                    ? 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200'
                    : lifecycle?.in_grace_period
                    ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
                    : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
                }`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    subscription?.status === 'cancelled' ? 'bg-orange-100' : lifecycle?.in_grace_period ? 'bg-red-100' : 'bg-amber-100'
                  }`}>
                    <Crown className={`w-6 h-6 ${subscription?.status === 'cancelled' ? 'text-orange-600' : lifecycle?.in_grace_period ? 'text-red-600' : 'text-amber-600'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-lg">
                      {subscription?.status === 'cancelled'
                        ? 'Pro Plan — Cancelled'
                        : lifecycle?.in_grace_period
                        ? 'Pro Plan — Grace Period'
                        : 'Pro Plan Active'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {subscription?.status === 'cancelled'
                        ? `Your benefits continue until ${subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }) : 'billing period ends'}. Re-subscribe anytime.`
                        : lifecycle?.in_grace_period
                        ? 'Your subscription has expired. Top up your wallet to auto-renew and keep your Pro benefits.'
                        : 'You\'re enjoying reduced 4% service fees, priority matching, and more.'}
                    </p>
                    {subscription?.expires_at && subscription?.status === 'active' && !lifecycle?.in_grace_period && (
                      <p className="text-xs text-gray-500 mt-1">
                        {lifecycle?.auto_renew ? 'Auto-renews' : 'Expires'}: {new Date(subscription.expires_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {lifecycle?.days_until_expiry !== undefined && lifecycle.days_until_expiry > 0 && (
                          <span className={`ml-1 ${lifecycle.days_until_expiry <= 3 ? 'text-amber-600 font-medium' : ''}`}>
                            ({lifecycle.days_until_expiry} day{lifecycle.days_until_expiry !== 1 ? 's' : ''} left)
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Grace period warning */}
                {lifecycle?.in_grace_period && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                    <p className="font-semibold">⚠ Auto-renewal failed — insufficient wallet balance</p>
                    <p className="mt-1">You have a 3-day grace period to top up your wallet. After that, you&apos;ll be downgraded to the Free plan (6% fees, 10 proposals/day).</p>
                    <a href="/dashboard/wallet" className="inline-block mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Top Up Wallet Now
                    </a>
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Your Pro Benefits</h3>
                  {[
                    'Reduced 4% service fee (vs 6%)',
                    'Priority job matching',
                    'Featured profile badge',
                    'Advanced analytics',
                    'Priority support',
                    'Up to 20 proposals per day',
                  ].map(benefit => (
                    <div key={benefit} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      {benefit}
                    </div>
                  ))}
                </div>

                {/* Auto-renew toggle + Cancel */}
                <hr className="border-gray-200" />
                <div className="space-y-4">
                  {subscription?.status === 'active' && (
                    <label className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Auto-renewal</p>
                        <p className="text-xs text-gray-500">
                          {lifecycle?.auto_renew
                            ? 'KES 500 will be auto-charged from your wallet on renewal date'
                            : 'Your subscription will expire at the end of the billing period'}
                        </p>
                      </div>
                      <button
                        onClick={handleToggleAutoRenew}
                        disabled={subLoading}
                        className={`relative w-11 h-6 rounded-full transition-colors ${lifecycle?.auto_renew ? 'bg-green-600' : 'bg-gray-200'}`}
                      >
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${lifecycle?.auto_renew ? 'translate-x-5' : ''}`} />
                      </button>
                    </label>
                  )}

                  {subscription?.status === 'active' && (
                    <button
                      onClick={handleCancelSub}
                      disabled={subLoading}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Cancel Subscription
                    </button>
                  )}

                  {subscription?.status === 'cancelled' && (
                    <button
                      onClick={() => handleSubscribe('pro')}
                      disabled={subLoading}
                      className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors"
                    >
                      {subLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                      Re-subscribe to Pro
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-2">
                  <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Upgrade to Pro</h3>
                  <p className="text-sm text-gray-500">Unlock premium features and save on every transaction</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Free Plan */}
                  <div className="border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-gray-900">Free</h4>
                      <span className="ml-auto text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Current</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-3">KES 0<span className="text-sm text-gray-500 font-normal">/forever</span></p>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> 6% service fee</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> 10 proposals/day</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Basic features</li>
                    </ul>
                  </div>

                  {/* Pro Plan */}
                  <div className="border-2 border-amber-400 rounded-xl p-5 bg-amber-50/30 relative">
                    <div className="absolute -top-3 right-4 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">RECOMMENDED</div>
                    <div className="flex items-center gap-2 mb-3">
                      <Crown className="w-5 h-5 text-amber-600" />
                      <h4 className="font-semibold text-gray-900">Pro</h4>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-3">KES 500<span className="text-sm text-gray-500 font-normal">/month</span></p>
                    <ul className="space-y-2 text-sm text-gray-600 mb-4">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500" /> 4% service fee (save 33%)</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500" /> 20 proposals/day</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500" /> Featured profile badge</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500" /> Priority job matching</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500" /> Advanced analytics</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500" /> Priority support</li>
                    </ul>
                    <button
                      onClick={() => handleSubscribe('pro')}
                      disabled={subLoading}
                      className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      {subLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                      Upgrade to Pro
                    </button>
                    <p className="text-[10px] text-gray-500 text-center mt-2">Paid from your HustleKE wallet via M-Pesa</p>
                  </div>
                </div>

                {/* Promo Code */}
                <div className="bg-gray-50 rounded-xl p-4 mt-2">
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5"><Tag className="w-4 h-4" /> Have a promo code?</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null) }}
                      placeholder="Enter code e.g. HUSTLEKE50"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-green-500 focus:outline-none uppercase"
                    />
                    <button
                      onClick={handleValidatePromo}
                      disabled={promoValidating || !promoCode.trim()}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      {promoValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                  {promoResult && (
                    <p className={`text-xs mt-2 ${promoResult.valid ? 'text-green-600' : 'text-red-600'}`}>
                      {promoResult.valid ? `✓ ${promoResult.message}` : `✗ ${promoResult.message}`}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
            <h3 className="font-semibold text-gray-900">Change Password</h3>
            {passwordMsg && (
              <div className={`p-3 rounded-xl text-sm ${passwordMsg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {passwordMsg}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input 
                  type="password" 
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  placeholder="Enter current password" 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input 
                  type="password" 
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  placeholder="Enter new password" 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input 
                  type="password" 
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  placeholder="Confirm new password" 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm" 
                />
              </div>
            </div>
            <button 
              onClick={handlePasswordChange}
              disabled={passwordChanging}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors flex items-center gap-2"
            >
              {passwordChanging ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Update Password
            </button>

            <hr className="border-gray-200" />
            <h3 className="font-semibold text-gray-900">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-600">Add an extra layer of security to your account using M-Pesa SMS verification.</p>
            <span className="inline-block border-2 border-gray-300 text-gray-400 px-6 py-2.5 rounded-xl font-semibold cursor-not-allowed" title="2FA coming soon">Enable 2FA</span>

            <hr className="border-gray-200" />
            <h3 className="font-semibold text-red-600">Danger Zone</h3>
            <p className="text-sm text-gray-600">Permanently delete your account and all associated data.</p>
            <span className="inline-block border-2 border-gray-300 text-gray-400 px-6 py-2.5 rounded-xl font-semibold cursor-not-allowed" title="Account deletion coming soon">Delete Account</span>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
            {notifMsg && (
              <div className={`p-3 rounded-xl text-sm ${notifMsg.includes('saved') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {notifMsg}
              </div>
            )}

            {/* Channels */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Notification Channels</h3>
              <div className="space-y-1">
                {[
                  { key: 'email_enabled', label: 'Email Notifications', desc: 'Receive updates via email' },
                  { key: 'sms_enabled', label: 'SMS Notifications', desc: 'Receive SMS alerts to your M-Pesa phone number' },
                  { key: 'push_enabled', label: 'Browser Notifications', desc: 'Browser push notifications when tab is inactive' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={notifications[item.key as keyof typeof notifications] as boolean}
                        onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-checked:bg-green-600 rounded-full transition-colors"></div>
                      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Categories */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Notification Categories</h3>
              <div className="space-y-1">
                {[
                  { key: 'job_alerts', label: 'Job Alerts', desc: 'New matching jobs, work submissions, and completions' },
                  { key: 'message_alerts', label: 'Message Alerts', desc: 'New messages from clients and freelancers' },
                  { key: 'proposal_alerts', label: 'Proposal Alerts', desc: 'New proposals, acceptances, and rejections' },
                  { key: 'subscription_alerts', label: 'Subscription Alerts', desc: 'Renewal reminders, plan changes, and billing' },
                  { key: 'escrow_alerts', label: 'Payment Alerts', desc: 'Escrow releases, refunds, and wallet updates' },
                  { key: 'marketing', label: 'Marketing & Tips', desc: 'Platform updates, promotions, and tips' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={notifications[item.key as keyof typeof notifications] as boolean}
                        onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-checked:bg-green-600 rounded-full transition-colors"></div>
                      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button onClick={handleSaveNotifPrefs} disabled={notifSaving} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors flex items-center gap-2">
              {notifSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Preferences
            </button>
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
            {authProfile?.is_verified ? (
              <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
                <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-800">Identity Verified</p>
                  <p className="text-sm text-green-700">Your identity has been verified.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <Shield className="w-6 h-6 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800">Identity Not Verified</p>
                  <p className="text-sm text-amber-700">Verify your identity to unlock full platform features.</p>
                </div>
              </div>
            )}
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="font-medium text-gray-900 text-sm mb-1">Hustle Score</p>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold text-green-600">{hustleScore}</div>
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-green-600 rounded-full" style={{ width: `${hustleScore}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Verified profiles score higher and get more job invites.</p>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
