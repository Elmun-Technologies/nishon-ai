'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
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

const DEMO_REPORT: ReportData = {
  accounts: [
    {
      id: 'demo-account-1',
      name: 'Demo · Main ad account',
      campaigns: [
        {
          id: 'demo-camp-1',
          name: 'Spring promo — Conversions',
          status: 'ACTIVE',
          objective: 'OUTCOME_SALES',
          metrics: {
            spend: 1240.5,
            clicks: 8420,
            impressions: 210400,
            ctr: 4.01,
            cpc: 0.15,
          },
        },
        {
          id: 'demo-camp-2',
          name: 'Retargeting — Catalog',
          status: 'PAUSED',
          objective: 'OUTCOME_SALES',
          metrics: {
            spend: 612.0,
            clicks: 5100,
            impressions: 98500,
            ctr: 5.18,
            cpc: 0.12,
          },
        },
      ],
    },
    {
      id: 'demo-account-2',
      name: 'Demo · Brand',
      campaigns: [
        {
          id: 'demo-camp-3',
          name: 'Awareness — Video',
          status: 'ACTIVE',
          objective: 'OUTCOME_AWARENESS',
          metrics: {
            spend: 890.25,
            clicks: 3200,
            impressions: 480000,
            ctr: 0.67,
            cpc: 0.28,
          },
        },
      ],
    },
  ],
}

export default function PerformancePage() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()
  const [days, setDays] = useState(7)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [demoMode, setDemoMode] = useState(false)
  const [data, setData] = useState<ReportData | null>(null)

  const load = useCallback(async () => {
    if (!currentWorkspace?.id) {
      setLoading(false)
      setData(null)
      setDemoMode(false)
      return
    }
    setLoading(true)
    try {
      const res = await metaApi.reporting(currentWorkspace.id, days)
      setData((res.data as ReportData) ?? { accounts: [] })
      setDemoMode(false)
    } catch {
      setData(DEMO_REPORT)
      setDemoMode(true)
    } finally {
      setLoading(false)
    }
  }, [currentWorkspace?.id, days])

  useEffect(() => {
    void load()
  }, [load])

  const campaigns = useMemo(
    () => (data?.accounts ?? []).flatMap((a) => a.campaigns.map((c) => ({ ...c, accountName: a.name }))),
    [data],
  )

  const filtered = campaigns.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.accountName.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="space-y-5 max-w-6xl">
      <PageHeader
        title={t('navigation.performance', 'Performance')}
        subtitle={
          <span className="block space-y-1.5">
            <span className="block">{t('performance.subtitle', 'Monitor and analyze your campaign performance')}</span>
            <span className="block text-xs font-normal text-text-tertiary">
              {t(
                'performance.helperLine',
                'Campaign rows load from Meta reporting for this workspace. Pick a date window, then search. When the API returns data, this table is live — otherwise you see samples.',
              )}
            </span>
          </span>
        }
      />

      <Card>
        <div className="flex items-center gap-2 flex-wrap">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                days === d
                  ? 'bg-gradient-to-r from-brand-mid to-brand-lime text-brand-ink border-transparent shadow-sm'
                  : 'border-border text-text-tertiary hover:bg-surface-2 hover:text-text-primary'
              }`}
            >
              {t('performance.lastDays', 'Last')} {d} {t('performance.days', 'days')}
            </button>
          ))}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('common.search', 'Search')}
            className="ml-auto border border-border rounded-lg px-3 py-1.5 text-sm min-w-56 bg-surface"
          />
        </div>
      </Card>

      {demoMode && (
        <Alert variant="info" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed">{t('performance.demoNotice', 'Showing sample performance data.')}</p>
          <Link
            href="/settings/meta"
            className="shrink-0 rounded-lg border border-brand-mid/30 bg-brand-lime/15 px-3 py-2 text-center text-sm font-semibold text-brand-ink hover:bg-brand-lime/25 dark:text-brand-lime"
          >
            {t('metaAudit.connectMeta', 'Open Meta settings')}
          </Link>
        </Alert>
      )}
      <Card padding="none">
        {loading ? (
          <div className="p-8 text-sm text-text-tertiary">{t('common.loading', 'Loading...')}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-2xl font-bold text-text-primary">
              {t('performance.startTracking', 'Start tracking your performance')}
            </p>
            <p className="text-sm text-text-tertiary">
              {t(
                'performance.startTrackingDescription',
                'Launch your first campaign to see real-time metrics here.',
              )}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button onClick={() => (window.location.href = '/launch')}>
                {t('performance.launchWithAi', 'Launch with AI')}
              </Button>
              <Button variant="secondary" onClick={() => (window.location.href = '/wizard')}>
                {t('performance.createManually', 'Create manually')}
              </Button>
            </div>
          </div>
        ) : (
          <DataTable
            rows={filtered}
            rowKey={(row) => row.id}
            columns={[
              {
                key: 'name',
                header: t('performance.name', 'Name'),
                render: (row) => <span className="text-text-primary">{row.name}</span>,
              },
              {
                key: 'account',
                header: t('performance.account', 'Account'),
                render: (row) => row.accountName,
              },
              {
                key: 'status',
                header: t('performance.status', 'Status'),
                render: (row) => row.status,
              },
              {
                key: 'spend',
                header: t('performance.spend', 'Spend'),
                render: (row) => formatCurrency(row.metrics.spend),
              },
              {
                key: 'clicks',
                header: t('performance.clicks', 'Clicks'),
                render: (row) => formatNumber(row.metrics.clicks),
              },
              {
                key: 'impressions',
                header: t('performance.impressions', 'Impressions'),
                render: (row) => formatNumber(row.metrics.impressions),
              },
              {
                key: 'ctr',
                header: t('performance.ctr', 'CTR'),
                render: (row) => `${row.metrics.ctr.toFixed(2)}%`,
              },
              {
                key: 'cpc',
                header: t('performance.cpc', 'CPC'),
                render: (row) => formatCurrency(row.metrics.cpc),
              },
            ]}
          />
        )}
      </Card>
    </div>
  )
}
