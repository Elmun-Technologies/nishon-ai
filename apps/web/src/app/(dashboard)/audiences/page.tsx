'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AGENT_MODE } from '@/lib/agent-mode'
import { AutomatedByAgent } from '@/components/ui/AutomatedByAgent'
import {
  Link2,
  Loader2,
  Plug,
  RefreshCcw,
  Sparkles,
  Users,
} from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { Alert, Button, Card, PageHeader } from '@/components/ui'
import { Dialog } from '@/components/ui/Dialog'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { meta as metaApi } from '@/lib/api-client'
import { connectMeta } from '@/lib/meta'
import { cn } from '@/lib/utils'

type MetaAudience = {
  id: string
  name: string
  description: string | null
  subtype: string
  approximateCount: number | null
  deliveryStatus: string | null
  timeCreated: string | null
  accountId: string
}

const SUBTYPE_LABELS: Record<string, string> = {
  CUSTOM: 'Custom',
  LOOKALIKE: 'Lookalike',
  WEBSITE: 'Veb-sayt',
  ENGAGEMENT: 'Engagement',
  APP: 'Ilova',
  VIDEO: 'Video',
  CLAIM: 'Claim',
}

const COUNTRY_OPTIONS = [
  { code: 'UZ', label: "O'zbekiston" },
  { code: 'KZ', label: "Qozog'iston" },
  { code: 'RU', label: 'Rossiya' },
  { code: 'KG', label: "Qirg'iziston" },
  { code: 'TJ', label: 'Tojikiston' },
  { code: 'TR', label: 'Turkiya' },
  { code: 'US', label: 'AQSh' },
  { code: 'GB', label: 'Birlashgan Qirollik' },
]

