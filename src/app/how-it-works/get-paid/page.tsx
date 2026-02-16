'use client'

import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Wallet,
  Zap,
  Clock,
  TrendingUp,
  Shield,
  Smartphone,
  ChevronRight,
  Lightbulb,
  DollarSign,
  Banknote,
  CreditCard,
  ArrowDown,
  BadgeCheck,
  Crown,
  Star,
  Gift,
  Calculator,
  PiggyBank,
} from 'lucide-react'

export default function GetPaidPage() {
  const payoutSteps = [
    {
      num: '01',
      title: 'Client Approves Your Work',
      desc: 'Once you submit deliverables and the client is happy, they hit "Approve". This triggers the escrow release — the money is now yours.',
      icon: CheckCircle2,
      color: 'green',
      tip: 'Deliver clean, organized work to speed up approval.',
    },
    {
      num: '02',
      title: 'Funds Released to Your Wallet',
      desc: 'The escrowed amount (minus the small service fee) is instantly credited to your HustleKE wallet. You can see the balance update in real time.',
      icon: Wallet,
      color: 'blue',
      tip: 'Pro members pay only 4% fee vs 6% on the free plan.',
    },
    {
      num: '03',
      title: 'Withdraw to M-Pesa',
      desc: 'Hit "Withdraw" from your wallet dashboard, enter your M-Pesa phone number and amount. The transfer initiates immediately via Safaricom\'s STK push.',
      icon: Smartphone,
      color: 'emerald',
      tip: 'Withdrawals are available 24/7, including weekends and holidays.',
    },
    {
      num: '04',
      title: 'Money in Your M-Pesa',
      desc: 'You receive the M-Pesa confirmation SMS within seconds. The money is yours to use, save, or reinvest — no holding periods, no minimum thresholds.',
      icon: Zap,
      color: 'amber',
      tip: 'No minimum withdrawal — withdraw even KES 100 if you want.',
    },
  ]

  const stepColors: Record<string, { bg: string; icon: string; border: string; text: string; light: string }> = {
    green: { bg: 'bg-green-50', icon: 'bg-green-600', border: 'border-green-200', text: 'text-green-600', light: 'bg-green-100' },
    blue: { bg: 'bg-blue-50', icon: 'bg-blue-600', border: 'border-blue-200', text: 'text-blue-600', light: 'bg-blue-100' },
    emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-600', border: 'border-emerald-200', text: 'text-emerald-600', light: 'bg-emerald-100' },
    amber: { bg: 'bg-amber-50', icon: 'bg-amber-600', border: 'border-amber-200', text: 'text-amber-600', light: 'bg-amber-100' },
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header activeLink="/how-it-works" />

      <main className="flex-1">
        {/* Hero — Split layout with M-Pesa mockup */}
        <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          </div>
          <div className="absolute top-20 right-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                  <Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-emerald-400 font-medium">Get Paid</span>
                </nav>

                <div className="inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-400 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
                  <Banknote className="w-4 h-4" />
                  Step 5 of 5 — The Best Part
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
                  Get Paid to Your
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300"> M-Pesa Instantly</span>
                </h1>

                <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-lg">
                  No 14-day waiting periods. No bank transfers. No PayPal headaches. Your money goes straight to M-Pesa the moment the client approves — in under 60 seconds.
                </p>

                <div className="flex flex-wrap gap-4 mb-8">
                  <Link
                    href="/signup?type=freelancer"
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-7 py-3.5 rounded-xl font-semibold transition-colors"
                  >
                    Start Earning Now
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <a
                    href="#payout-flow"
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-7 py-3.5 rounded-xl font-medium transition-colors"
                  >
                    See the Payout Flow
                  </a>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>Under 60 Seconds</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>Direct to M-Pesa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>Available 24/7</span>
                  </div>
                </div>
              </div>

              {/* Right — Wallet + M-Pesa mockup */}
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-3xl blur-xl" />
                  <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm mx-auto">
                    {/* Wallet header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-5 text-white">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-emerald-100">Your Wallet</span>
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">Pro Member</span>
                      </div>
                      <div className="text-3xl font-bold">KES 147,500</div>
                      <div className="text-xs text-emerald-200 mt-1">Available Balance</div>
                    </div>

                    <div className="px-6 py-5 space-y-4">
                      {/* Recent transaction */}
                      <div>
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Latest Transaction</span>
                        <div className="mt-2 bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                            <ArrowDown className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">Escrow Released</p>
                            <p className="text-[10px] text-gray-500">E-commerce Redesign · 2 min ago</p>
                          </div>
                          <span className="text-sm font-bold text-green-600">+KES 91,200</span>
                        </div>
                      </div>

                      {/* M-Pesa withdraw */}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Smartphone className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-semibold text-gray-900">Withdraw to M-Pesa</span>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 font-medium">
                            KES 91,200
                          </div>
                          <button className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5" />
                            Withdraw
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          Arrives in your M-Pesa in under 60 seconds
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Speed stats */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { value: '< 60s', label: 'Payout Speed', desc: 'From approval to M-Pesa', icon: Zap, color: 'bg-emerald-50 border-emerald-200' },
                { value: '6%', label: 'Service Fee', desc: 'Lowest in the industry (4% Pro)', icon: DollarSign, color: 'bg-amber-50 border-amber-200' },
                { value: '24/7', label: 'Availability', desc: 'Withdraw anytime, any day', icon: Clock, color: 'bg-blue-50 border-blue-200' },
                { value: 'KES 0', label: 'Minimum Withdrawal', desc: 'No minimum threshold', icon: PiggyBank, color: 'bg-purple-50 border-purple-200' },
              ].map(stat => (
                <div key={stat.label} className={`${stat.color} border rounded-2xl p-6`}>
                  <div className="flex items-center gap-3 mb-3">
                    <stat.icon className="w-5 h-5 text-gray-600" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{stat.label}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-0.5">{stat.value}</div>
                  <p className="text-xs text-gray-500">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Payout flow step-by-step */}
        <section id="payout-flow" className="py-20 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                From Approval to <span className="text-emerald-600">M-Pesa</span> — In Seconds
              </h2>
              <p className="text-lg text-gray-500 max-w-xl mx-auto">
                The fastest payout system on any freelance platform in Kenya
              </p>
            </div>

            <div className="space-y-6">
              {payoutSteps.map((step, index) => {
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
                      {index < payoutSteps.length - 1 && (
                        <div className="hidden sm:block absolute -bottom-6 left-11 w-0.5 h-6 bg-gray-200" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Fee comparison — HustleKE vs competitors */}
        <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
          <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <Calculator className="w-4 h-4" />
                The Math Speaks for Itself
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Keep More of What You Earn
              </h2>
              <p className="text-lg text-gray-400 max-w-xl mx-auto">
                See how much more you take home on HustleKE vs other platforms
              </p>
            </div>

            {/* Earnings comparison table */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-4 text-center border-b border-white/10">
                <div className="p-4 text-sm font-semibold text-gray-400">Project Value</div>
                <div className="p-4 text-sm font-semibold text-gray-400">WorkBridge (20%)</div>
                <div className="p-4 text-sm font-semibold text-gray-400">GigVault (20%)</div>
                <div className="p-4 bg-emerald-500/10 border-x border-emerald-500/20">
                  <span className="text-sm font-bold text-emerald-400">HustleKE (6%)</span>
                </div>
              </div>
              {[
                { project: 'KES 10,000', workbridge: 'KES 8,000', gigvault: 'KES 8,000', hustle: 'KES 9,400', save: '1,400' },
                { project: 'KES 50,000', workbridge: 'KES 40,000', gigvault: 'KES 40,000', hustle: 'KES 47,000', save: '7,000' },
                { project: 'KES 100,000', workbridge: 'KES 80,000', gigvault: 'KES 80,000', hustle: 'KES 94,000', save: '14,000' },
                { project: 'KES 500,000', workbridge: 'KES 400,000', gigvault: 'KES 400,000', hustle: 'KES 470,000', save: '70,000' },
              ].map((row, i) => (
                <div key={i} className={`grid grid-cols-4 text-center ${i !== 0 ? 'border-t border-white/5' : ''}`}>
                  <div className="p-4 text-sm text-white font-medium">{row.project}</div>
                  <div className="p-4 text-sm text-gray-400">{row.workbridge}</div>
                  <div className="p-4 text-sm text-gray-400">{row.gigvault}</div>
                  <div className="p-4 bg-emerald-500/10 border-x border-emerald-500/20">
                    <span className="text-sm font-bold text-emerald-400">{row.hustle}</span>
                    <span className="block text-[10px] text-emerald-500/70 mt-0.5">Save KES {row.save}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-400">
                With <span className="text-white font-semibold">HustleKE Pro (4%)</span>, you save even more — up to <span className="text-emerald-400 font-semibold">KES 80,000+</span> per year.
              </p>
            </div>
          </div>
        </section>

        {/* Payment methods + Pro benefits */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Why M-Pesa */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="bg-emerald-50 px-6 py-5 border-b border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-emerald-900">Why M-Pesa?</h3>
                      <p className="text-xs text-emerald-600">Built for how Kenyans move money</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { title: 'Instant access', desc: 'Money lands in your M-Pesa in seconds — no bank processing delays.' },
                    { title: 'No bank account needed', desc: 'You just need a Safaricom line. No bank paperwork, no Swift codes.' },
                    { title: 'Spend anywhere', desc: 'Pay bills, send to friends, buy goods — M-Pesa works everywhere in Kenya.' },
                    { title: 'Available 24/7/365', desc: 'Withdraw at 3am on Christmas Day if you want. No business hours restriction.' },
                    { title: 'Familiar and trusted', desc: '30+ million Kenyans use M-Pesa daily. It\'s the way Kenya moves money.' },
                  ].map(item => (
                    <div key={item.title} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro earnings boost */}
              <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-2xl p-8 text-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Crown className="w-5 h-5 text-yellow-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Earn More with Pro</h3>
                    <p className="text-xs text-emerald-200">KES 500/month — pays for itself in one job</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {[
                    { title: '4% service fee (vs 6%)', desc: 'Keep an extra 2% on every single payout', icon: DollarSign },
                    { title: '20 proposals/day', desc: 'Double the daily limit vs free plan', icon: TrendingUp },
                    { title: 'Priority in search', desc: 'Your proposals shown first to clients', icon: Star },
                    { title: 'Pro badge on profile', desc: 'Instant credibility boost with clients', icon: BadgeCheck },
                  ].map(benefit => (
                    <div key={benefit.title} className="flex items-start gap-3 bg-white/10 rounded-xl p-4">
                      <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center shrink-0">
                        <benefit.icon className="w-4 h-4 text-emerald-200" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{benefit.title}</p>
                        <p className="text-xs text-emerald-200">{benefit.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white/10 rounded-xl p-4 mb-6">
                  <p className="text-sm">
                    <span className="font-bold">Quick math:</span> On a KES 50,000 job, Pro saves you KES 1,000 in fees. That&rsquo;s 2x the monthly subscription cost — in one job.
                  </p>
                </div>

                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 px-6 py-3 rounded-xl font-semibold transition-colors w-full justify-center"
                >
                  <Crown className="w-5 h-5" />
                  Upgrade to Pro
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <Link
                href="/how-it-works/escrow"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Prev: Escrow & Security
              </Link>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(step => (
                  <div key={step} className={`w-2.5 h-2.5 rounded-full ${step === 5 ? 'bg-emerald-600 w-8' : 'bg-green-400'}`} />
                ))}
              </div>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Back to Overview
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-br from-emerald-600 to-green-700">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-5">
              Ready to Get Paid for Your Skills?
            </h2>
            <p className="text-emerald-100 text-lg mb-8 max-w-xl mx-auto">
              Join the platform that pays freelancers the fastest and takes the least. Your first payout is just one job away.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup?type=freelancer"
                className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 px-8 py-4 rounded-xl font-bold text-lg transition-colors"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/jobs"
                className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
              >
                <Banknote className="w-5 h-5" />
                Find Paying Jobs
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
