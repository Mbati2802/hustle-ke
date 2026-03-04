// SEO metadata helper for dynamic Open Graph and meta tags

export interface SEOProps {
  title?: string
  description?: string
  path?: string
  image?: string
  type?: 'website' | 'article' | 'profile'
  noIndex?: boolean
}

const SITE_NAME = 'HustleKe'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://hustleke.com'
const DEFAULT_IMAGE = `${BASE_URL}/images/og-default.png`
const DEFAULT_DESCRIPTION = "Kenya's #1 freelance marketplace. Find work, hire talent, and get paid via M-Pesa. Secure escrow, AI-powered matching, and verified professionals."

export function generateMetadata(props: SEOProps = {}) {
  const title = props.title ? `${props.title} | ${SITE_NAME}` : `${SITE_NAME} — Kenya's #1 Freelance Marketplace`
  const description = props.description || DEFAULT_DESCRIPTION
  const url = props.path ? `${BASE_URL}${props.path}` : BASE_URL
  const image = props.image || DEFAULT_IMAGE

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      locale: 'en_KE',
      type: props.type || 'website',
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      images: [image],
      creator: '@hustleke',
    },
    alternates: {
      canonical: url,
    },
    robots: props.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    other: {
      'msapplication-TileColor': '#16a34a',
      'theme-color': '#16a34a',
    },
  }
}

// Structured data for organization
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/images/logo.png`,
    description: DEFAULT_DESCRIPTION,
    sameAs: [
      'https://x.com/hustleke',
      'https://linkedin.com/company/hustleke',
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'KE',
    },
  }
}

// Structured data for job posting
export function getJobPostingSchema(job: {
  title: string
  description: string
  budget_min?: number
  budget_max?: number
  skills_required?: string[]
  created_at: string
  id: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.created_at,
    employmentType: 'CONTRACT',
    jobLocation: {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressCountry: 'KE' },
    },
    baseSalary: job.budget_min ? {
      '@type': 'MonetaryAmount',
      currency: 'KES',
      value: {
        '@type': 'QuantitativeValue',
        minValue: job.budget_min,
        maxValue: job.budget_max || job.budget_min,
        unitText: 'PROJECT',
      },
    } : undefined,
    skills: job.skills_required?.join(', '),
    url: `${BASE_URL}/jobs/${job.id}`,
    hiringOrganization: {
      '@type': 'Organization',
      name: SITE_NAME,
      sameAs: BASE_URL,
    },
  }
}
