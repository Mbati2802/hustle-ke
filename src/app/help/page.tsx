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
  AlertTriangle,
  Settings,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Zap,
  Star,
  FileText,
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
  color: string
  articles: HelpArticle[]
}

const helpCategories: HelpCategory[] = [
  {
    id: 'getting-started',
    icon: BookOpen,
    title: 'Getting Started',
    description: 'New to HustleKE? Start here.',
    color: 'bg-green-100 text-green-600',
    articles: [
      { q: 'How do I create an account?', a: 'Click "Get Started" on the homepage. Choose your role (Freelancer or Client), enter your email, create a password, and verify your email. You can then complete your profile from the dashboard.' },
      { q: 'What\'s the difference between Freelancer and Client accounts?', a: 'Freelancers can browse jobs, submit proposals, and earn money. Clients can post jobs, review proposals, and hire freelancers. Both can access escrow, wallet, and messaging features.' },
      { q: 'How do I complete my profile?', a: 'Go to Dashboard → Settings → Profile tab. Fill in your name, professional title, bio, skills, hourly rate, county, and upload a profile photo. A complete profile gets more visibility.' },
      { q: 'How do I find work as a freelancer?', a: 'Browse the Jobs page and filter by category, budget, or location. Click on a job to view details and submit a proposal. You can also set up Job Alerts to get notified about new matching jobs.' },
      { q: 'How do I post a job as a client?', a: 'Click "Post a Job" in the header or dashboard sidebar. Fill in the job title, description, category, budget, deadline, and required skills. Your job will be visible to freelancers after posting.' },
    ],
  },
  {
    id: 'payments',
    icon: CreditCard,
    title: 'Payments & M-Pesa',
    description: 'Everything about getting paid.',
    color: 'bg-blue-100 text-blue-600',
    articles: [
      { q: 'How do I top up my wallet?', a: 'Go to Dashboard → Wallet. Enter your M-Pesa phone number and amount, then click "Top Up". You\'ll receive an STK push on your phone to confirm the payment. Funds appear instantly in your wallet.' },
      { q: 'How do I withdraw money?', a: 'Go to Dashboard → Wallet → Withdraw tab. Enter the amount and your M-Pesa phone number. Minimum withdrawal is KES 100. Funds are sent to your M-Pesa within seconds.' },
      { q: 'What are the service fees?', a: 'Free plan: 6% service fee on each payment. Pro plan (KES 500/month): 4% fee. Enterprise: 2% fee. All fees include 16% VAT as required by Kenyan law.' },
      { q: 'How does escrow work?', a: 'When a client accepts a proposal, the agreed amount is moved from their wallet into escrow (held securely). Once the freelancer delivers and the client approves, funds are released to the freelancer\'s wallet.' },
      { q: 'What is EscrowSplit™?', a: 'EscrowSplit™ allows you to split an escrow payment across multiple milestones. Each milestone can be released independently as work progresses, providing better cash flow for freelancers.' },
      { q: 'Can I get a refund?', a: 'If work hasn\'t started or there\'s a dispute, clients can request a refund from the escrow page. Disputed refunds are handled by our support team within 48 hours.' },
    ],
  },
  {
    id: 'escrow-security',
    icon: Shield,
    title: 'Escrow & Security',
    description: 'How we protect your money.',
    color: 'bg-indigo-100 text-indigo-600',
    articles: [
      { q: 'Is my money safe in escrow?', a: 'Yes. Escrow funds are held securely in our platform. Neither party can access the funds until the work is completed and approved, or a dispute is resolved.' },
      { q: 'What happens if there\'s a dispute?', a: 'Either party can open a dispute from Dashboard → Disputes. Provide evidence (screenshots, messages). Our team reviews both sides and resolves within 48 hours — either releasing funds, refunding, or splitting.' },
      { q: 'How do I enable Two-Factor Authentication?', a: 'Go to Dashboard → Settings → Security tab → MFA Setup. Scan the QR code with an authenticator app (Google Authenticator, Authy) and enter the verification code.' },
      { q: 'What is TrustChain™?', a: 'TrustChain™ is our reputation system that tracks your work history, completion rate, reviews, and verification status. A higher TrustChain™ score helps you win more projects.' },
    ],
  },
  {
    id: 'proposals',
    icon: FileText,
    title: 'Proposals & Jobs',
    description: 'Writing proposals and managing jobs.',
    color: 'bg-amber-100 text-amber-600',
    articles: [
      { q: 'How do I write a good proposal?', a: 'Be specific about how you\'ll solve the client\'s problem. Mention relevant experience, provide a timeline, and set a fair budget. Use ProposalForge™ (AI-powered) to help craft winning proposals.' },
      { q: 'How many proposals can I submit per day?', a: 'Free plan: 10 proposals/day. Pro plan: 20 proposals/day. Quality matters more than quantity — focus on jobs that match your skills.' },
      { q: 'What is ProposalForge™?', a: 'ProposalForge™ is our AI tool that analyzes a job posting and helps you write a tailored proposal. It suggests key points to address, optimal pricing, and persuasive language.' },
      { q: 'How do I track my proposals?', a: 'Go to Dashboard → My Proposals. You\'ll see all your submitted proposals with their status (Pending, Accepted, Rejected, Withdrawn).' },
      { q: 'Can I edit a proposal after submitting?', a: 'Yes, you can edit proposals that are still in "Pending" status. Go to My Proposals, click on the proposal, and select Edit.' },
    ],
  },
  {
    id: 'profile',
    icon: UserCircle,
    title: 'Profile & Account',
    description: 'Managing your HustleKE account.',
    color: 'bg-purple-100 text-purple-600',
    articles: [
      { q: 'How do I upload a profile photo?', a: 'Go to Dashboard → Settings. Click the camera icon on your avatar. Upload a clear headshot (JPG, PNG, or WebP, max 2MB).' },
      { q: 'What is SkillDNA™?', a: 'SkillDNA™ verifies your skills through assessments and project history. Verified skills appear with a badge on your profile, increasing client confidence.' },
      { q: 'How do I manage my portfolio?', a: 'Go to Dashboard → Settings → Portfolio tab. Create categories, add projects with descriptions, and upload images for each project.' },
      { q: 'How do I change my password?', a: 'Go to Dashboard → Settings → Security tab. Enter your current password and new password, then click "Update Password".' },
      { q: 'How do I delete my account?', a: 'Go to Dashboard → Settings → Security tab → Danger Zone. Click "Delete Account" and follow the confirmation prompts. This action is permanent.' },
    ],
  },
  {
    id: 'subscription',
    icon: Star,
    title: 'Pro Plan & Pricing',
    description: 'Benefits of upgrading to Pro.',
    color: 'bg-amber-100 text-amber-700',
    articles: [
      { q: 'What does the Pro plan include?', a: '4% service fee (vs 6%), 20 proposals/day (vs 10), priority job matching, Pro badge on profile, advanced analytics dashboard, and priority support.' },
      { q: 'How much does Pro cost?', a: 'KES 500/month, deducted from your wallet balance. Auto-renews monthly. Cancel anytime — benefits continue until the end of your billing period.' },
      { q: 'How do I upgrade to Pro?', a: 'Go to Dashboard → Settings → Subscription tab, or visit the Pricing page. Ensure your wallet has at least KES 500, then click "Upgrade to Pro".' },
      { q: 'Do you have promo codes?', a: 'Yes! Enter a promo code on the Subscription tab before upgrading. Contact support or check our social media for active promo codes.' },
    ],
  },
  {
    id: 'messages',
    icon: MessageSquare,
    title: 'Messaging',
    description: 'Communicating on HustleKE.',
    color: 'bg-green-100 text-green-700',
    articles: [
      { q: 'How do I message a freelancer or client?', a: 'Messages are job-specific. When you have an active proposal or project, go to Dashboard → Messages. Select the conversation and send your message.' },
      { q: 'Can I send files in messages?', a: 'Currently, messages are text-based. For file sharing, you can use the work submission feature or share links to cloud storage.' },
      { q: 'Will I get notified of new messages?', a: 'Yes, you\'ll receive in-app notifications and optionally email/SMS alerts. Manage notification preferences in Dashboard → Settings → Notifications tab.' },
    ],
  },
  {
    id: 'enterprise',
    icon: Briefcase,
    title: 'Enterprise',
    description: 'Team and organization features.',
    color: 'bg-slate-100 text-slate-600',
    articles: [
      { q: 'What is HustleKE Enterprise?', a: 'Enterprise is for organizations that want to manage multiple freelancers. Features include team management, shared org wallet, freelancer bench, analytics dashboard, and 2% service fee.' },
      { q: 'How do I create an organization?', a: 'Go to Dashboard → Enterprise and follow the setup flow. You can invite team members and start posting jobs under your organization.' },
      { q: 'Can I switch between personal and org mode?', a: 'Yes, use the org switcher in the dashboard sidebar to toggle between your personal account and organization context.' },
    ],
  },
]

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null)

  // Search across all articles
  const searchResults = searchQuery.trim().length > 1
    ? helpCategories.flatMap(cat =>
        cat.articles
          .filter(a =>
            a.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.a.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(a => ({ ...a, category: cat.title, categoryId: cat.id }))
      )
    : []

  const toggleArticle = (key: string) => {
    setExpandedArticle(expandedArticle === key ? null : key)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-600 to-emerald-700 pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <HelpCircle className="w-4 h-4" /> Help Center
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">How can we help?</h1>
          <p className="text-green-100 mb-8">Search our knowledge base or browse categories below.</p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm shadow-lg"
            />
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search results */}
        {searchQuery.trim().length > 1 && (
          <div className="mb-12">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
            </h2>
            {searchResults.length > 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {searchResults.map((r, i) => {
                  const key = `search-${i}`
                  const isOpen = expandedArticle === key
                  return (
                    <div key={i}>
                      <button
                        onClick={() => toggleArticle(key)}
                        className="w-full px-5 py-4 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <ChevronDown className={`w-4 h-4 text-gray-400 mt-0.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{r.q}</p>
                          <span className="text-[10px] text-gray-400 uppercase mt-0.5">{r.category}</span>
                        </div>
                      </button>
                      {isOpen && (
                        <div className="px-12 pb-4 text-sm text-gray-600 leading-relaxed">{r.a}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <HelpCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">No results found</p>
                <p className="text-xs text-gray-400">Try different keywords or <Link href="/contact" className="text-green-600 hover:underline">contact support</Link></p>
              </div>
            )}
          </div>
        )}

        {/* Category grid */}
        {!searchQuery.trim() && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Browse by Category</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {helpCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                  className={`group bg-white rounded-xl border p-5 text-left transition-all hover:shadow-md ${
                    expandedCategory === cat.id ? 'border-green-300 ring-1 ring-green-200' : 'border-gray-200 hover:border-green-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${cat.color}`}>
                    <cat.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{cat.title}</h3>
                  <p className="text-xs text-gray-500">{cat.description}</p>
                  <p className="text-[10px] text-green-600 font-medium mt-2">{cat.articles.length} articles</p>
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
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.color}`}>
                    <cat.icon className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">{cat.title}</h2>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                  {cat.articles.map((article, i) => {
                    const key = `${cat.id}-${i}`
                    const isOpen = expandedArticle === key
                    return (
                      <div key={i}>
                        <button
                          onClick={() => toggleArticle(key)}
                          className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          <p className="text-sm font-medium text-gray-900 flex-1">{article.q}</p>
                        </button>
                        {isOpen && (
                          <div className="px-12 pb-4 text-sm text-gray-600 leading-relaxed">{article.a}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All categories expanded (when no specific one selected and no search) */}
        {(!searchQuery.trim() && !expandedCategory) && (
          <div className="space-y-8">
            {helpCategories.map(cat => (
              <div key={cat.id}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cat.color}`}>
                    <cat.icon className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">{cat.title}</h3>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                  {cat.articles.slice(0, 3).map((article, i) => {
                    const key = `all-${cat.id}-${i}`
                    const isOpen = expandedArticle === key
                    return (
                      <div key={i}>
                        <button
                          onClick={() => toggleArticle(key)}
                          className="w-full px-5 py-3.5 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          <p className="text-sm font-medium text-gray-900 flex-1">{article.q}</p>
                        </button>
                        {isOpen && (
                          <div className="px-12 pb-4 text-sm text-gray-600 leading-relaxed">{article.a}</div>
                        )}
                      </div>
                    )
                  })}
                  {cat.articles.length > 3 && (
                    <button
                      onClick={() => setExpandedCategory(cat.id)}
                      className="w-full px-5 py-3 text-xs text-green-600 hover:text-green-700 font-medium text-left hover:bg-green-50/50 transition-colors"
                    >
                      View all {cat.articles.length} articles →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Still need help? */}
        <div className="mt-12 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 text-center">
          <HelpCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Still need help?</h2>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            Can&apos;t find what you&apos;re looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors">
              <MessageSquare className="w-4 h-4" /> Contact Support
            </Link>
            <Link href="/faqs" className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-xl font-semibold text-sm transition-colors">
              <BookOpen className="w-4 h-4" /> View FAQs
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
