import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | HustleKE',
  description: 'HustleKE privacy policy. Learn how we collect, use, and protect your personal data in compliance with Kenya\'s Data Protection Act.',
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}
