# Performa Marketplace Frontend Structure

## Overview

The Performa marketplace is a comprehensive platform for discovering, comparing, and hiring advertising specialists. The frontend is built with React, Next.js 14+, and TypeScript with a focus on clean architecture and reusable components.

## Directory Structure

```
apps/web/src/
├── app/(dashboard)/marketplace/
│   ├── page.tsx                          # Landing page with hero, featured specialists, FAQ
│   ├── search/
│   │   └── page.tsx                      # Advanced search with filters and results
│   └── specialists/
│       └── [slug]/
│           └── page.tsx                  # Specialist detail page with tabs
├── components/marketplace/
│   ├── FilterSidebar.tsx                 # Expandable filter panel
│   ├── SpecialistCard.tsx                # Grid/list item component
│   ├── SpecialistDetailHeader.tsx        # Profile hero with stats
│   ├── CertificationBadge.tsx            # Certification display with tooltip
│   ├── ReviewCard.tsx                    # Individual review component
│   ├── CaseStudyCard.tsx                 # Case study showcase
│   ├── PerformanceChart.tsx              # Performance metrics and charts
│   ├── SearchResults.tsx                 # Results grid with pagination
│   └── index.ts                          # Barrel export
├── hooks/
│   ├── useMarketplaceFilters.ts          # Filter state & URL sync
│   ├── useSpecialistSearch.ts            # Search results with pagination
│   └── useFetchSpecialist.ts             # Individual specialist fetching
├── utils/marketplace/
│   ├── formatters.ts                     # Currency, date, metrics formatting
│   ├── url.ts                            # URL generation and parsing
│   ├── filters.ts                        # Filter logic and helpers
│   └── index.ts                          # Barrel export
└── lib/mockData/
    └── mockSpecialists.ts                # Mock specialist data (5 profiles)
```

## Pages

### 1. Marketplace Landing Page
**Location:** `/marketplace`  
**File:** `apps/web/src/app/(dashboard)/marketplace/page.tsx`

Features:
- Hero section with value proposition
- Trust indicators (5 specialists, 4.9 avg rating, $50M+ managed)
- Quick filter chips (platforms, niches)
- Featured specialists grid (top 5 by rating)
- "How it works" section
- FAQ accordion (6 items)
- CTA footer section

### 2. Advanced Search Page
**Location:** `/marketplace/search`  
**File:** `apps/web/src/app/(dashboard)/marketplace/search/page.tsx`

Features:
- Full-width responsive layout
- Left sidebar with FilterSidebar component
- Main area with SearchResults component
- Sort dropdown (rating, experience, price, ROAS, name)
- Pagination controls
- Empty state when no results
- Filter parsing from URL search params

### 3. Specialist Detail Page
**Location:** `/marketplace/specialists/[slug]`  
**File:** `apps/web/src/app/(dashboard)/marketplace/specialists/[slug]/page.tsx`

Features:
- Large hero banner with cover image
- Profile header with avatar, name, badges, rating
- Tabbed interface:
  - **Overview:** About, expertise, platforms, niches, languages, certifications
  - **Performance:** Trend charts, platform breakdown, key metrics
  - **Case Studies:** Carousel of portfolio work
  - **Reviews:** Aggregated ratings and individual testimonials
  - **Pricing:** Rates, minimum budget, included services
- Right sidebar:
  - Quick facts (ROAS, experience, clients, success rate)
  - Contact form (name, email, company, message)
  - Verification badge and member since date

## Components

### Filter-Related Components

#### FilterSidebar
- **Props:** `specialists`, `filters`, `onFiltersChange`, `onReset`, `className`
- **Features:**
  - Search box
  - Expandable sections (click to toggle)
  - Checkboxes for platforms, niches, certifications, languages
  - Range sliders for rating, experience, ROAS
  - Price range inputs (min/max budget)
  - Reset button
- **Usage:**
  ```tsx
  <FilterSidebar
    specialists={mockSpecialists}
    filters={filters}
    onFiltersChange={handleFiltersChange}
    onReset={handleReset}
  />
  ```

### Specialist Display Components

#### SpecialistCard
- **Props:** `specialist`, `className`
- **Features:**
  - Responsive card with hover state
  - Avatar, name, title
  - Certification badges (up to 2 visible)
  - Rating and review count
  - Stats grid (ROAS, monthly rate)
  - Platform pills
  - Hover action buttons (View Profile, Contact)
  - Bio text fallback on non-hover
- **Usage:**
  ```tsx
  <SpecialistCard specialist={specialist} />
  ```

#### SpecialistDetailHeader
- **Props:** `specialist`, `className`
- **Features:**
  - Large cover image
  - Profile avatar (overlaid, -mt-20)
  - Name, title, verification badge
  - Member since date
  - 4-column stats grid (rating, ROAS, experience, clients)
  - Location, response time, success rate
  - Certification badges
  - CTA buttons (Schedule Call, Get in Touch)
