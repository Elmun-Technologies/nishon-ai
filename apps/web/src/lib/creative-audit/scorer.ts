import type {
  AuditCriterionKey,
  AuditIssue,
  AuditOnboardingContext,
  CreativeAuditResult,
  CriterionScore,
  HumanAuditOverrides,
  IntendedPlacement,
  ScoreBandKey,
} from './types'
import { DEFAULT_AUDIT_WEIGHTS } from './types'
import { bestBrandColorMatch } from './brand-check'

export interface VisionScoresInput {
  messageClarity?: number
  brandFitGuess?: number
  audienceFitGuess?: number
  visualQualityGuess?: number
  ctaVisible?: boolean
  estimatedTextPercentOfImage?: number
  dominantHexColors?: string[]
}

export interface TechnicalSignals {
  width: number
  height: number
  /** Vision / OCR taxmini (0–1) */
  textPercentApprox?: number
  metaTextRatioMax?: number
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

function aspectLabel(w: number, h: number): string {
  const g = gcd(w, h)
  return `${w / g}:${h / g}`
}

function expectedRatio(placement: IntendedPlacement): { w: number; h: number; label: string } | null {
  switch (placement) {
    case 'feed_square':
      return { w: 1, h: 1, label: '1:1' }
    case 'feed_portrait':
      return { w: 4, h: 5, label: '4:5' }
    case 'story':
      return { w: 9, h: 16, label: '9:16' }
    case 'link_preview':
      return { w: 1200, h: 628, label: '1200:628' }
    default:
      return null
  }
}

function platformFitScore(
  w: number,
  h: number,
  placement: IntendedPlacement | undefined,
): { score: number; detail: string } {
  if (!placement || placement === 'unknown') {
    return { score: 75, detail: 'Joylashuv tanlanmagan — umumiy nisbat tekshiruvi.' }
  }
  const exp = expectedRatio(placement)
  if (!exp) return { score: 70, detail: '' }
  const got = w / h
  const want = exp.w / exp.h
  const delta = Math.abs(got - want) / want
  if (delta < 0.04) return { score: 95, detail: `${aspectLabel(w, h)} — ${exp.label} ga mos.` }
  if (delta < 0.12) return { score: 72, detail: `${aspectLabel(w, h)} — ${exp.label} dan biroz chetga.` }
  return { score: 42, detail: `${aspectLabel(w, h)} yuklangan, lekin ${exp.label} kutilgan edi.` }
}

function technicalScore(tech: TechnicalSignals): { score: number; issues: AuditIssue[] } {
  const issues: AuditIssue[] = []
  let s = 85
  const minSide = Math.min(tech.width, tech.height)
  if (minSide < 600) {
    s -= 25
    issues.push({ severity: 'warning', message: `Ruxsat etilganidan kichik: ${tech.width}×${tech.height}px` })
  }
  const max = Math.max(tech.width, tech.height)
  if (max > 4096) {
    s -= 10
    issues.push({ severity: 'warning', message: 'Juda katta piksel — platforma compress qiladi.' })
  }
  const ratio = tech.metaTextRatioMax ?? 0.2
  const textPct = tech.textPercentApprox ?? 0.16
  if (textPct > ratio) {
    s -= Math.min(28, Math.round((textPct - ratio) * 200))
    issues.push({
      severity: 'warning',
      message: `Matn taxminan ${Math.round(textPct * 100)}% — Meta tavsiyasi ~${Math.round(ratio * 100)}% dan oshmasin.`,
    })
  } else if (issues.filter((i) => i.severity !== 'ok').length === 0) {
    issues.push({ severity: 'ok', message: 'Format va matn zonasi qabul qilinadigan diapazonda.' })
  }
  return { score: Math.max(0, Math.min(100, s)), issues }
}

function performanceFromHistory(h?: number): { score: number; note: string } {
  if (h == null || Number.isNaN(h)) {
    return { score: 60, note: 'O‘xshash kreativlar uchun tarixiy maʼlumot kiritilmagan (stub).' }
  }
  const score = Math.round(Math.min(100, Math.max(35, h * 22)))
  return { score, note: `O‘xshash kreativlar o‘rtacha ROAS ~${h.toFixed(1)}x (signal bridge).` }
}

function bandFromScore(score: number): { band: ScoreBandKey; label: string } {
  if (score >= 90) return { band: 'excellent', label: "A'lo — ishlat" }
  if (score >= 70) return { band: 'good', label: 'Yaxshi — kichik tuzatish' }
  if (score >= 50) return { band: 'average', label: "O'rtacha — qayta ishla" }
  return { band: 'poor', label: "Yomon — yangisini yasa" }
}

export function calculateCreativeAudit(input: {
  weights?: Partial<Record<AuditCriterionKey, number>>
  vision: VisionScoresInput
  technical: TechnicalSignals
  onboarding: AuditOnboardingContext
  overrides?: HumanAuditOverrides
  extraIssues?: AuditIssue[]
  extraSuggestions?: string[]
  usedOpenAi?: boolean
}): CreativeAuditResult {
  const wmap = { ...DEFAULT_AUDIT_WEIGHTS, ...input.weights }
  const sumW = (Object.keys(wmap) as AuditCriterionKey[]).reduce((a, k) => a + wmap[k], 0)
  const norm = sumW > 0 ? 1 / sumW : 1

  const brandPrimary = input.onboarding.brandPrimaryHex
  const dom = input.vision.dominantHexColors ?? []
  const brandMatch = bestBrandColorMatch(dom, brandPrimary ?? '#0A7A3E')
  let brandFit = Math.round((input.vision.brandFitGuess ?? brandMatch.score) * 0.6 + brandMatch.score * 0.4)

  const tech = technicalScore({
    ...input.technical,
    textPercentApprox: input.vision.estimatedTextPercentOfImage ?? input.technical.textPercentApprox,
    metaTextRatioMax: input.overrides?.ignoreTextRatio ? 1 : 0.2,
  })
  let message = input.vision.messageClarity ?? 70
  if (input.vision.ctaVisible === false && !input.overrides?.ignoreMissingCta) {
    message = Math.min(message, 68)
  }
  if (input.overrides?.ignoreMissingCta) {
    message = Math.min(100, message + 12)
  }

  const audience = input.vision.audienceFitGuess ?? 70
  const plat = platformFitScore(input.technical.width, input.technical.height, input.onboarding.intendedPlacement)
  const visual = input.vision.visualQualityGuess ?? 72
  const perf = performanceFromHistory(input.onboarding.historicalRoasSimilar)

  const criteria: CriterionScore[] = [
    {
      key: 'brandFit',
      labelUz: 'Brand Fit',
      score: brandFit,
      weight: wmap.brandFit * norm,
      checks: 'Ranglar, logo, font (vision + delta)',
    },
    {
      key: 'technical',
      labelUz: 'Texnik',
      score: tech.score,
      weight: wmap.technical * norm,
      checks: 'O‘lcham, matn %, metadata',
    },
    {
      key: 'messageClarity',
      labelUz: 'Message Clarity',
      score: message,
      weight: wmap.messageClarity * norm,
      checks: 'CTA, OCR, 3 soniya testi',
    },
    {
      key: 'audienceMatch',
      labelUz: 'Audience Match',
      score: audience,
      weight: wmap.audienceMatch * norm,
      checks: 'Yosh/jins vs onboarding',
    },
    {
      key: 'platformFit',
      labelUz: 'Platform Fit',
      score: plat.score,
      weight: wmap.platformFit * norm,
      checks: 'Joylashuv nisbati',
    },
    {
      key: 'visualQuality',
      labelUz: 'Visual Quality',
      score: visual,
      weight: wmap.visualQuality * norm,
      checks: 'Estetika / sharpness (vision)',
    },
    {
      key: 'performancePrediction',
      labelUz: 'Performance',
      score: perf.score,
      weight: wmap.performancePrediction * norm,
      checks: perf.note,
    },
  ]

  const score = Math.round(
    criteria.reduce((acc, c) => acc + c.score * c.weight, 0),
  )
  const { band, label } = bandFromScore(score)

  const issues: AuditIssue[] = [...tech.issues, ...(input.extraIssues ?? [])]
  if (input.vision.ctaVisible === false && !input.overrides?.ignoreMissingCta) {
    issues.unshift({ severity: 'error', message: "CTA topilmadi yoki juda noaniq." })
  }
  if (!brandMatch.matched && brandPrimary) {
    issues.push({
      severity: 'warning',
      message: `Dominant ranglar brend primary (${brandPrimary}) ga yaqin emas.`,
    })
  }
  if (plat.score < 65) {
    issues.push({ severity: 'warning', message: plat.detail })
  }

  const suggestions: string[] = []
  if (input.vision.ctaVisible === false && !input.overrides?.ignoreMissingCta) {
    suggestions.push("Pastga aniq CTA qo'shing: «Hoziroq buyurtma ber» yoki «Sotib ol».")
  }
  if (!brandMatch.matched && brandPrimary) {
    suggestions.push(`Primary rangni ${brandPrimary} atrofiga yaqinlashtiring.`)
  }
  if (plat.score < 80) {
    suggestions.push(`${input.onboarding.intendedPlacement ?? 'story'} uchun to‘g‘ri nisbatli master yuklang.`)
  }
  suggestions.push('Creative Hub → Image Ads orqali avtomatik fix variantlari.')
  for (const s of input.extraSuggestions ?? []) {
    if (s && !suggestions.includes(s)) suggestions.push(s)
  }

  return {
    score,
    band,
    bandLabelUz: label,
    criteria,
    issues,
    suggestions,
    usedOpenAi: Boolean(input.usedOpenAi),
  }
}
