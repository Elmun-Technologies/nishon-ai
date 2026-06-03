import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PublicFooter, PublicNavbar } from '@/components/public/PublicLayout'
import { FeatureDetail } from '@/components/landing/features/FeatureDetail'
import {
  FEATURE_CATEGORY_LABEL,
  FEATURE_SLUGS,
  getFeatureContent,
} from '@/components/landing/features/feature-content'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nishon.ai'
const OG_IMAGE = '/stock/home-hero-demo.svg'

interface RouteParams {
  params: { slug: string }
}

export function generateStaticParams(): Array<{ slug: string }> {
  return FEATURE_SLUGS.map((slug) => ({ slug }))
}

export function generateMetadata({ params }: RouteParams): Metadata {
  const feature = getFeatureContent(params.slug)
  if (!feature) return {}

  const url = `${SITE_URL}/features/${feature.slug}`
  const title = `${feature.hero.title} — AdSpectr AI`

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description: feature.seoDescription,
    keywords: feature.keywords,
    alternates: {
      canonical: `/features/${feature.slug}`,
      languages: {
        ru: `/features/${feature.slug}`,
        en: `/features/${feature.slug}`,
        uz: `/features/${feature.slug}`,
      },
    },
    openGraph: {
      type: 'website',
      url,
      siteName: 'AdSpectr AI',
      title,
      description: feature.seoDescription,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: feature.hero.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: feature.seoDescription,
      images: [OG_IMAGE],
    },
    robots: { index: true, follow: true },
  }
}

export default function FeatureDetailPage({ params }: RouteParams) {
  const f = getFeatureContent(params.slug)
  if (!f) notFound()

  const url = `${SITE_URL}/features/${f.slug}`
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'AdSpectr AI', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Возможности', item: `${SITE_URL}/features` },
          { '@type': 'ListItem', position: 3, name: f.hero.title, item: url },
        ],
      },
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: f.hero.title,
        description: f.seoDescription,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: {
          '@type': 'SoftwareApplication',
          name: f.hero.title,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        },
        breadcrumb: { '@id': `${url}#breadcrumb` },
        inLanguage: 'ru',
      },
      {
        '@type': 'FAQPage',
        mainEntity: f.faq.map((entry) => ({
          '@type': 'Question',
          name: entry.q,
          acceptedAnswer: { '@type': 'Answer', text: entry.a },
        })),
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <a
        href="#feature-hero-heading"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[#1b2e06] focus:shadow-[0_8px_24px_-8px_rgba(27,46,6,0.32)] focus:ring-1 focus:ring-[#1b2e06]/20"
      >
        Skip to content
      </a>
      <main
        className="min-h-screen bg-white text-text-primary"
        data-feature-category={f.category}
        data-feature-category-label={FEATURE_CATEGORY_LABEL[f.category]}
      >
        <PublicNavbar />
        <FeatureDetail feature={f} />
        <PublicFooter />
      </main>
    </>
  )
}
