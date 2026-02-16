'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { enhanceJobDescription } from '../utils/aiEnhancer'
import { useAuth } from '@/contexts/AuthContext'
import {
  X,
  Sparkles,
  Info,
  MapPin,
  Globe,
  Shield,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  Check,
  Wallet,
  Building2,
} from 'lucide-react'

import type { PostJobInitialData } from './PostJobModalContext'

interface PostJobModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: PostJobInitialData
}

const categories = [
  'Web Development', 'Mobile Apps', 'Design & Creative', 'Writing & Content',
  'Marketing', 'Virtual Assistance', 'Customer Service', 'Data Entry',
  'Accounting & Finance', 'Sales', 'Video & Animation', 'Music & Audio', 'Other'
]

const skillsByCategory: Record<string, string[]> = {
  'Web Development': [
    'React', 'Next.js', 'Node.js', 'Python', 'TypeScript', 'JavaScript',
    'HTML/CSS', 'Vue.js', 'Angular', 'PHP', 'Laravel', 'Django',
    'WordPress', 'Shopify', 'Ruby on Rails', 'MongoDB', 'PostgreSQL',
    'MySQL', 'REST API', 'GraphQL', 'Tailwind CSS', 'Bootstrap',
    'AWS', 'Firebase', 'Docker', 'Git', 'SEO', 'Responsive Design'
  ],
  'Mobile Apps': [
    'React Native', 'Flutter', 'Swift', 'Kotlin', 'Java', 'Dart',
    'iOS Development', 'Android Development', 'Cross-Platform', 'Firebase',
    'Push Notifications', 'App Store Optimization', 'UI/UX Design',
    'API Integration', 'SQLite', 'Realm', 'Google Maps API', 'M-Pesa Integration',
    'In-App Purchases', 'Mobile Testing', 'Expo', 'Xcode', 'Android Studio'
  ],
  'Design & Creative': [
    'UI/UX Design', 'Graphic Design', 'Logo Design', 'Brand Identity',
    'Figma', 'Adobe Photoshop', 'Adobe Illustrator', 'Adobe XD', 'Sketch',
    'Canva', 'Icon Design', 'Packaging Design', 'Print Design', 'Infographics',
    'Poster Design', 'Flyer Design', 'Business Card Design', 'Banner Design',
    'Social Media Graphics', 'Typography', 'Color Theory', 'Wireframing',
    'Prototyping', 'Design Systems', 'Illustration', '3D Design'
  ],
  'Writing & Content': [
    'Content Writing', 'Copywriting', 'Blog Writing', 'Article Writing',
    'SEO Writing', 'Technical Writing', 'Creative Writing', 'Ghostwriting',
    'Proofreading', 'Editing', 'Research', 'Grant Writing', 'Resume Writing',
    'Press Release', 'Script Writing', 'Translation', 'Swahili Translation',
    'Academic Writing', 'Product Descriptions', 'Email Copywriting',
    'Social Media Content', 'Newsletter Writing', 'Proposal Writing'
  ],
  'Marketing': [
    'Digital Marketing', 'Social Media Marketing', 'Facebook Ads', 'Google Ads',
    'TikTok Marketing', 'Instagram Marketing', 'LinkedIn Marketing', 'SEO',
    'SEM', 'Email Marketing', 'Content Marketing', 'Influencer Marketing',
    'Affiliate Marketing', 'Brand Strategy', 'Market Research', 'Analytics',
    'Google Analytics', 'Mailchimp', 'HubSpot', 'Campaign Management',
    'Lead Generation', 'Conversion Optimization', 'WhatsApp Marketing'
  ],
  'Virtual Assistance': [
    'Virtual Assistant', 'Administrative Support', 'Email Management',
    'Calendar Management', 'Data Entry', 'Research', 'Travel Planning',
    'Customer Service', 'Social Media Management', 'File Organization',
    'Spreadsheet Management', 'Presentation Creation', 'Meeting Coordination',
    'Document Preparation', 'Phone Support', 'CRM Management',
    'Bookkeeping', 'Invoice Processing', 'Project Coordination'
  ],
  'Customer Service': [
    'Customer Support', 'Live Chat Support', 'Phone Support', 'Email Support',
    'Technical Support', 'Help Desk', 'CRM', 'Zendesk', 'Freshdesk',
    'Intercom', 'Complaint Handling', 'Order Processing', 'Ticketing Systems',
    'Knowledge Base', 'Customer Retention', 'Onboarding', 'Conflict Resolution',
    'Multilingual Support', 'Swahili', 'English'
  ],
  'Data Entry': [
    'Data Entry', 'Excel', 'Google Sheets', 'Data Processing', 'Typing',
    'Data Mining', 'Data Cleaning', 'PDF to Excel', 'Web Scraping',
    'Database Management', 'Transcription', 'Form Filling', 'Data Verification',
    'Copy Paste', 'Spreadsheet Management', 'Data Conversion',
    'Record Keeping', 'Data Analysis', 'Microsoft Office', 'Google Workspace'
  ],
  'Accounting & Finance': [
    'Accounting', 'Bookkeeping', 'QuickBooks', 'Xero', 'Financial Analysis',
    'Tax Preparation', 'Payroll', 'Invoicing', 'Budgeting', 'Financial Reporting',
    'Auditing', 'Cost Accounting', 'M-Pesa Reconciliation', 'KRA Compliance',
    'IFRS', 'Excel', 'Financial Modeling', 'Accounts Payable',
    'Accounts Receivable', 'Bank Reconciliation', 'Sage', 'Tally'
  ],
  'Sales': [
    'Sales', 'Lead Generation', 'Cold Calling', 'B2B Sales', 'B2C Sales',
    'Sales Strategy', 'CRM', 'Salesforce', 'HubSpot', 'Pipeline Management',
    'Negotiation', 'Business Development', 'Account Management', 'Telemarketing',
    'Sales Presentations', 'Market Research', 'Prospecting', 'Closing',
    'Relationship Building', 'Sales Reporting', 'Territory Management'
  ],
  'Video & Animation': [
    'Video Editing', 'Adobe Premiere Pro', 'Final Cut Pro', 'DaVinci Resolve',
    'After Effects', 'Motion Graphics', '2D Animation', '3D Animation',
    'Whiteboard Animation', 'Explainer Videos', 'YouTube Editing',
    'Color Grading', 'Sound Design', 'Subtitling', 'Video Production',
    'Drone Videography', 'Corporate Videos', 'Social Media Videos',
    'Thumbnail Design', 'Storyboarding', 'Blender', 'Cinema 4D'
  ],
  'Music & Audio': [
    'Music Production', 'Audio Editing', 'Voice Over', 'Podcast Editing',
    'Sound Design', 'Mixing', 'Mastering', 'Jingle Creation', 'Songwriting',
    'Audio Transcription', 'Audacity', 'Pro Tools', 'Logic Pro', 'FL Studio',
    'Ableton Live', 'Sound Effects', 'Audio Restoration', 'Background Music',
    'Narration', 'IVR Recording'
  ],
  'Other': [
    'Project Management', 'Consulting', 'Business Planning', 'Legal Research',
    'HR Management', 'Recruiting', 'Training', 'Tutoring', 'Language Teaching',
    'Photography', 'Event Planning', 'Supply Chain', 'Logistics',
    'Quality Assurance', 'Testing', 'Agile', 'Scrum', 'Product Management',
    'AI/Machine Learning', 'Data Science', 'Blockchain', 'Cybersecurity'
  ],
}

