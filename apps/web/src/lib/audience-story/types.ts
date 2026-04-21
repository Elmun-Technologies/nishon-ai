export interface AudiencePersona {
  id: string
  name: string
  ageRange: string
  role: string
  district: string
  city: string
  avatarUrl: string
  onlineHours: string
  loves: string[]
  monthlyBudgetUzs: number
  avgCheckUzs: number
  /** Mock: “data dan klaster” eslatmasi */
  dataNote: string
}

export interface AudienceJourneyStep {
  id: string
  label: string
  count: number
  /** Oldingi bosqishga nisbatan conversion % */
  stageRatePct: number
  /** Oldingi qadamdan tushish sababi (AI tahlil mock) */
  dropoffInsight?: string
}

export interface AudienceInterest {
  name: string
  pct: number
}

export interface AudienceCreativeAffinity {
  id: string
  title: string
  multiplier: number
  winner: string
  loser: string
  shortInsight: string
}

export interface AudienceCompareBlock {
  you: { ageRange: string; peakHours: string; channel: string }
  competitor: { ageRange: string; peakHours: string; channel: string }
  /** Raqib bilan vaqt oralig‘i deyarli ustma-ust tushmasa true */
  lowTimeOverlap: boolean
  summary: string
}

export interface AudienceStoryPayload {
  persona: AudiencePersona
  journey: AudienceJourneyStep[]
  interests: AudienceInterest[]
  interestAiTip: string
  creativeAffinity: AudienceCreativeAffinity[]
  compare: AudienceCompareBlock
  updatedAt: string
  confidenceNote: string
}
