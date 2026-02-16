'use client'

import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import {
  Briefcase,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  FileText,
  Send,
  Clock,
  Award,
  Search,
  Eye,
  Target,
  Lightbulb,
  Zap,
  Shield,
  Star,
  DollarSign,
  TrendingUp,
  MessageSquare,
  ChevronRight,
  AlertTriangle,
  XCircle,
  Bot,
  PenTool,
  Heart,
  ThumbsUp,
} from 'lucide-react'

export default function SubmitProposalsPage() {
  const steps = [
    {
      num: '01',
      title: 'Find the Right Job',
      desc: 'Browse jobs by category, budget, or skill. Use filters to find projects that match your expertise and rate. Don\'t apply to everything — focus on jobs where you\'re a strong fit.',
      icon: Search,
      color: 'blue',
      tip: 'Jobs posted in the last 24 hours have the highest response rates.',
    },
    {
      num: '02',
      title: 'Study the Requirements',
      desc: 'Read the full job description carefully. Note specific requirements, deliverables, timeline, and budget. Clients can tell instantly when a freelancer hasn\'t read their brief.',
      icon: Eye,
      color: 'purple',
      tip: 'Highlight 2-3 key requirements you\'ll address directly in your proposal.',
    },
    {
      num: '03',
      title: 'Craft Your Cover Letter',
      desc: 'Open with a hook that shows you understand their problem. Explain your approach, share relevant experience, and end with a clear next step. Keep it under 300 words.',
      icon: PenTool,
      color: 'green',
      tip: 'Start with "I noticed you need..." not "Hi, my name is..."',
    },
    {
      num: '04',
      title: 'Polish with AI',
      desc: 'Use our built-in AI Proposal Polisher to enhance your grammar, tone, and persuasion. It analyzes the job requirements and optimizes your cover letter for maximum impact.',
      icon: Sparkles,
      color: 'amber',
      tip: 'AI polishing increases acceptance rates by 40% on average.',
    },
    {
      num: '05',
      title: 'Set Your Bid',
      desc: 'Price competitively based on scope, not desperation. Bid within the client\'s budget range but don\'t undercut yourself. Your rate signals your quality level.',
      icon: DollarSign,
      color: 'emerald',
      tip: 'Check Career Intelligence for average rates in your skill area.',
    },
    {
      num: '06',
      title: 'Submit & Follow Up',
      desc: 'Review everything one final time, then submit. If the client responds with questions, reply within a few hours. Speed and professionalism win jobs.',
      icon: Send,
      color: 'rose',
      tip: 'Proposals submitted within 2 hours of posting are 3x more likely to win.',
    },
  ]

  const stepColors: Record<string, { bg: string; icon: string; border: string; text: string; light: string }> = {
    blue: { bg: 'bg-blue-50', icon: 'bg-blue-600', border: 'border-blue-200', text: 'text-blue-600', light: 'bg-blue-100' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-600', border: 'border-purple-200', text: 'text-purple-600', light: 'bg-purple-100' },
    green: { bg: 'bg-green-50', icon: 'bg-green-600', border: 'border-green-200', text: 'text-green-600', light: 'bg-green-100' },
    amber: { bg: 'bg-amber-50', icon: 'bg-amber-600', border: 'border-amber-200', text: 'text-amber-600', light: 'bg-amber-100' },
    emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-600', border: 'border-emerald-200', text: 'text-emerald-600', light: 'bg-emerald-100' },
    rose: { bg: 'bg-rose-50', icon: 'bg-rose-600', border: 'border-rose-200', text: 'text-rose-600', light: 'bg-rose-100' },
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header activeLink="/how-it-works" />

      <main className="flex-1">
        {/* Hero — Split layout with proposal mockup */}
        <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          </div>
          <div className="absolute top-20 right-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left — Text */}
              <div>
                <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                  <Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-purple-400 font-medium">Submit Proposals</span>
                </nav>

                <div className="inline-flex items-center gap-2 bg-purple-500/15 text-purple-400 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
                  <Send className="w-4 h-4" />
                  Step 3 of 5
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
                  Write Proposals That
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"> Win Jobs</span>
                </h1>

                <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-lg">
                  Your proposal is your pitch, your handshake, your first impression. With our AI Polisher and proven strategies, you&rsquo;ll stand out from every other freelancer.
                </p>

                <div className="flex flex-wrap gap-4 mb-8">
                  <Link
                    href="/jobs"
                    className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-7 py-3.5 rounded-xl font-semibold transition-colors"
                  >
                    Browse Jobs Now
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <a
                    href="#steps"
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-7 py-3.5 rounded-xl font-medium transition-colors"
                  >
                    Learn the Process
                  </a>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>AI-Powered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span>40% Higher Win Rate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span>5 min per Proposal</span>
                  </div>
                </div>
              </div>

              {/* Right — Proposal mockup */}
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl" />
                  <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm mx-auto">
                    {/* Proposal header */}
                    <div className="bg-gray-50 border-b border-gray-100 px-6 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Your Proposal</span>
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">AI Enhanced</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">E-commerce Website Redesign</h3>
                      <p className="text-xs text-gray-500">Budget: KES 80,000 - 120,000</p>
                    </div>

                    {/* Cover letter preview */}
                    <div className="px-6 py-4">
                      <div className="text-xs text-gray-700 leading-relaxed space-y-2">
                        <p>
                          <span className="text-purple-600 font-medium">I noticed you&rsquo;re looking to redesign your e-commerce platform</span> to improve conversions. Having built 15+ Shopify stores for Kenyan brands, I understand the local market challenges.
                        </p>
                        <p>
                          For your project, I&rsquo;d focus on: mobile-first design (80% of Kenyan shoppers browse on mobile), M-Pesa integration, and a streamlined checkout that reduces cart abandonment by up to 35%.
                        </p>
                        <p className="text-gray-400 italic">
                          I can start immediately and deliver within 3 weeks...
                        </p>
                      </div>

                      {/* AI improvements shown */}
                      <div className="mt-4 bg-purple-50 border border-purple-100 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                          <span className="text-[10px] font-semibold text-purple-700">AI Improvements Applied</span>
                        </div>
                        <div className="space-y-1">
                          {['Added client-specific hook', 'Included data points', 'Optimized call-to-action'].map(imp => (
                            <div key={imp} className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3 text-purple-400" />
                              <span className="text-[10px] text-purple-600">{imp}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bid section */}
                    <div className="border-t border-gray-100 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-gray-500">Your Bid</span>
                          <div className="font-bold text-gray-900">KES 95,000</div>
                        </div>
                        <button className="bg-purple-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2">
                          <Send className="w-4 h-4" />
                          Submit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What makes a winning proposal */}
        <section className="py-12 sm:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Anatomy of a <span className="text-purple-600">Winning</span> Proposal
              </h2>
              <p className="text-lg text-gray-500 max-w-xl mx-auto">
                Top freelancers on HustleKE follow this formula. Here&rsquo;s what separates winners from the rest.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* DO this */}
              <div className="bg-white rounded-2xl border border-green-200 overflow-hidden">
                <div className="bg-green-50 px-6 py-4 border-b border-green-100 flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <ThumbsUp className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-green-900">What Winning Proposals Do</h3>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { title: 'Open with a client-specific hook', desc: '"I noticed you need a mobile-first e-commerce site for the Kenyan market — I\'ve built 15+ of these."' },
                    { title: 'Reference specific requirements', desc: 'Address 2-3 items from the job description directly to show you actually read it.' },
                    { title: 'Include relevant social proof', desc: '"My last Shopify project increased conversions by 35% within the first month."' },
                    { title: 'Propose a clear approach', desc: 'Briefly outline your plan — discovery, design, development, testing, launch.' },
                    { title: 'End with a call-to-action', desc: '"I\'d love to discuss your vision in a quick call. When works for you?"' },
                    { title: 'Keep it concise', desc: '150-300 words. Clients review dozens of proposals — respect their time.' },
                  ].map(item => (
                    <div key={item.title} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DON'T do this */}
              <div className="bg-white rounded-2xl border border-red-200 overflow-hidden">
                <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                    <XCircle className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-red-900">Common Mistakes to Avoid</h3>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { title: 'Generic "Dear Sir/Madam" opening', desc: 'This screams copy-paste. Clients skip these immediately.' },
                    { title: 'Talking only about yourself', desc: '"I have 10 years experience" without connecting it to the client\'s needs.' },
                    { title: 'Not reading the job description', desc: 'If you mention skills the job doesn\'t require, the client knows you didn\'t read.' },
                    { title: 'Underbidding drastically', desc: 'Bidding KES 5,000 on a KES 80,000 job signals desperation, not value.' },
                    { title: 'Writing an essay', desc: 'Proposals over 500 words get skimmed at best. Keep it tight and scannable.' },
                    { title: 'No portfolio or examples', desc: 'Claims without proof are just words. Always attach relevant work samples.' },
                  ].map(item => (
                    <div key={item.title} className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Step by step */}
        <section id="steps" className="py-12 sm:py-20 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                The 6-Step Proposal Process
              </h2>
              <p className="text-lg text-gray-500 max-w-xl mx-auto">
                Follow this proven workflow and you&rsquo;ll write proposals that land jobs consistently
              </p>
            </div>

            <div className="space-y-6">
              {steps.map((step, index) => {
                const colors = stepColors[step.color]
                return (
                  <div key={step.num} className="group">
                    <div className={`relative ${colors.bg} border ${colors.border} rounded-2xl p-6 md:p-8 hover:shadow-md transition-all`}>
                      <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                        <div className={`${colors.icon} w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg`}>
                          <step.icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`text-xs font-bold ${colors.text} uppercase tracking-wider`}>Step {step.num}</span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                          <p className="text-gray-600 leading-relaxed mb-4">{step.desc}</p>
                          <div className={`inline-flex items-center gap-2 ${colors.light} ${colors.text} px-3 py-1.5 rounded-lg text-sm font-medium`}>
                            <Lightbulb className="w-4 h-4" />
                            {step.tip}
                          </div>
                        </div>
                      </div>

                      {index < steps.length - 1 && (
                        <div className="hidden sm:block absolute -bottom-6 left-11 w-0.5 h-6 bg-gray-200" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* AI Proposal Polisher Feature */}
        <section className="py-12 sm:py-20 bg-gradient-to-br from-purple-900 via-indigo-900 to-gray-900 relative overflow-hidden">
          <div className="absolute top-10 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
                  <Bot className="w-4 h-4" />
                  Built-In AI
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-5">
                  AI Proposal <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Polisher</span>
                </h2>
                <p className="text-gray-300 text-lg mb-8 leading-relaxed max-w-md">
                  Write your draft, then let our AI transform it into a client-winning proposal. It analyzes the job requirements and optimizes every word.
                </p>

                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  {[
                    { icon: PenTool, title: 'Grammar & Clarity', desc: 'Fixes errors, improves readability' },
                    { icon: Target, title: 'Keyword Match', desc: 'Aligns with job requirements' },
                    { icon: MessageSquare, title: 'Tone Optimization', desc: 'Professional yet personable' },
                    { icon: TrendingUp, title: 'Persuasion Boost', desc: 'Adds compelling data points' },
                  ].map(f => (
                    <div key={f.title} className="flex items-start gap-3 bg-white/5 rounded-xl p-4">
                      <div className="w-9 h-9 bg-purple-500/20 rounded-lg flex items-center justify-center shrink-0">
                        <f.icon className="w-4 h-4 text-purple-300" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{f.title}</p>
                        <p className="text-xs text-gray-400">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  <Sparkles className="w-5 h-5" />
                  Try It on Your Next Proposal
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Stats cards */}
              <div className="space-y-4">
                {[
                  { value: '40%', label: 'Higher Win Rate', desc: 'Freelancers using AI Polisher win significantly more jobs', icon: TrendingUp, color: 'from-green-500/20 to-emerald-500/20' },
                  { value: '2x', label: 'Faster Client Response', desc: 'Polished proposals get replied to twice as quickly', icon: Zap, color: 'from-blue-500/20 to-cyan-500/20' },
                  { value: '5 min', label: 'Average Time Saved', desc: 'AI does the heavy lifting — you focus on strategy', icon: Clock, color: 'from-purple-500/20 to-pink-500/20' },
                  { value: '95%', label: 'User Satisfaction', desc: 'Freelancers rate the Polisher as their favorite feature', icon: Heart, color: 'from-rose-500/20 to-pink-500/20' },
                ].map(stat => (
                  <div key={stat.label} className={`bg-gradient-to-r ${stat.color} backdrop-blur-sm border border-white/10 rounded-2xl p-5 flex items-center gap-5`}>
                    <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                      <stat.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">{stat.value}</span>
                        <span className="text-sm font-semibold text-white/80">{stat.label}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{stat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Quick tips checklist */}
        <section className="py-12 sm:py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Pre-Submit Checklist
              </h2>
              <p className="text-lg text-gray-500 max-w-xl mx-auto">
                Run through this before hitting Submit. Every winning proposal ticks all these boxes.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {[
                { text: 'I addressed the client by understanding their specific need', critical: true },
                { text: 'I referenced at least 2 requirements from the job description', critical: true },
                { text: 'I included relevant experience or portfolio links', critical: true },
                { text: 'I proposed a clear approach or plan of action', critical: false },
                { text: 'I ran the AI Polisher to optimize grammar and tone', critical: false },
                { text: 'My bid is within the client\'s budget range', critical: true },
                { text: 'My proposal is under 300 words', critical: false },
                { text: 'I ended with a clear call-to-action', critical: false },
                { text: 'I proofread everything one final time', critical: true },
              ].map((item, idx) => (
                <div key={idx} className={`flex items-center gap-4 px-6 py-4 ${idx !== 0 ? 'border-t border-gray-100' : ''} hover:bg-gray-50/50 transition-colors`}>
                  <div className={`w-6 h-6 rounded-md border-2 ${item.critical ? 'border-purple-300 bg-purple-50' : 'border-gray-200'} flex items-center justify-center shrink-0`}>
                    <CheckCircle2 className={`w-4 h-4 ${item.critical ? 'text-purple-500' : 'text-gray-300'}`} />
                  </div>
                  <span className="text-sm text-gray-700 flex-1">{item.text}</span>
                  {item.critical && (
                    <span className="text-[10px] font-semibold bg-purple-50 text-purple-600 border border-purple-200 px-2 py-0.5 rounded-full">Essential</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Navigation between steps */}
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <Link
                href="/how-it-works/find-work"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Prev: Find Work
              </Link>

              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(step => (
                  <div
                    key={step}
                    className={`w-2.5 h-2.5 rounded-full ${step === 3 ? 'bg-purple-600 w-8' : step < 3 ? 'bg-green-400' : 'bg-gray-200'}`}
                  />
                ))}
              </div>

              <Link
                href="/how-it-works/escrow"
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Next: Escrow & Security
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 sm:py-20 bg-gradient-to-br from-purple-600 to-indigo-700">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-5">
              Ready to Land Your First Job?
            </h2>
            <p className="text-purple-100 text-lg mb-8 max-w-xl mx-auto">
              Browse open jobs, craft your proposal with AI, and start earning. Your next client is waiting.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/jobs"
                className="inline-flex items-center justify-center gap-2 bg-white text-purple-700 hover:bg-purple-50 px-8 py-4 rounded-xl font-bold text-lg transition-colors"
              >
                Browse Jobs
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/career-intelligence"
                className="inline-flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-400 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
              >
                <Target className="w-5 h-5" />
                Check Market Rates
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
