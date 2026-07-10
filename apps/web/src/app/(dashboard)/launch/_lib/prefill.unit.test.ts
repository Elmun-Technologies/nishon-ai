import { describe, it, expect } from 'vitest'
import { INITIAL_META_DATA, metaDefaultsFromStrategy } from './prefill'

describe('metaDefaultsFromStrategy', () => {
  it('returns the blank baseline when there is no strategy', () => {
    const { data, prefilled } = metaDefaultsFromStrategy(null)
    expect(prefilled).toBe(false)
    expect(data).toEqual(INITIAL_META_DATA)
  })

  it('returns the baseline when launchDefaults is missing', () => {
    const { data, prefilled } = metaDefaultsFromStrategy({ source: 'onboarding' })
    expect(prefilled).toBe(false)
    expect(data).toEqual(INITIAL_META_DATA)
  })

  it('prefills objective, geo, age and daily budget from launchDefaults', () => {
    const { data, prefilled } = metaDefaultsFromStrategy({
      launchDefaults: {
        objective: 'sales',
        primaryGeo: 'KZ',
        ageMin: 25,
        ageMax: 44,
        dailyBudgetUsd: 32,
      },
    })
    expect(prefilled).toBe(true)
    expect(data.objective).toBe('sales')
    expect(data.location).toBe('KZ')
    expect(data.minAge).toBe(25)
    expect(data.maxAge).toBe(44)
    expect(data.dailyBudget).toBe('32')
  })

  it('ignores an unknown objective but still prefills the rest', () => {
    const { data, prefilled } = metaDefaultsFromStrategy({
      launchDefaults: { objective: 'nonsense', dailyBudgetUsd: 20 },
    })
    expect(prefilled).toBe(true)
    expect(data.objective).toBe('')
    expect(data.dailyBudget).toBe('20')
  })

  it('clamps ages into Meta bounds and falls back when the range is inverted', () => {
    const { data } = metaDefaultsFromStrategy({
      launchDefaults: { ageMin: 5, ageMax: 200 },
    })
    // min clamps up to 13, max clamps down to 65
    expect(data.minAge).toBe(13)
    expect(data.maxAge).toBe(65)

    const inverted = metaDefaultsFromStrategy({
      launchDefaults: { ageMin: 50, ageMax: 30 },
    })
    // inverted range → keep the baseline ages
    expect(inverted.data.minAge).toBe(INITIAL_META_DATA.minAge)
    expect(inverted.data.maxAge).toBe(INITIAL_META_DATA.maxAge)
  })

  it('rounds a fractional daily budget and rejects non-positive values', () => {
    expect(
      metaDefaultsFromStrategy({ launchDefaults: { dailyBudgetUsd: 18.7 } }).data.dailyBudget,
    ).toBe('19')
    expect(
      metaDefaultsFromStrategy({ launchDefaults: { dailyBudgetUsd: 0 } }).data.dailyBudget,
    ).toBe(INITIAL_META_DATA.dailyBudget)
  })
})
