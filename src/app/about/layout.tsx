import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us | HustleKE',
  description: 'HustleKE is Kenya\'s premier freelance marketplace. Our mission is to connect Kenyan talent with global opportunities through secure M-Pesa payments.',
  openGraph: {
    title: 'About Us | HustleKE',
    description: 'Kenya\'s premier freelance marketplace connecting Kenyan talent with global opportunities.',
    type: 'website',
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
