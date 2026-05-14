import type { MetadataRoute } from 'next'
import { FEATURE_SLUGS } from '@/components/landing/features/feature-content'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nishon.ai'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${SITE_URL}/features`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/solutions`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/marketplace`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/privacy`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const featureEntries: MetadataRoute.Sitemap = FEATURE_SLUGS.map((slug) => ({
    url: `${SITE_URL}/features/${slug}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticEntries, ...featureEntries]
}
