'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { FilterCriteria } from '@/utils/marketplace'

const FILTER_STORAGE_KEY = 'marketplace-filters'

export function useMarketplaceFilters(initialFilters: FilterCriteria = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<FilterCriteria>(initialFilters)

  // Load filters from URL on mount
  useEffect(() => {
    const urlFilters: FilterCriteria = {}

    searchParams.forEach((value, key) => {
      if (key === 'platforms' || key === 'niches' || key === 'certifications' || key === 'languages') {
        urlFilters[key as keyof FilterCriteria] = searchParams.getAll(key) as string[]
      } else if (key === 'minRating' || key === 'minExperience' || key === 'minBudget' || key === 'maxBudget' || key === 'minROAS') {
        urlFilters[key as keyof FilterCriteria] = parseFloat(value)
      } else {
        urlFilters[key as keyof FilterCriteria] = value
      }
    })

    if (Object.keys(urlFilters).length > 0) {
      setFilters(urlFilters)
    } else {
      // Try to load from localStorage
      const saved = localStorage.getItem(FILTER_STORAGE_KEY)
      if (saved) {
        try {
          setFilters(JSON.parse(saved))
        } catch (e) {
          console.error('Failed to parse saved filters', e)
        }
      }
    }
  }, [searchParams])

  const updateFilters = useCallback(
    (newFilters: Partial<FilterCriteria>) => {
      const updated = { ...filters, ...newFilters }
      setFilters(updated)
      syncWithURL(updated, router)
      persistFilters(updated)
    },
    [filters, router]
  )

  const updateFilter = useCallback(
    (key: keyof FilterCriteria, value: any) => {
      updateFilters({ [key]: value })
    },
    [updateFilters]
  )

  const resetFilters = useCallback(() => {
    setFilters({})
    router.push('/marketplace/search')
    localStorage.removeItem(FILTER_STORAGE_KEY)
  }, [router])

  const saveFilters = useCallback(() => {
    persistFilters(filters)
  }, [filters])

  return {
    filters,
    updateFilters,
    updateFilter,
    resetFilters,
    saveFilters,
  }
}

function syncWithURL(filters: FilterCriteria, router: ReturnType<typeof useRouter>) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (!value) return

    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, String(v)))
    } else if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value))
    }
  })

  const queryString = params.toString()
  router.push(`/marketplace/search${queryString ? `?${queryString}` : ''}`)
}

function persistFilters(filters: FilterCriteria) {
  try {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters))
  } catch (e) {
    console.error('Failed to persist filters', e)
  }
}
