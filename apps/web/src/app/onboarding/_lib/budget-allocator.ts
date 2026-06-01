import type { ChannelKey } from '@/lib/pre-auth-onboarding'
import type { BusinessVertical, CjmStage } from './types'

/**
 * Per-channel base weights (sum to 100) by CJM stage.
 * These reflect where a typical Uzbek SMB should put advertising spend
 * for each stage of the customer journey.
 */
const CJM_WEIGHTS: Record<CjmStage, Record<ChannelKey, number>> = {
  awareness: {
    instagram: 22,
    metaAds: 28,
    google: 8,
    yandex: 12,
    olx: 5,
    uzum: 5,
    telegram: 20,
  },
  consideration: {
    instagram: 14,
    metaAds: 30,
    google: 22,
    yandex: 10,
    olx: 6,
    uzum: 6,
    telegram: 12,
  },
  conversion: {
    instagram: 8,
    metaAds: 28,
    google: 28,
    yandex: 8,
    olx: 8,
    uzum: 12,
    telegram: 8,
  },
  retention: {
    instagram: 18,
    metaAds: 18,
    google: 8,
    yandex: 4,
    olx: 2,
    uzum: 8,
    telegram: 42,
  },
}

/**
 * Vertical multipliers — boost or dampen channels per business type.
 * Multiplied with base CJM weights, then normalized.
 */
const VERTICAL_MULTIPLIERS: Record<BusinessVertical, Partial<Record<ChannelKey, number>>> = {
  ecommerce: { metaAds: 1.2, google: 1.2, uzum: 1.6, instagram: 1.1, olx: 0.9 },
  local: { instagram: 1.4, metaAds: 1.2, telegram: 1.2, google: 0.9, yandex: 1.1, uzum: 0.3 },
  education: { google: 1.4, metaAds: 1.2, telegram: 1.3, instagram: 1.1, uzum: 0.4, olx: 0.4 },
  service: { google: 1.5, metaAds: 1.1, yandex: 1.2, olx: 1.3, uzum: 0.3 },
  realestate: { olx: 1.8, google: 1.3, metaAds: 1.1, yandex: 1.1, instagram: 1.1, uzum: 0.2 },
  other: {},
}

/** Touchpoint boost — if user said customers spend time on X, boost X by 30%. */
const TOUCHPOINT_BOOST = 1.3

/** Cost per 1000 impressions estimate, in UZS — used for reach estimate only. */
const CPM_UZS: Record<ChannelKey, number> = {
  instagram: 12_000,
  metaAds: 15_000,
  google: 22_000,
  yandex: 18_000,
  olx: 9_000,
  uzum: 28_000,
  telegram: 6_000,
}

/** Per-channel rationale shown to user. */
export const CHANNEL_RATIONALE: Record<CjmStage, Partial<Record<ChannelKey, string>>> = {
  awareness: {
    instagram: "Vizual kontent — yangi brendni eslatish uchun #1",
    metaAds: "FB+IG: katta reach, demografiya bo'yicha aniq targeting",
    telegram: "O'zbekistonda eng aktiv kanal — yangi auditoriyaga yetish",
    yandex: "UZ qidiruvda brand-keyword'lar uchun",
    google: 'YouTube + Display reklamasi',
  },
  consideration: {
    metaAds: 'Lead-form va Instant Experience — past CPL',
    google: 'Qidiruvda niyati bor mijozlar — yuqori sifatli leadlar',
    telegram: 'Bot orqali to\'g\'ridan-to\'g\'ri aloqa',
    instagram: "DM va Story sticker'lar bilan",
    yandex: 'Lokal niyatli mijozlar uchun',
  },
  conversion: {
    metaAds: 'Catalog Sales + DPA — eng konvertor format',
    google: 'Search + Shopping — "sotib olish" niyati bor mijozlar',
    uzum: "Marketplace'da sotuv — to'g'ridan-to'g'ri checkout",
    olx: "E'lon orqali to'g'ridan-to'g'ri kontakt",
    instagram: 'Shoppable posts + Reels',
    telegram: 'Discount kod bilan qaytarish',
  },
  retention: {
    telegram: "Mavjud mijozlar uchun #1 — push, kanal, bot",
    instagram: 'Retargeting + Story update',
    metaAds: "Custom audience'larga remarketing",
    uzum: "Qaytar takliflar (returning customer's)",
    google: 'YouTube remarketing',
  },
}

export interface AllocationResult {
  /** Percentage allocation per channel (sums to 100) */
  percent: Record<ChannelKey, number>
  /** UZS allocation per channel */
  uzs: Record<ChannelKey, number>
  /** Estimated impressions reach per channel */
  reach: Record<ChannelKey, number>
  /** Total estimated reach */
  totalReach: number
}

/**
 * Compute budget allocation based on CJM stage, vertical, and customer touchpoints.
 * Returns percentage split (sums to 100) and absolute UZS amount per channel.
 */
export function allocateBudget(opts: {
  cjm: CjmStage
  vertical: BusinessVertical
  touchpoints: ChannelKey[]
  monthlyBudgetUzs: number
}): AllocationResult {
  const base = CJM_WEIGHTS[opts.cjm]
  const verticalMul = VERTICAL_MULTIPLIERS[opts.vertical] ?? {}
  const touchpointSet = new Set(opts.touchpoints)

  // Apply vertical multipliers and touchpoint boost
  const raw: Record<ChannelKey, number> = { ...base }
  ;(Object.keys(raw) as ChannelKey[]).forEach((k) => {
    const vMul = verticalMul[k] ?? 1
    const tMul = touchpointSet.has(k) ? TOUCHPOINT_BOOST : 1
    raw[k] = base[k] * vMul * tMul
  })

  // Normalize to 100
  const total = (Object.values(raw) as number[]).reduce((a, b) => a + b, 0)
  const percent = Object.fromEntries(
    (Object.entries(raw) as [ChannelKey, number][]).map(([k, v]) => [
      k,
      Math.round((v / total) * 100),
    ]),
  ) as Record<ChannelKey, number>

  // Re-normalize to exactly 100 by fixing the largest channel
  const sum = (Object.values(percent) as number[]).reduce((a, b) => a + b, 0)
  if (sum !== 100) {
    const largest = (Object.entries(percent) as [ChannelKey, number][]).sort(
      (a, b) => b[1] - a[1],
    )[0][0] as ChannelKey
    percent[largest] += 100 - sum
  }

  // UZS amount per channel
  const uzs = Object.fromEntries(
    (Object.entries(percent) as [ChannelKey, number][]).map(([k, p]) => [
      k,
      Math.round((p / 100) * opts.monthlyBudgetUzs),
    ]),
  ) as Record<ChannelKey, number>

  // Estimated impressions reach
  const reach = Object.fromEntries(
    (Object.entries(uzs) as [ChannelKey, number][]).map(([k, amount]) => [
      k,
      Math.round((amount / CPM_UZS[k]) * 1000),
    ]),
  ) as Record<ChannelKey, number>

  const totalReach = (Object.values(reach) as number[]).reduce((a, b) => a + b, 0)

  return { percent, uzs, reach, totalReach }
}

/** Format UZS as compact string for chat bubble. */
export function formatUzs(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)} mln so'm`
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)}k so'm`
  return `${n} so'm`
}

export function formatUzsFull(n: number): string {
  return new Intl.NumberFormat('uz-UZ').format(n) + " so'm"
}

export function formatCompactInt(n: number): string {
  return new Intl.NumberFormat('uz-UZ', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}
