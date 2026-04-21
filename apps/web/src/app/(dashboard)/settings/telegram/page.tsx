'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Send } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { useI18n } from '@/i18n/use-i18n'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { workspaces as workspacesApi } from '@/lib/api-client'

const TG_PREFS_KEY = 'adspectr-telegram-alert-prefs'

type Prefs = {
  roasDrop: boolean
  budget80: boolean
  competitor: boolean
  daily2100: boolean
}

const defaultPrefs: Prefs = {
  roasDrop: true,
  budget80: true,
  competitor: true,
  daily2100: false,
}

function loadPrefs(): Prefs {
  if (typeof window === 'undefined') return defaultPrefs
  try {
    const r = JSON.parse(localStorage.getItem(TG_PREFS_KEY) ?? '{}') as Partial<Prefs>
    return { ...defaultPrefs, ...r }
  } catch {
    return defaultPrefs
  }
}

function savePrefs(p: Prefs) {
  if (typeof window === 'undefined') return
  localStorage.setItem(TG_PREFS_KEY, JSON.stringify(p))
}

export default function TelegramSettingsPage() {
  const { t } = useI18n()
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore()
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs)
  const [hydrated, setHydrated] = useState(false)
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [deepLink, setDeepLink] = useState<string | null>(null)
  const [linking, setLinking] = useState(false)
  const [connected, setConnected] = useState(false)
  const [msg, setMsg] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const linkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const linkDoneRef = useRef(false)

  useEffect(() => {
    setPrefs(loadPrefs())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!currentWorkspace) return
    setConnected(Boolean(currentWorkspace.telegramChatId?.trim()))
  }, [currentWorkspace])

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const startLink = useCallback(async () => {
    setMsg('')
    setLinking(true)
    linkDoneRef.current = false
    if (linkTimeoutRef.current) clearTimeout(linkTimeoutRef.current)
    stopPoll()
    try {
      const res = await fetch('/api/telegram/link-token', { method: 'POST' })
      const data = (await res.json()) as { ok?: boolean; token?: string; deepLink?: string }
      if (!data.ok || !data.token || !data.deepLink) {
        setMsg(t('settingsTelegram.tokenFail', 'Token yaratilmadi'))
        setLinking(false)
        return
      }
      setLinkToken(data.token)
      setDeepLink(data.deepLink)
      window.open(data.deepLink, '_blank', 'noopener,noreferrer')
      pollRef.current = setInterval(async () => {
        const st = await fetch(`/api/telegram/link-status?token=${encodeURIComponent(data.token!)}`).then((r) => r.json() as Promise<{ status?: string; chatId?: string }>)
        if (st.status === 'linked' && st.chatId && currentWorkspace?.id) {
          linkDoneRef.current = true
          if (linkTimeoutRef.current) {
            clearTimeout(linkTimeoutRef.current)
            linkTimeoutRef.current = null
          }
          stopPoll()
          try {
            await workspacesApi.update(currentWorkspace.id, { telegramChatId: st.chatId } as any)
            setCurrentWorkspace({ ...currentWorkspace, telegramChatId: st.chatId })
            await fetch('/api/telegram/link-ack', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: data.token }),
            }).catch(() => {})
            setConnected(true)
            setLinkToken(null)
            setDeepLink(null)
            setMsg(t('settingsTelegram.linkedOk', "Telegram ulandi — chat_id saqlandi."))
          } catch {
            setMsg(t('settingsTelegram.saveFail', 'Chat ID saqlanmadi (API)'))
          } finally {
            setLinking(false)
          }
        }
      }, 2000)
      linkTimeoutRef.current = setTimeout(() => {
        linkTimeoutRef.current = null
        stopPoll()
        setLinking(false)
        if (!linkDoneRef.current) {
          setMsg(t('settingsTelegram.pollTimeout', "Vaqt tugadi — /start ni botda qayta bosing yoki qayta urinib ko'ring."))
        }
      }, 120_000)
    } catch {
      setMsg(t('settingsTelegram.network', 'Tarmoq xatosi'))
      setLinking(false)
    }
  }, [currentWorkspace, setCurrentWorkspace, stopPoll, t])

  useEffect(() => {
    return () => {
      stopPoll()
      if (linkTimeoutRef.current) clearTimeout(linkTimeoutRef.current)
    }
  }, [stopPoll])

  const togglePref = (key: keyof Prefs) => {
    setPrefs((p) => {
      const n = { ...p, [key]: !p[key] }
      savePrefs(n)
      return n
    })
  }

  const disconnect = async () => {
    if (!currentWorkspace?.id) return
    try {
      await workspacesApi.update(currentWorkspace.id, { telegramChatId: null } as any)
      setCurrentWorkspace({ ...currentWorkspace, telegramChatId: null })
      setConnected(false)
      setMsg(t('settingsTelegram.disconnected', 'Telegram uzildi.'))
    } catch {
      setMsg(t('settingsTelegram.disconnectFail', 'Uzilmadi'))
    }
  }

  if (!hydrated) {
    return <div className="max-w-2xl mx-auto p-6 text-sm text-text-secondary">…</div>
  }

  const bot = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? 'yourapp_bot').replace(/^@/, '')

  return (
    <div className="max-w-2xl mx-auto pb-12 px-4">
      <PageHeader
        className="mb-6"
        title={t('settingsTelegram.title', 'Telegram')}
        subtitle={t(
          'settingsTelegram.subtitle',
          "Alertlar, /roas, /pause — targetologlar uchun. Webhook: /api/telegram/webhook",
        )}
        actions={
          <Button asChild variant="secondary" className="rounded-xl">
            <Link href="/settings">{t('settingsTelegram.back', 'Sozlamalar')}</Link>
          </Button>
        }
      />

      {msg ? (
        <Alert variant="info" className="mb-4">
          {msg}
        </Alert>
      ) : null}

      <Card className="p-6 border-border/80">
        {!connected ? (
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-sky-500/20 flex items-center justify-center text-2xl" aria-hidden>
                ✈️
              </div>
              <div>
                <h2 className="font-semibold text-text-primary">{t('settingsTelegram.connectTitle', 'Botni ulash')}</h2>
                <p className="text-sm text-text-secondary mt-0.5">
                  {t('settingsTelegram.connectDesc', 'Deep link: 2 soniyada ochiladi, /start bilan chat_id bog‘lanadi.')}
                </p>
              </div>
            </div>

            <Button className="w-full rounded-xl py-6 text-base font-semibold gap-2" onClick={() => void startLink()} disabled={linking || !currentWorkspace}>
              <Send className="w-5 h-5" aria-hidden />
              {linking ? t('settingsTelegram.linking', 'Kutilmoqda…') : t('settingsTelegram.connectCta', 'Ulash (Telegram ochiladi)')}
            </Button>

            {deepLink ? (
              <p className="mt-3 text-xs font-mono text-text-tertiary break-all">{deepLink}</p>
            ) : (
              <p className="mt-3 text-xs text-text-tertiary">
                Bot: <span className="font-mono text-text-secondary">@{bot}</span> · token:{' '}
                <span className="font-mono">{linkToken ?? '—'}</span>
              </p>
            )}

            {!currentWorkspace ? (
              <p className="mt-2 text-xs text-amber-600">{t('settingsTelegram.needWs', 'Avval workspace tanlang.')}</p>
            ) : null}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 font-bold">✓</div>
                <div>
                  <p className="font-medium text-text-primary">{t('settingsTelegram.connected', 'Ulangan')}</p>
                  <p className="text-sm text-text-tertiary font-mono">
                    chat_id: {currentWorkspace.telegramChatId ?? '—'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" className="text-red-500 rounded-xl" onClick={() => void disconnect()}>
                {t('settingsTelegram.disconnect', 'Uzish')}
              </Button>
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              {(
                [
                  ['roasDrop', t('settingsTelegram.prefRoas', 'ROAS tushsa')] as const,
                  ['budget80', t('settingsTelegram.prefBudget', 'Budget ~80%')] as const,
                  ['competitor', t('settingsTelegram.prefCompetitor', 'Raqib yangi ad')] as const,
                  ['daily2100', t('settingsTelegram.prefDaily', 'Kunlik hisobot 21:00')] as const,
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-text-primary">{label}</span>
                  <button
                    type="button"
                    onClick={() => togglePref(key)}
                    className={cnToggle(prefs[key])}
                    aria-pressed={prefs[key]}
                  >
                    <span className={cnKnob(prefs[key])} />
                  </button>
                </label>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-5 mt-6 border-amber-500/25 bg-amber-500/5">
        <p className="text-sm text-text-secondary">
          <strong className="text-text-primary">{t('settingsTelegram.tipTitle', 'Maslahat')}:</strong>{' '}
          {t('settingsTelegram.tipBody', 'Telegramda «/roas» yozing — 3 soniyada javob. Retention uchun muhim.')}
        </p>
      </Card>

      <Card className="p-5 mt-6 border-border/80 text-xs text-text-tertiary space-y-1 font-mono">
        <p>POST /api/telegram/webhook</p>
        <p>POST /api/telegram/alert — x-telegram-alert-secret (ixtiyoriy)</p>
        <p>TELEGRAM_BOT_TOKEN · TELEGRAM_WEBHOOK_SECRET · NEXT_PUBLIC_TELEGRAM_BOT_USERNAME</p>
      </Card>
    </div>
  )
}

function cnToggle(on: boolean) {
  return `relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${on ? 'bg-emerald-500/80' : 'bg-surface-2'}`
}

function cnKnob(on: boolean) {
  return `inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`
}
