'use client'

import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { usePageContent } from '@/hooks/usePageContent'
import { 
  Star, 
  Quote, 
  TrendingUp, 
  Users, 
  MapPin,
  Bell,
  Home,
  Search,
  LayoutDashboard,
  User,
  ArrowRight,
  Briefcase
} from 'lucide-react'

const defaultContent = {
  hero_title: 'Success Stories',
  hero_subtitle: 'Meet the talented Kenyans who transformed their careers through HustleKE',
  stats: [
    { value: '50,000+', label: 'Successful Projects' },
    { value: 'KES 500M+', label: 'Paid to Freelancers' },
    { value: '15,000+', label: 'Active Freelancers' },
    { value: '98%', label: 'Satisfaction Rate' },
  ],
  testimonials: [
    { name: 'Wanjiku M.', role: 'Web Developer', location: 'Nairobi', initials: 'WM', quote: 'HustleKE changed my life. I went from struggling to find clients to having a consistent stream of projects. The M-Pesa integration makes getting paid so easy!', earnings: 'KES 450,000+', jobs_completed: 47, rating: 5 },
    { name: 'Ochieng J.', role: 'Graphic Designer', location: 'Kisumu', initials: 'OJ', quote: 'As a freelancer in Kisumu, I never thought I could compete with Nairobi talent. HustleKE leveled the playing field. My Hustle Score speaks for itself!', earnings: 'KES 280,000+', jobs_completed: 32, rating: 5 },
    { name: 'Amina H.', role: 'Virtual Assistant', location: 'Mombasa', initials: 'AH', quote: 'The AI matching is incredible. I get job recommendations that perfectly fit my skills. I\'ve tripled my income in just 6 months!', earnings: 'KES 320,000+', jobs_completed: 58, rating: 5 },
    { name: 'Kamau D.', role: 'Mobile App Developer', location: 'Nairobi', initials: 'KD', quote: 'Built my entire freelance career on HustleKE. The escrow protection gives both me and my clients peace of mind. Best platform for Kenyan freelancers!', earnings: 'KES 890,000+', jobs_completed: 23, rating: 5 },
    { name: 'Njeri K.', role: 'Content Writer', location: 'Nakuru', initials: 'NK', quote: 'From part-time writer to full-time freelancer. HustleKE\'s AI Proposal Polisher helped me win clients I never thought I could land.', earnings: 'KES 180,000+', jobs_completed: 89, rating: 5 },
    { name: 'Otieno M.', role: 'SEO Specialist', location: 'Nairobi', initials: 'OM', quote: 'The verification process and Hustle Score system helped me stand out. Clients trust me more because of my verified profile.', earnings: 'KES 520,000+', jobs_completed: 41, rating: 5 },
  ],
  cta_title: 'Start Your Success Story',
  cta_subtitle: 'Join thousands of Kenyans who are already building their careers on HustleKE',
}

export default function SuccessStoriesPage() {
  const content = usePageContent('success-stories', defaultContent)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 to-green-700 pt-16 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{content.hero_title}</h1>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            {content.hero_subtitle}
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            {content.stats.map((stat: { value: string; label: string }) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-green-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.testimonials.map((person: { name: string; role: string; location: string; initials: string; quote: string; earnings: string; jobs_completed: number; rating: number }) => (
              <div key={person.name} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {person.initials}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{person.name}</h3>
                    <p className="text-sm text-gray-500">{person.role}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <MapPin className="w-3 h-3" />
                      {person.location}
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex gap-0.5 mb-4">
                  {[...Array(person.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Quote */}
                <div className="relative mb-6">
                  <Quote className="absolute -top-2 -left-2 w-6 h-6 text-green-200" />
                  <p className="text-gray-600 text-sm italic pl-4">{person.quote}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Total Earnings</p>
                    <p className="font-semibold text-green-600">{person.earnings}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Jobs Done</p>
                    <p className="font-semibold text-gray-900">{person.jobs_completed}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">{content.cta_title}</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            {content.cta_subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
            >
              Create Your Profile
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/jobs"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
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
