export type ReportFiltersState = {
  range: 'today' | 'yesterday' | '7d' | '30d'
  platform: 'all' | 'meta' | 'yandex'
  campaignId: 'all' | string
  compare: boolean
}
