'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import PostJobModal from './PostJobModal'

export interface PostJobInitialData {
  title?: string
  description?: string
  category?: string
  skills?: string[]
  budget?: number
  budgetMin?: number
  budgetMax?: number
}

interface PostJobModalContextType {
  isOpen: boolean
  openModal: (initialData?: PostJobInitialData) => void
  closeModal: () => void
}

const PostJobModalContext = createContext<PostJobModalContextType | undefined>(undefined)

export function PostJobModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [initialData, setInitialData] = useState<PostJobInitialData | undefined>(undefined)

  const openModal = useCallback((data?: PostJobInitialData) => {
    setInitialData(data)
    setIsOpen(true)
  }, [])
  const closeModal = useCallback(() => {
    setIsOpen(false)
    setInitialData(undefined)
  }, [])

  return (
    <PostJobModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
      <PostJobModal isOpen={isOpen} onClose={closeModal} initialData={initialData} />
    </PostJobModalContext.Provider>
  )
}

export function usePostJobModal() {
  const context = useContext(PostJobModalContext)
  if (context === undefined) {
    throw new Error('usePostJobModal must be used within PostJobModalProvider')
  }
  return context
}
