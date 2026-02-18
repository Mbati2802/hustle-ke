import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | HustleKE',
  description: 'HustleKE terms of service. Rules, guidelines, and legal agreement for using Kenya\'s premier freelance marketplace.',
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
