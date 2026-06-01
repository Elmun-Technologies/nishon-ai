import type { ChannelKey } from '@/lib/pre-auth-onboarding'

export type CjmStage =
  | 'awareness'      // Brand tanitish — yangi mahsulot/dukon
  | 'consideration'  // Qiziquvchilarni topish — leadlar
  | 'conversion'     // Sotuv — to'g'ridan-to'g'ri savdo
  | 'retention'      // Mavjud mijozlarni qaytarish

export type BusinessVertical =
  | 'ecommerce'      // Onlayn do'kon
  | 'local'          // Restoran, kafe, salon, kichik biznes
  | 'education'      // Kurs, ta'lim
  | 'service'        // B2B/B2C xizmatlar
  | 'realestate'     // Ko'chmas mulk
  | 'other'

export type GeoRegion = 'UZ' | 'KZ' | 'RU' | 'KG' | 'TJ' | 'OTHER'

export type CustomerAge = '18-24' | '25-34' | '35-44' | '45-54' | '55+'

export interface ConversationalOnboardingState {
  /** Conversation stage index (0-based) */
  stage: number
  /** Business vertical */
  vertical: BusinessVertical | ''
  /** Free-text business name */
  businessName: string
  /** CJM stage — the main goal */
  cjm: CjmStage | ''
  /** Geographic focus (multi-select) */
  geos: GeoRegion[]
  /** Customer age range (multi-select) */
  ageRanges: CustomerAge[]
  /** Where customers spend time (multi-select) */
  touchpoints: ChannelKey[]
  /** Monthly budget in UZS */
  monthlyBudgetUzs: number
  /** Per-channel allocation in percent (sum should be ~100) */
  allocation: Partial<Record<ChannelKey, number>>
  /** Telegram for notifications (optional) */
  telegram: string
  /** Has user reviewed and approved the allocation */
  allocationApproved: boolean
}

export const DEFAULT_STATE: ConversationalOnboardingState = {
  stage: 0,
  vertical: '',
  businessName: '',
  cjm: '',
  geos: ['UZ'],
  ageRanges: [],
  touchpoints: [],
  monthlyBudgetUzs: 5_000_000,
  allocation: {},
  telegram: '',
  allocationApproved: false,
}

export const STAGE_IDS = [
  'greeting',
  'businessName',
  'vertical',
  'cjm',
  'geoAge',
  'touchpoints',
  'budget',
  'allocation',
  'connect',
] as const

export type StageId = (typeof STAGE_IDS)[number]

export const CJM_LABELS: Record<CjmStage, { title: string; emoji: string; desc: string }> = {
  awareness: {
    title: 'Brand tanitish',
    emoji: '📢',
    desc: "Yangi mahsulot yoki do'kon — odamlar bilsin",
  },
  consideration: {
    title: 'Qiziquvchilarni topish',
    emoji: '🔍',
    desc: "Lead, ariza, qo'ng'iroq — keyin sotamiz",
  },
  conversion: {
    title: 'To\'g\'ridan-to\'g\'ri sotuv',
    emoji: '💰',
    desc: "Reklamadan to'g'ri xarid yoki buyurtma",
  },
  retention: {
    title: 'Mijozlarni qaytarish',
    emoji: '🔄',
    desc: "Mavjud mijozlar qaytib kelsin, lifetime value oshsin",
  },
}

export const VERTICAL_LABELS: Record<BusinessVertical, { title: string; emoji: string }> = {
  ecommerce: { title: "Onlayn do'kon", emoji: '🛍️' },
  local: { title: 'Lokal biznes', emoji: '📍' },
  education: { title: "Ta'lim / Kurs", emoji: '🎓' },
  service: { title: 'Xizmat', emoji: '💼' },
  realestate: { title: "Ko'chmas mulk", emoji: '🏠' },
  other: { title: 'Boshqa', emoji: '📦' },
}

export const CHANNEL_LABELS: Record<ChannelKey, { title: string; emoji: string; tag: string }> = {
  instagram: { title: 'Instagram', emoji: '📸', tag: 'Vizual' },
  metaAds: { title: 'Meta Ads (FB+IG)', emoji: 'ⓕ', tag: 'Reklama' },
  google: { title: 'Google Ads', emoji: 'G', tag: 'Qidiruv' },
  yandex: { title: 'Yandex Direct', emoji: 'Я', tag: 'UZ qidiruv' },
  olx: { title: 'OLX', emoji: '🏷️', tag: "E'lon" },
  uzum: { title: 'Uzum Market', emoji: '🛒', tag: 'Marketplace' },
  telegram: { title: 'Telegram Ads', emoji: '✈️', tag: 'Messenger' },
}
