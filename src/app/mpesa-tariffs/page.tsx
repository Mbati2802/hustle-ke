'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { usePageContent } from '@/hooks/usePageContent'
import {
  Smartphone,
  ArrowDown,
  Info,
  CheckCircle2,
  Calculator,
  Wallet,
  Shield,
  Crown,
  Zap,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Send,
  Clock,
  DollarSign,
  TrendingDown,
  BadgeCheck,
  Sparkles,
} from 'lucide-react'

const TARIFF_BANDS = [
  { min: 1, max: 100, charge: 0 },
  { min: 101, max: 500, charge: 7 },
  { min: 501, max: 1000, charge: 13 },
  { min: 1001, max: 1500, charge: 23 },
  { min: 1501, max: 2500, charge: 33 },
  { min: 2501, max: 3500, charge: 51 },
  { min: 3501, max: 5000, charge: 55 },
  { min: 5001, max: 7500, charge: 75 },
  { min: 7501, max: 10000, charge: 87 },
  { min: 10001, max: 15000, charge: 97 },
  { min: 15001, max: 20000, charge: 102 },
  { min: 20001, max: 25000, charge: 105 },
  { min: 25001, max: 30000, charge: 105 },
  { min: 30001, max: 35000, charge: 105 },
  { min: 35001, max: 50000, charge: 105 },
  { min: 50001, max: 150000, charge: 108 },
]

function getCharge(amount: number): number {
  const band = TARIFF_BANDS.find(b => amount >= b.min && amount <= b.max)
  return band ? band.charge : 0
}

function formatKES(n: number): string {
  return n.toLocaleString('en-KE')
}

const defaultContent = {
  hero_title: 'M-Pesa Withdrawal Tariffs',
  hero_subtitle: 'Transparent pricing. Know exactly what you\'ll receive when withdrawing your earnings via M-Pesa.',
  disclaimer: 'The charges below are standard Safaricom M-Pesa transaction fees. HustleKE does NOT add any withdrawal fees on top.',
  last_updated: 'February 2026',
}

const FAQS = [
  {
    q: 'Does HustleKE charge any withdrawal fees?',
    a: 'No. HustleKE charges zero withdrawal fees. The only charges that apply when you withdraw are standard Safaricom M-Pesa transaction fees, which go directly to Safaricom — not to us.',
  },
  {
    q: 'What is the maximum I can withdraw at once?',
    a: 'The M-Pesa transaction limit is KES 150,000 per transaction and KES 300,000 per day. If your balance exceeds this, you can make multiple withdrawals.',
  },
  {
    q: 'How long does a withdrawal take?',
    a: 'Withdrawals are processed instantly via M-Pesa STK push. You\'ll receive the money in your M-Pesa account within seconds of confirming the transaction on your phone.',
  },
  {
    q: 'Can I withdraw to a different M-Pesa number?',
    a: 'For security reasons, withdrawals are sent to the M-Pesa number registered on your HustleKE account. You can update your number in Dashboard > Settings.',
  },
  {
    q: 'What is the minimum withdrawal amount?',
    a: 'The minimum withdrawal amount is KES 50. Withdrawals of KES 1-100 have zero M-Pesa charges, so small withdrawals are completely free.',
  },
  {
    q: 'How does the HustleKE service fee work?',
    a: 'The service fee (6% Free plan, 4% Pro plan) is deducted when a project is completed and escrow is released — not during withdrawal. So the balance in your wallet is already yours to withdraw.',
  },
]

