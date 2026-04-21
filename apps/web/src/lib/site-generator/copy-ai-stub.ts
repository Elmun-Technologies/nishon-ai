import type { OnboardingBriefInput } from './types'

/** Keyinroq LLM bilan almashtirish — hozircha qoidalar asosida UZ sotuv matni. */
export function buildFashionHeadline(input: OnboardingBriefInput): string {
  const p = input.productTitle.trim()
  const u = input.utp.trim()
  if (u.toLowerCase().includes('yetkaz') || u.toLowerCase().includes('ertaga')) {
    return `${p} — ertaga eshigingizda. Oyoq og'rimaydi, kun bo'yi yengil.`
  }
  return `${p} — 12 soat kiyib yuring, oyoq og'rimaydi. ${u ? u + '.' : ''}`.trim()
}

export function buildFashionBenefits(input: OnboardingBriefInput): string[] {
  return [
    input.utp ? `UTP: ${input.utp}` : "Tez yetkazib berish va shaffof narx",
    `${input.audienceSummary || 'Mijozlarimiz'} uchun qulay to'lov: Click / Payme`,
    "O'zbekiston bo'ylab kafolatli aloqa — Telegram orqali buyurtma",
  ]
}

export function buildCourseHeadline(input: OnboardingBriefInput): string {
  return `${input.productTitle.trim()} — 0 dan boshlab, amaliy natijaga. ${input.utp}`.trim()
}

export function buildCourseBenefits(input: OnboardingBriefInput): string[] {
  return [
    "Modullar tartibli: nazariya → amaliyot → tekshiruv",
    "Mentor feedback va chatda savollar",
    input.utp ? `Ajralib turish: ${input.utp}` : "Sertifikat va portfolio uchun loyiha",
  ]
}

export function formatPriceUzs(n: number): string {
  try {
    return new Intl.NumberFormat('uz-UZ').format(Math.round(n)) + " so'm"
  } catch {
    return `${Math.round(n)} so'm`
  }
}
