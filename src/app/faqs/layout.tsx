import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQs | HustleKE',
  description: 'Frequently asked questions about HustleKE. Learn about payments, escrow, fees, M-Pesa integration, and how to get started freelancing in Kenya.',
  openGraph: {
    title: 'FAQs | HustleKE',
    description: 'Common questions about freelancing on HustleKE answered.',
    type: 'website',
  },
}

export default function FaqsLayout({ children }: { children: React.ReactNode }) {
  return children
}
