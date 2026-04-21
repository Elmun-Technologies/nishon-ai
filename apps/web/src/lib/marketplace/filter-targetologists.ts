import type { AdPlatform, MarketplaceFilters, TargetologistProfile } from './types'
import { accountHealthOk, passesRoasConsistency } from './scoring'

function spendInBudget(totalSpend: number, band: string): boolean {
  if (!band) return true
  if (band === '0-1k') return totalSpend <= 1000
  if (band === '1-5k') return totalSpend > 1000 && totalSpend <= 5000
  if (band === '5k+') return totalSpend > 5000
  return true
}

export function filterTargetologists(
  list: TargetologistProfile[],
  f: MarketplaceFilters,
  smartPatch: Partial<MarketplaceFilters>,
): TargetologistProfile[] {
  const F: MarketplaceFilters = { ...f, ...smartPatch }

  return list.filter((t) => {
    if (F.verifiedOnly && !t.verified) return false
    if (F.consistencyOnly && !passesRoasConsistency(t.performance)) return false
    if (F.healthyAccountOnly && !accountHealthOk(t)) return false

    if (F.niche && !t.niche.some((n) => n.toLowerCase().includes(F.niche.toLowerCase()))) return false

    if (F.platform && !t.platforms.includes(F.platform as AdPlatform)) return false

    if (!spendInBudget(t.totalSpend, F.budget)) return false

    if (F.language && !t.languages.includes(F.language)) return false

    if (F.location) {
      const fl = F.location.toLowerCase()
      const tl = t.location.toLowerCase()
      if (fl === 'remote') {
        if (tl !== 'remote') return false
      } else if (!tl.includes(fl)) {
        return false
      }
    }

    return true
  })
}
