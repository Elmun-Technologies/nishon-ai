# MarketplaceSearchService Documentation

## Overview

The `MarketplaceSearchService` provides advanced search and filtering capabilities for the Performa marketplace. It enables users to discover AI agents and human specialists with fine-grained filtering on platforms, niches, certifications, languages, geographic coverage, and performance metrics.

## Installation

The service is registered in the `AgentsModule`:

```typescript
import { MarketplaceSearchService } from './services/marketplace-search.service';

@Module({
  imports: [TypeOrmModule.forFeature([...entities])],
  providers: [MarketplaceSearchService],
  exports: [MarketplaceSearchService],
})
export class AgentsModule {}
```

## Core Methods

### 1. `searchSpecialists(filters: MarketplaceFilters): Promise<MarketplaceSearchResponse>`

Performs advanced search with dynamic filtering and sorting.

**Parameters:**
```typescript
interface MarketplaceFilters {
  query?: string;                              // Full-text search on keywords, name, title, bio
  platforms?: string[];                        // ['meta', 'google', 'yandex', 'tiktok']
  niches?: string[];                           // ['e-commerce', 'fashion', 'beauty']
  certifications?: string[];                   // Certification IDs
  languages?: string[];                        // Language codes ['en', 'uz', 'ru', 'kk']
  countries?: string[];                        // Country codes ['US', 'UZ', 'KZ']
  minRating?: number;                          // 0-5 stars
  minExperience?: number;                      // Years of experience
  minRoas?: number;                            // Minimum ROAS threshold
  minCpa?: number;                             // Minimum CPA threshold
  maxCpa?: number;                             // Maximum CPA threshold
  sortBy?: 'rating' | 'roas' | 'price' | 'experience' | 'popularity' | 'newest';
  page?: number;                               // Default: 1
  pageSize?: number;                           // Default: 20, Max: 100
  isVerified?: boolean;                        // Filter verified specialists
  isFeatured?: boolean;                        // Filter featured specialists
  priceRange?: { min: number; max: number };   // Monthly rate range
  languageProficiency?: 'native' | 'fluent' | 'intermediate';
  coverageType?: 'primary' | 'secondary' | 'all';
}
```

**Response:**
```typescript
interface MarketplaceSearchResponse {
  specialists: AgentProfile[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  filters: AvailableFiltersResponse;
}
```

**Example:**
```typescript
const results = await marketplaceSearchService.searchSpecialists({
  query: 'e-commerce facebook',
  platforms: ['meta'],
  niches: ['e-commerce', 'fashion'],
  minRating: 4.0,
  minRoas: 3.0,
  sortBy: 'rating',
  page: 1,
  pageSize: 20,
});

console.log(`Found ${results.total} specialists`);
console.log(`Current page: ${results.page}/${Math.ceil(results.total / results.pageSize)}`);
results.specialists.forEach(specialist => {
  console.log(`- ${specialist.displayName} (${specialist.cachedRating} ⭐)`);
});
```

### 2. `getAvailableFilters(currentFilters?: MarketplaceFilters): Promise<AvailableFiltersResponse>`

Returns available filter options with counts based on current filters.

**Response:**
```typescript
interface AvailableFiltersResponse {
  platforms: FilterOption[];           // Available platforms with count
  niches: FilterOption[];              // Available niches with count
  countries: FilterOption[];           // Available countries with count
  certifications: FilterOption[];      // Available certifications with count
  priceRanges: PriceRangeFilter[];    // Price range buckets with count
  experienceLevels: ExperienceLevelFilter[]; // Experience levels with count
  ratingRanges: FilterOption[];        // Rating ranges with count
}

interface FilterOption {
  id: string;
  name: string;
  count: number;
  icon?: string;
}
```

**Example:**
```typescript
const filters = await marketplaceSearchService.getAvailableFilters({
  platforms: ['meta'],
});

// Build filter UI
filters.niches.forEach(niche => {
  console.log(`${niche.name} (${niche.count})`);
});
// Output:
// E-commerce (245)
// Fashion (189)
// Beauty & Cosmetics (156)
```

