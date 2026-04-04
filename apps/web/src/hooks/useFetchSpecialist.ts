'use client'

import { useState, useEffect, useCallback } from 'react'
import { Specialist, mockSpecialists } from '@/lib/mockData/mockSpecialists'

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface CacheEntry {
  data: Specialist
  timestamp: number
}

const cache = new Map<string, CacheEntry>()

export function useFetchSpecialist(slug: string) {
  const [specialist, setSpecialist] = useState<Specialist | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [notFound, setNotFound] = useState(false)

  const fetchSpecialist = useCallback(async () => {
    setLoading(true)
    setError(null)
    setNotFound(false)

    try {
      // Check cache first
      const cached = cache.get(slug)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setSpecialist(cached.data)
        setLoading(false)
        return
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Find specialist from mock data
      const found = mockSpecialists.find((s) => s.slug === slug)

      if (!found) {
        setNotFound(true)
        setError(new Error('Specialist not found'))
        setLoading(false)
        return
      }

      // Cache the result
      cache.set(slug, {
        data: found,
        timestamp: Date.now(),
      })

      setSpecialist(found)
      setLoading(false)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch specialist')
      setError(error)
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    if (slug) {
      fetchSpecialist()
    }
  }, [slug, fetchSpecialist])

  return {
    specialist,
    loading,
    error,
    notFound,
    refetch: fetchSpecialist,
  }
}
