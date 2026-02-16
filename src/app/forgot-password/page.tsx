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
  Smartphone,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'otp' | 'reset' | 'success'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setTimeout(() => {
      setIsLoading(false)
      setStep('otp')
    }, 1500)
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    if (otp.length < 4) {
      setError('Please enter a valid OTP')
      setIsLoading(false)
      return
    }
    setTimeout(() => {
      setIsLoading(false)
      setStep('reset')
    }, 1500)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setStep('success')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {step === 'success' ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h1>
              <p className="text-gray-600 mb-8">
                Your password has been successfully reset. You can now log in with your new password.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
              >
                Go to Login
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {step === 'email' && 'Forgot Password?'}
                  {step === 'otp' && 'Enter Verification Code'}
                  {step === 'reset' && 'Create New Password'}
                </h1>
                <p className="text-gray-600">
                  {step === 'email' && 'Enter your email or phone number to receive a reset code'}
                  {step === 'otp' && `We sent a code to ${email}`}
                  {step === 'reset' && 'Choose a strong password for your account'}
                </p>
              </div>

              {/* Progress */}
              <div className="flex items-center justify-center gap-2 mb-8">
                {['email', 'otp', 'reset'].map((s, i) => (
                  <div key={s} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      ['email', 'otp', 'reset'].indexOf(step) >= i
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {['email', 'otp', 'reset'].indexOf(step) > i ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                    </div>
                    {i < 2 && <div className={`w-12 h-0.5 mx-2 ${['email', 'otp', 'reset'].indexOf(step) > i ? 'bg-green-600' : 'bg-gray-200'}`} />}
                  </div>
                ))}
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-sm">{error}</div>
              )}

              {step === 'email' && (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div>
                    <label className="block font-medium text-gray-900 mb-2 text-sm">Email or Phone</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com or 2547XXXXXXXX"
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</> : <>Send Reset Code <ArrowRight className="w-5 h-5" /></>}
                  </button>
                </form>
              )}

              {step === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div>
                    <label className="block font-medium text-gray-900 mb-2 text-sm">Verification Code</label>
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit code"
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm text-center tracking-widest text-lg font-mono"
                        required
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Didn&apos;t receive the code?{' '}
                      <button type="button" className="text-green-600 font-medium hover:underline">Resend</button>
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep('email')} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50">
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify'}
                    </button>
                  </div>
                </form>
              )}

              {step === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div>
                    <label className="block font-medium text-gray-900 mb-2 text-sm">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm"
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-900 mb-2 text-sm">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Resetting...</> : 'Reset Password'}
                  </button>
                </form>
              )}

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
