'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, Rocket, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { launchOrchestrator, platformStatus } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { dismissGetStarted, isGetStartedDismissed } from '@/lib/onboarding-v2'
import { cn } from '@/lib/utils'

type Step = {
  key: string
  label: string
  hint: string
  done: boolean
  href: string
  cta: string
}

/**
 * Get Started — a dashboard activation checklist that reflects the workspace's
 * REAL state (never faked) and points to the exact next action. Drives a new
 * founder from zero → first real Meta launch. Hides once every step is done and
 * dismissed, so it never nags a set-up account.
 */
export function GetStartedChecklist() {
  const { currentWorkspace } = useWorkspaceStore()
  const [aiLive, setAiLive] = useState<boolean | null>(null)
  const [metaLive, setMetaLive] = useState<boolean | null>(null)
  const [hasLaunch, setHasLaunch] = useState<boolean | null>(null)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    setDismissed(isGetStartedDismissed())
  }, [])

  useEffect(() => {
    if (!currentWorkspace?.id) return
    let cancelled = false

    platformStatus
      .capabilities(currentWorkspace.id)
      .then((res) => {
        if (cancelled) return
        const caps = res.data.capabilities
        setAiLive(caps.find((c) => c.key === 'ai')?.live ?? false)
        setMetaLive(caps.find((c) => c.key === 'meta')?.live ?? false)
      })
      .catch(() => {
        if (cancelled) return
        setAiLive(false)
        setMetaLive(false)
      })

    launchOrchestrator
      .list(currentWorkspace.id)
      .then((res) => {
        if (cancelled) return
        setHasLaunch((res.data ?? []).some((j) => j.status === 'launched'))
      })
      .catch(() => {
        if (!cancelled) setHasLaunch(false)
      })

    return () => {
      cancelled = true
    }
  }, [currentWorkspace?.id])

  // Wait for the real signals before deciding to render — avoids a flash of
  // "todo" steps that are actually done.
  const loaded = aiLive !== null && metaLive !== null && hasLaunch !== null
  if (dismissed || !currentWorkspace?.id || !loaded) return null

  const steps: Step[] = [
    {
      key: 'workspace',
      label: 'Workspace yaratildi',
      hint: 'Reklama boshqaruvi uchun ish maydoni tayyor.',
      done: true,
      href: '/settings/workspace',
      cta: 'Ochish',
    },
    {
      key: 'ai',
      label: 'AI sozlangan',
      hint: 'Strategiya, fokus-guruh va suhbat-launch uchun AI kaliti kerak.',
      done: !!aiLive,
      href: '/settings/activation',
      cta: 'Faollashtirish',
    },
    {
      key: 'meta',
      label: 'Meta hisobi ulandi',
      hint: 'Facebook/Instagram reklama hisobingizni ulang.',
      done: !!metaLive,
      href: '/settings/meta',
      cta: 'Ulash',
    },
    {
      key: 'launch',
      label: 'Birinchi kampaniya ishga tushdi',
      hint: 'Bir jumlada tasvirlab, AI yordamida ishga tushiring.',
      done: !!hasLaunch,
      href: '/launch/chat',
      cta: 'Ishga tushirish',
    },
  ]

  const doneCount = steps.filter((s) => s.done).length
  const allDone = doneCount === steps.length
  const pct = Math.round((doneCount / steps.length) * 100)

  return (
    <Card>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-brand-mid dark:text-brand-lime" aria-hidden />
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              {allDone ? 'Hammasi tayyor! 🎉' : 'Ishni boshlash'}
            </h2>
            <p className="text-xs text-text-tertiary">
              {allDone
                ? 'Platforma to‘liq sozlangan — reklamani boshqaring.'
                : `${doneCount}/${steps.length} qadam bajarildi`}
            </p>
          </div>
        </div>
        {allDone && (
          <button
            type="button"
            onClick={() => {
              dismissGetStarted()
              setDismissed(true)
            }}
            className="shrink-0 rounded-lg p-1 text-text-tertiary transition-colors hover:bg-surface-2 hover:text-text-primary"
            aria-label="Yopish"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-mid to-brand-lime transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="space-y-2">
        {steps.map((s) => (
          <li
            key={s.key}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-3',
              s.done
                ? 'border-emerald-500/25 bg-emerald-500/[0.04]'
                : 'border-border bg-surface-2/40',
            )}
          >
            {s.done ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden />
            ) : (
              <Circle className="h-5 w-5 shrink-0 text-text-tertiary" aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'text-sm font-medium',
                  s.done ? 'text-text-secondary line-through' : 'text-text-primary',
                )}
              >
                {s.label}
              </p>
              {!s.done && <p className="mt-0.5 text-xs text-text-tertiary">{s.hint}</p>}
            </div>
            {!s.done && (
              <Link
                href={s.href}
                className="shrink-0 rounded-lg bg-brand-ink px-3 py-1.5 text-xs font-semibold text-brand-lime hover:opacity-90"
              >
                {s.cta}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </Card>
  )
}
