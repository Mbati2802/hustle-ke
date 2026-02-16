'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { usePageContent } from '@/hooks/usePageContent'
import {
  Mail,
  Send,
  CheckCircle2,
  User,
  MessageSquare,
  ArrowRight,
  Loader2,
  Phone,
  MapPin,
  Clock,
  Shield,
  Wallet,
  FileText,
  AlertTriangle,
  HelpCircle,
  Star,
  Zap,
  ChevronRight,
  ExternalLink,
  Headphones,
  BookOpen,
  Users,
  TrendingUp,
  Heart,
  Globe,
  Crown,
  Sparkles,
} from 'lucide-react'

const defaultContent = {
  hero_title: 'We\'re Here to Help',
  hero_subtitle: 'Real humans. Real answers. Whether you need help with payments, disputes, or just want to say hi — we\'ve got you covered.',
  email: 'support@hustleke.com',
  phone: '+254 700 000 000',
  response_time: '24 hours or less',
  categories: [
    { value: '', label: 'Select a category' },
    { value: 'general', label: 'General Inquiry' },
    { value: 'payment', label: 'Payment Issue' },
    { value: 'account', label: 'Account Help' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'dispute', label: 'Dispute Resolution' },
    { value: 'partnership', label: 'Partnership / Business' },
    { value: 'feedback', label: 'Feedback & Suggestions' },
  ],
}

