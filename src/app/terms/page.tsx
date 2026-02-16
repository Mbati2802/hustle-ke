'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { usePageContent } from '@/hooks/usePageContent'
import {
  Scale,
  Shield,
  Users,
  DollarSign,
  Lock,
  AlertTriangle,
  FileText,
  Award,
  Gavel,
  XCircle,
  LogOut,
  Mail,
  ChevronRight,
  CheckCircle2,
  Smartphone,
  Crown,
  type LucideIcon,
} from 'lucide-react'

interface Section {
  id: string
  heading: string
  icon: LucideIcon
  color: string
  body: string
  bullets?: string[]
}

const SECTIONS: Section[] = [
  {
    id: 'acceptance',
    heading: '1. Acceptance of Terms',
    icon: FileText,
    color: 'from-blue-500 to-indigo-600',
    body: 'By accessing or using HustleKE ("the Platform"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service ("Terms"). If you do not agree, you may not use the Platform. These Terms constitute a legally binding agreement between you and HustleKE. The Platform is operated in the Republic of Kenya and is subject to the laws of Kenya, including the Data Protection Act 2019, the Consumer Protection Act 2012, and the Kenya Information and Communications Act.',
  },
  {
    id: 'registration',
    heading: '2. Account Registration',
    icon: Users,
    color: 'from-green-500 to-emerald-600',
    body: 'To use HustleKE, you must create an account and comply with the following requirements:',
    bullets: [
      'You must be at least 18 years of age or the legal age of majority in your jurisdiction',
      'You must provide accurate, current, and complete registration information',
      'You are solely responsible for maintaining the confidentiality and security of your account credentials',
      'Each individual may maintain only one (1) account — duplicate accounts will be suspended',
      'Identity verification via a valid Kenyan national ID card or passport is required for full platform access, including withdrawals and escrow participation',
      'You must promptly update your account information if it changes',
      'You are responsible for all activity that occurs under your account',
    ],
  },
  {
    id: 'fees',
    heading: '3. Service Fees & Payments',
    icon: DollarSign,
    color: 'from-amber-500 to-orange-600',
    body: 'HustleKE charges service fees on completed transactions as outlined below:',
    bullets: [
      'Free Plan: 6% service fee deducted from each completed project payment upon escrow release',
      'Pro Plan (KES 500/month): 4% service fee, 20 daily proposals, priority matching, advanced analytics',
      'Enterprise Plan: Custom fee rates starting from 3%, unlimited proposals, dedicated account manager',
      'Service fees include 16% VAT as required by Kenyan tax law',
      'Standard M-Pesa transaction charges set by Safaricom may apply for deposits and withdrawals — HustleKE does not add any withdrawal fees',
      'All prices are quoted in Kenya Shillings (KES)',
      'Fee changes will be communicated 30 days in advance via email and platform notification',
    ],
  },
  {
    id: 'escrow',
    heading: '4. M-Pesa Escrow System',
    icon: Lock,
    color: 'from-purple-500 to-violet-600',
    body: 'All project payments on HustleKE are secured through our M-Pesa escrow system to protect both freelancers and clients:',
    bullets: [
      'Clients must fund the escrow via M-Pesa before work begins on any project',
      'Escrowed funds are held securely and cannot be accessed by either party until work is approved or a dispute is resolved',
      'Upon client approval of delivered work, funds are released to the freelancer\'s HustleKE wallet instantly',
      'If the client does not review delivered work within 14 calendar days, auto-release may be triggered',
      'In case of a dispute, escrowed funds remain locked until the resolution team makes a binding decision',
      'Refunds to clients are processed only through the dispute resolution process or by mutual agreement',
      'HustleKE does not earn interest on escrowed funds — all deposited amounts are held at face value',
    ],
  },
  {
    id: 'freelancer-obligations',
    heading: '5. Freelancer Obligations',
    icon: Award,
    color: 'from-teal-500 to-cyan-600',
    body: 'As a freelancer on HustleKE, you agree to:',
    bullets: [
      'Deliver work as described in the accepted proposal and project agreement',
      'Communicate promptly and professionally with clients through the platform messaging system',
      'Meet agreed deadlines or notify the client of delays with reasonable advance notice',
      'Submit original work — plagiarism or copyright infringement will result in account termination',
      'Maintain accurate skills, portfolio, and experience information on your profile',
      'Not solicit clients to transact outside the platform or share personal contact details before escrow is funded',
      'Comply with all applicable Kenyan laws regarding taxation and income declaration',
      'Accept that your Hustle Score may be affected by late deliveries, poor reviews, or policy violations',
    ],
  },
  {
    id: 'client-obligations',
    heading: '6. Client Obligations',
    icon: Shield,
    color: 'from-rose-500 to-pink-600',
    body: 'As a client on HustleKE, you agree to:',
    bullets: [
      'Provide clear, detailed project requirements and expectations before work begins',
      'Fund the escrow in full before a freelancer is expected to begin work',
      'Review and respond to delivered work within 7 calendar days of submission',
      'Communicate feedback constructively and through the platform messaging system',
      'Not request work beyond the agreed project scope without additional compensation',
      'Pay freelancers fairly and on time through the escrow system — no off-platform payments',
      'Respect intellectual property rights — once payment is released, work ownership transfers to you unless otherwise agreed',
      'Not post fraudulent, misleading, or illegal job listings',
    ],
  },
  {
    id: 'hustle-score',
    heading: '7. Hustle Score & Reputation',
    icon: Award,
    color: 'from-yellow-500 to-amber-600',
    body: 'The Hustle Score (0-100) is a trust and reputation metric calculated from multiple factors:',
    bullets: [
      'Completed jobs and project history',
      'Client and freelancer reviews and star ratings',
      'Response time to messages and proposals',
      'Project completion rate and deadline adherence',
      'Identity verification status',
      'Profile completeness and platform activity',
      'Manipulating your Hustle Score through fake reviews, coordinated rating schemes, or fraudulent activity is strictly prohibited and will result in immediate account suspension',
      'HustleKE reserves the right to adjust the scoring algorithm at any time to maintain platform integrity',
    ],
  },
  {
    id: 'disputes',
    heading: '8. Dispute Resolution',
    icon: Gavel,
    color: 'from-indigo-500 to-blue-600',
    body: 'HustleKE provides a structured dispute resolution process:',
    bullets: [
      'Either party may open a dispute from the Dashboard > Escrow section',
      'Both parties must submit evidence (screenshots, files, messages) within 5 business days of the dispute being opened',
      'HustleKE\'s resolution team will review all evidence impartially',
      'A binding decision will be issued within 14 business days — this may include full release to freelancer, full refund to client, or a fair split of funds',
      'Both parties are notified of the decision with a clear written explanation',
      'Escrowed funds remain locked throughout the dispute process for security',
      'Repeated disputes or patterns of bad faith may result in account restrictions',
      'For disputes exceeding KES 500,000, HustleKE may refer the matter to the Kenya Judiciary\'s Small Claims Court',
    ],
  },
  {
    id: 'prohibited',
    heading: '9. Prohibited Activities',
    icon: XCircle,
    color: 'from-red-500 to-rose-600',
    body: 'The following activities are strictly prohibited on HustleKE and will result in account suspension or permanent ban:',
    bullets: [
      'Fraud, scams, phishing, or any form of misrepresentation',
      'Harassment, threats, hate speech, or abusive behavior toward any user',
      'Sharing or selling account credentials to third parties',
      'Circumventing the escrow payment system or facilitating off-platform payments',
      'Posting illegal, harmful, defamatory, or sexually explicit content',
      'Creating multiple accounts, fake identities, or fraudulent reviews',
      'Scraping, crawling, or automated data extraction from the platform',
      'Attempting to reverse-engineer, hack, or compromise platform security',
      'Using the platform for money laundering or financing of illegal activities',
      'Spamming users with unsolicited messages or proposals',
    ],
  },
  {
    id: 'ip',
    heading: '10. Intellectual Property',
    icon: FileText,
    color: 'from-emerald-500 to-green-600',
    body: 'Intellectual property rights on HustleKE are governed as follows:',
    bullets: [
      'Freelancers retain ownership of their work until payment is released from escrow — upon release, full ownership transfers to the client unless otherwise agreed in writing',
      'Users retain all rights to content they upload to their profiles and portfolios',
      'HustleKE is granted a non-exclusive, worldwide license to display user content on the platform for the purpose of providing the service',
      'The HustleKE name, logo, and branding are trademarks of HustleKE and may not be used without permission',
      'Users must not upload content that infringes on third-party intellectual property rights',
      'DMCA-style takedown requests can be submitted to legal@hustleke.com',
    ],
  },
  {
    id: 'privacy',
    heading: '11. Privacy & Data Protection',
    icon: Lock,
    color: 'from-slate-500 to-gray-600',
    body: 'HustleKE is committed to protecting your personal data in accordance with the Kenya Data Protection Act 2019:',
    bullets: [
      'We collect only the data necessary to provide our services — see our Privacy Policy for full details',
      'Your personal information is never sold to third parties',
      'All data is stored securely with encryption and access controls',
      'You have the right to access, correct, or delete your personal data at any time',
      'We may share anonymized, aggregated data for analytics and platform improvement',
      'By using the platform, you consent to our data collection and processing practices as described in our Privacy Policy',
    ],
  },
  {
    id: 'liability',
    heading: '12. Limitation of Liability',
    icon: AlertTriangle,
    color: 'from-orange-500 to-red-600',
    body: 'To the maximum extent permitted by Kenyan law:',
    bullets: [
      'HustleKE acts as a marketplace facilitator and is not a party to agreements between freelancers and clients',
      'We do not guarantee the quality, safety, or legality of services listed on the platform',
      'HustleKE is not liable for any indirect, incidental, special, or consequential damages',
      'Our total liability for any claim shall not exceed the fees paid by you to HustleKE in the 12 months preceding the claim',
      'We are not responsible for losses arising from M-Pesa network downtime or Safaricom service interruptions',
      'Users use the platform at their own risk and are responsible for their own tax obligations',
    ],
  },
  {
    id: 'termination',
    heading: '13. Account Termination',
    icon: LogOut,
    color: 'from-gray-500 to-slate-600',
    body: 'Accounts may be terminated under the following circumstances:',
    bullets: [
      'HustleKE may suspend or terminate accounts that violate these Terms, with or without prior notice',
      'You may request account deletion at any time from Dashboard > Settings',
      'All outstanding escrow payments must be resolved before account closure',
      'Upon termination, your right to use the platform ceases immediately',
      'Data retention after account deletion is governed by our Privacy Policy and applicable law',
      'Wallet balances must be withdrawn before account closure — unclaimed balances after 90 days may be forfeited',
    ],
  },
  {
    id: 'changes',
    heading: '14. Changes to Terms',
    icon: FileText,
    color: 'from-cyan-500 to-blue-600',
    body: 'HustleKE reserves the right to modify these Terms at any time. Material changes will be communicated via email and platform notification at least 30 days before taking effect. Continued use of the platform after changes take effect constitutes acceptance of the updated Terms. If you disagree with any changes, you may close your account before the effective date.',
  },
  {
    id: 'contact',
    heading: '15. Contact & Governing Law',
    icon: Mail,
    color: 'from-green-500 to-teal-600',
    body: 'These Terms are governed by and construed in accordance with the laws of the Republic of Kenya. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of Kenya.',
    bullets: [
      'Legal inquiries: legal@hustleke.com',
      'General support: Visit our Contact page or use the AI chat assistant',
      'Registered address: Nairobi, Kenya',
    ],
  },
]

