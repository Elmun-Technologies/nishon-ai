import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Unit tests for pure logic in the per-route `_lib` folders (budget
// allocator, launch utils, etc.). Node environment — no DOM, no browser.
// Playwright e2e stays separate; this only covers framework-free functions.
// `@/` is mapped manually to src/ to avoid an ESM-only config dependency.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.unit.test.ts'],
    passWithNoTests: false,
  },
})
