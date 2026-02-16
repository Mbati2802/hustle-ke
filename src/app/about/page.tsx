'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { usePageContent } from '@/hooks/usePageContent'
import { 
  Target, 
  Heart, 
  Zap, 
  Shield,
  ArrowRight,
  Users,
  Globe,
  Smartphone,
  TrendingUp,
  Award,
  MapPin,
} from 'lucide-react'

const valueIcons = [Heart, Shield, Zap, Target]
const valueColors = ['bg-rose-100 text-rose-600', 'bg-blue-100 text-blue-600', 'bg-amber-100 text-amber-600', 'bg-green-100 text-green-600']
const statIcons = [Users, MapPin, TrendingUp, Award]
const diffIcons = [Smartphone, Shield, Globe, Zap]

const defaultContent = {
  hero_badge: 'Built for Kenya',
  hero_title: 'Connecting Talent with Opportunity',
  hero_subtitle: "HustleKE is Kenya's premier freelance marketplace — empowering thousands of professionals to build careers, earn fairly, and get paid instantly via M-Pesa.",
  stats: [
    { value: '10,000+', label: 'Active Users' },
    { value: '47', label: 'Counties Covered' },
    { value: 'KES 500M+', label: 'Paid to Freelancers' },
    { value: '4.8/5', label: 'Average Rating' },
  ],
  mission_title: 'Kenyan Talent Deserves World-Class Opportunities',
  mission_text: "HustleKE was born from a simple belief: that every skilled Kenyan should have access to meaningful work and fair pay. We're building a platform that breaks down barriers, connects professionals with clients across the globe, and ensures everyone gets paid securely and on time.",
  mission_text_2: "With just a 6% service fee — the lowest in the industry — we're making sure freelancers keep more of what they earn, while clients get access to verified, top-tier Kenyan talent.",
  mission_pillars: [
    'Empower freelancers with tools to showcase their skills and win global projects.',
    'Connect clients with verified, talented professionals across all 47 counties.',
    'Ensure fair, instant payments through secure M-Pesa escrow integration.',
    "Drive Kenya's digital economy forward through accessible remote work.",
  ],
  values: [
    { title: 'Empowerment', description: 'We believe in empowering Kenyans to build sustainable careers and businesses through technology.' },
    { title: 'Trust & Safety', description: 'Your security is our priority. Our Hustle Score system and escrow protection keep everyone safe.' },
    { title: 'Innovation', description: 'From AI-powered matching to instant M-Pesa payments, we leverage technology to simplify work.' },
    { title: 'Local Focus', description: 'Built specifically for Kenya, understanding the unique needs of our market and people.' },
  ],
  why_different: [
    { title: 'M-Pesa First', desc: "Built around Kenya's most popular payment system for instant, secure payouts." },
    { title: 'Escrow Protection', desc: 'Every project is protected. Funds are held safely until work is approved.' },
    { title: 'Global Reach, Local Heart', desc: 'Connect with international clients while staying rooted in the Kenyan market.' },
    { title: 'AI-Powered', desc: 'Smart matching, proposal enhancement, and insights powered by artificial intelligence.' },
  ],
  milestones: [
    { year: '2023', quarter: 'Q1', event: 'HustleKE founded with a vision to transform freelancing in Kenya', highlight: true },
    { year: '2023', quarter: 'Q3', event: 'Launched beta with 100+ freelancers and 50+ clients' },
    { year: '2024', quarter: 'Q1', event: 'Integrated M-Pesa escrow system for secure payments', highlight: true },
    { year: '2024', quarter: 'Q2', event: 'Reached 10,000+ active users milestone' },
    { year: '2024', quarter: 'Q4', event: 'Introduced AI-powered job matching and proposal polishing', highlight: true },
    { year: '2025', quarter: 'Q1', event: 'Expanded to all 47 counties with localized support' },
  ],
  team: [
    { name: 'Willys Onyango', role: 'Founder & CEO', image: 'https://api.dicebear.com/7.x/notionists/svg?seed=willys&backgroundColor=c0aede', bio: 'Passionate about unlocking Kenyan talent through technology and fair work.' },
    { name: 'Belinda Chelimo', role: 'Head of Product', image: 'https://api.dicebear.com/7.x/notionists/svg?seed=belinda&backgroundColor=b6e3f4', bio: 'Designing seamless experiences that connect talent with opportunity.' },
    { name: 'Brian Odhiambo', role: 'Technology Lead', image: 'https://api.dicebear.com/7.x/notionists/svg?seed=brian&backgroundColor=d1d4f9', bio: 'Building the scalable, secure infrastructure powering HustleKE.' },
    { name: 'Community Manager', role: 'User Success', image: 'https://api.dicebear.com/7.x/notionists/svg?seed=community&backgroundColor=ffd5dc', bio: 'Ensuring every user — freelancer and client — has a great experience.' },
  ],
  cta_title: 'Ready to Join the Movement?',
  cta_subtitle: "Be part of Kenya's fastest-growing community of freelancers and clients.",
}

