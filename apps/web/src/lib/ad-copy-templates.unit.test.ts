import { describe, expect, it } from 'vitest'
import { adCopyFor, detectVertical } from './ad-copy-templates'
import type { FunnelStage } from './funnel-allocator'

const STAGES: FunnelStage[] = ['TOFU', 'MOFU', 'BOFU']

describe('detectVertical', () => {
  it('detects apparel from clothing-ish links', () => {
    expect(detectVertical('https://kiyim-do'.concat('kon.uz'))).toBe('apparel')
    expect(detectVertical('https://myfashionshop.com')).toBe('apparel')
  })

  it('detects education', () => {
    expect(detectVertical('https://englishcourse.uz')).toBe('education')
    expect(detectVertical('t.me/ielts_academy')).toBe('education')
  })

  it('detects food', () => {
    expect(detectVertical('https://best-pizza.uz')).toBe('food')
    expect(detectVertical('https://tashkent-cafe.com')).toBe('food')
  })

  it('falls back to generic for unknown input', () => {
    expect(detectVertical('https://example.com')).toBe('generic')
    expect(detectVertical('')).toBe('generic')
  })

  it('is case-insensitive', () => {
    expect(detectVertical('HTTPS://FASHION-STORE.UZ')).toBe('apparel')
  })
})

describe('adCopyFor', () => {
  it('returns distinct copy for each funnel stage', () => {
    const headlines = STAGES.map((s) => adCopyFor('apparel', s, 'uz').headline)
    expect(new Set(headlines).size).toBe(3)
  })

  it('provides headline, body and cta in every locale', () => {
    for (const lang of ['uz', 'ru', 'en'] as const) {
      for (const stage of STAGES) {
        const copy = adCopyFor('food', stage, lang)
        expect(copy.headline.length).toBeGreaterThan(0)
        expect(copy.body.length).toBeGreaterThan(0)
        expect(copy.cta.length).toBeGreaterThan(0)
      }
    }
  })

  it('falls back to generic copy for an unknown vertical', () => {
    // @ts-expect-error — exercising the runtime fallback path
    const copy = adCopyFor('spaceships', 'TOFU', 'en')
    expect(copy.headline).toBe(adCopyFor('generic', 'TOFU', 'en').headline)
  })

  it('defaults to uz when the language is omitted', () => {
    expect(adCopyFor('education', 'BOFU')).toEqual(
      adCopyFor('education', 'BOFU', 'uz'),
    )
  })
})
