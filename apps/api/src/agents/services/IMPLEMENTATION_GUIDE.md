# MarketplaceSearchService - Implementation Guide

## Quick Start

### 1. Service is Already Registered

The `MarketplaceSearchService` is automatically registered in the `AgentsModule` and ready to use.

### 2. Inject into Your Service or Controller

```typescript
import { Injectable } from '@nestjs/common';
import { MarketplaceSearchService } from './services/marketplace-search.service';

@Injectable()
export class YourService {
  constructor(private readonly marketplaceSearch: MarketplaceSearchService) {}

  async findSpecialists() {
    return this.marketplaceSearch.searchSpecialists({
      query: 'facebook ads',
      platforms: ['meta'],
      page: 1,
      pageSize: 20,
    });
  }
}
```

### 3. Create REST Endpoints

```typescript
import { Controller, Get, Query, Param } from '@nestjs/common';
import { MarketplaceSearchService, MarketplaceFilters } from './services/marketplace-search.service';

@Controller('api/marketplace')
export class MarketplaceController {
  constructor(private readonly search: MarketplaceSearchService) {}

  @Get('search')
  async searchSpecialists(@Query() filters: MarketplaceFilters) {
    return this.search.searchSpecialists(filters);
  }

  @Get('filters')
  async getAvailableFilters(@Query() filters: MarketplaceFilters) {
    return this.search.getAvailableFilters(filters);
  }

  @Get('specialists/:slug')
  async getDetail(@Param('slug') slug: string) {
    return this.search.getSpecialistDetail(slug);
  }

  @Get('specialists/:slug/performance')
  async getPerformance(@Param('slug') slug: string) {
    return this.search.getSpecialistPerformance(slug, 'year');
  }
}
```

## Feature Examples

### Example 1: Search E-commerce Specialists

Find all verified Facebook specialists with high ROAS in e-commerce:

```typescript
const results = await marketplaceSearch.searchSpecialists({
  query: 'e-commerce',
  platforms: ['meta'],
  niches: ['e-commerce', 'fashion'],
  isVerified: true,
  minRoas: 3.0,
  minRating: 4.0,
  sortBy: 'roas',
  page: 1,
  pageSize: 10,
});

console.log(`Found ${results.total} specialists`);
results.specialists.forEach(specialist => {
  console.log(`${specialist.displayName}: ${specialist.cachedStats.avgROAS}x ROAS`);
});
```

### Example 2: Filter by Geographic Coverage

Find specialists covering US and specific countries with language preferences:

```typescript
const results = await marketplaceSearch.searchSpecialists({
  countries: ['US', 'UZ', 'KZ'],
  languages: ['en', 'uz'],
  languageProficiency: 'fluent',
  coverageType: 'primary',
  sortBy: 'experience',
});

results.specialists.forEach(specialist => {
  console.log(`${specialist.displayName} covers: ${specialist.primaryCountries.join(', ')}`);
});
```

### Example 3: Budget-Conscious Search

Find affordable specialists under $300/month:

```typescript
const results = await marketplaceSearch.searchSpecialists({
  priceRange: {
    min: 0,
    max: 300,
  },
  minRating: 3.5,
  sortBy: 'price',
});

results.specialists.forEach(specialist => {
  console.log(`${specialist.displayName}: $${specialist.monthlyRate}/month`);
});
```

### Example 4: Certified Specialists Only

Find specialists with verified Google and Meta certifications:

```typescript
const certifications = await marketplaceSearch.getAvailableFilters();
const googleCertId = certifications.certifications.find(c => c.name.includes('Google'))?.id;
const metaCertId = certifications.certifications.find(c => c.name.includes('Meta'))?.id;

const results = await marketplaceSearch.searchSpecialists({
  certifications: [googleCertId, metaCertId],
  sortBy: 'rating',
});
```

### Example 5: Advanced Multi-Filter Search

Complex search combining multiple criteria:

