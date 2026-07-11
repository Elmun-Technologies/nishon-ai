'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, ExternalLink, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { platformStatus, type PlatformCapability } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'

/**
 * Activation Center — a single view of which capabilities are live vs. still
 * need a key. Reads real signals from GET /platform/capabilities (booleans only,
 * never key values). As the founder wires in each credential on the server, the
 * matching card flips to "Live" — no fake "connected" states.
 */
export default function ActivationPage() {
  const { currentWorkspace } = useWorkspaceStore()
  const [caps, setCaps] = useState<PlatformCapability[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await platformStatus.capabilities(currentWorkspace?.id)
      setCaps(res.data.capabilities)
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Holatni yuklab bo\'lmadi. Qayta urinib ko\'ring.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace?.id])

  const liveCount = caps?.filter((c) => c.live).length ?? 0
  const total = caps?.length ?? 0

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Faollashtirish markazi</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Qaysi imkoniyatlar yoqilgan (Live) va qaysilari kalit kutayotganini ko&apos;ring. Server
            kalitlari qo&apos;shilgach, mos karta avtomatik &laquo;Live&raquo; bo&apos;ladi — soxta
            holat yo&apos;q.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-2 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden />
          Yangilash
        </button>
      </div>

      {!loading && caps && (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {liveCount}/{total} yoqilgan
          </span>
        </div>
      )}

      {error && (
        <Card>
          <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
        </Card>
      )}

      {loading && !caps ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-2/60" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {caps?.map((c) => (
            <Card key={c.key}>
              <div className="flex items-start gap-3">
                {c.live ? (
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500"
                    aria-hidden
                  />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 shrink-0 text-text-tertiary" aria-hidden />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary">{c.label}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        c.live
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {c.live
                        ? 'Live'
                        : c.scope === 'workspace'
                          ? 'Ulanmagan'
                          : 'Kalit kerak'}
                    </span>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-text-tertiary">
                      {c.scope === 'server' ? 'Server' : 'Workspace'}
                    </span>
                  </div>
                  {!c.live && (
                    <p className="mt-1 text-xs text-text-secondary">{c.hint}</p>
                  )}
                  {c.href && (
                    <Link
                      href={c.href}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      {c.live ? 'Ochish' : 'Sozlash'}
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card variant="outlined" padding="sm">
        <p className="px-2 text-xs leading-relaxed text-text-tertiary">
          Server kalitlari (AI, Reve/FAL, TGStat, Payme, Telegram bot) API serverida (Render)
          o&apos;rnatiladi. Meta hisobi esa har workspace uchun alohida ulanadi. Bu sahifa hech
          qachon kalit qiymatini ko&apos;rsatmaydi — faqat yoqilgan/yoqilmaganini.
        </p>
      </Card>
    </div>
  )
}