function formatCount(n: number | null): string {
  if (n == null || n === 0) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export default function AudiencesPage() {
  // Frozen in autonomous AI Agent mode — the agent builds audiences per funnel stage.
  if (AGENT_MODE) return <AutomatedByAgent module="audienceBuilder" />
  return <AudiencesPageInner />
}

function AudiencesPageInner() {

  const { t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()
  const workspaceId = currentWorkspace?.id

  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(true)
  const [audiences, setAudiences] = useState<MetaAudience[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'custom' | 'lookalike'>('all')

  // Lookalike modal state
  const [lalOpen, setLalOpen] = useState(false)
  const [lalSource, setLalSource] = useState<MetaAudience | null>(null)
  const [lalName, setLalName] = useState('')
  const [lalCountry, setLalCountry] = useState('UZ')
  const [lalRatio, setLalRatio] = useState(0.03)
  const [lalBusy, setLalBusy] = useState(false)
  const [lalError, setLalError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data } = await metaApi.audiences(workspaceId)
      setConnected(data.connected)
      setAudiences(data.audiences)
    } catch (e: any) {
      // A load failure most likely means the Meta connection is missing or
      // broken — route to the connect/error path instead of rendering the
      // "no audiences yet" empty state as if everything were fine.
      setConnected(false)
      setError(e?.message ?? 'Auditoriya ro\'yxatini yuklab bo\'lmadi.')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    if (filter === 'all') return audiences
    return audiences.filter((a) =>
      filter === 'lookalike' ? a.subtype === 'LOOKALIKE' : a.subtype !== 'LOOKALIKE',
    )
  }, [audiences, filter])

  const counts = useMemo(
    () => ({
      total: audiences.length,
      custom: audiences.filter((a) => a.subtype !== 'LOOKALIKE').length,
      lookalike: audiences.filter((a) => a.subtype === 'LOOKALIKE').length,
    }),
    [audiences],
  )

  const openLookalike = (source: MetaAudience) => {
    setLalSource(source)
    setLalName(`${source.name} — LAL ${Math.round(lalRatio * 100)}% ${lalCountry}`)
    setLalError(null)
    setLalOpen(true)
  }

  const createLookalike = async () => {
    if (!workspaceId || !lalSource) return
    setLalBusy(true)
    setLalError(null)
    try {
      await metaApi.createLookalike({
        workspaceId,
        adAccountId: lalSource.accountId,
        name: lalName,
        sourceAudienceId: lalSource.id,
        country: lalCountry,
        ratio: lalRatio,
      })
      setLalOpen(false)
      setLalSource(null)
      await load()
    } catch (e: any) {
      setLalError(e?.message ?? 'Lookalike yaratib bo\'lmadi.')
    } finally {
      setLalBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-8">
      <PageHeader
        title={t('audiences.title', 'Auditoriyalar')}
        subtitle={t(
          'audiences.subtitle',
          "Meta hisobingizdagi Custom va Lookalike auditoriyalarni boshqaring. Bu yerdan yangi lookalike yaratib, Ad Launcher orqali kampaniyaga qo'llashingiz mumkin.",
        )}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={load}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Yangilash
          </Button>
        }
      />

      {error && <Alert variant="error">{error}</Alert>}

      {!workspaceId && (
        <Alert variant="warning">
          Workspace tanlanmagan. Iltimos, yuqoridan workspace tanlang.
        </Alert>
      )}

      {workspaceId && !loading && !connected && (
        <Card className="border-dashed bg-surface-2/40">
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-mid/15">
              <Plug className="h-7 w-7 text-brand-mid dark:text-brand-lime" />
            </span>
            <h3 className="text-base font-semibold text-text-primary">
              Meta hisobini ulang
            </h3>
            <p className="max-w-md text-sm text-text-secondary">
              Auditoriyalarni boshqarish uchun avval Meta Business hisobingizni
              ulashingiz kerak. Ulanganidan keyin Meta'dagi barcha Custom va
              Lookalike auditoriyalar bu yerda paydo bo'ladi.
            </p>
            <Button onClick={() => connectMeta(workspaceId)} className="mt-2 gap-1.5">
              <Link2 className="h-4 w-4" />
              Meta'ni ulash
            </Button>
          </div>
        </Card>
      )}

      {workspaceId && connected && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Jami auditoriyalar" value={counts.total} />
            <StatCard label="Custom Audiences" value={counts.custom} />
            <StatCard label="Lookalike Audiences" value={counts.lookalike} />
          </div>

          <Card padding="sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-1.5">
                {(
                  [
                    ['all', 'Hammasi', counts.total],
                    ['custom', 'Custom', counts.custom],
                    ['lookalike', 'Lookalike', counts.lookalike],
                  ] as const
                ).map(([key, label, count]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-sm transition-colors',
                      filter === key
                        ? 'border-brand-mid bg-brand-mid/10 text-brand-mid dark:text-brand-lime'
                        : 'border-border bg-surface-2 text-text-secondary hover:border-brand-mid/40',
                    )}
                  >
                    {label}{' '}
                    <span className="ml-1 text-xs text-text-tertiary">{count}</span>
                  </button>
                ))}
              </div>
              <Link
                href="/ad-launcher"
                className="text-sm font-medium text-brand-mid hover:underline dark:text-brand-lime"
              >
                Ad Launcher'da ishlatish →
              </Link>
            </div>
          </Card>

          {loading && (
            <Card>
              <div className="flex items-center justify-center gap-2 py-10 text-text-tertiary">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Auditoriyalar yuklanmoqda…</span>
              </div>
            </Card>
          )}

          {!loading && filtered.length === 0 && (
            <Card className="border-dashed">
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Users className="h-10 w-10 text-text-tertiary" />
                <p className="text-sm font-medium text-text-primary">
                  Hali auditoriya yo'q
                </p>
                <p className="max-w-sm text-xs text-text-tertiary">
                  Meta'da Custom Audience yarating yoki mavjudidan Lookalike
                  yaratib boshlang. Meta Ads Manager'da yaratilganlar bu yerda
                  avtomatik paydo bo'ladi.
                </p>
              </div>
            </Card>
          )}

          {!loading && filtered.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((a) => (
                <AudienceCard
                  key={a.id}
                  audience={a}
                  onLookalike={() => openLookalike(a)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <Dialog
        open={lalOpen}
        onClose={() => setLalOpen(false)}
        title="Lookalike Audience yaratish"
        className="max-w-lg"
      >
        {lalSource && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-surface-2 p-3">
              <p className="text-xs text-text-tertiary">Manba auditoriya</p>
              <p className="mt-0.5 text-sm font-semibold text-text-primary">
                {lalSource.name}
              </p>
              <p className="mt-0.5 text-xs text-text-tertiary">
                {SUBTYPE_LABELS[lalSource.subtype] ?? lalSource.subtype} ·{' '}
                {formatCount(lalSource.approximateCount)} foydalanuvchi
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-text-tertiary">
                Yangi auditoriya nomi
              </label>
              <input
                type="text"
                value={lalName}
                onChange={(e) => setLalName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-text-tertiary">
                  Mamlakat
                </label>
                <select
                  value={lalCountry}
                  onChange={(e) => setLalCountry(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                >
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-text-tertiary">
                  Lookalike %: {Math.round(lalRatio * 100)}%
                </label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={Math.round(lalRatio * 100)}
                  onChange={(e) => setLalRatio(Number(e.target.value) / 100)}
                  className="mt-2 w-full accent-brand-mid"
                />
                <p className="mt-1 text-[10px] text-text-tertiary">
                  Past % = aniqroq · Yuqori % = ko'proq odam
                </p>
              </div>
            </div>

            {lalError && <Alert variant="error">{lalError}</Alert>}

            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setLalOpen(false)}
                disabled={lalBusy}
              >
                Bekor qilish
              </Button>
              <Button
                size="sm"
                onClick={createLookalike}
                disabled={lalBusy || !lalName.trim()}
                className="gap-1.5"
              >
                {lalBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                <Sparkles className="h-4 w-4" />
                Yaratish
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-xs text-text-tertiary">{label}</p>
      <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
    </div>
  )
}

function AudienceCard({
  audience,
  onLookalike,
}: {
  audience: MetaAudience
  onLookalike: () => void
}) {
  const isLookalike = audience.subtype === 'LOOKALIKE'
  return (
    <div className="group flex flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
            isLookalike
              ? 'bg-brand-mid/15 text-brand-mid dark:text-brand-lime'
              : 'bg-surface-2 text-text-tertiary',
          )}
        >
          {SUBTYPE_LABELS[audience.subtype] ?? audience.subtype}
        </span>
        <span className="text-xs text-text-tertiary">
          {formatCount(audience.approximateCount)}
        </span>
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-text-primary">
        {audience.name}
      </h3>
      {audience.description && (
        <p className="mt-1 line-clamp-2 text-xs text-text-tertiary">
          {audience.description}
        </p>
      )}
      <div className="mt-auto flex items-center justify-between pt-3">
        <span className="text-[10px] text-text-tertiary">
          {audience.accountId}
        </span>
        {!isLookalike && (
          <button
            type="button"
            onClick={onLookalike}
            className="text-xs font-medium text-brand-mid opacity-0 transition-opacity group-hover:opacity-100 hover:underline dark:text-brand-lime"
          >
            + Lookalike
          </button>
        )}
      </div>
    </div>
  )
}