### 3. `getSpecialistDetail(slug: string): Promise<AgentProfile>`

Retrieves complete specialist profile with all relationships loaded.

**Parameters:**
- `slug`: Unique specialist slug (e.g., 'performa-full-auto-ai')

**Returns:** Full `AgentProfile` with:
- `certifications` - Approved certifications with issuer info
- `languages` - Spoken languages with proficiency levels
- `geographicCoverage` - Primary and secondary coverage areas
- `reviews` - Latest reviews (sorted by date)
- `platformMetrics` - Platform-specific metrics (latest data)
- `historicalPerformance` - Monthly performance history
- `caseStudies` - Published case studies

**Example:**
```typescript
const specialist = await marketplaceSearchService.getSpecialistDetail('performa-meta-ai');

console.log(`Specialist: ${specialist.displayName}`);
console.log(`Rating: ${specialist.cachedRating} (${specialist.cachedReviewCount} reviews)`);
console.log(`Certifications: ${specialist.certifications.map(c => c.certification.name).join(', ')}`);
console.log(`Languages: ${specialist.languages.map(l => l.languageCode).join(', ')}`);
console.log(`Coverage: ${specialist.geographicCoverage.map(g => g.countryCode).join(', ')}`);
```

### 4. `getSpecialistPerformance(slug: string, period?: 'month' | 'quarter' | 'year'): Promise<SpecialistPerformance>`

Retrieves performance data and charts.

**Response:**
```typescript
interface SpecialistPerformance {
  slug: string;
  avgRoas: number;
  avgCpa: number;
  totalCampaigns: number;
  activeCampaigns: number;
  successRate: number;
  totalSpendManaged: number;
  bestRoas: number;
  monthlyPerformance: PerformanceDataPoint[];
  platformMetrics: PlatformMetric[];
}

interface PerformanceDataPoint {
  month: string;
  roas: number;
  spend: number;
  campaigns: number;
}
```

**Example:**
```typescript
const performance = await marketplaceSearchService.getSpecialistPerformance(
  'performa-meta-ai',
  'year'
);

console.log(`Avg ROAS: ${performance.avgRoas}x`);
console.log(`Total Spend Managed: $${performance.totalSpendManaged}`);

// Build chart data
const chartData = performance.monthlyPerformance.map(point => ({
  month: point.month,
  roas: point.roas,
  spend: point.spend,
}));

// Platform breakdown
performance.platformMetrics.forEach(metric => {
  console.log(`${metric.platform}: ${metric.avgRoas}x ROAS`);
});
```

### 5. `updateSearchKeywords(agentId: string): Promise<void>`

Updates full-text search index for a specialist.

**Automatically includes:**
- Display name and title
- Biography
- Platforms and niches
- Certification names and issuers
- Languages and proficiency levels
- Countries and regions
- Industries served

**Example:**
```typescript
// Update search index for a specialist
await marketplaceSearchService.updateSearchKeywords(specialist.id);

// Or automatically run daily at 2 AM
// The service includes @Cron decorator for batch updates
```

## Filtering Features

### Full-Text Search

Uses PostgreSQL `plainto_tsquery` for natural language searching:

```typescript
// Searches across:
// - search_keywords (pre-indexed text)
// - display_name
// - title
// - bio

const results = await service.searchSpecialists({
  query: 'facebook ads e-commerce',
});
```

### Platform Filtering

Filter by advertising platforms:

```typescript
const results = await service.searchSpecialists({
  platforms: ['meta', 'google'],
});
// Returns specialists working on Meta and/or Google Ads
```

### Niche Filtering

Filter by business niches:

```typescript
const results = await service.searchSpecialists({
  niches: ['e-commerce', 'fashion', 'beauty'],
});
```

### Geographic Coverage

Filter by countries and coverage type:

```typescript
const results = await service.searchSpecialists({
  countries: ['US', 'UZ', 'KZ'],
  coverageType: 'primary', // or 'secondary' or 'all'
});
```

### Language Filtering

Filter by supported languages and proficiency:

