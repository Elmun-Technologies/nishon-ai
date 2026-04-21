import type { StoreListing } from '../types'

/** MVP: do‘kon ro‘yxati (keyin API). */
export const DEMO_STORE_LISTINGS: StoreListing[] = [
  {
    id: 'ag_kiyim_1',
    name: 'Mening kiyim strategiyam',
    author: 'demo_targetolog',
    vertical: 'ecommerce',
    priceMonthlyUsd: 19,
    pricePerActionUsd: 0.05,
    testDaysRemaining: 2,
    status: 'testing',
  },
  {
    id: 'ag_kurs_1',
    name: 'Lead → sotuv (kurs)',
    author: 'demo_targetolog',
    vertical: 'course',
    priceMonthlyUsd: 29,
    status: 'published',
  },
]

export const DEFAULT_REVENUE_SPLIT = { targetologistPct: 70, platformPct: 30 } as const
