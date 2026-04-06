// ─── Marketplace Types ────────────────────────────────────────────────────────

export type SpecialistLevel = 'junior' | 'expert' | 'pro' | 'agency'
export type CertificationType = 'meta' | 'google' | 'tiktok' | 'yandex'
export type SpecialtyType = 'ecommerce' | 'saas' | 'leadgen' | 'brand' | 'performance'

export interface Specialist {
  id: string
  name: string
  avatar: string
  title: string
  level: SpecialistLevel
  bio: string
  basePrice: number
  roas: number
  rating: number
  reviewCount: number
  certifications: CertificationType[]
  specialties: SpecialtyType[]
  experience: number  // Years
  campaignsManaged: number
  totalSpend: number  // In millions
  responseTime: number  // In hours
  successRate: number  // %
  location: string
  languages: string[]
  verified: boolean
  featured: boolean
}

export interface MarketplaceFilters {
  level?: SpecialistLevel[]
  certification?: CertificationType[]
  specialty?: SpecialtyType[]
  minRating?: number
  minRoas?: number
  maxPrice?: number
  location?: string
}

export interface SpecialistProfile extends Specialist {
  description: string
  portfolio: {
    title: string
    roas: number
    spend: number
    industry: string
  }[]
  testimonials: {
    text: string
    author: string
    rating: number
  }[]
}
