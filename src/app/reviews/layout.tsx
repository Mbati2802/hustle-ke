import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reviews & Testimonials | HustleKE',
  description: 'Read reviews and ratings from freelancers and clients on HustleKE. See what the community says about Kenya\'s premier freelance marketplace.',
  openGraph: {
    title: 'Reviews & Testimonials | HustleKE',
    description: 'Read reviews from the HustleKE freelance community.',
    type: 'website',
  },
}

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return children
}