export default function MpesaTariffsPage() {
  const content = usePageContent('mpesa-tariffs', defaultContent)
  const [calcAmount, setCalcAmount] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const calcResult = useMemo(() => {
    const amount = parseInt(calcAmount.replace(/,/g, ''))
    if (!amount || amount < 1 || amount > 150000) return null
    const charge = getCharge(amount)
    return {
      amount,
      charge,
      received: amount - charge,
      percentage: amount > 0 ? ((charge / amount) * 100).toFixed(1) : '0',
    }
  }, [calcAmount])

  const activeIndex = useMemo(() => {
    if (!calcResult) return -1
    return TARIFF_BANDS.findIndex(b => calcResult.amount >= b.min && calcResult.amount <= b.max)
  }, [calcResult])

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
          <div className="absolute bottom-0 left-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                  <Smartphone className="w-4 h-4" />
                  Safaricom M-Pesa
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
                  {content.hero_title}
                </h1>
                <p className="text-gray-400 text-lg mb-8 leading-relaxed max-w-lg">
                  {content.hero_subtitle}
                </p>

                <div className="flex flex-wrap gap-4 mb-8">
                  {[
                    { icon: Shield, text: 'Zero HustleKE fees', color: 'text-green-400' },
                    { icon: Zap, text: 'Instant withdrawal', color: 'text-amber-400' },
                    { icon: BadgeCheck, text: 'Safaricom rates only', color: 'text-blue-400' },
                  ].map(item => (
                    <div key={item.text} className="flex items-center gap-2 bg-white/5 px-4 py-2.5 rounded-xl border border-white/10">
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                      <span className="text-sm text-gray-300">{item.text}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-colors"
                >
                  <Calculator className="w-4 h-4" />
                  Try the Fee Calculator
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'KES 0', label: 'HustleKE Withdrawal Fee', desc: 'We never charge for withdrawals', icon: Wallet, color: 'text-green-400' },
                  { value: 'Instant', label: 'Processing Time', desc: 'M-Pesa STK push — seconds', icon: Clock, color: 'text-amber-400' },
                  { value: '6% / 4%', label: 'Service Fee', desc: 'Free plan / Pro plan', icon: DollarSign, color: 'text-blue-400' },
                  { value: '150K', label: 'Max Per Transaction', desc: 'KES 300K daily limit', icon: TrendingDown, color: 'text-purple-400' },
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

        {/* Calculator + Tariff Table — Two Columns */}
        <section className="py-16 bg-gray-50" id="calculator">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <Calculator className="w-4 h-4" />
                Fee Calculator &amp; Tariff Schedule
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Know Exactly What You&apos;ll Receive
              </h2>
              <p className="text-gray-500 max-w-lg mx-auto">Enter the amount you want to withdraw and see the exact M-Pesa charge. The matching tariff band highlights automatically.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 items-start">
              {/* Left — Calculator */}
              <div className="lg:sticky lg:top-24">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-900 px-6 py-3">
                    <h3 className="text-white font-bold text-sm flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-green-400" />
                      Withdrawal Calculator
                    </h3>
                  </div>
                  <div className="p-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (KES)</label>
                    <div className="relative mb-5">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">KES</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={calcAmount}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9]/g, '')
                          setCalcAmount(raw ? parseInt(raw).toLocaleString('en-KE') : '')
                        }}
                        placeholder="e.g. 5,000"
                        className="w-full pl-14 pr-4 py-3.5 text-xl font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/50 focus:border-green-300"
                      />
                    </div>

                    {calcResult && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                          <span className="text-sm text-gray-500">You Withdraw</span>
                          <span className="text-lg font-bold text-gray-900">KES {formatKES(calcResult.amount)}</span>
                        </div>
                        <div className="flex items-center justify-between bg-red-50 rounded-xl px-4 py-3 border border-red-100">
                          <div>
                            <span className="text-sm text-red-500">M-Pesa Charge</span>
                            <span className="text-[10px] text-red-400 ml-1.5">({calcResult.percentage}%)</span>
                          </div>
                          <span className="text-lg font-bold text-red-600">
                            {calcResult.charge === 0 ? 'FREE' : `- KES ${formatKES(calcResult.charge)}`}
                          </span>
                        </div>
                        <div className="h-px bg-gray-200" />
                        <div className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-3.5 border-2 border-green-200">
                          <span className="text-sm font-semibold text-green-700">You Receive</span>
                          <span className="text-xl font-bold text-green-700">KES {formatKES(calcResult.received)}</span>
                        </div>
                      </div>
                    )}

                    {!calcResult && calcAmount === '' && (
                      <div className="text-center py-8 text-gray-400">
                        <Calculator className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Enter an amount to see the breakdown</p>
                      </div>
                    )}

                    {calcAmount !== '' && !calcResult && (
                      <div className="text-center py-4">
                        <p className="text-sm text-red-500 font-medium">Enter between KES 1 and KES 150,000</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 border-t border-blue-100 px-5 py-2.5 flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-blue-600">{content.disclaimer}</p>
                  </div>
                </div>
              </div>

              {/* Right — Tariff Table */}
              <div>
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="bg-gray-900 px-6 py-3 flex items-center justify-between">
                    <h3 className="text-white font-bold text-sm">Full Tariff Schedule</h3>
                    <span className="text-xs text-gray-400">Safaricom M-Pesa</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Range (KES)</th>
                          <th className="text-right px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Charge</th>
                          <th className="text-right px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {TARIFF_BANDS.map((band, i) => {
                          const isActive = i === activeIndex
                          const midpoint = Math.round((band.min + band.max) / 2)
                          const rate = band.charge > 0 ? ((band.charge / midpoint) * 100).toFixed(1) : '0'
                          return (
                            <tr
                              key={i}
                              className={`border-b border-gray-100 transition-colors ${
                                isActive
                                  ? 'bg-green-50 border-green-200'
                                  : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                              }`}
                            >
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  {isActive && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />}
                                  <span className={`text-sm ${isActive ? 'font-bold text-green-700' : 'text-gray-700'}`}>
                                    {formatKES(band.min)} — {formatKES(band.max)}
                                  </span>
                                </div>
                              </td>
                              <td className={`px-4 py-2.5 text-right text-sm font-semibold ${
                                band.charge === 0 ? 'text-green-600' : isActive ? 'text-green-700' : 'text-gray-900'
                              }`}>
                                {band.charge === 0 ? (
                                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[11px] font-bold">
                                    <CheckCircle2 className="w-3 h-3" /> FREE
                                  </span>
                                ) : `KES ${formatKES(band.charge)}`}
                              </td>
                              <td className={`px-4 py-2.5 text-right text-sm ${isActive ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                                {band.charge === 0 ? '0%' : `~${rate}%`}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-gray-50 border-t border-gray-200 px-4 py-2.5">
                    <p className="text-[11px] text-gray-400 text-center">
                      Last updated: {content.last_updated}. Rates set by Safaricom.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How Withdrawals Work */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">How Withdrawals Work</h2>
              <p className="text-gray-500 max-w-lg mx-auto">From your HustleKE wallet to your M-Pesa in seconds. Here&apos;s the full flow.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  title: 'Complete a Project',
                  desc: 'Deliver work, get client approval. Escrow funds are released to your HustleKE wallet minus the service fee.',
                  icon: CheckCircle2,
                  color: 'from-blue-500 to-indigo-600',
                },
                {
                  step: '02',
                  title: 'Go to Wallet',
                  desc: 'Open Dashboard > Wallet. You\'ll see your available balance — this is already yours after service fee.',
                  icon: Wallet,
                  color: 'from-green-500 to-emerald-600',
                },
                {
                  step: '03',
                  title: 'Enter Amount',
                  desc: 'Tap Withdraw, enter the amount, and confirm your M-Pesa number. An STK push is sent to your phone.',
                  icon: Smartphone,
                  color: 'from-amber-500 to-orange-600',
                },
                {
                  step: '04',
                  title: 'Receive Money',
                  desc: 'Enter your M-Pesa PIN on your phone. Money arrives instantly. Only standard Safaricom charges apply.',
                  icon: Sparkles,
                  color: 'from-purple-500 to-pink-600',
                },
              ].map(item => (
                <div key={item.step} className="relative bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow group">
                  <div className="absolute -top-3 left-6">
                    <span className={`bg-gradient-to-r ${item.color} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                      Step {item.step}
                    </span>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-4 mt-2 shadow-lg group-hover:scale-105 transition-transform`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1.5">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Fee Comparison + FAQ — Two Column Layout */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-5 gap-10">
              {/* Left — Competitors (3 cols) */}
              <div className="lg:col-span-3">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">HustleKE vs Competitors</h2>
                    <p className="text-sm text-gray-500">See why Kenyan freelancers pay less here</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {[
                    { name: 'HustleKE', plan: 'Free Plan', fee: '6%', withdrawal: 'KES 0', method: 'M-Pesa', highlight: true, icon: '🇰🇪' },
                    { name: 'HustleKE', plan: 'Pro Plan', fee: '4%', withdrawal: 'KES 0', method: 'M-Pesa', highlight: true, icon: '👑' },
                    { name: 'WorkBridge', plan: '', fee: '10%', withdrawal: '$1-30', method: 'Wire / PayPal', highlight: false, icon: '' },
                    { name: 'GigVault', plan: '', fee: '20%', withdrawal: '$1-5', method: 'PayPal / Bank', highlight: false, icon: '' },
                    { name: 'LancePro', plan: '', fee: '10-13%', withdrawal: '$5-25', method: 'Wire / PayPal', highlight: false, icon: '' },
                  ].map(row => (
                    <div
                      key={row.name + row.plan}
                      className={`flex items-center gap-4 rounded-xl px-5 py-4 border transition-colors ${
                        row.highlight
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {row.icon && <span className="text-base">{row.icon}</span>}
                          <span className={`font-bold text-sm ${row.highlight ? 'text-green-700' : 'text-gray-700'}`}>
                            {row.name}
                          </span>
                          {row.plan && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              row.plan === 'Pro Plan' ? 'bg-green-200 text-green-800' : 'bg-green-100 text-green-700'
                            }`}>{row.plan}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{row.method}</p>
                      </div>

                      <div className="text-center px-3">
                        <p className={`text-lg font-bold ${row.highlight ? 'text-green-600' : 'text-gray-900'}`}>{row.fee}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-semibold">Service</p>
                      </div>

                      <div className="text-center px-3">
                        <p className={`text-lg font-bold ${row.withdrawal === 'KES 0' ? 'text-green-600' : 'text-red-500'}`}>
                          {row.withdrawal === 'KES 0' ? 'Free' : row.withdrawal}
                        </p>
                        <p className="text-[10px] text-gray-400 uppercase font-semibold">Withdraw</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Savings Callout */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center shrink-0">
                      <DollarSign className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="font-bold text-lg mb-1">Save up to 80% on fees</p>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        On a KES 50,000 project — HustleKE charges KES 3,000 (6%) or KES 2,000 (Pro 4%). Other platforms charge up to KES 10,000 (20%). That&apos;s <strong className="text-green-400">KES 7,000–8,000</strong> more in your pocket.
                      </p>
                      <Link href="/pricing" className="inline-flex items-center gap-1.5 text-green-400 font-semibold text-sm mt-3 hover:text-green-300 transition-colors">
                        Compare all plans <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right — FAQ (2 cols) */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Common Questions</h2>
                    <p className="text-sm text-gray-500">Quick answers about fees &amp; withdrawals</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {FAQS.map((faq, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                      <button
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors ${
                          openFaq === i ? 'bg-green-50' : 'hover:bg-gray-100'
                        }`}
                      >
                        <span className={`font-semibold text-sm pr-3 ${openFaq === i ? 'text-green-700' : 'text-gray-800'}`}>{faq.q}</span>
                        {openFaq === i ? (
                          <ChevronUp className="w-4 h-4 text-green-500 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                        )}
                      </button>
                      {openFaq === i && (
                        <div className="px-4 pb-4">
                          <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-5 bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-start gap-3">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      Have a question not listed here? Visit our <Link href="/faqs" className="font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-800">FAQ page</Link> or <button onClick={() => window.dispatchEvent(new Event('open-live-chat'))} className="font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-800">chat with our AI assistant</button>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-br from-green-600 to-emerald-700">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Wallet className="w-10 h-10 text-green-200 mx-auto mb-5" />
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Earning?</h2>
            <p className="text-green-100 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of Kenyan freelancers who get paid instantly via M-Pesa with the lowest fees in the market.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 bg-white text-green-700 hover:bg-green-50 px-8 py-4 rounded-xl font-bold text-lg transition-colors"
              >
                <Send className="w-5 h-5" />
                Get Started Free
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
              >
                <Crown className="w-5 h-5" />
                View Pro Plan
              </Link>
            </div>
            <p className="mt-6 text-sm text-green-200 flex items-center justify-center gap-4 flex-wrap">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Zero withdrawal fees</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Instant M-Pesa payout</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> From 4% service fee</span>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
