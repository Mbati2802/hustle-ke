'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { usePageContent } from '@/hooks/usePageContent'
import { usePostJobModal } from '../components/PostJobModalContext'
import { useAuthModal } from '../components/AuthModalContext'
import { 
  CheckCircle2, 
  Users, 
  Briefcase, 
  Shield, 
  Clock, 
  ArrowRight,
  Bell,
  Home,
  Search,
  LayoutDashboard,
  User,
  Wallet,
  Zap,
  TrendingUp,
  FileText,
  MessageSquare,
  Award,
  ChevronRight,
  PlayCircle,
  Star,
  MapPin,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Mail,
  Sparkles,
  Target,
  Heart,
  Globe,
  Lock,
  Rocket,
  ThumbsUp,
  Quote,
  X,
  HelpCircle
} from 'lucide-react'

// FAQ Data
const faqs = [
  {
    question: 'How do I get started as a freelancer?',
    answer: 'Simply create your profile, add your skills and portfolio, verify your identity, and start browsing jobs that match your expertise. Our AI will recommend the best opportunities for you.'
  },
  {
    question: 'Is HustleKE free to use?',
    answer: 'Yes! Creating an account and browsing jobs is completely free. We only charge a small 6% service fee when you complete a project and get paid.'
  },
  {
    question: 'How does M-Pesa escrow work?',
    answer: 'When a client hires you, they fund the escrow with M-Pesa. The money is held securely until you complete the work. Once approved, funds are released instantly to your M-Pesa wallet.'
  },
  {
    question: 'What is the Hustle Score?',
    answer: 'Hustle Score is our trust rating system based on your work history, reviews, verification status, and platform activity. Higher scores get priority access to top jobs.'
  },
  {
    question: 'How do I hire talent for my project?',
    answer: 'Post your project with requirements and budget, review proposals from qualified freelancers, interview candidates, and hire the best fit. Fund escrow and your project begins!'
  },
  {
    question: 'What happens if there is a dispute?',
    answer: 'Our dispute resolution team reviews all cases fairly. With escrow protection, your funds are safe while we work to resolve any issues between parties.'
  }
]

// Testimonials
const testimonials = [
  {
    name: 'James Mwangi',
    role: 'Web Developer',
    location: 'Nairobi',
    image: 'JM',
    quote: 'I have earned over KES 2.5M on HustleKE. The instant M-Pesa payouts and low 6% fee changed my life!',
    rating: 5,
    earnings: 'KES 2.5M+'
  },
  {
    name: 'Sarah Ochieng',
    role: 'Business Owner',
    location: 'Kisumu',
    image: 'SO',
    quote: 'Found amazing talent for my e-commerce site. The escrow protection gave me peace of mind throughout the project.',
    rating: 5,
    earnings: 'Saved 40%'
  },
  {
    name: 'Peter Kamau',
    role: 'Mobile Developer',
    location: 'Nakuru',
    image: 'PK',
    quote: 'The AI matching is incredible. I get relevant job recommendations daily and my calendar stays booked.',
    rating: 5,
    earnings: '50+ Jobs'
  },
  {
    name: 'Grace Wanjiku',
    role: 'Marketing Manager',
    location: 'Mombasa',
    image: 'GW',
    quote: 'HustleKE helped us scale our marketing team quickly. Quality freelancers, fair prices, and seamless process.',
    rating: 5,
    earnings: 'KES 800K+'
  }
]

const steps = [
  {
    icon: Users,
    title: 'Create Your Profile',
    description: 'Sign up and build your profile. Add your skills, portfolio, and verify your identity to boost your Hustle Score.',
    for: 'freelancer',
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: Search,
    title: 'Find Work or Talent',
    description: 'Browse thousands of jobs or post your project. Our AI matches you with the perfect opportunities or candidates.',
    for: 'both',
    color: 'from-green-500 to-green-600'
  },
  {
    icon: Briefcase,
    title: 'Submit Proposals',
    description: 'Apply to jobs with a polished proposal. Use our AI Proposal Polisher to stand out from the competition.',
    for: 'freelancer',
    color: 'from-purple-500 to-purple-600'
  },
  {
    icon: Shield,
    title: 'Secure with M-Pesa Escrow',
    description: 'Funds are held safely in escrow until work is completed. Both parties are protected throughout the process.',
    for: 'both',
    color: 'from-orange-500 to-orange-600'
  },
  {
    icon: CheckCircle2,
    title: 'Get Paid Instantly',
    description: 'Once work is approved, payment is released instantly to your M-Pesa wallet. No delays, no hassle.',
    for: 'both',
    color: 'from-emerald-500 to-emerald-600'
  }
]

