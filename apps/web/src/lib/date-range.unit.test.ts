import { describe, expect, it } from 'vitest'
import { daysBetweenInclusive } from './date-range'

describe('daysBetweenInclusive', () => {
  it('returns null when either bound is missing', () => {
    expect(daysBetweenInclusive('', '2026-01-10')).toBeNull()
    expect(daysBetweenInclusive('2026-01-01', '')).toBeNull()
  })

  it('returns null for unparseable input', () => {
    expect(daysBetweenInclusive('not-a-date', '2026-01-01')).toBeNull()
  })

  it('returns null when end precedes start', () => {
    expect(daysBetweenInclusive('2026-01-10', '2026-01-01')).toBeNull()
  })

  it('same day -> 1 (inclusive on both ends)', () => {
    expect(daysBetweenInclusive('2026-01-01', '2026-01-01')).toBe(1)
  })

  it('10-day inclusive window', () => {
    // Jan 1 ... Jan 10 inclusive = 10 days.
    expect(daysBetweenInclusive('2026-01-01', '2026-01-10')).toBe(10)
  })

  it('caps at default maxDays (365)', () => {
    expect(daysBetweenInclusive('2026-01-01', '2099-12-31')).toBe(365)
  })

  it('respects a custom cap', () => {
    expect(daysBetweenInclusive('2026-01-01', '2026-12-31', 30)).toBe(30)
  })
})
