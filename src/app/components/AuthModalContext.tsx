'use client'

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'

type AuthModalView = 'login' | 'signup' | 'forgot-password'

interface OpenLoginOptions {
  redirectTo?: string
  afterLogin?: () => void
}

interface AuthModalContextType {
  isOpen: boolean
  view: AuthModalView
  openLogin: (opts?: OpenLoginOptions) => void
  openSignup: (type?: 'freelancer' | 'client', opts?: { redirectTo?: string }) => void
  openForgotPassword: () => void
  closeModal: () => void
  setView: (view: AuthModalView) => void
  signupType: 'freelancer' | 'client'
  setSignupType: (type: 'freelancer' | 'client') => void
  pendingRedirect: string | null
  pendingCallbackRef: React.MutableRefObject<(() => void) | null>
  clearPending: () => void
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined)

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<AuthModalView>('login')
  const [signupType, setSignupType] = useState<'freelancer' | 'client'>('freelancer')
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null)
  const pendingCallbackRef = useRef<(() => void) | null>(null)

  const openLogin = useCallback((opts?: OpenLoginOptions) => {
    if (opts?.afterLogin) pendingCallbackRef.current = opts.afterLogin
    if (opts?.redirectTo) setPendingRedirect(opts.redirectTo)
    setView('login')
    setIsOpen(true)
  }, [])

  const openSignup = useCallback((type?: 'freelancer' | 'client', opts?: { redirectTo?: string }) => {
    if (type) setSignupType(type)
    if (opts?.redirectTo) setPendingRedirect(opts.redirectTo)
    setView('signup')
    setIsOpen(true)
  }, [])

  const openForgotPassword = useCallback(() => {
    setView('forgot-password')
    setIsOpen(true)
  }, [])

  const clearPending = useCallback(() => {
    pendingCallbackRef.current = null
    setPendingRedirect(null)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <AuthModalContext.Provider value={{ isOpen, view, openLogin, openSignup, openForgotPassword, closeModal, setView, signupType, setSignupType, pendingRedirect, pendingCallbackRef, clearPending }}>
      {children}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (context === undefined) {
    throw new Error('useAuthModal must be used within AuthModalProvider')
  }
  return context
}
