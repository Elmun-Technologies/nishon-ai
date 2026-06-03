import { describe, expect, it } from 'vitest'
import { ValidationService, validators } from './validation'

describe('ValidationService.validateCampaignName', () => {
  const svc = new ValidationService()

  it('empty -> required-field error', () => {
    const r = svc.validateCampaignName('')
    expect(r.isValid).toBe(false)
    expect(r.errors).toContain('Campaign name is required')
  })

  it('too short -> length error, valid=false', () => {
    const r = svc.validateCampaignName('ab')
    expect(r.isValid).toBe(false)
    expect(r.errors.some((e) => e.includes('at least 3'))).toBe(true)
  })

  it('contains a slash -> invalid-character error', () => {
    const r = svc.validateCampaignName('Meta / promo')
    expect(r.isValid).toBe(false)
    expect(r.errors).toContain('Campaign name contains invalid characters')
  })

  it('valid name without platform prefix -> warning (not an error)', () => {
    const r = svc.validateCampaignName('Spring Sale 2026')
    expect(r.isValid).toBe(true)
    expect(r.warnings.length).toBeGreaterThan(0)
  })

  it('valid name with platform prefix -> no warning', () => {
    const r = svc.validateCampaignName('Meta - Spring Sale')
    expect(r.isValid).toBe(true)
    expect(r.warnings).toHaveLength(0)
  })
})

describe('ValidationService.validateBudget', () => {
  const svc = new ValidationService()

  it('zero/missing budget -> required error', () => {
    const r = svc.validateBudget({ amount: 0, currency: 'USD', type: 'daily' })
    expect(r.isValid).toBe(false)
    expect(r.errors).toContain('Budget amount is required')
  })

  it('above max -> exceed error', () => {
    const r = svc.validateBudget({
      amount: 200000,
      currency: 'USD',
      type: 'daily',
    })
    expect(r.isValid).toBe(false)
    expect(r.errors.some((e) => e.includes('cannot exceed'))).toBe(true)
  })

  it('within range but very small -> warning, still valid', () => {
    const r = svc.validateBudget({ amount: 5, currency: 'USD', type: 'daily' })
    expect(r.isValid).toBe(true)
    expect(r.warnings.length).toBeGreaterThan(0)
  })

  it('comfortable budget -> no errors, no warnings', () => {
    const r = svc.validateBudget({
      amount: 500,
      currency: 'USD',
      type: 'daily',
    })
    expect(r.isValid).toBe(true)
    expect(r.warnings).toHaveLength(0)
  })
})

describe('ValidationService.validateSchedule', () => {
  const svc = new ValidationService()

  it('missing endpoints -> required error', () => {
    const r = svc.validateSchedule({ startDate: '', endDate: '' })
    expect(r.isValid).toBe(false)
    expect(r.errors).toContain('Campaign schedule is required')
  })

  it('start in the past -> error', () => {
    const past = '2020-01-01'
    const future = '2099-01-01'
    const r = svc.validateSchedule({ startDate: past, endDate: future })
    expect(r.isValid).toBe(false)
    expect(r.errors).toContain('Start date cannot be in the past')
  })

  it('end-before-start -> error', () => {
    const start = new Date(Date.now() + 7 * 86_400_000).toISOString()
    const end = new Date(Date.now() + 2 * 86_400_000).toISOString()
    const r = svc.validateSchedule({ startDate: start, endDate: end })
    expect(r.isValid).toBe(false)
    expect(r.errors).toContain('End date must be after start date')
  })

  it('runs > 365 days -> warning, still valid', () => {
    const start = new Date(Date.now() + 1 * 86_400_000).toISOString()
    const end = new Date(Date.now() + 400 * 86_400_000).toISOString()
    const r = svc.validateSchedule({ startDate: start, endDate: end })
    expect(r.isValid).toBe(true)
    expect(r.warnings.length).toBeGreaterThan(0)
  })
})

describe('ValidationService.validateUTM', () => {
  const svc = new ValidationService()

  it('missing required field -> error per missing field', () => {
    const r = svc.validateUTM({
      source: '',
      medium: '',
      campaign: '',
      content: '',
      term: '',
    })
    expect(r.errors).toContain('UTM source is required')
    expect(r.errors).toContain('UTM medium is required')
    expect(r.errors).toContain('UTM campaign is required')
  })

  it('invalid characters -> per-field error', () => {
    const r = svc.validateUTM({
      source: 'goog le',
      medium: 'cpc',
      campaign: 'spring',
      content: '',
      term: '',
    })
    expect(r.errors.some((e) => e.startsWith('UTM source'))).toBe(true)
  })

  it('non-standard combo -> warning only, still valid', () => {
    const r = svc.validateUTM({
      source: 'tiktok',
      medium: 'organic',
      campaign: 'spring',
      content: '',
      term: '',
    })
    expect(r.isValid).toBe(true)
    expect(r.warnings.length).toBeGreaterThan(0)
  })
})

