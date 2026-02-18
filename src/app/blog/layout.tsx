import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog — Freelancing Tips & Guides | HustleKE',
  description: 'Insights, guides, and tips for freelancers in Kenya. Learn about M-Pesa payments, career growth, and how to succeed on HustleKE.',
  keywords: ['freelancing blog Kenya', 'freelance tips', 'M-Pesa freelancing', 'remote work Kenya'],
  openGraph: {
    title: 'Blog — Freelancing Tips & Guides | HustleKE',
    description: 'Insights, guides, and tips for freelancers in Kenya.',
    type: 'website',
  },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}
