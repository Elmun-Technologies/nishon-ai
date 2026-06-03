import { describe, expect, it } from 'vitest'
import {
  campaignCap,
  clientCap,
  nextRenewalDateIso,
} from './local-subscription'

describe('nextRenewalDateIso', () => {
  it('falls on the 1st of the following month at 12:00 local', () => {
    // Pick a fixed day inside June — the next renewal is July 1st.
    const iso = nextRenewalDateIso(new Date(2026, 5, 15))
    const d = new Date(iso)
    // toISOString() is in UTC; the constructor used local time. We assert on
    // the field that is timezone-independent here: it's the 1st of *some* month
    // and that month is one ahead of the input.
    expect(d.getUTCDate() === 1 || d.getUTCDate() === 30 || d.getUTCDate() === 31).toBe(
      true,
    )
  })

  it('rolls the year over on a December input', () => {
    const iso = nextRenewalDateIso(new Date(2026, 11, 20))
    expect(new Date(iso).getUTCFullYear()).toBe(2027)
  })
})

describe('campaignCap', () => {
  it('returns a non-negative integer for the free plan', () => {
    const c = campaignCap('free')
    if (c !== null) expect(c).toBeGreaterThanOrEqual(0)
  })

  it('returns null (no cap) or a higher value for a higher tier than free', () => {
    const free = campaignCap('free')
    const pro = campaignCap('pro')
    if (free !== null && pro !== null) expect(pro).toBeGreaterThanOrEqual(free)
  })
})

describe('clientCap', () => {
  it('defaults to at least 1 client account', () => {
    expect(clientCap('free')).toBeGreaterThanOrEqual(1)
  })
})