- **Usage:**
  ```tsx
  <SpecialistDetailHeader specialist={specialist} />
  ```

#### CertificationBadge
- **Props:** `certification`, `showTooltip`, `className`
- **Features:**
  - Purple badge with issuer emoji
  - Verification checkmark
  - Hover tooltip with details
  - Expiration date if applicable
- **Usage:**
  ```tsx
  <CertificationBadge certification={cert} />
  ```

#### ReviewCard
- **Props:** `review`, `className`
- **Features:**
  - Reviewer avatar, name, timestamp
  - Verified purchase badge
  - Star rating display
  - Review title and content
  - Tag pills
  - Helpful count button
- **Usage:**
  ```tsx
  <ReviewCard review={review} />
  ```

#### CaseStudyCard
- **Props:** `caseStudy`, `className`
- **Features:**
  - Featured image (first screenshot)
  - Photo count indicator
  - Title, client name, industry tag
  - Description (2-line clamp)
  - Before/after metrics with improvement %
  - Duration, budget, metric type
  - Tag pills
- **Usage:**
  ```tsx
  <CaseStudyCard caseStudy={caseStudy} />
  ```

### Data Visualization Components

#### PerformanceChart
- **Props:** `metrics`, `specialist`, `className`
- **Features:**
  - ROAS trend line chart (with y-axis labels and hover values)
  - Platform breakdown progress bars
  - Key metrics cards (ROAS, CPA, Conversions, Clicks)
  - Performance history data table
- **Usage:**
  ```tsx
  <PerformanceChart metrics={specialist.performanceMetrics} specialist={specialist} />
  ```

### Results Display Components

#### SearchResults
- **Props:** `specialists`, `loading`, `error`, `total`, `page`, `pageSize`, `totalPages`, `hasNextPage`, `hasPreviousPage`, `sortBy`, `onSortChange`, `onPageChange`, `className`
- **Features:**
  - Results count header
  - Sort dropdown (5 options)
  - Error state display
  - Loading spinner
  - Empty state with icon
  - 3-column responsive grid
  - Pagination with smart page number display
  - Previous/Next buttons
- **Usage:**
  ```tsx
  <SearchResults
    specialists={specialists}
    loading={loading}
    total={total}
    page={page}
    pageSize={pageSize}
    totalPages={totalPages}
    onSortChange={handleSort}
    onPageChange={setPage}
  />
  ```

## Hooks

### useMarketplaceFilters
Manages filter state with localStorage persistence and URL synchronization.

**Returns:**
```typescript
{
  filters: FilterCriteria
  updateFilters: (newFilters: Partial<FilterCriteria>) => void
  updateFilter: (key: keyof FilterCriteria, value: any) => void
  resetFilters: () => void
  saveFilters: () => void
}
```

**Features:**
- Loads filters from URL on mount
- Falls back to localStorage if no URL params
- Syncs to URL on updates
- Persists to localStorage
- Reset clears all and navigates

**Usage:**
```tsx
const { filters, updateFilters, resetFilters } = useMarketplaceFilters()
```

### useSpecialistSearch
Fetches and filters specialists with pagination and sorting.

**Returns:**
```typescript
{
  specialists: Specialist[]
  loading: boolean
  error: Error | null
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}
```

**Features:**
- Applies filters using `applyFilters` utility
- Sorts by rating, experience, price, ROAS, or name
- Handles pagination
- Simulates network delay (300ms)
- Error handling

**Usage:**
```tsx
const { specialists, loading, total } = useSpecialistSearch(filters, {
  page: 1,
  pageSize: 12,
  sortBy: 'rating',
  sortOrder: 'desc'
})
```

### useFetchSpecialist
Fetches individual specialist with caching.

**Returns:**
```typescript
{
  specialist: Specialist | null
  loading: boolean
  error: Error | null
  notFound: boolean
  refetch: () => Promise<void>
}
```

**Features:**
- 5-minute cache for repeated requests
- 404 handling
- Simulates network delay (300ms)
- Manual refetch capability

**Usage:**
```tsx
const { specialist, loading, notFound } = useFetchSpecialist(slug)
```

## Utilities

### Formatters (`utils/marketplace/formatters.ts`)

```typescript
formatPerformanceMetrics(roas, cpa, cpc?) -> { roasLabel, cpaLabel, cpcLabel }
formatCurrency(value, currencyCode?) -> "string"
formatNumber(value) -> "1,234"
formatPercentage(value, decimals?) -> "94.5%"
formatDate(date, format?) -> "Jan 15, 2024" | "January 15, 2024"
formatTimeAgo(date) -> "2d ago"
formatExperience(years) -> "7+ years"
formatResponseTime(time) -> "< 2 hours"
formatMinBudget(budget) -> "$5K" | "$1500"
```