```typescript
const results = await marketplaceSearch.searchSpecialists({
  query: 'creative video',
  platforms: ['meta', 'tiktok'],
  niches: ['fashion', 'beauty'],
  countries: ['US', 'UK', 'FR'],
  languages: ['en', 'fr'],
  minRating: 4.5,
  minRoas: 2.5,
  maxCpa: 30,
  isVerified: true,
  isFeatured: false,
  priceRange: {
    min: 100,
    max: 1000,
  },
  sortBy: 'popularity',
  page: 1,
  pageSize: 50,
});

console.log(`Page ${results.page}/${Math.ceil(results.total / results.pageSize)}`);
console.log(`Results: ${results.specialists.length} of ${results.total}`);
```

### Example 6: Get Complete Profile with Performance

Retrieve full specialist details and performance metrics:

```typescript
const specialist = await marketplaceSearch.getSpecialistDetail('performa-meta-ai');

console.log(`Name: ${specialist.displayName}`);
console.log(`Title: ${specialist.title}`);
console.log(`Rating: ${specialist.cachedRating} ⭐ (${specialist.cachedReviewCount} reviews)`);
console.log(`Verified: ${specialist.isVerified}`);

// Get performance data
const performance = await marketplaceSearch.getSpecialistPerformance('performa-meta-ai', 'year');

console.log(`Average ROAS: ${performance.avgRoas}x`);
console.log(`Total Spend: $${performance.totalSpendManaged}`);
console.log(`Success Rate: ${performance.successRate}%`);

// Show monthly trend
console.log('\nMonthly Performance:');
performance.monthlyPerformance.forEach(month => {
  console.log(`${month.month}: ${month.roas}x ROAS ($${month.spend})`);
});

// Show platform breakdown
console.log('\nPlatform Breakdown:');
performance.platformMetrics.forEach(metric => {
  console.log(`${metric.platform}: ${metric.avgRoas}x ROAS (${metric.campaignsCount} campaigns)`);
});
```

### Example 7: Dynamic Filter UI

Build faceted search with dynamic filter counts:

```typescript
async function buildFilterUI(currentFilters) {
  const availableFilters = await marketplaceSearch.getAvailableFilters(currentFilters);

  // Render platform options
  console.log('Platforms:');
  availableFilters.platforms.forEach(platform => {
    console.log(`  ☐ ${platform.name} (${platform.count})`);
  });

  // Render niche options
  console.log('\nNiches:');
  availableFilters.niches.forEach(niche => {
    console.log(`  ☐ ${niche.name} (${niche.count})`);
  });

  // Render price ranges
  console.log('\nPrice:');
  availableFilters.priceRanges.forEach(range => {
    console.log(`  ☐ ${range.label} (${range.count})`);
  });

  // Render rating ranges
  console.log('\nRating:');
  availableFilters.ratingRanges.forEach(range => {
    console.log(`  ☐ ${range.name} (${range.count})`);
  });
}

// Usage
await buildFilterUI({ query: 'facebook' });
```

## Maintenance Tasks

### Update Search Keywords When Profile Changes

Whenever a specialist's profile is updated, refresh their search index:

```typescript
@Injectable()
export class AgentService {
  constructor(
    private readonly agentRepository: Repository<AgentProfile>,
    private readonly marketplaceSearch: MarketplaceSearchService,
  ) {}

  async updateSpecialist(id: string, updates: Partial<AgentProfile>) {
    // Update profile
    await this.agentRepository.update(id, updates);

    // Refresh search index
    await this.marketplaceSearch.updateSearchKeywords(id);
  }
}
```

### Batch Update Search Index

The service automatically updates all search keywords daily at 2 AM via the cron job:

```typescript
@Cron(CronExpression.EVERY_DAY_AT_2AM)
async updateAllSearchKeywords(): Promise<void>
```

You can also trigger it manually for testing:

```typescript
await marketplaceSearch.updateAllSearchKeywords();
```

## Performance Optimization

### 1. Use Pagination

Always paginate results to avoid loading large datasets:

