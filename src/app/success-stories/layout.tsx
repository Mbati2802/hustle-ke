import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Success Stories | HustleKE',
  description: 'Meet the talented Kenyans who transformed their careers through HustleKE. Real stories of freelancers earning via M-Pesa.',
  openGraph: {
    title: 'Success Stories | HustleKE',
    description: 'Real stories of Kenyan freelancers building successful careers on HustleKE.',
    type: 'website',
  },
}

export default function SuccessStoriesLayout({ children }: { children: React.ReactNode }) {
  return children
}
