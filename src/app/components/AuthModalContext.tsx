'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type AuthModalView = 'login' | 'signup' | 'forgot-password'

interface AuthModalContextType {
  isOpen: boolean
  view: AuthModalView
  openLogin: () => void
  openSignup: (type?: 'freelancer' | 'client') => void
  openForgotPassword: () => void
  closeModal: () => void
  setView: (view: AuthModalView) => void
  signupType: 'freelancer' | 'client'
  setSignupType: (type: 'freelancer' | 'client') => void
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined)

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<AuthModalView>('login')
  const [signupType, setSignupType] = useState<'freelancer' | 'client'>('freelancer')

  const openLogin = useCallback(() => {
    setView('login')
    setIsOpen(true)
  }, [])

  const openSignup = useCallback((type?: 'freelancer' | 'client') => {
    if (type) setSignupType(type)
    setView('signup')
    setIsOpen(true)
  }, [])

  const openForgotPassword = useCallback(() => {
    setView('forgot-password')
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => setIsOpen(false), [])

  return (
    <AuthModalContext.Provider value={{ isOpen, view, openLogin, openSignup, openForgotPassword, closeModal, setView, signupType, setSignupType }}>
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
