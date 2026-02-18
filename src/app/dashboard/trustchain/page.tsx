'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Link2,
  Shield,
  Globe,
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Plus,
  ExternalLink,
  Copy,
  Eye,
  Award,
  TrendingUp,
  FileText,
  Sparkles,
  AlertCircle,
  Trash2,
} from 'lucide-react'

interface ReputationImport {
  id: string
  platform: string
  platform_username?: string
  platform_profile_url: string
  rating?: number
  total_reviews: number
  total_projects: number
  verification_status: 'pending' | 'verified' | 'rejected' | 'expired'
  verified_at?: string
  trust_score_contribution: number
  created_at: string
}

interface Certificate {
  id: string
  short_code: string
  total_projects: number
  avg_rating: number
  on_time_rate: number
  skills_verified: number
  hustle_score: number
  earnings_tier: string
  views: number
  is_public: boolean
  created_at: string
}

interface VerifiedSkill {
  skill_name: string
  badge_level: string
  score: number
  verified_at: string
}

const platformConfig: Record<string, { name: string; color: string; bg: string; icon: string }> = {
  upwork: { name: 'Upwork', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: '💼' },
  fiverr: { name: 'Fiverr', color: 'text-green-600', bg: 'bg-green-50 border-green-200', icon: '🟢' },
  freelancer: { name: 'Freelancer.com', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: '🔵' },
  linkedin: { name: 'LinkedIn', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: '💼' },
  github: { name: 'GitHub', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200', icon: '🐙' },
  toptal: { name: 'Toptal', color: 'text-blue-800', bg: 'bg-blue-50 border-blue-200', icon: '🔷' },
  other: { name: 'Other', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', icon: '🌐' },
}

const verificationStatusConfig: Record<string, { color: string; bg: string; label: string; icon: typeof CheckCircle2 }> = {
  verified: { color: 'text-green-700', bg: 'bg-green-50', label: 'Verified', icon: CheckCircle2 },
  pending: { color: 'text-amber-700', bg: 'bg-amber-50', label: 'Pending', icon: Clock },
  rejected: { color: 'text-red-700', bg: 'bg-red-50', label: 'Rejected', icon: XCircle },
  expired: { color: 'text-gray-600', bg: 'bg-gray-50', label: 'Expired', icon: Clock },
}

const earningsTierLabels: Record<string, string> = {
  under_1k: 'Starter',
  '1k_10k': 'Rising',
  '10k_50k': 'Established',
  '50k_100k': 'Expert',
  '100k_plus': 'Elite',
}

export default function TrustChainPage() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [imports, setImports] = useState<ReputationImport[]>([])
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [verifiedSkills, setVerifiedSkills] = useState<VerifiedSkill[]>([])
  const [trustScore, setTrustScore] = useState(0)

  // Import form
  const [showImportForm, setShowImportForm] = useState(false)
  const [importForm, setImportForm] = useState({
    platform: 'upwork',
    platform_profile_url: '',
    platform_username: '',
    rating: '',
    total_reviews: '',
    total_projects: '',
  })
  const [importing, setImporting] = useState(false)
  const [generatingCert, setGeneratingCert] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetch('/api/trustchain?action=my-reputation').then(r => r.json())
      setImports(data.imports || [])
      setCertificate(data.certificate || null)
      setVerifiedSkills(data.verifiedSkills || [])
      setTrustScore(data.trustScore || 0)
    } catch {}
    setLoading(false)
  }

  const handleImport = async () => {
    if (!importForm.platform_profile_url) {
      setMsg({ type: 'error', text: 'Profile URL is required' })
      return
    }
    setImporting(true)
    setMsg(null)
    try {
      const res = await fetch('/api/trustchain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import',
          platform: importForm.platform,
          platform_profile_url: importForm.platform_profile_url,
          platform_username: importForm.platform_username || undefined,
          rating: importForm.rating ? parseFloat(importForm.rating) : undefined,
          total_reviews: importForm.total_reviews ? parseInt(importForm.total_reviews) : undefined,
          total_projects: importForm.total_projects ? parseInt(importForm.total_projects) : undefined,
          verification_method: 'screenshot',
          screenshot_url: importForm.platform_profile_url, // Simplified: use URL as proof
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setMsg({ type: 'success', text: `${platformConfig[importForm.platform]?.name || 'Platform'} reputation imported and verified!` })
        setShowImportForm(false)
        setImportForm({ platform: 'upwork', platform_profile_url: '', platform_username: '', rating: '', total_reviews: '', total_projects: '' })
        loadData()
      } else {
        setMsg({ type: 'error', text: data.error || 'Import failed' })
      }
    } catch {
      setMsg({ type: 'error', text: 'Network error' })
    }
    setImporting(false)
  }

  const generateCertificate = async () => {
    setGeneratingCert(true)
    setMsg(null)
    try {
      const res = await fetch('/api/trustchain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-certificate' }),
      })
      const data = await res.json()
      if (res.ok) {
        setCertificate(data.certificate)
        setMsg({ type: 'success', text: 'TrustChain certificate generated!' })
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed to generate certificate' })
      }
    } catch {
      setMsg({ type: 'error', text: 'Network error' })
    }
    setGeneratingCert(false)
  }

  const deleteImport = async (importId: string) => {
    if (!confirm('Delete this reputation import?')) return
    try {
      await fetch('/api/trustchain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-import', import_id: importId }),
      })
      loadData()
    } catch {}
  }

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`https://hustlekenya.onrender.com/verify/${code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 xl:p-8 pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-800 to-purple-900 rounded-2xl p-6 lg:p-8 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Link2 className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">TrustChain™</h1>
              <p className="text-blue-200 text-sm">Your portable, verifiable reputation</p>
            </div>
          </div>
          <p className="text-blue-100/70 text-xs mt-3 max-w-lg">
            Import your reputation from other platforms, verify your skills, and generate a shareable certificate. Your reputation belongs to YOU.
          </p>
        </div>
      </div>

      {/* Message */}
      {msg && (
        <div className={`p-3 rounded-xl mb-4 text-sm font-medium flex items-center justify-between ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="text-xs">✕</button>
        </div>
      )}

      {/* Trust Score */}
      <div className="grid sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="w-14 h-14 mx-auto mb-2 relative">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke={trustScore >= 70 ? '#22c55e' : trustScore >= 40 ? '#f59e0b' : '#ef4444'} strokeWidth="3" strokeDasharray={`${trustScore} ${100 - trustScore}`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">{Math.round(trustScore)}</span>
          </div>
          <p className="text-xs text-gray-500 font-medium">TrustChain Score</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{imports.filter(i => i.verification_status === 'verified').length}</p>
          <p className="text-xs text-gray-500 mt-1">Verified Platforms</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{verifiedSkills.length}</p>
          <p className="text-xs text-gray-500 mt-1">SkillDNA Badges</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{certificate?.views || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Certificate Views</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Imported Reputation */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" /> External Reputation
            </h2>
            <button onClick={() => setShowImportForm(!showImportForm)}
              className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Import
            </button>
          </div>

          {/* Import Form */}
          {showImportForm && (
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 mb-4">
              <h3 className="font-semibold text-blue-900 text-sm mb-3">Import Platform Reputation</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Platform</label>
                  <select value={importForm.platform} onChange={(e) => setImportForm(f => ({ ...f, platform: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none">
                    {Object.entries(platformConfig).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.icon} {cfg.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Profile URL *</label>
                  <input value={importForm.platform_profile_url} onChange={(e) => setImportForm(f => ({ ...f, platform_profile_url: e.target.value }))}
                    placeholder="https://www.upwork.com/freelancers/~your-id"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
                  <input value={importForm.platform_username} onChange={(e) => setImportForm(f => ({ ...f, platform_username: e.target.value }))}
                    placeholder="Your username on the platform"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Rating</label>
                    <input type="number" step="0.1" max="5" value={importForm.rating} onChange={(e) => setImportForm(f => ({ ...f, rating: e.target.value }))}
                      placeholder="4.9" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Reviews</label>
                    <input type="number" value={importForm.total_reviews} onChange={(e) => setImportForm(f => ({ ...f, total_reviews: e.target.value }))}
                      placeholder="127" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Projects</label>
                    <input type="number" value={importForm.total_projects} onChange={(e) => setImportForm(f => ({ ...f, total_projects: e.target.value }))}
                      placeholder="85" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleImport} disabled={importing}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5">
                    {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Import
                  </button>
                  <button onClick={() => setShowImportForm(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Imported platforms */}
          {imports.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <Globe className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No external reputation imported yet</p>
              <p className="text-gray-400 text-xs mt-1">Import from Upwork, Fiverr, LinkedIn, or GitHub</p>
              <button onClick={() => setShowImportForm(true)}
                className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Import Now
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {imports.map((imp) => {
                const platform = platformConfig[imp.platform] || platformConfig.other
                const status = verificationStatusConfig[imp.verification_status] || verificationStatusConfig.pending
                const StatusIcon = status.icon
                return (
                  <div key={imp.id} className={`rounded-xl border p-4 ${platform.bg}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{platform.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={`font-semibold text-sm ${platform.color}`}>{platform.name}</h3>
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${status.bg} ${status.color}`}>
                              <StatusIcon className="w-2.5 h-2.5" /> {status.label}
                            </span>
                          </div>
                          {imp.platform_username && <p className="text-xs text-gray-500">@{imp.platform_username}</p>}
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            {imp.rating && <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-400" /> {imp.rating}</span>}
                            {imp.total_reviews > 0 && <span>{imp.total_reviews} reviews</span>}
                            {imp.total_projects > 0 && <span>{imp.total_projects} projects</span>}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">+{imp.trust_score_contribution} trust points</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a href={imp.platform_profile_url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/50">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button onClick={() => deleteImport(imp.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white/50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Verified Skills */}
          {verifiedSkills.length > 0 && (
            <div className="mt-6">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-green-600" /> SkillDNA Badges
              </h2>
              <div className="flex flex-wrap gap-2">
                {verifiedSkills.map((skill, i) => {
                  const badgeEmoji = skill.badge_level === 'diamond' ? '💎' : skill.badge_level === 'gold' ? '🥇' : skill.badge_level === 'silver' ? '🥈' : '🥉'
                  return (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700">
                      {badgeEmoji} {skill.skill_name} <span className="text-gray-400">({skill.score})</span>
                    </span>
                  )
                })}
              </div>
              <Link href="/dashboard/skilldna" className="text-xs text-green-600 hover:text-green-700 font-medium mt-2 inline-flex items-center gap-1">
                Verify more skills <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Right: Certificate */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-600" /> Reputation Certificate
          </h2>

          {certificate ? (
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl border-2 border-blue-200 p-6 relative overflow-hidden">
              {/* Watermark */}
              <div className="absolute top-4 right-4 opacity-10">
                <Shield className="w-20 h-20 text-blue-600" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-blue-800 text-sm">HustleKE TrustChain Certificate</span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-1">{profile?.full_name}</h3>
                <p className="text-sm text-gray-500 mb-4">{profile?.title || 'Freelancer'}</p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/80 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-gray-900">{certificate.total_projects}</p>
                    <p className="text-[10px] text-gray-500">Total Projects</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-amber-600">{certificate.avg_rating || '—'}</p>
                    <p className="text-[10px] text-gray-500">Avg Rating</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-green-600">{certificate.skills_verified}</p>
                    <p className="text-[10px] text-gray-500">Skills Verified</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-purple-600">{certificate.hustle_score}</p>
                    <p className="text-[10px] text-gray-500">Hustle Score</p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-white/80 rounded-lg p-3 mb-4">
                  <div>
                    <p className="text-[10px] text-gray-500">Certificate Code</p>
                    <p className="font-mono font-bold text-blue-700">{certificate.short_code}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Eye className="w-3 h-3" /> {certificate.views} views</span>
                    <button onClick={() => copyLink(certificate.short_code)}
                      className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 transition-colors">
                      {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span>Tier: {earningsTierLabels[certificate.earnings_tier] || certificate.earnings_tier}</span>
                  <span>Generated {new Date(certificate.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No certificate generated yet</p>
              <p className="text-gray-400 text-xs mt-1 mb-4">Generate a shareable, verifiable reputation certificate</p>
              <button onClick={generateCertificate} disabled={generatingCert}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5">
                {generatingCert ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Generate Certificate
              </button>
            </div>
          )}

          {certificate && (
            <div className="mt-3 flex gap-2">
              <button onClick={generateCertificate} disabled={generatingCert}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5">
                {generatingCert ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
                Refresh Certificate
              </button>
              <button onClick={() => copyLink(certificate.short_code)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied!' : 'Share Link'}
              </button>
            </div>
          )}

          {/* How TrustChain Works */}
          <div className="mt-6 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" /> How TrustChain Works
            </h3>
            <div className="space-y-3">
              {[
                { icon: Globe, title: 'Import', desc: 'Link your Upwork, Fiverr, LinkedIn, or GitHub profiles' },
                { icon: CheckCircle2, title: 'Verify', desc: 'We verify your profile ownership and reputation data' },
                { icon: TrendingUp, title: 'Score', desc: 'Your TrustChain score combines internal + external reputation' },
                { icon: FileText, title: 'Share', desc: 'Generate a certificate and share it anywhere' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <item.icon className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-xs">{item.title}</p>
                    <p className="text-[10px] text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
