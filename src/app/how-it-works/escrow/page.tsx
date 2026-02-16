'use client'

import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import {
  Shield,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Wallet,
  FileText,
  Clock,
  ShieldCheck,
  ChevronRight,
  Lightbulb,
  Zap,
  DollarSign,
  Users,
  AlertTriangle,
  Scale,
  Eye,
  MessageSquare,
  Smartphone,
  ArrowDown,
  Ban,
  HandshakeIcon,
  Banknote,
} from 'lucide-react'

export default function EscrowPage() {
  const escrowFlow = [
    {
      num: '01',
      title: 'Client Accepts Proposal',
      desc: 'When a client accepts your proposal, they fund the escrow by paying the agreed amount from their wallet via M-Pesa. The money is held securely — neither party can touch it.',
      icon: HandshakeIcon,
      color: 'blue',
      who: 'Client action',
      tip: 'Funds are deducted from the client\'s wallet instantly.',
    },
    {
      num: '02',
      title: 'Funds Held in Escrow',
      desc: 'The payment sits in a secure escrow account with status "Held". The freelancer can see the funds are locked and ready. This gives both parties confidence to proceed.',
      icon: Lock,
      color: 'amber',
      who: 'Automatic',
      tip: 'You can track escrow status anytime from your dashboard.',
    },
    {
      num: '03',
      title: 'Freelancer Delivers Work',
      desc: 'You complete the project and submit your deliverables. The client receives a notification to review your work. Take your time — the money is safely waiting.',
      icon: FileText,
      color: 'purple',
      who: 'Freelancer action',
      tip: 'Submit clean, well-organized deliverables for faster approval.',
    },
    {
      num: '04',
      title: 'Client Reviews & Approves',
      desc: 'The client reviews the submitted work. If satisfied, they approve and trigger the release. If revisions are needed, they can request changes before approving.',
      icon: Eye,
      color: 'green',
      who: 'Client action',
      tip: 'Most clients approve within 24-48 hours.',
    },
    {
      num: '05',
      title: 'Funds Released Instantly',
      desc: 'Upon approval, the escrowed funds are released to your wallet minus the small service fee (6% Free, 4% Pro). You can withdraw to M-Pesa immediately.',
      icon: Zap,
      color: 'emerald',
      who: 'Automatic',
      tip: 'Pro members pay only 4% — saving up to KES 40K+ annually.',
    },
  ]

  const stepColors: Record<string, { bg: string; icon: string; border: string; text: string; light: string }> = {
    blue: { bg: 'bg-blue-50', icon: 'bg-blue-600', border: 'border-blue-200', text: 'text-blue-600', light: 'bg-blue-100' },
    amber: { bg: 'bg-amber-50', icon: 'bg-amber-600', border: 'border-amber-200', text: 'text-amber-600', light: 'bg-amber-100' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-600', border: 'border-purple-200', text: 'text-purple-600', light: 'bg-purple-100' },
    green: { bg: 'bg-green-50', icon: 'bg-green-600', border: 'border-green-200', text: 'text-green-600', light: 'bg-green-100' },
    emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-600', border: 'border-emerald-200', text: 'text-emerald-600', light: 'bg-emerald-100' },
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header activeLink="/how-it-works" />

      <main className="flex-1">
        {/* Hero — Split layout with escrow flow visual */}
        <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          </div>
          <div className="absolute top-20 right-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                  <Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-amber-400 font-medium">Escrow & Security</span>
                </nav>

                <div className="inline-flex items-center gap-2 bg-amber-500/15 text-amber-400 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
                  <Shield className="w-4 h-4" />
                  Step 4 of 5
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
                  Your Money is
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300"> Always Protected</span>
                </h1>

                <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-lg">
                  Our M-Pesa escrow system guarantees freelancers get paid for completed work and clients only pay when satisfied. No more trust issues.
                </p>

                <div className="flex flex-wrap gap-4 mb-8">
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 px-7 py-3.5 rounded-xl font-semibold transition-colors"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <a
                    href="#flow"
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-7 py-3.5 rounded-xl font-medium transition-colors"
                  >
                    See How It Works
                  </a>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Bank-Level Security</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-amber-400" />
                    <span>M-Pesa Powered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-400" />
                    <span>Fair Disputes</span>
                  </div>
                </div>
              </div>

              {/* Right — Escrow status mockup */}
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-br from-amber-500/20 to-green-500/20 rounded-3xl blur-xl" />
                  <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm mx-auto">
                    <div className="bg-gray-50 border-b border-gray-100 px-6 py-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Escrow Transaction</span>
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Held</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">E-commerce Website Redesign</h3>
                    </div>

                    <div className="px-6 py-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Amount Held</span>
                        <span className="text-xl font-bold text-gray-900">KES 95,000</span>
                      </div>

                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Lock className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-semibold text-amber-800">Escrow Timeline</span>
                        </div>
                        <div className="space-y-3">
                          {[
                            { label: 'Funded by client', time: '2 days ago', done: true },
                            { label: 'Work in progress', time: 'Now', done: true },
                            { label: 'Awaiting delivery', time: 'Pending', done: false },
                            { label: 'Release to freelancer', time: 'After approval', done: false },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${item.done ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
                                {item.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </div>
                              <div className="flex-1">
                                <span className={`text-xs ${item.done ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{item.label}</span>
                              </div>
                              <span className="text-[10px] text-gray-400">{item.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Protected by HustleKE Escrow</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Protection for both sides */}
        <section className="py-12 sm:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Protection for <span className="text-amber-600">Everyone</span>
              </h2>
              <p className="text-lg text-gray-500 max-w-xl mx-auto">
                Escrow eliminates the biggest fear in freelancing — not getting paid. And for clients, the fear of paying for bad work.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Freelancer protection */}
              <div className="bg-white rounded-2xl border border-green-200 overflow-hidden">
                <div className="bg-green-50 px-6 py-5 border-b border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-900">For Freelancers</h3>
                      <p className="text-xs text-green-600">Your work always gets compensated</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { title: 'Guaranteed payment', desc: 'Money is locked before you start. No more "I\'ll pay you later" situations.' },
                    { title: 'No chasing invoices', desc: 'The payment is already in escrow — you never need to follow up for money.' },
                    { title: 'Dispute protection', desc: 'If a client rejects unfairly, our team mediates and can release funds to you.' },
                    { title: 'Clear milestones', desc: 'Large projects can be split into milestones with separate escrow payments.' },
                    { title: 'Instant M-Pesa payout', desc: 'Once released, money hits your M-Pesa in under 60 seconds.' },
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

              {/* Client protection */}
              <div className="bg-white rounded-2xl border border-blue-200 overflow-hidden">
                <div className="bg-blue-50 px-6 py-5 border-b border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-blue-900">For Clients</h3>
                      <p className="text-xs text-blue-600">You only pay for quality work</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { title: 'Pay only when satisfied', desc: 'Review deliverables before releasing payment. No risk of paying for incomplete work.' },
                    { title: 'Request revisions', desc: 'If the work needs changes, request revisions before approving the release.' },
                    { title: 'Full refund option', desc: 'If the freelancer doesn\'t deliver, you can request a full refund of escrowed funds.' },
                    { title: 'Transparent tracking', desc: 'See exactly where your money is at every stage — funded, held, released, or refunded.' },
                    { title: 'Dispute resolution', desc: 'Our admin team investigates disputes impartially and can split or refund payments.' },
                  ].map(item => (
                    <div key={item.title} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
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

        {/* Escrow flow step-by-step */}
        <section id="flow" className="py-12 sm:py-20 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                The Escrow Flow — Step by Step
              </h2>
              <p className="text-lg text-gray-500 max-w-xl mx-auto">
                From proposal acceptance to payout — here&rsquo;s exactly how your money moves
              </p>
            </div>

            <div className="space-y-6">
              {escrowFlow.map((step, index) => {
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
                            <span className="text-[10px] bg-white/80 text-gray-500 px-2 py-0.5 rounded-full font-medium border border-gray-200">{step.who}</span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                          <p className="text-gray-600 leading-relaxed mb-4">{step.desc}</p>
                          <div className={`inline-flex items-center gap-2 ${colors.light} ${colors.text} px-3 py-1.5 rounded-lg text-sm font-medium`}>
                            <Lightbulb className="w-4 h-4" />
                            {step.tip}
                          </div>
                        </div>
                      </div>
                      {index < escrowFlow.length - 1 && (
                        <div className="hidden sm:block absolute -bottom-6 left-11 w-0.5 h-6 bg-gray-200" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Dispute resolution */}
        <section className="py-12 sm:py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
          <div className="absolute top-10 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-red-500/10 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 bg-amber-500/15 text-amber-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <Scale className="w-4 h-4" />
                Fair & Transparent
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                What If There&rsquo;s a Dispute?
              </h2>
              <p className="text-lg text-gray-400 max-w-xl mx-auto">
                It rarely happens, but when it does, we have a fair process to resolve it
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: AlertTriangle,
                  title: 'Dispute Filed',
                  desc: 'Either party can open a dispute from the dashboard. The escrow stays locked and both sides submit their evidence.',
                  color: 'from-red-500/20 to-orange-500/20',
                },
                {
                  icon: Eye,
                  title: 'Admin Reviews',
                  desc: 'Our team reviews the deliverables, chat history, job requirements, and both parties\' evidence. We assess the situation impartially.',
                  color: 'from-amber-500/20 to-yellow-500/20',
                },
                {
                  icon: Scale,
                  title: 'Fair Resolution',
                  desc: 'We can release funds to the freelancer, refund the client, or split the amount. Both parties are notified with a clear explanation.',
                  color: 'from-green-500/20 to-emerald-500/20',
                },
              ].map(item => (
                <div key={item.title} className={`bg-gradient-to-br ${item.color} backdrop-blur-sm border border-white/10 rounded-2xl p-6`}>
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 bg-white/5 border border-white/10 rounded-2xl p-6 max-w-2xl mx-auto text-center">
              <p className="text-sm text-gray-400">
                <span className="text-amber-400 font-semibold">Less than 2%</span> of transactions on HustleKE result in disputes. Our escrow system creates trust that prevents most conflicts before they start.
              </p>
            </div>
          </div>
        </section>

        {/* Fee comparison */}
        <section className="py-12 sm:py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Transparent, <span className="text-amber-600">Low Fees</span>
              </h2>
              <p className="text-lg text-gray-500 max-w-xl mx-auto">
                We charge a small service fee only when escrow is released. No hidden charges, ever.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-visible">
              <div className="grid grid-cols-3 text-center divide-x divide-gray-100">
                <div className="p-8 bg-gray-50 rounded-l-2xl">
                  <div className="text-3xl font-bold text-gray-400 mb-1 line-through">10-20%</div>
                  <div className="text-sm text-gray-500 font-medium">Other Platforms</div>
                  <div className="text-xs text-gray-400 mt-2">Other global platforms</div>
                </div>
                <div className="pt-10 pb-8 px-8 bg-amber-50 border-2 border-amber-200 relative overflow-visible">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full z-10">BEST VALUE</div>
                  <div className="text-3xl font-bold text-amber-600 mb-1">6%</div>
                  <div className="text-sm text-amber-700 font-semibold">HustleKE Free</div>
                  <div className="text-xs text-amber-600 mt-2">Standard plan</div>
                </div>
                <div className="p-8 bg-green-50">
                  <div className="text-3xl font-bold text-green-600 mb-1">4%</div>
                  <div className="text-sm text-green-700 font-semibold">HustleKE Pro</div>
                  <div className="text-xs text-green-600 mt-2">KES 500/month</div>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  On a KES 100,000 project: you keep <span className="font-semibold text-gray-900">KES 94,000</span> (Free) or <span className="font-semibold text-green-600">KES 96,000</span> (Pro) — compared to only KES 80,000 on other platforms.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <Link
                href="/how-it-works/submit-proposals"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Prev: Submit Proposals
              </Link>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(step => (
                  <div key={step} className={`w-2.5 h-2.5 rounded-full ${step === 4 ? 'bg-amber-500 w-8' : step < 4 ? 'bg-green-400' : 'bg-gray-200'}`} />
                ))}
              </div>
              <Link
                href="/how-it-works/get-paid"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Next: Get Paid
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 sm:py-20 bg-gradient-to-br from-green-600 to-emerald-700">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-5">
              Work With Zero Payment Risk
            </h2>
            <p className="text-green-100 text-lg mb-8 max-w-xl mx-auto">
              Every job on HustleKE is protected by escrow. Start working with confidence today.
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
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
              >
                <DollarSign className="w-5 h-5" />
                Compare Plans
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
