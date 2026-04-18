'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface SearchResultsProps {
  specialists: any[]
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
      <Card className="p-6 text-center">
        <h3 className="text-lg font-semibold text-red-500 mb-2">Error Loading Results</h3>
        <p className="text-text-secondary">{error.message}</p>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="p-6 text-center">
        <p className="text-text-secondary">Loading specialists...</p>
      </Card>
    )
  }

  if (specialists.length === 0) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-semibold text-text-primary mb-2">No specialists found</h3>
        <p className="text-text-secondary mb-4">Try adjusting your filters</p>
        <Button variant="secondary">Clear Filters</Button>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            Results ({total} specialists)
          </h2>
        </div>
        <select
          value={sortBy}
          onChange={(e) => onSortChange?.(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg text-sm"
        >
          <option value="rating">Rating (High to Low)</option>
          <option value="roas">ROAS (High to Low)</option>
          <option value="experience">Experience (Most to Least)</option>
          <option value="price">Price (Low to High)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {specialists.map((specialist) => (
          <Card key={specialist.id} className="p-4">
            <h3 className="font-semibold text-text-primary">{specialist.name}</h3>
            <p className="text-sm text-text-secondary mt-1">{specialist.title}</p>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="secondary"
            disabled={!hasPreviousPage}
            onClick={() => onPageChange?.(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-text-secondary">Page {page} of {totalPages}</span>
          <Button
            variant="secondary"
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
