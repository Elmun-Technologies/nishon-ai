'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  Link2,
  Loader2,
  Plug,
  RefreshCcw,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Wand2,
} from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import { meta as metaApi } from '@/lib/api-client'
import { connectMeta } from '@/lib/meta'
import { Alert, Button, Card, PageHeader } from '@/components/ui'
import { cn } from '@/lib/utils'

type AuditReport = Awaited<ReturnType<typeof metaApi.audit>>['data']['report']
type Finding = AuditReport['findings'][number]
type Campaign = AuditReport['campaigns'][number]

const SEVERITY_STYLE: Record<
  Finding['severity'],
  { label: string; ring: string; bg: string; text: string; Icon: typeof AlertTriangle }
> = {
  critical: {
    label: 'Kritik',
    ring: 'border-rose-300/50 dark:border-rose-500/30',
    bg: 'bg-rose-50/60 dark:bg-rose-500/5',
    text: 'text-rose-800 dark:text-rose-300',
    Icon: AlertCircle,
  },
  warning: {
    label: 'Ogohlantirish',
    ring: 'border-amber-300/50 dark:border-amber-500/30',
    bg: 'bg-amber-50/60 dark:bg-amber-500/5',
    text: 'text-amber-800 dark:text-amber-300',
    Icon: AlertTriangle,
  },
  info: {
    label: 'Maslahat',
    ring: 'border-sky-300/50 dark:border-sky-500/30',
    bg: 'bg-sky-50/60 dark:bg-sky-500/5',
    text: 'text-sky-800 dark:text-sky-300',
    Icon: Info,
  },
  good: {
    label: "Yaxshi",
    ring: 'border-emerald-300/50 dark:border-emerald-500/30',
    bg: 'bg-emerald-50/60 dark:bg-emerald-500/5',
    text: 'text-emerald-800 dark:text-emerald-300',
    Icon: CheckCircle2,
  },
}

const CATEGORY_LABEL: Record<Finding['category'], string> = {
  spend: 'Sarf',
  performance: 'Samaradorlik',
  audience: 'Auditoriya',
  creative: 'Kreativ',
  structure: 'Struktura',
  delivery: 'Yetkazib berish',
}

const FLAG_LABELS: Record<string, { label: string; cls: string }> = {
  ZERO_CLICKS: { label: '0 click', cls: 'bg-rose-500/15 text-rose-700 dark:text-rose-400' },
  ZERO_CONVERSIONS: { label: '0 conv', cls: 'bg-rose-500/15 text-rose-700 dark:text-rose-400' },
  LOW_CTR: { label: 'low CTR', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  LOSING_ROAS: { label: 'ROAS < 1', cls: 'bg-rose-500/15 text-rose-700 dark:text-rose-400' },
  ACTIVE_NO_SPEND: { label: 'stalled', cls: 'bg-rose-500/15 text-rose-700 dark:text-rose-400' },
  HIGH_CTR: { label: 'high CTR', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  HEALTHY_ROAS: { label: 'ROAS ≥ 3', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
}

function fmtUsd(n: number): string {
  if (!isFinite(n) || n === 0) return '$0'
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function fmtPct(n: number): string {
  if (!isFinite(n)) return '—'
  return `${n.toFixed(2)}%`
}

function scoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 70) return 'text-sky-600 dark:text-sky-400'
  if (score >= 50) return 'text-amber-600 dark:text-amber-400'
  return 'text-rose-600 dark:text-rose-400'
}

function scoreRing(score: number): string {
  if (score >= 85) return 'stroke-emerald-500'
  if (score >= 70) return 'stroke-sky-500'
  if (score >= 50) return 'stroke-amber-500'
  return 'stroke-rose-500'
}

function ScoreCircle({ score }: { score: number }) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  return (
    <div className="relative h-32 w-32">
      <svg width="128" height="128" viewBox="0 0 128 128" className="rotate-[-90deg]">
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="currentColor"
          strokeWidth="10"
          fill="none"
          className="text-surface-2"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn('transition-all duration-700', scoreRing(score))}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-3xl font-bold tabular-nums', scoreColor(score))}>
          {score}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-text-tertiary">
          / 100
        </span>
      </div>
    </div>
  )
}

