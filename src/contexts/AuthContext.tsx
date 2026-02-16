'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User, Session } from '@supabase/supabase-js'

export interface Profile {
  id: string
  user_id: string
  full_name: string
  email: string
  phone?: string
  role: 'Freelancer' | 'Client' | 'Admin'
  county?: string
  title?: string
  bio?: string
  skills?: string[]
  hourly_rate?: number
  avatar_url?: string
  hustle_score?: number
  jobs_completed?: number
  total_earned?: number
  verification_status?: string
  is_verified?: boolean
  mpesa_phone?: string
  created_at?: string
  years_experience?: number
  availability?: string
  available_from?: string
  languages?: string[]
  education?: Array<{ school: string; degree: string; field: string; year: string }>
  certifications?: Array<{ name: string; issuer: string; year: string; url: string }>
  [key: string]: unknown
}

export interface OrgContext {
  id: string
  name: string
  slug?: string
  logo_url?: string
  industry?: string
  owner_id: string
}

export interface OrgInvite {
  id: string
  email: string
  role: string
  status: string
  expires_at: string
  created_at: string
  organization?: { id: string; name: string; logo_url?: string; industry?: string }
  inviter?: { full_name: string; avatar_url?: string }
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error?: string; redirect?: string }>
  signup: (data: SignupData) => Promise<{ error?: string }>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  // Org context
  userOrg: OrgContext | null
  userOrgRole: string | null
  activeOrg: OrgContext | null
  orgRole: string | null
  orgMode: boolean
  pendingInvites: OrgInvite[]
  switchToOrg: (org: OrgContext, role: string) => void
  switchToPersonal: () => void
  refreshOrg: () => Promise<void>
  refreshInvites: () => Promise<void>
}

interface SignupData {
  email: string
  password: string
  full_name: string
  phone: string
  role: 'Freelancer' | 'Client'
  county?: string
  skills?: string[]
  title?: string
  bio?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [userOrg, setUserOrg] = useState<OrgContext | null>(null)
  const [userOrgRole, setUserOrgRole] = useState<string | null>(null)
  const [activeOrg, setActiveOrg] = useState<OrgContext | null>(null)
  const [orgRole, setOrgRole] = useState<string | null>(null)
  const [orgMode, setOrgMode] = useState(false)
  const [pendingInvites, setPendingInvites] = useState<OrgInvite[]>([])
  const [loggingOut, setLoggingOut] = useState(false)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
      if (data) {
        setProfile(data as Profile)
        try { sessionStorage.setItem('hk_profile', JSON.stringify(data)) } catch {}
      }
      return data as Profile | null
    } catch {
      return null
    }
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  // Org helpers
  const refreshOrg = useCallback(async () => {
    try {
      const res = await fetch('/api/enterprise')
      const data = await res.json()
      if (data.organization) {
        const org: OrgContext = {
          id: data.organization.id,
          name: data.organization.name,
          slug: data.organization.slug,
          logo_url: data.organization.logo_url,
          industry: data.organization.industry,
          owner_id: data.organization.owner_id,
        }
        // Always store the user's org membership
        setUserOrg(org)
        setUserOrgRole(data.role)
        // Restore org mode if it was previously active
        try {
          const savedOrgId = sessionStorage.getItem('hk_active_org')
          if (savedOrgId === org.id) {
            setActiveOrg(org)
            setOrgRole(data.role)
            setOrgMode(true)
          }
        } catch {}
      } else {
        setUserOrg(null)
        setUserOrgRole(null)
      }
    } catch {}
  }, [])

  const refreshInvites = useCallback(async () => {
    try {
      const res = await fetch('/api/enterprise/invites')
      const data = await res.json()
      setPendingInvites(data.invites || [])
    } catch {}
  }, [])

  const switchToOrg = useCallback((org: OrgContext, role: string) => {
    setActiveOrg(org)
    setOrgRole(role)
    setOrgMode(true)
    try { sessionStorage.setItem('hk_active_org', org.id) } catch {}
  }, [])

  const switchToPersonal = useCallback(() => {
    setActiveOrg(null)
    setOrgRole(null)
    setOrgMode(false)
    try { sessionStorage.removeItem('hk_active_org') } catch {}
  }, [])

  useEffect(() => {
    let isMounted = true
    let resolved = false

    const resolve = () => {
      if (!resolved && isMounted) {
        resolved = true
        setLoading(false)
      }
    }

    // Safety timeout
    const timeout = setTimeout(resolve, 3000)

    // Restore cached profile instantly to avoid blank flash
    try {
      const cached = sessionStorage.getItem('hk_profile')
      if (cached) {
        const p = JSON.parse(cached) as Profile
        if (p?.id) setProfile(p)
      }
    } catch {}

    // Fast path: getSession resolves faster than onAuthStateChange
    supabase.auth.getSession().then(async ({ data: { session: s } }: { data: { session: Session | null } }) => {
      if (!isMounted) return
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        await fetchProfile(s.user.id)
      } else {
        setProfile(null)
        try { sessionStorage.removeItem('hk_profile') } catch {}
      }
      resolve()
    })

    // Also listen for future auth changes (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, s: Session | null) => {
        if (!isMounted || loggingOut) return
        setSession(s)
        setUser(s?.user ?? null)
        if (s?.user) {
          await fetchProfile(s.user.id)
          resolve()
        } else {
          setProfile(null)
          try { sessionStorage.removeItem('hk_profile') } catch {}
          resolve()
        }
      }
    )

    return () => {
      isMounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) return { error: data.error || 'Invalid email or password' }

      // Just refresh the session — onAuthStateChange will handle user + profile
      await supabase.auth.getSession()

      const redirect = data.user?.profile?.role === 'Admin' ? '/admin' : '/dashboard'
      return { redirect }
    } catch {
      return { error: 'Network error. Please try again.' }
    }
  }, [supabase])

  const signup = useCallback(async (signupData: SignupData) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupData.email,
          password: signupData.password,
          full_name: signupData.full_name,
          phone: signupData.phone,
          role: signupData.role,
          county: signupData.county,
          skills: signupData.skills,
          title: signupData.title,
          bio: signupData.bio,
        }),
      })
      const data = await res.json()
      if (!res.ok) return { error: data.error || 'Signup failed' }

      // Just refresh the session — onAuthStateChange will handle user + profile
      await supabase.auth.getSession()

      return {}
    } catch {
      return { error: 'Network error. Please try again.' }
    }
  }, [supabase])

  // Fetch org + invites after profile loads
  useEffect(() => {
    if (profile) {
      refreshOrg()
      refreshInvites()
    }
  }, [profile]) // eslint-disable-line react-hooks/exhaustive-deps

  const logout = useCallback(async () => {
    setLoggingOut(true)
    // Clear all state immediately
    setUser(null)
    setProfile(null)
    setSession(null)
    setUserOrg(null)
    setUserOrgRole(null)
    setActiveOrg(null)
    setOrgRole(null)
    setOrgMode(false)
    setPendingInvites([])
    try {
      sessionStorage.removeItem('hk_profile')
      sessionStorage.removeItem('hk_active_org')
    } catch {}
    // Sign out on server and client
    try { await fetch('/api/auth/logout', { method: 'POST' }) } catch {}
    try { await supabase.auth.signOut() } catch {}
    // Hard redirect to ensure clean state
    window.location.href = '/'
  }, [supabase])

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, login, signup, logout, refreshProfile, userOrg, userOrgRole, activeOrg, orgRole, orgMode, pendingInvites, switchToOrg, switchToPersonal, refreshOrg, refreshInvites }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
