'use client'

import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import {
  Users,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Star,
  Shield,
  Award,
  Camera,
  FileText,
  BadgeCheck,
  TrendingUp,
  Briefcase,
  Sparkles,
  Eye,
  Zap,
  Target,
  Lightbulb,
  Crown,
  MapPin,
  Globe,
  Palette,
  Code,
  PenTool,
  MessageSquare,
  ChevronRight,
} from 'lucide-react'

export default function CreateProfilePage() {
  const steps = [
    {
      num: '01',
      title: 'Create Your Account',
      desc: 'Sign up with your email or Google account. It takes less than 30 seconds. Choose whether you\'re a freelancer looking for work or a client looking to hire.',
      icon: Users,
      color: 'green',
      tip: 'Use a professional email address — clients notice.',
    },
    {
      num: '02',
      title: 'Add Your Skills & Bio',
      desc: 'Select your core skills from our curated list. Write a compelling bio that tells clients who you are, what you do, and why they should hire you.',
      icon: FileText,
      color: 'blue',
      tip: 'Be specific — "React.js Developer" beats "Web Developer".',
    },
    {
      num: '03',
      title: 'Upload a Professional Photo',
      desc: 'Profiles with photos get 14x more views. Upload a clear, professional headshot. First impressions matter — make yours count.',
      icon: Camera,
      color: 'purple',
      tip: 'A simple headshot with a clean background works best.',
    },
    {
      num: '04',
      title: 'Set Your Rates & Availability',
      desc: 'Set your hourly rate or project-based pricing. Indicate your availability status so clients know when you\'re ready to start.',
      icon: Target,
      color: 'amber',
      tip: 'Check Career Intelligence for competitive rate benchmarks.',
    },
    {
      num: '05',
      title: 'Verify Your Identity',
      desc: 'Complete our quick ID verification process. Verified freelancers appear higher in search results and earn 3x more trust from clients.',
      icon: BadgeCheck,
      color: 'emerald',
      tip: 'Have your national ID or passport ready — it takes 2 minutes.',
    },
    {
      num: '06',
      title: 'Build Your Portfolio',
      desc: 'Upload your best work samples organized by category. Add descriptions, images, and links. This is what convinces clients to hire you.',
      icon: Palette,
      color: 'rose',
      tip: 'Quality over quantity — 3 great pieces beat 10 mediocre ones.',
    },
  ]

  const stepColors: Record<string, { bg: string; icon: string; border: string; text: string; light: string }> = {
    green: { bg: 'bg-green-50', icon: 'bg-green-600', border: 'border-green-200', text: 'text-green-600', light: 'bg-green-100' },
    blue: { bg: 'bg-blue-50', icon: 'bg-blue-600', border: 'border-blue-200', text: 'text-blue-600', light: 'bg-blue-100' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-600', border: 'border-purple-200', text: 'text-purple-600', light: 'bg-purple-100' },
    amber: { bg: 'bg-amber-50', icon: 'bg-amber-600', border: 'border-amber-200', text: 'text-amber-600', light: 'bg-amber-100' },
    emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-600', border: 'border-emerald-200', text: 'text-emerald-600', light: 'bg-emerald-100' },
    rose: { bg: 'bg-rose-50', icon: 'bg-rose-600', border: 'border-rose-200', text: 'text-rose-600', light: 'bg-rose-100' },
  }

  const profileElements = [
    { label: 'Professional Photo', icon: Camera, importance: 'critical', boost: '14x more profile views' },
    { label: 'Compelling Bio', icon: FileText, importance: 'critical', boost: 'First thing clients read' },
    { label: 'Skills Tags', icon: Code, importance: 'critical', boost: 'How you appear in search' },
    { label: 'Portfolio Items', icon: Palette, importance: 'high', boost: '70% more hires' },
    { label: 'ID Verification', icon: Shield, importance: 'high', boost: '3x client trust' },
    { label: 'Hourly Rate', icon: TrendingUp, importance: 'high', boost: 'Sets expectations upfront' },
    { label: 'Location (County)', icon: MapPin, importance: 'medium', boost: 'Local job matching' },
    { label: 'Education', icon: Award, importance: 'medium', boost: 'Professional credibility' },
  ]

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header activeLink="/how-it-works" />

      <main className="flex-1">
        {/* Hero — Split layout */}
        <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          </div>
          <div className="absolute top-20 right-20 w-72 h-72 bg-green-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left — Text */}
              <div>
                <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                  <Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-green-400 font-medium">Create Profile</span>
                </nav>

                <div className="inline-flex items-center gap-2 bg-green-500/15 text-green-400 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
                  <Users className="w-4 h-4" />
                  Step 1 of 5
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
                  Your Profile is Your
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400"> First Impression</span>
                </h1>

                <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-lg">
                  A complete, well-crafted profile is the difference between getting hired and getting ignored. Build one that makes clients click &ldquo;Hire&rdquo; without hesitation.
                </p>

                <div className="flex flex-wrap gap-4 mb-8">
                  <Link
                    href="/signup?type=freelancer"
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-7 py-3.5 rounded-xl font-semibold transition-colors"
                  >
                    Create Free Profile
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <a
                    href="#steps"
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-7 py-3.5 rounded-xl font-medium transition-colors"
                  >
                    See the Steps
                  </a>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>100% Free</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-500" />
                    <span>Takes 5 minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span>Secure & Private</span>
                  </div>
                </div>
              </div>

              {/* Right — Profile card mockup */}
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-3xl blur-xl" />
                  <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-auto">
                    {/* Profile header */}
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        JM
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">Jane Muthoni</h3>
                          <BadgeCheck className="w-4 h-4 text-blue-500" />
                        </div>
                        <p className="text-sm text-gray-500">React & Node.js Developer</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">Nairobi, Kenya</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-lg font-bold text-gray-900">4.9</div>
                        <div className="text-[10px] text-gray-500 flex items-center justify-center gap-0.5">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> Rating
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-lg font-bold text-gray-900">23</div>
                        <div className="text-[10px] text-gray-500">Jobs Done</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-lg font-bold text-green-600">92</div>
                        <div className="text-[10px] text-gray-500">Hustle Score</div>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {['React.js', 'Node.js', 'TypeScript', 'Tailwind CSS', 'PostgreSQL'].map(s => (
                        <span key={s} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">{s}</span>
                      ))}
                    </div>

                    {/* Rate */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mb-4">
                      <span className="text-sm text-gray-600">Hourly Rate</span>
                      <span className="font-bold text-gray-900">KES 2,500/hr</span>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-1 rounded-full font-medium">
                        <Shield className="w-3 h-3" /> ID Verified
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1 rounded-full font-medium">
                        <Crown className="w-3 h-3" /> Pro Member
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-600 border border-green-200 px-2 py-1 rounded-full font-medium">
                        <Zap className="w-3 h-3" /> Available
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What makes a standout profile */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                What Makes a <span className="text-green-600">Standout</span> Profile
              </h2>
              <p className="text-lg text-gray-500 max-w-xl mx-auto">
                Complete profiles get 5x more job invitations. Here&rsquo;s what clients look for.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {profileElements.map((el) => {
                const importanceColor = el.importance === 'critical' ? 'bg-red-50 text-red-600 border-red-200'
                  : el.importance === 'high' ? 'bg-amber-50 text-amber-600 border-amber-200'
                  : 'bg-blue-50 text-blue-600 border-blue-200'
                const importanceLabel = el.importance === 'critical' ? 'Must Have' : el.importance === 'high' ? 'Important' : 'Nice to Have'
                return (
                  <div key={el.label} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-green-200 hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
                        <el.icon className="w-5 h-5 text-green-600" />
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${importanceColor}`}>
                        {importanceLabel}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{el.label}</h3>
                    <p className="text-sm text-gray-500">{el.boost}</p>
                  </div>
                )
              })}
            </div>

            {/* Profile completeness meter */}
            <div className="mt-12 bg-white rounded-2xl border border-gray-200 p-6 md:p-8 max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Profile Completeness = More Jobs</h3>
                  <p className="text-sm text-gray-500">Our data shows a direct correlation between profile completeness and hire rate</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { pct: 25, label: 'Basic (name & email only)', color: 'bg-red-400', bar: 'w-1/4', jobs: 'Almost zero hires' },
                  { pct: 50, label: 'Partial (bio + skills added)', color: 'bg-amber-400', bar: 'w-1/2', jobs: 'Some visibility' },
                  { pct: 75, label: 'Good (photo + portfolio)', color: 'bg-blue-400', bar: 'w-3/4', jobs: '3x more invitations' },
                  { pct: 100, label: 'Complete (verified + portfolio)', color: 'bg-green-500', bar: 'w-full', jobs: '5x more invitations' },
                ].map(tier => (
                  <div key={tier.pct} className="flex items-center gap-4">
                    <span className="text-sm font-bold text-gray-900 w-10 shrink-0">{tier.pct}%</span>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${tier.color} ${tier.bar}`} />
                      </div>
                    </div>
                    <div className="hidden sm:block w-48 shrink-0">
                      <span className="text-xs text-gray-500">{tier.label}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-700 shrink-0">{tier.jobs}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Step by step guide */}
        <section id="steps" className="py-20 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Build Your Profile in 6 Simple Steps
              </h2>
              <p className="text-lg text-gray-500 max-w-xl mx-auto">
                Follow this guide and you&rsquo;ll have a job-winning profile in under 10 minutes
              </p>
            </div>

            <div className="space-y-6">
              {steps.map((step, index) => {
                const colors = stepColors[step.color]
                return (
                  <div key={step.num} className="group">
                    <div className={`relative ${colors.bg} border ${colors.border} rounded-2xl p-6 md:p-8 hover:shadow-md transition-all`}>
                      {/* Step number tag */}
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

                      {/* Connector line */}
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

        {/* Pro Tips */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Pro Tips from Top Earners
              </h2>
              <p className="text-lg text-gray-500 max-w-xl mx-auto">
                These strategies separate top-earning freelancers from the rest
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Eye,
                  title: 'Write a Client-Focused Bio',
                  desc: 'Don\'t just list what you do. Tell clients what problems you solve and the results you deliver. "I help businesses increase conversions by 40% through modern web design" beats "I am a web designer".',
                  color: 'green',
                },
                {
                  icon: Camera,
                  title: 'Professional Photo Matters',
                  desc: 'Profiles with professional photos receive 14x more views. Use a clean background, good lighting, and dress as you would for a client meeting. No selfies.',
                  color: 'blue',
                },
                {
                  icon: Palette,
                  title: 'Curate Your Portfolio',
                  desc: 'Show only your best 3-5 projects with context: the challenge, your approach, and the result. Quality over quantity — one great case study beats ten random screenshots.',
                  color: 'purple',
                },
                {
                  icon: Target,
                  title: 'Niche Down Your Skills',
                  desc: '"WordPress E-commerce Specialist" attracts better clients than "Web Developer". Specialists earn 30% more because clients trust focused expertise.',
                  color: 'amber',
                },
                {
                  icon: TrendingUp,
                  title: 'Set Strategic Rates',
                  desc: 'Use our Career Intelligence tool to see average rates for your skills. Start slightly below market to build reviews, then raise your rates as your profile grows.',
                  color: 'emerald',
                },
                {
                  icon: Sparkles,
                  title: 'Keep Your Profile Fresh',
                  desc: 'Update your profile weekly. Add new skills, portfolio items, and adjust your availability. Active profiles rank higher in search results and get more invitations.',
                  color: 'rose',
                },
              ].map((tip) => {
                const colors = stepColors[tip.color]
                return (
                  <div key={tip.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-green-200 hover:shadow-md transition-all">
                    <div className={`w-11 h-11 ${colors.light} rounded-xl flex items-center justify-center mb-4`}>
                      <tip.icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{tip.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{tip.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Navigation between steps */}
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to How It Works
              </Link>

              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(step => (
                  <div
                    key={step}
                    className={`w-2.5 h-2.5 rounded-full ${step === 1 ? 'bg-green-600 w-8' : 'bg-gray-200'}`}
                  />
                ))}
              </div>

              <Link
                href="/how-it-works/find-work"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Next: Find Work
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-br from-green-600 to-green-700">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-5">
              Ready to Build Your Profile?
            </h2>
            <p className="text-green-100 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of Kenyan freelancers who turned their skills into income. It&rsquo;s free and takes 5 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup?type=freelancer"
                className="inline-flex items-center justify-center gap-2 bg-white text-green-700 hover:bg-green-50 px-8 py-4 rounded-xl font-bold text-lg transition-colors"
              >
                Create Free Profile
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/career-intelligence"
                className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                Check Market Rates First
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