export default function MetaAuditPage() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()
  const workspaceId = currentWorkspace?.id

  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [pauseLoading, setPauseLoading] = useState(false)
  const [pauseResult, setPauseResult] = useState<string | null>(null)
  const [connected, setConnected] = useState(true)
  const [report, setReport] = useState<AuditReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [severityFilter, setSeverityFilter] = useState<'all' | Finding['severity']>('all')
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null)

  const load = useCallback(
    async (opts: { withAi?: boolean } = {}) => {
      if (!workspaceId) {
        setLoading(false)
        return
      }
      if (opts.withAi) setAiLoading(true)
      else setLoading(true)
      setError(null)
      try {
        const { data } = await metaApi.audit(workspaceId, days, opts.withAi)
        setConnected(data.connected)
        setReport(data.report)
      } catch (e: any) {
        setError(e?.message ?? 'Audit yuklanmadi')
      } finally {
        setLoading(false)
        setAiLoading(false)
      }
    },
    [workspaceId, days],
  )

  const pauseLosingNow = useCallback(async () => {
    if (!workspaceId || !report) return
    setPauseLoading(true)
    setPauseResult(null)
    try {
      const { data } = await metaApi.pauseLosingCampaigns(workspaceId, days)
      setPauseResult(
        data.paused.length > 0
          ? `${data.paused.length} ta kampaniya pauza qilindi${data.failed.length > 0 ? ` · ${data.failed.length} ta xato` : ''}.`
          : data.totalCandidates === 0
            ? "Pauza qilish uchun kampaniya topilmadi."
            : `Hech qaysi kampaniya pauza qilinmadi (${data.failed.length} ta xato).`,
      )
      void load()
    } catch (e: any) {
      setPauseResult(e?.message ?? "Pauza qilib bo'lmadi")
    } finally {
      setPauseLoading(false)
    }
  }, [workspaceId, report, days, load])

  const exportCsv = useCallback(() => {
    if (!report) return
    const rows: (string | number)[][] = [
      ['Kampaniya', 'Holat', 'Maqsad', 'Sarf', 'Daromad', 'CTR', 'CPC', 'ROAS', 'Konv.', 'Salomatlik', 'Belgilar'],
      ...report.campaigns.map((c) => [
        c.name,
        c.status,
        c.objective ?? '',
        c.spend,
        c.revenue,
        c.ctr,
        c.cpc,
        c.roas,
        c.conversions,
        c.health,
        c.flags.join('|'),
      ]),
    ]
    const csv = rows
      .map((r) =>
        r
          .map((cell) => {
            const v = String(cell ?? '').replace(/"/g, '""')
            return /[",\n]/.test(v) ? `"${v}"` : v
          })
          .join(','),
      )
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meta-audit-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [report])

  useEffect(() => {
    void load()
  }, [load])

  const filteredFindings = useMemo(() => {
    if (!report) return []
    if (severityFilter === 'all') return report.findings
    return report.findings.filter((f) => f.severity === severityFilter)
  }, [report, severityFilter])

  const severityCounts = useMemo(() => {
    if (!report) return { critical: 0, warning: 0, info: 0, good: 0 }
    return report.findings.reduce(
      (acc, f) => ({ ...acc, [f.severity]: acc[f.severity] + 1 }),
      { critical: 0, warning: 0, info: 0, good: 0 } as Record<Finding['severity'], number>,
    )
  }, [report])

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-8">
      <PageHeader
        title="360° Meta Audit"
        subtitle="Hisobingizning haqiqiy holatini ko'rsatuvchi avtomatik audit — sarf, samaradorlik, struktura va yetkazib berish."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm"
            >
              <option value={7}>So&apos;nggi 7 kun</option>
              <option value={14}>So&apos;nggi 14 kun</option>
              <option value={30}>So&apos;nggi 30 kun</option>
              <option value={60}>So&apos;nggi 60 kun</option>
              <option value={90}>So&apos;nggi 90 kun</option>
            </select>
            {report && report.campaigns.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={exportCsv}
                className="gap-1.5"
                title="Auditni CSV sifatida yuklab olish"
              >
                <Download className="h-4 w-4" />
                <span className="hidden md:inline">CSV</span>
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => load()}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCcw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              Qayta o&apos;tkazish
            </Button>
          </div>
        }
      />

      {error && <Alert variant="error">{error}</Alert>}

      {!workspaceId && (
        <Alert variant="warning">
          Workspace tanlanmagan. Iltimos, yuqoridan workspace tanlang.
        </Alert>
      )}

      {workspaceId && !loading && !connected && (
        <Card className="border-dashed">
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-mid/15">
              <Plug className="h-7 w-7 text-brand-mid dark:text-brand-lime" />
            </span>
            <h3 className="text-lg font-semibold text-text-primary">
              Meta hisobini ulang
            </h3>
            <p className="max-w-md text-sm text-text-secondary">
              360° auditni ishga tushirish uchun Meta Business hisobingizni
              ulashingiz kerak. Ulangach, biz hisobingizdagi har bir kampaniya,
              ad set va reklama uchun avtomatik tahlil qilamiz va aniq xatolar
              hamda yaxshilash imkoniyatlarini ko&apos;rsatamiz.
            </p>
            <Button onClick={() => connectMeta(workspaceId)} className="mt-2 gap-1.5">
              <Link2 className="h-4 w-4" />
              Meta&apos;ni ulash va auditdan o&apos;tkazish
            </Button>
            <div className="mt-3 grid grid-cols-1 gap-2 text-left text-xs text-text-tertiary sm:grid-cols-3">
              <p>✓ Sarf konsentratsiyasi</p>
              <p>✓ Yetkazib berish muammolari</p>
              <p>✓ 0 click / 0 konversiya</p>
              <p>✓ ROAS &lt; 1 kampaniyalar</p>
              <p>✓ Past CTR ogohlantirishlar</p>
              <p>✓ Aniq fix tavsiyalari</p>
            </div>
          </div>
        </Card>
      )}

      {workspaceId && loading && !report && (
        <Card>
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-text-tertiary">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Audit ishga tushirilmoqda — {days} kunlik ma&apos;lumotlar tahlil qilinmoqda…</p>
          </div>
        </Card>
      )}

      {workspaceId && connected && report && (
        <>
          {/* Overall score + totals */}
          <Card>
            <div className="flex flex-wrap items-start gap-6">
              <div className="flex shrink-0 items-center gap-4">
                <ScoreCircle score={report.score} />
                <div>
                  <p className="text-xs uppercase tracking-wide text-text-tertiary">
                    Hisob salomatligi
                  </p>
                  <p className={cn('text-xl font-bold capitalize', scoreColor(report.score))}>
                    {report.scoreLabel === 'excellent' && "A'lo"}
                    {report.scoreLabel === 'good' && 'Yaxshi'}
                    {report.scoreLabel === 'fair' && "O'rta"}
                    {report.scoreLabel === 'poor' && 'Yomon'}
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    {new Date(report.generatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
                <StatBlock
                  label="Sarflandi"
                  value={fmtUsd(report.totals.spend)}
                  deltaPct={report.deltas.spendPct}
                />
                <StatBlock
                  label="Daromad"
                  value={fmtUsd(report.totals.revenue)}
                  deltaPct={report.deltas.revenuePct}
                  upIsGood
                />
                <StatBlock
                  label="ROAS"
                  value={report.totals.avgRoas > 0 ? `${report.totals.avgRoas.toFixed(2)}x` : '—'}
                  positive={report.totals.avgRoas >= 1}
                  deltaPct={report.deltas.roasPct}
                  upIsGood
                />
                <StatBlock
                  label="Konversiyalar"
                  value={String(report.totals.conversions)}
                  deltaPct={report.deltas.conversionsPct}
                  upIsGood
                />
                <StatBlock label="Bosishlar" value={report.totals.clicks.toLocaleString()} />
                <StatBlock
                  label="CTR"
                  value={fmtPct(report.totals.avgCtr)}
                  deltaPct={report.deltas.ctrPct}
                  upIsGood
                />
                <StatBlock label="CPC" value={fmtUsd(report.totals.avgCpc)} />
                <StatBlock
                  label="Kampaniyalar"
                  value={`${report.totals.activeCampaigns} / ${report.totals.totalCampaigns}`}
                />
              </div>
            </div>
            {report.priorTotals.spend > 0 && (
              <p className="mt-3 text-[11px] text-text-tertiary">
                Solishtirilmoqda: oxirgi {report.windowDays} kun vs avvalgi {report.windowDays} kun
                (${report.priorTotals.spend.toFixed(0)} sarf, ROAS {report.priorTotals.avgRoas.toFixed(2)}x)
              </p>
            )}
          </Card>

          {/* AI executive summary */}
          {report.aiSummary ? (
            <Card>
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-mid to-brand-lime text-brand-ink">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                    AI xulosa
                  </p>
                  <div className="mt-1.5 space-y-2 text-sm leading-relaxed text-text-secondary whitespace-pre-wrap">
                    {report.aiSummary}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-surface-2/40 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-mid/15">
                  <Wand2 className="h-4 w-4 text-brand-mid dark:text-brand-lime" />
                </span>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    AI xulosa olish
                  </p>
                  <p className="text-xs text-text-tertiary">
                    Audit natijasini o&apos;zbekcha 2-3 paragrafda tushuntirib beraman
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => load({ withAi: true })}
                disabled={aiLoading}
                className="gap-1.5"
              >
                {aiLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {aiLoading ? 'Yozilmoqda…' : 'Generatsiya qilish'}
              </Button>
            </div>
          )}

          {/* One-click fix: pause losing campaigns */}
          {report.campaigns.some((c) => c.flags.includes('LOSING_ROAS') && c.status === 'ACTIVE') && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-300/50 bg-rose-50/60 px-4 py-3 dark:border-rose-500/30 dark:bg-rose-500/5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                    {report.campaigns.filter((c) => c.flags.includes('LOSING_ROAS') && c.status === 'ACTIVE').length}{' '}
                    ta aktiv kampaniyada ROAS &lt; 1 — har kuni zarar
                  </p>
                  <p className="mt-0.5 text-xs text-rose-800/85 dark:text-rose-300/80">
                    Bir bosishda hammasini Meta&apos;da pauza qilamiz. Keyin sababini tahlil qilib qayta yoqasiz.
                  </p>
                  {pauseResult && (
                    <p className="mt-1.5 text-xs font-medium text-rose-900 dark:text-rose-200">
                      ✓ {pauseResult}
                    </p>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                onClick={pauseLosingNow}
                disabled={pauseLoading}
                className="gap-1.5 bg-rose-600 hover:bg-rose-700"
              >
                {pauseLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Hammasini pauza qilish
              </Button>
            </div>
          )}

          {/* Severity filter chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-text-tertiary">
              {report.findings.length} ta topilma:
            </span>
            {(['all', 'critical', 'warning', 'info', 'good'] as const).map((s) => {
              const count =
                s === 'all'
                  ? report.findings.length
                  : severityCounts[s as Finding['severity']]
              const style = s === 'all' ? null : SEVERITY_STYLE[s as Finding['severity']]
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverityFilter(s)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    severityFilter === s
                      ? 'border-brand-mid bg-brand-mid/10 text-text-primary dark:border-brand-lime/40'
                      : 'border-border bg-surface text-text-secondary hover:border-brand-mid/40',
                  )}
                >
                  {s === 'all'
                    ? "Hammasi"
                    : style?.label}{' '}
                  <span className="ml-1 text-text-tertiary">{count}</span>
                </button>
              )
            })}
          </div>

          {/* Findings list */}
          {filteredFindings.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-text-tertiary">
                <CheckCircle2 className="h-10 w-10 text-emerald-500/60" />
                <p className="text-sm font-medium text-text-primary">
                  {report.findings.length === 0
                    ? 'Hech qanday muammo topilmadi!'
                    : 'Bu filterda topilma yo\'q'}
                </p>
                {report.findings.length === 0 && (
                  <p className="text-xs">
                    Hisobingiz yaxshi ishlayapti. Audit har soatda yangilanadi.
                  </p>
                )}
              </div>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {filteredFindings.map((f) => (
                <FindingCard
                  key={f.id}
                  finding={f}
                  expanded={expandedFinding === f.id}
                  onToggle={() =>
                    setExpandedFinding((prev) => (prev === f.id ? null : f.id))
                  }
                />
              ))}
            </div>
          )}

          {/* Top spenders + zero results drilldowns */}
          <div className="grid gap-4 lg:grid-cols-2">
            <CampaignList
              title="Eng ko'p sarflagan kampaniyalar"
              icon={<TrendingUp className="h-4 w-4" />}
              campaigns={report.topSpenders}
              emptyMsg="Hozircha sarf yo'q"
            />
            <CampaignList
              title="Diqqat talab qiluvchi kampaniyalar"
              icon={<AlertCircle className="h-4 w-4" />}
              campaigns={report.zeroResultCampaigns}
              emptyMsg="Hammasi tartibda — muammoli kampaniya yo'q"
            />
          </div>

          {/* Spend by objective */}
          {report.spendByObjective.length > 1 && (
            <Card>
              <div className="mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-text-tertiary" />
                <h3 className="text-sm font-semibold text-text-primary">
                  Maqsad bo&apos;yicha sarf taqsimoti
                </h3>
              </div>
              <div className="space-y-2">
                {report.spendByObjective.map((row) => (
                  <div key={row.objective} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 text-xs font-medium text-text-secondary">
                      {row.objective.replace('OUTCOME_', '').toLowerCase()}
                    </span>
                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-mid to-brand-lime"
                        style={{ width: `${row.share}%` }}
                      />
                    </div>
                    <span className="w-20 text-right text-xs tabular-nums text-text-secondary">
                      {fmtUsd(row.spend)}
                    </span>
                    <span className="w-12 text-right text-xs tabular-nums text-text-tertiary">
                      {row.share.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Full campaign table */}
          <Card padding="none">
            <div className="border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-text-tertiary" />
                <h3 className="text-sm font-semibold text-text-primary">
                  Barcha kampaniyalar ({report.campaigns.length})
                </h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead className="bg-surface-2 text-xs uppercase tracking-wide text-text-tertiary">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Kampaniya</th>
                    <th className="px-4 py-2.5 text-left">Holat</th>
                    <th className="px-4 py-2.5 text-right">Sarf</th>
                    <th className="px-4 py-2.5 text-right">CTR</th>
                    <th className="px-4 py-2.5 text-right">ROAS</th>
                    <th className="px-4 py-2.5 text-right">Konv.</th>
                    <th className="px-4 py-2.5 text-right">Salomatlik</th>
                    <th className="px-4 py-2.5 text-left">Belgilar</th>
                  </tr>
                </thead>
                <tbody>
                  {report.campaigns.map((c) => (
                    <tr key={c.id} className="border-t border-border/60 hover:bg-surface-2/40">
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-text-primary truncate max-w-[260px]" title={c.name}>
                          {c.name}
                        </p>
                        <p className="text-[10px] text-text-tertiary">
                          {c.objective?.replace('OUTCOME_', '').toLowerCase() ?? '—'}
                        </p>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold',
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
                          )}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">
                        {fmtUsd(c.spend)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">
                        {fmtPct(c.ctr)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        <span className={c.roas >= 1 ? 'text-emerald-600 dark:text-emerald-400' : c.roas > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-text-tertiary'}>
                          {c.roas > 0 ? `${c.roas.toFixed(2)}x` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">
                        {c.conversions}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={cn('font-bold tabular-nums', scoreColor(c.health))}>
                          {c.health}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {c.flags.slice(0, 3).map((flag) => {
                            const label = FLAG_LABELS[flag]
                            if (!label) return null
                            return (
                              <span
                                key={flag}
                                className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', label.cls)}
                              >
                                {label.label}
                              </span>
                            )
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {report.campaigns.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-text-tertiary">
                        Hisob ulangan, lekin bu davrda kampaniya yo&apos;q. Ad Launcher orqali
                        birinchi kampaniyangizni yarating.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

function StatBlock({
  label,
  value,
  positive,
  deltaPct,
  upIsGood,
}: {
  label: string
  value: string
  positive?: boolean
  /** Period-over-period delta as a percentage. Null when prior is 0. */
  deltaPct?: number | null
  /** Whether an upward move is the "good" direction for this metric. */
  upIsGood?: boolean
}) {
  // For metrics like CPC, an upward move is bad; CPC is treated as the
  // default direction (upIsGood = false).
  const isGood =
    deltaPct == null || deltaPct === 0
      ? null
      : upIsGood
        ? deltaPct > 0
        : deltaPct < 0
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-2.5">
      <p className="text-[10px] uppercase tracking-wide text-text-tertiary">{label}</p>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <p
          className={cn(
            'text-base font-bold tabular-nums',
            positive === true && 'text-emerald-600 dark:text-emerald-400',
            positive === false && 'text-rose-600 dark:text-rose-400',
            positive === undefined && 'text-text-primary',
          )}
        >
          {value}
        </p>
        {deltaPct != null && deltaPct !== 0 && (
          <span
            className={cn(
              'inline-flex items-center text-[10px] font-semibold tabular-nums',
              isGood === true && 'text-emerald-600 dark:text-emerald-400',
              isGood === false && 'text-rose-600 dark:text-rose-400',
            )}
            title={`${deltaPct > 0 ? '+' : ''}${deltaPct.toFixed(1)}% vs avvalgi davr`}
          >
            {deltaPct > 0 ? (
              <ArrowUp className="h-2.5 w-2.5" />
            ) : (
              <ArrowDown className="h-2.5 w-2.5" />
            )}
            {Math.abs(deltaPct).toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  )
}

function FindingCard({
  finding,
  expanded,
  onToggle,
}: {
  finding: Finding
  expanded: boolean
  onToggle: () => void
}) {
  const style = SEVERITY_STYLE[finding.severity]
  const Icon = style.Icon
  return (
    <div className={cn('rounded-xl border', style.ring, style.bg)}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 p-3 text-left"
      >
        <span className={cn('mt-0.5 shrink-0', style.text)}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('text-[10px] font-bold uppercase tracking-wide', style.text)}>
              {style.label}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-text-tertiary">
              · {CATEGORY_LABEL[finding.category]}
            </span>
          </div>
          <p className="mt-0.5 text-sm font-semibold text-text-primary">
            {finding.title}
          </p>
          {!expanded && (
            <p className="mt-0.5 text-xs text-text-secondary line-clamp-1">
              {finding.detail}
            </p>
          )}
        </div>
        <span className="shrink-0 text-text-tertiary">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>
      {expanded && (
        <div className="border-t border-border/40 px-3 py-3 text-sm text-text-secondary">
          <p>{finding.detail}</p>
          {finding.fix && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-surface p-2.5">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-mid dark:text-brand-lime" />
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wide text-text-tertiary">
                  Tavsiya
                </p>
                <p className="mt-0.5 text-xs text-text-primary">{finding.fix}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CampaignList({
  title,
  icon,
  campaigns,
  emptyMsg,
}: {
  title: string
  icon: React.ReactNode
  campaigns: Campaign[]
  emptyMsg: string
}) {
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-text-tertiary">{icon}</span>
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      {campaigns.length === 0 ? (
        <p className="py-4 text-center text-xs text-text-tertiary">{emptyMsg}</p>
      ) : (
        <ul className="space-y-2">
          {campaigns.slice(0, 5).map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-lg border border-border/60 bg-surface-2/40 p-2.5 text-xs"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-text-primary">{c.name}</p>
                <p className="text-text-tertiary">
                  {c.status} · {c.conversions} konv · CTR {fmtPct(c.ctr)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold tabular-nums text-text-primary">
                  {fmtUsd(c.spend)}
                </p>
                {c.roas > 0 && (
                  <p
                    className={cn(
                      'text-[10px] tabular-nums',
                      c.roas >= 1
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400',
                    )}
                  >
                    ROAS {c.roas.toFixed(2)}x
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
