'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Loader2,
} from 'lucide-react'

// Loading fallback for suspense
function VerificationFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden p-8 text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading verification page...</p>
        </div>
      </div>
    </div>
  );
}

// Main verification component that uses searchParams (needs Suspense)
function VerificationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [resending, setResending] = useState(false)

  useEffect(() => {
    // Check if user is already verified
    checkVerificationStatus()
  }, [])

  const checkVerificationStatus = async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    let user = null
    try {
      const result = await supabase.auth.getUser()
      
      // Handle refresh token errors gracefully
      if (result.error && result.error.message?.includes('refresh_token_not_found')) {
        setStatus('error')
        setMessage('Session expired. Please log in again.')
        setTimeout(() => router.push('/login'), 2000)
        return
      }
      
      user = result.data.user
    } catch (error) {
      console.error('Auth error in verify-email:', error)
      setStatus('error')
      setMessage('Authentication error. Please log in again.')
      setTimeout(() => router.push('/login'), 2000)
      return
    }
    
    if (!user) {
      setStatus('error')
      setMessage('No user session found. Please log in again.')
      return
    }

    setUserEmail(user.email || '')

    if (user.email_confirmed_at) {
      setStatus('success')
      setMessage('Your email is already verified!')
      setTimeout(() => router.push('/dashboard'), 2000)
      return
    }

    // Check for error in URL (from failed verification)
    const error = searchParams.get('error')
    if (error) {
      setStatus('error')
      setMessage('Verification link expired or invalid. Please request a new verification email.')
    } else {
      setStatus('error')
      setMessage('Please check your email and click the verification link.')
    }
  }
  
  const resendVerification = async () => {
    setResending(true)
    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      })
      const data = await res.json()
      
      if (res.ok) {
        setStatus('error')
        setMessage('Verification email sent! Please check your inbox.')
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to send verification email.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
    setResending(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Verify Your Email</h1>
            <p className="text-green-100 text-sm">
              Complete your registration by verifying {userEmail}
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {status === 'loading' && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-green-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Checking verification status...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Verified!</h2>
                <p className="text-gray-600 mb-6">{message}</p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification Required</h2>
                <p className="text-gray-600 mb-6">{message}</p>
                
                <div className="space-y-3">
                  <button
                    onClick={resendVerification}
                    disabled={resending}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Resend Verification Email
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-xl font-medium transition-colors"
                  >
                    Skip for Now
                  </button>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Why verify?</strong> Email verification helps us keep your account secure and ensures you receive important notifications about your jobs and payments.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-center text-xs text-gray-500">
              Didn't receive the email? Check your spam folder or click "Resend Verification Email"
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main page component that exports
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerificationFallback />}>
      <VerificationContent />
    </Suspense>
  )
}
