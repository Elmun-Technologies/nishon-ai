'use client'

import { useI18n } from '@/i18n/use-i18n'
import type { AuditFindings } from './types'

interface AuditFindingsCardProps {
  findings: AuditFindings
  noCampaignRows: boolean
}

export function AuditFindingsCard({ findings, noCampaignRows }: AuditFindingsCardProps) {
  const { t } = useI18n()

  return (
    <section className="rounded-2xl border border-brand-mid/20 bg-surface p-4 shadow-sm ring-1 ring-brand-lime/10 dark:border-brand-mid/25 dark:ring-brand-lime/5">
      <h2 className="text-sm font-semibold text-brand-ink dark:text-brand-lime">
        {t('metaAudit.findingsTitle', 'Audit findings (from reporting)')}
      </h2>

      {noCampaignRows && (
        <p className="mt-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
          {t('metaAudit.findingNoCampaigns', 'Meta is connected but no campaign rows were returned for this period — widen the date range or check account access.')}
        </p>
      )}

      <div className="mt-3 grid gap-4 md:grid-cols-3">
        {/* Facts */}
        <div className="rounded-xl border border-brand-mid/20 bg-brand-lime/[0.07] p-4 dark:bg-brand-lime/5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-ink/80 dark:text-brand-lime/90">
            {t('metaAudit.factsTitle', 'Facts')}
          </p>
          <ul className="list-disc space-y-1.5 pl-4 text-sm text-text-secondary">
            {findings.facts.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>

        {/* Risks */}
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
            {t('metaAudit.risksTitle', 'Weak spots')}
          </p>
          {findings.risks.length === 0 ? (
            <p className="text-sm text-amber-950/80 dark:text-amber-100/90">
              {t('metaAudit.risksEmpty', 'No automatic risk flags for this window. Rules check spend concentration, CTR vs. blended average, CPC vs. median, and spend without clicks.')}
            </p>
          ) : (
            <ul className="list-disc space-y-1.5 pl-4 text-sm text-amber-950/90 dark:text-amber-50/95">
              {findings.risks.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Actions */}
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
            {t('metaAudit.actionsTitle', 'Recommendations')}
          </p>
          {findings.actions.length === 0 ? (
            <p className="text-sm text-emerald-950/70 dark:text-emerald-100/80">—</p>
          ) : (
            <ul className="list-disc space-y-1.5 pl-4 text-sm text-emerald-950/90 dark:text-emerald-50/95">
              {findings.actions.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
