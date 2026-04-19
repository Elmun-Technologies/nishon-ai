'use client'

import Link from 'next/link'
import { Plus, Users, Megaphone, TrendingUp, Play, Pause, ArrowRight } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { PageHeader } from '@/components/ui'
import { Alert } from '@/components/ui/Alert'
import { useAudienceStore } from '@/stores/audience.store'
import { useRetargetingStore } from '@/stores/retargeting.store'
import type { FunnelStage, CampaignStatus } from '@/types/retargeting'
import { formatCurrency, cn } from '@/lib/utils'

const FUNNEL_ORDER: FunnelStage[] = ['prospecting', 'reengagement', 'retargeting', 'retention']

const STAGE_STYLE: Record<FunnelStage, { color: string; bg: string }> = {
  prospecting: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 border border-blue-500/20' },
  reengagement: { color: 'text-violet-600 dark:text-violet-300', bg: 'bg-violet-500/10 border border-violet-500/20' },
  retargeting: { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 border border-orange-500/20' },
  retention: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border border-emerald-500/20' },
}

const STAGE_LABEL_KEY: Record<FunnelStage, string> = {
  prospecting: 'retargeting.stageProspecting',
  reengagement: 'retargeting.stageReengagement',
  retargeting: 'retargeting.stageRetargeting',
  retention: 'retargeting.stageRetention',
}

const STATUS_STYLE: Record<CampaignStatus, string> = {
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  paused: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
  draft: 'bg-surface-2 text-text-secondary border border-border',
  ended: 'bg-surface-2 text-text-tertiary border border-border',
}

const STATUS_LABEL_KEY: Record<CampaignStatus, string> = {
  active: 'retargeting.statusActive',
  paused: 'retargeting.statusPaused',
  draft: 'retargeting.statusDraft',
  ended: 'retargeting.statusEnded',
}

const PLATFORM_KEY: Record<string, string> = {
  meta: 'retargeting.platformMeta',
  google: 'retargeting.platformGoogle',
  tiktok: 'retargeting.platformTiktok',
  yandex: 'retargeting.platformYandex',
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function campaignTitle(name: string, t: (k: string, d?: string) => string) {
  return t(name, name)
}

export default function RetargetingPage() {
  const { t } = useI18n()
  const { audiences, metrics, getByStage } = useAudienceStore()
  const { campaigns, updateCampaignStatus } = useRetargetingStore()

  const activeCampaigns = campaigns.filter((c) => c.status === 'active')
  const totalSpend = metrics.reduce((s, m) => s + m.spend, 0)
  const avgRoas = metrics.length
    ? (metrics.reduce((s, m) => s + m.roas, 0) / metrics.length).toFixed(1)
    : '—'

  const stats = [
    {
      key: 'aud',
      label: t('retargeting.statTotalAudience', 'Total audiences'),
      value: String(audiences.length),
      icon: Users,
    },
    {
      key: 'camp',
      label: t('retargeting.statActiveCampaigns', 'Active campaigns'),
      value: String(activeCampaigns.length),
      icon: Megaphone,
    },
    {
      key: 'spend',
      label: t('retargeting.statMonthlySpend', 'Monthly spend (sample)'),
      value: formatCurrency(totalSpend),
      icon: TrendingUp,
    },
    {
      key: 'roas',
      label: t('retargeting.statAvgRoas', 'Average ROAS (sample)'),
      value: avgRoas === '—' ? '—' : `${avgRoas}x`,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title={t('navigation.retargeting', 'Retargeting')}
        subtitle={t(
          'retargeting.subtitle',
          'Plan funnel audiences and retargeting campaigns from one place.',
        )}
        actions={
          <Link
            href="/retargeting/wizard"
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border border-transparent px-4 py-2 text-sm font-medium shadow-sm transition-all',
              'bg-gradient-to-r from-brand-mid to-brand-lime text-brand-ink hover:opacity-95',
            )}
          >
            <Plus size={16} /> {t('retargeting.newCampaign', 'New campaign')}
          </Link>
        }
      />

      <Alert variant="info">{t('retargeting.demoNotice', 'Sample data for layout review.')}</Alert>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.key}
            className="rounded-xl border border-border bg-surface-2/80 p-4 dark:bg-slate-900/50"
          >
            <div className="mb-2 flex items-center gap-2 text-text-tertiary">
              <stat.icon className="h-4 w-4 shrink-0 opacity-80" />
              <p className="text-xs font-medium leading-snug text-text-secondary">{stat.label}</p>
            </div>
            <p className="text-2xl font-bold tabular-nums text-text-primary">{stat.value}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-heading-sm font-semibold text-text-primary">
            {t('retargeting.funnelSectionTitle', 'Funnel stages')}
          </h2>
          <Link
            href="/retargeting/funnel"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {t('retargeting.funnelDetailLink', 'Funnel detail')}
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {FUNNEL_ORDER.map((stage) => {
            const style = STAGE_STYLE[stage]
            const stageAudiences = getByStage(stage)
            const stageCampaigns = campaigns.filter((c) => c.funnelStage === stage)
            const totalReach = stageAudiences.reduce((s, a) => s + a.size, 0)
            const label = t(STAGE_LABEL_KEY[stage], stage)

            return (
              <div
                key={stage}
                className="space-y-3 rounded-xl border border-border bg-surface-2/60 p-4 dark:bg-slate-900/40"
              >
                <div
                  className={cn(
                    'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold',
                    style.bg,
                    style.color,
                  )}
                >
                  {label}
                </div>
                <div>
                  <p className="text-xl font-bold tabular-nums text-text-primary">{fmtNum(totalReach)}</p>
                  <p className="text-xs text-text-tertiary">{t('retargeting.reachLabel', 'Estimated reach')}</p>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-text-secondary">
                  <span>
                    {t('retargeting.countAudiences', '{{count}} audiences').replace(
                      '{{count}}',
                      String(stageAudiences.length),
                    )}
                  </span>
                  <span>
                    {t('retargeting.countActive', '{{count}} active').replace(
                      '{{count}}',
                      String(stageCampaigns.filter((c) => c.status === 'active').length),
                    )}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-heading-sm font-semibold text-text-primary">
            {t('retargeting.campaignsSectionTitle', 'Campaigns')}
          </h2>
          <Link
            href="/retargeting/wizard"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <Plus size={14} /> {t('retargeting.newShort', 'New')}
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/80">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                  {t('retargeting.colCampaign', 'Campaign')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                  {t('retargeting.colPlatform', 'Platform')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                  {t('retargeting.colStage', 'Stage')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                  {t('retargeting.colDailyBudget', 'Daily budget')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                  {t('retargeting.colStatus', 'Status')}
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-text-tertiary">
                    {t('retargeting.emptyCampaigns', 'No campaigns yet.')}
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => {
                  const style = STAGE_STYLE[c.funnelStage]
                  const stageLabel = t(STAGE_LABEL_KEY[c.funnelStage], c.funnelStage)
                  const pk = PLATFORM_KEY[c.platform] ?? 'retargeting.platformMeta'

                  return (
                    <tr key={c.id} className="transition-colors hover:bg-surface-2/50">
                      <td className="px-4 py-3 font-medium text-text-primary">
                        {campaignTitle(c.name, t)}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{t(pk, c.platform)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                            style.bg,
                            style.color,
                          )}
                        >
                          {stageLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-text-primary">
                        {formatCurrency(c.dailyBudget)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                            STATUS_STYLE[c.status],
                          )}
                        >
                          {t(STATUS_LABEL_KEY[c.status], c.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            updateCampaignStatus(c.id, c.status === 'active' ? 'paused' : 'active')
                          }
                          className="rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-surface-2 hover:text-text-primary"
                          title={
                            c.status === 'active'
                              ? t('retargeting.actionPause', 'Pause')
                              : t('retargeting.actionResume', 'Resume')
                          }
                        >
                          {c.status === 'active' ? <Pause size={15} /> : <Play size={15} />}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
