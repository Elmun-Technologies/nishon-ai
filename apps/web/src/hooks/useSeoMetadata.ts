'use client'

import { useEffect, useState } from 'react'

/**
 * SEO Metadata type definition
 */
export interface SeoMetadata {
  title: string
  description: string
  keywords: string[]
  canonicalUrl: string
  ogTitle: string
  ogDescription: string
  ogImage: string
  ogUrl: string
  twitterCard: 'summary' | 'summary_large_image'
  twitterTitle: string
  twitterDescription: string
  twitterImage: string
  structuredData: Record<string, any>
  language: string
}

/**
 * Hook for managing SEO metadata in client-side React components
 *
 * Usage:
 * ```ts
 * const metadata = useSeoMetadata('specialist', { slug: 'john-doe' })
 * // or
 * const metadata = useSeoMetadata('search', { filters: { platforms: ['Meta'] } })
 * ```
 */
export function useSeoMetadata(
  type: 'marketplace' | 'specialist' | 'search',
  data?: Record<string, any>,
  language: string = 'ru',
) {
  const [metadata, setMetadata] = useState<SeoMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true)
        setError(null)

        // Build request payload
        const payload = {
          type,
          data: data || {},
          language,
        }

        const response = await fetch('/api/seo/metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch SEO metadata: ${response.statusText}`)
        }

        const result = await response.json()
        setMetadata(result)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
        // Fallback to default metadata
        setMetadata(getDefaultMetadata(type, language))
      } finally {
        setLoading(false)
      }
    }

    fetchMetadata()
  }, [type, JSON.stringify(data), language])

  return {
    metadata,
    loading,
    error,
  }
}

/**
 * Get default metadata based on page type
 */
function getDefaultMetadata(type: string, language: string = 'ru'): SeoMetadata {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://adspectr.com'

  const defaults = {
    marketplace: {
      en: {
        title: 'Find AI Marketing Specialists | AdSpectr Marketplace',
        description:
          'Connect with certified performance marketing experts. Browse verified specialists with proven track records managing ad campaigns.',
        keywords: [
          'AI marketing specialist',
          'performance marketing',
          'ads management',
          'Meta certified expert',
          'Google ads specialist',
        ],
      },
      ru: {
        title: 'Найдите специалистов по маркетингу | Marketplace AdSpectr',
        description:
          'Найдите сертифицированных специалистов по маркетингу. Проверенные эксперты с подтвержденным опытом.',
        keywords: [
          'специалист по маркетингу',
          'маркетинг производительности',
          'управление объявлениями',
          'сертифицированный эксперт Meta',
        ],
      },
      uz: {
        title: 'Marketing mutaxassislarini toping | AdSpectr marketplace',
        description:
          'Sertifikatlangan marketing mutaxassislarini qidiring. Reklama kampaniyalarini boshqarish bo‘yicha tasdiqlangan tajriba.',
        keywords: [
          'marketing mutaxassisi',
          'performance marketing',
          'reklama boshqaruvi',
          'Meta sertifikati',
          'Google Ads mutaxassisi',
        ],
      },
    },
    specialist: {
      en: {
        title: 'Marketing Specialist Profile | AdSpectr',
        description: 'View this marketing specialist profile with performance metrics and certifications.',
        keywords: ['marketing specialist', 'performance marketing', 'ads expert'],
      },
      ru: {
        title: 'Профиль специалиста по маркетингу | AdSpectr',
        description: 'Посмотрите профиль этого специалиста по маркетингу с метриками производительности.',
        keywords: ['специалист по маркетингу', 'маркетинг производительности'],
      },
      uz: {
        title: 'Marketing mutaxassisi profili | AdSpectr',
        description:
          'Marketing mutaxassisi profili: samaradorlik metrikalari va sertifikatlar.',
        keywords: ['marketing mutaxassisi', 'performance marketing', 'reklama eksperti'],
      },
    },
    search: {
      en: {
        title: 'Search Results | AdSpectr Marketplace',
        description: 'Find marketing specialists matching your criteria. Filter by platform, experience, and ratings.',
        keywords: ['marketing specialist', 'hire expert', 'ads management'],
      },
      ru: {
        title: 'Результаты поиска | Marketplace AdSpectr',
        description:
          'Найдите специалистов по маркетингу в соответствии с вашими критериями. Фильтруйте по платформе и опыту.',
        keywords: ['специалист по маркетингу', 'нанять эксперта'],
      },
      uz: {
        title: 'Qidiruv natijalari | AdSpectr marketplace',
        description:
          'Mezonlaringizga mos marketing mutaxassislarini toping. Platforma, tajriba va reyting bo‘yicha filtr.',
        keywords: ['marketing mutaxassisi', 'ekspert yollash', 'reklama boshqaruvi'],
      },
    },
  }

  const typeDefaults = defaults[type as keyof typeof defaults] || defaults.marketplace
  const langDefaults =
    typeDefaults[language as keyof typeof typeDefaults] || typeDefaults.ru || typeDefaults.en

  return {
    title: langDefaults.title,
    description: langDefaults.description,
    keywords: langDefaults.keywords,
    canonicalUrl: baseUrl,
    ogTitle: langDefaults.title,
    ogDescription: langDefaults.description,
    ogImage: `${baseUrl}/og/default.png`,
    ogUrl: baseUrl,
    twitterCard: 'summary_large_image',
    twitterTitle: langDefaults.title,
    twitterDescription: langDefaults.description,
    twitterImage: `${baseUrl}/og/default.png`,
    structuredData: {},
    language,
  }
}

