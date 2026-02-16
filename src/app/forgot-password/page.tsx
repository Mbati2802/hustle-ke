'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import {
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Inbox,
} from 'lucide-react'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'sent'>('email')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        setIsLoading(false)
        return
      }

      setStep('sent')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {step === 'sent' ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Inbox className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
              <p className="text-gray-600 mb-2">
                We&apos;ve sent a password reset link to:
              </p>
              <p className="font-semibold text-gray-900 mb-6">{email}</p>
              <p className="text-sm text-gray-500 mb-8">
                Click the link in the email to reset your password. If you don&apos;t see it, check your spam folder.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => { setStep('email'); setError('') }}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Try a different email
                </button>
                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition-colors"
                >
                  Back to Login
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
                <p className="text-gray-600">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-sm">{error}</div>
              )}

              <form onSubmit={handleSendResetLink} className="space-y-5">
                <div>
                  <label className="block font-medium text-gray-900 mb-2 text-sm">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</> : <>Send Reset Link <ArrowRight className="w-5 h-5" /></>}
                </button>
              </form>

              <p className="text-center mt-6 text-gray-600 text-sm">
                <Link href="/login" className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 font-semibold">
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </Link>
              </p>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
