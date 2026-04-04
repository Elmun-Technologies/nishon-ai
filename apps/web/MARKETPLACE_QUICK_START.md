# Marketplace Quick Start Guide

## File Locations Reference

### Pages
- **Landing:** `/marketplace` → `src/app/(dashboard)/marketplace/page.tsx`
- **Search:** `/marketplace/search` → `src/app/(dashboard)/marketplace/search/page.tsx`
- **Detail:** `/marketplace/specialists/[slug]` → `src/app/(dashboard)/marketplace/specialists/[slug]/page.tsx`

### Components
All marketplace components in: `src/components/marketplace/`
- `FilterSidebar.tsx` - Filter panel with expandable sections
- `SpecialistCard.tsx` - Grid card for search results
- `SpecialistDetailHeader.tsx` - Profile hero section
- `CertificationBadge.tsx` - Badge with hover tooltip
- `ReviewCard.tsx` - Individual review display
- `CaseStudyCard.tsx` - Portfolio card
- `PerformanceChart.tsx` - Metrics visualization
- `SearchResults.tsx` - Results grid with pagination

### Hooks
All in: `src/hooks/`
- `useMarketplaceFilters.ts` - Filter state & URL sync
- `useSpecialistSearch.ts` - Search with pagination
- `useFetchSpecialist.ts` - Single specialist fetching

### Utilities
All in: `src/utils/marketplace/`
- `formatters.ts` - Currency, date, number formatting
- `url.ts` - URL generation and parsing
- `filters.ts` - Filter logic and helpers

### Data
- `src/lib/mockData/mockSpecialists.ts` - Mock specialist profiles (5 specialists)

## Common Usage Patterns

### Displaying a Specialist Card
```tsx
import { SpecialistCard } from '@/components/marketplace'
import { mockSpecialists } from '@/lib/mockData/mockSpecialists'

export default function Grid() {
  return (
    <div className="grid grid-cols-3 gap-6">
      {mockSpecialists.map(specialist => (
        <SpecialistCard key={specialist.id} specialist={specialist} />
      ))}
    </div>
  )
}
```

### Filtering Specialists
```tsx
import { applyFilters, FilterCriteria } from '@/utils/marketplace'
import { mockSpecialists } from '@/lib/mockData/mockSpecialists'

const filters: FilterCriteria = {
  platforms: ['Facebook Ads', 'Google Ads'],
  minRating: 4.5,
  minBudget: 10000
}

const results = applyFilters(mockSpecialists, filters)
```

### Formatting Values
```tsx
import { formatCurrency, formatDate, formatTimeAgo } from '@/utils/marketplace'

formatCurrency(5000)      // "$5,000"
formatDate('2024-01-15')  // "Jan 15, 2024"
formatTimeAgo('2024-02-15') // "4d ago"
```

### Fetching a Specialist
```tsx
'use client'
import { useFetchSpecialist } from '@/hooks/useFetchSpecialist'

export default function SpecialistPage({ params }: { params: { slug: string } }) {
  const { specialist, loading, notFound } = useFetchSpecialist(params.slug)
  
  if (loading) return <Spinner />
  if (notFound) return <div>Not found</div>
  
  return <div>{specialist?.name}</div>
}
```

### Using Filter Hook
```tsx
'use client'
import { useMarketplaceFilters } from '@/hooks/useMarketplaceFilters'

export default function SearchPage() {
  const { filters, updateFilter, resetFilters } = useMarketplaceFilters()
  
  const handlePlatformChange = (platform: string) => {
    const current = filters.platforms || []
    const updated = current.includes(platform)
      ? current.filter(p => p !== platform)
      : [...current, platform]
    updateFilter('platforms', updated.length > 0 ? updated : undefined)
  }
  
  return (
    <div>
      <button onClick={() => updateFilter('minRating', 4.5)}>
        Min Rating 4.5+
      </button>
      <button onClick={resetFilters}>Clear All</button>
    </div>
  )
}
```

## Styling Components

All components support className prop for additional styles:
```tsx
<SpecialistCard 
  specialist={specialist}
  className="col-span-2 h-96"
/>
```

## Component Props Reference

