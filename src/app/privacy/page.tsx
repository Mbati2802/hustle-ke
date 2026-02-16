'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { usePageContent } from '@/hooks/usePageContent'
import {
  ShieldCheck,
  Eye,
  Database,
  Smartphone,
  Share2,
  Lock,
  UserCheck,
  Cookie,
  Globe,
  Baby,
  RefreshCw,
  Mail,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react'

interface Section {
  id: string
  heading: string
  icon: LucideIcon
  color: string
  body: string
  bullets?: string[]
  important?: string
}

const SECTIONS: Section[] = [
  {
    id: 'information-collected',
    heading: '1. Information We Collect',
    icon: Database,
    color: 'from-blue-500 to-indigo-600',
    body: 'We collect information necessary to provide our services, connect freelancers with clients, and maintain platform trust. The data we collect falls into two categories:',
    bullets: [
      'Account information: Full name, email address, phone number (for M-Pesa integration), county/location, and password',
      'Professional information: Job title, bio, skills, hourly rate, years of experience, education history, certifications, and portfolio items',
      'Payment information: M-Pesa phone number, wallet balances, and transaction history — we never store your M-Pesa PIN',
      'Identity verification: National ID or passport details for account verification and compliance with Kenyan regulations',
      'Usage data: Pages visited, job searches, proposals submitted, messages sent, device type, browser, IP address, and session duration',
      'Communications: Messages exchanged with other users through the platform messaging system',
    ],
    important: 'We only collect data that is necessary to operate the platform. We never collect biometric data, health data, or sensitive personal data beyond what is listed above.',
  },
  {
    id: 'how-we-use',
    heading: '2. How We Use Your Information',
    icon: Eye,
    color: 'from-green-500 to-emerald-600',
    body: 'Your information is used to deliver, personalize, and improve HustleKE services:',
    bullets: [
      'To create, manage, and secure your account',
      'To match you with relevant jobs or freelancers using our AI-powered matching algorithms',
      'To process payments securely through the M-Pesa escrow system',
      'To verify your identity and maintain platform trust and safety',
      'To send notifications about job updates, new messages, proposal statuses, and platform announcements',
      'To calculate and display your Hustle Score based on activity, reviews, and reliability',
      'To generate AI-powered insights on Career Intelligence, Profile Optimization, and Job Matching pages',
      'To detect and prevent fraud, spam, and abuse on the platform',
      'To improve our platform through analytics and develop new features',
      'To comply with legal obligations under Kenyan law',
    ],
  },
  {
    id: 'mpesa-data',
    heading: '3. M-Pesa & Payment Data',
    icon: Smartphone,
    color: 'from-green-600 to-lime-600',
    body: 'Payment transactions on HustleKE are processed through Safaricom\'s M-Pesa API. We take payment security seriously:',
    bullets: [
      'We store transaction records (amount, date, reference) for escrow management, receipts, and dispute resolution',
      'Your M-Pesa PIN is never stored, logged, or visible to HustleKE — it is entered only on Safaricom\'s secure STK push prompt on your device',
      'Wallet balances and transaction history are stored in our encrypted database',
      'All payment data is transmitted using TLS 1.3 encryption',
      'Escrow funds are tracked with full audit trails for transparency',
      'M-Pesa callback data from Safaricom is validated and processed server-side only',
    ],
    important: 'HustleKE will never ask for your M-Pesa PIN via email, phone, or chat. If anyone claiming to be from HustleKE asks for your PIN, report it immediately.',
  },
  {
    id: 'data-sharing',
    heading: '4. Data Sharing & Third Parties',
    icon: Share2,
    color: 'from-purple-500 to-violet-600',
    body: 'We do not sell, rent, or trade your personal data. Information is shared only in the following limited circumstances:',
    bullets: [
      'With other platform users: Your public profile (name, title, skills, portfolio, reviews, Hustle Score) is visible to clients and freelancers as necessary for job transactions',
      'With Safaricom: Phone number and transaction amount for M-Pesa payment processing via the Daraja API',
      'With infrastructure providers: Supabase (database hosting), Vercel (application hosting) — bound by strict data processing agreements',
      'With email/SMS providers: For sending notifications and alerts (only email/phone are shared, never full profile data)',
      'With law enforcement: When required by a valid court order or Kenyan law, including the Kenya Data Protection Act 2019',
      'In aggregated form: Anonymized, aggregated statistics may be used for platform analytics and public reports (never individually identifiable)',
    ],
  },
  {
    id: 'data-security',
    heading: '5. Data Security',
    icon: Lock,
    color: 'from-amber-500 to-orange-600',
    body: 'We implement industry-standard security measures to protect your data:',
    bullets: [
      'All data in transit is encrypted using TLS 1.3 (HTTPS)',
      'Database storage uses AES-256 encryption at rest',
      'Authentication tokens are securely managed with HTTP-only cookies and session rotation',
      'Row-Level Security (RLS) policies ensure users can only access their own data',
      'Rate limiting protects against brute force attacks and API abuse',
      'Regular security audits and dependency vulnerability scanning',
      'Admin access is restricted and logged',
    ],
    important: 'No internet transmission is 100% secure. While we implement strong protections, we cannot guarantee absolute security. Report suspected security issues to security@hustleke.com.',
  },
  {
    id: 'your-rights',
    heading: '6. Your Rights Under Kenyan Law',
    icon: UserCheck,
    color: 'from-teal-500 to-cyan-600',
    body: 'Under the Kenya Data Protection Act 2019, you have the following rights regarding your personal data:',
    bullets: [
      'Right to access: Request a copy of all personal data we hold about you',
      'Right to rectification: Correct any inaccurate or incomplete data via Dashboard > Settings',
      'Right to erasure: Request deletion of your account and all associated personal data',
      'Right to object: Object to processing of your data for specific purposes',
      'Right to data portability: Export your data in a machine-readable format',
      'Right to withdraw consent: Withdraw consent for optional data processing (e.g., marketing emails) at any time',
      'Right to lodge a complaint: File a complaint with the Office of the Data Protection Commissioner (ODPC) of Kenya',
    ],
    important: 'To exercise any of these rights, contact us at privacy@hustleke.com or use the account management tools in Dashboard > Settings. We will respond within 30 days.',
  },
  {
    id: 'cookies',
    heading: '7. Cookies & Tracking',
    icon: Cookie,
    color: 'from-yellow-500 to-amber-600',
    body: 'We use cookies and similar technologies to enhance your experience:',
    bullets: [
      'Essential cookies: Required for login sessions, CSRF protection, and core platform functionality — cannot be disabled',
      'Preference cookies: Store your language, theme, and notification settings',
      'Analytics cookies: Help us understand platform usage patterns and improve features (anonymized)',
      'We do not use third-party advertising cookies or tracking pixels',
      'You can manage cookie preferences in your browser settings — disabling essential cookies may prevent platform access',
    ],
  },
  {
    id: 'data-retention',
    heading: '8. Data Retention',
    icon: RefreshCw,
    color: 'from-indigo-500 to-blue-600',
    body: 'We retain your data only as long as necessary:',
    bullets: [
      'Active accounts: Data is retained for the duration of your account\'s existence',
      'Deleted accounts: Personal data is permanently deleted within 30 days of account deletion, except where retention is required by law',
      'Transaction records: Financial records are retained for 7 years as required by Kenyan tax law (Income Tax Act)',
      'Messages: Deleted when both parties\' accounts are closed',
      'Server logs: Automatically purged after 90 days',
      'Dispute records: Retained for 2 years after resolution for legal reference',
    ],
  },
  {
    id: 'international',
    heading: '9. International Data Transfers',
    icon: Globe,
    color: 'from-sky-500 to-blue-600',
    body: 'HustleKE primarily operates in Kenya, but some data processing occurs internationally:',
    bullets: [
      'Our database is hosted on Supabase infrastructure which may store data in data centers outside Kenya',
      'Our application is hosted on Vercel\'s global CDN network',
      'All international transfers comply with the Kenya Data Protection Act 2019 requirements for cross-border data transfers',
      'We ensure that all service providers maintain equivalent data protection standards through contractual agreements',
    ],
  },
  {
    id: 'children',
    heading: '10. Children\'s Privacy',
    icon: Baby,
    color: 'from-pink-500 to-rose-600',
    body: 'HustleKE is not intended for use by individuals under 18 years of age. We do not knowingly collect personal data from children. If we discover that a child under 18 has created an account, we will promptly delete the account and all associated data. If you believe a minor is using the platform, please report it to privacy@hustleke.com.',
  },
  {
    id: 'changes',
    heading: '11. Changes to This Policy',
    icon: RefreshCw,
    color: 'from-slate-500 to-gray-600',
    body: 'We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. When we make material changes:',
    bullets: [
      'We will notify you via email and an in-app notification at least 14 days before the changes take effect',
      'The "Last updated" date at the top of this page will be revised',
      'Continued use of HustleKE after the effective date constitutes acceptance of the updated policy',
      'Previous versions of this policy are available upon request',
    ],
  },
  {
    id: 'contact',
    heading: '12. Contact Us',
    icon: Mail,
    color: 'from-green-500 to-teal-600',
    body: 'If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data:',
    bullets: [
      'Privacy inquiries: privacy@hustleke.com',
      'Security issues: security@hustleke.com',
      'General support: Visit our Contact page or use the AI chat assistant',
      'Data Protection Officer: dpo@hustleke.com',
      'Registered address: Nairobi, Kenya',
      'Regulator: Office of the Data Protection Commissioner (ODPC), P.O. Box 48720-00100, Nairobi',
    ],
  },
]

const defaultContent = {
  title: 'Privacy Policy',
  last_updated: 'February 2026',
}

export default function PrivacyPage() {
  const content = usePageContent('privacy', defaultContent)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 text-blue-300 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
              <ShieldCheck className="w-4 h-4" />
              Your Data, Your Rights
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">{content.title}</h1>
            <p className="text-blue-200/70 text-lg max-w-2xl mx-auto mb-4">
              We believe in transparency. This policy explains what data we collect, how we use it, and how we protect your privacy on HustleKE.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-slate-400 flex-wrap">
              <span>Last updated: <strong className="text-slate-200">{content.last_updated}</strong></span>
              <span className="hidden sm:inline">|</span>
              <span>12 sections</span>
              <span className="hidden sm:inline">|</span>
              <span>Kenya Data Protection Act 2019</span>
            </div>
          </div>
        </section>

        {/* Trust badges */}
        <section className="border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Lock, label: 'AES-256 Encryption', sub: 'Data at rest' },
                { icon: ShieldCheck, label: 'TLS 1.3', sub: 'Data in transit' },
                { icon: UserCheck, label: 'KDPA Compliant', sub: 'Kenya Data Protection Act' },
                { icon: Eye, label: 'No Data Selling', sub: 'Ever, to anyone' },
              ].map(b => (
                <div key={b.label} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <b.icon className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{b.label}</p>
                    <p className="text-xs text-gray-500">{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Table of Contents + Content */}
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-4 gap-8">

              {/* Sidebar */}
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
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <ChevronRight className="w-3 h-3 shrink-0" />
                        <span className="truncate">{section.heading.replace(/^\d+\.\s*/, '')}</span>
                      </a>
                    ))}
                  </nav>

                  <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm text-amber-800">
                      <strong>Questions?</strong> Contact our Data Protection Officer at{' '}
                      <a href="mailto:dpo@hustleke.com" className="font-semibold underline underline-offset-2 hover:text-amber-900">
                        dpo@hustleke.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3 space-y-6">
                {/* Summary banner */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 mb-2">
                  <h3 className="font-bold text-blue-900 mb-3 text-sm">Privacy at a Glance</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      'We never sell your personal data',
                      'M-Pesa PINs are never stored or seen',
                      'You can delete your data at any time',
                      'Compliant with Kenya Data Protection Act 2019',
                    ].map(text => (
                      <div key={text} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                        <span className="text-sm text-blue-800">{text}</span>
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
                        {section.important && (
                          <div className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-sm text-amber-800 leading-relaxed">{section.important}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Footer CTA */}
                <div className="bg-slate-900 rounded-2xl p-6 text-center">
                  <p className="text-slate-300 text-sm mb-4">
                    Your privacy matters to us. If you have any questions or concerns, don&apos;t hesitate to reach out.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                      href="mailto:privacy@hustleke.com"
                      className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Contact Privacy Team
                    </a>
                    <Link
                      href="/terms"
                      className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Terms of Service
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
