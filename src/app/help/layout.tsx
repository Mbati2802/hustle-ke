import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Help Center | HustleKE',
  description: 'Find answers to common questions about freelancing on HustleKE. Guides on payments, M-Pesa, escrow, proposals, and more.',
  keywords: ['HustleKE help', 'freelance support Kenya', 'M-Pesa help', 'escrow support'],
  openGraph: {
    title: 'Help Center | HustleKE',
    description: 'Find answers to common questions about freelancing on HustleKE.',
    type: 'website',
  },
}

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children
}
