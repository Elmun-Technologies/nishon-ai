/**
 * Hisobot quruvchisi — metrikalar kutubxonasi va shablonlar.
 * Drag-and-drop uchun id + grid o‘lchami + formula (keyin warehouse).
 */

export type MetricCategory = 'sales' | 'traffic' | 'cost' | 'creative' | 'ai'

export type ReportMetricType = 'number' | 'line' | 'bar' | 'table' | 'insight'

export type ReportPersona = 'owner' | 'targetolog' | 'specialist'

export interface ReportMetricDef {
  id: string
  label: string
  type: ReportMetricType
  category: MetricCategory
  /** Ko‘rsatma / keyin SQL ga map */
  formula?: string
  defaultSize: { w: number; h: number }
}

export const MAX_REPORT_WIDGETS = 12

/** Hech narsa saqlanmagan — avtomatik oddiy dashboard (qoida 1). */
export const DEFAULT_DASHBOARD_WIDGET_IDS: string[] = ['revenue', 'roas', 'spend', 'top_creative']

export const CATEGORY_LABELS: Record<MetricCategory, string> = {
  sales: 'Sotuv',
  traffic: 'Traffic',
  cost: 'Xarajat',
  creative: 'Kreativ',
  ai: 'AI insights',
}

export const metricLibrary: ReportMetricDef[] = [
  // Sotuv
  { id: 'revenue', label: 'Revenue', type: 'number', category: 'sales', formula: 'sum(purchase_value)', defaultSize: { w: 3, h: 2 } },
  { id: 'purchases', label: 'Purchases', type: 'number', category: 'sales', formula: 'count(purchases)', defaultSize: { w: 3, h: 2 } },
  { id: 'aov', label: 'AOV', type: 'number', category: 'sales', formula: 'revenue / purchases', defaultSize: { w: 3, h: 2 } },
  { id: 'roas', label: 'ROAS', type: 'number', category: 'sales', formula: 'revenue / spend', defaultSize: { w: 3, h: 2 } },
  // Traffic
  { id: 'impressions', label: 'Impressions', type: 'number', category: 'traffic', formula: 'sum(impressions)', defaultSize: { w: 3, h: 2 } },
  { id: 'clicks', label: 'Clicks', type: 'number', category: 'traffic', formula: 'sum(clicks)', defaultSize: { w: 3, h: 2 } },
  { id: 'ctr', label: 'CTR', type: 'number', category: 'traffic', formula: 'clicks / impressions', defaultSize: { w: 3, h: 2 } },
  { id: 'cpc', label: 'CPC', type: 'number', category: 'traffic', formula: 'spend / clicks', defaultSize: { w: 3, h: 2 } },
  // Xarajat
  { id: 'spend', label: 'Spend', type: 'number', category: 'cost', formula: 'sum(spend)', defaultSize: { w: 3, h: 2 } },
  { id: 'cpm', label: 'CPM', type: 'number', category: 'cost', formula: '(spend / impressions) * 1000', defaultSize: { w: 3, h: 2 } },
  { id: 'cpa', label: 'CPA', type: 'number', category: 'cost', formula: 'spend / purchases', defaultSize: { w: 3, h: 2 } },
  // Kreativ
  { id: 'top_creative', label: 'Top creative', type: 'number', category: 'creative', formula: 'argmax(roas by ad)', defaultSize: { w: 3, h: 2 } },
  { id: 'fatigue_score', label: 'Fatigue score', type: 'number', category: 'creative', formula: 'model(freq, ctr_delta)', defaultSize: { w: 3, h: 2 } },
  { id: 'frequency', label: 'Frequency', type: 'number', category: 'creative', formula: 'avg(frequency)', defaultSize: { w: 3, h: 2 } },
  // AI
  { id: 'ai_roas_trend', label: 'ROAS tushmoqda', type: 'insight', category: 'ai', formula: 'signal(roas_7d_slope)', defaultSize: { w: 6, h: 2 } },
  { id: 'ai_audience_full', label: 'Audience to‘ldi', type: 'insight', category: 'ai', formula: 'saturation_index', defaultSize: { w: 6, h: 2 } },
  // Grafiklar / jadvallar
  { id: 'spend_line_7d', label: 'Spend — 7 kun', type: 'line', category: 'cost', formula: 'timeseries(spend)', defaultSize: { w: 6, h: 4 } },
  { id: 'campaign_bar', label: 'Kampaniya bo‘yicha', type: 'bar', category: 'traffic', formula: 'group by campaign', defaultSize: { w: 6, h: 4 } },
  { id: 'top5_creatives_table', label: 'Top 5 kreativ', type: 'table', category: 'creative', formula: 'order by roas limit 5', defaultSize: { w: 6, h: 4 } },
  { id: 'audience_saturation', label: 'Audience saturation', type: 'insight', category: 'traffic', formula: 'reach / audience_size', defaultSize: { w: 3, h: 2 } },
  { id: 'creative_fatigue', label: 'Creative fatigue', type: 'insight', category: 'creative', formula: 'freq vs ctr', defaultSize: { w: 3, h: 2 } },
  // Mutaxassis
  { id: 'custom_metrics', label: 'Custom metrics', type: 'insight', category: 'ai', formula: 'user_defined', defaultSize: { w: 6, h: 3 } },
  { id: 'sql_export', label: 'SQL / export', type: 'insight', category: 'ai', formula: 'warehouse', defaultSize: { w: 6, h: 3 } },
]

export const reportTemplates = {
  /** Biznes egasi — 4 ta card */
  business_owner: ['revenue', 'roas', 'spend', 'top_creative'],
  /** Targetolog — 8 ta widget */
  targetolog: [
    'roas',
    'ctr',
    'cpm',
    'cpc',
    'spend_line_7d',
    'campaign_bar',
    'audience_saturation',
    'creative_fatigue',
  ],
  /** Creative audit */
  creative_audit: ['top_creative', 'fatigue_score', 'frequency', 'top5_creatives_table', 'ai_roas_trend'],
  /** Mutaxassis — chuqur (≤12) */
  specialist: [
    'revenue',
    'roas',
    'spend',
    'cpa',
    'impressions',
    'clicks',
    'ctr',
    'cpm',
    'spend_line_7d',
    'campaign_bar',
    'top5_creatives_table',
    'sql_export',
  ],
} as const

export type ReportTemplateKey = keyof typeof reportTemplates

export function getMetricById(id: string): ReportMetricDef | undefined {
  return metricLibrary.find((m) => m.id === id)
}

export const PERSONA_HINTS: Record<
  ReportPersona,
  { title: string; need: string; metrics: string[] }
> = {
  owner: {
    title: 'Biznes egasi',
    need: 'Pulim qaytayaptimi?',
    metrics: ['Bugun sotuv', 'ROAS', 'Eng yaxshi kreativ'],
  },
  targetolog: {
    title: 'Targetolog',
    need: 'Qayerni optimizatsiya qilay?',
    metrics: ['Kampaniya CTR, CPM, CPC', 'Audience saturation', 'Creative fatigue'],
  },
  specialist: {
    title: 'Mutaxassis',
    need: 'Hamma data',
    metrics: ['Custom metrics', 'SQL', 'Export'],
  },
}

/** ROAS widget yo‘q bo‘lsa va persona biznes — AI tavsiya (qoida 3). */
export function suggestRoasWidget(persona: ReportPersona, widgetIds: string[]): string | null {
  if (persona !== 'owner') return null
  if (widgetIds.includes('roas')) return null
  return 'ROAS vidjetini qo‘shishni tavsiya qilamiz — so‘nggi davrda tushish signali bor.'
}
