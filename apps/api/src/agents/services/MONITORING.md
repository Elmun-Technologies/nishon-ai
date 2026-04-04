# SEO Monitoring & Analytics Setup

## Google Search Console Integration

### 1. Sitemap Submission

1. Go to Google Search Console (https://search.google.com/search-console)
2. Select your property (performa.ai)
3. Navigate to "Sitemaps"
4. Enter sitemap URL: `https://performa.ai/sitemaps/sitemap-index.xml`
5. Click "Submit"
6. Monitor indexation status

### 2. URL Inspection Tool

Use for individual pages:
1. Enter specialist profile URLs
2. Check indexation status
3. View Google's rendering
4. Check structured data detection
5. Request indexation if needed

### 3. Performance Reports

Monitor these metrics:

**Page Performance**
- Click-through rate (CTR) by page type
- Average position by page
- Impressions by page
- Clicks by page

**Query Performance**
- Top search queries
- Query impressions
- Query clicks
- Query position average

**Search Appearance**
- Rich results (star ratings, prices)
- Featured snippets
- Knowledge panels
- Link display

### 4. Coverage Report

Track indexation health:
- Valid pages indexed
- Excluded pages (by reason)
- Error pages
- Warnings

## Google Analytics 4 Setup

### 1. Ecommerce Events (if applicable)

Track specialist engagement as conversions:

```javascript
gtag('event', 'view_specialist', {
  specialist_id: 'specialist-slug',
  specialist_name: 'John Doe',
  platform: 'meta',
  niche: 'e-commerce',
  rating: 4.8,
  user_segment: 'organic'
})

gtag('event', 'contact_specialist', {
  specialist_id: 'specialist-slug',
  specialist_name: 'John Doe',
  conversion_type: 'contact_form'
})
```

### 2. Custom Dimensions

Set up custom dimensions for analysis:

| Dimension | Value | Purpose |
|-----------|-------|---------|
| Specialist Platform | Meta, Google, Yandex, TikTok | Track visits by platform |
| Specialist Niche | E-commerce, SaaS, Agency | Track visits by industry |
| Specialist Rating | 1, 2, 3, 4, 5 stars | Track rating distribution |
| Page Type | Landing, Search, Profile | Analyze performance by page |
| Organic Source | Google, Bing, Yandex | Track search engine traffic |

### 3. Key Metrics to Monitor

**Organic Traffic Metrics**
```sql
SELECT
  DATE(date) as date,
  COUNT(user_id) as sessions,
  SUM(engagement_time) as total_time,
  COUNTIF(conversion = true) as conversions,
  ROUND(100.0 * COUNTIF(conversion = true) / COUNT(user_id), 2) as conversion_rate
FROM events
WHERE traffic_source.source = 'organic'
GROUP BY DATE(date)
```

**Page Performance**
```sql
SELECT
  page_path,
  COUNT(DISTINCT user_id) as users,
  COUNT(*) as pageviews,
  ROUND(100.0 * SUM(CASE WHEN (time_on_page > 10000) THEN 1 ELSE 0 END) / COUNT(*), 2) as engagement_rate,
  SUM(CASE WHEN conversion = true THEN 1 ELSE 0 END) as conversions
FROM events
WHERE traffic_source.source = 'organic'
GROUP BY page_path
ORDER BY users DESC
```

**Specialist Profile Engagement**
```sql
SELECT
  specialist_id,
  specialist_name,
  COUNT(DISTINCT user_id) as unique_visitors,
  COUNT(*) as page_views,
  AVG(time_on_page) as avg_session_time,
  COUNTIF(event = 'contact_specialist') as contact_attempts
FROM events
WHERE page_path LIKE '/marketplace/specialists/%'
AND traffic_source.source = 'organic'
GROUP BY specialist_id, specialist_name
ORDER BY unique_visitors DESC
```

## Keyword Ranking Tracking

### 1. Tools to Use

- **Google Search Console** - Free, direct from Google
- **SE Ranking** - Affordable, comprehensive
- **Semrush** - Premium features
- **Ahrefs** - Competitive intelligence
- **Moz Pro** - Authority metrics

### 2. Keywords to Track

**Primary Keywords (20)**
```
AI marketing specialist
Performance marketing expert
Ads management specialist
Certified marketing expert
Hire marketing specialist
Meta ads specialist
Google ads expert
Yandex ads professional
E-commerce marketing specialist
SaaS marketing expert
Find marketing specialist
Certified ad specialist
Digital marketing professional
Freelance marketing expert
Top marketing specialist
Performance marketing agency
Verified marketing expert
Expert marketing consultant
Specialist marketing services
Online marketing professional
```

**Niche Keywords (15)**
```
Meta ads specialist
Facebook ads expert
Google ads professional
Yandex ads specialist
TikTok ads manager
E-commerce ads expert
SaaS marketing specialist
Agency marketing specialist
Fashion marketing expert
B2B marketing professional
Performance marketing consultant
Digital advertising expert
Campaign management specialist
Ads optimization specialist
Marketing automation expert
```

**Geo-Based Keywords (10)**
```
Marketing specialist in USA
Marketing expert near me
Remote marketing specialist
International marketing expert
UK marketing specialist
EU marketing professional
Asia marketing expert
LATAM marketing specialist
Middle East marketing expert
Marketing expert [Country]
```

### 3. Tracking Dashboard

Create a monthly tracking spreadsheet:

| Keyword | Position (Start) | Position (Current) | Trend | Traffic | Target |
|---------|-----------------|------------------|-------|---------|--------|
| AI marketing specialist | 8 | 5 | ↑ | 45 | 1-3 |
| Performance marketing expert | 12 | 10 | ↑ | 32 | 1-5 |
| Ads management specialist | 15 | 11 | ↑ | 28 | 1-5 |

## Technical SEO Monitoring

### 1. Sitemap Monitoring

```bash
# Check sitemap generation
curl -I https://performa.ai/sitemaps/sitemap-index.xml

# Count URLs
curl https://performa.ai/sitemaps/sitemap.xml | grep -o '<loc>' | wc -l

# Validate XML
xmllint --noout https://performa.ai/sitemaps/sitemap.xml
```

### 2. Robots.txt Monitoring

```bash
# Check robots.txt accessibility
curl -I https://performa.ai/robots.txt

# Check for syntax errors
curl https://performa.ai/robots.txt | head -20
```

### 3. Core Web Vitals Monitoring

Use Google PageSpeed Insights:
```
https://pagespeed.web.dev/?url=https://performa.ai/marketplace
```

Track these metrics:
- **LCP (Largest Contentful Paint)** - Target: < 2.5s
- **FID (First Input Delay)** - Target: < 100ms
- **CLS (Cumulative Layout Shift)** - Target: < 0.1

### 4. Structured Data Validation

Use Google Rich Results Test:
```
https://search.google.com/test/rich-results?url=https://performa.ai/marketplace
```

Validate:
- Person schema on specialist profiles
- Organization schema on landing page
- AggregateRating schema with review counts
- No validation errors

### 5. Mobile Usability

Monitor in Search Console:
- Mobile-friendly design
- Click targets (minimum 48px)
- Font size readiness (minimum 16px)
- Viewport configuration

## Performance Tracking

### 1. Indexation Rate

Calculate weekly:
```
Indexed Pages / Total Pages Published = Indexation Rate

Target: > 95%
```

Monitor in Search Console:
- Pages indexed
- Pages excluded
- Pages with warnings/errors

### 2. Click-Through Rate (CTR)

Track by page type:
```
Clicks / Impressions = CTR

Target Landing Page: 15-25%
Target Search Results: 5-10%
Target Specialist Profile: 8-15%
```

### 3. Average Position

Monitor ranking progress:
```
Target Marketplace Landing: Position 1-3
Target Specialist Profiles: Position 1-5
Target Search Results: Position 3-10
```

### 4. Organic Traffic Growth

Monthly trend:
```
Month    Sessions    Users    Conversions    Growth
Jan      1,000       800      20            -
Feb      1,200       950      28            +20%
Mar      1,500       1,200    42            +25%
Apr      1,950       1,500    58            +30%
```

Target: 20-30% monthly growth in year 1

## Reporting Schedule

### Weekly Report

**Metrics to Monitor:**
- New indexed pages
- Indexation rate
- Critical crawl errors
- Core Web Vitals status
- Top traffic sources

**Action Items:**
- Review new errors
- Fix mobile issues
- Submit sitemaps
- Check page accessibility

### Monthly Report

**Analysis:**
- Organic traffic trends
- Keyword ranking changes
- Top performing pages
- User engagement metrics
- Conversion rates by page

**Optimizations:**
- Update underperforming metadata
- Add internal links to high-value pages
- Optimize images
- Improve page speed
- Refresh stale content

### Quarterly Report

**Strategic Review:**
- Quarterly traffic growth
- Seasonal trends
- Competitive benchmarking
- Keyword opportunity analysis
- Long-term trend forecasting

**Planning:**
- Update content strategy
- Plan new keywords
- Identify content gaps
- Plan feature rollouts
- Set next quarter targets

## Alerts & Thresholds

Set up automated alerts for:

| Metric | Alert Threshold | Action |
|--------|-----------------|--------|
| Indexation Rate Drop | < 90% | Check robots.txt, review new noindex tags |
| CTR Drop | > 10% decrease | Review title/description in Search Console |
| Traffic Drop | > 20% decrease | Check for penalties, review algorithm changes |
| Crawl Errors | > 10 new errors | Fix broken links, check redirects |
| Page Speed | LCP > 4s | Optimize images, reduce JS, enable caching |
| Keyword Drop | Position > 20 | Refresh content, improve user signals |

## Competitive Analysis

### 1. Competitors to Monitor

- Other marketplace platforms
- Agency listing sites
- Freelancer platforms
- Industry directories

### 2. Metrics to Compare

Using Semrush or Ahrefs:
- Domain authority
- Backlink profile
- Organic traffic
- Keyword rankings
- Content strategy
- Link opportunities

### 3. Benchmarking

Create quarterly comparison:
```
Competitor    Traffic    Keywords Ranked    Backlinks    Authority
Performa      15,000     2,400              450          42
Competitor A  22,000     3,100              620          48
Competitor B  18,500     2,800              500          45
Competitor C  12,000     1,900              380          38
```

## Reporting Templates

### Monthly SEO Report

```
EXECUTIVE SUMMARY
- Organic traffic: [X%] increase/decrease
- Keyword rankings: [X] positions improved
- New pages indexed: [X]
- Conversions from organic: [X]

KEY METRICS
- Organic sessions: [X]
- Organic users: [X]
- Conversion rate: [X%]
- Average ranking position: [X]

TOP PERFORMERS
- Top traffic pages: [list top 3]
- Top converting keywords: [list top 3]
- Top ranking keywords: [list top 3]

AREAS FOR IMPROVEMENT
- Underperforming pages: [list with opportunities]
- Keywords to optimize: [list with gaps]
- Technical issues: [list and fixes]

ACTIONS TAKEN
- Metadata updated: [X pages]
- Internal links added: [X]
- Content refreshed: [X pages]
- Errors fixed: [X issues]

NEXT STEPS
- Priority 1: [action]
- Priority 2: [action]
- Priority 3: [action]
```

---

**Document Version:** 1.0.0
**Last Updated:** 2026-04-04
