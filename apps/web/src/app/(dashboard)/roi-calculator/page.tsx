'use client'

import Link from 'next/link'
import { useI18n } from '@/i18n/use-i18n'
import { PageHeader } from '@/components/ui'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { cn } from '@/lib/utils'

const linkBtn =
  'inline-flex items-center justify-center rounded-xl border border-border bg-white/80 px-4 py-2 text-sm font-medium text-text-primary transition-all hover:border-border hover:bg-white dark:bg-slate-900/70 dark:hover:bg-slate-900'

export default function RoiCalculatorPage() {
  const { t } = useI18n()

  const bullets = [
    t(
      'roiLearning.bullet1',
      'We continuously ingest outcomes from connected accounts and your workspace activity.',
    ),
    t(
      'roiLearning.bullet2',
      'Spend, conversions, creative performance, and AI-assisted decisions improve models using privacy-safe aggregates.',
    ),
    t(
      'roiLearning.bullet3',
      'The more real volume we observe, the more trustworthy ROI projections become.',
    ),
    t(
      'roiLearning.bullet4',
      'When our dataset crosses an internal quality threshold, we will enable the interactive ROI calculator here.',
    ),
  ]

  const sources = [
    t('roiLearning.sourcesDashboard', 'Dashboard summaries and trend lines'),
    t('roiLearning.sourcesReporting', 'Reporting exports and period comparisons'),
    t('roiLearning.sourcesCampaigns', 'Campaign-level performance in Ads Manager'),
    t('roiLearning.sourcesAiDecisions', 'AI Decisions log (actions, rationale, outcomes)'),
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {t('navigation.roi', 'ROI')}
            <Badge variant="info">{t('roiLearning.badge', 'Learning mode')}</Badge>
          </span>
        }
        subtitle={t(
          'header.roiSubtitle',
          'We learn from your real campaign outcomes first; the ROI calculator launches when we have enough data.',
        )}
      />

      <Alert variant="info">
        {t(
          'roiLearning.calculatorNote',
          'Use Dashboard and Reporting to steer budget; connect Meta so we can learn from live data.',
        )}
      </Alert>

      <Card>
        <p className="text-body text-text-secondary leading-relaxed">
          {t(
            'roiLearning.intro',
            'This area is not a marketing calculator. It explains how AdSpectr turns your actual results into better models over time.',
          )}
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-body-sm text-text-secondary">
          {bullets.map((text, i) => (
            <li key={i}>{text}</li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-heading-sm font-semibold text-text-primary">
          {t('roiLearning.sourcesTitle', 'Where signals come from today')}
        </h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-body-sm text-text-secondary">
          {sources.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link href="/dashboard" className={cn(linkBtn)}>
          {t('roiLearning.ctaDashboard', 'Open dashboard')}
        </Link>
        <Link href="/reporting" className={cn(linkBtn)}>
          {t('roiLearning.ctaReporting', 'Open reporting')}
        </Link>
        <Link href="/campaigns" className={cn(linkBtn)}>
          {t('roiLearning.ctaCampaigns', 'Open campaigns')}
        </Link>
        <Link href="/settings/meta" className={cn(linkBtn)}>
          {t('roiLearning.ctaMeta', 'Connect Meta')}
        </Link>
      </div>
    </div>
  )
}