### URL Utilities (`utils/marketplace/url.ts`)

```typescript
generateSpecialistURL(slug, baseUrl?) -> "/marketplace/specialists/alex-chen"
generateSearchURL(filters?, baseUrl?) -> "/marketplace/search?platforms=Facebook%20Ads"
generateMarketplaceURL() -> "/marketplace"
parseFilterParams(searchParams) -> FilterCriteria
```

### Filter Utilities (`utils/marketplace/filters.ts`)

```typescript
applyFilters(specialists, criteria) -> Specialist[]
getAvailablePlatforms(specialists) -> string[]
getAvailableNiches(specialists) -> string[]
getAvailableCertifications(specialists) -> string[]
getAvailableLanguages(specialists) -> string[]
getAvailableCountries(specialists) -> string[]
isFilterValid(filters) -> boolean
hasActiveFilters(filters) -> boolean
```

## Mock Data

### mockSpecialists.ts
Located: `src/lib/mockData/mockSpecialists.ts`

Contains 5 fully-featured specialist profiles:
1. **Alex Chen** - Meta & Google Ads Specialist
2. **Jessica Martinez** - TikTok & YouTube Ads Expert
3. **David Kumar** - Conversion Rate Optimization Specialist
4. **Amelia Watson** - LinkedIn B2B Lead Generation Expert
5. **Thomas Schmidt** - Amazon Ads & E-Commerce Expert

**Specialist Structure:**
```typescript
interface Specialist {
  id: string
  slug: string
  name: string
  title: string
  avatar: string                // Unsplash URL
  coverImage: string            // Unsplash URL
  bio: string
  location: string
  languages: string[]
  responseTime: string
  platforms: string[]
  niches: string[]
  certifications: Certification[]
  rating: number               // 0-5
  reviewCount: number
  averageROAS: number
  monthlyRate: number         // USD
  minBudget: number           // USD
  verifiedSince: string       // Date string
  caseStudies: CaseStudy[]
  reviews: Review[]
  performanceMetrics: PerformanceMetric[]
  experience: number          // Years
  totalClientsServed: number
  successRate: number         // Percentage 0-100
  platformBreakdown: Record<string, number>  // Percentage breakdown
}
```

## Type Definitions

### FilterCriteria
```typescript
interface FilterCriteria {
  search?: string
  platforms?: string[]
  niches?: string[]
  certifications?: string[]
  countries?: string[]
  languages?: string[]
  minRating?: number
  minExperience?: number
  minBudget?: number
  maxBudget?: number
  minROAS?: number
}
```

## Styling & Design System

The marketplace uses the existing Performa design system with:
- **Colors:** Primary, surface, text-primary, text-secondary, border, and semantic colors
- **Components:** Button, Card, Badge, Tabs, Input, Textarea, Checkbox, Spinner
- **Utilities:** `cn()` for className merging, Tailwind CSS
- **Responsive:** Mobile-first with md and lg breakpoints

## Key Features

1. **Filter Persistence:** Filters saved to localStorage and synced with URL
2. **Performance Metrics:** Real-time data visualization with trend charts
3. **Verified Specialists:** Certification badges with tooltips
4. **Case Studies:** Portfolio showcase with before/after metrics
5. **Reviews:** Aggregated ratings and individual testimonials
6. **Responsive Design:** Mobile, tablet, and desktop layouts
7. **Empty States:** Graceful handling of no results
8. **Pagination:** Efficient navigation for large result sets
9. **Caching:** 5-minute cache for specialist detail pages
10. **Search:** Multi-criteria search with real-time filtering

## API Integration (Future)

Currently uses mock data from `mockSpecialists.ts`. When connecting to real API:

1. Replace mock data calls in hooks with API endpoints
2. Update `useSpecialistSearch` to call `/api/specialists/search`
3. Update `useFetchSpecialist` to call `/api/specialists/:slug`
4. Implement real-time filtering on the backend
5. Add error handling for network failures
6. Implement proper loading states

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Optimizations

- Image optimization via Next.js Image component
- Lazy loading for out-of-viewport elements
- Memoized components to prevent unnecessary re-renders
- URL-based state for shareable search queries
- Cache strategy for specialist detail pages
- Pagination to limit rendered specialists per page

## Accessibility

- Semantic HTML structure
- ARIA labels for interactive elements
- Focus visible states on all buttons
- Color contrast ratios meet WCAG AA standards
- Keyboard navigation support
- Form labels properly associated with inputs

## Future Enhancements

- Real-time chat with specialists
- Calendar integration for scheduling calls
- Payment integration for bookings
- Analytics for specialist performance
- Favorites/bookmarking feature
- Advanced filtering with saved presets
- Mobile filter modal/drawer
- Specialist comparison view
- Request for proposal (RFP) feature
- Integration with project management tools
