'use client'

import { useCallback, useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { retargetBridge, type RetargetSignalsResponse } from '@/lib/api-client'
import { cn } from '@/lib/utils'

const LS_AD = 'retarget_meta_ad_account_id'
const LS_PAGE = 'retarget_meta_page_id'
const LS_META = 'retarget_meta_access_token'

export default function RetargetBridgePage() {
  const [data, setData] = useState<RetargetSignalsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)
  const [publishing, setPublishing] = useState<null | { kind: 'meta' | 'tg'; phone: string }>(null)

  const [adAccountId, setAdAccountId] = useState('')
  const [pageId, setPageId] = useState('')
  const [metaAccessToken, setMetaAccessToken] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    setAdAccountId(localStorage.getItem(LS_AD) ?? '')
    setPageId(localStorage.getItem(LS_PAGE) ?? '')
    setMetaAccessToken(localStorage.getItem(LS_META) ?? '')
  }, [])

  const persistMetaForm = () => {
    if (typeof window === 'undefined') return
    localStorage.setItem(LS_AD, adAccountId.trim())
    localStorage.setItem(LS_PAGE, pageId.trim())
    localStorage.setItem(LS_META, metaAccessToken.trim())
  }

  const load = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await retargetBridge.signals()
      setData(res.data)
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Yuklash xatosi'
      setError(msg)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const onStart = async (phoneDigits: string) => {
    setStarting(phoneDigits)
    try {
      await retargetBridge.start(phoneDigits)
      await load()
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Xato'
      setError(msg)
    } finally {
      setStarting(null)
    }
  }

  const onPublishAdset = async (phoneDigits: string) => {
    persistMetaForm()
    if (!adAccountId.trim() || !pageId.trim()) {
      setError('Ad Account ID va Page ID majburiy.')
      return
    }
    if (!metaAccessToken.trim()) {
      setError('Meta access token kerak (pastdagi maydon yoki cookie meta_access_token).')
      return
    }
    setPublishing({ kind: 'meta', phone: phoneDigits })
    setError(null)
    try {
      await retargetBridge.publishAdset(
        {
          phoneDigits,
          adAccountId: adAccountId.trim(),
          pageId: pageId.trim(),
        },
        metaAccessToken.trim(),
      )
      await load()
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Meta xatosi'
      setError(msg)
      await load()
    } finally {
      setPublishing(null)
    }
  }

  const onPublishTelegram = async (phoneDigits: string) => {
    setPublishing({ kind: 'tg', phone: phoneDigits })
    setError(null)
    try {
      await retargetBridge.publishTelegram({ phoneDigits })
      await load()
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Telegram xatosi'
      setError(msg)
      await load()
    } finally {
      setPublishing(null)
    }
  }

  const s = data?.summary

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <PageHeader
        title="Retarget — Signal Bridge"
        subtitle="Redis → mapping → Meta AdSet + Telegram xabar (bir xil unified hash). Telegram: bot /start phone=998… → webhook."
        actions={
          <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
            Yangilash
          </Button>
        }
      />

      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="grid gap-3 rounded-2xl border border-border bg-surface-1 p-4 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-text-secondary">Meta Ad Account ID</span>
          <input
            className="rounded-lg border border-border bg-white px-3 py-2 text-text-primary dark:bg-slate-950"
            placeholder="act_… yoki raqam"
            value={adAccountId}
            onChange={(e) => setAdAccountId(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-text-secondary">Facebook Page ID</span>
          <input
            className="rounded-lg border border-border bg-white px-3 py-2 text-text-primary dark:bg-slate-950"
            placeholder="Page ID"
            value={pageId}
            onChange={(e) => setPageId(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm md:col-span-1">
          <span className="text-text-secondary">Meta access token (ixtiyoriy)</span>
          <input
            className="rounded-lg border border-border bg-white px-3 py-2 font-mono text-xs text-text-primary dark:bg-slate-950"
            placeholder="EAA… (cookie bo‘lmasa)"
            value={metaAccessToken}
            onChange={(e) => setMetaAccessToken(e.target.value)}
            autoComplete="off"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Signal kutmoqda (7 kun to‘lmagan)" value={s?.waitingSignals ?? 0} hint="Redis: pending" />
        <StatCard label="Retarget active" value={s?.activeRetargets ?? 0} hint="Job yoki qo‘lda start" />
        <StatCard
          label="Convert (qayta sotib olish)"
          value={s?.converted ?? 0}
          hint={s != null ? `${s.convertRatePct}%` : undefined}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface-1">
        <div className="border-b border-border p-4 font-semibold text-text-primary">Retarget navbati</div>
        {loading ? (
          <div className="p-8 text-center text-text-secondary">Yuklanmoqda…</div>
        ) : !data?.rows?.length ? (
          <div className="p-8 text-center text-text-secondary">
            Hozircha signal yo‘q. Webhook:{' '}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 text-sm">POST /api/crm/click</code> —{' '}
            <code className="text-sm">productId</code> masalan &quot;Krossovka Nike&quot;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-border bg-surface-2/50 text-text-secondary">
                <tr>
                  <th className="px-4 py-3 font-medium">Phone / hash</th>
                  <th className="px-4 py-3 font-medium">Oxirgi mahsulot</th>
                  <th className="px-4 py-3 font-medium">Kun</th>
                  <th className="px-4 py-3 font-medium">Kanallar</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.rows.map((row) => (
                  <tr key={row.phoneDigits} className="align-middle">
                    <td className="px-4 py-3">
                      <div className="font-medium text-text-primary">{row.phone}</div>
                      <div className="text-xs text-text-tertiary">{row.headlinePreview}</div>
                      {row.unifiedHash ? (
                        <div className="mt-0.5 font-mono text-[11px] text-text-tertiary">{row.unifiedHash}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{row.productId}</td>
                    <td className="px-4 py-3">
                      <div className="text-text-primary">{row.daysSincePurchase}</div>
                      {row.waitLabel ? (
                        <div className="text-xs text-amber-600 dark:text-amber-400">{row.waitLabel}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <ChannelPill ok={row.metaChannelReady} label="Meta ready" />
                        <ChannelPill ok={row.telegramChannelReady} label="Telegram ready" />
                        {row.telegramLinked ? (
                          <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-800 dark:text-sky-200">
                            TG ulangan
                          </span>
                        ) : (
                          <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-text-tertiary">
                            TG yo‘q
                          </span>
                        )}
                        {row.unifiedBadge ? (
                          <span className="rounded-full border border-violet-500/40 bg-violet-500/15 px-2 py-0.5 text-[11px] font-semibold text-violet-800 dark:text-violet-200">
                            Unified
                          </span>
                        ) : null}
                      </div>
                      {row.telegramLastError ? (
                        <div className="mt-1 max-w-[220px] text-[11px] text-red-600 dark:text-red-400">
                          TG: {row.telegramLastError}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-xs font-medium',
                            row.repeatPurchasesAfterRetarget > 0 &&
                              'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                            row.repeatPurchasesAfterRetarget === 0 &&
                              row.status === 'pending' &&
                              'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
                            row.repeatPurchasesAfterRetarget === 0 &&
                              row.status === 'active' &&
                              'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200',
                          )}
                        >
                          {row.status}
                        </span>
                        {row.status === 'pending' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={starting === row.phoneDigits}
                            onClick={() => void onStart(row.phoneDigits)}
                          >
                            {starting === row.phoneDigits ? '…' : '7 kunni o‘tkazib yuborish'}
                          </Button>
                        ) : null}
                        {row.metaAdSetId ? (
                          <a
                            className="text-xs font-medium text-primary underline"
                            href={`https://www.facebook.com/adsmanager/manage/adsets?act=${encodeURIComponent(adAccountId.replace(/^act_/, ''))}&selected_adset_ids=${row.metaAdSetId}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            AdSet
                          </a>
                        ) : row.canPublishAdSet ? (
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={publishing?.kind === 'meta' && publishing.phone === row.phoneDigits}
                            onClick={() => void onPublishAdset(row.phoneDigits)}
                          >
                            {publishing?.kind === 'meta' && publishing.phone === row.phoneDigits ? '…' : 'Meta AdSet'}
                          </Button>
                        ) : null}
                        {row.canPublishTelegram ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={publishing?.kind === 'tg' && publishing.phone === row.phoneDigits}
                            onClick={() => void onPublishTelegram(row.phoneDigits)}
                          >
                            {publishing?.kind === 'tg' && publishing.phone === row.phoneDigits ? '…' : 'Telegram'}
                          </Button>
                        ) : null}
                        {!row.metaAdSetId && !row.canPublishAdSet && !row.canPublishTelegram ? (
                          <span className="text-xs text-text-tertiary">—</span>
                        ) : null}
                      </div>
                      {row.metaPublishError ? (
                        <div className="mt-1 max-w-xs text-xs text-red-600 dark:text-red-400">{row.metaPublishError}</div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Alert variant="info">
        <strong>CRM real revenue:</strong>{' '}
        <code className="text-sm">POST /api/crm/click</code>, <code className="text-sm">POST /api/crm/payme</code>,{' '}
        <code className="text-sm">POST /api/crm/uzum</code>, <code className="text-sm">POST /api/crm/touch</code>,{' '}
        <code className="text-sm">POST /api/crm/sheets-sync</code>, <code className="text-sm">GET /api/crm/summary</code> —{' '}
        <code className="text-sm">{'{ "phone":"+998…", "amount":299000, "product_id":"…", "order_id":"…" }'}</code>. Header:{' '}
        <code className="text-sm">x-crm-webhook-secret</code> (<code className="text-sm">CRM_WEBHOOK_SECRET</code>).{' '}
        <strong>Telegram:</strong> <code className="text-sm">POST /api/telegram/webhook</code> —{' '}
        <code className="text-sm">/buy 299000 Krossovka camp_ig_1</code>. Env:{' '}
        <code className="text-sm">TELEGRAM_BOT_TOKEN</code>, <code className="text-sm">TELEGRAM_WEBHOOK_SECRET</code>,{' '}
        <code className="text-sm">TELEGRAM_ALERT_SECRET</code>, <code className="text-sm">POST /api/telegram/alert</code>,{' '}
        <code className="text-sm">TELEGRAM_CRM_GROUP_CHAT_ID</code>, <code className="text-sm">RETARGET_TELEGRAM_SHOP_URL</code>.{' '}
        <strong>Meta test:</strong> <code className="text-sm">RETARGET_META_DRY_RUN=true</code>.
      </Alert>
    </div>
  )
}

function StatCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4">
      <div className="text-sm text-text-secondary">{label}</div>
      <div className="mt-1 text-2xl font-bold text-text-primary">{value}</div>
      {hint ? <div className="mt-1 text-xs text-text-tertiary">{hint}</div> : null}
    </div>
  )
}

function ChannelPill({ ok, label }: { ok?: boolean; label: string }) {
  return (
    <span
      className={cn(
        'rounded-full border px-2 py-0.5 text-[11px] font-medium',
        ok
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
          : 'border-border text-text-tertiary',
      )}
    >
      {label}
      {ok ? ' ✓' : ''}
    </span>
  )
}
