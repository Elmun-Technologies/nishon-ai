import { Specialist } from '@/lib/mockData/mockSpecialists'

export interface FilterCriteria {
  search?: string
  platforms?: string[]
  niches?: string[]
  certifications?: string[]
  countries?: string[]
  languages?: string[]
  minRating?: number
  minExperience?: number
  minBudget?: number
  maxBudget?: number
  minROAS?: number
}

export function applyFilters(specialists: Specialist[], filters: FilterCriteria): Specialist[] {
  return specialists.filter((specialist) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch =
        specialist.name.toLowerCase().includes(searchLower) ||
        specialist.title.toLowerCase().includes(searchLower) ||
        specialist.bio.toLowerCase().includes(searchLower)

      if (!matchesSearch) return false
    }

    // Platform filter
    if (filters.platforms && filters.platforms.length > 0) {
      const hasPlatform = filters.platforms.some((platform) => specialist.platforms.includes(platform))
      if (!hasPlatform) return false
    }

    // Niche filter
    if (filters.niches && filters.niches.length > 0) {
      const hasNiche = filters.niches.some((niche) => specialist.niches.includes(niche))
      if (!hasNiche) return false
    }

    // Certification filter
    if (filters.certifications && filters.certifications.length > 0) {
      const hasCert = filters.certifications.some((cert) => specialist.certifications.some((c) => c.name === cert))
      if (!hasCert) return false
    }

    // Language filter
    if (filters.languages && filters.languages.length > 0) {
      const hasLanguage = filters.languages.some((lang) => specialist.languages.includes(lang))
      if (!hasLanguage) return false
    }

    // Rating filter
    if (filters.minRating !== undefined && specialist.rating < filters.minRating) {
      return false
    }

    // Experience filter
    if (filters.minExperience !== undefined && specialist.experience < filters.minExperience) {
      return false
    }

    // Budget filter
    if (filters.minBudget !== undefined && specialist.monthlyRate < filters.minBudget) {
      return false
    }

    if (filters.maxBudget !== undefined && specialist.monthlyRate > filters.maxBudget) {
      return false
    }

    // ROAS filter
    if (filters.minROAS !== undefined && specialist.averageROAS < filters.minROAS) {
      return false
    }

    return true
  })
}

export function getAvailablePlatforms(specialists: Specialist[]): string[] {
  const platforms = new Set<string>()
  specialists.forEach((s) => s.platforms.forEach((p) => platforms.add(p)))
  return Array.from(platforms).sort()
}

export function getAvailableNiches(specialists: Specialist[]): string[] {
  const niches = new Set<string>()
  specialists.forEach((s) => s.niches.forEach((n) => niches.add(n)))
  return Array.from(niches).sort()
}

export function getAvailableCertifications(specialists: Specialist[]): string[] {
  const certs = new Set<string>()
  specialists.forEach((s) => s.certifications.forEach((c) => certs.add(c.name)))
  return Array.from(certs).sort()
}

export function getAvailableLanguages(specialists: Specialist[]): string[] {
  const languages = new Set<string>()
  specialists.forEach((s) => s.languages.forEach((l) => languages.add(l)))
  return Array.from(languages).sort()
}

export function getAvailableCountries(specialists: Specialist[]): string[] {
  const countries = new Set<string>()
  specialists.forEach((s) => {
    const country = s.location.split(',')[1]?.trim()
    if (country) countries.add(country)
  })
  return Array.from(countries).sort()
}

export function isFilterValid(filters: FilterCriteria): boolean {
  return Object.values(filters).some((value) => {
    if (typeof value === 'string') return value.length > 0
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'number') return value > 0
    return false
  })
}

export function hasActiveFilters(filters: FilterCriteria): boolean {
  return (
    (filters.search && filters.search.length > 0) ||
    (filters.platforms && filters.platforms.length > 0) ||
    (filters.niches && filters.niches.length > 0) ||
    (filters.certifications && filters.certifications.length > 0) ||
    (filters.languages && filters.languages.length > 0) ||
    (filters.minRating !== undefined && filters.minRating > 0) ||
    (filters.minExperience !== undefined && filters.minExperience > 0) ||
    (filters.minBudget !== undefined && filters.minBudget > 0) ||
    (filters.maxBudget !== undefined && filters.maxBudget > 0) ||
    (filters.minROAS !== undefined && filters.minROAS > 0)
  )
}
