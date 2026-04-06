import { useState, useMemo } from 'react'

interface SearchableItem {
  [key: string]: any
}

interface UseFilteredSearchOptions<T> {
  items: T[]
  searchFields?: (keyof T)[]
  filters?: Record<string, any>
}

export function useFilteredSearch<T extends SearchableItem>({
  items,
  searchFields = [],
  filters = {},
}: UseFilteredSearchOptions<T>) {
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    return items.filter((item) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = searchFields.some(
          (field) =>
            String(item[field]).toLowerCase().includes(query)
        )
        if (!matchesSearch) return false
      }

      // Other filters
      for (const [key, value] of Object.entries(filters)) {
        if (value !== null && value !== undefined) {
          if (item[key] !== value) return false
        }
      }

      return true
    })
  }, [items, searchQuery, searchFields, filters])

  return {
    searchQuery,
    setSearchQuery,
    filtered,
    hasResults: filtered.length > 0,
  }
}