/**
 * Hook to inject metadata into page head
 * Use with next/head or Next.js Metadata API in layout
 */
export function useInjectSeoMetadata(metadata: SeoMetadata | null) {
  useEffect(() => {
    if (!metadata || typeof window === 'undefined') return

    // Update meta tags
    updateMetaTag('description', metadata.description)
    updateMetaTag('keywords', metadata.keywords.join(', '))

    // Update OG tags
    updateMetaTag('og:title', metadata.ogTitle, 'property')
    updateMetaTag('og:description', metadata.ogDescription, 'property')
    updateMetaTag('og:image', metadata.ogImage, 'property')
    updateMetaTag('og:url', metadata.ogUrl, 'property')

    // Update Twitter tags
    updateMetaTag('twitter:card', metadata.twitterCard)
    updateMetaTag('twitter:title', metadata.twitterTitle)
    updateMetaTag('twitter:description', metadata.twitterDescription)
    updateMetaTag('twitter:image', metadata.twitterImage)

    // Update canonical URL
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null
    if (canonical) {
      canonical.setAttribute('href', metadata.canonicalUrl)
    } else {
      canonical = document.createElement('link') as HTMLLinkElement
      canonical.rel = 'canonical'
      canonical.href = metadata.canonicalUrl
      document.head.appendChild(canonical)
    }

    // Inject structured data
    if (Object.keys(metadata.structuredData).length > 0) {
      injectStructuredData(metadata.structuredData)
    }

    // Update page title
    document.title = metadata.title
  }, [metadata])
}

/**
 * Update or create a meta tag
 */
function updateMetaTag(
  name: string,
  content: string,
  attribute: 'name' | 'property' = 'name',
): void {
  let tag = document.querySelector(`meta[${attribute}="${name}"]`)

  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attribute, name)
    document.head.appendChild(tag)
  }

  tag.setAttribute('content', content)
}

/**
 * Inject JSON-LD structured data
 */
function injectStructuredData(data: Record<string, any>): void {
  // Remove existing structured data script
  const existing = document.querySelector('script[type="application/ld+json"]')
  if (existing) {
    existing.remove()
  }

  // Create and inject new script
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
}
