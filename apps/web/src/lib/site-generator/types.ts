export type SiteTemplateId = 'fashion' | 'course'

export type ExistingSiteKind = 'none' | 'shopify' | 'tilda' | 'other'

export interface OnboardingBriefInput {
  productTitle: string
  priceUzs: number
  utp: string
  /** Masalan: "18-24 yosh ayollar" */
  audienceSummary: string
  audienceAgeMin?: number
  audienceAgeMax?: number
  brandName?: string
  phone?: string
  telegramUsername?: string
  existingSite?: ExistingSiteKind
  /** Creative Hub / mediatekadan URL lar */
  imageUrls?: string[]
}

export type LandingSectionType =
  | 'hero'
  | 'problem_solution'
  | 'gallery'
  | 'utp'
  | 'reviews'
  | 'lead_form'
  | 'payment_embed'
  | 'faq'
  | 'footer'
  | 'tech_strip'

export interface LandingSection {
  id: string
  type: LandingSectionType
  headline?: string
  subheadline?: string
  body?: string
  bullets?: string[]
  items?: Array<{ title: string; body: string }>
  images?: string[]
  testimonials?: Array<{ name: string; text: string; rating: number }>
  ctaLabel?: string
  ctaHref?: string
  faq?: Array<{ q: string; a: string }>
}

export interface LandingPageSpec {
  templateId: SiteTemplateId
  locale: 'uz' | 'ru'
  siteTitle: string
  sections: LandingSection[]
  seo: { title: string; description: string; ogImageUrl?: string }
  integrations: {
    metaPixelNote: string
    capiNote: string
    signalBridgeNote: string
    paymeClickNote: string
    creativeAuditNote: string
  }
  optimization: {
    abHeadlines: [string, string]
    heatmapNote: string
    aiSuggestionNote: string
  }
}
