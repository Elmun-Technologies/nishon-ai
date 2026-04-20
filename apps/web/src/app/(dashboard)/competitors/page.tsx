'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Globe,
  Instagram,
  Link2,
  ListPlus,
  Plus,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
  Users,
} from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import { aiAgent } from '@/lib/api-client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function newRow(): CompetitorRow {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    name: '',
    instagram: '',
    website: '',
    extraLinks: '',
  }
}

interface CompetitorRow {
  id: string
  name: string
  instagram: string
  website: string
  extraLinks: string
}

interface PortfolioCompetitor {
  name: string
  instagram?: string
  website?: string
  threatLevel?: 'low' | 'medium' | 'high'
  oneLinePositioning?: string
  strengthBullets?: string[]
  weaknessBullets?: string[]
  whatToWatch?: string
}

interface PortfolioBatchResult {
  executiveSummary?: string
  analysisCareNote?: string
  portfolioPressureScore?: number
  competitors?: PortfolioCompetitor[]
  topRisks?: string[]
  topOpportunities?: string[]
  ninetyDayPlan?: { focus?: string; actions?: string[] }
  twelveMonthOutlook?: { summary?: string; milestones?: string[] }
}

function threatStyles(level: string | undefined) {
  if (level === 'high') return 'bg-red-500/15 text-red-800 border-red-500/30 dark:text-red-200'
  if (level === 'medium') return 'bg-amber-500/15 text-amber-900 border-amber-500/30 dark:text-amber-100'
  return 'bg-success/15 text-success border-success/30 dark:text-brand-lime'
}

function threatLabel(level: string | undefined, t: (k: string, d: string) => string) {
  if (level === 'high') return t('competitorsPage.threatHigh', 'High')
  if (level === 'medium') return t('competitorsPage.threatMedium', 'Medium')
  if (level === 'low') return t('competitorsPage.threatLow', 'Low')
  return '—'
}

