import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Career Intelligence | HustleKE',
  description: 'AI-powered market insights, earnings data, and career guidance for Kenyan freelancers. Discover trending skills and salary benchmarks.',
  keywords: ['freelance career Kenya', 'salary data Kenya', 'trending skills', 'AI career guidance'],
  openGraph: {
    title: 'Career Intelligence | HustleKE',
    description: 'AI-powered market insights and earnings data for Kenyan freelancers.',
    type: 'website',
  },
}

export default function CareerIntelligenceLayout({ children }: { children: React.ReactNode }) {
  return children
}
