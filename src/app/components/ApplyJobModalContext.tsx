'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export interface ApplyJob {
  id: string
  title: string
  description: string
  budget_min: number
  budget_max: number
  payment_type?: string
  skills_required?: string[]
  location_preference?: string
  remote_allowed?: boolean
  proposals_count?: number
  created_at?: string
  client?: {
    id: string
    full_name: string
    avatar_url?: string
    verification_status?: string
    hustle_score?: number
  }
}

interface ApplyJobModalContextType {
  isOpen: boolean
  job: ApplyJob | null
  openModal: (job: ApplyJob) => void
  closeModal: () => void
}

const ApplyJobModalContext = createContext<ApplyJobModalContextType | undefined>(undefined)

export function ApplyJobModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [job, setJob] = useState<ApplyJob | null>(null)

  const openModal = (jobData: ApplyJob) => {
    setJob(jobData)
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
    setJob(null)
  }

  return (
    <ApplyJobModalContext.Provider value={{ isOpen, job, openModal, closeModal }}>
      {children}
    </ApplyJobModalContext.Provider>
  )
}

export function useApplyJobModal() {
  const context = useContext(ApplyJobModalContext)
  if (context === undefined) {
    throw new Error('useApplyJobModal must be used within an ApplyJobModalProvider')
  }
  return context
}
