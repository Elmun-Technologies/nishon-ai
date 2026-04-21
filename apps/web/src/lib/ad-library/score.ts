import type { AdLibraryRawAd, AdLibraryScoredAd } from '@/lib/ad-library/types'

/**
 * Scoring (Meta to‘liq bermaydi — proxy):
 * Longevity 40% · Variations 30% · Engagement 20% · Freshness 10%
 */
export function computeAdLibraryScore(ad: AdLibraryRawAd): Pick<AdLibraryScoredAd, 'score' | 'scoreParts' | 'reasons' | 'estimatedSpendUzs'> {
  const longevity = Math.min(40, (ad.daysActive / 30) * 40)
  const variations = Math.min(30, (ad.variationCount / 5) * 30)
  const engagement = Math.max(0, Math.min(1, ad.engagement01)) * 20
  const freshness = Math.min(10, (Math.max(0, 21 - ad.creativeAgeDays) / 21) * 10)

  const score = Math.round(Math.min(100, longevity + variations + engagement + freshness))
  const reasons: string[] = []
  if (ad.daysActive >= 20) reasons.push(`${ad.daysActive} kun active`)
  if (ad.variationCount >= 3) reasons.push(`${ad.variationCount} ta variant`)
  if (ad.engagement01 >= 0.55) reasons.push('publik engagement yuqori')
  if (ad.creativeAgeDays <= 7) reasons.push('yangi kreativ')
  if (reasons.length === 0) reasons.push('proxy ball')

  const daily = 80_000 + ad.daysActive * 1_200 + ad.variationCount * 15_000
  const estimatedSpendUzs = Math.round(daily * Math.min(ad.daysActive, 30))

  return {
    score,
    scoreParts: {
      longevity: Math.round(longevity * 10) / 10,
      variations: Math.round(variations * 10) / 10,
      engagement: Math.round(engagement * 10) / 10,
      freshness: Math.round(freshness * 10) / 10,
    },
    reasons,
    estimatedSpendUzs,
  }
}

export function scoreAd(ad: AdLibraryRawAd): AdLibraryScoredAd {
  const s = computeAdLibraryScore(ad)
  return { ...ad, ...s }
}
