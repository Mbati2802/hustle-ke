'use client'

import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { usePageContent } from '@/hooks/usePageContent'
import { useState } from 'react'
import {
  CheckCircle2,
  ArrowRight,
  Zap,
  Crown,
  Shield,
  Building2,
  DollarSign,
  Users,
  TrendingUp,
  Star,
  ChevronDown,
  Lock,
  Globe,
  Briefcase,
  HeadphonesIcon,
  BarChart3,
  Award,
  X,
  Smartphone,
} from 'lucide-react'

const planIcons = [Zap, Crown, Building2]

const defaultContent = {
  hero_title: 'Simple, Transparent Pricing',
  hero_subtitle: 'No hidden fees. No surprises. Just straightforward pricing that works for everyone.',
  plans: [
    { name: 'Free', price: 'KES 0', period: 'forever', desc: 'Perfect for getting started', color: 'green', popular: false, features: ['Create your profile', 'Browse & apply for jobs', 'AI proposal enhancement', 'M-Pesa escrow payments', 'Hustle Score tracking', '6% service fee per transaction', 'Email support'], cta: 'Get Started Free', href: '/signup' },
    { name: 'Pro', price: 'KES 500', period: '/month', desc: 'For serious freelancers', color: 'amber', popular: true, features: ['Everything in Free', 'Reduced 4% service fee', 'Priority job matching', 'Featured profile badge', 'Advanced analytics', 'Priority support', 'Early access to new features', 'Up to 20 proposals per day'], cta: 'Upgrade to Pro', href: '/dashboard/settings?tab=subscription' },
    { name: 'Enterprise', price: 'KES 5,000', period: '/month', desc: 'For teams & businesses', color: 'green', popular: false, features: ['Everything in Pro', 'Only 2% service fee', 'Up to 10 team seats', 'Freelancer bench (save & re-hire)', 'Team analytics dashboard', 'Bulk hiring features', 'API access & webhooks', 'Dedicated account manager', '2hr support SLA', 'Compliance audit trail'], cta: 'Start Enterprise', href: '/dashboard/enterprise' },
  ],
  pricing_faqs: [
    { q: 'What is the service fee?', a: 'HustleKE charges 6% on the Free plan and 4% on the Pro plan per completed transaction. This is deducted from the project payment when funds are released from escrow.', cat: 'fees' },
    { q: 'Are there any other hidden fees?', a: 'No. The service fee is the only platform charge. Standard M-Pesa transaction fees from Safaricom may apply.', cat: 'fees' },
    { q: 'How does escrow work?', a: 'When a client accepts your proposal, they fund the escrow. You work, submit deliverables, and the client approves. Funds are then released to your wallet minus the service fee.', cat: 'payments' },
    { q: 'What payment methods do you accept?', a: 'All payments on HustleKE are processed through M-Pesa. Pro subscriptions are also paid via your HustleKE wallet, which you top up via M-Pesa.', cat: 'payments' },
    { q: 'Can I cancel Pro anytime?', a: 'Yes! Pro is a monthly subscription with no lock-in. Cancel anytime from your dashboard settings. You keep Pro benefits until your current billing period ends.', cat: 'plans' },
    { q: 'What happens when my Pro subscription expires?', a: 'If auto-renew is on and your wallet has funds, it renews automatically. If not, you get a 3-day grace period to top up before reverting to Free.', cat: 'plans' },
    { q: 'Is there a free trial for Pro?', a: 'We occasionally offer promo codes for a free first month. Check our social channels or sign up and look for EARLYBIRD code in the subscription settings.', cat: 'plans' },
    { q: 'Can clients use HustleKE for free?', a: 'Absolutely. Clients can post jobs, review proposals, manage escrow, and hire freelancers on the Free plan. The service fee is deducted only on completed transactions.', cat: 'general' },
  ],
}

