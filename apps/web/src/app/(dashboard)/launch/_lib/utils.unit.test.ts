import { describe, expect, it } from 'vitest'
import {
  estimateAudienceReach,
  formatMoneyUsd,
  parsePositiveNumber,
} from './utils'

describe('parsePositiveNumber', () => {
  it('accepts positive numbers and comma decimals', () => {
    expect(parsePositiveNumber('50')).toBe(50)
    expect(parsePositiveNumber('12,5')).toBe(12.5)
    expect(parsePositiveNumber(20)).toBe(20)
  })

  it('rejects zero, negatives, and junk', () => {
    expect(parsePositiveNumber('0')).toBeNull()
    expect(parsePositiveNumber('-5')).toBeNull()
    expect(parsePositiveNumber('abc')).toBeNull()
    expect(parsePositiveNumber('')).toBeNull()
    expect(parsePositiveNumber(null)).toBeNull()
    expect(parsePositiveNumber(undefined)).toBeNull()
  })
})

describe('formatMoneyUsd', () => {
  it('renders a USD amount with no fraction digits', () => {
    const s = formatMoneyUsd(140)
    expect(s).toContain('140')
    expect(s).toMatch(/\$|USD/)
  })
})

describe('estimateAudienceReach', () => {
  it('returns a low<high band for a known country', () => {
    const r = estimateAudienceReach({ location: 'UZ', minAge: 18, maxAge: 45 })
    expect(r).not.toBeNull()
    expect(r!.low).toBeGreaterThan(0)
    expect(r!.high).toBeGreaterThan(r!.low)
  })

  it('grows with a wider age band', () => {
    const narrow = estimateAudienceReach({ location: 'UZ', minAge: 25, maxAge: 30 })
    const wide = estimateAudienceReach({ location: 'UZ', minAge: 18, maxAge: 65 })
    expect(wide!.high).toBeGreaterThan(narrow!.high)
  })

  it('returns null for an unknown country', () => {
    expect(estimateAudienceReach({ location: 'ZZ', minAge: 18, maxAge: 45 })).toBeNull()
  })
})
