'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/utils'
import { Specialist } from '@/lib/mockData/mockSpecialists'
import { SpecialistCard } from './SpecialistCard'

interface SearchResultsProps {
  specialists: Specialist[]
  loading?: boolean
  error?: Error | null
  total?: number
  page?: number
  pageSize?: number
  totalPages?: number
  hasNextPage?: boolean
  hasPreviousPage?: boolean
  sortBy?: string
  onSortChange?: (sort: string) => void
  onPageChange?: (page: number) => void
  className?: string
}

const SORT_OPTIONS = [
  { value: 'rating', label: 'Rating (High to Low)' },
  { value: 'roas', label: 'ROAS (High to Low)' },
  { value: 'experience', label: 'Experience (Most to Least)' },
  { value: 'price', label: 'Price (Low to High)' },
  { value: 'name', label: 'Name (A-Z)' },
]

export const SearchResults: React.FC<SearchResultsProps> = ({
  specialists,
  loading = false,
  error = null,
  total = 0,
  page = 1,
  pageSize = 12,
  totalPages = 1,
  hasNextPage = false,
  hasPreviousPage = false,
  sortBy = 'rating',
  onSortChange,
  onPageChange,
  className,
}) => {
  if (error) {
    return (
      <div className={cn('', className)}>
        <Card padding="lg" className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4v2m0 6v2m-6-6h2m4 0h2m4 0h2"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Error</h3>
          <p className="text-text-secondary">{error.message}</p>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-16', className)}>
        <Spinner />
      </div>
    )
  }

  if (specialists.length === 0) {
    return (
      <div className={cn('', className)}>
        <Card padding="lg" className="text-center">
          <div className="text-text-tertiary mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No specialists found</h3>
          <p className="text-text-secondary mb-6">Try adjusting your filters to find what you're looking for</p>
          <Button variant="secondary">Clear Filters</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            Results
            <span className="text-text-secondary font-normal ml-2">({total} specialists found)</span>
          </h2>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-text-secondary">
            Sort by:
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => onSortChange?.(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {specialists.map((specialist) => (
          <SpecialistCard key={specialist.id} specialist={specialist} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6 border-t border-border">
          <Button
            variant="secondary"
            size="sm"
            disabled={!hasPreviousPage}
            onClick={() => onPageChange?.(page - 1)}
          >
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1
              if (totalPages > 5 && page > 3) {
                pageNum = page - 2 + i
              }
              if (pageNum > totalPages) return null

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange?.(pageNum)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                    pageNum === page
                      ? 'bg-primary text-white'
                      : 'bg-surface border border-border text-text-primary hover:border-border'
                  )}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          <Button
            variant="secondary"
            size="sm"
            disabled={!hasNextPage}
            onClick={() => onPageChange?.(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
