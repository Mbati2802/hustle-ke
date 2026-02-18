import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hire Top Kenyan Freelancers | HustleKE',
  description: 'Browse verified Kenyan freelancers. Web developers, designers, writers, virtual assistants & more. Secure escrow payments via M-Pesa.',
  keywords: ['hire freelancers Kenya', 'Kenyan developers', 'African talent', 'remote freelancers', 'M-Pesa payments'],
  openGraph: {
    title: 'Hire Top Kenyan Freelancers | HustleKE',
    description: 'Browse verified Kenyan freelancers. Web developers, designers, writers & more. Secure escrow payments via M-Pesa.',
    type: 'website',
  },
}

export default function TalentLayout({ children }: { children: React.ReactNode }) {
  return children
}