export default function AboutPage() {
  const content = usePageContent('about', defaultContent)
  const [realStats, setRealStats] = useState(content.stats)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsRes = await fetch('/api/public/stats').then(r => r.ok ? r.json() : null).catch(() => null)
        const totalUsers = statsRes?.total_users
        const totalJobs = statsRes?.total_jobs
        if (totalUsers || totalJobs) {
          setRealStats([
            { value: totalUsers ? `${totalUsers.toLocaleString()}+` : content.stats[0].value, label: 'Active Users' },
            { value: '47', label: 'Counties Covered' },
            { value: totalJobs ? `${totalJobs.toLocaleString()}+` : content.stats[2].value, label: 'Jobs Posted' },
            { value: content.stats[3].value, label: 'Average Rating' },
          ])
        }
      } catch {}
    }
    fetchStats()
  }, [content.stats])

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header activeLink="/about" />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden pt-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-green-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-4 py-2 mb-6">
              <Heart className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-300">{content.hero_badge}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {content.hero_title}
            </h1>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              {content.hero_subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative -mt-8 z-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            {realStats.map((stat: { value: string; label: string }, i: number) => {
              const Icon = statIcons[i] || Users
              return (
                <div key={stat.label} className="p-6 text-center">
                  <Icon className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-sm font-semibold text-green-600 uppercase tracking-wider">Our Mission</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-6">
                {content.mission_title}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                {content.mission_text}
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                {content.mission_text_2}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-3xl p-8 lg:p-10">
              <div className="space-y-6">
                {content.mission_pillars.map((text: string, i: number) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-sm font-bold text-green-600 bg-white rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0 shadow-sm">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="text-gray-700 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-12 sm:py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-green-600 uppercase tracking-wider">What We Stand For</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Our Core Values</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {content.values.map((value: { title: string; description: string }, i: number) => {
              const Icon = valueIcons[i] || Heart
              const color = valueColors[i] || valueColors[0]
              return (
                <div key={value.title} className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-shadow group">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${color}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-green-600 uppercase tracking-wider">Why HustleKE</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">What Makes Us Different</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {content.why_different.map((item: { title: string; desc: string }, i: number) => {
              const Icon = diffIcons[i] || Smartphone
              return (
                <div key={item.title} className="flex gap-5 p-6 bg-gray-50 rounded-2xl hover:bg-green-50 transition-colors">
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Timeline / Milestones */}
      <section className="py-12 sm:py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-green-600 uppercase tracking-wider">Our Story</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">The Journey So Far</h2>
          </div>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[23px] md:left-1/2 top-0 bottom-0 w-0.5 bg-green-200 -translate-x-1/2" />

            <div className="space-y-8">
              {content.milestones.map((milestone: { year: string; quarter: string; event: string; highlight?: boolean }, index: number) => (
                <div key={index} className={`relative flex items-start gap-6 md:gap-0 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  {/* Content */}
                  <div className={`flex-1 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                    <div className={`inline-block rounded-xl p-5 ${milestone.highlight ? 'bg-green-600 text-white' : 'bg-white border border-gray-200'}`}>
                      <span className={`text-xs font-bold uppercase tracking-wider ${milestone.highlight ? 'text-green-200' : 'text-green-600'}`}>
                        {milestone.year} {milestone.quarter}
                      </span>
                      <p className={`mt-1 font-medium ${milestone.highlight ? 'text-white' : 'text-gray-800'}`}>
                        {milestone.event}
                      </p>
                    </div>
                  </div>

                  {/* Dot */}
                  <div className="absolute left-[23px] md:left-1/2 -translate-x-1/2 flex-shrink-0">
                    <div className={`w-4 h-4 rounded-full border-4 ${milestone.highlight ? 'bg-green-600 border-green-200' : 'bg-white border-green-400'}`} />
                  </div>

                  {/* Spacer for desktop */}
                  <div className="hidden md:block flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-green-600 uppercase tracking-wider">The People Behind HustleKE</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Leadership Team</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {content.team.map((member: { name: string; role: string; image?: string; bio: string }) => (
              <div key={member.name} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-8 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-white/20 group-hover:scale-110 transition-transform">
                    <img
                      src={member.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(member.name)}&backgroundColor=b6e3f4`}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="p-6 text-center">
                  <h3 className="font-bold text-gray-900 text-lg">{member.name}</h3>
                  <p className="text-sm text-green-600 font-medium mb-3">{member.role}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 bg-gradient-to-br from-green-600 to-green-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{content.cta_title}</h2>
          <p className="text-green-100 mb-10 max-w-xl mx-auto text-lg">
            {content.cta_subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-green-700 px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/jobs"
              className="inline-flex items-center justify-center gap-2 bg-green-500/30 hover:bg-green-500/40 text-white border border-white/20 px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
            >
              Browse Jobs
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
