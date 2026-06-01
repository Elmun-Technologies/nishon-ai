'use client'

import { useMemo } from 'react'
import { findMetaObjective } from '../../_lib/meta-objectives'
import { LOCATION_LABELS } from '../../_lib/types'
import type { LaunchWizardCtl } from '../../_lib/use-launch-wizard'
import {
  estimateAudienceReach,
  formatAudienceReach,
  formatMoneyUsd,
  parsePositiveNumber,
} from '../../_lib/utils'
import { SummaryPanel, type SummaryRow } from '../SummaryPanel'

export function MetaSummary({ ctl }: { ctl: LaunchWizardCtl }) {
  const { metaData } = ctl
  const objective = findMetaObjective(metaData.objective || null)
  const daily = parsePositiveNumber(metaData.dailyBudget)
  const total = (daily ?? 0) * metaData.campaignDuration

  const reach = useMemo(
    () =>
      estimateAudienceReach({
        location: metaData.location,
        minAge: metaData.minAge,
        maxAge: metaData.maxAge,
      }),
    [metaData.location, metaData.minAge, metaData.maxAge],
  )

  const rows: SummaryRow[] = [
    {
      label: 'Maqsad',
      value: objective?.label ?? '—',
      muted: !objective,
    },
    {
      label: 'Nom',
      value: metaData.name || '—',
      muted: !metaData.name,
    },
    {
      label: 'Davlat',
      value: LOCATION_LABELS[metaData.location] ?? metaData.location,
    },
    {
      label: 'Yosh',
      value: `${metaData.minAge}–${metaData.maxAge}`,
    },
    {
      label: 'Byudjet',
      value: daily ? `${formatMoneyUsd(daily)}/kun` : '—',
      muted: !daily,
    },
    {
      label: 'Davom',
      value: `${metaData.campaignDuration} kun`,
    },
    {
      label: 'Jami',
      value: total > 0 ? formatMoneyUsd(total) : '—',
      emphasis: total > 0,
      muted: total === 0,
    },
    {
      label: 'A/B test',
      value: metaData.abTestEnabled ? `${metaData.abTestType}` : 'Off',
      muted: !metaData.abTestEnabled,
    },
  ]

  return (
    <SummaryPanel
      title="Kampaniya xulasasi"
      platformLabel="Meta"
      rows={rows}
      estimateLabel="Taxminiy reach"
      estimateValue={reach ? `${formatAudienceReach(reach)} kishi` : undefined}
      footnote="Hech narsa Meta'ga yuborilmagan — siz oxirgi qadamda tasdiqlaysiz."
    />
  )
}
