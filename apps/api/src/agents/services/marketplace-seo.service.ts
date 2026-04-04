import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AgentProfile, AgentStats } from '../entities/agent-profile.entity'
import { MarketplaceSeoMetadata } from '../entities/marketplace-seo-metadata.entity'
import { AgentReview } from '../entities/agent-review.entity'

/**
 * SEO Metadata input for specialist profile
 */
export interface SpecialistSeoInput {
  agentProfile: AgentProfile
  stats?: AgentStats
  reviewCount?: number
  averageRating?: number
}

/**
 * SEO Metadata for search results
 */
export interface SearchResultsSeoInput {
  filters: Record<string, any>
  totalCount: number
  page?: number
  pageSize?: number
}

/**
 * Structured data types
 */
export type StructuredDataType = 'person' | 'organization' | 'searchaction' | 'aggregaterating' | 'aggregateoffer'

/**
 * SEO Metadata output
 */
export interface SeoMetadataOutput {
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

@Injectable()
export class MarketplaceSeoService {
  private readonly logger = new Logger(MarketplaceSeoService.name)

  // Marketing keywords for marketplace
  private readonly marketingKeywords = {
    main: ['AI marketing specialist', 'performance marketing', 'ads management'],
    certifications: ['Meta certified expert', 'Google certified', 'Yandex certified'],
    platforms: ['Meta ads', 'Google ads', 'Yandex ads', 'TikTok ads'],
    industries: ['E-commerce', 'SaaS', 'Agencies', 'Startups'],
  }

  constructor(
    @InjectRepository(MarketplaceSeoMetadata)
    private readonly seoMetadataRepository: Repository<MarketplaceSeoMetadata>,
    @InjectRepository(AgentProfile)
    private readonly agentProfileRepository: Repository<AgentProfile>,
    @InjectRepository(AgentReview)
    private readonly reviewRepository: Repository<AgentReview>,
  ) {}

  /**
   * Generate SEO metadata for a specialist profile
   * Includes title, description, keywords, and OG tags with performance metrics
   */
  async generateSpecialistMetadata(
    input: SpecialistSeoInput,
    language: string = 'en',
  ): Promise<SeoMetadataOutput> {
    const { agentProfile, stats, reviewCount = 0, averageRating = 0 } = input
    const baseUrl = this.getBaseUrl()

    // Build title with key performance metric
    const roas = stats?.avgROAS?.toFixed(1) || 'Verified'
    const title = this.buildSpecialistTitle(agentProfile, roas, language)

    // Build description with stats
    const description = this.buildSpecialistDescription(agentProfile, stats, averageRating, reviewCount, language)

    // Generate keywords specific to specialist
    const keywords = this.generateSpecialistKeywords(agentProfile, language)

    // Build canonical URL
    const slug = agentProfile.seoSlug || agentProfile.slug
    const canonicalUrl = `${baseUrl}/marketplace/specialists/${slug}`

    // OG tags
    const ogImage = agentProfile.avatar || `${baseUrl}/og/default-specialist.png`

    return {
      title,
      description,
      keywords,
      canonicalUrl,
      ogTitle: title,
      ogDescription: description,
      ogImage,
      ogUrl: canonicalUrl,
      twitterCard: 'summary_large_image',
      twitterTitle: this.truncate(title, 70),
      twitterDescription: this.truncate(description, 200),
      twitterImage: ogImage,
      structuredData: await this.generateSpecialistStructuredData(agentProfile, stats, averageRating, reviewCount),
      language,
    }
  }

  /**
   * Generate SEO metadata for search results page
   * Includes filter-specific keywords and count-based descriptions
   */
  async generateSearchResultsMetadata(
    input: SearchResultsSeoInput,
    language: string = 'en',
  ): Promise<SeoMetadataOutput> {
    const { filters, totalCount } = input
    const baseUrl = this.getBaseUrl()

    // Build title from filters
    const title = this.buildSearchTitle(filters, totalCount, language)
    const description = this.buildSearchDescription(filters, totalCount, language)
    const keywords = this.generateSearchKeywords(filters, language)

    // Build canonical URL with normalized query params
    const queryString = this.buildCanonicalQueryString(filters)
    const canonicalUrl = queryString
      ? `${baseUrl}/marketplace/specialists?${queryString}`
      : `${baseUrl}/marketplace/specialists`

    return {
      title,
      description,
      keywords,
      canonicalUrl,
      ogTitle: title,
      ogDescription: description,
      ogImage: `${baseUrl}/og/marketplace-search.png`,
      ogUrl: canonicalUrl,
      twitterCard: 'summary',
      twitterTitle: this.truncate(title, 70),
      twitterDescription: this.truncate(description, 200),
      twitterImage: `${baseUrl}/og/marketplace-search.png`,
      structuredData: this.generateSearchStructuredData(filters, totalCount, baseUrl),
      language,
    }
  }

