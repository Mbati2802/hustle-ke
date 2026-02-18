import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How It Works | HustleKE',
  description: 'Learn how HustleKE works. Create your profile, find work, submit proposals, use secure M-Pesa escrow, and get paid instantly.',
  keywords: ['how HustleKE works', 'freelance Kenya guide', 'M-Pesa escrow', 'get paid freelancing'],
  openGraph: {
    title: 'How It Works | HustleKE',
    description: 'Learn how to freelance on HustleKE. From sign-up to first payout with M-Pesa.',
    type: 'website',
  },
}

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return children
}
