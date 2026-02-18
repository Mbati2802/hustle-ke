'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import {
  Code,
  Palette,
  PenTool,
  BarChart3,
  Megaphone,
  Video,
  Camera,
  Globe,
  Smartphone,
  Database,
  FileText,
  Headphones,
  BookOpen,
  Calculator,
  Users,
  Music,
  Shield,
  Briefcase,
  ArrowRight,
  Search,
  TrendingUp,
} from 'lucide-react'

interface CategoryInfo {
  slug: string
  name: string
  icon: typeof Code
  color: string
  bgColor: string
  description: string
  popularSkills: string[]
  avgRate: string
}

const categories: CategoryInfo[] = [
  { slug: 'web-development', name: 'Web Development', icon: Code, color: 'text-blue-600', bgColor: 'bg-blue-100', description: 'Full-stack, frontend, backend, WordPress, and more', popularSkills: ['React', 'Next.js', 'Node.js', 'WordPress', 'PHP'], avgRate: 'KES 2,000 - 8,000/hr' },
  { slug: 'mobile-development', name: 'Mobile Development', icon: Smartphone, color: 'text-purple-600', bgColor: 'bg-purple-100', description: 'iOS, Android, Flutter, React Native apps', popularSkills: ['Flutter', 'React Native', 'Swift', 'Kotlin', 'Dart'], avgRate: 'KES 2,500 - 10,000/hr' },
  { slug: 'graphic-design', name: 'Graphic Design', icon: Palette, color: 'text-pink-600', bgColor: 'bg-pink-100', description: 'Logos, branding, illustrations, and marketing materials', popularSkills: ['Adobe Illustrator', 'Photoshop', 'Figma', 'Canva', 'Branding'], avgRate: 'KES 1,500 - 5,000/hr' },
  { slug: 'ui-ux-design', name: 'UI/UX Design', icon: PenTool, color: 'text-indigo-600', bgColor: 'bg-indigo-100', description: 'User interfaces, user experience, prototyping', popularSkills: ['Figma', 'Adobe XD', 'Sketch', 'Wireframing', 'Prototyping'], avgRate: 'KES 2,000 - 7,000/hr' },
  { slug: 'content-writing', name: 'Content Writing', icon: FileText, color: 'text-green-600', bgColor: 'bg-green-100', description: 'Blog posts, articles, copywriting, technical writing', popularSkills: ['SEO Writing', 'Blog Posts', 'Copywriting', 'Technical Writing', 'Editing'], avgRate: 'KES 1,000 - 4,000/hr' },
  { slug: 'digital-marketing', name: 'Digital Marketing', icon: Megaphone, color: 'text-orange-600', bgColor: 'bg-orange-100', description: 'SEO, social media, email marketing, ads', popularSkills: ['SEO', 'Google Ads', 'Social Media', 'Email Marketing', 'Analytics'], avgRate: 'KES 1,500 - 5,000/hr' },
  { slug: 'video-editing', name: 'Video Editing', icon: Video, color: 'text-red-600', bgColor: 'bg-red-100', description: 'Video production, editing, motion graphics, animation', popularSkills: ['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Motion Graphics', 'YouTube'], avgRate: 'KES 1,500 - 6,000/hr' },
  { slug: 'photography', name: 'Photography', icon: Camera, color: 'text-amber-600', bgColor: 'bg-amber-100', description: 'Product, event, portrait, and commercial photography', popularSkills: ['Product Photography', 'Lightroom', 'Portraits', 'Events', 'Photo Editing'], avgRate: 'KES 2,000 - 8,000/hr' },
  { slug: 'data-analysis', name: 'Data Analysis', icon: BarChart3, color: 'text-cyan-600', bgColor: 'bg-cyan-100', description: 'Data visualization, reporting, business intelligence', popularSkills: ['Python', 'SQL', 'Excel', 'Power BI', 'Tableau'], avgRate: 'KES 2,000 - 7,000/hr' },
  { slug: 'virtual-assistant', name: 'Virtual Assistant', icon: Headphones, color: 'text-teal-600', bgColor: 'bg-teal-100', description: 'Admin support, scheduling, data entry, research', popularSkills: ['Data Entry', 'Email Management', 'Scheduling', 'Research', 'Customer Service'], avgRate: 'KES 500 - 2,000/hr' },
  { slug: 'translation', name: 'Translation', icon: Globe, color: 'text-emerald-600', bgColor: 'bg-emerald-100', description: 'Swahili, English, French, and other language services', popularSkills: ['Swahili-English', 'French', 'Arabic', 'Transcription', 'Localization'], avgRate: 'KES 1,000 - 3,000/hr' },
  { slug: 'accounting', name: 'Accounting & Finance', icon: Calculator, color: 'text-slate-600', bgColor: 'bg-slate-100', description: 'Bookkeeping, tax filing, financial reporting', popularSkills: ['QuickBooks', 'Bookkeeping', 'Tax Preparation', 'Financial Analysis', 'KRA Filing'], avgRate: 'KES 1,500 - 5,000/hr' },
  { slug: 'database-admin', name: 'Database & DevOps', icon: Database, color: 'text-violet-600', bgColor: 'bg-violet-100', description: 'Database management, cloud infrastructure, CI/CD', popularSkills: ['PostgreSQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes'], avgRate: 'KES 3,000 - 10,000/hr' },
  { slug: 'music-audio', name: 'Music & Audio', icon: Music, color: 'text-rose-600', bgColor: 'bg-rose-100', description: 'Music production, voiceover, podcast editing', popularSkills: ['Voiceover', 'Podcast Editing', 'Music Production', 'Mixing', 'Sound Design'], avgRate: 'KES 1,500 - 5,000/hr' },
  { slug: 'cybersecurity', name: 'Cybersecurity', icon: Shield, color: 'text-gray-600', bgColor: 'bg-gray-100', description: 'Security audits, penetration testing, compliance', popularSkills: ['Penetration Testing', 'Security Audit', 'Compliance', 'GDPR', 'Network Security'], avgRate: 'KES 3,000 - 12,000/hr' },
  { slug: 'consulting', name: 'Business Consulting', icon: Briefcase, color: 'text-sky-600', bgColor: 'bg-sky-100', description: 'Strategy, management, HR, and operations consulting', popularSkills: ['Strategy', 'Project Management', 'HR', 'Operations', 'Business Plans'], avgRate: 'KES 2,000 - 8,000/hr' },
]

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [jobCounts, setJobCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    // Fetch job counts per category
    fetch('/api/jobs?limit=1')
      .then(r => r.json())
      .then(() => {
        // We'll show static counts for now; can be enhanced with real API data
      })
      .catch(() => {})
  }, [])

  const filtered = searchQuery
    ? categories.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.popularSkills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : categories

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-600 to-emerald-700 pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Browse by Category
          </h1>
          <p className="text-green-100 text-lg max-w-2xl mx-auto mb-8">
            Find the right freelance talent or discover work in your area of expertise.
          </p>
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search categories or skills..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none text-sm"
            />
          </div>
        </div>
      </section>

      {/* Categories grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filtered.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(cat => (
              <Link
                key={cat.slug}
                href={`/jobs?category=${encodeURIComponent(cat.name)}`}
                className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-green-200 transition-all"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${cat.bgColor}`}>
                  <cat.icon className={`w-5 h-5 ${cat.color}`} />
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors mb-1">{cat.name}</h3>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{cat.description}</p>

                {/* Popular skills */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {cat.popularSkills.slice(0, 3).map(s => (
                    <span key={s} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                  {cat.popularSkills.length > 3 && (
                    <span className="text-[10px] text-gray-400">+{cat.popularSkills.length - 3}</span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-[10px] text-gray-400">{cat.avgRate}</span>
                  <span className="text-xs text-green-600 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Browse <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 mb-1">No categories found</h3>
            <p className="text-sm text-gray-500">Try a different search term.</p>
            <button onClick={() => setSearchQuery('')} className="mt-3 text-sm text-green-600 hover:text-green-700 font-medium">
              Clear search
            </button>
          </div>
        )}
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 sm:p-12 text-white">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-green-400">{categories.length}+</p>
              <p className="text-sm text-gray-400 mt-1">Skill Categories</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-green-400">15,000+</p>
              <p className="text-sm text-gray-400 mt-1">Active Freelancers</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-green-400">KES 500M+</p>
              <p className="text-sm text-gray-400 mt-1">Paid to Freelancers</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