  /**
   * Generate SEO metadata for marketplace landing page
   */
  async generateMarketplaceMetadata(language: string = 'en'): Promise<SeoMetadataOutput> {
    const baseUrl = this.getBaseUrl()

    // Get count of verified specialists
    const specialistCount = await this.agentProfileRepository.count({
      where: { isVerified: true, isPublished: true },
    })

    const titles = {
      en: 'Find AI Marketing Specialists | Performa Marketplace',
      ru: 'Найдите специалистов по маркетингу | Marketplace Performa',
    }

    const descriptions = {
      en: `Connect with certified performance marketing experts. Browse ${specialistCount}+ verified specialists with proven track records managing ad campaigns on Meta, Google, Yandex, and more.`,
      ru: `Найдите сертифицированных специалистов по маркетингу. ${specialistCount}+ проверенных экспертов с подтвержденным опытом управления кампаниями в Meta, Google, Yandex и других платформах.`,
    }

    const title = titles[language] || titles.en
    const description = descriptions[language] || descriptions.en

    const keywords = [
      ...this.marketingKeywords.main,
      ...this.marketingKeywords.certifications,
      ...this.marketingKeywords.platforms,
      ...this.marketingKeywords.industries,
    ]

    return {
      title,
      description,
      keywords,
      canonicalUrl: `${baseUrl}/marketplace`,
      ogTitle: title,
      ogDescription: description,
      ogImage: `${baseUrl}/og/marketplace-hero.png`,
      ogUrl: `${baseUrl}/marketplace`,
      twitterCard: 'summary_large_image',
      twitterTitle: this.truncate(title, 70),
      twitterDescription: this.truncate(description, 200),
      twitterImage: `${baseUrl}/og/marketplace-hero.png`,
      structuredData: await this.generateMarketplaceStructuredData(specialistCount, baseUrl),
      language,
    }
  }

  /**
   * Generate JSON-LD structured data for different entity types
   */
  async generateStructuredData(
    type: StructuredDataType,
    data: Record<string, any>,
  ): Promise<Record<string, any>> {
    const baseUrl = this.getBaseUrl()

    switch (type) {
      case 'person':
        return this.generatePersonSchema(data, baseUrl)
      case 'organization':
        return this.generateOrganizationSchema(data, baseUrl)
      case 'searchaction':
        return this.generateSearchActionSchema(baseUrl)
      case 'aggregaterating':
        return this.generateAggregateRatingSchema(data)
      case 'aggregateoffer':
        return this.generateAggregateOfferSchema(data)
      default:
        return {}
    }
  }

  /**
   * Save generated metadata to database
   */
  async saveMetadata(
    slug: string,
    pageType: 'marketplace' | 'specialist_profile' | 'filter_results',
    metadata: SeoMetadataOutput,
    resourceId?: string,
  ): Promise<MarketplaceSeoMetadata> {
    let seoMetadata = await this.seoMetadataRepository.findOne({ where: { slug } })

    if (!seoMetadata) {
      seoMetadata = this.seoMetadataRepository.create()
      seoMetadata.slug = slug
      seoMetadata.pageType = pageType
    }

    seoMetadata.metaTitle = metadata.title
    seoMetadata.metaDescription = metadata.description
    seoMetadata.keywords = metadata.keywords
    seoMetadata.canonicalUrl = metadata.canonicalUrl
    seoMetadata.ogImageUrl = metadata.ogImage
    seoMetadata.ogTitle = metadata.ogTitle
    seoMetadata.ogDescription = metadata.ogDescription
    seoMetadata.structuredData = metadata.structuredData
    seoMetadata.resourceId = resourceId

    return this.seoMetadataRepository.save(seoMetadata)
  }

  /**
   * Get cached metadata for a slug
   */
  async getMetadata(slug: string): Promise<MarketplaceSeoMetadata | null> {
    return this.seoMetadataRepository.findOne({
      where: { slug },
    })
  }

  // ─── Private Helper Methods ───────────────────────────────────────────────

  private buildSpecialistTitle(agentProfile: AgentProfile, roas: string, language: string): string {
    const baseTitle = agentProfile.displayName
    const certLevel = this.getCertificationLabel(agentProfile.certificationLevel, language)
    const platforms = agentProfile.platforms?.slice(0, 2).join('/') || 'Marketing'

    const titles = {
      en: `${baseTitle} - ${roas}x ROAS ${platforms} ${certLevel} | Performa`,
      ru: `${baseTitle} - ${roas}x ROAS ${platforms} ${certLevel} | Performa`,
    }

    return titles[language] || titles.en
  }

