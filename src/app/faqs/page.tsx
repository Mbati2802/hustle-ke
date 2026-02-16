'use client'

import Link from 'next/link'
import { useState, useMemo, useEffect } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { usePageContent } from '@/hooks/usePageContent'
import {
  Search,
  ArrowRight,
  ChevronDown,
  HelpCircle,
  MessageSquare,
  Mail,
  Users,
  Wallet,
  Shield,
  Award,
  FileText,
  Briefcase,
  DollarSign,
  Crown,
  Zap,
  Brain,
  Sparkles,
  TrendingUp,
  Eye,
  CheckCircle2,
  Globe,
  Cpu,
  X,
  Clock,
  BarChart3,
  RefreshCw,
  Bot,
} from 'lucide-react'

const categoryConfig: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  'getting-started': { icon: Zap, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
  'payments': { icon: Wallet, color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' },
  'fees': { icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200' },
  'safety': { icon: Shield, color: 'text-rose-600', bg: 'bg-rose-100', border: 'border-rose-200' },
  'account': { icon: Users, color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200' },
  'jobs': { icon: Briefcase, color: 'text-cyan-600', bg: 'bg-cyan-100', border: 'border-cyan-200' },
  'plans': { icon: Crown, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' },
}

const defaultContent = {
  hero_title: 'Help Center',
  hero_subtitle: 'Get instant answers powered by our intelligent knowledge system',
  categories: [
    { id: 'getting-started', name: 'Getting Started' },
    { id: 'payments', name: 'Payments & Escrow' },
    { id: 'fees', name: 'Fees & Pricing' },
    { id: 'safety', name: 'Safety & Trust' },
    { id: 'account', name: 'Account & Profile' },
    { id: 'jobs', name: 'Jobs & Proposals' },
    { id: 'plans', name: 'Plans & Subscriptions' },
  ],
  faqs: {
    'getting-started': [
      { question: 'How do I get started as a freelancer?', answer: 'Create your profile, add your skills and portfolio, verify your identity with your national ID, and start browsing jobs that match your expertise. Our AI recommends the best opportunities based on your skills.' },
      { question: 'Is HustleKE free to use?', answer: 'Yes! Creating an account and browsing jobs is completely free. We only charge a small service fee (6% Free / 4% Pro) when you complete a project and get paid through escrow.' },
      { question: 'What do I need to sign up?', answer: 'You need a valid email address, phone number, and national ID for verification. You will also need an M-Pesa registered phone number for payments.' },
      { question: 'How long does verification take?', answer: 'Most verifications are completed within 24 hours. You will receive an SMS and email notification once your account is verified.' },
      { question: 'Can I be both a freelancer and a client?', answer: 'Yes! You can post jobs as a client and apply to jobs as a freelancer using the same account. Your dashboard adapts based on your role.' },
    ],
    'payments': [
      { question: 'How does M-Pesa escrow work?', answer: 'When a client accepts your proposal, they fund the escrow with M-Pesa. The money is held securely until you complete the work and the client approves. Then funds are released instantly to your wallet.' },
      { question: 'How fast do I get paid?', answer: 'Once the client approves your work, payment is released to your M-Pesa wallet instantly — usually within seconds.' },
      { question: 'How do I top up my wallet?', answer: 'Go to Dashboard > Wallet, enter your M-Pesa phone number and amount, then click Top Up. You will receive an STK push on your phone to confirm.' },
      { question: 'Can I use other payment methods?', answer: 'Currently, all payments are processed through M-Pesa. We are working on adding bank transfers and other options in the future.' },
      { question: 'What happens if escrow funds are stuck?', answer: 'If there is a dispute, open one from Dashboard > Escrow. Our resolution team reviews evidence from both sides within 48 hours and decides a fair outcome.' },
    ],
    'fees': [
      { question: 'What is the service fee?', answer: 'HustleKE charges 6% on the Free plan and 4% on the Pro plan per completed transaction. This is deducted from the payment when funds are released from escrow.' },
      { question: 'Are there any hidden fees?', answer: 'No. The service fee is the only platform charge. Standard M-Pesa transaction fees from Safaricom may apply for withdrawals.' },
      { question: 'How does Pro reduce my fees?', answer: 'Pro members pay 4% instead of 6%. On a KES 50,000 project, that saves KES 1,000. The Pro subscription costs KES 500/month, so one decent project covers it.' },
      { question: 'Do clients pay fees too?', answer: 'The service fee is deducted from the freelancer\'s payment. Clients pay only the agreed project amount when funding escrow.' },
    ],
    'safety': [
      { question: 'What is the Hustle Score?', answer: 'Hustle Score is your trust rating (0-100) based on completed jobs, reviews, response time, verification status, and platform activity. Higher scores get priority in search and job matching.' },
      { question: 'How do you verify users?', answer: 'We verify identity through government ID and phone number verification. We also verify skills through portfolio reviews and client feedback.' },
      { question: 'What happens if there is a dispute?', answer: 'Open a dispute from Dashboard > Escrow. Our team reviews evidence from both sides within 48 hours. Funds stay safe in escrow until resolved — by release, refund, or fair split.' },
      { question: 'Is my data secure?', answer: 'Yes. We use bank-level encryption, Row Level Security policies, and never share personal information with third parties. All API routes are rate-limited and validated.' },
    ],
    'account': [
      { question: 'How do I update my profile?', answer: 'Go to Dashboard > Settings > Profile tab. You can update your name, bio, skills, hourly rate, education, certifications, and portfolio.' },
      { question: 'How do I upload a profile photo?', answer: 'Go to Dashboard > Settings and click the camera icon on your avatar. Upload a JPEG, PNG, or WebP image under 2MB.' },
      { question: 'How do I add portfolio items?', answer: 'Go to Dashboard > Settings > Portfolio tab. Create categories, add projects with descriptions, and upload up to 10 images per project.' },
      { question: 'How do I delete my account?', answer: 'Contact our support team. You must complete all active contracts and withdraw all funds first before account deletion.' },
    ],
    'jobs': [
      { question: 'How do I hire talent?', answer: 'Post your project with requirements and budget, review proposals from qualified freelancers, chat with candidates, and hire the best fit. Fund escrow and work begins!' },
      { question: 'How do I write a winning proposal?', answer: 'Address the client\'s specific needs, showcase relevant experience, be clear about your timeline and approach, set a competitive bid, and use the AI Proposal Polisher.' },
      { question: 'How many proposals can I send per day?', answer: 'Free plan: 10 proposals/day. Pro plan: 20 proposals/day. Enterprise: unlimited. Withdrawn proposals restore your daily count.' },
      { question: 'What if a client doesn\'t respond?', answer: 'Send a polite follow-up after 3 days. If no response after 7 days, withdraw your proposal and apply elsewhere. Your proposal count is restored.' },
    ],
    'plans': [
      { question: 'Can I cancel Pro anytime?', answer: 'Yes! Pro is monthly with no lock-in. Cancel from Dashboard > Settings > Subscription. You keep Pro benefits until your billing period ends.' },
      { question: 'What happens when Pro expires?', answer: 'If auto-renew is on and your wallet has funds, it renews automatically. Otherwise, you get a 3-day grace period to top up before reverting to Free.' },
      { question: 'Is there a free trial?', answer: 'We offer promo codes for free or discounted first months. Try code EARLYBIRD for a free first month in Dashboard > Settings > Subscription.' },
      { question: 'What does Enterprise include?', answer: 'Custom fee rates from 3%, unlimited proposals, team management, bulk hiring, API access, dedicated account manager, and 2-hour support SLAs.' },
    ],
  },
  cta_title: 'Still need help?',
  cta_subtitle: 'Our support team responds within 24 hours. Or try our AI-powered instant answers.',
}

type TrendingQuestion = {
  question: string
  suggestedAnswer: string
  category: string
  confidence: 'high' | 'medium' | 'low'
  detectedAt: string
}

// Word-based fuzzy search scoring (mirrors the API logic)
const SEARCH_STOP_WORDS = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'each', 'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'because', 'if', 'when', 'where', 'how', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'it', 'its', 'they', 'them', 'their', 'he', 'she', 'him', 'her', 'his', 'about', 'up', 'out', 'then', 'there', 'here'])

function extractSearchWords(text: string): string[] {
  return text.toLowerCase().replace(/[?!.,;:'"()\[\]{}]/g, '').split(/\s+/).filter(w => w.length >= 2 && !SEARCH_STOP_WORDS.has(w))
}

function scoreFaq(query: string, faq: { question: string; answer: string }): number {
  const queryWords = extractSearchWords(query)
  if (queryWords.length === 0) return 0

  let score = 0
  const qLower = faq.question.toLowerCase()
  const aLower = faq.answer.toLowerCase()

  // Exact substring of full query in question or answer (boost)
  const fullLower = query.toLowerCase().trim()
  if (qLower.includes(fullLower)) score += 10
  if (aLower.includes(fullLower)) score += 5

  // Word-by-word matching
  const faqQWords = extractSearchWords(faq.question)
  const faqAWords = extractSearchWords(faq.answer)

  for (const qw of queryWords) {
    // Check question words
    for (const fw of faqQWords) {
      if (fw === qw) { score += 3; break }
      else if (fw.includes(qw) || qw.includes(fw)) { score += 2; break }
    }
    // Check answer words
    for (const aw of faqAWords) {
      if (aw === qw) { score += 1; break }
      else if (aw.includes(qw) || qw.includes(aw)) { score += 0.5; break }
    }
  }

  return score
}

type AiAnswer = {
  answer: string
  matchedQuestion?: string
  category?: string
  source: string
  confidence: string
  relatedFaqs: Array<{ id: string; question: string; answer: string; category: string }>
}

export default function FAQsPage() {
  const content = usePageContent('faqs', defaultContent)
  const [activeCategory, setActiveCategory] = useState('getting-started')
  const [openQuestion, setOpenQuestion] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [trendingQuestions, setTrendingQuestions] = useState<TrendingQuestion[]>([])
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [totalKB, setTotalKB] = useState(0)
  const [lastScan, setLastScan] = useState('')

  // AI answer state — fetched when search has few/no results
  const [aiAnswer, setAiAnswer] = useState<AiAnswer | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  // Feedback state — tracks which items user gave feedback on
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'yes' | 'no'>>({})
  const handleFeedback = (key: string, value: 'yes' | 'no') => {
    setFeedbackGiven(prev => ({ ...prev, [key]: value }))
  }

  

  const faqData = content.faqs as Record<string, { question: string; answer: string }[]>
  const categories = content.categories as { id: string; name: string }[]

  // Fetch trending questions from intelligence API
  useEffect(() => {
    setTrendingLoading(true)
    fetch('/api/faq/intelligence?action=trending')
      .then(r => r.json())
      .then(data => {
        setTrendingQuestions(data.trending || [])
        setTotalKB(data.totalKnowledgeBase || 0)
        setLastScan(data.lastScan || '')
      })
      .catch(() => {})
      .finally(() => setTrendingLoading(false))
  }, [])

  // Fuzzy search across all FAQ categories
  const filteredFaqs = useMemo(() => {
    if (searchQuery && searchQuery.trim().length >= 2) {
      const scored = Object.entries(faqData).flatMap(([catId, faqs]) =>
        (faqs as { question: string; answer: string }[]).map(faq => ({
          ...faq,
          catId,
          score: scoreFaq(searchQuery, faq),
        }))
      )
      return scored
        .filter(f => f.score > 0)
        .sort((a, b) => b.score - a.score)
    }
    return (faqData[activeCategory] || []).map((faq: { question: string; answer: string }) => ({ ...faq, catId: activeCategory, score: 0 }))
  }, [searchQuery, activeCategory, faqData])

  // Auto-ask AI when search query changes and has few/no local results
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setAiAnswer(null)
      return
    }

    const timeout = setTimeout(() => {
      setAiLoading(true)
      fetch(`/api/faq/intelligence?action=ask&q=${encodeURIComponent(searchQuery)}`)
        .then(r => r.json())
        .then(data => setAiAnswer(data))
        .catch(() => setAiAnswer(null))
        .finally(() => setAiLoading(false))
    }, 400) // debounce 400ms

    return () => clearTimeout(timeout)
  }, [searchQuery])

  

  const totalFaqs = Object.values(faqData).flat().length

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
          <div className="absolute top-40 left-1/2 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-center">
            <div className="inline-flex items-center gap-2 bg-green-500/15 text-green-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Brain className="w-4 h-4" />
              AI-Powered Help Center
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
              {content.hero_title.split('Center')[0]}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">Center</span>
            </h1>

            <p className="text-lg text-gray-400 max-w-xl mx-auto mb-8">
              {content.hero_subtitle}
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Type your question — our AI finds the best answer instantly..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-13 pr-12 py-4 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500/50 focus:bg-white/15 transition-all"
                style={{ paddingLeft: '3.25rem' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Quick stats */}
            <div className="flex items-center justify-center gap-8 mt-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-400" />
                <span>{totalFaqs}+ answers</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-green-400" />
                <span>{totalKB || totalFaqs} knowledge items</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-400" />
                <span>Instant AI matching</span>
              </div>
            </div>
          </div>
        </section>

        {/* Category quick links */}
        <section className="py-8 bg-gray-50 border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((cat) => {
                const config = categoryConfig[cat.id] || { icon: HelpCircle, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' }
                const Icon = config.icon
                const isActive = activeCategory === cat.id && !searchQuery
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveCategory(cat.id); setSearchQuery(''); setOpenQuestion(null) }}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-green-600 text-white shadow-md'
                        : `bg-white ${config.color} border ${config.border} hover:shadow-sm`
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.name}
                    <span className={`text-xs px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/20' : 'bg-gray-100'}`}>
                      {(faqData[cat.id] || []).length}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* Main FAQ content */}
        <section className="py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {searchQuery
                    ? `Search Results`
                    : categories.find(c => c.id === activeCategory)?.name
                  }
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {searchQuery
                    ? `${filteredFaqs.length} result${filteredFaqs.length !== 1 ? 's' : ''} for "${searchQuery}"`
                    : `${filteredFaqs.length} frequently asked question${filteredFaqs.length !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-sm text-green-600 hover:text-green-500 font-medium flex items-center gap-1">
                  <X className="w-4 h-4" /> Clear search
                </button>
              )}
            </div>

            {/* AI Answer Card — always visible when searching */}
            {searchQuery && searchQuery.trim().length >= 3 && (
              <div className="mb-6">
                {aiLoading ? (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center animate-pulse">
                        <Bot className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="h-4 bg-green-200/50 rounded w-32 animate-pulse" />
                        <div className="h-3 bg-green-100 rounded w-48 mt-1 animate-pulse" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-green-100 rounded w-full animate-pulse" />
                      <div className="h-4 bg-green-100 rounded w-5/6 animate-pulse" />
                      <div className="h-4 bg-green-100 rounded w-4/6 animate-pulse" />
                    </div>
                  </div>
                ) : aiAnswer ? (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-green-800 text-base">AI Assistant</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            aiAnswer.confidence === 'high' ? 'bg-green-200 text-green-700' :
                            aiAnswer.confidence === 'medium' ? 'bg-amber-200 text-amber-700' :
                            'bg-gray-200 text-gray-600'
                          }`}>
                            {aiAnswer.confidence === 'high' ? 'Confident match' : aiAnswer.confidence === 'medium' ? 'Best match' : 'Generated answer'}
                          </span>
                          {aiAnswer.source === 'ai_generated' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 font-semibold flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" /> Live reply
                            </span>
                          )}
                        </div>
                        {aiAnswer.matchedQuestion && (
                          <p className="text-xs text-green-600 mb-2 font-medium">
                            Matched: &ldquo;{aiAnswer.matchedQuestion}&rdquo;
                          </p>
                        )}
                        <p className="text-gray-700 leading-relaxed">{aiAnswer.answer}</p>

                        {/* Related FAQs */}
                        {aiAnswer.relatedFaqs && aiAnswer.relatedFaqs.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-green-200">
                            <p className="text-xs text-green-600 font-semibold mb-2">Related questions you might find helpful:</p>
                            <div className="space-y-1.5">
                              {aiAnswer.relatedFaqs.slice(0, 3).map((rf, i) => (
                                <button
                                  key={i}
                                  onClick={() => setSearchQuery(rf.question)}
                                  className="block w-full text-left text-sm text-gray-600 hover:text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  <span className="text-green-500 mr-2">→</span> {rf.question}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-4 flex items-center gap-3">
                          {feedbackGiven['ai-answer'] ? (
                            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {feedbackGiven['ai-answer'] === 'yes' ? 'Thanks! Glad it helped.' : 'Thanks for the feedback. We\'ll improve.'}
                            </span>
                          ) : (
                            <>
                              <span className="text-xs text-gray-400">Was this helpful?</span>
                              <button onClick={() => handleFeedback('ai-answer', 'yes')} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 transition-colors font-medium">Yes</button>
                              <button onClick={() => handleFeedback('ai-answer', 'no')} className="text-xs bg-white text-gray-500 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors font-medium border border-gray-200">No</button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* FAQ items */}
            <div className="space-y-3">
              {filteredFaqs.length > 0 ? (
                <>
                  {searchQuery && filteredFaqs.length > 0 && (
                    <p className="text-sm text-gray-500 font-medium mb-2">
                      {filteredFaqs.length} matching FAQ{filteredFaqs.length !== 1 ? 's' : ''} found:
                    </p>
                  )}
                  {filteredFaqs.map((faq, index) => {
                    const faqKey = searchQuery ? `search-${index}` : `${activeCategory}-${index}`
                    const isOpen = openQuestion === faqKey
                    const config = categoryConfig[faq.catId] || categoryConfig['getting-started']
                    const CatIcon = config.icon
                    return (
                      <div
                        key={faqKey}
                        className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                          isOpen ? 'border-green-300 shadow-lg ring-1 ring-green-100' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <button
                          onClick={() => setOpenQuestion(isOpen ? null : faqKey)}
                          className="w-full flex items-start gap-4 p-5 text-left"
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isOpen ? 'bg-green-100' : config.bg
                          }`}>
                            <CatIcon className={`w-5 h-5 ${isOpen ? 'text-green-600' : config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold text-base ${isOpen ? 'text-green-700' : 'text-gray-900'}`}>
                              {faq.question}
                            </h3>
                            {!isOpen && (
                              <p className="text-sm text-gray-400 mt-1 line-clamp-1">{faq.answer}</p>
                            )}
                          </div>
                          <ChevronDown className={`w-5 h-5 shrink-0 mt-1 transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-green-500' : 'text-gray-300'
                          }`} />
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-5 pl-19" style={{ paddingLeft: '4.75rem' }}>
                            <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                            <div className="mt-4 flex items-center gap-3">
                              {feedbackGiven[faqKey] ? (
                                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {feedbackGiven[faqKey] === 'yes' ? 'Thanks! Glad it helped.' : 'Thanks for the feedback. We\'ll improve.'}
                                </span>
                              ) : (
                                <>
                                  <span className="text-xs text-gray-400">Was this helpful?</span>
                                  <button onClick={() => handleFeedback(faqKey, 'yes')} className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-lg hover:bg-green-100 transition-colors font-medium">Yes</button>
                                  <button onClick={() => handleFeedback(faqKey, 'no')} className="text-xs bg-gray-50 text-gray-500 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors font-medium">No</button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </>
              ) : searchQuery ? (
                // When searching but no local FAQ matches — AI answer card above handles it, show helpful nudge
                <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                  <p className="text-gray-500 text-sm">
                    No exact FAQ matches, but our AI assistant above has answered your question.
                  </p>
                  <button
                    onClick={() => { setSearchQuery(''); setActiveCategory('getting-started') }}
                    className="mt-4 text-sm text-green-600 hover:text-green-500 font-medium"
                  >
                    Or browse all FAQ categories →
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* System Intelligence Section */}
        <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
          <div className="absolute top-10 right-10 w-72 h-72 bg-green-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 bg-green-500/15 text-green-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                System Intelligence
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                AI That <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">Learns</span> From Every Conversation
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Our system scans all user conversations, detects questions, and automatically recommends clear answers — making support faster and smarter over time
              </p>
            </div>

            {/* How it works - 3 pillars */}
            <div className="grid md:grid-cols-3 gap-6 mb-14">
              {[
                {
                  icon: Eye,
                  title: 'Detects Questions',
                  desc: 'Scans all user messages and chats in real-time. Any message with a question mark is analyzed and matched against our knowledge base.',
                  stat: 'Real-time',
                },
                {
                  icon: Brain,
                  title: 'Suggests Answers',
                  desc: 'Matches detected questions to the best FAQ answer using keyword intelligence. High-confidence matches are surfaced instantly.',
                  stat: `${totalKB || totalFaqs} answers`,
                },
                {
                  icon: RefreshCw,
                  title: 'Rewrites Replies',
                  desc: 'When human agents respond to users, the system rewrites formal or unclear answers into simple, easy-to-understand language.',
                  stat: 'Auto-clarify',
                },
              ].map((pillar, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <pillar.icon className="w-5 h-5 text-green-400" />
                    </div>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-md font-medium">{pillar.stat}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{pillar.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{pillar.desc}</p>
                </div>
              ))}
            </div>

            {/* Trending detected questions */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Trending Questions Detected</h3>
                    <p className="text-xs text-gray-400">Auto-detected from user conversations</p>
                  </div>
                </div>
                {lastScan && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Last scan: just now
                  </span>
                )}
              </div>

              {trendingLoading ? (
                <div className="grid md:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white/5 rounded-xl p-4 animate-pulse">
                      <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-white/5 rounded w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {trendingQuestions.slice(0, 6).map((tq, i) => {
                    const config = categoryConfig[tq.category] || categoryConfig['getting-started']
                    return (
                      <div key={i} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-4 transition-all group cursor-pointer"
                        onClick={() => {
                          setSearchQuery(tq.question)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                            tq.confidence === 'high' ? 'bg-green-400' : tq.confidence === 'medium' ? 'bg-amber-400' : 'bg-gray-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium group-hover:text-green-300 transition-colors">{tq.question}</p>
                            <p className="text-gray-500 text-xs mt-1 line-clamp-1">{tq.suggestedAnswer}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                tq.confidence === 'high' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                {tq.confidence} confidence
                              </span>
                              <span className="text-[10px] text-gray-500">{tq.category}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* How It Works + Pro Upgrade */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <Zap className="w-4 h-4" />
                How It Works
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Start Earning in <span className="text-green-600">3 Simple Steps</span>
              </h2>
              <p className="text-lg text-gray-500 max-w-xl mx-auto">
                Whether you&apos;re a freelancer looking for work or a client hiring talent, getting started takes minutes.
              </p>
            </div>

            {/* Steps */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {[
                {
                  step: '01',
                  title: 'Create Your Profile',
                  desc: 'Sign up free, verify your ID, add your skills and portfolio. Stand out with a complete profile and verified badge.',
                  icon: Users,
                  color: 'from-blue-500 to-indigo-600',
                },
                {
                  step: '02',
                  title: 'Find Work or Hire',
                  desc: 'Browse jobs and submit proposals, or post your project and review bids from talented freelancers across Kenya.',
                  icon: Briefcase,
                  color: 'from-green-500 to-emerald-600',
                },
                {
                  step: '03',
                  title: 'Get Paid via M-Pesa',
                  desc: 'Payments are held in secure escrow. Once work is approved, funds are released to your M-Pesa wallet instantly.',
                  icon: Wallet,
                  color: 'from-amber-500 to-orange-600',
                },
              ].map((item) => (
                <div key={item.step} className="relative bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow group">
                  <div className="absolute -top-4 left-8">
                    <span className={`bg-gradient-to-r ${item.color} text-white text-xs font-bold px-3 py-1.5 rounded-full`}>
                      Step {item.step}
                    </span>
                  </div>
                  <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mb-5 mt-2 shadow-lg group-hover:scale-105 transition-transform`}>
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Pro Upgrade Banner */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />

              <div className="relative grid md:grid-cols-2 gap-10 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold mb-4">
                    <Crown className="w-3.5 h-3.5" />
                    PRO PLAN
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                    Do More with HustleKE Pro
                  </h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    Unlock lower fees, more daily proposals, priority job matching, and advanced analytics. Pro freelancers earn more and get hired faster.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/pricing"
                      className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors"
                    >
                      <Crown className="w-4 h-4" />
                      Upgrade to Pro — KES 500/mo
                    </Link>
                    <Link
                      href="/pricing"
                      className="inline-flex items-center justify-center gap-2 text-gray-400 hover:text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors border border-gray-700 hover:border-gray-500"
                    >
                      Compare Plans
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: '4%', label: 'Service fee', sub: 'vs 6% Free' },
                    { value: '20', label: 'Proposals/day', sub: 'vs 10 Free' },
                    { value: '1st', label: 'Priority matching', sub: 'Seen first by clients' },
                    { value: '24h', label: 'Priority support', sub: 'Faster responses' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <p className="text-2xl font-bold text-green-400">{stat.value}</p>
                      <p className="text-white text-sm font-medium mt-1">{stat.label}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{stat.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick help cards */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Quick Help</h2>
              <p className="text-lg text-gray-500">Jump to the most common topics</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Zap, title: 'Get Started', desc: 'Create profile, verify ID, find your first job', link: 'getting-started', color: 'from-blue-500/10 to-indigo-500/10', iconColor: 'text-blue-600' },
                { icon: Wallet, title: 'Payments', desc: 'Escrow, M-Pesa, withdrawals, top-ups', link: 'payments', color: 'from-green-500/10 to-emerald-500/10', iconColor: 'text-green-600' },
                { icon: DollarSign, title: 'Fees', desc: 'Service fees, Pro savings, fee breakdown', link: 'fees', color: 'from-amber-500/10 to-yellow-500/10', iconColor: 'text-amber-600' },
                { icon: Shield, title: 'Safety', desc: 'Disputes, verification, data security', link: 'safety', color: 'from-rose-500/10 to-pink-500/10', iconColor: 'text-rose-600' },
              ].map((card) => (
                <button
                  key={card.link}
                  onClick={() => { setActiveCategory(card.link); setSearchQuery(''); setOpenQuestion(null); window.scrollTo({ top: 500, behavior: 'smooth' }) }}
                  className={`bg-gradient-to-br ${card.color} rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-all text-left group`}
                >
                  <card.icon className={`w-8 h-8 ${card.iconColor} mb-3`} />
                  <h3 className="font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">{card.title}</h3>
                  <p className="text-sm text-gray-500">{card.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-20 bg-gradient-to-br from-green-600 to-emerald-700">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-5">
              {content.cta_title}
            </h2>
            <p className="text-green-100 text-lg mb-8 max-w-xl mx-auto">
              {content.cta_subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-white text-green-700 hover:bg-green-50 px-8 py-4 rounded-xl font-bold text-lg transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                Contact Support
              </Link>
              <Link
                href="mailto:support@hustleke.com"
                className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
              >
                <Mail className="w-5 h-5" />
                Email Us
              </Link>
            </div>
            <p className="mt-6 text-sm text-green-200 flex items-center justify-center gap-4">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> 24hr response</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> AI instant answers</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Priority for Pro</span>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
