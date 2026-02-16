'use client'

import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  Zap,
  Filter,
  Bell,
  Star,
  TrendingUp
} from 'lucide-react'

export default function FindWorkPage() {
  const features = [
    { icon: Zap, title: 'AI Matching', desc: 'Smart recommendations based on your skills' },
    { icon: Filter, title: 'Advanced Filters', desc: 'Find exactly what you are looking for' },
    { icon: Bell, title: 'Job Alerts', desc: 'Get notified of new opportunities' },
    { icon: Star, title: 'Saved Searches', desc: 'Save and revisit your favorite searches' }
  ]

  const categories = [
    { name: 'Web Development', jobs: '2,400+', color: 'bg-blue-500' },
    { name: 'Graphic Design', jobs: '1,800+', color: 'bg-purple-500' },
    { name: 'Content Writing', jobs: '3,200+', color: 'bg-green-500' },
    { name: 'Virtual Assistant', jobs: '1,500+', color: 'bg-orange-500' },
    { name: 'Digital Marketing', jobs: '2,100+', color: 'bg-pink-500' },
    { name: 'Mobile Development', jobs: '1,900+', color: 'bg-cyan-500' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeLink="/how-it-works" />

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-600 to-green-700 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-6">
            <Search className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">Step 2 of 5</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Find Work or Talent
          </h1>
          <p className="text-green-100 text-lg max-w-2xl mx-auto">
            Our AI-powered matching system connects the right talent with the right opportunities.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Job Categories</h2>
            <p className="text-gray-600">Thousands of opportunities across different fields</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div key={cat.name} className="group bg-gray-50 rounded-2xl p-6 hover:bg-white hover:shadow-lg transition-all cursor-pointer border border-transparent hover:border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${cat.color} rounded-xl flex items-center justify-center`}>
                      <Search className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">{cat.name}</h3>
                      <p className="text-gray-500 text-sm">{cat.jobs} open jobs</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How Matching Works</h2>
            <p className="text-gray-600">Our AI analyzes multiple factors to find perfect matches</p>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow-sm">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: 'Skills Analysis', desc: 'We analyze your skills and experience' },
                { title: 'Job Requirements', desc: 'Match with jobs that fit your profile' },
                { title: 'Success Prediction', desc: 'AI predicts likelihood of success' }
              ].map((item, i) => (
                <div key={item.title} className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-green-600 font-bold">{i + 1}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Find Work?</h2>
          <p className="text-gray-600 mb-8">Browse thousands of jobs or find top Kenyan talent</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/jobs" 
              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold transition-colors"
            >
              Browse Jobs
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/talent" 
              className="inline-flex items-center justify-center gap-2 border-2 border-green-600 text-green-600 hover:bg-green-50 px-8 py-4 rounded-xl font-semibold transition-colors"
            >
              Find Talent
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
