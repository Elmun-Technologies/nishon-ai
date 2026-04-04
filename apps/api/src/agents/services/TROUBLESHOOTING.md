# SEO Troubleshooting Guide

## Common Issues & Solutions

### Issue 1: Sitemaps Not Being Generated

**Symptoms:**
- `/sitemaps/sitemap.xml` returns 404
- No files in `public/sitemaps/` directory
- Cron job not executing

**Root Causes:**
1. Directory permissions issue
2. Service not registered in module
3. Cron job not configured
4. Insufficient specialist count

**Solutions:**

```bash
# 1. Check directory permissions
ls -la /home/user/nishon-ai/apps/web/public/
# Should be writable: drwxr-xr-x or drwxrwxr-x

# Fix permissions if needed
chmod 755 /home/user/nishon-ai/apps/web/public/
mkdir -p /home/user/nishon-ai/apps/web/public/sitemaps
chmod 755 /home/user/nishon-ai/apps/web/public/sitemaps

# 2. Verify service is injected
# Check in agents.module.ts that SitemapService is in providers

# 3. Check service logs
tail -f logs/application.log | grep -i sitemap

# 4. Manually trigger generation
curl -X POST http://localhost:3000/api/seo/regenerate-sitemaps

# 5. Verify specialist data exists
SELECT COUNT(*) FROM agent_profiles WHERE is_published = true;
```

### Issue 2: Metadata Not Including ROAS in Title

**Symptoms:**
- Titles show "[Name] Marketing Specialist | Performa"
- No ROAS value in title
- Stats appear null in metadata

**Root Causes:**
1. `cachedStats` is null
2. Performance sync not completed
3. Stats not being passed to service

**Solutions:**

```typescript
// 1. Check if specialist has stats
const specialist = await agentProfileRepository.findOne({
  where: { slug: 'john-doe' },
})

console.log(specialist.cachedStats) // Should not be null

// 2. Trigger performance sync
await performanceSyncService.syncSpecialistPerformance(specialist.id)

// 3. Verify stats in metadata generation
const metadata = await seoService.generateSpecialistMetadata({
  agentProfile: specialist,
  stats: specialist.cachedStats, // Ensure stats passed
})
```

### Issue 3: Structured Data Not Validating

**Symptoms:**
- Google Rich Results Test shows errors
- Validation errors in structured data
- Missing required fields

**Root Causes:**
1. Invalid JSON-LD format
2. Missing required fields (name, image)
3. Invalid rating values
4. Encoding issues

**Solutions:**

```bash
# Validate generated structured data
curl -X POST http://localhost:3000/api/seo/metadata \
  -H "Content-Type: application/json" \
  -d '{"type": "specialist", "data": {"slug": "john-doe"}}'

# Check response for errors
# Verify these required fields exist:
# - name (required)
# - description (required)
# - image (recommended)
# - aggregateRating.ratingValue (0-5)
# - aggregateRating.ratingCount (>= 0)
```

**Fix Example:**

```typescript
// In marketplace-seo.service.ts
private async generateSpecialistStructuredData(
  profile: AgentProfile,
  stats: AgentStats | undefined,
  rating: number,
  reviewCount: number,
): Promise<Record<string, any>> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.displayName || 'Unknown', // Always include
    description: profile.bio || profile.title, // Fallback
    image: profile.avatar || null, // Use null if not available
    aggregateRating:
      rating > 0 && reviewCount > 0 // Validate both values
        ? {
            '@type': 'AggregateRating',
            ratingValue: Math.max(0, Math.min(5, rating)), // Clamp 0-5
            ratingCount: Math.max(0, reviewCount),
          }
        : undefined,
  }
}
```

### Issue 4: Robots.txt Not Being Served

**Symptoms:**
- `curl https://performa.ai/robots.txt` returns 404
- Search engines report `robots.txt` missing
- Caching issues

**Root Causes:**
1. File not being generated
2. Wrong path in public directory
3. Web server not configured to serve it
4. File permissions

**Solutions:**

```bash
# 1. Check file exists
ls -la /home/user/nishon-ai/apps/web/public/robots.txt
# Should exist with readable permissions

# 2. Verify content
cat /home/user/nishon-ai/apps/web/public/robots.txt
# Should start with User-agent: *

# 3. Generate manually
curl -X POST http://localhost:3000/api/seo/generate-robots

# 4. Check web server configuration
# For Next.js, public/robots.txt is automatically served
# Verify in next.config.js if there are any route conflicts

# 5. Test locally
curl http://localhost:3000/robots.txt
# Should return content

# 6. Check production server
curl -I https://performa.ai/robots.txt
# Should return 200 OK
```

