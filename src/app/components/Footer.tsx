'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePostJobModal } from './PostJobModalContext'
import { useSiteSettings } from '@/hooks/useSiteSettings'

interface SocialLink {
  name: string
  url: string
  icon: string
  order_index: number
}

export default function Footer() {
  const { openModal } = usePostJobModal()
  const siteSettings = useSiteSettings()
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])

  useEffect(() => {
    fetch('/api/social-links')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.social_links) && data.social_links.length > 0) {
          setSocialLinks(data.social_links)
        } else {
          // Fallback to site settings defaults
          const fallback: SocialLink[] = [
            { name: 'Twitter', url: 'https://x.com/Hustle_Kenya', icon: 'Twitter', order_index: 1 },
            { name: 'LinkedIn', url: 'https://linkedin.com/company/hustleke', icon: 'Linkedin', order_index: 2 },
            { name: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61585548811537', icon: 'Facebook', order_index: 3 },
          ]
          setSocialLinks(fallback)
        }
      })
      .catch(() => {
        // Fallback on error
        setSocialLinks([
          { name: 'Twitter', url: 'https://x.com/Hustle_Kenya', icon: 'Twitter', order_index: 1 },
          { name: 'LinkedIn', url: 'https://linkedin.com/company/hustleke', icon: 'Linkedin', order_index: 2 },
          { name: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61585548811537', icon: 'Facebook', order_index: 3 },
        ])
      })
  }, [])

  return (
    <footer className="bg-gray-900 text-gray-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2">
            <div className="flex items-center mb-4">
              <img 
                src="/logo-footer.png" 
                alt={siteSettings.platform_name}
                className="h-10 w-auto"
              />
            </div>
            <p className="max-w-sm mb-6 text-sm">
              Kenya&apos;s #1 freelance marketplace. Connect with clients, get paid via M-Pesa, and build your career.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => {
                // Dynamic icon component mapping
                const IconComponent = (() => {
                  switch (social.icon) {
                    case 'Twitter': return (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
                      </svg>
                    )
                    case 'Linkedin': return (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    )
                    case 'Facebook': return (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    )
                    case 'Instagram': return (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                      </svg>
                    )
                    case 'Youtube': return (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    )
                    case 'Github': return (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    )
                    default: return (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                      </svg>
                    )
                  }
                })()

                return (
                  <a 
                    key={social.name}
                    href={social.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                    title={social.name}
                  >
                    <span className="sr-only">{social.name}</span>
                    {IconComponent}
                  </a>
                )
              })}
            </div>
          </div>

          {/* For Freelancers */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">For Freelancers</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/jobs" className="hover:text-white transition-colors">Find Work</Link></li>
              <li><Link href="/categories" className="hover:text-white transition-colors">Browse Categories</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/success-stories" className="hover:text-white transition-colors">Success Stories</Link></li>
              <li><Link href="/career-intelligence" className="hover:text-white transition-colors">Career Intelligence</Link></li>
            </ul>
          </div>

          {/* For Clients */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">For Clients</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/talent" className="hover:text-white transition-colors">Find Talent</Link></li>
              <li><button onClick={() => openModal()} className="hover:text-white transition-colors text-left">Post a Job</button></li>
              <li><Link href="/enterprise" className="hover:text-white transition-colors">Enterprise</Link></li>
              <li><Link href="/reviews" className="hover:text-white transition-colors">Reviews</Link></li>
              <li><Link href="/mpesa-tariffs" className="hover:text-white transition-colors">M-Pesa Tariffs</Link></li>
            </ul>
          </div>

          {/* AI Tools */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">AI Tools</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/ai-job-matcher" className="hover:text-white transition-colors">AI Job Matcher</Link></li>
              <li><Link href="/ai-profile-optimizer" className="hover:text-white transition-colors">Profile Optimizer</Link></li>
              <li><Link href="/ai-proposal-writer" className="hover:text-white transition-colors">Proposal Writer</Link></li>
              <li><Link href="/ai-client-brief" className="hover:text-white transition-colors">Client Brief AI</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/faqs" className="hover:text-white transition-colors">FAQs</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">&copy; {new Date().getFullYear()} {siteSettings.platform_name}. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link href="/sitemap.xml" className="hover:text-white transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
