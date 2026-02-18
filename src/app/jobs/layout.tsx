import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Browse Freelance Jobs in Kenya | HustleKE',
  description: 'Find freelance jobs in Kenya. Web development, design, writing, marketing & more. Get paid instantly via M-Pesa with secure escrow protection.',
  keywords: ['freelance jobs Kenya', 'remote work Kenya', 'M-Pesa freelancing', 'Kenyan freelancers', 'online jobs Kenya'],
  openGraph: {
    title: 'Browse Freelance Jobs in Kenya | HustleKE',
    description: 'Find freelance jobs in Kenya. Web development, design, writing, marketing & more. Get paid instantly via M-Pesa.',
    type: 'website',
  },
}

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children
}
