import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | HustleKE',
  description: 'Get in touch with the HustleKE team. We\'re here to help with any questions about freelancing, payments, or platform features.',
  openGraph: {
    title: 'Contact Us | HustleKE',
    description: 'Get in touch with the HustleKE team.',
    type: 'website',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