  private buildSpecialistDescription(
    profile: AgentProfile,
    stats: AgentStats | undefined,
    rating: number,
    reviewCount: number,
    language: string,
  ): string {
    const roasText = stats?.avgROAS?.toFixed(1) ? `${stats.avgROAS.toFixed(1)}x ROAS` : 'Verified performance'
    const ratingText = rating > 0 ? `${rating.toFixed(1)}/5 stars (${reviewCount} reviews)` : 'Verified specialist'
    const platforms = (profile.platforms || []).join(', ')
    const niches = (profile.niches || []).slice(0, 2).join(', ')

    const descriptions = {
      en: `Hire ${profile.displayName} - Certified ${profile.title}. Achieves ${roasText} on ${platforms}. ${ratingText}. Specializes in ${niches}. Available for ${profile.supportedLanguages?.join(', ') || 'English'} speaking clients.`,
      ru: `Наймите ${profile.displayName} - Сертифицированный ${profile.title}. Достигает ${roasText} на ${platforms}. ${ratingText}. Специализируется на ${niches}. Доступен для клиентов, говорящих на ${profile.supportedLanguages?.join(', ') || 'английском'}.`,
    }

    return this.truncate(descriptions[language] || descriptions.en, 160)
  }

  private buildSearchTitle(filters: Record<string, any>, totalCount: number, language: string): string {
    const parts: string[] = []

    if (filters.platforms && filters.platforms.length > 0) {
      parts.push(filters.platforms.slice(0, 2).join(', '))
    }
    if (filters.niches && filters.niches.length > 0) {
      parts.push(filters.niches.slice(0, 2).join(', '))
    }

    const filterText = parts.length > 0 ? `${parts.join(' ')} ` : ''

    const titles = {
      en: `${filterText}Marketing Specialists (${totalCount} results) | Performa`,
      ru: `${filterText}Специалисты по маркетингу (${totalCount} результатов) | Performa`,
    }

    return this.truncate(titles[language] || titles.en, 60)
  }

  private buildSearchDescription(filters: Record<string, any>, totalCount: number, language: string): string {
    const parts: string[] = []

    if (filters.platforms && filters.platforms.length > 0) {
      parts.push(`Experts in ${filters.platforms.join(', ')}`)
    }
    if (filters.minRating) {
      parts.push(`with ${filters.minRating}+ star rating`)
    }
    if (filters.certifications && filters.certifications.length > 0) {
      parts.push('with verified certifications')
    }

    const filterText = parts.length > 0 ? parts.join('. ') : 'Verified marketing specialists'

    const descriptions = {
      en: `Browse ${totalCount} ${filterText} on Performa marketplace. Find certified performance marketing experts by platform, niche, location and ratings. Compare performance metrics and hire the best.`,
      ru: `Просмотрите ${totalCount} ${filterText} на маркетплейсе Performa. Найдите сертифицированных специалистов по платформам, нишам, местоположению и рейтингам. Сравните метрики и нанимайте лучших.`,
    }

    return this.truncate(descriptions[language] || descriptions.en, 160)
  }

  private generateSpecialistKeywords(profile: AgentProfile, language: string): string[] {
    const keywords: string[] = []

    // Add platform-specific keywords
    if (profile.platforms) {
      profile.platforms.forEach((platform) => {
        keywords.push(`${platform} marketing specialist`)
        keywords.push(`${platform} certified expert`)
      })
    }

    // Add niche keywords
    if (profile.niches) {
      profile.niches.slice(0, 3).forEach((niche) => {
        keywords.push(`${niche} marketing`)
        keywords.push(`${niche} ads specialist`)
      })
    }

    // Add certification keywords
    if (profile.certificationLevel !== 'unverified') {
      keywords.push('certified marketing expert')
      keywords.push('verified ad specialist')
    }

    // Add location keywords
    if (profile.primaryCountries) {
      profile.primaryCountries.slice(0, 2).forEach((country) => {
        keywords.push(`${country} marketing specialist`)
      })
    }

    // Add common marketing keywords
    keywords.push(...this.marketingKeywords.main)

    return [...new Set(keywords)].slice(0, 10)
  }