const comparisonData = [
  { feature: 'Service Fee', free: '6%', pro: '4%', enterprise: '2%' },
  { feature: 'Proposals / Day', free: '10', pro: '20', enterprise: 'Unlimited' },
  { feature: 'Profile Badge', free: '—', pro: 'PRO Badge', enterprise: 'Enterprise Badge' },
  { feature: 'Job Matching', free: 'Standard', pro: 'Priority', enterprise: 'AI + Dedicated' },
  { feature: 'Analytics', free: 'Basic', pro: 'Advanced', enterprise: 'Custom Reports' },
  { feature: 'Team Members', free: '1', pro: '1', enterprise: 'Up to 10' },
  { feature: 'Bulk Hiring', free: '—', pro: '—', enterprise: '50+ at once' },
  { feature: 'API Access', free: '—', pro: '—', enterprise: '✓' },
  { feature: 'Account Manager', free: '—', pro: '—', enterprise: 'Dedicated' },
  { feature: 'Support', free: 'Community', pro: 'Priority', enterprise: '2hr SLA' },
]

export default function PricingPage() {
  const content = usePageContent('pricing', defaultContent)
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [activeFaqCat, setActiveFaqCat] = useState<string>('all')

  const faqCategories = [
    { key: 'all', label: 'All Questions', icon: Globe },
    { key: 'fees', label: 'Fees & Pricing', icon: DollarSign },
    { key: 'payments', label: 'Payments & Escrow', icon: Shield },
    { key: 'plans', label: 'Plans & Subscriptions', icon: Crown },
    { key: 'general', label: 'General', icon: Briefcase },
  ]

  const filteredFaqs = content.pricing_faqs.filter(
    (faq: { q: string; a: string; cat: string }) => activeFaqCat === 'all' || faq.cat === activeFaqCat
  )

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          </div>
          <div className="absolute top-10 right-20 w-72 h-72 bg-green-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-center">
            <div className="inline-flex items-center gap-2 bg-green-500/15 text-green-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <DollarSign className="w-4 h-4" />
              Pricing
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
              {content.hero_title.split('Pricing')[0]}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">Pricing</span>
            </h1>

            <p className="text-lg text-gray-400 max-w-xl mx-auto mb-8">
              {content.hero_subtitle}
            </p>

            <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
              {[
                { icon: Shield, label: 'Escrow Protected' },
                { icon: Smartphone, label: 'M-Pesa Payments' },
                { icon: Lock, label: 'No Hidden Fees' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 text-green-400" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing cards */}
        <section className="py-16 px-4 -mt-0 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {content.plans.map((plan: { name: string; price: string; period: string; desc: string; color: string; popular: boolean; features: string[]; cta: string; href: string }, i: number) => {
                const Icon = planIcons[i] || Zap
                const isPro = plan.popular
                const isEnterprise = i === 2
                return (
                  <div
                    key={plan.name}
                    className={`relative bg-white rounded-2xl overflow-visible transition-all hover:shadow-lg ${
                      isPro
                        ? 'border-2 border-green-500 shadow-xl ring-1 ring-green-500/20 scale-[1.02] z-10'
                        : 'border border-gray-200 shadow-sm'
                    }`}
                  >
                    {isPro && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-5 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-lg z-10">
                        MOST POPULAR
                      </div>
                    )}

                    <div className="p-8">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                        isPro ? 'bg-amber-100' : isEnterprise ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-6 h-6 ${
                          isPro ? 'text-amber-600' : isEnterprise ? 'text-green-600' : 'text-gray-600'
                        }`} />
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                      <p className="text-sm text-gray-500 mb-5">{plan.desc}</p>

                      <div className="mb-6">
                        <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                        {plan.period && <span className="text-gray-500 ml-1">{plan.period}</span>}
                      </div>

                      <Link
                        href={plan.href}
                        className={`block text-center py-3.5 rounded-xl font-semibold text-sm transition-all ${
                          isPro
                            ? 'bg-green-600 hover:bg-green-500 text-white shadow-md'
                            : isEnterprise
                            ? 'bg-gray-900 hover:bg-gray-800 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {plan.cta}
                        {isPro || isEnterprise ? '' : ''}
                      </Link>
                    </div>

                    <div className="border-t border-gray-100 px-8 py-6">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">What&rsquo;s included</p>
                      <ul className="space-y-3">
                        {plan.features.map((f: string) => (
                          <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                            <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isPro ? 'text-green-500' : 'text-gray-400'}`} />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Savings callout */}
            <div className="mt-10 bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Pro pays for itself</p>
                  <p className="text-sm text-gray-600">Complete one KES 25,000 job and the 2% fee savings already covers your monthly subscription.</p>
                </div>
              </div>
              <Link
                href="/dashboard/settings?tab=subscription"
                className="shrink-0 bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2"
              >
                Upgrade Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Feature comparison table */}
        <section className="py-12 sm:py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Detailed <span className="text-green-600">Comparison</span>
              </h2>
              <p className="text-lg text-gray-500 max-w-xl mx-auto">
                See exactly what you get on each plan
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-4 text-center border-b border-gray-100">
                <div className="p-5 text-left">
                  <span className="text-sm font-semibold text-gray-500">Feature</span>
                </div>
                <div className="p-5 bg-gray-50">
                  <div className="flex items-center justify-center gap-1.5">
                    <Zap className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-500">Free</span>
                  </div>
                </div>
                <div className="p-5 bg-green-50">
                  <div className="flex items-center justify-center gap-1.5">
                    <Crown className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-bold text-green-700">Pro</span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-center gap-1.5">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-500">Enterprise</span>
                  </div>
                </div>
              </div>

              {comparisonData.map((row, i) => (
                <div key={i} className={`grid grid-cols-4 text-center text-sm ${i % 2 !== 0 ? 'bg-gray-50/50' : ''} border-t border-gray-50`}>
                  <div className="p-4 text-left font-medium text-gray-700">{row.feature}</div>
                  <div className="p-4 text-gray-400 bg-gray-50/30">{row.free}</div>
                  <div className="p-4 font-semibold text-green-700 bg-green-50/30">{row.pro}</div>
                  <div className="p-4 text-gray-600">{row.enterprise}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How fees work */}
        <section className="py-12 sm:py-20 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                How Fees <span className="text-green-600">Work</span>
              </h2>
              <p className="text-lg text-gray-500 max-w-xl mx-auto">
                We only charge when you get paid. No upfront costs, no monthly minimums on Free.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Briefcase,
                  title: 'You Complete a Job',
                  desc: 'Client funds escrow when they accept your proposal. You work on the project and submit deliverables.',
                  step: '1',
                },
                {
                  icon: Shield,
                  title: 'Client Approves',
                  desc: 'Once the client is happy, they approve the work. Funds are released from escrow to your wallet.',
                  step: '2',
                },
                {
                  icon: DollarSign,
                  title: 'Fee is Deducted',
                  desc: 'The service fee (6% Free / 4% Pro) is deducted automatically. The rest goes straight to your M-Pesa wallet.',
                  step: '3',
                },
              ].map((item) => (
                <div key={item.step} className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {item.step}
                    </div>
                    <item.icon className="w-5 h-5 text-gray-400" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Example calculation */}
            <div className="mt-10 bg-white rounded-2xl border border-gray-200 p-8">
              <h3 className="font-bold text-gray-900 mb-6 text-center">Example: KES 50,000 Project</h3>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-gray-700">Free Plan</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Project Value</span><span className="font-medium">KES 50,000</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Service Fee (6%)</span><span className="text-red-500 font-medium">- KES 3,000</span></div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between"><span className="font-semibold text-gray-900">You Receive</span><span className="font-bold text-gray-900">KES 47,000</span></div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-700">Pro Plan</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Project Value</span><span className="font-medium">KES 50,000</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Service Fee (4%)</span><span className="text-red-500 font-medium">- KES 2,000</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Pro Subscription</span><span className="text-gray-400">- KES 500/mo</span></div>
                    <div className="border-t border-green-200 pt-2 flex justify-between"><span className="font-semibold text-gray-900">You Receive</span><span className="font-bold text-green-700">KES 48,000</span></div>
                    <div className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Save KES 500 more on this single project
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What freelancers & clients love */}
        <section className="py-12 sm:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Built for <span className="text-green-600">Both Sides</span>
              </h2>
              <p className="text-lg text-gray-500 max-w-xl mx-auto">
                Whether you&rsquo;re freelancing or hiring, HustleKE has you covered
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Freelancer card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-5">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">For Freelancers</h3>
                <p className="text-sm text-gray-500 mb-6">Find work, get paid securely, and grow your career</p>
                <ul className="space-y-3 mb-6">
                  {[
                    'Browse hundreds of open jobs',
                    'AI-enhanced proposal writing',
                    'Escrow-protected payments',
                    'Instant M-Pesa payouts',
                    'Build your Hustle Score reputation',
                    'Portfolio & profile showcase',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
                  Start Freelancing <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Client card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-5">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">For Clients</h3>
                <p className="text-sm text-gray-500 mb-6">Hire trusted talent and manage projects with confidence</p>
                <ul className="space-y-3 mb-6">
                  {[
                    'Post jobs in minutes',
                    'Receive proposals from verified talent',
                    'Escrow ensures work is delivered',
                    'Review & rate freelancers',
                    'M-Pesa wallet for easy funding',
                    'Zero cost to post jobs',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/jobs" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
                  Post a Job Free <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12 sm:py-20 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <HeadphonesIcon className="w-4 h-4" />
                Support
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked <span className="text-green-600">Questions</span>
              </h2>
              <p className="text-lg text-gray-500 max-w-xl mx-auto">
                Everything you need to know about pricing, payments, and plans
              </p>
            </div>

            {/* Category filter tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {faqCategories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => { setActiveFaqCat(cat.key); setOpenFaq(null) }}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeFaqCat === cat.key
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-green-300 hover:text-green-600'
                  }`}
                >
                  <cat.icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              ))}
            </div>

            {/* FAQ grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {filteredFaqs.map((faq: { q: string; a: string; cat: string }, i: number) => {
                const faqKey = `${faq.cat}-${i}`
                const isOpen = openFaq === faqKey
                const catInfo = faqCategories.find(c => c.key === faq.cat)
                const CatIcon = catInfo?.icon || Globe
                return (
                  <div
                    key={faqKey}
                    className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                      isOpen ? 'border-green-300 shadow-md ring-1 ring-green-100' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : faqKey)}
                      className="w-full flex items-start gap-3 p-5 text-left transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isOpen ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <CatIcon className={`w-4 h-4 ${isOpen ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold pr-2 ${
                          isOpen ? 'text-green-700' : 'text-gray-900'
                        }`}>{faq.q}</h3>
                      </div>
                      <ChevronDown className={`w-5 h-5 shrink-0 mt-0.5 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-green-500' : 'text-gray-300'
                      }`} />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pl-16">
                        <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Still have questions */}
            <div className="mt-10 text-center bg-white rounded-2xl border border-gray-200 p-8">
              <HeadphonesIcon className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 text-lg mb-2">Still have questions?</h3>
              <p className="text-sm text-gray-500 mb-5 max-w-md mx-auto">
                Can&rsquo;t find what you&rsquo;re looking for? Our support team is here to help.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/faqs"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                >
                  Browse All FAQs <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
                >
                  <HeadphonesIcon className="w-4 h-4" /> Contact Support
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 sm:py-20 bg-gradient-to-br from-green-600 to-emerald-700">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-5">
              Start Earning on HustleKE Today
            </h2>
            <p className="text-green-100 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of Kenyan freelancers already growing their careers. Free to start, upgrade when you&rsquo;re ready.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 bg-white text-green-700 hover:bg-green-50 px-8 py-4 rounded-xl font-bold text-lg transition-colors"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/enterprise"
                className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
              >
                <Building2 className="w-5 h-5" />
                Enterprise Solutions
              </Link>
            </div>
            <p className="mt-6 text-sm text-green-200 flex items-center justify-center gap-4">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> No credit card</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> M-Pesa powered</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Cancel anytime</span>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