describe('ValidationService.validateCreative', () => {
  const svc = new ValidationService()

  it('headlines must exist', () => {
    const r = svc.validateCreative({
      headlines: [],
      descriptions: ['Desc'],
      cta: 'Learn More',
    })
    expect(r.errors).toContain('At least one headline is required')
  })

  it('headline > 30 chars -> error with index', () => {
    const long = 'x'.repeat(31)
    const r = svc.validateCreative({
      headlines: [long],
      descriptions: ['Desc'],
      cta: 'Learn More',
    })
    expect(r.errors.some((e) => /Headline 1 exceeds/.test(e))).toBe(true)
  })

  it('description > 90 chars -> error', () => {
    const long = 'y'.repeat(91)
    const r = svc.validateCreative({
      headlines: ['Head'],
      descriptions: [long],
      cta: 'Learn More',
    })
    expect(r.errors.some((e) => /Description 1 exceeds/.test(e))).toBe(true)
  })

  it('missing CTA -> warning only', () => {
    const r = svc.validateCreative({
      headlines: ['Head'],
      descriptions: ['Desc'],
      cta: '',
    })
    expect(r.isValid).toBe(true)
    expect(r.warnings.length).toBeGreaterThan(0)
  })
})

describe('ValidationService.validateKeywords', () => {
  const svc = new ValidationService()

  it('empty array -> warning, still valid (just less targeted)', () => {
    const r = svc.validateKeywords([])
    expect(r.isValid).toBe(true)
    expect(r.warnings.length).toBeGreaterThan(0)
  })

  it('1-char keyword -> error', () => {
    const r = svc.validateKeywords(['x'])
    expect(r.isValid).toBe(false)
    expect(r.errors.some((e) => /Keyword 1 is too short/.test(e))).toBe(true)
  })

  it('"free" keyword -> low-quality warning', () => {
    const r = svc.validateKeywords(['free shipping'])
    expect(r.isValid).toBe(true)
    expect(r.warnings.some((w) => /low-quality/.test(w))).toBe(true)
  })

  it('duplicates within 80% threshold -> diversity warning', () => {
    const r = svc.validateKeywords(['shoe', 'shoe', 'shoe', 'shoe', 'boot'])
    expect(r.warnings.some((w) => /diverse/i.test(w))).toBe(true)
  })
})

describe('ValidationService.validateGeoTargeting', () => {
  const svc = new ValidationService()

  it('empty list -> warning, still valid', () => {
    const r = svc.validateGeoTargeting([])
    expect(r.isValid).toBe(true)
    expect(r.warnings.length).toBeGreaterThan(0)
  })

  it('too-short location -> error', () => {
    const r = svc.validateGeoTargeting(['A'])
    expect(r.errors.some((e) => /Location 1 is too short/.test(e))).toBe(true)
  })

  it('very-specific location -> over-specific warning', () => {
    const r = svc.validateGeoTargeting([
      'Tashkent City Yunusabad District Sector 4 Block 12',
    ])
    expect(r.warnings.length).toBeGreaterThan(0)
  })
})

describe('ValidationService.getValidationSummary', () => {
  const svc = new ValidationService()

  it('clean result -> all-passed message', () => {
    const out = svc.getValidationSummary({
      isValid: true,
      errors: [],
      warnings: [],
    })
    expect(out).toContain('passed')
  })

  it('errors + warnings -> both counts surfaced', () => {
    const out = svc.getValidationSummary({
      isValid: false,
      errors: ['a', 'b'],
      warnings: ['w'],
    })
    expect(out).toContain('2 error')
    expect(out).toContain('1 warning')
  })
})

describe('validators (utility helpers)', () => {
  it('isEmail accepts plausible addresses and rejects garbage', () => {
    expect(validators.isEmail('alice@example.com')).toBe(true)
    expect(validators.isEmail('not-an-email')).toBe(false)
    expect(validators.isEmail('a@b')).toBe(false)
  })

  it('isURL is true for full URLs and false for bare strings', () => {
    expect(validators.isURL('https://example.com/path')).toBe(true)
    expect(validators.isURL('example.com')).toBe(false)
    expect(validators.isURL('')).toBe(false)
  })

  it('isPositiveNumber requires a strictly-positive number', () => {
    expect(validators.isPositiveNumber(1)).toBe(true)
    expect(validators.isPositiveNumber(0)).toBe(false)
    expect(validators.isPositiveNumber(-1)).toBe(false)
    expect(validators.isPositiveNumber(NaN)).toBe(false)
  })

  it('isInRange is inclusive on both ends', () => {
    expect(validators.isInRange(5, 1, 10)).toBe(true)
    expect(validators.isInRange(1, 1, 10)).toBe(true)
    expect(validators.isInRange(10, 1, 10)).toBe(true)
    expect(validators.isInRange(11, 1, 10)).toBe(false)
  })

  it('hasRequiredFields treats undefined/null/empty as missing', () => {
    expect(
      validators.hasRequiredFields({ a: 1, b: 'x' }, ['a', 'b']),
    ).toBe(true)
    expect(validators.hasRequiredFields({ a: 1, b: '' }, ['a', 'b'])).toBe(
      false,
    )
    expect(
      validators.hasRequiredFields({ a: 1, b: null }, ['a', 'b']),
    ).toBe(false)
    expect(
      validators.hasRequiredFields({ a: 1 }, ['a', 'b']),
    ).toBe(false)
  })
})

describe('ValidationService.validateCampaign — aggregate', () => {
  it('rolls up errors + warnings from every sub-rule', () => {
    const svc = new ValidationService()
    const out = svc.validateCampaign({
      name: 'ab', // too short
      budget: { amount: 0, currency: 'USD', type: 'daily' }, // required
      schedule: { startDate: '', endDate: '' }, // required
      utm: {
        source: '',
        medium: '',
        campaign: '',
        content: '',
        term: '',
      },
      creative: { headlines: [], descriptions: [], cta: '' },
      adGroup: {
        keywords: { phrases: [] },
        geoTargeting: { locations: [] },
      },
    })
    expect(out.isValid).toBe(false)
    expect(out.errors.length).toBeGreaterThan(3)
  })
})