### Issue 5: Canonical URLs Causing Duplicate Content

**Symptoms:**
- Google Search Console warns about duplicates
- Multiple versions of same page indexed
- Confusion with URL parameters

**Root Causes:**
1. Canonical URL not set correctly
2. Query parameters not normalized
3. Protocol mismatch (http vs https)
4. Missing canonical on filter variations

**Solutions:**

```typescript
// 1. Verify canonical in metadata
const metadata = await seoService.generateSpecialistMetadata(input, 'en')
console.log(metadata.canonicalUrl) 
// Should be: https://performa.ai/marketplace/specialists/john-doe (no params)

// 2. Normalize filter query strings
private buildCanonicalQueryString(filters: Record<string, any>): string {
  const allowed = ['platforms', 'niches', 'certifications', 'minRating', 'page']
  const params = new URLSearchParams()
  
  // Sort keys for consistency
  Object.keys(filters)
    .sort() // Add sorting
    .forEach(key => {
      if (allowed.includes(key) && filters[key]) {
        if (Array.isArray(filters[key])) {
          // Sort array values
          filters[key]
            .sort()
            .forEach(v => params.append(key, String(v)))
        } else {
          params.append(key, String(filters[key]))
        }
      }
    })

  return params.toString()
}

// 3. Add rel="next" and rel="prev" for pagination
// In component, add Link headers for pagination
export function SearchResults({ page, totalPages }) {
  return (
    <>
      {page > 1 && (
        <link
          rel="prev"
          href={`/marketplace/specialists?page=${page - 1}`}
        />
      )}
      {page < totalPages && (
        <link
          rel="next"
          href={`/marketplace/specialists?page=${page + 1}`}
        />
      )}
    </>
  )
}
```

### Issue 6: Search Console Shows 404s for Specialist URLs

**Symptoms:**
- Search Console crawl errors
- Some specialist URLs show 404
- Recently added specialists not indexable

**Root Causes:**
1. Specialist not published (`isPublished: false`)
2. Specialist marked as non-indexable (`isIndexable: false`)
3. Slug mismatch (SEO slug vs regular slug)
4. Removed specialist from database

**Solutions:**

```bash
# 1. Check specialist publishing status
SELECT slug, is_published, is_indexable FROM agent_profiles 
WHERE seo_slug IS NOT NULL 
LIMIT 10;

# 2. Ensure specialist is published
UPDATE agent_profiles 
SET is_published = true, is_indexable = true 
WHERE slug = 'john-doe';

# 3. Verify slug consistency
SELECT slug, seo_slug FROM agent_profiles;
# seo_slug should be same as slug or null (use slug as fallback)

# 4. Regenerate sitemaps after publishing
curl -X POST http://localhost:3000/api/seo/regenerate-sitemaps

# 5. Request re-indexation in Search Console
# URL Inspection Tool -> Request Indexing
```

### Issue 7: Metadata API Returning Null or Empty

**Symptoms:**
- API returns `{}`
- Metadata fields empty
- Service errors in logs

**Root Causes:**
1. Service not injected properly
2. Repositories not initialized
3. No data in database
4. Service initialization error

**Solutions:**

```typescript
// 1. Verify service is properly injected in controller
@Controller('api/seo')
export class SeoController {
  constructor(
    private readonly seoService: MarketplaceSeoService, // Check this
  ) {}
}

// 2. Check if repositories are passed correctly
@Injectable()
export class MarketplaceSeoService {
  constructor(
    @InjectRepository(MarketplaceSeoMetadata)
    private readonly seoMetadataRepository: Repository<MarketplaceSeoMetadata>,
    // ... other repos
  ) {
    if (!seoMetadataRepository) {
      throw new Error('Repository not initialized')
    }
  }
}

// 3. Test API with error handling
curl -X POST http://localhost:3000/api/seo/metadata \
  -H "Content-Type: application/json" \
  -d '{"type": "marketplace", "language": "en"}' \
  -v # Shows headers and errors

// 4. Enable debug logging
LOG_LEVEL=debug npm run start

// 5. Test service directly in controller
@Post('test-metadata')
async testMetadata() {
  try {
    const metadata = await this.seoService.generateMarketplaceMetadata('en')
    return { success: true, metadata }
  } catch (error) {
    return { success: false, error: error.message, stack: error.stack }
  }
}
```

### Issue 8: Sitemap Shows Stale URLs

**Symptoms:**
- Deleted specialists still in sitemap
- Old URLs not removed
- Sitemap count doesn't match specialist count

**Root Causes:**
1. Cleanup not called before regeneration
2. Caching issue
3. Deleted profiles not fully removed
4. Stale file permissions