### FilterSidebar
```tsx
interface FilterSidebarProps {
  specialists: Specialist[]
  filters: FilterCriteria
  onFiltersChange: (filters: FilterCriteria) => void
  onReset: () => void
  className?: string
}
```

### SpecialistCard
```tsx
interface SpecialistCardProps {
  specialist: Specialist
  className?: string
}
```

### SearchResults
```tsx
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
```

### PerformanceChart
```tsx
interface PerformanceChartProps {
  metrics: PerformanceMetric[]
  specialist: Specialist
  className?: string
}
```

## Adding New Features

### Add a New Filter Type
1. Add to `FilterCriteria` interface in `utils/marketplace/filters.ts`
2. Add filtering logic to `applyFilters()` function
3. Add UI in `FilterSidebar.tsx`
4. Update URL parsing in hooks

### Add a New Sort Option
1. Update sort options in `SearchResults.tsx` (SORT_OPTIONS array)
2. Add sort logic to `sortSpecialists()` in `useSpecialistSearch.ts`

### Add Mock Data
Edit `src/lib/mockData/mockSpecialists.ts`:
```tsx
const mockSpecialists: Specialist[] = [
  {
    id: '6',
    slug: 'new-specialist',
    name: 'New Specialist',
    // ... rest of properties
  }
]
```

### Connect to Real API
1. Update `useSpecialistSearch()` to call API endpoint
2. Update `useFetchSpecialist()` to call API endpoint
3. Replace mock data fetch with real API call
4. Update error handling as needed

Example:
```tsx
// Before
const results = applyFilters(mockSpecialists, filters)

// After
const response = await fetch(`/api/specialists/search?${params}`)
const results = await response.json()
```

## Debugging Tips

### Check Filter Application
```tsx
import { applyFilters } from '@/utils/marketplace'

// In console:
const filtered = applyFilters(mockSpecialists, filters)
console.log(`Found ${filtered.length} specialists`)
```

### Verify URL Sync
- Open browser DevTools Network tab
- Search page should update URL with filter params
- Reload page and filters should persist

### Test Mock Data
```tsx
import { mockSpecialists } from '@/lib/mockData/mockSpecialists'

// In console:
mockSpecialists.forEach(s => console.log(s.name, s.rating))
```

## Performance Tips

1. **Pagination:** Keep pageSize at 12 for balanced UX
2. **Images:** Using Next.js Image component (already done)
3. **Memoization:** Components already use React.memo where needed
4. **Caching:** 5-minute cache for specialist detail pages
5. **Lazy Loading:** Consider virtualizing long lists in future

## Accessibility Checklist

- ✅ Semantic HTML in components
- ✅ Proper form labels (FilterSidebar)
- ✅ Focus visible states on buttons
- ✅ Color contrast meets WCAG AA
- ✅ Keyboard navigation supported
- ✅ ARIA labels where needed

## Common Issues & Solutions

### Filter not persisting
- Check that `useMarketplaceFilters` is used on client side
- Verify localStorage is enabled
- Check browser console for errors

### Images not loading
- Verify Unsplash URLs are still valid
- Check image dimensions for responsive display
- Ensure Next.js Image component is used

### Pagination not working
- Verify `totalPages` calculation is correct
- Check that `onPageChange` callback updates state
- Ensure SearchResults receives correct props

### Performance slow
- Check React DevTools Profiler
- Reduce number of specialists rendered per page
- Verify unnecessary re-renders aren't happening
- Check bundle size of components

## Next Steps

1. **Connect to API:** Replace mock data with real endpoints
2. **Add authentication:** Protect specialist contact forms
3. **Implement payments:** Add booking and payment flow
4. **Add chat:** Real-time messaging with specialists
5. **Analytics:** Track specialist views and inquiries
6. **Mobile optimization:** Create mobile filter drawer
7. **Comparison tool:** Allow comparing multiple specialists
8. **Favorites:** Let users bookmark specialists

## Support & Resources

- **Component Library:** `src/components/ui/`
- **Type Definitions:** Check interfaces at top of each file
- **Tailwind Docs:** https://tailwindcss.com
- **Next.js Docs:** https://nextjs.org/docs
- **Design System:** Check existing components for patterns