const defaultContent = {
  title: 'Terms of Service',
  last_updated: 'February 2026',
}

export default function TermsPage() {
  const content = usePageContent('terms', defaultContent)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 text-gray-300 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
              <Scale className="w-4 h-4" />
              Legal Agreement
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">{content.title}</h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto mb-4">
              The rules that govern your use of HustleKE. Please read carefully before using the platform.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500 flex-wrap">
              <span>Last updated: <strong className="text-gray-300">{content.last_updated}</strong></span>
              <span className="hidden sm:inline">|</span>
              <span>15 sections</span>
              <span className="hidden sm:inline">|</span>
              <span>Governed by Kenyan law</span>
            </div>
          </div>
        </section>

        {/* Quick Nav + Content */}
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-4 gap-8">

              {/* Sidebar — Table of Contents */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-24">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Table of Contents</h3>
                  <nav className="space-y-0.5">
                    {SECTIONS.map(section => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        onClick={() => setActiveSection(section.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          activeSection === section.id
                            ? 'bg-green-50 text-green-700 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <ChevronRight className="w-3 h-3 shrink-0" />
                        <span className="truncate">{section.heading.replace(/^\d+\.\s*/, '')}</span>
                      </a>
                    ))}
                  </nav>

                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-700">
                      Need help understanding these terms?{' '}
                      <button
                        onClick={() => window.dispatchEvent(new Event('open-live-chat'))}
                        className="font-semibold underline underline-offset-2 hover:text-blue-800"
                      >
                        Ask our AI assistant
                      </button>
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3 space-y-6">
                {/* Key highlights banner */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 mb-2">
                  <h3 className="font-bold text-green-900 mb-3 text-sm">Key Highlights</h3>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      { icon: Shield, text: 'M-Pesa escrow protects every payment' },
                      { icon: DollarSign, text: '6% fee (Free) or 4% (Pro) — no hidden charges' },
                      { icon: Gavel, text: 'Disputes resolved within 14 business days' },
                    ].map(item => (
                      <div key={item.text} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-sm text-green-800">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sections */}
                {SECTIONS.map(section => {
                  const Icon = section.icon
                  return (
                    <div
                      key={section.id}
                      id={section.id}
                      className="bg-white border border-gray-200 rounded-2xl overflow-hidden scroll-mt-24"
                    >
                      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <div className={`w-9 h-9 bg-gradient-to-br ${section.color} rounded-xl flex items-center justify-center shrink-0 shadow-sm`}>
                          <Icon className="w-4.5 h-4.5 text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">{section.heading}</h2>
                      </div>
                      <div className="px-6 py-5">
                        <p className="text-gray-600 leading-relaxed text-[15px]">{section.body}</p>
                        {section.bullets && (
                          <ul className="mt-4 space-y-2.5">
                            {section.bullets.map((bullet, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
                                <span className="text-gray-600 text-[15px] leading-relaxed">{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Acceptance footer */}
                <div className="bg-gray-900 rounded-2xl p-6 text-center">
                  <p className="text-gray-300 text-sm mb-4">
                    By using HustleKE, you confirm that you have read, understood, and agree to these Terms of Service.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href="/signup"
                      className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      I Agree — Create Account
                    </Link>
                    <Link
                      href="/privacy"
                      className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
                    >
                      <Lock className="w-4 h-4" />
                      Privacy Policy
                    </Link>
                    <Link
                      href="/contact"
                      className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Contact Us
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
