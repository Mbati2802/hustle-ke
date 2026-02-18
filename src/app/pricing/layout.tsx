import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing Plans | HustleKE',
  description: 'Simple, transparent pricing. Free plan with 6% fee or Pro plan at KES 500/month with 4% fee, priority matching, and advanced analytics.',
  keywords: ['HustleKE pricing', 'freelance platform fees', 'Pro plan Kenya', 'freelance subscription'],
  openGraph: {
    title: 'Pricing Plans | HustleKE',
    description: 'Simple, transparent pricing. Free plan with 6% fee or Pro plan at KES 500/month with 4% fee.',
    type: 'website',
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
