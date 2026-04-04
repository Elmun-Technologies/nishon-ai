'use client'

import { useState, useCallback, useEffect } from 'react'
import { Specialist, mockSpecialists } from '@/lib/mockData/mockSpecialists'
import { FilterCriteria, applyFilters } from '@/utils/marketplace'

export interface SearchOptions {
  page?: number
  pageSize?: number
  sortBy?: 'rating' | 'experience' | 'price' | 'roas' | 'name'
  sortOrder?: 'asc' | 'desc'
}

export function useSpecialistSearch(filters: FilterCriteria, options: SearchOptions = {}) {
  const [specialists, setSpecialists] = useState<Specialist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [total, setTotal] = useState(0)

  const { page = 1, pageSize = 12, sortBy = 'rating', sortOrder = 'desc' } = options

  const fetchSpecialists = useCallback(() => {
    setLoading(true)
    setError(null)

    try {
      // Simulate API delay
      setTimeout(() => {
        let results = applyFilters(mockSpecialists, filters)

        // Sort results
        results = sortSpecialists(results, sortBy, sortOrder)

        setTotal(results.length)

        // Paginate
        const startIndex = (page - 1) * pageSize
        const paginatedResults = results.slice(startIndex, startIndex + pageSize)

        setSpecialists(paginatedResults)
        setLoading(false)
      }, 300) // Simulate network delay
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch specialists'))
      setLoading(false)
    }
  }, [filters, page, pageSize, sortBy, sortOrder])

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
  }
}

function sortSpecialists(specialists: Specialist[], sortBy: string, sortOrder: 'asc' | 'desc'): Specialist[] {
  const sorted = [...specialists]

  sorted.sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'rating':
        comparison = b.rating - a.rating
        break
      case 'experience':
        comparison = b.experience - a.experience
        break
      case 'price':
        comparison = a.monthlyRate - b.monthlyRate
        break
      case 'roas':
        comparison = b.averageROAS - a.averageROAS
        break
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      default:
        comparison = 0
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })

  return sorted
}
