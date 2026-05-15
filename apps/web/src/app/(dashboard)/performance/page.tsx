'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link2, Loader2, Plug, RefreshCcw } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import { meta as metaApi } from '@/lib/api-client'
import { connectMeta } from '@/lib/meta'
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
  const workspaceId = currentWorkspace?.id
  const [days, setDays] = useState(7)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [needsMetaConnect, setNeedsMetaConnect] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ReportData | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false)
      setData(null)
      setNeedsMetaConnect(false)
      return
    }
    setLoading(true)
    setError(null)
    setNeedsMetaConnect(false)
    try {
      const res = await metaApi.reporting(workspaceId, days)
      const next = (res.data as ReportData) ?? { accounts: [] }
      setData(next)
      // Reporting returns an empty array when no Meta account is linked
      // OR when the workspace has campaigns but no synced insights yet.
      // The connect CTA appears only for the first case — we can't tell
      // them apart without a dedicated flag, so we surface "connect" if
      // there are no accounts at all.
      if (!next.accounts || next.accounts.length === 0) {
        setNeedsMetaConnect(true)
      }
    } catch (e: any) {
      const code = e?.code ?? e?.response?.data?.code
      const msg = e?.response?.data?.message ?? e?.message ?? ''
      if (
        code === 'META_NOT_CONNECTED' ||
        /no.*meta|not connected/i.test(String(msg))
      ) {
        setNeedsMetaConnect(true)
        setData({ accounts: [] })
      } else {
        setError(msg || 'reporting_failed')
        setData({ accounts: [] })
      }
    } finally {
      setLoading(false)
    }
  }, [workspaceId, days])

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
        subtitle={t(
          'performance.subtitle',
          'Workspace bo\'yicha real Meta kampaniya metrikalari.',
        )}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={load}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCcw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Yangilash
          </Button>
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

      {error && <Alert variant="error">{error}</Alert>}

      {needsMetaConnect && workspaceId && (
        <Card className="border-dashed bg-surface-2/40">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-mid/15">
              <Plug className="h-6 w-6 text-brand-mid dark:text-brand-lime" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary">
                Meta hisobini ulang
              </p>
              <p className="text-xs text-text-tertiary mt-0.5">
                Kampaniya metrikalari uchun avval Meta Business hisobini ulashingiz
                kerak. Ulangach ma'lumotlar avtomatik sinx bo'ladi va shu yerda
                paydo bo'ladi.
              </p>
            </div>
            <Button onClick={() => connectMeta(workspaceId)} className="gap-1.5">
              <Link2 className="h-4 w-4" />
              Ulash
            </Button>
          </div>
        </Card>
      )}

      <Card padding="none">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-text-tertiary">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">{t('common.loading', 'Loading...')}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-xl font-bold text-text-primary">
              {needsMetaConnect
                ? 'Meta ulangach ma\'lumotlar paydo bo\'ladi'
                : query
                  ? 'Qidiruv natijasi bo\'sh'
                  : t('performance.startTracking', 'Start tracking your performance')}
            </p>
            {!needsMetaConnect && !query && (
              <>
                <p className="text-sm text-text-tertiary">
                  {t(
                    'performance.startTrackingDescription',
                    'Launch your first campaign to see real-time metrics here.',
                  )}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Button onClick={() => (window.location.href = '/ad-launcher')}>
                    Ad Launcher
                  </Button>
                  <Button variant="secondary" onClick={() => (window.location.href = '/wizard')}>
                    {t('performance.createManually', 'Create manually')}
                  </Button>
                </div>
              </>
            )}
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
