'use client'

import { useState, useCallback, useEffect } from 'react'

export interface SearchOptions {
  page?: number
  pageSize?: number
  sortBy?: 'rating' | 'experience' | 'price' | 'roas' | 'trending'
  sortOrder?: 'asc' | 'desc'
}

export interface FilterCriteria {
  query?: string
  platforms?: string[]
  niches?: string[]
  certifications?: string[]
  languages?: string[]
  countries?: string[]
  minRating?: number
  minExperience?: number
  minRoas?: number
  verified?: boolean
}

export interface SpecialistCard {
  id: string
  slug: string
  displayName: string
  title: string
  bio?: string
  avatar?: string
  avatarColor?: string
  location?: string
  niches: string[]
  monthlyRate: number
  commissionRate: number
  pricingModel: string
  isVerified: boolean
  isFeatured: boolean
  rating: number
  reviewCount: number
  stats?: {
    avgROAS: number
    avgCPA: number
    totalCampaigns: number
    successRate: number
    totalSpendManaged: number
  }
}

interface SearchResponse {
  specialists: SpecialistCard[]
  total: number
  page: number
  pageSize: number
}

export function useSpecialistSearch(filters: FilterCriteria = {}, options: SearchOptions = {}) {
  const [specialists, setSpecialists] = useState<SpecialistCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [total, setTotal] = useState(0)

  const { page = 1, pageSize = 12, sortBy = 'rating' } = options

  const fetchSpecialists = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      if (filters.query)                        params.set('query', filters.query)
      if (filters.minRating)                    params.set('minRating', String(filters.minRating))
      if (filters.minExperience)                params.set('minExperience', String(filters.minExperience))
      if (filters.minRoas)                      params.set('minRoas', String(filters.minRoas))
      if (sortBy)                               params.set('sortBy', sortBy)
      if (page)                                 params.set('page', String(page))
      if (pageSize)                             params.set('pageSize', String(pageSize))
      filters.platforms?.forEach(p =>          params.append('platforms', p))
      filters.niches?.forEach(n =>             params.append('niches', n))
      filters.certifications?.forEach(c =>     params.append('certifications', c))
      filters.languages?.forEach(l =>          params.append('languages', l))
      filters.countries?.forEach(c =>          params.append('countries', c))

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || ''
      const res = await fetch(`${apiBase}/marketplace/specialists?${params.toString()}`)

      if (!res.ok) throw new Error(`API error: ${res.status}`)

      const json: SearchResponse = await res.json()

      setSpecialists(json.specialists ?? [])
      setTotal(json.total ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch specialists'))
    } finally {
      setLoading(false)
    }
  }, [filters.query, filters.minRating, filters.minExperience, filters.minRoas,
      JSON.stringify(filters.platforms), JSON.stringify(filters.niches),
      JSON.stringify(filters.certifications), sortBy, page, pageSize])

  useEffect(() => {
    fetchSpecialists()
  }, [fetchSpecialists])

  const totalPages = Math.ceil(total / pageSize)

  return {
    specialists,
    loading,
    error,
    total,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    refetch: fetchSpecialists,
  }
}
