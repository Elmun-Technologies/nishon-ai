import type { Metadata } from 'next'
import { SeoMetadata } from '@/hooks/useSeoMetadata'

/**
 * Props for SeoHead component
 */
interface SeoHeadProps {
  metadata: SeoMetadata
  additionalMeta?: Array<{
    name?: string
    property?: string
    content: string
  }>
}

/**
 * Server-side component for injecting SEO metadata
 * Use with Next.js Metadata API (recommended for SSR)
 *
 * Usage:
 * ```tsx
 * import { SeoHead, generateMetadata } from '@/components/seo/SeoHead'
 *
 * export const metadata: Metadata = generateMetadata({...})
 *
 * export default function Page() {
 *   return <SeoHead metadata={metadata} />
 * }
 * ```
 */
export function SeoHead({ metadata, additionalMeta }: SeoHeadProps) {
  return (
    <>
      {/* Basic Meta Tags */}
      <title>{metadata.title}</title>
      <meta name="description" content={metadata.description} />
      <meta name="keywords" content={metadata.keywords.join(', ')} />
      <meta name="language" content={metadata.language} />

      {/* Canonical URL */}
      <link rel="canonical" href={metadata.canonicalUrl} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={metadata.ogTitle} />
      <meta property="og:description" content={metadata.ogDescription} />
      <meta property="og:image" content={metadata.ogImage} />
      <meta property="og:url" content={metadata.ogUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Performa" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={metadata.twitterCard} />
      <meta name="twitter:title" content={metadata.twitterTitle} />
      <meta name="twitter:description" content={metadata.twitterDescription} />
      <meta name="twitter:image" content={metadata.twitterImage} />
      <meta name="twitter:site" content="@performa" />

      {/* Additional Meta Tags */}
      {additionalMeta?.map((tag, idx) => (
        <meta
          key={idx}
          {...(tag.name && { name: tag.name })}
          {...(tag.property && { property: tag.property })}
          content={tag.content}
        />
      ))}

      {/* Structured Data (JSON-LD) */}
      {Object.keys(metadata.structuredData).length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(metadata.structuredData),
          }}
        />
      )}
    </>
  )
}

/**
 * Helper function to convert SeoMetadata to Next.js Metadata
 */
export function generateMetadata(metadata: SeoMetadata): Metadata {
  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    canonical: metadata.canonicalUrl,
    alternates: {
      canonical: metadata.canonicalUrl,
    },
    openGraph: {
      title: metadata.ogTitle,
      description: metadata.ogDescription,
      url: metadata.ogUrl,
      images: [
        {
          url: metadata.ogImage,
          width: 1200,
          height: 630,
          alt: metadata.ogTitle,
        },
      ],
      type: 'website',
      siteName: 'Performa',
    },
    twitter: {
      card: metadata.twitterCard,
      title: metadata.twitterTitle,
      description: metadata.twitterDescription,
      images: [metadata.twitterImage],
      creator: '@performa',
    },
    robots: {
      index: true,
      follow: true,
      nocache: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
    other: {
      'og:type': 'website',
      'og:site_name': 'Performa',
    },
  }
}

/**
 * Client-side component for injecting SEO metadata dynamically
 * Use when metadata needs to be loaded client-side
 */
'use client'

import { useEffect } from 'react'

interface ClientSeoHeadProps {
  metadata: SeoMetadata | null
}

export function ClientSeoHead({ metadata }: ClientSeoHeadProps) {
  useEffect(() => {
    if (!metadata) return

    // Update title
    document.title = metadata.title

    // Update or create meta tags
    updateMetaTag('description', metadata.description, 'name')
    updateMetaTag('keywords', metadata.keywords.join(', '), 'name')

    // Update OG tags
    updateMetaTag('og:title', metadata.ogTitle, 'property')
    updateMetaTag('og:description', metadata.ogDescription, 'property')
    updateMetaTag('og:image', metadata.ogImage, 'property')
    updateMetaTag('og:url', metadata.ogUrl, 'property')

    // Update Twitter tags
    updateMetaTag('twitter:card', metadata.twitterCard, 'name')
    updateMetaTag('twitter:title', metadata.twitterTitle, 'name')
    updateMetaTag('twitter:description', metadata.twitterDescription, 'name')
    updateMetaTag('twitter:image', metadata.twitterImage, 'name')

    // Update canonical URL
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = metadata.canonicalUrl

    // Inject structured data
    if (Object.keys(metadata.structuredData).length > 0) {
      let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement
      if (!script) {
        script = document.createElement('script')
        script.type = 'application/ld+json'
        document.head.appendChild(script)
      }
      script.textContent = JSON.stringify(metadata.structuredData)
    }
  }, [metadata])

  return null
}

/**
 * Update or create a meta tag
 */
function updateMetaTag(
  name: string,
  content: string,
  attribute: 'name' | 'property' = 'name',
): void {
  let tag = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attribute, name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}
