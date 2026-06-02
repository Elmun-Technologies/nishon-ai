import { describe, expect, it } from 'vitest'
import { allocateBudget, formatUzs } from './budget-allocator'
import type { ChannelKey } from '@/lib/pre-auth-onboarding'

const ALL_CHANNELS: ChannelKey[] = [
  'instagram',
  'metaAds',
  'google',
  'yandex',
  'olx',
  'uzum',
  'telegram',
]

describe('allocateBudget', () => {
  it('always produces a percentage split that sums to exactly 100', () => {
    // Exercise every CJM × vertical combination — the re-normalization step
    // must guarantee 100 regardless of rounding.
    const cjms = ['awareness', 'consideration', 'conversion', 'retention'] as const
    const verticals = ['ecommerce', 'local', 'education', 'service', 'realestate', 'other'] as const
    for (const cjm of cjms) {
      for (const vertical of verticals) {
        const r = allocateBudget({ cjm, vertical, touchpoints: [], monthlyBudgetUzs: 5_000_000 })
        const sum = ALL_CHANNELS.reduce((s, k) => s + r.percent[k], 0)
        expect(sum, `${cjm}/${vertical} should sum to 100`).toBe(100)
      }
    }
  })

  it('splits the monthly budget across channels proportionally to percent', () => {
    const monthly = 10_000_000
    const r = allocateBudget({
      cjm: 'conversion',
      vertical: 'ecommerce',
      touchpoints: [],
      monthlyBudgetUzs: monthly,
    })
    for (const k of ALL_CHANNELS) {
      expect(r.uzs[k]).toBe(Math.round((r.percent[k] / 100) * monthly))
    }
    // Sum of per-channel UZS is within rounding of the monthly budget.
    const totalUzs = ALL_CHANNELS.reduce((s, k) => s + r.uzs[k], 0)
    expect(Math.abs(totalUzs - monthly)).toBeLessThanOrEqual(ALL_CHANNELS.length)
  })

  it('boosts a channel the user named as a touchpoint vs. when they did not', () => {
    const base = allocateBudget({
      cjm: 'awareness',
      vertical: 'other',
      touchpoints: [],
      monthlyBudgetUzs: 5_000_000,
    })
    const boosted = allocateBudget({
      cjm: 'awareness',
      vertical: 'other',
      touchpoints: ['telegram'],
      monthlyBudgetUzs: 5_000_000,
    })
    expect(boosted.percent.telegram).toBeGreaterThan(base.percent.telegram)
  })

  it('reflects the vertical multiplier — realestate leans on OLX', () => {
    const realestate = allocateBudget({
      cjm: 'conversion',
      vertical: 'realestate',
      touchpoints: [],
      monthlyBudgetUzs: 5_000_000,
    })
    const ecommerce = allocateBudget({
      cjm: 'conversion',
      vertical: 'ecommerce',
      touchpoints: [],
      monthlyBudgetUzs: 5_000_000,
    })
    // OLX multiplier for realestate (1.8) is far above ecommerce (0.9).
    expect(realestate.percent.olx).toBeGreaterThan(ecommerce.percent.olx)
  })

  it('computes a positive total reach estimate', () => {
    const r = allocateBudget({
      cjm: 'consideration',
      vertical: 'service',
      touchpoints: ['google'],
      monthlyBudgetUzs: 3_000_000,
    })
    expect(r.totalReach).toBeGreaterThan(0)
  })
})

describe('formatUzs', () => {
  it('formats millions and thousands compactly', () => {
    expect(formatUzs(5_000_000)).toContain('mln')
    expect(formatUzs(1_500_000)).toBe("1.5 mln so'm")
    expect(formatUzs(250_000)).toContain('k')
  })
})