```typescript
const results = await service.searchSpecialists({
  languages: ['en', 'uz', 'ru'],
  languageProficiency: 'fluent',
});
```

### Certification Filtering

Filter by verified certifications:

```typescript
const results = await service.searchSpecialists({
  certifications: [certificationId1, certificationId2],
});
// Only returns specialists with approved certifications
```

### Performance Metrics

Filter by ROAS, CPA, and rating:

```typescript
const results = await service.searchSpecialists({
  minRoas: 3.0,        // Minimum 3x ROAS
  minCpa: 5,           // Minimum $5 CPA
  maxCpa: 50,          // Maximum $50 CPA
  minRating: 4.0,      // Minimum 4-star rating
});
```

### Price Range

Filter by monthly pricing:

```typescript
const results = await service.searchSpecialists({
  priceRange: {
    min: 100,
    max: 500,
  },
});
```

## Sorting Options

| Option | Description |
|--------|-------------|
| `rating` | By cached rating (highest first), then review count |
| `roas` | By average ROAS (highest first) |
| `price` | By monthly rate (lowest first) |
| `experience` | By years since account creation (oldest first) |
| `popularity` | By popularity score and review count (highest first) |
| `newest` | By creation date (newest first) |
| (default) | Featured status → Rating → Popularity score |

```typescript
const results = await service.searchSpecialists({
  query: 'e-commerce',
  sortBy: 'rating',
});
```

## Pagination

Services supports cursor-less offset pagination:

```typescript
const page1 = await service.searchSpecialists({
  query: 'facebook',
  page: 1,
  pageSize: 20,
});

console.log(`Page ${page1.page} of ${Math.ceil(page1.total / page1.pageSize)}`);
console.log(`Has more results: ${page1.hasMore}`);

// Get next page
const page2 = await service.searchSpecialists({
  query: 'facebook',
  page: 2,
  pageSize: 20,
});
```

**Constraints:**
- Default page size: 20
- Maximum page size: 100
- Page must be >= 1

## Database Optimization

### Indexes

The service utilizes the following indexes for performance:

```sql
-- On AgentProfile
CREATE INDEX idx_agent_published_indexable ON agent_profiles(is_published, is_indexable);
CREATE INDEX idx_agent_rating ON agent_profiles(cached_rating DESC);
CREATE INDEX idx_agent_platforms ON agent_profiles USING GIN(platforms);
CREATE INDEX idx_agent_niches ON agent_profiles USING GIN(niches);
CREATE INDEX idx_agent_search_keywords ON agent_profiles USING GIN(to_tsvector('english', search_keywords));

-- On AgentPlatformMetrics
CREATE INDEX idx_platform_metrics ON agent_platform_metrics(agent_profile_id, platform, aggregation_period DESC);
CREATE INDEX idx_metrics_synced ON agent_platform_metrics(synced_at DESC);

-- On AgentLanguage
CREATE INDEX idx_agent_language ON agent_languages(agent_profile_id, language_code);

-- On AgentGeographicCoverage
CREATE INDEX idx_agent_geography ON agent_geographic_coverage(agent_profile_id, country_code);
```

### N+1 Query Prevention

All relationships are eager-loaded with `leftJoinAndSelect` to prevent N+1 queries:

```typescript
query
  .leftJoinAndSelect('ap.certifications', 'cert')
  .leftJoinAndSelect('cert.certification', 'certification')
  .leftJoinAndSelect('ap.languages', 'lang')
  .leftJoinAndSelect('ap.geographicCoverage', 'geo');
```

## Caching Strategy

### Search Keywords

Full-text search keywords are updated:
1. **On-demand**: Call `updateSearchKeywords(agentId)` when specialist profile changes
2. **Batch nightly**: Automatic cron job runs at 2 AM to update all specialists

```typescript
@Cron(CronExpression.EVERY_DAY_AT_2AM)
async updateAllSearchKeywords(): Promise<void>
```

### Filter Counts

Filter counts are calculated dynamically per search request. For high-traffic scenarios, consider implementing Redis caching:

