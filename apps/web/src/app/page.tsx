import type { Metadata } from 'next'
import { PublicFooter, PublicNavbar } from '@/components/public/PublicLayout'
import { HeroSection } from '@/components/landing/sections/HeroSection'
import { TrustedBySection } from '@/components/landing/sections/TrustedBySection'
import { PainPointsSection } from '@/components/landing/sections/PainPointsSection'
import { CapabilitiesSection } from '@/components/landing/sections/CapabilitiesSection'
import { HowItWorksSection } from '@/components/landing/sections/HowItWorksSection'
import { UseCasesSection } from '@/components/landing/sections/UseCasesSection'
import { RoiSection } from '@/components/landing/sections/RoiSection'
import { PricingSection } from '@/components/landing/sections/PricingSection'
import { SecuritySection } from '@/components/landing/sections/SecuritySection'
import { TestimonialsSection } from '@/components/landing/sections/TestimonialsSection'
import { FaqSection } from '@/components/landing/sections/FaqSection'
import { FinalCtaSection } from '@/components/landing/sections/FinalCtaSection'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nishon.ai'
const OG_IMAGE = '/stock/home-hero-demo.svg'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Nishon AI — Autonomous Performance Marketing Platform',
  description:
    'AI-powered platform for performance marketing: launch ads, manage campaigns, calculate ROAS, and connect with experts — all in one workspace.',
  alternates: {
    canonical: '/',
    languages: { ru: '/', en: '/', uz: '/' },
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Nishon AI',
    title: 'Nishon AI — Autonomous Performance Marketing Platform',
    description:
      'Launch campaigns, optimize creatives, and grow ROAS with an autonomous AI co-pilot for marketers and agencies.',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Nishon AI' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nishon AI — Autonomous Performance Marketing',
    description:
      'AI-powered ad launching, creative scoring, and ROAS optimization for brands and agencies.',
    images: [OG_IMAGE],
  },
  robots: { index: true, follow: true },
}

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Nishon AI',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.svg`,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'Nishon AI',
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: ['ru', 'en', 'uz'],
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Nishon AI',
      operatingSystem: 'Web',
      applicationCategory: 'BusinessApplication',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  ],
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />
      <a
        href="#hero-heading"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow"
      >
        Skip to content
      </a>
      <main className="min-h-screen bg-surface text-text-primary">
        <PublicNavbar />
        <HeroSection />
        <TrustedBySection />
        <PainPointsSection />
        <CapabilitiesSection />
        <HowItWorksSection />
        <UseCasesSection />
        <RoiSection />
        <PricingSection />
        <SecuritySection />
        <TestimonialsSection />
        <FaqSection />
        <FinalCtaSection />
        <PublicFooter />
      </main>
    </>
  )
}
