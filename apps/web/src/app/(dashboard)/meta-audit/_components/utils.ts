import { daysBetweenInclusive } from '@/lib/date-range'
import { formatCurrency } from '@/lib/utils'
import type { AuditFindings, DateRange, LiveCampaignRow, ReportData } from './types'

export function daysForDateRange(range: DateRange, fromDate?: string, toDate?: string): number {
  if (range === '7') return 7
  if (range === '30') return 30
  if (range === 'custom') {
    const d = daysBetweenInclusive(fromDate ?? '', toDate ?? '')
    return d ?? 7
  }
  return Math.max(1, new Date().getDate())
}

export function tpl(template: string, vars: Record<string, string | number>): string {
  let out = template
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(String(v))
  }
  return out
}

export function flattenReportData(data: ReportData): LiveCampaignRow[] {
  const rows: LiveCampaignRow[] = []
  for (const a of data.accounts) {
    const currency = a.currency || 'USD'
    for (const c of a.campaigns) {
      rows.push({
        id: c.id,
        name: c.name,
        status: c.status,
        spend: c.metrics.spend,
        clicks: c.metrics.clicks,
        impressions: c.metrics.impressions,
        ctr: c.metrics.ctr,
        cpc: c.metrics.cpc,
        accountName: a.name,
        currency,
      })
    }
  }
  return rows
}

export function median(nums: number[]): number {
  if (!nums.length) return 0
  const s = [...nums].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2
}

export function computeAuditFindings(
  rows: LiveCampaignRow[],
  t: (key: string, def: string) => string,
): AuditFindings {
  const facts: string[] = []
  const risks: string[] = []
  const actions: string[] = []
  if (!rows.length) return { facts, risks, actions }

  const currency = rows[0]?.currency ?? 'USD'
  const totalSpend = rows.reduce((s, r) => s + r.spend, 0)
  const totalClicks = rows.reduce((s, r) => s + r.clicks, 0)
  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0)
  const blendedCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

  facts.push(tpl(t('metaAudit.factTotalSpend', 'Total spend in period: {{amount}}.'), { amount: formatCurrency(totalSpend, currency) }))
  facts.push(tpl(t('metaAudit.factCampaignCount', '{{count}} campaigns in scope.'), { count: rows.length }))
  const accountNames = new Set(rows.map((r) => r.accountName))
  facts.push(tpl(t('metaAudit.factAccountCount', '{{count}} ad account(s) included.'), { count: accountNames.size }))

  const top = [...rows].sort((a, b) => b.spend - a.spend)[0]!
  const topShare = totalSpend > 0 ? Math.round((top.spend / totalSpend) * 1000) / 10 : 0
  facts.push(tpl(t('metaAudit.factTopSpend', 'Highest spend: "{{name}}" at {{amount}} ({{share}}% of total).'), { name: top.name, amount: formatCurrency(top.spend, currency), share: topShare }))
  facts.push(tpl(t('metaAudit.factWeightedCtr', 'Blended CTR (clicks ÷ impressions): {{ctr}}%.'), { ctr: blendedCtr.toFixed(2) }))
  facts.push(tpl(t('metaAudit.factTotalClicks', 'Total clicks: {{count}}.'), { count: totalClicks }))
  facts.push(tpl(t('metaAudit.factTotalImpressions', 'Total impressions: {{count}}.'), { count: totalImpressions }))

  if (totalSpend > 0 && topShare >= 55) {
    risks.push(tpl(t('metaAudit.riskSpendConcentration', 'Budget is concentrated: top campaign "{{name}}" takes {{share}}% of spend.'), { name: top.name, share: topShare }))
    actions.push(t('metaAudit.actionRebalanceBudget', 'Reallocate part of the budget away from the single largest spender until efficiency is validated.'))
  }

  const cpcPool = rows.filter((r) => r.clicks >= 5 && r.cpc > 0).map((r) => r.cpc)
  const medianCpc = median(cpcPool)

  for (const r of rows) {
    if (r.spend >= 25 && r.clicks === 0 && r.impressions >= 500) {
      risks.push(tpl(t('metaAudit.riskSpendNoClicks', '"{{name}}" spent {{amount}} with zero clicks.'), { name: r.name, amount: formatCurrency(r.spend, currency) }))
      actions.push(tpl(t('metaAudit.actionFixNoClicks', 'Pause or cap delivery on "{{name}}" until click-through returns.'), { name: r.name }))
    }
  }

  for (const r of rows) {
    if (r.impressions < 2000 || r.spend < 50 || blendedCtr <= 0) continue
    if (r.ctr < blendedCtr * 0.5) {
      risks.push(tpl(t('metaAudit.riskLowCtrVsAvg', 'CTR on "{{name}}" is {{ctr}}%, well below the account blended {{avg}}%.'), { name: r.name, ctr: r.ctr.toFixed(2), avg: blendedCtr.toFixed(2) }))
      actions.push(tpl(t('metaAudit.actionReviewLowCtr', 'Open "{{name}}" in Ads Manager: test new primary text/creative.'), { name: r.name }))
      break
    }
  }

  for (const r of rows) {
    if (r.clicks < 10 || medianCpc <= 0) continue
    if (r.cpc > medianCpc * 2) {
      risks.push(tpl(t('metaAudit.riskHighCpcVsMedian', 'CPC on "{{name}}" is {{cpc}} vs. median {{median}}.'), { name: r.name, cpc: formatCurrency(r.cpc, currency), median: formatCurrency(medianCpc, currency) }))
      actions.push(tpl(t('metaAudit.actionReviewHighCpc', 'Audit "{{name}}": check frequency and placements.'), { name: r.name }))
      break
    }
  }

  const dedupe = (arr: string[]) => Array.from(new Set(arr))
  return { facts, risks: dedupe(risks), actions: dedupe(actions) }
}
