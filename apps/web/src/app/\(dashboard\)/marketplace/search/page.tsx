'use client'

import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { FilterSidebar, SearchResults } from '@/components/marketplace'
import { mockSpecialists } from '@/lib/mockData/mockSpecialists'
import { FilterCriteria, applyFilters, hasActiveFilters } from '@/utils/marketplace'
import { useSpecialistSearch } from '@/hooks/useSpecialistSearch'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'price' | 'roas' | 'name'>('rating')
  const [page, setPage] = useState(1)
  const pageSize = 12

  // Parse filters from URL
  const filters: FilterCriteria = useMemo(() => {
    const parsed: FilterCriteria = {}

    const search = searchParams.get('search')
    if (search) parsed.search = search

    const platforms = searchParams.getAll('platforms')
    if (platforms.length > 0) parsed.platforms = platforms

    const niches = searchParams.getAll('niches')
    if (niches.length > 0) parsed.niches = niches

    const certifications = searchParams.getAll('certifications')
    if (certifications.length > 0) parsed.certifications = certifications

    const languages = searchParams.getAll('languages')
    if (languages.length > 0) parsed.languages = languages

    const minRating = searchParams.get('minRating')
    if (minRating) parsed.minRating = parseFloat(minRating)

    const minExperience = searchParams.get('minExperience')
    if (minExperience) parsed.minExperience = parseFloat(minExperience)

    const minBudget = searchParams.get('minBudget')
    if (minBudget) parsed.minBudget = parseFloat(minBudget)

    const maxBudget = searchParams.get('maxBudget')
    if (maxBudget) parsed.maxBudget = parseFloat(maxBudget)

    const minROAS = searchParams.get('minROAS')
    if (minROAS) parsed.minROAS = parseFloat(minROAS)

    return parsed
  }, [searchParams])

  // Fetch specialists based on filters
  const { specialists, loading, total, totalPages, hasNextPage, hasPreviousPage } = useSpecialistSearch(filters, {
    page,
    pageSize,
    sortBy,
    sortOrder: 'desc',
  })

  const handleFiltersChange = (newFilters: FilterCriteria) => {
    setPage(1)
    // In a real app, update URL search params
  }

  const handleReset = () => {
    setPage(1)
    // In a real app, clear URL search params
  }

  const activeFilters = hasActiveFilters(filters)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Find Specialists</h1>
          <p className="text-text-secondary mt-1">
            {activeFilters
              ? `Showing ${specialists.length} specialists matching your filters`
              : 'Browse all available specialists'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="hidden lg:block flex-shrink-0">
          <FilterSidebar
            specialists={mockSpecialists}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleReset}
          />
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <SearchResults
            specialists={specialists}
            loading={loading}
            total={total}
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            sortBy={sortBy}
            onSortChange={(sort) => {
              setSortBy(sort as 'rating' | 'experience' | 'price' | 'roas' | 'name')
              setPage(1)
            }}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Mobile Filter Toggle (shown on mobile only) */}
      {/* In a production app, you would implement a mobile filter modal/drawer here */}
    </div>
  )
}
