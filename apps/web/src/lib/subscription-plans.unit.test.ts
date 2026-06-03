import { describe, expect, it } from 'vitest'
import {
  SUBSCRIPTION_PLANS,
  formatUzs,
  getPlan,
  uzsToPaymeTiyin,
} from './subscription-plans'

describe('SUBSCRIPTION_PLANS catalog', () => {
  it('has the four expected tiers in price-ascending order', () => {
    const ids = SUBSCRIPTION_PLANS.map((p) => p.id)
    expect(ids).toEqual(['free', 'starter', 'pro', 'agency'])

    const prices = SUBSCRIPTION_PLANS.map((p) => p.priceUzs)
    expect(prices).toEqual([...prices].sort((a, b) => a - b))
  })

  it('Free has campaign cap 1 and 7-day retention', () => {
    const free = getPlan('free')!
    expect(free.limits.maxCampaigns).toBe(1)
    expect(free.limits.dataRetentionDays).toBe(7)
  })

  it('Pro is uncapped campaigns and uncapped retention', () => {
    const pro = getPlan('pro')!
    expect(pro.limits.maxCampaigns).toBeNull()
    expect(pro.limits.dataRetentionDays).toBeNull()
    expect(pro.popular).toBe(true)
  })

  it('Agency allows 10 client accounts', () => {
    const agency = getPlan('agency')!
    expect(agency.limits.maxClientAccounts).toBe(10)
  })
})

describe('getPlan', () => {
  it('returns undefined for an unknown id (instead of throwing)', () => {
    expect(getPlan('not-a-tier')).toBeUndefined()
  })
})

describe('uzsToPaymeTiyin', () => {
  it('1 UZS -> 100 tiyin (Payme merchant API contract)', () => {
    expect(uzsToPaymeTiyin(1)).toBe(100)
  })

  it('199_000 UZS (Starter) -> 19_900_000 tiyin', () => {
    expect(uzsToPaymeTiyin(199_000)).toBe(19_900_000)
  })

  it('rounds to the nearest integer tiyin (Payme expects an int)', () => {
    // 1.5 UZS = 150 tiyin exactly; 1.234 UZS rounds to 123 tiyin
    // (Math.round(123.4)).
    expect(uzsToPaymeTiyin(1.5)).toBe(150)
    expect(uzsToPaymeTiyin(1.234)).toBe(123)
    expect(Number.isInteger(uzsToPaymeTiyin(99.999))).toBe(true)
  })
})

describe('formatUzs', () => {
  it("appends \" so'm\" with Uzbek locale grouping", () => {
    const out = formatUzs(199_000)
    expect(out.endsWith(" so'm")).toBe(true)
    expect(out.replace(/\D/g, '')).toBe('199000')
  })

  it('formats zero', () => {
    expect(formatUzs(0).endsWith(" so'm")).toBe(true)
  })
})
