import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { regenerateAdCopy } from './regenerate-copy'

const OK_COPY = { headline: 'H', body: 'B', cta: 'C' }

describe('regenerateAdCopy', () => {
  const realFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn() as unknown as typeof fetch
  })
  afterEach(() => {
    global.fetch = realFetch
  })

  it('returns AI copy when the server responds ok', async () => {
    ;(global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ copy: OK_COPY, source: 'ai' }),
    } as Response)
    const res = await regenerateAdCopy({
      websiteUrl: 'https://example.com',
      goal: 'sales',
      stage: 'BOFU',
      lang: 'en',
    })
    expect(res.source).toBe('ai')
    expect(res.copy).toEqual(OK_COPY)
  })

  it('falls back to template on non-OK HTTP', async () => {
    ;(global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response)
    const res = await regenerateAdCopy({
      websiteUrl: '',
      goal: 'brand',
      stage: 'TOFU',
      lang: 'ru',
    })
    expect(res.source).toBe('template')
    expect(res.reason).toBe('http_500')
  })

  it('falls back on network error', async () => {
    ;(global.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('network down'),
    )
    const res = await regenerateAdCopy({
      websiteUrl: '',
      goal: 'sales',
      stage: 'MOFU',
      lang: 'uz',
    })
    expect(res.source).toBe('template')
    expect(res.reason).toBe('network down')
  })

  it('falls back when the payload is malformed', async () => {
    ;(global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ copy: { headline: 'only headline' }, source: 'ai' }),
    } as Response)
    const res = await regenerateAdCopy({
      websiteUrl: '',
      goal: 'sales',
      stage: 'BOFU',
      lang: 'en',
    })
    expect(res.source).toBe('template')
    expect(res.reason).toBe('malformed')
  })
})
