import type { MarketplaceScores, PerformancePoint, TargetologistProfile } from './types'

function median(arr: number[]): number {
  if (arr.length === 0) return 0
  const s = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2
}

function stdDev(arr: number[]): number {
  if (arr.length === 0) return 0
  const m = arr.reduce((a, b) => a + b, 0) / arr.length
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length)
}

/** 8 hafta davomida haftalik minimum ROAS 2 dan past tushmagan */
export function passesRoasConsistency(performance: PerformancePoint[], weeks = 8, floor = 2): boolean {
  const days = weeks * 7
  const slice = performance.slice(-days)
  if (slice.length < 21) return true
  for (let i = 0; i < slice.length; i += 7) {
    const week = slice.slice(i, i + 7)
    if (week.length === 0) break
    const minRoas = Math.min(...week.map((p) => p.roas))
    if (minRoas < floor) return false
  }
  return true
}

export function calculateMarketplaceScores(t: TargetologistProfile): MarketplaceScores {
  const roasArr = t.performance.map((p) => p.roas).filter((r) => r > 0)
  const medianRoas = median(roasArr) || 0
  const stability = Math.max(0, 100 - stdDev(roasArr) * 20)

  const last30 = t.performance.slice(-30)
  const prev30 = t.performance.slice(-60, -30)
  const avg = (arr: PerformancePoint[]) => arr.reduce((s, p) => s + p.roas, 0) / Math.max(1, arr.length)
  const growth = Math.min(
    100,
    Math.max(0, ((avg(last30) - avg(prev30)) / Math.max(0.1, avg(prev30))) * 100 + 50),
  )

  const spendScore = Math.min(100, Math.log10(t.totalSpend + 1) * 20)
  const performance = Math.min(100, medianRoas * 20 + spendScore * 0.3)

  const trustBase =
    100 - t.policyViolations * 25 - Math.max(0, 30 - Math.min(t.accountAgeDays, 400) / 40)
  const trustBan = t.banHistoryMonthsAgo != null && t.banHistoryMonthsAgo < 6 ? 30 : 0
  const trust = Math.max(0, trustBase - trustBan)

  const total = performance * 0.4 + stability * 0.3 + growth * 0.2 + trust * 0.1

  return {
    performance: Math.round(performance),
    stability: Math.round(stability),
    growth: Math.round(growth),
    trust: Math.round(trust),
    total: Math.round(total),
  }
}

export function accountHealthOk(t: TargetologistProfile): boolean {
  if (t.policyViolations > 0) return false
  if (t.banHistoryMonthsAgo != null && t.banHistoryMonthsAgo < 24) return false
  return true
}
