import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Enterprise Solutions | HustleKE',
  description: 'Enterprise hiring solutions for teams. Manage freelancer benches, team wallets, org analytics, and enjoy reduced 2% service fees.',
  keywords: ['enterprise freelancing', 'team hiring Kenya', 'bulk hiring', 'organization freelance'],
  openGraph: {
    title: 'Enterprise Solutions | HustleKE',
    description: 'Enterprise hiring solutions with team management, shared wallets, and 2% service fees.',
    type: 'website',
  },
}

export default function EnterpriseLayout({ children }: { children: React.ReactNode }) {
  return children
}