const QUICK_HELP_ROUTES = [
  {
    icon: Wallet,
    title: 'Payment or Escrow Issue',
    desc: 'Stuck payment, escrow question, or withdrawal problem',
    action: 'Go to Escrow Dashboard',
    href: '/dashboard/escrow',
    color: 'from-green-500 to-emerald-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  {
    icon: AlertTriangle,
    title: 'Report a Dispute',
    desc: 'Disagreement with a client or freelancer on a project',
    action: 'Open Dispute',
    href: '/dashboard/escrow',
    color: 'from-red-500 to-rose-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
  {
    icon: HelpCircle,
    title: 'Quick Answer from AI',
    desc: 'Get instant answers to common questions — no waiting',
    action: 'Ask AI Assistant',
    href: '/faqs',
    color: 'from-purple-500 to-indigo-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  {
    icon: Shield,
    title: 'Account & Security',
    desc: 'Password reset, verification, or account access issues',
    action: 'Go to Settings',
    href: '/dashboard/settings',
    color: 'from-blue-500 to-cyan-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    icon: FileText,
    title: 'Proposals & Jobs',
    desc: 'Questions about posting jobs, writing proposals, or hiring',
    action: 'Browse Jobs',
    href: '/jobs',
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  {
    icon: Crown,
    title: 'Pro Plan & Billing',
    desc: 'Subscription management, upgrades, promo codes, billing',
    action: 'View Pricing',
    href: '/pricing',
    color: 'from-yellow-500 to-amber-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
  },
]

export default function ContactPage() {
  const content = usePageContent('contact', defaultContent)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: '',
    priority: 'normal' as 'low' | 'normal' | 'urgent',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [activeTab, setActiveTab] = useState<'form' | 'quick-help'>('quick-help')
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const nairobiTime = now.toLocaleString('en-US', {
        timeZone: 'Africa/Nairobi',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
      setCurrentTime(nairobiTime)
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  const isBusinessHours = (() => {
    const now = new Date()
    const nairobiHour = parseInt(now.toLocaleString('en-US', { timeZone: 'Africa/Nairobi', hour: 'numeric', hour12: false }))
    const day = parseInt(now.toLocaleString('en-US', { timeZone: 'Africa/Nairobi', weekday: 'short' }).charAt(0))
    return nairobiHour >= 8 && nairobiHour < 18 && day !== 0
  })()

  const [submitError, setSubmitError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setSubmitError(data.error || 'Failed to send message. Please try again.')
        setIsSubmitting(false)
        return
      }

      setIsSubmitted(true)
    } catch {
      setSubmitError('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const categories = content.categories

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-lg w-full text-center">
            <div className="w-24 h-24 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-100">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Message Sent Successfully</h1>
            <p className="text-gray-500 mb-2 text-lg">
              We&apos;ve received your message and a support agent will respond within <strong className="text-gray-900">24 hours</strong>.
            </p>
            <p className="text-gray-400 text-sm mb-8">
              A confirmation email has been sent to <strong className="text-gray-600">{formData.email || 'your email'}</strong>. Check your spam folder if you don&apos;t see it.
            </p>

            <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
              <p className="text-xs text-gray-400 uppercase font-bold mb-3 tracking-wider">What happens next</p>
              <div className="space-y-3 text-left">
                {[
                  { step: '1', text: 'Your ticket is assigned to a support agent', time: 'Now' },
                  { step: '2', text: 'Agent reviews your issue and gathers information', time: '1-4 hours' },
                  { step: '3', text: 'You receive a detailed response via email', time: 'Within 24h' },
                ].map(item => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">{item.step}</span>
                    </div>
                    <p className="text-sm text-gray-700 flex-1">{item.text}</p>
                    <span className="text-xs text-gray-400 font-medium shrink-0">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/faqs"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3.5 rounded-xl font-semibold transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Get Instant AI Help
              </Link>
              <Link
                href="/"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3.5 rounded-xl font-semibold transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          </div>
          <div className="absolute top-10 right-20 w-72 h-72 bg-green-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                  <Headphones className="w-4 h-4" />
                  Support Center
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
                  {content.hero_title}
                </h1>
                <p className="text-gray-400 text-lg mb-8 leading-relaxed max-w-lg">
                  {content.hero_subtitle}
                </p>

                {/* Live Status Indicators */}
                <div className="flex flex-wrap gap-4 mb-8">
                  <div className="flex items-center gap-2 bg-white/5 px-4 py-2.5 rounded-xl border border-white/10">
                    <div className={`w-2.5 h-2.5 rounded-full ${isBusinessHours ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
                    <span className="text-sm text-gray-300">
                      {isBusinessHours ? 'Support Online' : 'After Hours'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-4 py-2.5 rounded-xl border border-white/10">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">Nairobi: {currentTime}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-4 py-2.5 rounded-xl border border-white/10">
                    <Zap className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-300">&lt;24h response</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => { setActiveTab('form'); document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' }) }}
                    className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Send a Message
                  </button>
                  <Link
                    href="/faqs"
                    className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white px-7 py-3.5 rounded-xl font-semibold text-sm transition-colors border border-white/10"
                  >
                    <BookOpen className="w-4 h-4" />
                    Browse FAQ
                  </Link>
                </div>
              </div>

              {/* Contact Stats */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: '<24h', label: 'Avg Response Time', desc: 'For all support tickets', icon: Clock, color: 'text-green-400' },
                  { value: '97%', label: 'Resolution Rate', desc: 'Issues resolved first contact', icon: CheckCircle2, color: 'text-emerald-400' },
                  { value: '4.8/5', label: 'Support Rating', desc: 'Based on user feedback', icon: Star, color: 'text-amber-400' },
                  { value: '24/7', label: 'AI Assistant', desc: 'Instant answers anytime', icon: Sparkles, color: 'text-purple-400' },
                ].map(stat => (
                  <div key={stat.label} className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-colors">
                    <stat.icon className={`w-6 h-6 ${stat.color} mb-3`} />
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-gray-300 font-medium mt-1">{stat.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{stat.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Quick Help Router */}
        <section className="py-16 bg-gray-50" id="contact-section">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Tab Switcher */}
            <div className="flex items-center justify-center gap-2 mb-10">
              <button
                onClick={() => setActiveTab('quick-help')}
                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                  activeTab === 'quick-help'
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Find Help Fast
                </span>
              </button>
              <button
                onClick={() => setActiveTab('form')}
                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                  activeTab === 'form'
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Send a Message
                </span>
              </button>
            </div>

            {activeTab === 'quick-help' && (
              <div>
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">What do you need help with?</h2>
                  <p className="text-gray-500 max-w-lg mx-auto">Select your issue below and we&apos;ll route you to the fastest solution — most issues can be resolved without waiting.</p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {QUICK_HELP_ROUTES.map(route => (
                    <Link
                      key={route.title}
                      href={route.href}
                      className={`${route.bg} border ${route.border} rounded-2xl p-6 hover:shadow-lg transition-all group`}
                    >
                      <div className={`w-12 h-12 bg-gradient-to-br ${route.color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-105 transition-transform`}>
                        <route.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1">{route.title}</h3>
                      <p className="text-sm text-gray-500 mb-4">{route.desc}</p>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 group-hover:gap-2 transition-all">
                        {route.action}
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="mt-8 text-center">
                  <p className="text-gray-400 text-sm mb-3">Can&apos;t find what you&apos;re looking for?</p>
                  <button
                    onClick={() => setActiveTab('form')}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Send Us a Message Instead
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'form' && (
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">Send Us a Message</h2>
                  <p className="text-gray-500">Fill out the form below and our team will get back to you within 24 hours.</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Priority Selector */}
                  <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Priority Level</p>
                    <div className="flex gap-2">
                      {[
                        { value: 'low', label: 'Low', desc: '3-5 days', color: 'bg-gray-100 text-gray-600 border-gray-200' },
                        { value: 'normal', label: 'Normal', desc: '24 hours', color: 'bg-green-50 text-green-700 border-green-200' },
                        { value: 'urgent', label: 'Urgent', desc: '4-8 hours', color: 'bg-red-50 text-red-700 border-red-200' },
                      ].map(p => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, priority: p.value as 'low' | 'normal' | 'urgent' })}
                          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                            formData.priority === p.value
                              ? `${p.color} ring-2 ring-offset-1 ${p.value === 'urgent' ? 'ring-red-300' : p.value === 'normal' ? 'ring-green-300' : 'ring-gray-300'}`
                              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <span className="block font-semibold">{p.label}</span>
                          <span className="block text-[10px] opacity-70 mt-0.5">{p.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 md:p-8">
                    {submitError && (
                      <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-5 text-sm">{submitError}</div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid md:grid-cols-2 gap-5">
                        <div>
                          <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text" id="name" required
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="Your full name"
                              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/50 focus:border-green-300 text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="email" id="email" required
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              placeholder="you@example.com"
                              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/50 focus:border-green-300 text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-5">
                        <div>
                          <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                          <select
                            id="category" required
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/50 focus:border-green-300 text-sm"
                          >
                            {categories.map(cat => (
                              <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-1.5">Subject</label>
                          <input
                            type="text" id="subject" required
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="Brief description"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/50 focus:border-green-300 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label htmlFor="message" className="block text-sm font-semibold text-gray-700">Message</label>
                          <span className="text-xs text-gray-400">{formData.message.length}/2000</span>
                        </div>
                        <textarea
                          id="message" required rows={5} maxLength={2000}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Describe your issue or question in detail. Include any relevant order IDs, usernames, or error messages..."
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/50 focus:border-green-300 resize-none text-sm"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-300 text-white py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 hover:shadow-green-500/30"
                      >
                        {isSubmitting ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                        ) : (
                          <><Send className="w-4 h-4" /> Send Message</>
                        )}
                      </button>

                      <p className="text-xs text-gray-400 text-center">
                        By submitting, you agree to our Terms of Service. We&apos;ll respond to {formData.email || 'your email'} within 24 hours.
                      </p>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Contact Methods Grid */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Other Ways to Reach Us</h2>
              <p className="text-gray-500">Choose the channel that works best for you</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <a href={`mailto:${content.email}`} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-green-200 hover:shadow-md transition-all group text-left">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
                  <Mail className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Email</h3>
                <p className="text-sm text-gray-500 mb-3">For all inquiries</p>
                <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                  {content.email}
                  <ExternalLink className="w-3 h-3" />
                </span>
              </a>

              <a href={`tel:${content.phone}`} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group text-left">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                  <Phone className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Phone</h3>
                <p className="text-sm text-gray-500 mb-3">Mon-Fri, 8am-6pm EAT</p>
                <span className="text-sm text-blue-600 font-medium">{content.phone}</span>
              </a>

              <button
                onClick={() => window.dispatchEvent(new Event('open-live-chat'))}
                className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all group text-left w-full"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors">
                  <MessageSquare className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Live Chat</h3>
                <p className="text-sm text-gray-500 mb-3">Get instant help from our AI assistant</p>
                <span className="text-sm text-purple-600 font-medium">Click to chat now →</span>
              </button>

              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-amber-200 hover:shadow-md transition-all group text-left">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-600 transition-colors">
                  <MapPin className="w-6 h-6 text-amber-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Office</h3>
                <p className="text-sm text-gray-500 mb-3">Visit us in person</p>
                <span className="text-sm text-amber-600 font-medium">Nairobi, Kenya</span>
              </div>
            </div>
          </div>
        </section>

        {/* Knowledge Base / Popular Resources */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Popular Help Topics */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Help Topics</h2>
                <div className="space-y-3">
                  {[
                    { q: 'How does M-Pesa escrow protect my payment?', href: '/faqs', category: 'Payments' },
                    { q: 'What is the service fee and how is it calculated?', href: '/faqs', category: 'Fees' },
                    { q: 'How do I verify my account?', href: '/faqs', category: 'Account' },
                    { q: 'What happens if there is a dispute?', href: '/faqs', category: 'Safety' },
                    { q: 'How do I upgrade to Pro?', href: '/pricing', category: 'Plans' },
                    { q: 'How do I write a winning proposal?', href: '/faqs', category: 'Jobs' },
                  ].map(topic => (
                    <Link
                      key={topic.q}
                      href={topic.href}
                      className="flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-200 hover:border-green-200 hover:shadow-sm transition-all group"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-green-600 transition-colors">{topic.q}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-semibold shrink-0">{topic.category}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-green-500 shrink-0 transition-colors" />
                    </Link>
                  ))}
                </div>
                <Link
                  href="/faqs"
                  className="inline-flex items-center gap-2 text-green-600 font-semibold text-sm mt-5 hover:text-green-500 transition-colors"
                >
                  View all FAQs
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Support Commitments */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Support Promise</h2>
                <div className="space-y-4">
                  {[
                    {
                      icon: Clock,
                      title: 'Fast Response Guarantee',
                      desc: 'All tickets get a first response within 24 hours. Pro users get priority with 4-8 hour response times.',
                      color: 'bg-green-100 text-green-600',
                    },
                    {
                      icon: Users,
                      title: 'Real Humans, Not Bots',
                      desc: 'Our support team is based in Nairobi. You talk to real people who understand the Kenyan freelance market.',
                      color: 'bg-blue-100 text-blue-600',
                    },
                    {
                      icon: Shield,
                      title: 'Your Data is Protected',
                      desc: 'All conversations are encrypted. We never share your personal information or financial details.',
                      color: 'bg-purple-100 text-purple-600',
                    },
                    {
                      icon: Heart,
                      title: 'We Listen to Feedback',
                      desc: 'Every suggestion is reviewed by our product team. Many of our best features came from user feedback.',
                      color: 'bg-rose-100 text-rose-600',
                    },
                    {
                      icon: Globe,
                      title: 'Multilingual Support',
                      desc: 'We support English and Swahili. Communicate in the language you are most comfortable with.',
                      color: 'bg-amber-100 text-amber-600',
                    },
                  ].map(item => (
                    <div key={item.title} className="flex items-start gap-4 bg-white rounded-xl p-5 border border-gray-200">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm mb-0.5">{item.title}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Page Navigation */}
        <section className="py-12 bg-white border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5 text-center">Quick Navigation</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Find Jobs', href: '/jobs', icon: FileText },
                { label: 'Find Talent', href: '/talent', icon: Users },
                { label: 'Pricing', href: '/pricing', icon: TrendingUp },
                { label: 'FAQs', href: '/faqs', icon: HelpCircle },
                { label: 'Enterprise', href: '/enterprise', icon: Globe },
                { label: 'Dashboard', href: '/dashboard', icon: Zap },
              ].map(nav => (
                <Link
                  key={nav.label}
                  href={nav.href}
                  className="flex items-center gap-2.5 bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-200 rounded-xl px-4 py-3 transition-all group"
                >
                  <nav.icon className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-green-700 transition-colors">{nav.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 bg-gradient-to-br from-green-600 to-emerald-700">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Headphones className="w-10 h-10 text-green-200 mx-auto mb-5" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Still Need Help?
            </h2>
            <p className="text-green-100 text-lg mb-8 max-w-xl mx-auto">
              Our team is always ready to assist. No question is too small — we&apos;re here to make sure your experience on HustleKE is smooth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => { setActiveTab('form'); document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' }) }}
                className="inline-flex items-center justify-center gap-2 bg-white text-green-700 hover:bg-green-50 px-8 py-4 rounded-xl font-bold text-lg transition-colors"
              >
                <Send className="w-5 h-5" />
                Contact Us
              </button>
              <button
                onClick={() => window.dispatchEvent(new Event('open-live-chat'))}
                className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                Try AI Assistant
              </button>
            </div>
            <p className="mt-6 text-sm text-green-200 flex items-center justify-center gap-4 flex-wrap">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> 24hr response</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Real human support</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> English &amp; Swahili</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Pro gets priority</span>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