export default function CompetitorsPage() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()
  const [rows, setRows] = useState<CompetitorRow[]>(() => [newRow(), newRow()])
  const [ack, setAck] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<PortfolioBatchResult | null>(null)
  const [activeTab, setActiveTab] = useState<'audit' | 'strategy'>('audit')
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  const canSubmit = useMemo(() => {
    if (!ack || !currentWorkspace?.id) return false
    return rows.some((r) => {
      if (!r.name.trim()) return false
      return Boolean(r.instagram.trim() || r.website.trim() || r.extraLinks.trim())
    })
  }, [ack, rows, currentWorkspace?.id])

  const updateRow = useCallback((id: string, patch: Partial<CompetitorRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }, [])

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, newRow()])
  }, [])

  const removeRow = useCallback((id: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)))
  }, [])

  async function handleAnalyze() {
    setError('')
    if (!currentWorkspace?.id) {
      setError(t('competitorsPage.noWorkspace', 'Select a workspace first.'))
      return
    }
    if (!ack) {
      setError(t('competitorsPage.ackRequired', 'Please confirm you understand the importance of this analysis.'))
      return
    }
    const payloadRows = rows
      .filter((r) => r.name.trim() && (r.instagram.trim() || r.website.trim() || r.extraLinks.trim()))
      .map(({ name, instagram, website, extraLinks }) => ({
        name: name.trim(),
        instagram: instagram.trim() || undefined,
        website: website.trim() || undefined,
        extraLinks: extraLinks.trim() || undefined,
      }))
    if (payloadRows.length === 0) {
      setError(t('competitorsPage.needOneFullRow', 'Add at least one competitor with a name and one link.'))
      return
    }

    setLoading(true)
    setResult(null)
    try {
      const businessContext = {
        name: currentWorkspace.name,
        industry: currentWorkspace.industry,
        targetLocation: currentWorkspace.targetLocation ?? 'Uzbekistan',
        monthlyBudget: currentWorkspace.monthlyBudget,
        goal: currentWorkspace.goal,
        targetAudience: currentWorkspace.targetAudience,
        aiStrategy: currentWorkspace.aiStrategy,
      }
      const { data } = await aiAgent.competitorAnalysisBatch({
        workspaceId: currentWorkspace.id,
        businessContext,
        competitors: payloadRows,
      })
      setResult((data || {}) as PortfolioBatchResult)
      setActiveTab('audit')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      setError(err.response?.data?.message || err.message || t('competitorsPage.analysisFailed', 'Analysis failed'))
    } finally {
      setLoading(false)
    }
  }

  const score = result?.portfolioPressureScore ?? 0

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12 pt-1">
      <section
        className={cn(
          'relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br px-5 py-6 shadow-sm md:px-8 md:py-8',
          'from-white via-surface to-surface-2/90',
          'dark:from-[#1a2d0d] dark:via-brand-ink dark:to-[#152508]',
        )}
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-lime/15 blur-3xl dark:bg-brand-lime/10" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-md ring-1',
                'bg-gradient-to-br from-brand-mid to-brand-lime ring-brand-ink/10',
              )}
            >
              <Users className="h-7 w-7 text-brand-ink" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-caption font-semibold uppercase tracking-wider text-brand-mid dark:text-brand-lime">
                {t('competitorsPage.heroEyebrow', 'Competitive intelligence')}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
                {t('competitorsPage.title', 'Competitor analysis')}
              </h1>
              <p className="mt-2 max-w-2xl text-body-sm text-text-secondary md:text-body">
                {t('competitorsPage.subtitle', 'Add all competitors with links, then run a careful portfolio review.')}
              </p>
            </div>
          </div>
          <div className="flex max-w-xs shrink-0 flex-col gap-1 rounded-2xl border border-brand-mid/25 bg-brand-mid/10 px-3 py-2 text-caption font-medium text-brand-ink dark:border-brand-lime/30 dark:bg-brand-lime/10 dark:text-brand-lime sm:max-w-sm">
            <span className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
              {t('competitorsPage.metaSourceHint', 'Meta Marketing API (Ad Library) + AI synthesis')}
            </span>
            <span className="text-[11px] font-normal leading-snug opacity-90">
              {t('competitorsPage.manusHint', 'Deep research can be routed to Manus on the server.')}
            </span>
          </div>
        </div>
      </section>

      <Alert variant="warning" className="border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-50">
        <div className="flex gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden />
          <div className="space-y-2 text-sm leading-relaxed">
            <p className="font-semibold text-amber-950 dark:text-amber-100">{t('competitorsPage.criticalTitle', 'High-stakes analysis')}</p>
            <p>{t('competitorsPage.criticalBody')}</p>
          </div>
        </div>
      </Alert>

      {!currentWorkspace?.id ? (
        <Alert variant="info">{t('competitorsPage.noWorkspace', 'Select a workspace first.')}</Alert>
      ) : null}

      <Card className="border-border/80 shadow-md dark:border-brand-mid/15">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-text-primary">
            <Building2 className="h-5 w-5 text-brand-mid dark:text-brand-lime" aria-hidden />
            {t('competitorsPage.formTitle', 'Your competitors')}
          </h2>
          <Button type="button" variant="secondary" size="sm" className="gap-2 rounded-xl" onClick={addRow}>
            <Plus className="h-4 w-4" aria-hidden />
            {t('competitorsPage.addRow', 'Add competitor')}
          </Button>
        </div>

        <div className="space-y-4">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="rounded-2xl border border-border/80 bg-surface-2/40 p-4 dark:border-brand-mid/15 dark:bg-brand-ink/25"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-caption font-bold uppercase tracking-wide text-text-tertiary">
                  {t('competitorsPage.rowLabel', 'Competitor')} {index + 1}
                </span>
                {rows.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-red-500/10 hover:text-red-600"
                    aria-label={t('competitorsPage.removeRow', 'Remove')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-caption font-medium text-text-tertiary">{t('competitorsPage.fieldName', 'Name')}</label>
                  <input
                    value={row.name}
                    onChange={(e) => updateRow(row.id, { name: e.target.value })}
                    placeholder={t('competitorsPage.namePh', 'Brand or company name')}
                    className="w-full rounded-xl border border-border/90 bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-mid/50 focus:outline-none focus:ring-2 focus:ring-brand-mid/20 dark:bg-surface-elevated"
                  />
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-caption font-medium text-text-tertiary">
                    <Instagram className="h-3.5 w-3.5" aria-hidden />
                    {t('competitorsPage.fieldInstagram', 'Instagram / social profile')}
                  </label>
                  <input
                    value={row.instagram}
                    onChange={(e) => updateRow(row.id, { instagram: e.target.value })}
                    placeholder="@brand or full URL"
                    className="w-full rounded-xl border border-border/90 bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-mid/50 focus:outline-none focus:ring-2 focus:ring-brand-mid/20 dark:bg-surface-elevated"
                  />
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-caption font-medium text-text-tertiary">
                    <Globe className="h-3.5 w-3.5" aria-hidden />
                    {t('competitorsPage.fieldWebsite', 'Website')}
                  </label>
                  <input
                    value={row.website}
                    onChange={(e) => updateRow(row.id, { website: e.target.value })}
                    placeholder="https://…"
                    className="w-full rounded-xl border border-border/90 bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-mid/50 focus:outline-none focus:ring-2 focus:ring-brand-mid/20 dark:bg-surface-elevated"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 flex items-center gap-1.5 text-caption font-medium text-text-tertiary">
                    <Link2 className="h-3.5 w-3.5" aria-hidden />
                    {t('competitorsPage.fieldExtra', 'Other links (optional)')}
                  </label>
                  <textarea
                    value={row.extraLinks}
                    onChange={(e) => updateRow(row.id, { extraLinks: e.target.value })}
                    placeholder={t('competitorsPage.extraPh', 'TikTok, Meta Ad Library, YouTube, articles — one per line or comma-separated')}
                    rows={2}
                    className="w-full resize-y rounded-xl border border-border/90 bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-mid/50 focus:outline-none focus:ring-2 focus:ring-brand-mid/20 dark:bg-surface-elevated"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-border/80 bg-surface-2/50 p-4 dark:bg-brand-ink/30">
          <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border text-brand-mid focus:ring-brand-mid/30" />
          <span className="text-sm leading-relaxed text-text-secondary">{t('competitorsPage.ackText')}</span>
        </label>

        {error ? (
          <div className="mt-4">
            <Alert variant="error">{error}</Alert>
          </div>
        ) : null}

        <div className="mt-6">
          <Button
            type="button"
            fullWidth
            size="lg"
            className="rounded-2xl"
            disabled={!canSubmit || loading}
            loading={loading}
            onClick={handleAnalyze}
          >
            {loading ? t('competitorsPage.btnLoading', 'Analyzing…') : t('competitorsPage.btnStart', 'Start portfolio analysis')}
          </Button>
        </div>
      </Card>

      {result && (
        <div className="space-y-6">
          <div className="flex gap-1 border-b border-border/80 dark:border-brand-mid/20">
            {(['audit', 'strategy'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors',
                  activeTab === tab
                    ? 'border-b-2 border-brand-mid text-brand-mid dark:border-brand-lime dark:text-brand-lime'
                    : 'text-text-tertiary hover:text-text-primary',
                )}
              >
                {tab === 'audit' ? (
                  <>
                    <BarChart3 className="h-4 w-4" aria-hidden />
                    {t('competitorsPage.tabAudit', 'Audit')}
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4" aria-hidden />
                    {t('competitorsPage.tabStrategy', 'Strategy')}
                  </>
                )}
              </button>
            ))}
          </div>

          {activeTab === 'audit' && (
            <div className="space-y-5">
              {result.analysisCareNote ? (
                <Alert variant="info" className="border-brand-mid/25 bg-brand-mid/5 dark:border-brand-lime/20 dark:bg-brand-lime/5">
                  {result.analysisCareNote}
                </Alert>
              ) : null}

              {result.executiveSummary ? (
                <Card className="border-border/80 shadow-md dark:border-brand-mid/15">
                  <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-text-tertiary">
                    {t('competitorsPage.execSummary', 'Executive summary')}
                  </h3>
                  <p className="text-body-sm leading-relaxed text-text-secondary">{result.executiveSummary}</p>
                </Card>
              ) : null}

              <Card className="border-border/80 shadow-md dark:border-brand-mid/15">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <h3 className="text-lg font-bold text-text-primary">{t('competitorsPage.pressureScore', 'Competitive pressure')}</h3>
                  <div className="text-3xl font-black text-brand-mid dark:text-brand-lime">{Math.round(score)}/100</div>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-surface-2 dark:bg-brand-ink/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-mid to-brand-lime transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                  />
                </div>
                <p className="mt-2 text-caption text-text-tertiary">{t('competitorsPage.pressureHint', 'Higher = more pressure on your positioning and spend.')}</p>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-success/25 bg-success/5 dark:border-success/20">
                  <h3 className="mb-3 flex items-center gap-2 font-bold text-success dark:text-brand-lime">
                    <CheckCircle2 className="h-5 w-5" aria-hidden />
                    {t('competitorsPage.opportunities', 'Opportunities')}
                  </h3>
                  <ul className="space-y-2 text-sm text-text-secondary">
                    {(result.topOpportunities || []).map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <ListPlus className="mt-0.5 h-4 w-4 shrink-0 text-brand-mid dark:text-brand-lime" aria-hidden />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
                <Card className="border-red-500/25 bg-red-500/5 dark:border-red-400/30">
                  <h3 className="mb-3 flex items-center gap-2 font-bold text-red-700 dark:text-red-300">
                    <AlertTriangle className="h-5 w-5" aria-hidden />
                    {t('competitorsPage.risks', 'Risks')}
                  </h3>
                  <ul className="space-y-2 text-sm text-text-secondary">
                    {(result.topRisks || []).map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-text-primary">{t('competitorsPage.perCompetitor', 'By competitor')}</h3>
                {(result.competitors || []).map((c, i) => {
                  const open = openIdx === i
                  return (
                    <Card key={`${c.name}-${i}`} padding="none" className="overflow-hidden border-border/80 dark:border-brand-mid/15">
                      <button
                        type="button"
                        onClick={() => setOpenIdx(open ? null : i)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2/60 dark:hover:bg-brand-ink/30"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-text-primary">{c.name}</p>
                          {c.oneLinePositioning ? (
                            <p className="truncate text-caption text-text-tertiary">{c.oneLinePositioning}</p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className={cn(
                              'rounded-full border px-2.5 py-0.5 text-caption font-bold uppercase',
                              threatStyles(c.threatLevel),
                            )}
                          >
                            {threatLabel(c.threatLevel, t)}
                          </span>
                          {open ? <ChevronUp className="h-4 w-4 text-text-tertiary" /> : <ChevronDown className="h-4 w-4 text-text-tertiary" />}
                        </div>
                      </button>
                      {open ? (
                        <div className="space-y-4 border-t border-border/80 px-4 py-4 dark:border-brand-mid/15">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <p className="mb-1 text-caption font-semibold text-success dark:text-brand-lime">{t('competitorsPage.strengths', 'Strengths')}</p>
                              <ul className="list-inside list-disc space-y-1 text-sm text-text-secondary">
                                {(c.strengthBullets || []).map((b, j) => (
                                  <li key={j}>{b}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="mb-1 text-caption font-semibold text-red-600 dark:text-red-300">{t('competitorsPage.weaknesses', 'Weaknesses')}</p>
                              <ul className="list-inside list-disc space-y-1 text-sm text-text-secondary">
                                {(c.weaknessBullets || []).map((b, j) => (
                                  <li key={j}>{b}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          {c.whatToWatch ? (
                            <p className="rounded-xl bg-brand-mid/8 px-3 py-2 text-sm text-text-secondary dark:bg-brand-lime/10">
                              <span className="font-semibold text-brand-mid dark:text-brand-lime">{t('competitorsPage.watch', 'Watch')}:</span> {c.whatToWatch}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'strategy' && (
            <div className="space-y-5">
              <Card className="border-border/80 shadow-md dark:border-brand-mid/15">
                <h3 className="mb-2 text-lg font-bold text-text-primary">{t('competitorsPage.plan90', '90-day focus')}</h3>
                <p className="text-body-sm text-text-secondary">{result.ninetyDayPlan?.focus}</p>
                <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                  {(result.ninetyDayPlan?.actions || []).map((a, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-bold text-brand-mid dark:text-brand-lime">{i + 1}.</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card className="border-border/80 shadow-md dark:border-brand-mid/15">
                <h3 className="mb-2 text-lg font-bold text-text-primary">{t('competitorsPage.outlook12', '12-month outlook')}</h3>
                <p className="text-body-sm text-text-secondary">{result.twelveMonthOutlook?.summary}</p>
                <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                  {(result.twelveMonthOutlook?.milestones || []).map((m, i) => (
                    <li key={i} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-mid dark:text-brand-lime" aria-hidden />
                      {m}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
