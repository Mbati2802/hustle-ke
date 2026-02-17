'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from './AuthModalContext'
import { useRouter } from 'next/navigation'
import {
  X,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Smartphone,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Briefcase,
  Building2,
  Zap,
  Shield,
  Wallet,
  CheckCircle2,
} from 'lucide-react'

const counties = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu', 'Kajiado',
  'Machakos', "Murang'a", 'Nyeri', 'Meru', 'Kakamega', 'Bungoma',
  'Busia', 'Vihiga', 'Kisii', 'Nyamira', 'Kericho', 'Bomet',
  'Uasin Gishu', 'Trans Nzoia', 'Nandi', 'Elgeyo-Marakwet', 'Baringo',
  'Laikipia', 'Samburu', 'Isiolo', 'Marsabit', 'Mandera', 'Wajir',
  'Garissa', 'Tana River', 'Lamu', 'Kilifi', 'Kwale', 'Taita-Taveta',
  'Tharaka-Nithi', 'Embu', 'Kitui', 'Makueni', 'Nyandarua',
]

const skillOptions = [
  'Web Development', 'Mobile Development', 'UI/UX Design', 'Graphic Design',
  'Content Writing', 'Digital Marketing', 'SEO', 'Data Entry',
  'Virtual Assistant', 'Accounting', 'Video Editing', 'Photography',
  'Translation', 'Transcription', 'Customer Service', 'Sales',
  'Project Management', 'Social Media Management', 'Copywriting', 'Branding',
]