export default function PostJobModal({ isOpen, onClose, initialData }: PostJobModalProps) {
  const { orgMode, activeOrg } = useAuth()
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [budget, setBudget] = useState(25000)
  const [budgetType, setBudgetType] = useState<'fixed' | 'hourly' | 'milestone'>('fixed')
  const [duration, setDuration] = useState('1-2 weeks')
  const [experienceLevel, setExperienceLevel] = useState<'entry' | 'intermediate' | 'expert'>('intermediate')
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [verifiedOnly, setVerifiedOnly] = useState(true)
  const [requiresSwahili, setRequiresSwahili] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const serviceFee = Math.round(budget * 0.06)
  const total = budget + serviceFee

  // Reset form when modal opens, or pre-fill from initialData
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setTitle(initialData?.title || '')
      setDescription(initialData?.description || '')
      setCategory(initialData?.category || '')
      setSelectedSkills(initialData?.skills || [])
      setBudget(initialData?.budget || initialData?.budgetMax || initialData?.budgetMin || 25000)
      setBudgetType('fixed')
      setDuration('1-2 weeks')
      setExperienceLevel('intermediate')
      setVerifiedOnly(true)
      setRequiresSwahili(false)
      setIsSuccess(false)
      setSubmitError('')
    }
  }, [isOpen, initialData])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, isSubmitting, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const enhanceWithAI = useCallback(() => {
    if (!description) return
    setIsEnhancing(true)
    // Simulate AI processing delay
    setTimeout(() => {
      const enhanced = enhanceJobDescription({
        title,
        description,
        category,
        skills: selectedSkills,
      })
      setDescription(enhanced)
      setIsEnhancing(false)
    }, 1500)
  }, [description, title, category, selectedSkills])

  const toggleSkill = useCallback((skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }, [])

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    setSubmitError('')
    try {
      const paymentTypeMap: Record<string, string> = { fixed: 'Fixed', hourly: 'Hourly', milestone: 'Milestone' }
      const jobPayload: Record<string, unknown> = {
          title,
          description,
          budget_min: budget,
          budget_max: budget,
          payment_type: paymentTypeMap[budgetType] || 'Fixed',
          skills_required: selectedSkills,
          tags: category ? [category] : [],
          requires_verified_only: verifiedOnly,
          requires_swahili: requiresSwahili,
          remote_allowed: true,
        }
      // Tag with org when posting in org mode
      if (orgMode && activeOrg) {
        jobPayload.organization_id = activeOrg.id
      }
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobPayload),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data.error || data.details ? Object.values(data.details || {}).join(', ') : 'Failed to post job')
        setIsSubmitting(false)
        return
      }
      setIsSubmitting(false)
      setIsSuccess(true)
    } catch {
      setSubmitError('Network error. Please try again.')
      setIsSubmitting(false)
    }
  }, [title, description, budget, budgetType, selectedSkills, category, verifiedOnly, requiresSwahili, orgMode, activeOrg])

  const canProceedStep1 = title.length >= 10 && description.length >= 50 && category
  const canProceedStep2 = selectedSkills.length > 0 && budget >= 100

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={!isSubmitting ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">
                {orgMode && activeOrg ? `Post for ${activeOrg.name}` : 'Post a Project'}
              </h2>
              <p className="text-green-100 text-sm flex items-center gap-1.5">
                {orgMode && activeOrg && <Building2 className="w-3 h-3" />}
                {isSuccess ? 'Complete!' : `Step ${step} of 3`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Progress Bar */}
        {!isSuccess && (
          <div className="bg-gray-100 px-6 py-3">
            <div className="flex gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    s < step ? 'bg-green-500' : s === step ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span className={step >= 1 ? 'text-green-600 font-medium' : ''}>Details</span>
              <span className={step >= 2 ? 'text-green-600 font-medium' : ''}>Budget</span>
              <span className={step >= 3 ? 'text-green-600 font-medium' : ''}>Review</span>
            </div>
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {isSuccess ? (
            /* Success State */
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Project Posted!</h3>
              <p className="text-gray-600 mb-6">
                Your project has been successfully posted. You will start receiving proposals from talented freelancers soon.
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
                <p className="text-sm text-gray-600">Budget: KES {budget.toLocaleString()} • {selectedSkills.length} skills required</p>
              </div>
              <button
                onClick={onClose}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          ) : step === 1 ? (
            /* Step 1: Project Details */
            <div className="space-y-5">
              <div>
                <label className="block font-medium text-gray-900 mb-2">
                  Project Title <span className="text-red-500">*</span>
                  <span className="text-gray-400 font-normal text-sm ml-2">({title.length}/100)</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                  placeholder="e.g., Build a responsive e-commerce website"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-900 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setCategory(cat); setSelectedSkills([]) }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        category === cat
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-gray-900">
                    Description <span className="text-red-500">*</span>
                    <span className="text-gray-400 font-normal text-sm ml-2">({description.length} chars)</span>
                  </label>
                  <button
                    onClick={enhanceWithAI}
                    disabled={!description || isEnhancing || description.length < 20}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 disabled:bg-gray-100 text-purple-700 disabled:text-gray-400 rounded-lg text-xs font-medium transition-colors"
                  >
                    {isEnhancing ? (
                      <>
                        <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        AI Enhance
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your project requirements, deliverables, timeline, and any specific skills needed..."
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none resize-none transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 50 characters. Be detailed to attract the right talent.
                </p>
              </div>

              <div>
                <label className="block font-medium text-gray-900 mb-3">
                  Required Skills <span className="text-red-500">*</span>
                  <span className="text-gray-400 font-normal text-sm ml-2">({selectedSkills.length} selected)</span>
                </label>
                {!category ? (
                  <p className="text-sm text-amber-600 bg-amber-50 px-4 py-3 rounded-lg">Please select a category above to see relevant skills.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(skillsByCategory[category] || []).map((skill) => (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          selectedSkills.includes(skill)
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {selectedSkills.includes(skill) ? '✓ ' : '+ '}{skill}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : step === 2 ? (
            /* Step 2: Budget & Timeline */
            <div className="space-y-6">
              <div>
                <label className="block font-medium text-gray-900 mb-3">Budget Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'fixed', label: 'Fixed Price', desc: 'One-time payment' },
                    { key: 'hourly', label: 'Hourly Rate', desc: 'Pay by the hour' },
                    { key: 'milestone', label: 'Milestone', desc: 'Pay in stages' },
                  ].map((type) => (
                    <button
                      key={type.key}
                      onClick={() => setBudgetType(type.key as any)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        budgetType === type.key
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <p className={`font-semibold text-sm ${budgetType === type.key ? 'text-green-700' : 'text-gray-900'}`}>
                        {type.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{type.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-900 mb-3">
                  Budget: <span className="text-green-600 text-xl">KES {budget.toLocaleString()}</span>
                </label>
                <input
                  type="range"
                  min="100"
                  max="500000"
                  step="100"
                  value={budget}
                  onChange={(e) => setBudget(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>KES 100</span>
                  <span>KES 500,000+</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[5000, 10000, 25000, 50000, 100000, 200000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setBudget(amount)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        budget === amount
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      KES {amount.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-900 mb-3">Project Duration</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Less than 1 week', '1-2 weeks', '2-4 weeks', '1-3 months', '3-6 months', '6+ months'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        duration === d
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-900 mb-3">Experience Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'entry', label: 'Entry Level', desc: 'KES 5K-15K' },
                    { key: 'intermediate', label: 'Intermediate', desc: 'KES 15K-50K' },
                    { key: 'expert', label: 'Expert', desc: 'KES 50K+' },
                  ].map((level) => (
                    <button
                      key={level.key}
                      onClick={() => setExperienceLevel(level.key as any)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        experienceLevel === level.key
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <p className={`font-semibold text-sm ${experienceLevel === level.key ? 'text-green-700' : 'text-gray-900'}`}>
                        {level.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{level.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Step 3: Review & Preferences */
            <div className="space-y-5">
              {/* Summary Card */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div>
                  <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Project</span>
                  <h3 className="font-bold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((skill) => (
                    <span key={skill} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                  <div>
                    <span className="text-xs text-gray-500">Budget</span>
                    <p className="font-semibold text-gray-900">KES {budget.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Duration</span>
                    <p className="font-semibold text-gray-900">{duration}</p>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div>
                <label className="block font-medium text-gray-900 mb-3">Talent Preferences</label>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-gray-900">Verified Kenyans Only</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Only freelancers with verified ID and phone number</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={requiresSwahili}
                      onChange={(e) => setRequiresSwahili(e.target.checked)}
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-gray-900">Swahili Speaker Required</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Freelancer must be fluent in Swahili</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <input type="checkbox" className="w-5 h-5 text-green-600 rounded focus:ring-green-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-gray-900">Prefer Nairobi-based</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Prioritize freelancers in Nairobi area</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-gray-900 text-white rounded-xl p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Payment Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Project Budget</span>
                    <span>KES {budget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 flex items-center gap-1">
                      Service Fee (6%)
                      <Info className="w-3 h-3" />
                    </span>
                    <span>KES {serviceFee.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-700 pt-2 mt-2">
                    <div className="flex justify-between font-semibold text-base">
                      <span>Total to Deposit</span>
                      <span className="text-green-400">KES {total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Funds held securely in M-Pesa escrow until project completion
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {submitError && (
          <div className="px-6 py-3 bg-red-50 text-red-700 text-sm border-t border-red-100">
            {submitError}
          </div>
        )}

        {/* Footer - Navigation */}
        {!isSuccess && (
          <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between shrink-0 bg-gray-50">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : onClose()}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors disabled:opacity-50"
            >
              {step > 1 ? (
                <>
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </>
              ) : (
                'Cancel'
              )}
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-xl font-semibold transition-colors"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    Post Project
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
