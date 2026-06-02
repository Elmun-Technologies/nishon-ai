import { defineConfig } from '@playwright/test'

/**
 * Smoke tests run against a production build (`next start`) and use Playwright's
 * `request` API only — no browser binary required. That keeps them reliable in
 * CI (no Chromium download) while still exercising real SSR output, status
 * codes, and middleware redirects.
 */
const PORT = Number(process.env.SMOKE_PORT ?? 3100)
const BASE_URL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
  },
  webServer: {
    command: `pnpm start -p ${PORT}`,
    url: BASE_URL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      // Public pages render without a live backend; give the client a dummy
      // API base so nothing throws at module load.
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:9999',
    },
  },
})
