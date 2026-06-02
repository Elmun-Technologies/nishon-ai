import { expect, test } from '@playwright/test'

/**
 * Public-surface smoke tests. They assert that key routes render server-side
 * (status 200 + a recognizable marker in the HTML) and that the auth
 * middleware redirects protected routes to /login when unauthenticated.
 *
 * Uses the `request` fixture only — no browser is launched, so these run
 * without a Chromium download.
 */

const PUBLIC_ROUTES: Array<{ path: string; expect: RegExp }> = [
  // Landing — hero heading id is stable.
  { path: '/', expect: /hero-heading|AdSpectr|Nishon/i },
  // Features index.
  { path: '/features', expect: /feature|funksiya|возможност/i },
  // A specific SEO feature-detail page (one of the 21).
  { path: '/features/launch-wizard', expect: /launch|kampaniya|запуск/i },
  // Conversational onboarding greeting.
  { path: '/onboarding', expect: /Salom|Nishon|onboarding/i },
  // Auth pages.
  { path: '/login', expect: /login|kirish|войти|email|parol/i },
  { path: '/register', expect: /register|ro.?yxat|регистрац|email/i },
  // Legal.
  { path: '/privacy', expect: /privacy|maxfiy|конфиденц/i },
  { path: '/terms', expect: /terms|shartlar|услови/i },
]

test.describe('public routes render', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`GET ${route.path} → 200 + content`, async ({ request }) => {
      const res = await request.get(route.path)
      expect(res.status(), `${route.path} should return 200`).toBe(200)
      const html = await res.text()
      expect(html, `${route.path} should contain expected marker`).toMatch(route.expect)
    })
  }
})

test.describe('auth middleware', () => {
  const PROTECTED = ['/dashboard', '/campaigns', '/launch', '/ai-agents', '/settings']

  for (const path of PROTECTED) {
    test(`unauthenticated ${path} → redirects to /login`, async ({ request }) => {
      const res = await request.get(path, { maxRedirects: 0 })
      // Next.js middleware issues a 307 to /login with ?next=<path>.
      expect([307, 308], `${path} should redirect`).toContain(res.status())
      const location = res.headers()['location'] ?? ''
      expect(location, `${path} should redirect to /login`).toContain('/login')
    })
  }
})

test('robots.txt and sitemap.xml are served', async ({ request }) => {
  const robots = await request.get('/robots.txt')
  expect(robots.status()).toBe(200)
  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.status()).toBe(200)
})

// All 21 SEO feature-detail pages (added in #115). Keep this list in sync with
// FEATURE_CONTENT slugs — a broken slug or a render-throw shows up as non-200.
const FEATURE_SLUGS = [
  'launch-wizard',
  'campaign-manager',
  'audience-builder',
  'retargeting',
  'ai-decisions',
  'auto-optimization',
  'creative-scorer',
  'budget-optimization',
  'simulation',
  'roi-calculator',
  'performance-analytics',
  'reporting',
  'competitor-intel',
  'automation-rules',
  'top-ads',
  'workspace-team',
  'ad-accounts',
  'products-plans',
  'payments-invoices',
  'mcp-credentials',
  'help-center',
]

test.describe('feature detail pages (SEO)', () => {
  for (const slug of FEATURE_SLUGS) {
    test(`/features/${slug} → 200`, async ({ request }) => {
      const res = await request.get(`/features/${slug}`)
      expect(res.status(), `/features/${slug} should render`).toBe(200)
    })
  }

  test('unknown feature slug → 404', async ({ request }) => {
    const res = await request.get('/features/this-slug-does-not-exist')
    expect(res.status()).toBe(404)
  })
})

test.describe('public marketplace', () => {
  for (const path of ['/marketplace', '/marketplace/leaderboard', '/marketplace/portfolio']) {
    test(`${path} → 200`, async ({ request }) => {
      const res = await request.get(path)
      expect(res.status(), `${path} should render`).toBe(200)
    })
  }
})