const features = [
  {
    title: 'AI-Powered Matching',
    description: 'Our intelligent system learns your preferences and connects you with the best opportunities or talent.',
    icon: Zap,
    stat: '95%',
    label: 'Match Rate'
  },
  {
    title: 'Hustle Score Trust',
    description: 'Build reputation through verified work history, reviews, and identity verification.',
    icon: Award,
    stat: '50K+',
    label: 'Verified Users'
  },
  {
    title: 'Instant Payments',
    description: 'Get paid immediately via M-Pesa when work is completed. No waiting for weeks.',
    icon: Clock,
    stat: '< 1min',
    label: 'Payout Time'
  },
  {
    title: 'Kenyan Focused',
    description: 'Built specifically for the Kenyan market with local payment methods and job categories.',
    icon: MapPin,
    stat: '47',
    label: 'Counties'
  }
]

const stats = [
  { value: '50,000+', label: 'Freelancers', icon: Users },
  { value: '100,000+', label: 'Jobs Completed', icon: Briefcase },
  { value: 'KES 500M+', label: 'Paid Out', icon: Wallet },
  { value: '98%', label: 'Satisfaction', icon: Star },
]

// Trust badges
const trustBadges = [
  { name: 'Safaricom', icon: Smartphone },
  { name: 'Mpesa', icon: Wallet },
  { name: 'Secure SSL', icon: Lock },
  { name: 'Verified', icon: CheckCircle2 },
]

// Typewriter Text Component
function TypewriterText({ texts }: { texts: { text: string; color: string }[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)
  const [displayText, setDisplayText] = useState('')

  useEffect(() => {
    const current = texts[currentIndex]
    const fullText = current.text

    if (isTyping) {
      if (displayText.length < fullText.length) {
        const timeout = setTimeout(() => {
          setDisplayText(fullText.slice(0, displayText.length + 1))
        }, 100)
        return () => clearTimeout(timeout)
      } else {
        const timeout = setTimeout(() => setIsTyping(false), 2000)
        return () => clearTimeout(timeout)
      }
    } else {
      if (displayText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1))
        }, 50)
        return () => clearTimeout(timeout)
      } else {
        setCurrentIndex((prev) => (prev + 1) % texts.length)
        setIsTyping(true)
      }
    }
  }, [displayText, isTyping, currentIndex, texts])

  return (
    <span className={texts[currentIndex].color}>
      {displayText}
      <span className="animate-cursor">|</span>
    </span>
  )
}

