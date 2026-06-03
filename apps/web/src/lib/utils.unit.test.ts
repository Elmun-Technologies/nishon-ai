import { describe, expect, it } from 'vitest'
import {
  cn,
  formatCurrency,
  formatNumber,
  formatPercent,
  getPlatformColor,
  getPlatformEmoji,
  timeAgo,
} from './utils'

describe('cn', () => {
  it('joins truthy class names with spaces', () => {
    expect(cn('a', 'b')).toBe('a b')
  })
  it('drops falsy entries', () => {
    expect(cn('a', false, undefined, null, '', 'b')).toBe('a b')
  })
})

describe('formatCurrency', () => {
  it('renders a USD value with two fraction digits', () => {
    const s = formatCurrency(1234.5)
    // Tolerant: locale spacing/grouping differs; just check the meaningful bits.
    expect(s).toMatch(/1,234\.50|1234\.50/)
    expect(s).toContain('$')
  })
  it('returns em-dash for null/undefined', () => {
    expect(formatCurrency(null)).toBe('—')
    expect(formatCurrency(undefined)).toBe('—')
  })
})

describe('formatNumber', () => {
  it('compresses millions and thousands', () => {
    expect(formatNumber(2_500_000)).toBe('2.5M')
    expect(formatNumber(1_500)).toBe('1.5K')
    expect(formatNumber(42)).toBe('42')
  })
  it('treats null/undefined as 0', () => {
    expect(formatNumber(null)).toBe('0')
    expect(formatNumber(undefined)).toBe('0')
  })
})

describe('formatPercent', () => {
  it('multiplies a 0–1 fraction by 100 with two decimals', () => {
    expect(formatPercent(0.1234)).toBe('12.34%')
    expect(formatPercent(0)).toBe('0.00%')
  })
  it('returns 0% for null/undefined', () => {
    expect(formatPercent(null)).toBe('0%')
    expect(formatPercent(undefined)).toBe('0%')
  })
})

describe('timeAgo', () => {
  it('returns em-dash for null/undefined and invalid dates', () => {
    expect(timeAgo(null)).toBe('—')
    expect(timeAgo(undefined)).toBe('—')
    expect(timeAgo('not-a-date')).toBe('—')
  })
  it('says "just now" for the present', () => {
    expect(timeAgo(new Date())).toBe('just now')
  })
  it('reports minutes, hours and days', () => {
    const now = Date.now()
    expect(timeAgo(new Date(now - 5 * 60_000))).toBe('5m ago')
    expect(timeAgo(new Date(now - 3 * 3_600_000))).toBe('3h ago')
    expect(timeAgo(new Date(now - 2 * 86_400_000))).toBe('2d ago')
  })
})

describe('platform helpers', () => {
  it('returns brand colors for known platforms and a default for unknown', () => {
    expect(getPlatformColor('meta')).toBe('#1877F2')
    expect(getPlatformColor('google')).toBe('#4285F4')
    expect(getPlatformColor('unknown')).toBe('#7C3AED')
  })
  it('returns brand emojis with a default fallback', () => {
    expect(getPlatformEmoji('meta')).toBe('📘')
    expect(getPlatformEmoji('telegram')).toBe('✈️')
    expect(getPlatformEmoji('something-new')).toBe('📢')
  })
})
