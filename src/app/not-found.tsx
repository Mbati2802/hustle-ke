'use client'

import Link from 'next/link'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <span className="text-xl font-bold text-gray-900">HustleKE</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/jobs" className="text-gray-600 hover:text-green-600 font-medium">Find Work</Link>
            <Link href="/post-job" className="text-gray-600 hover:text-green-600 font-medium">Post a Job</Link>
            <Link href="/how-it-works" className="text-gray-600 hover:text-green-600 font-medium">How It Works</Link>
          </nav>
        </div>
      </header>

      {/* 404 Content */}
      <main className="flex-1 flex items-center justify-center px-4 pt-16">
        <div className="text-center max-w-lg">
          <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-16 h-16 text-green-600" />
          </div>
          
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted, or never existed.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/" 
              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              <Home className="w-5 h-5" />
              Go Home
            </Link>
            <Link 
              href="/jobs" 
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              <Search className="w-5 h-5" />
              Find Work
            </Link>
          </div>

          <button 
            onClick={() => window.history.back()}
            className="mt-6 inline-flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </main>
    </div>
  )
}