```typescript
// Example: Cache filter results for 1 hour
const cacheKey = `filters:${JSON.stringify(filters)}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const filters = await this.getAvailableFiltersInternal(filters);
await redis.set(cacheKey, JSON.stringify(filters), 'EX', 3600);
```

## Error Handling

### NotFoundException
```typescript
try {
  await service.getSpecialistDetail('non-existent-slug');
} catch (error) {
  if (error instanceof NotFoundException) {
    console.log('Specialist not found');
  }
}
```

### BadRequestException
```typescript
try {
  await service.searchSpecialists({
    pageSize: 200, // Exceeds max of 100
  });
} catch (error) {
  if (error instanceof BadRequestException) {
    console.log('Invalid search parameters');
  }
}
```

## Integration Examples

### NestJS Controller

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { MarketplaceSearchService, MarketplaceFilters } from './marketplace-search.service';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly searchService: MarketplaceSearchService) {}

  @Get('search')
  async search(@Query() filters: MarketplaceFilters) {
    return this.searchService.searchSpecialists(filters);
  }

  @Get('filters')
  async getFilters(@Query() filters: MarketplaceFilters) {
    return this.searchService.getAvailableFilters(filters);
  }

  @Get('specialists/:slug')
  async getDetail(@Param('slug') slug: string) {
    return this.searchService.getSpecialistDetail(slug);
  }

  @Get('specialists/:slug/performance')
  async getPerformance(@Param('slug') slug: string) {
    return this.searchService.getSpecialistPerformance(slug);
  }
}
```

### Frontend Usage

```typescript
// Vue.js example
const state = reactive({
  filters: {
    query: '',
    platforms: [],
    niches: [],
    page: 1,
    pageSize: 20,
  },
  results: null,
  availableFilters: null,
});

async function search() {
  const response = await fetch('/api/marketplace/search', {
    method: 'POST',
    body: JSON.stringify(state.filters),
  });
  state.results = await response.json();
}

async function loadFilters() {
  const response = await fetch('/api/marketplace/filters', {
    method: 'POST',
    body: JSON.stringify(state.filters),
  });
  state.availableFilters = await response.json();
}

async function selectNiche(niche) {
  state.filters.niches = [niche];
  state.filters.page = 1;
  await Promise.all([search(), loadFilters()]);
}
```

## Testing

```typescript
describe('MarketplaceSearchService', () => {
  let service: MarketplaceSearchService;
  let agentProfileRepository: Repository<AgentProfile>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MarketplaceSearchService,
        {
          provide: getRepositoryToken(AgentProfile),
          useClass: Repository,
        },
        // ... other repositories
      ],
    }).compile();

    service = module.get<MarketplaceSearchService>(MarketplaceSearchService);
  });

  it('should search specialists with filters', async () => {
    const results = await service.searchSpecialists({
      query: 'test',
      platforms: ['meta'],
      page: 1,
      pageSize: 10,
    });

    expect(results.specialists).toBeDefined();
    expect(results.total).toBeGreaterThanOrEqual(0);
    expect(results.page).toBe(1);
  });

  it('should return available filters', async () => {
    const filters = await service.getAvailableFilters();

    expect(filters.platforms).toBeDefined();
    expect(filters.niches).toBeDefined();
    expect(filters.countries).toBeDefined();
  });
});
```

## Performance Considerations

1. **Full-Text Search**: PostgreSQL native FTS is used for text queries
2. **Pagination**: Always use pagination to avoid loading large result sets
3. **Eager Loading**: Relationships are selectively eager-loaded to minimize queries
4. **Filter Aggregation**: Filter counts may be expensive; cache results when possible
5. **Batch Updates**: Search keyword updates run nightly, not on-demand in hot paths

## Type Safety

All request/response types are fully typed with TypeScript:

```typescript
import {
  MarketplaceFilters,
  MarketplaceSearchResponse,
  SpecialistPerformance,
  AvailableFiltersResponse,
} from './services/marketplace-search.service';
```

## License

Part of the Performa platform. All rights reserved.