**Solutions:**

```typescript
// 1. Always cleanup before regeneration
async regenerateSitemaps() {
  await this.sitemapService.cleanupOldSitemaps() // Remove old files first
  await this.sitemapService.generateAllSitemaps() // Generate new ones
}

// 2. Verify only published specialists in sitemap
const specialists = await agentProfileRepository.find({
  where: { isPublished: true }, // Add this filter
  order: { updatedAt: 'DESC' },
})

// 3. Check file permissions and timestamps
ls -la /home/user/nishon-ai/apps/web/public/sitemaps/
# Look at timestamps - should be recent

# 4. Force regeneration
# Delete all sitemaps manually if needed
rm -rf /home/user/nishon-ai/apps/web/public/sitemaps/*
mkdir -p /home/user/nishon-ai/apps/web/public/sitemaps

# Then regenerate
curl -X POST http://localhost:3000/api/seo/regenerate-sitemaps
```

### Issue 9: Special Characters Breaking Metadata

**Symptoms:**
- Titles with quotes show as `&quot;`
- Ampersands show as `&amp;`
- Non-ASCII characters garbled
- HTML rendering issues

**Root Causes:**
1. Missing XML escaping in sitemaps
2. Missing HTML entity encoding in meta tags
3. Charset not set to UTF-8
4. Response encoding issue

**Solutions:**

```typescript
// 1. Ensure XML escaping in sitemaps
private escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// 2. HTML encode meta tags (Next.js does this automatically)
// But verify in output:
export function SeoHead({ metadata }: SeoHeadProps) {
  return (
    <>
      {/* React/Next.js auto-escapes content */}
      <meta name="description" content={metadata.description} />
      {/* Use dangerouslySetInnerHTML only for JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(metadata.structuredData),
        }}
      />
    </>
  )
}

// 3. Set UTF-8 charset in response headers
res.setHeader('Content-Type', 'application/json; charset=utf-8')

// 4. Test special characters
console.log('"test"'.replace(/"/g, '&quot;')) // Should output: &quot;test&quot;
```

### Issue 10: Performance Issues with Large Specialist Count

**Symptoms:**
- Sitemap generation times out
- API slow to respond
- Database queries taking too long
- Memory usage high

**Root Causes:**
1. No database indexes
2. Fetching too much data at once
3. Missing pagination
4. N+1 query problems

**Solutions:**

```sql
-- 1. Verify indexes exist
SELECT indexname FROM pg_indexes 
WHERE tablename = 'agent_profiles'
AND indexname LIKE '%published%'
OR indexname LIKE '%indexable%'
OR indexname LIKE '%slug%';

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_agent_profiles_published 
ON agent_profiles(is_published);

CREATE INDEX IF NOT EXISTS idx_agent_profiles_indexable 
ON agent_profiles(is_indexable);

CREATE INDEX IF NOT EXISTS idx_agent_profiles_slug 
ON agent_profiles(slug);

-- 2. Optimize sitemap generation query
// Use pagination instead of loading all at once
async generateAllSitemaps(): Promise<void> {
  const pageSize = 1000
  let page = 0
  const urls: SitemapUrl[] = []

  let hasMore = true
  while (hasMore) {
    const specialists = await this.agentProfileRepository.find({
      where: { isPublished: true },
      order: { updatedAt: 'DESC' },
      take: pageSize,
      skip: page * pageSize,
    })

    if (specialists.length === 0) {
      hasMore = false
      break
    }

    specialists.forEach(spec => {
      // Process URLs
    })

    page++
  }
}

// 3. Add database connection pooling
// In your database configuration
{
  max: 20, // Connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}
```

## Performance Optimization Checklist

- [ ] All required indexes created
- [ ] Pagination used for large datasets
- [ ] Caching enabled for metadata
- [ ] Image optimization (compressed, lazy-loaded)
- [ ] Gzip compression enabled
- [ ] CDN configured for static assets
- [ ] Database query optimization done
- [ ] Connection pooling configured
- [ ] Monitoring alerts set up

## Testing Checklist

- [ ] Metadata generated for marketplace landing
- [ ] Metadata generated for specialist profiles
- [ ] Metadata generated for search results
- [ ] Sitemaps generate without errors
- [ ] Robots.txt accessible at `/robots.txt`
- [ ] Structured data validates with Google tool
- [ ] Canonical URLs correct
- [ ] OG images generate correctly
- [ ] Mobile layout responsive
- [ ] Core Web Vitals passing

---

**Document Version:** 1.0.0
**Last Updated:** 2026-04-04