export default function AuthModal() {
  const { isOpen, view, closeModal, setView, signupType, setSignupType } = useAuthModal()
  const { login, signup } = useAuth()
  const router = useRouter()

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Signup state
  const [signupStep, setSignupStep] = useState(1)
  const [signupForm, setSignupForm] = useState({
    fullName: '', email: '', phone: '', password: '',
    county: '', skills: [] as string[], title: '', bio: '',
  })
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState('')
  const [agreed, setAgreed] = useState(false)

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setLoginError('')
      setSignupError('')
      setSignupStep(1)
      setForgotSent(false)
    }
  }, [isOpen])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    const result = await login(loginEmail, loginPassword)
    setLoginLoading(false)
    if (result.error) {
      setLoginError(result.error)
    } else {
      // Close modal immediately on success
      closeModal()
      // Navigate after modal closes
      if (result.redirect) {
        setTimeout(() => router.push(result.redirect!), 100)
      }
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupLoading(true)
    setSignupError('')
    const result = await signup({
      email: signupForm.email,
      password: signupForm.password,
      full_name: signupForm.fullName,
      phone: signupForm.phone,
      role: signupType === 'client' ? 'Client' : 'Freelancer',
      county: signupForm.county,
      skills: signupForm.skills,
      title: signupForm.title,
      bio: signupForm.bio,
    })
    if (result.error) {
      setSignupError(result.error)
      setSignupLoading(false)
    } else {
      setSignupLoading(false)
      closeModal()
      router.push('/dashboard')
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmail }),
    })
    setForgotLoading(false)
    setForgotSent(true)
  }

  const toggleSkill = (skill: string) => {
    setSignupForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] sm:mx-4 mx-3 overflow-y-auto">
        {/* Close button */}
        <button onClick={closeModal} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-10">
          <X className="w-5 h-5" />
        </button>

        {/* ═══ LOGIN VIEW ═══ */}
        {view === 'login' && (
          <div className="p-6 pt-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Welcome Back</h2>
              <p className="text-sm text-gray-500 mt-1">Log in to continue your hustle</p>
            </div>

            {loginError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-xl mb-4 text-sm">{loginError}</div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1.5 text-sm">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                    placeholder="name@example.com" required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm" />
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1.5 text-sm">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={showLoginPassword ? 'text' : 'password'} value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)} placeholder="Enter your password" required
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm" />
                  <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-sm gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-green-600 rounded border-gray-300" />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <button type="button" onClick={() => setView('forgot-password')} className="text-green-600 hover:text-green-700 font-medium">
                  Forgot password?
                </button>
              </div>

              <button type="submit" disabled={loginLoading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                {loginLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Logging in...</> : <>Log In <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-4 text-xs text-gray-400">or</span></div>
            </div>

            <button className="w-full border-2 border-green-100 hover:border-green-300 bg-green-50/50 text-green-700 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm">
              <Smartphone className="w-4 h-4" /> M-Pesa Login
            </button>

            <p className="text-center mt-5 text-gray-600 text-sm">
              Don&apos;t have an account?{' '}
              <button onClick={() => setView('signup')} className="text-green-600 hover:text-green-700 font-semibold">Sign up</button>
            </p>

            <div className="mt-5 flex items-center justify-center flex-wrap gap-3 sm:gap-5 text-xs text-gray-400">
              <div className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-green-500" /> Secure</div>
              <div className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-green-500" /> Instant</div>
              <div className="flex items-center gap-1"><Wallet className="w-3.5 h-3.5 text-green-500" /> Free</div>
            </div>
          </div>
        )}

        {/* ═══ SIGNUP VIEW ═══ */}
        {view === 'signup' && (
          <div className="p-6 pt-8">
            <div className="text-center mb-5">
              <h2 className="text-xl font-bold text-gray-900">Create Account</h2>
              <p className="text-sm text-gray-500 mt-1">Join Kenya&apos;s fastest-growing freelance marketplace</p>
            </div>

            {signupError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-xl mb-4 text-sm">{signupError}</div>
            )}

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-5">
              {[1, 2, 3].map(s => (
                <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${s <= signupStep ? 'bg-green-500' : 'bg-gray-200'}`} />
              ))}
            </div>

            {/* Step 1: Role selection */}
            {signupStep === 1 && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-700 mb-3">I want to...</p>
                <button onClick={() => { setSignupType('freelancer'); setSignupStep(2) }}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:border-green-500 hover:bg-green-50 ${signupType === 'freelancer' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Find Work</p>
                      <p className="text-xs text-gray-500">I&apos;m a freelancer looking for jobs</p>
                    </div>
                  </div>
                </button>
                <button onClick={() => { setSignupType('client'); setSignupStep(2) }}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:border-blue-500 hover:bg-blue-50 ${signupType === 'client' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Hire Talent</p>
                      <p className="text-xs text-gray-500">I&apos;m a client looking to hire</p>
                    </div>
                  </div>
                </button>
                <p className="text-center text-gray-600 text-sm mt-4">
                  Already have an account?{' '}
                  <button onClick={() => setView('login')} className="text-green-600 hover:text-green-700 font-semibold">Log in</button>
                </p>
              </div>
            )}

            {/* Step 2: Basic info */}
            {signupStep === 2 && (
              <div className="space-y-4">
                <button onClick={() => setSignupStep(1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={signupForm.fullName} onChange={e => setSignupForm({ ...signupForm, fullName: e.target.value })}
                      placeholder="John Kamau" required className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" value={signupForm.email} onChange={e => setSignupForm({ ...signupForm, email: e.target.value })}
                      placeholder="name@example.com" required className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa Phone</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="tel" value={signupForm.phone} onChange={e => setSignupForm({ ...signupForm, phone: e.target.value })}
                      placeholder="254712345678" required className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type={showSignupPassword ? 'text' : 'password'} value={signupForm.password}
                      onChange={e => setSignupForm({ ...signupForm, password: e.target.value })}
                      placeholder="Min. 8 characters" required minLength={8}
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm" />
                    <button type="button" onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select value={signupForm.county} onChange={e => setSignupForm({ ...signupForm, county: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm appearance-none bg-white">
                      <option value="">Select county</option>
                      {counties.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={() => {
                  if (!signupForm.fullName || !signupForm.email || !signupForm.phone || !signupForm.password) {
                    setSignupError('Please fill in all required fields')
                    return
                  }
                  setSignupError('')
                  setSignupStep(3)
                }} className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 3: Skills & submit */}
            {signupStep === 3 && (
              <form onSubmit={handleSignup} className="space-y-4">
                <button type="button" onClick={() => setSignupStep(2)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                {signupType === 'freelancer' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Professional Title</label>
                      <input type="text" value={signupForm.title} onChange={e => setSignupForm({ ...signupForm, title: e.target.value })}
                        placeholder="e.g. Full-Stack Developer" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Skills (select up to 5)</label>
                      <div className="flex flex-wrap gap-1.5 max-h-48 sm:max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-xl">
                        {skillOptions.map(skill => (
                          <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${signupForm.skills.includes(skill) ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>
                            {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Short Bio</label>
                      <textarea value={signupForm.bio} onChange={e => setSignupForm({ ...signupForm, bio: e.target.value })}
                        placeholder="Tell clients about yourself..." rows={3}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm resize-none" />
                    </div>
                  </>
                )}

                {signupType === 'client' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <p className="font-semibold text-blue-900">Client Account</p>
                    </div>
                    <p className="text-sm text-blue-700">You&apos;re signing up to hire freelancers. You can post jobs and manage projects right after signing up.</p>
                  </div>
                )}

                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                    className="w-4 h-4 text-green-600 rounded border-gray-300 mt-0.5" />
                  <span className="text-xs text-gray-500">
                    I agree to the Terms of Service and Privacy Policy
                  </span>
                </label>

                <button type="submit" disabled={signupLoading || !agreed}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2">
                  {signupLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ═══ FORGOT PASSWORD VIEW ═══ */}
        {view === 'forgot-password' && (
          <div className="p-6 pt-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Reset Password</h2>
              <p className="text-sm text-gray-500 mt-1">We&apos;ll send you a reset link</p>
            </div>

            {forgotSent ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-gray-900 mb-1">Check your email</p>
                <p className="text-sm text-gray-500">If an account exists, we&apos;ve sent a reset link.</p>
                <button onClick={() => setView('login')} className="mt-4 text-green-600 hover:text-green-700 font-semibold text-sm">
                  Back to login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5 text-sm">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                      placeholder="name@example.com" required
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm" />
                  </div>
                </div>
                <button type="submit" disabled={forgotLoading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2">
                  {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
                </button>
                <button type="button" onClick={() => setView('login')} className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium">
                  Back to login
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