```typescript
// Good - paginated
const results = await marketplaceSearch.searchSpecialists({
  query: 'facebook',
  page: 1,
  pageSize: 20,
});

// Bad - could load thousands of results
const allResults = await agentProfileRepository.find({
  where: { isPublished: true },
});
```

### 2. Cache Filter Results

For frequently accessed filter combinations, implement caching:

```typescript
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class CachedMarketplaceSearch {
  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    private readonly marketplaceSearch: MarketplaceSearchService,
  ) {}

  async getAvailableFilters(filters: MarketplaceFilters) {
    const cacheKey = `filters:${JSON.stringify(filters)}`;

    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const result = await this.marketplaceSearch.getAvailableFilters(filters);
    await this.cache.set(cacheKey, result, 3600000); // 1 hour TTL

    return result;
  }
}
```

### 3. Limit Facet Calculation

Don't calculate all facets on every request. Calculate only relevant ones:

```typescript
async function getFiltersForSearch(searchQuery: string) {
  // First, get search results
  const results = await marketplaceSearch.searchSpecialists({
    query: searchQuery,
    page: 1,
    pageSize: 1,
  });

  // Use returned filters instead of recalculating
  return results.filters;
}
```

## Testing Examples

### Unit Tests

```typescript
describe('MarketplaceSearchService', () => {
  let service: MarketplaceSearchService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [MarketplaceSearchService, /* mock repositories */],
    }).compile();

    service = module.get(MarketplaceSearchService);
  });

  it('should search with platform filter', async () => {
    const results = await service.searchSpecialists({
      platforms: ['meta'],
    });

    expect(results.specialists).toBeGreaterThanOrEqual(0);
    results.specialists.forEach(specialist => {
      expect(specialist.platforms).toContain('meta');
    });
  });

  it('should respect page size limits', async () => {
    const results = await service.searchSpecialists({
      pageSize: 1000,
    });

    expect(results.pageSize).toBeLessThanOrEqual(100);
  });
});
```

### E2E Tests

```typescript
describe('Marketplace Search E2E', () => {
  let app: INestApplication;
  let service: MarketplaceSearchService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    service = module.get(MarketplaceSearchService);
  });

  it('GET /marketplace/search should return results', async () => {
    const response = await request(app.getHttpServer()).get('/marketplace/search').query({
      query: 'facebook',
      platforms: ['meta'],
      page: 1,
      pageSize: 10,
    });

    expect(response.status).toBe(200);
    expect(response.body.specialists).toBeDefined();
    expect(response.body.total).toBeGreaterThanOrEqual(0);
  });

  it('GET /marketplace/specialists/:slug should return details', async () => {
    const response = await request(app.getHttpServer()).get(
      '/marketplace/specialists/performa-meta-ai',
    );

    expect(response.status).toBe(200);
    expect(response.body.displayName).toBe('Meta & Instagram AI');
    expect(response.body.certifications).toBeDefined();
    expect(response.body.languages).toBeDefined();
  });
});
```

## API Response Examples

### Search Response

```json
{
  "specialists": [
    {
      "id": "agent-1",
      "slug": "performa-meta-ai",
      "displayName": "Meta & Instagram AI",
      "title": "Instagram and Facebook Ads Expert",
      "cachedRating": 4.8,
      "cachedReviewCount": 42,
      "monthlyRate": 150,
      "platforms": ["meta"],
      "niches": ["e-commerce", "fashion"],
      "cachedStats": {
        "avgROAS": 5.1,
        "avgCPA": 6,
        "totalCampaigns": 520,
        "activeCampaigns": 198,
        "successRate": 91
      }
    }
  ],
  "total": 245,
  "page": 1,
  "pageSize": 20,
  "hasMore": true,
  "filters": {
    "platforms": [
      { "id": "meta", "name": "Meta", "count": 189, "icon": "📘" },
      { "id": "google", "name": "Google Ads", "count": 156, "icon": "🔍" }
    ],
    "niches": [
      { "id": "e-commerce", "name": "e-commerce", "count": 98 },
      { "id": "fashion", "name": "fashion", "count": 67 }
    ],
    "priceRanges": [
      { "min": 0, "max": 50, "label": "Under $50", "count": 45 },
      { "min": 50, "max": 150, "label": "$50 - $150", "count": 78 }
    ]
  }
}
```