  private generateSearchKeywords(filters: Record<string, any>, language: string): string[] {
    const keywords: string[] = []

    if (filters.platforms && Array.isArray(filters.platforms)) {
      filters.platforms.slice(0, 3).forEach((p: string) => {
        keywords.push(`${p} ads specialist`)
        keywords.push(`hire ${p} expert`)
      })
    }

    if (filters.niches && Array.isArray(filters.niches)) {
      filters.niches.slice(0, 2).forEach((n: string) => {
        keywords.push(`${n} marketing specialist`)
      })
    }

    // Add base marketing keywords
    keywords.push('marketing expert')
    keywords.push('performance marketing')
    keywords.push('ads management')
    keywords.push('hire marketing specialist')

    return keywords.slice(0, 10)
  }

  private buildCanonicalQueryString(filters: Record<string, any>): string {
    const allowed = ['platforms', 'niches', 'certifications', 'minRating', 'page']
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (allowed.includes(key) && value) {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, String(v)))
        } else {
          params.append(key, String(value))
        }
      }
    })

    return params.toString()
  }

  private getCertificationLabel(level: string, language: string): string {
    const labels = {
      en: {
        unverified: 'Specialist',
        self_declared: 'Self-Declared Expert',
        verified: 'Verified Expert',
        premium: 'Premium Expert',
      },
      ru: {
        unverified: 'Специалист',
        self_declared: 'Самозаявленный эксперт',
        verified: 'Проверенный эксперт',
        premium: 'Премиум эксперт',
      },
    }

    return labels[language]?.[level] || labels.en[level]
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + '...'
  }

  private getBaseUrl(): string {
    return process.env.FRONTEND_URL || 'https://performa.ai'
  }

  // ─── Structured Data Generation ───────────────────────────────────────────

  private async generateSpecialistStructuredData(
    profile: AgentProfile,
    stats: AgentStats | undefined,
    rating: number,
    reviewCount: number,
  ): Promise<Record<string, any>> {
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: profile.displayName,
      description: profile.bio || profile.title,
      url: `${this.getBaseUrl()}/marketplace/specialists/${profile.seoSlug || profile.slug}`,
      image: profile.avatar,
      jobTitle: profile.title,
      workLocation: {
        '@type': 'City',
        name: profile.location || 'Remote',
      },
      knowsLanguage: profile.supportedLanguages || [],
      aggregateRating:
        rating > 0
          ? {
              '@type': 'AggregateRating',
              ratingValue: rating.toFixed(1),
              ratingCount: reviewCount,
            }
          : undefined,
      makesOffer: [
        {
          '@type': 'Offer',
          name: 'Consulting Services',
          priceCurrency: 'USD',
          price: profile.monthlyRate,
        },
      ],
      sameAs: [],
    }
  }

  private async generateMarketplaceStructuredData(
    specialistCount: number,
    baseUrl: string,
  ): Promise<Record<string, any>> {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Performa Marketplace',
      url: `${baseUrl}/marketplace`,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${baseUrl}/marketplace/specialists?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
      description: `Directory of ${specialistCount}+ verified performance marketing specialists`,
    }
  }

  private generateSearchStructuredData(
    filters: Record<string, any>,
    totalCount: number,
    baseUrl: string,
  ): Record<string, any> {
    return {
      '@context': 'https://schema.org',
      '@type': 'SearchResultsPage',
      name: 'Search Results',
      url: `${baseUrl}/marketplace/specialists`,
      description: `Found ${totalCount} marketing specialists matching your criteria`,
      potentialAction: {
        '@type': 'FilterAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${baseUrl}/marketplace/specialists?filters`,
        },
      },
    }
  }

  private generatePersonSchema(data: Record<string, any>, baseUrl: string): Record<string, any> {
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: data.name,
      description: data.description,
      url: data.url,
      image: data.image,
      jobTitle: data.jobTitle,
    }
  }

  private generateOrganizationSchema(data: Record<string, any>, baseUrl: string): Record<string, any> {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: data.name || 'Performa',
      url: baseUrl,
      logo: data.logo || `${baseUrl}/logo.png`,
    }
  }

  private generateSearchActionSchema(baseUrl: string): Record<string, any> {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      url: baseUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${baseUrl}/marketplace/specialists?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    }
  }

  private generateAggregateRatingSchema(data: Record<string, any>): Record<string, any> {
    return {
      '@context': 'https://schema.org',
      '@type': 'AggregateRating',
      ratingValue: data.ratingValue,
      ratingCount: data.ratingCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  private generateAggregateOfferSchema(data: Record<string, any>): Record<string, any> {
    return {
      '@context': 'https://schema.org',
      '@type': 'AggregateOffer',
      priceCurrency: data.priceCurrency || 'USD',
      lowPrice: data.lowPrice,
      highPrice: data.highPrice,
      offerCount: data.offerCount,
    }
  }
}
