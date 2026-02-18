'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  Gift,
  Users,
  DollarSign,
  Copy,
  Check,
  Send,
  Loader2,
  UserPlus,
  CheckCircle2,
  Clock,
  Star,
  Share2,
  Link2,
  Mail,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react'

interface ReferralStats {
  total_referred: number
  signed_up: number
  converted: number
  total_earned: number
  pending_rewards: number
}

interface Referral {
  id: string
  email: string
  status: string
  reward: number
  paid: boolean
  created_at: string
  converted_at: string | null
  name: string | null
  avatar: string | null
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Invited', color: 'bg-gray-100 text-gray-600', icon: Clock },
  signed_up: { label: 'Signed Up', color: 'bg-blue-100 text-blue-600', icon: UserPlus },
  converted: { label: 'Converted', color: 'bg-amber-100 text-amber-600', icon: Star },
  rewarded: { label: 'Rewarded', color: 'bg-green-100 text-green-600', icon: CheckCircle2 },
}

export default function ReferralsPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [referralCode, setReferralCode] = useState('')
  const [referralLink, setReferralLink] = useState('')
  const [stats, setStats] = useState<ReferralStats>({ total_referred: 0, signed_up: 0, converted: 0, total_earned: 0, pending_rewards: 0 })
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [copied, setCopied] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')
  const [showInvite, setShowInvite] = useState(false)

  const fetchReferrals = useCallback(async () => {
    try {
      const res = await fetch('/api/referrals')
      const data = await res.json()
      if (data.referral_code) setReferralCode(data.referral_code)
      if (data.referral_link) setReferralLink(data.referral_link)
      if (data.stats) setStats(data.stats)
      if (data.referrals) setReferrals(data.referrals)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchReferrals() }, [fetchReferrals])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const input = document.createElement('input')
      input.value = referralLink
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteMsg('')
    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setInviteMsg('Invite sent!')
        setInviteEmail('')
        fetchReferrals()
      } else {
        setInviteMsg(data.error || 'Failed to send invite')
      }
    } catch {
      setInviteMsg('Network error')
    } finally {
      setInviting(false)
    }
  }

  const shareVia = (platform: string) => {
    const text = `Join me on HustleKE — Kenya's #1 freelance marketplace! Sign up with my link and we both earn KES 200: ${referralLink}`
    const encodedText = encodeURIComponent(text)
    const encodedUrl = encodeURIComponent(referralLink)
    let url = ''
    switch (platform) {
      case 'whatsapp': url = `https://wa.me/?text=${encodedText}`; break
      case 'twitter': url = `https://twitter.com/intent/tweet?text=${encodedText}`; break
      case 'linkedin': url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`; break
      case 'email': url = `mailto:?subject=${encodeURIComponent('Join HustleKE!')}&body=${encodedText}`; break
    }
    if (url) window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-6 xl:p-8 animate-pulse">
        <div className="h-7 w-48 bg-gray-200 rounded-lg mb-2" />
        <div className="h-4 w-64 bg-gray-100 rounded mb-6" />
        <div className="bg-white rounded-xl border border-gray-200 p-6 h-40 mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-24" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 xl:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Referral Program</h1>
          <p className="text-sm text-gray-500 mt-0.5">Earn KES 200 for every friend who completes their first project</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" /> Invite Friend
        </button>
      </div>

      {/* Referral Link Card */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-5 sm:p-6 mb-6 text-white">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Share & Earn</h2>
            <p className="text-sm text-green-100 mt-0.5">Share your unique link. When your friend signs up and completes a project, you both earn KES 200!</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 px-3 py-2 bg-white/10 rounded-lg text-sm font-mono truncate">
            {referralLink}
          </div>
          <button
            onClick={copyLink}
            className={`shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              copied ? 'bg-white text-green-700' : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Link</>}
          </button>
        </div>

        {/* Share buttons */}
        <div className="flex items-center gap-2 mt-4">
          <span className="text-xs text-green-200 mr-1">Share via:</span>
          {[
            { key: 'whatsapp', label: 'WhatsApp', color: 'bg-[#25D366]/20 hover:bg-[#25D366]/30' },
            { key: 'twitter', label: 'X/Twitter', color: 'bg-white/10 hover:bg-white/20' },
            { key: 'linkedin', label: 'LinkedIn', color: 'bg-[#0077B5]/20 hover:bg-[#0077B5]/30' },
            { key: 'email', label: 'Email', color: 'bg-white/10 hover:bg-white/20' },
          ].map(p => (
            <button
              key={p.key}
              onClick={() => shareVia(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors ${p.color}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-white/20 flex items-center gap-2">
          <span className="text-xs text-green-200">Your code:</span>
          <span className="font-mono font-bold text-sm bg-white/20 px-2.5 py-1 rounded-lg">{referralCode}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total Invited', value: stats.total_referred, icon: Users, color: 'blue' },
          { label: 'Signed Up', value: stats.signed_up, icon: UserPlus, color: 'green' },
          { label: 'Converted', value: stats.converted, icon: CheckCircle2, color: 'amber' },
          { label: 'Total Earned', value: `KES ${stats.total_earned.toLocaleString()}`, icon: DollarSign, color: 'emerald' },
        ].map(s => {
          const colors: Record<string, { bg: string; icon: string }> = {
            blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
            green: { bg: 'bg-green-50', icon: 'text-green-600' },
            amber: { bg: 'bg-amber-50', icon: 'text-amber-600' },
            emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
          }
          const c = colors[s.color]
          return (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
              <div className={`w-8 h-8 ${c.bg} rounded-lg flex items-center justify-center mb-2`}>
                <s.icon className={`w-4 h-4 ${c.icon}`} />
              </div>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          )
        })}
      </div>

      {/* How it works */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" /> How Referrals Work
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Share Your Link', desc: 'Send your unique referral link to friends, colleagues, or anyone who freelances', icon: Share2 },
            { step: '2', title: 'They Sign Up', desc: 'When they create an account using your link, they appear in your referrals list', icon: UserPlus },
            { step: '3', title: 'You Both Earn', desc: 'Once they complete their first project, you both get KES 200 in your wallets', icon: Gift },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-xs font-bold shrink-0">
                {s.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referrals List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Your Referrals</h3>
          <span className="text-xs text-gray-400">{referrals.length} total</span>
        </div>
        {referrals.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {referrals.map(r => {
              const cfg = statusConfig[r.status] || statusConfig.pending
              const StatusIcon = cfg.icon
              const initials = (r.name || r.email || 'U').split(/[\s@]/)[0].slice(0, 2).toUpperCase()
              return (
                <div key={r.id} className="px-4 sm:px-5 py-3.5 flex items-center gap-3">
                  {r.avatar ? (
                    <img src={r.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.name || r.email}</p>
                    <p className="text-xs text-gray-400">
                      Invited {new Date(r.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.reward > 0 && r.paid && (
                      <span className="text-xs font-semibold text-green-600">+KES {r.reward}</span>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                      <StatusIcon className="w-3 h-3" /> {cfg.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-1">No referrals yet</p>
            <p className="text-xs text-gray-400">Share your link to start earning!</p>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Invite a Friend</h3>
              <button onClick={() => { setShowInvite(false); setInviteMsg('') }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Enter their email address and we&apos;ll send them an invitation to join HustleKE.</p>
            {inviteMsg && (
              <div className={`px-4 py-2 rounded-lg text-sm mb-4 ${inviteMsg.includes('sent') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {inviteMsg}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="friend@example.com"
                onKeyDown={e => e.key === 'Enter' && handleInvite()}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-sm"
              />
              <button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
              >
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
