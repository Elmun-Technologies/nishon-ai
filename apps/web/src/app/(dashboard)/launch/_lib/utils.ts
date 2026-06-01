export function parsePositiveNumber(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null
  const n = Number(String(v).replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : null
}

export function formatMoneyUsd(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

/**
 * Rough heuristic — not Meta's real audience API.
 * Each country has a ballpark adult population on Meta; we narrow by age band & gender.
 * Returns [low, high] reach estimate. Used purely as a directional hint.
 */
const COUNTRY_REACH_MILLIONS: Record<string, number> = {
  UZ: 12,
  KZ: 14,
  TJ: 5,
  TM: 3,
  RU: 75,
  US: 220,
}

export function estimateAudienceReach(opts: {
  location: string
  minAge: number
  maxAge: number
}): { low: number; high: number } | null {
  const base = COUNTRY_REACH_MILLIONS[opts.location]
  if (!base) return null
  const span = Math.max(1, Math.min(75, opts.maxAge) - Math.max(13, opts.minAge))
  // Treat 13→65 (52 years) as 100% of the population.
  const ageFraction = Math.max(0.05, Math.min(1, span / 52))
  const center = base * ageFraction * 1_000_000
  const low = Math.round(center * 0.7)
  const high = Math.round(center * 1.3)
  return { low, high }
}

export function formatAudienceReach(r: { low: number; high: number } | null): string {
  if (!r) return '—'
  return `${formatCompactInt(r.low)}–${formatCompactInt(r.high)}`
}

export function formatCompactInt(n: number): string {
  return new Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}
