export function generateSpecialistURL(slug: string, baseUrl = '/marketplace/specialists'): string {
  return `${baseUrl}/${slug}`
}

export function generateSearchURL(
  filters?: Record<string, string | string[] | number>,
  baseUrl = '/marketplace/search'
): string {
  if (!filters || Object.keys(filters).length === 0) {
    return baseUrl
  }

  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, String(v)))
    } else if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value))
    }
  })

  return `${baseUrl}?${params.toString()}`
}

export function generateMarketplaceURL(): string {
  return '/marketplace'
}

export function parseFilterParams(
  searchParams: Record<string, string | string[] | undefined>
): Record<string, string | string[] | number> {
  const parsed: Record<string, string | string[] | number> = {}

  Object.entries(searchParams).forEach(([key, value]) => {
    if (!value) return

    if (Array.isArray(value)) {
      parsed[key] = value
    } else if (key === 'minRating' || key === 'minExperience' || key === 'minBudget') {
      const num = parseFloat(value)
      if (!isNaN(num)) {
        parsed[key] = num
      }
    } else {
      parsed[key] = value
    }
  })

  return parsed
}