// FAQ Section Component with Tabs
function FAQSection() {
  const [activeTab, setActiveTab] = useState('freelancers')
  const [openQuestion, setOpenQuestion] = useState<string | null>('q1')

  const tabs = [
    { id: 'freelancers', label: 'For Freelancers', icon: Briefcase },
    { id: 'clients', label: 'For Clients', icon: Users },
    { id: 'payments', label: 'Payments', icon: Wallet },
    { id: 'general', label: 'General', icon: HelpCircle }
  ]

  const faqs = {
    freelancers: [
      { id: 'q1', q: 'How do I get started as a freelancer?', a: 'Simply create your profile, add your skills and portfolio, verify your identity, and start browsing jobs that match your expertise. Our AI will recommend the best opportunities for you.' },
      { id: 'q2', q: 'Is HustleKE free to use?', a: 'Yes! Creating an account and browsing jobs is completely free. We only charge a small 6% service fee when you complete a project and get paid.' },
      { id: 'q3', q: 'What is the Hustle Score?', a: 'Hustle Score is our trust rating system based on your work history, reviews, verification status, and platform activity. Higher scores get priority access to top jobs.' }
    ],
    clients: [
      { id: 'q4', q: 'How do I hire talent for my project?', a: 'Post your project with requirements and budget, review proposals from qualified freelancers, interview candidates, and hire the best fit. Fund escrow and your project begins!' },
      { id: 'q5', q: 'How do I know the freelancers are qualified?', a: 'All freelancers have a Hustle Score based on their work history, reviews, and verification status. You can also view their portfolios and past work samples.' }
    ],
    payments: [
      { id: 'q6', q: 'How does M-Pesa escrow work?', a: 'When a client hires you, they fund the escrow with M-Pesa. The money is held securely until you complete the work. Once approved, funds are released instantly to your M-Pesa wallet.' },
      { id: 'q7', q: 'What happens if there is a dispute?', a: 'Our dispute resolution team reviews all cases fairly. With escrow protection, your funds are safe while we work to resolve any issues between parties.' }
    ],
    general: [
      { id: 'q8', q: 'Is my data secure on HustleKE?', a: 'Yes, we use bank-level encryption and security protocols. Your personal information is never shared with third parties without your consent.' },
      { id: 'q9', q: 'Which counties do you operate in?', a: 'HustleKE operates across all 47 counties in Kenya. Our platform connects talent and opportunities nationwide.' }
    ]
  }

  const currentFaqs = faqs[activeTab as keyof typeof faqs] || []

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Tabs */}
      <div className="flex flex-wrap border-b border-gray-100">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setOpenQuestion(null)
              }}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-4 font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-green-50 text-green-700 border-b-2 border-green-500'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* FAQ Content */}
      <div className="p-6 md:p-8">
        <div className="space-y-4">
          {currentFaqs.map((faq) => (
            <div
              key={faq.id}
              className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                openQuestion === faq.id
                  ? 'border-green-300 bg-green-50/30'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <button
                onClick={() => setOpenQuestion(openQuestion === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className={`font-semibold pr-4 ${
                  openQuestion === faq.id ? 'text-green-700' : 'text-gray-900'
                }`}>
                  {faq.q}
                </span>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  openQuestion === faq.id ? 'bg-green-200 rotate-180' : 'bg-gray-100'
                }`}>
                  <ChevronDown className={`w-5 h-5 ${
                    openQuestion === faq.id ? 'text-green-700' : 'text-gray-500'
                  }`} />
                </div>
              </button>
              <div className={`transition-all duration-300 ${
                openQuestion === faq.id ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
              } overflow-hidden`}>
                <p className="px-5 pb-5 text-gray-600 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const defaultHIWContent = {
  hero_badge: "Kenya's #1 Freelancing Platform",
  hero_title: 'How HustleKE Works',
  hero_subtitle: 'Your journey to successful freelancing or hiring starts here. Simple, secure, and built for Kenyans.',
  stats: [
    { value: '50,000+', label: 'Freelancers' },
    { value: '100,000+', label: 'Jobs Completed' },
    { value: 'KES 500M+', label: 'Paid Out' },
    { value: '98%', label: 'Satisfaction' },
  ],
  newsletter_title: 'Stay Updated with HustleKE',
  newsletter_subtitle: 'Get the latest tips, success stories, and platform updates delivered to your inbox',
  cta_title: 'Ready to Start Your Journey?',
  cta_subtitle: 'Join thousands of Kenyans already using HustleKE to find work and hire talent.',
}

export default function HowItWorksPage() {
  const hiwContent = usePageContent('how-it-works', defaultHIWContent)
  const { openModal: openPostJob } = usePostJobModal()
  const { openSignup } = useAuthModal()
  const [activeTab, setActiveTab] = useState<'freelancer' | 'client'>('freelancer')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [email, setEmail] = useState('')
  const [newsletterStatus, setNewsletterStatus] = useState('')

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const filteredSteps = steps.filter(step => step.for === 'both' || step.for === activeTab)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header activeLink="/how-it-works" />

      {/* Hero Section with Animated Background */}
      <section className="relative bg-gradient-to-br from-green-600 to-green-700 pt-16 pb-20 px-4 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center text-white mb-12">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">{hiwContent.hero_badge}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {hiwContent.hero_title}
            </h1>
            <p className="text-xl md:text-2xl text-green-100 max-w-3xl mx-auto mb-8">
              {hiwContent.hero_subtitle}
            </p>
          </div>

          {/* Animated Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {hiwContent.stats.map((stat: { value: string; label: string }, index: number) => {
              const statIcons = [Users, Briefcase, Wallet, Star]
              const Icon = statIcons[index] || Users
              return (
                <div 
                  key={stat.label}
                  className="group bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-500"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <Icon className="w-8 h-8 text-green-300 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-sm text-green-200">{stat.label}</p>
                </div>
              )
            })}
          </div>
          
          {/* Tabs */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => setActiveTab('freelancer')}
              className={`group px-8 py-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-3 ${
                activeTab === 'freelancer' 
                  ? 'bg-white text-green-600 shadow-2xl scale-105' 
                  : 'bg-green-500/50 text-white hover:bg-green-500/70 border border-white/30'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === 'freelancer' ? 'bg-green-100' : 'bg-white/20'}`}>
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-sm opacity-80">I want to</span>
                <span className="block text-lg">Find Work</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('client')}
              className={`group px-8 py-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-3 ${
                activeTab === 'client' 
                  ? 'bg-white text-green-600 shadow-2xl scale-105' 
                  : 'bg-green-500/50 text-white hover:bg-green-500/70 border border-white/30'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === 'client' ? 'bg-green-100' : 'bg-white/20'}`}>
                <Users className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-sm opacity-80">I want to</span>
                <span className="block text-lg">Hire Talent</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Process Steps - Animated Cards */}
      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {activeTab === 'freelancer' ? 'Your Path to Earning' : 'Your Path to Hiring'}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Follow these simple steps to get started and achieve your goals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSteps.map((step, index) => (
              <div 
                key={step.title}
                className="group relative bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-green-300 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              >
                {/* Gradient Border Effect */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${step.color} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>
                
                {/* Step Number */}
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center font-bold text-gray-400 group-hover:bg-gradient-to-br group-hover:from-green-500 group-hover:to-green-600 group-hover:text-white transition-all duration-500">
                  {index + 1}
                </div>

                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                  <step.icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>

                <Link href={`/how-it-works/${step.title.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '')}`} className="mt-5 flex items-center gap-2 text-green-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span>Learn more</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Animated Cards */}
      <section className="py-12 sm:py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Why Choose Us
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built for Success
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to help you succeed
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="group relative bg-gray-50 rounded-2xl p-6 border border-gray-200 hover:border-green-300 hover:bg-white hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <span className="text-2xl font-bold text-green-600">{feature.stat}</span>
                </div>
                
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-500">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                
                <div className="text-3xl font-bold text-green-600 mb-2">{feature.stat}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
                <p className="text-xs text-green-600 font-medium mt-3">{feature.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="py-12 sm:py-20 px-4 bg-gray-900 text-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-900/20 to-gray-900"></div>
          <div className="absolute top-20 left-10 w-64 h-64 bg-green-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Success Stories
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Hear from Kenyans who have transformed their careers and businesses
            </p>
          </div>

          {/* Testimonial Cards */}
          <div className="relative">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={testimonial.name}
                  className={`group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 cursor-pointer ${
                    currentTestimonial === index ? 'ring-2 ring-green-500 scale-105' : ''
                  }`}
                  onClick={() => setCurrentTestimonial(index)}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.image}
                    </div>
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  
                  <div className="inline-block bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold">
                    {testimonial.earnings}
                  </div>
                </div>
              ))}
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentTestimonial === index ? 'w-8 bg-green-500' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16 px-4 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
            {trustBadges.map((badge) => (
              <div key={badge.name} className="flex items-center gap-2 hover:opacity-100 transition-opacity">
                <badge.icon className="w-6 h-6 text-gray-400" />
                <span className="font-semibold text-gray-600">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section - Modern Tabs Design */}
      <section className="py-12 sm:py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Help Center
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about HustleKE
            </p>
          </div>

          {/* FAQ Tabs */}
          <FAQSection />

          {/* Read More Button */}
          <div className="text-center mt-12">
            <Link 
              href="/faqs" 
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
            >
              View All FAQs
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-12 sm:py-20 px-4 bg-gradient-to-br from-green-600 to-green-700 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-6">
            <Mail className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">Join 50,000+ subscribers</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {hiwContent.newsletter_title}
          </h2>
          <p className="text-green-100 mb-8 max-w-xl mx-auto">
            {hiwContent.newsletter_subtitle}
          </p>
          
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto" onSubmit={async (e) => {
            e.preventDefault()
            if (!email.trim()) return
            setEmail('')
            setNewsletterStatus('subscribed')
          }}>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setNewsletterStatus('') }}
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 rounded-xl border-0 focus:ring-2 focus:ring-white/50 text-gray-900"
              required
            />
            <button type="submit" className="px-8 py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </form>
          {newsletterStatus === 'subscribed' ? (
            <p className="text-white text-sm mt-4 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> You&apos;re subscribed! We&apos;ll keep you updated.
            </p>
          ) : (
            <p className="text-green-200 text-sm mt-4">
              No spam, unsubscribe at any time
            </p>
          )}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 sm:py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            {hiwContent.cta_title}
          </h2>
          <p className="text-gray-600 mb-10 max-w-xl mx-auto text-lg">
            {hiwContent.cta_subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => activeTab === 'freelancer' ? openSignup('freelancer') : openPostJob()}
              className="group inline-flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all hover:shadow-2xl hover:scale-105"
            >
              {activeTab === 'freelancer' ? 'Create Free Profile' : 'Post Your First Job'}
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link 
              href="/success-stories"
              className="inline-flex items-center justify-center gap-2 border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 px-10 py-5 rounded-2xl font-semibold transition-all"
            >
              View Success Stories
            </Link>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>Free to join</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>No hidden fees</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>Instant M-Pesa payouts</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