### Specialist Detail Response

```json
{
  "id": "agent-1",
  "slug": "performa-meta-ai",
  "displayName": "Meta & Instagram AI",
  "title": "Instagram and Facebook Ads Expert",
  "bio": "Specialized in e-commerce and fashion...",
  "cachedRating": 4.8,
  "cachedReviewCount": 42,
  "isVerified": true,
  "isFeatured": true,
  "monthlyRate": 150,
  "certifications": [
    {
      "id": "cert-1",
      "certification": {
        "name": "Meta Blueprint Certified",
        "issuer": "Meta"
      },
      "verificationStatus": "approved"
    }
  ],
  "languages": [
    { "languageCode": "en", "proficiency": "native" },
    { "languageCode": "uz", "proficiency": "fluent" }
  ],
  "geographicCoverage": [
    { "countryCode": "US", "coverageType": "primary" },
    { "countryCode": "UZ", "coverageType": "primary" }
  ]
}
```

## Troubleshooting

### Issue: Search returns no results

1. Check if specialist is published: `isPublished = true`
2. Check if specialist is indexable: `isIndexable = true`
3. Verify search keywords are populated: `searchKeywords IS NOT NULL`
4. Try broader search terms

```typescript
// Debug query
const specialist = await agentProfileRepository.findOne({
  where: { slug: 'performa-meta-ai' },
});

console.log({
  isPublished: specialist.isPublished,
  isIndexable: specialist.isIndexable,
  hasKeywords: !!specialist.searchKeywords,
});
```

### Issue: Filters show zero counts

1. Verify base filter query is correct
2. Check data in related tables (languages, countries, certifications)
3. Ensure relationships are properly loaded

```typescript
// Check language counts
const languages = await agentLanguageRepository
  .createQueryBuilder('al')
  .select('language_code, COUNT(*) as count')
  .groupBy('language_code')
  .getRawMany();

console.log(languages);
```

### Issue: Slow search performance

1. Verify indexes exist (see Database Optimization section)
2. Check query execution plan: `EXPLAIN ANALYZE`
3. Reduce result set with more specific filters
4. Consider adding filters to cache

```typescript
// Check index usage
EXPLAIN ANALYZE
SELECT * FROM agent_profiles
WHERE is_published = true
AND is_indexable = true
AND cached_rating >= 4.0
AND platforms && ARRAY['meta']::text[];
```

## Migration Guide

If updating from previous version:

1. No database migrations required - service uses existing schema
2. Add new entities to AgentsModule if missing: `AgentLanguage`, `AgentGeographicCoverage`
3. Update search keywords: `npm run marketplace:update-keywords`
4. Test endpoints in staging environment first

## File Structure

```
apps/api/src/agents/
├── entities/
│   ├── agent-profile.entity.ts
│   ├── agent-certification.entity.ts
│   ├── agent-language.entity.ts
│   ├── agent-geographic-coverage.entity.ts
│   └── ...
├── services/
│   ├── marketplace-search.service.ts      ← Main service
│   ├── marketplace-search.service.spec.ts ← Unit tests
│   ├── MARKETPLACE_SEARCH_SERVICE.md      ← API documentation
│   ├── IMPLEMENTATION_GUIDE.md            ← This file
│   └── index.ts                           ← Exports
├── agents.module.ts                       ← Registered here
└── agents.controller.ts
```

## Support

For issues or questions:
1. Check the API documentation: `MARKETPLACE_SEARCH_SERVICE.md`
2. Review test cases: `marketplace-search.service.spec.ts`
3. Check database schema and indexes
4. Enable logging: `LOG_LEVEL=debug`

## Version History

- **v1.0.0** (2026-04-04)
  - Initial release with full search, filtering, and performance features
  - PostgreSQL full-text search support
  - Dynamic filter aggregation with counts
  - Comprehensive sorting options
  - Scheduled search keyword updates
