'use client'

import { useEffect, useMemo, useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import { meta as metaApi } from '@/lib/api-client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert, DataTable, PageHeader } from '@/components/ui'
import { formatCurrency, formatNumber } from '@/lib/utils'

interface CampaignMetrics {
  spend: number
  clicks: number
  impressions: number
  ctr: number
  cpc: number
}

interface ReportCampaign {
  id: string
  name: string
  status: string
  objective: string | null
  metrics: CampaignMetrics
}

interface ReportAccount {
  id: string
  name: string
  campaigns: ReportCampaign[]
}

interface ReportData {
  accounts: ReportAccount[]
}

const DAY_OPTIONS = [7, 14, 30, 60, 90]

export default function PerformancePage() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()
  const [days, setDays] = useState(7)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<ReportData | null>(null)

  useEffect(() => {
    if (!currentWorkspace?.id) return
    setLoading(true)
    setError('')
    metaApi.reporting(currentWorkspace.id, days)
      .then((res) => setData(res.data as ReportData))
      .catch((e: any) => setError(e?.message ?? t('performance.loadFailed', 'Failed to load performance data')))
      .finally(() => setLoading(false))
  }, [currentWorkspace?.id, days])

  const campaigns = useMemo(
    () => (data?.accounts ?? []).flatMap((a) => a.campaigns.map((c) => ({ ...c, accountName: a.name }))),
    [data],
  )

  const filtered = campaigns.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.accountName.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="space-y-5 max-w-6xl">
      <PageHeader
        title={t('navigation.performance', 'Performance')}
        subtitle={t('performance.subtitle', 'Monitor and analyze your campaign performance')}
      />

      <Card>
        <div className="flex items-center gap-2 flex-wrap">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs border ${days === d ? 'bg-surface text-white border-border' : 'border-border text-text-tertiary'}`}
            >
              {t('performance.lastDays', 'Last')} {d} {t('performance.days', 'days')}
            </button>
          ))}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('common.search', 'Search')}
            className="ml-auto border border-border rounded-lg px-3 py-1.5 text-sm min-w-56"
          />
        </div>
      </Card>

      {error && <Alert variant="error">{error}</Alert>}

      <Card padding="none">
        {loading ? (
          <div className="p-8 text-sm text-text-tertiary">{t('common.loading', 'Loading...')}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-2xl font-bold text-text-primary">{t('performance.startTracking', 'Start tracking your performance')}</p>
            <p className="text-sm text-text-tertiary">{t('performance.startTrackingDescription', 'Launch your first campaign to see real-time metrics here.')}</p>
            <div className="flex items-center justify-center gap-2">
              <Button onClick={() => (window.location.href = '/launch')}>{t('performance.launchWithAi', 'Launch with AI')}</Button>
              <Button variant="secondary" onClick={() => (window.location.href = '/wizard')}>{t('performance.createManually', 'Create manually')}</Button>
            </div>
          </div>
        ) : (
          <DataTable
            rows={filtered}
            rowKey={(row) => row.id}
            columns={[
              { key: 'name', header: t('performance.name', 'Name'), render: (row) => <span className="text-text-primary">{row.name}</span> },
              { key: 'account', header: t('performance.account', 'Account'), render: (row) => row.accountName },
              { key: 'status', header: t('performance.status', 'Status'), render: (row) => row.status },
              { key: 'spend', header: t('performance.spend', 'Spend'), render: (row) => formatCurrency(row.metrics.spend) },
              { key: 'clicks', header: t('performance.clicks', 'Clicks'), render: (row) => formatNumber(row.metrics.clicks) },
              { key: 'ctr', header: 'CTR', render: (row) => `${row.metrics.ctr.toFixed(2)}%` },
              { key: 'cpc', header: 'CPC', render: (row) => formatCurrency(row.metrics.cpc) },
            ]}
          />
        )}
      </Card>
    </div>
  )
}
