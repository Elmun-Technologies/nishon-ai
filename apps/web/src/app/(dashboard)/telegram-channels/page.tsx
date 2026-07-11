'use client'

import { useEffect, useState } from 'react'
import {
  BadgeCheck,
  Info,
  Send,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { telegramChannels, type TelegramChannel } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { cn } from '@/lib/utils'

const nf = new Intl.NumberFormat('en-US')

function fitTone(score: number): string {
  if (score >= 75) return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
  if (score >= 50) return 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
  return 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
}

/**
 * Telegram channel ad agent — discovers + ranks channels for hyper-local
 * placement (the actual buy is a manual admin negotiation). Prices are labelled
 * "taxminiy" (estimated) — never presented as real quotes. When TGSTAT_API_KEY
 * is unset the API returns 503 and we show an honest "not configured" state.
 */
export default function TelegramChannelsPage() {
  const { currentWorkspace } = useWorkspaceStore()
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [niche, setNiche] = useState('')
  const [country, setCountry] = useState('UZ')
  const [budget, setBudget] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [channels, setChannels] = useState<TelegramChannel[] | null>(null)
  const [aiAnnotated, setAiAnnotated] = useState(false)

  useEffect(() => {
    telegramChannels
      .status()
      .then((res) => setConfigured(res.data.configured))
      .catch(() => setConfigured(false))
  }, [])

  const run = async () => {
    if (niche.trim().length < 2) return
    setLoading(true)
    setError('')
    setChannels(null)
    try {
      const res = await telegramChannels.recommend({
        workspaceId: currentWorkspace?.id,
        niche: niche.trim(),
        country: country.trim() || undefined,
        monthlyBudgetUsd: budget ? Math.max(1, Number(budget) || 0) : undefined,
      })
      setChannels(res.data.channels)
      setAiAnnotated(res.data.aiAnnotated)
    } catch (err: any) {
      const status = err?.response?.status
      setError(
        status === 503
          ? 'not_configured'
          : err?.response?.data?.message ||
              err?.message ||
              'Qidiruv bajarilmadi. Qayta urinib ko\'ring.',
      )
    } finally {
      setLoading(false)
    }
  }

  const notConfigured = configured === false || error === 'not_configured'

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-text-primary">
          <Send className="h-5 w-5 text-[#229ED9]" aria-hidden />
          Telegram kanallar
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Nishangizga mos Telegram kanallarni toping — obunachi, qamrov, faollik va mos kelish
          bahosi bo&apos;yicha saralangan. Reklama joylashuvi kanal admini bilan kelishiladi.
        </p>
      </div>

      {notConfigured ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-5">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-semibold">Hali sozlanmagan</p>
            <p className="mt-1">
              Telegram kanallarni qidirish uchun administrator serverda{' '}
              <code className="rounded bg-amber-500/20 px-1 py-0.5 font-mono text-xs">
                TGSTAT_API_KEY
              </code>{' '}
              kalitini o&apos;rnatishi kerak. Kalit qo&apos;shilgach, bu sahifa avtomatik ishlaydi —
              hech qanday soxta ma&apos;lumot ko&apos;rsatilmaydi.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Search form */}
          <div className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm dark:bg-surface-elevated/70">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
              <input
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && run()}
                placeholder="Nisha yoki mahsulot (masalan: qishki krossovka)"
                className="w-full rounded-xl border border-border bg-surface-2/60 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-mid/25"
              />
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value.toUpperCase())}
                placeholder="Davlat"
                maxLength={2}
                className="w-24 rounded-xl border border-border bg-surface-2/60 px-3 py-2.5 text-sm uppercase text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-mid/25"
              />
              <input
                value={budget}
                onChange={(e) => setBudget(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="$/oy"
                inputMode="numeric"
                className="w-24 rounded-xl border border-border bg-surface-2/60 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-mid/25"
              />
            </div>
            <button
              type="button"
              onClick={run}
              disabled={loading || niche.trim().length < 2}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-ink px-4 py-2.5 text-sm font-semibold text-brand-lime disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Sparkles className={cn('h-4 w-4', loading && 'animate-pulse')} aria-hidden />
              {loading ? 'Qidirilmoqda…' : 'Kanallarni top'}
            </button>
          </div>

          {error && error !== 'not_configured' && (
            <p className="rounded-xl border border-rose-400/40 bg-rose-400/10 p-3 text-sm text-rose-700 dark:text-rose-300">
              {error}
            </p>
          )}

          {channels && channels.length === 0 && (
            <p className="rounded-xl border border-border/70 bg-surface-2/40 p-4 text-sm text-text-secondary">
              Bu nisha bo&apos;yicha kanal topilmadi. Boshqa kalit so&apos;z bilan urinib ko&apos;ring.
            </p>
          )}

          {channels && channels.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  {channels.length} ta kanal
                </p>
                {!aiAnnotated && (
                  <p className="text-[11px] text-text-tertiary">
                    AI izohi o&apos;chirilgan (kalit yo&apos;q) — faqat metrik saralash
                  </p>
                )}
              </div>
              {channels.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-border/70 bg-surface p-4 shadow-sm dark:bg-surface-elevated/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-text-primary">{c.title}</p>
                        {c.username &&
                          (c.link ? (
                            <a
                              href={c.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 text-xs text-[#229ED9] hover:underline"
                            >
                              @{c.username}
                            </a>
                          ) : (
                            <span className="shrink-0 text-xs text-text-tertiary">@{c.username}</span>
                          ))}
                      </div>
                      {c.category && (
                        <p className="mt-0.5 text-xs text-text-tertiary">{c.category}</p>
                      )}
                    </div>
                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                        fitTone(c.fitScore),
                      )}
                    >
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                      {c.fitScore}/100
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-text-secondary">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-text-tertiary" aria-hidden />
                      {nf.format(c.subscribers)} obunachi
                    </span>
                    {c.avgPostReach != null && (
                      <span className="inline-flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-text-tertiary" aria-hidden />
                        {nf.format(c.avgPostReach)} qamrov/post
                      </span>
                    )}
                    {c.err != null && <span>ER: {c.err}%</span>}
                    {c.estPricePerPostUsd != null && (
                      <span className="font-medium text-text-primary">
                        ~${nf.format(c.estPricePerPostUsd)}/post{' '}
                        <span className="font-normal text-text-tertiary">(taxminiy)</span>
                      </span>
                    )}
                  </div>

                  {c.why && (
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-text-secondary">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-mid dark:text-brand-lime" aria-hidden />
                      {c.why}
                    </p>
                  )}
                </div>
              ))}
              <p className="pt-1 text-[11px] text-text-tertiary">
                Narxlar reklama qamroviga asoslangan taxminiy hisob — haqiqiy narx kanal admini bilan
                kelishiladi.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
