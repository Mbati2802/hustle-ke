'use client'

import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import {
  CheckCircle2,
  ArrowRight,
  Building2,
  Users,
  Shield,
  Zap,
  Globe,
  HeadphonesIcon,
  BarChart3,
  Lock,
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  Star,
  Crown,
  ChevronRight,
  Briefcase,
  Target,
  Layers,
  Settings,
  Award,
} from 'lucide-react'

export default function EnterprisePage() {
  const features = [
    {
      icon: Users,
      title: 'Team Management',
      desc: 'Invite unlimited hiring managers with role-based permissions. Track who posted what, approved which freelancers, and manage team workflows from a single dashboard.',
      color: 'from-blue-500/20 to-indigo-500/20',
      iconBg: 'bg-blue-600',
    },
    {
      icon: Shield,
      title: 'Verified Talent Pool',
      desc: 'Access a curated pool of ID-verified freelancers with proven track records, high Hustle Scores, and background checks. No unvetted applicants.',
      color: 'from-green-500/20 to-emerald-500/20',
      iconBg: 'bg-green-600',
    },
    {
      icon: Zap,
      title: 'AI-Powered Matching',
      desc: 'Our matching engine analyzes your requirements and instantly surfaces the top 5 freelancers from our talent pool — ranked by skills, availability, and past performance.',
      color: 'from-amber-500/20 to-yellow-500/20',
      iconBg: 'bg-amber-600',
    },
    {
      icon: FileText,
      title: 'Custom Contracts & NDAs',
      desc: 'Upload your own contract templates, enforce NDAs, and set IP ownership terms. All agreements are digitally signed and stored securely.',
      color: 'from-teal-500/20 to-green-500/20',
      iconBg: 'bg-teal-600',
    },
    {
      icon: Globe,
      title: 'Bulk Hiring',
      desc: 'Post 50+ jobs at once, hire entire teams for projects, and manage large-scale campaigns with dedicated project coordination support.',
      color: 'from-cyan-500/20 to-blue-500/20',
      iconBg: 'bg-cyan-600',
    },
    {
      icon: HeadphonesIcon,
      title: 'Dedicated Account Manager',
      desc: 'A named account manager handles your onboarding, recruitment strategy, and issue resolution with guaranteed 2-hour response SLAs.',
      color: 'from-rose-500/20 to-pink-500/20',
      iconBg: 'bg-rose-600',
    },
  ]

  const additionalBenefits = [
    { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Track hiring velocity, spend, freelancer performance, and project completion rates' },
    { icon: Lock, title: 'SSO Integration', desc: 'Single Sign-On with Google Workspace, Microsoft 365, or custom SAML providers' },
    { icon: DollarSign, title: 'Lowest Fees', desc: 'Just 2% service fee — the lowest on any Kenyan freelance platform. Save 66% vs Free plan.' },
    { icon: Layers, title: 'API Access', desc: 'Integrate HustleKE into your existing HR and project management tools via REST API' },
    { icon: Settings, title: 'Custom Workflows', desc: 'Configure approval chains, budget limits, and automated job posting rules' },
    { icon: Target, title: 'Talent Scouting', desc: 'We proactively identify and pre-screen talent for your upcoming projects' },
  ]

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          </div>
          <div className="absolute top-20 right-20 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute top-40 left-1/3 w-64 h-64 bg-green-500/5 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-green-500/15 text-green-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                  <Building2 className="w-4 h-4" />
                  Enterprise Solutions
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                  Hire Kenya&rsquo;s Best Talent
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300"> at Scale</span>
                </h1>

                <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-lg">
                  Custom workforce solutions for companies that need reliable, verified freelancers. Dedicated support, volume pricing, and tools built for teams — not individuals.
                </p>

                <div className="flex flex-wrap gap-4 mb-10">
                  <Link
                    href="/dashboard/enterprise"
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-7 py-3.5 rounded-xl font-semibold transition-colors"
                  >
                    Get Started — KES 5,000/mo
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <a
                    href="#features"
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-7 py-3.5 rounded-xl font-medium transition-colors"
                  >
                    Explore Features
                  </a>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span>No setup fees</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span>Cancel anytime</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span>24/7 support</span>
                  </div>
                </div>
              </div>

              {/* Right — Stats showcase */}
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-3xl blur-xl" />
                  <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                    <div className="text-center mb-6">
                      <h3 className="text-white font-bold text-lg mb-1">Enterprise by the Numbers</h3>
                      <p className="text-gray-400 text-sm">Why leading Kenyan companies choose us</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { value: '500+', label: 'Verified Freelancers', icon: Users, color: 'text-green-400' },
                        { value: '< 48hrs', label: 'Avg. Time to Hire', icon: Clock, color: 'text-blue-400' },
                        { value: '2%', label: 'Enterprise Fee', icon: DollarSign, color: 'text-amber-400' },
                        { value: '98%', label: 'Client Satisfaction', icon: Star, color: 'text-green-400' },
                        { value: '2hr', label: 'Support SLA', icon: HeadphonesIcon, color: 'text-rose-400' },
                        { value: '50+', label: 'Bulk Jobs at Once', icon: Briefcase, color: 'text-cyan-400' },
                      ].map((stat, i) => (
                        <div key={i} className="bg-white/5 rounded-xl p-4 text-center">
                          <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
                          <div className="text-xl font-bold text-white">{stat.value}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trusted by */}
        <section className="py-12 bg-gray-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-8">Trusted by leading companies across East Africa</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
              {[
                { name: 'Safaricom', color: 'text-green-600' },
                { name: 'Standard Bank', color: 'text-blue-600' },
                { name: 'Google Dev', color: 'text-red-500' },
                { name: 'Andela', color: 'text-green-700' },
                { name: 'iHub', color: 'text-orange-600' },
                { name: 'Techno', color: 'text-blue-500' },
                { name: 'Jumia', color: 'text-orange-500' },
                { name: 'Bolt', color: 'text-green-500' },
              ].map((company) => (
                <div key={company.name} className="flex items-center justify-center py-4 px-3 bg-white rounded-xl border border-gray-100">
                  <span className={`font-bold text-sm ${company.color}`}>{company.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Core features */}
        <section id="features" className="py-12 sm:py-20 bg-white scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <Layers className="w-4 h-4" />
                Built for Teams
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Enterprise-Grade <span className="text-green-600">Features</span>
              </h2>
              <p className="text-lg text-gray-500 max-w-xl mx-auto">
                Everything your HR and procurement teams need to hire freelancers at scale, with full control and visibility
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <div key={feature.title} className={`bg-gradient-to-br ${feature.color} rounded-2xl p-6 border border-white/50 hover:shadow-lg transition-all group`}>
                  <div className={`${feature.iconBg} w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enterprise vs Free/Pro comparison */}
        <section className="py-12 sm:py-20 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Why Enterprise?
              </h2>
              <p className="text-lg text-gray-500 max-w-xl mx-auto">
                See how Enterprise compares to our individual plans
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-4 text-center border-b border-gray-100">
                <div className="p-5 text-left">
                  <span className="text-sm font-semibold text-gray-500">Feature</span>
                </div>
                <div className="p-5 bg-gray-50">
                  <span className="text-sm font-semibold text-gray-500">Free</span>
                </div>
                <div className="p-5">
                  <span className="text-sm font-semibold text-green-600 flex items-center justify-center gap-1">
                    <Crown className="w-3.5 h-3.5" /> Pro
                  </span>
                </div>
                <div className="p-5 bg-green-50">
                  <span className="text-sm font-bold text-green-700 flex items-center justify-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> Enterprise
                  </span>
                </div>
              </div>

              {/* Rows */}
              {[
                { feature: 'Service Fee', free: '6%', pro: '4%', enterprise: '2%' },
                { feature: 'Proposals / Day', free: '10', pro: '20', enterprise: 'Unlimited' },
                { feature: 'Team Members', free: '1', pro: '1', enterprise: 'Unlimited' },
                { feature: 'Priority Matching', free: '—', pro: '✓', enterprise: 'AI + Dedicated' },
                { feature: 'Custom Contracts', free: '—', pro: '—', enterprise: '✓' },
                { feature: 'Bulk Job Posting', free: '—', pro: '—', enterprise: '50+ at once' },
                { feature: 'API Access', free: '—', pro: '—', enterprise: '✓' },
                { feature: 'SSO Integration', free: '—', pro: '—', enterprise: '✓' },
                { feature: 'Account Manager', free: '—', pro: '—', enterprise: 'Dedicated' },
                { feature: 'Support SLA', free: 'Community', pro: 'Priority', enterprise: '2hr response' },
                { feature: 'Analytics', free: 'Basic', pro: 'Advanced', enterprise: 'Custom reports' },
              ].map((row, i) => (
                <div key={i} className={`grid grid-cols-4 text-center text-sm ${i % 2 === 0 ? '' : 'bg-gray-50/50'} ${i !== 0 ? 'border-t border-gray-50' : ''}`}>
                  <div className="p-4 text-left font-medium text-gray-700">{row.feature}</div>
                  <div className="p-4 text-gray-400 bg-gray-50/50">{row.free}</div>
                  <div className="p-4 text-gray-600">{row.pro}</div>
                  <div className="p-4 bg-green-50/50 font-semibold text-green-700">{row.enterprise}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Additional benefits */}
        <section className="py-12 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                And <span className="text-green-600">More</span>
              </h2>
              <p className="text-lg text-gray-500 max-w-xl mx-auto">
                Enterprise comes loaded with tools your team will love
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {additionalBenefits.map((benefit) => (
                <div key={benefit.title} className="flex items-start gap-4 bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                    <benefit.icon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{benefit.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-12 sm:py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
          <div className="absolute top-10 right-10 w-72 h-72 bg-green-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Getting Started is Easy
              </h2>
              <p className="text-lg text-gray-400 max-w-xl mx-auto">
                From first contact to your first hire — in under a week
              </p>
            </div>

            <div className="space-y-6">
              {[
                {
                  num: '01',
                  title: 'Talk to Our Sales Team',
                  desc: 'Schedule a 30-minute call. We learn about your team size, hiring needs, and project types. No commitments.',
                  color: 'from-green-500/20 to-emerald-500/20',
                },
                {
                  num: '02',
                  title: 'Custom Plan & Onboarding',
                  desc: 'We design a plan around your budget and volume. Your dedicated account manager sets up your workspace, invites your team, and configures workflows.',
                  color: 'from-emerald-500/20 to-teal-500/20',
                },
                {
                  num: '03',
                  title: 'Post Jobs & Get Matched',
                  desc: 'Start posting jobs — individually or in bulk. Our AI matches you with pre-vetted freelancers, and your account manager curates the shortlist.',
                  color: 'from-teal-500/20 to-green-500/20',
                },
                {
                  num: '04',
                  title: 'Hire, Manage & Scale',
                  desc: 'Hire freelancers, manage projects, track spend, and scale your team up or down as needed. All protected by escrow.',
                  color: 'from-green-500/20 to-emerald-500/20',
                },
              ].map((step, index) => (
                <div key={step.num} className="group">
                  <div className={`relative bg-gradient-to-r ${step.color} backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8`}>
                    <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                      <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                        <span className="text-xl font-bold text-white">{step.num}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                        <p className="text-gray-300 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                    {index < 3 && (
                      <div className="hidden sm:block absolute -bottom-6 left-11 w-0.5 h-6 bg-white/10" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial / Social proof */}
        <section className="py-12 sm:py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12">
              <div className="flex items-center gap-1 mb-6">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <blockquote className="text-xl lg:text-2xl font-medium text-gray-900 leading-relaxed mb-8">
                &ldquo;HustleKE Enterprise transformed how we hire. We went from spending 3 weeks sourcing freelancers to getting matched with vetted talent in under 48 hours. The dedicated account manager and escrow system give us complete peace of mind.&rdquo;
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                  JM
                </div>
                <div>
                  <p className="font-bold text-gray-900">James Mwangi</p>
                  <p className="text-sm text-gray-500">Head of Digital, TechCo Kenya</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 sm:py-20 bg-gradient-to-br from-green-600 to-emerald-700">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-5">
              Ready to Scale Your Team?
            </h2>
            <p className="text-green-100 text-lg mb-8 max-w-xl mx-auto">
              Let us build a custom workforce solution for your business. Our sales team will get back to you within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard/enterprise"
                className="inline-flex items-center justify-center gap-2 bg-white text-green-700 hover:bg-green-50 px-8 py-4 rounded-xl font-bold text-lg transition-colors"
              >
                Start Enterprise — KES 5,000/mo
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
              >
                <DollarSign className="w-5 h-5" />
                View Pricing
              </Link>
            </div>
            <p className="mt-6 text-sm text-green-200 flex items-center justify-center gap-4">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> No setup fees</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Custom pricing</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Cancel anytime</span>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
