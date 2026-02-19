'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import {
  Search,
  BookOpen,
  CreditCard,
  Shield,
  UserCircle,
  Briefcase,
  MessageSquare,
  ChevronDown,
  HelpCircle,
  Star,
  FileText,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Phone,
  Mail,
  Clock,
  TrendingUp,
} from 'lucide-react'

interface HelpArticle {
  q: string
  a: string
}

interface HelpCategory {
  id: string
  icon: typeof BookOpen
  title: string
  description: string
  gradient: string
  iconBg: string
  articles: HelpArticle[]
}

const popularQuestions = [
  { q: 'How does escrow work?', cat: 'payments' },
  { q: 'How do I get paid?', cat: 'payments' },
  { q: 'What are the service fees?', cat: 'payments' },
  { q: 'How do I write a good proposal?', cat: 'proposals' },
  { q: 'How do I verify my account?', cat: 'getting-started' },
  { q: 'How much does Pro cost?', cat: 'subscription' },
]

const helpCategories: HelpCategory[] = [
  {
    id: 'getting-started',
    icon: BookOpen,
    title: 'Getting Started',
    description: 'New to HustleKE? Start here.',
    gradient: 'from-green-500 to-green-600',
    iconBg: 'bg-green-100 text-green-600',
    articles: [
      { q: 'How do I create an account?', a: 'Click "Get Started" on the homepage. Choose your role (Freelancer or Client), enter your email, create a password, and verify your email. You can then complete your profile from the dashboard.' },
      { q: 'What\'s the difference between Freelancer and Client accounts?', a: 'Freelancers can browse jobs, submit proposals, and earn money. Clients can post jobs, review proposals, and hire freelancers. Both can access escrow, wallet, and messaging features.' },
      { q: 'How do I complete my profile?', a: 'Go to Dashboard > Settings > Profile tab. Fill in your name, professional title, bio, skills, hourly rate, county, and upload a profile photo. A complete profile gets more visibility.' },
      { q: 'How do I find work as a freelancer?', a: 'Browse the Jobs page and filter by category, budget, or location. Click on a job to view details and submit a proposal. You can also set up Job Alerts to get notified about new matching jobs.' },
      { q: 'How do I post a job as a client?', a: 'Click "Post a Job" in the header or dashboard sidebar. Fill in the job title, description, category, budget, deadline, and required skills. Your job will be visible to freelancers after posting.' },
    ],
  },
  {
    id: 'payments',
    icon: CreditCard,
    title: 'Payments & M-Pesa',
    description: 'Everything about getting paid.',
    gradient: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-100 text-blue-600',
    articles: [
      { q: 'How do I top up my wallet?', a: 'Go to Dashboard > Wallet. Enter your M-Pesa phone number and amount, then click "Top Up". You\'ll receive an STK push on your phone to confirm the payment. Funds appear instantly in your wallet.' },
      { q: 'How do I withdraw money?', a: 'Go to Dashboard > Wallet > Withdraw tab. Enter the amount and your M-Pesa phone number. Funds are sent to your M-Pesa within seconds.' },
      { q: 'What are the service fees?', a: 'Free plan: 6% service fee on each payment. Pro plan (KES 500/month): 4% fee. Enterprise: 2% fee. All fees include 16% VAT as required by Kenyan law.' },
      { q: 'How does escrow work?', a: 'When a client accepts a proposal, the agreed amount is moved from their wallet into escrow (held securely). Once the freelancer delivers and the client approves, funds are released to the freelancer\'s wallet.' },
      { q: 'What is EscrowSplit?', a: 'EscrowSplit allows you to split an escrow payment across multiple milestones. Each milestone can be released independently as work progresses, providing better cash flow for freelancers.' },
      { q: 'Can I get a refund?', a: 'If work hasn\'t started or there\'s a dispute, clients can request a refund from the escrow page. Disputed refunds are handled by our support team within 48 hours.' },
    ],
  },
  {
    id: 'escrow-security',
    icon: Shield,
    title: 'Escrow & Security',
    description: 'How we protect your money.',
    gradient: 'from-indigo-500 to-indigo-600',
    iconBg: 'bg-indigo-100 text-indigo-600',
    articles: [
      { q: 'Is my money safe in escrow?', a: 'Yes. Escrow funds are held securely in our platform. Neither party can access the funds until the work is completed and approved, or a dispute is resolved.' },
      { q: 'What happens if there\'s a dispute?', a: 'Either party can open a dispute from Dashboard > Disputes. Provide evidence (screenshots, messages). Our team reviews both sides and resolves within 48 hours — either releasing funds, refunding, or splitting.' },
      { q: 'How do I enable Two-Factor Authentication?', a: 'Go to Dashboard > Settings > Security tab > MFA Setup. Scan the QR code with an authenticator app (Google Authenticator, Authy) and enter the verification code.' },
      { q: 'What is TrustChain?', a: 'TrustChain is our reputation system that tracks your work history, completion rate, reviews, and verification status. A higher TrustChain score helps you win more projects.' },
    ],
  },
  {
    id: 'proposals',
    icon: FileText,
    title: 'Proposals & Jobs',
    description: 'Writing proposals and managing jobs.',
    gradient: 'from-amber-500 to-amber-600',
    iconBg: 'bg-amber-100 text-amber-600',
    articles: [
      { q: 'How do I write a good proposal?', a: 'Be specific about how you\'ll solve the client\'s problem. Mention relevant experience, provide a timeline, and set a fair budget. Use ProposalForge (AI-powered) to help craft winning proposals.' },
      { q: 'How many proposals can I submit per day?', a: 'Free plan: 10 proposals/day. Pro plan: 20 proposals/day. Quality matters more than quantity — focus on jobs that match your skills.' },
      { q: 'What is ProposalForge?', a: 'ProposalForge is our AI tool that analyzes a job posting and helps you write a tailored proposal. It suggests key points to address, optimal pricing, and persuasive language.' },
      { q: 'How do I track my proposals?', a: 'Go to Dashboard > My Proposals. You\'ll see all your submitted proposals with their status (Pending, Accepted, Rejected, Withdrawn).' },
      { q: 'Can I edit a proposal after submitting?', a: 'Yes, you can edit proposals that are still in "Pending" status. Go to My Proposals, click on the proposal, and select Edit.' },
    ],
  },
  {
    id: 'profile',
    icon: UserCircle,
    title: 'Profile & Account',
    description: 'Managing your HustleKE account.',
    gradient: 'from-purple-500 to-purple-600',
    iconBg: 'bg-purple-100 text-purple-600',
    articles: [
      { q: 'How do I upload a profile photo?', a: 'Go to Dashboard > Settings. Click the camera icon on your avatar. Upload a clear headshot (JPG, PNG, or WebP, max 2MB).' },
      { q: 'What is SkillDNA?', a: 'SkillDNA verifies your skills through assessments and project history. Verified skills appear with a badge on your profile, increasing client confidence.' },
      { q: 'How do I manage my portfolio?', a: 'Go to Dashboard > Settings > Portfolio tab. Create categories, add projects with descriptions, and upload images for each project.' },
      { q: 'How do I change my password?', a: 'Go to Dashboard > Settings > Security tab. Enter your current password and new password, then click "Update Password".' },
      { q: 'How do I delete my account?', a: 'Go to Dashboard > Settings > Security tab > Danger Zone. Click "Delete Account" and follow the confirmation prompts. This action is permanent.' },
    ],
  },
  {
    id: 'subscription',
    icon: Star,
    title: 'Pro Plan & Pricing',
    description: 'Benefits of upgrading to Pro.',
    gradient: 'from-orange-500 to-orange-600',
    iconBg: 'bg-orange-100 text-orange-700',
    articles: [
      { q: 'What does the Pro plan include?', a: '4% service fee (vs 6%), 20 proposals/day (vs 10), priority job matching, Pro badge on profile, advanced analytics dashboard, and priority support.' },
      { q: 'How much does Pro cost?', a: 'KES 500/month, deducted from your wallet balance. Auto-renews monthly. Cancel anytime — benefits continue until the end of your billing period.' },
      { q: 'How do I upgrade to Pro?', a: 'Go to Dashboard > Settings > Subscription tab, or visit the Pricing page. Ensure your wallet has at least KES 500, then click "Upgrade to Pro".' },
      { q: 'Do you have promo codes?', a: 'Yes! Enter a promo code on the Subscription tab before upgrading. Contact support or check our social media for active promo codes.' },
    ],
  },
  {
    id: 'messages',
    icon: MessageSquare,
    title: 'Messaging',
    description: 'Communicating on HustleKE.',
    gradient: 'from-teal-500 to-teal-600',
    iconBg: 'bg-teal-100 text-teal-700',
    articles: [
      { q: 'How do I message a freelancer or client?', a: 'Messages are job-specific. When you have an active proposal or project, go to Dashboard > Messages. Select the conversation and send your message.' },
      { q: 'Can I send files in messages?', a: 'Currently, messages are text-based. For file sharing, you can use the work submission feature or share links to cloud storage.' },
      { q: 'Will I get notified of new messages?', a: 'Yes, you\'ll receive in-app notifications and optionally email/SMS alerts. Manage notification preferences in Dashboard > Settings > Notifications tab.' },
    ],
  },
  {
    id: 'enterprise',
    icon: Briefcase,
    title: 'Enterprise',
    description: 'Team and organization features.',
    gradient: 'from-slate-500 to-slate-600',
    iconBg: 'bg-slate-100 text-slate-600',
    articles: [
      { q: 'What is HustleKE Enterprise?', a: 'Enterprise is for organizations that want to manage multiple freelancers. Features include team management, shared org wallet, freelancer bench, analytics dashboard, and 2% service fee.' },
      { q: 'How do I create an organization?', a: 'Go to Dashboard > Enterprise and follow the setup flow. You can invite team members and start posting jobs under your organization.' },
      { q: 'Can I switch between personal and org mode?', a: 'Yes, use the org switcher in the dashboard sidebar to toggle between your personal account and organization context.' },
    ],
  },
]

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null)

  const searchResults = searchQuery.trim().length > 1
    ? helpCategories.flatMap(cat =>
        cat.articles
          .filter(a =>
            a.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.a.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(a => ({ ...a, category: cat.title, categoryId: cat.id, iconBg: cat.iconBg }))
      )
    : []

  const toggleArticle = (key: string) => {
    setExpandedArticle(expandedArticle === key ? null : key)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Hero with animated bg */}
      <section className="relative bg-gradient-to-br from-green-600 to-green-700 pt-16 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center text-white mb-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <HelpCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Help Center</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              How can we help you?
            </h1>
            <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto mb-8">
              Search our knowledge base or browse categories below. We&apos;re here to help you succeed.
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search for help... e.g. 'escrow', 'withdraw', 'proposal'"
                className="w-full pl-12 pr-4 py-3.5 sm:py-4 rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm shadow-lg"
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { icon: FileText, label: 'Help Articles', value: `${helpCategories.reduce((a, c) => a + c.articles.length, 0)}+` },
              { icon: Clock, label: 'Avg Response', value: '< 24hrs' },
              { icon: TrendingUp, label: 'Issues Resolved', value: '98%' },
              { icon: Sparkles, label: 'AI Assistant', value: '24/7' },
            ].map((stat) => (
              <div key={stat.label} className="group bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-5 text-center border border-white/20 hover:bg-white/20 transition-all duration-300">
                <stat.icon className="w-6 h-6 sm:w-7 sm:h-7 text-green-300 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs sm:text-sm text-green-200">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Search results */}
        {searchQuery.trim().length > 1 && (
          <div className="mb-12">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
            </h2>
            {searchResults.length > 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 shadow-sm">
                {searchResults.map((r, i) => {
                  const key = `search-${i}`
                  const isOpen = expandedArticle === key
                  return (
                    <div key={i}>
                      <button
                        onClick={() => toggleArticle(key)}
                        className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all ${isOpen ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180 text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{r.q}</p>
                          <span className="text-[11px] text-gray-400 uppercase mt-0.5">{r.category}</span>
                        </div>
                      </button>
                      {isOpen && (
                        <div className="px-6 sm:px-16 pb-5 text-sm text-gray-600 leading-relaxed">{r.a}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <HelpCircle className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-gray-900 font-semibold mb-1">No results found</p>
                <p className="text-sm text-gray-400">Try different keywords or <Link href="/contact" className="text-green-600 hover:underline font-medium">contact support</Link></p>
              </div>
            )}
          </div>
        )}

        {/* Popular Questions — show when not searching */}
        {!searchQuery.trim() && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">Popular Questions</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {popularQuestions.map((pq) => (
                <button
                  key={pq.q}
                  onClick={() => {
                    setExpandedCategory(pq.cat)
                    const cat = helpCategories.find(c => c.id === pq.cat)
                    const idx = cat?.articles.findIndex(a => a.q === pq.q) ?? -1
                    if (idx >= 0) setExpandedArticle(`${pq.cat}-${idx}`)
                  }}
                  className="group bg-white rounded-xl border-2 border-gray-100 p-4 text-left hover:border-green-200 hover:shadow-md transition-all duration-300"
                >
                  <p className="text-sm font-medium text-gray-900 group-hover:text-green-600 transition-colors">{pq.q}</p>
                  <span className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    Read answer <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category grid */}
        {!searchQuery.trim() && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Browse by Category</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {helpCategories.map((cat, catIdx) => (
                <button
                  key={cat.id}
                  onClick={() => { setExpandedCategory(expandedCategory === cat.id ? null : cat.id); setExpandedArticle(null) }}
                  className={`group relative bg-white rounded-2xl border-2 p-5 sm:p-6 text-left transition-all duration-500 hover:shadow-xl hover:-translate-y-1 overflow-hidden ${
                    expandedCategory === cat.id ? 'border-green-300 ring-1 ring-green-200' : 'border-gray-100 hover:border-green-200'
                  }`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${cat.gradient} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${cat.iconBg} group-hover:scale-110 transition-transform`}>
                    <cat.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">{cat.title}</h3>
                  <p className="text-xs text-gray-500 mb-3">{cat.description}</p>
                  <span className="text-xs text-green-600 font-semibold">{cat.articles.length} articles</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Expanded category articles */}
        {(!searchQuery.trim() && expandedCategory) && (
          <div className="mb-12">
            {helpCategories.filter(c => c.id === expandedCategory).map(cat => (
              <div key={cat.id}>
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat.iconBg}`}>
                    <cat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{cat.title}</h2>
                    <p className="text-xs text-gray-500">{cat.articles.length} articles</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 shadow-sm">
                  {cat.articles.map((article, i) => {
                    const key = `${cat.id}-${i}`
                    const isOpen = expandedArticle === key
                    return (
                      <div key={i}>
                        <button
                          onClick={() => toggleArticle(key)}
                          className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${isOpen ? 'bg-green-100' : 'bg-gray-100'}`}>
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-green-600' : 'text-gray-400'}`} />
                          </div>
                          <p className={`text-sm font-medium flex-1 ${isOpen ? 'text-green-700' : 'text-gray-900'}`}>{article.q}</p>
                        </button>
                        <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                          <div className="px-6 sm:px-16 pb-5 text-sm text-gray-600 leading-relaxed">{article.a}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All categories preview (when no specific one selected and no search) */}
        {(!searchQuery.trim() && !expandedCategory) && (
          <div className="space-y-6">
            {helpCategories.map(cat => (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.iconBg}`}>
                      <cat.icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">{cat.title}</h3>
                  </div>
                  {cat.articles.length > 3 && (
                    <button
                      onClick={() => { setExpandedCategory(cat.id); setExpandedArticle(null) }}
                      className="text-xs text-green-600 hover:text-green-700 font-semibold flex items-center gap-1"
                    >
                      View all <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 shadow-sm">
                  {cat.articles.slice(0, 3).map((article, i) => {
                    const key = `all-${cat.id}-${i}`
                    const isOpen = expandedArticle === key
                    return (
                      <div key={i}>
                        <button
                          onClick={() => toggleArticle(key)}
                          className="w-full px-5 sm:px-6 py-3.5 sm:py-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-all ${isOpen ? 'bg-green-100' : 'bg-gray-100'}`}>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-green-600' : 'text-gray-400'}`} />
                          </div>
                          <p className={`text-sm font-medium flex-1 ${isOpen ? 'text-green-700' : 'text-gray-900'}`}>{article.q}</p>
                        </button>
                        <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                          <div className="px-5 sm:px-14 pb-4 text-sm text-gray-600 leading-relaxed">{article.a}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-14 grid sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 text-center hover:shadow-lg hover:border-green-200 transition-all">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Live Chat</h3>
            <p className="text-xs text-gray-500 mb-4">Chat with our AI or a human agent</p>
            <button
              onClick={() => window.dispatchEvent(new Event('open-live-chat'))}
              className="text-sm text-green-600 hover:text-green-700 font-semibold flex items-center gap-1 mx-auto"
            >
              Start Chat <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 text-center hover:shadow-lg hover:border-green-200 transition-all">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Contact Us</h3>
            <p className="text-xs text-gray-500 mb-4">Submit a support request</p>
            <Link href="/contact" className="text-sm text-green-600 hover:text-green-700 font-semibold flex items-center gap-1 mx-auto justify-center">
              Contact Form <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 text-center hover:shadow-lg hover:border-green-200 transition-all">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">FAQs</h3>
            <p className="text-xs text-gray-500 mb-4">Browse full FAQ library</p>
            <Link href="/faqs" className="text-sm text-green-600 hover:text-green-700 font-semibold flex items-center gap-1 mx-auto justify-center">
              View FAQs <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* CTA */}
      <section className="py-12 sm:py-20 px-4 bg-white mt-auto">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">Still need help?</h2>
          <p className="text-gray-600 mb-8 max-w-lg mx-auto">
            Our support team is available Monday - Friday, 8 AM - 6 PM EAT. AI assistant is available 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/contact" className="group inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl font-bold transition-all hover:shadow-xl hover:scale-105">
              <MessageSquare className="w-5 h-5" /> Contact Support <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/faqs" className="inline-flex items-center justify-center gap-2 border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-2xl font-semibold transition-all">
              <BookOpen className="w-5 h-5" /> Browse All FAQs
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap justify-center items-center gap-6 sm:gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> 24/7 AI Support</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> Response within 24hrs</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> 98% resolution rate</div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
