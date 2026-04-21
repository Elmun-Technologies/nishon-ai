'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bot, UserCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { LaunchFlowProgress } from '@/components/launch-flow/LaunchFlowProgress'
import type { ExecutionPath, LaunchFlowState } from '@/lib/launch-flow/types'
import { loadLaunchFlowState, saveLaunchFlowState } from '@/lib/launch-flow/storage'
import { cn } from '@/lib/utils'

const EDGE_CASES = [
  'Preview rad → «Nima yoqmadi?» + AI qayta (3 marta).',
  'Agent xato → rollback + alert.',
  'Mutaxassis 24s javobsiz → refund + boshqa taklif.',
  'Budget tugasa → auto-pause + Telegram.',
  'Pixel ishlamasa → Launch disabled.',
  'O‘rtada to‘xtasa → draft 24s eslatma.',
  'Ikkala yo‘l → mumkin emas (radio).',
] as const

export default function LaunchConfirmPage() {
  const router = useRouter()
  const [state, setState] = useState<LaunchFlowState | null>(null)
  const [path, setPath] = useState<ExecutionPath>(null)

  useEffect(() => {
    const s = loadLaunchFlowState()
    if (!s) {
      router.replace('/launch/preview')
      return
    }
    if (s.pathLocked && s.pathChoice) {
      router.replace(s.pathChoice === 'agent' ? '/launch/execute/agent' : '/launch/execute/specialist')
      return
    }
    setState(s)
    setPath(s.pathChoice)
  }, [router])

  const commit = () => {
    if (!state || !path) return
    const next: LaunchFlowState = {
      ...state,
      phase: 'confirmed',
      pathChoice: path,
      pathLocked: true,
    }
    saveLaunchFlowState(next)
    router.push(path === 'agent' ? '/launch/execute/agent' : '/launch/execute/specialist')
  }

  if (!state) return <div className="p-8 text-text-secondary">Yuklanmoqda…</div>

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <PageHeader
        title="Tasdiqlash — yo‘l tanlash"
        subtitle="Bitta tanlov: Agent (avtomatik tavsiyalar) yoki Mutaxassis (marketplace). Tasdiqdan keyin bu bosqichga qaytib bo‘lmaydi."
        actions={
          <Link href="/launch/preview" className="text-sm text-primary underline">
            ← Preview
          </Link>
        }
      />

      <LaunchFlowProgress step={1} />

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setPath('agent')}
          className={cn(
            'rounded-2xl border-2 p-6 text-left transition-all',
            path === 'agent'
              ? 'border-brand-mid bg-brand-mid/10 dark:border-brand-lime dark:bg-brand-lime/10'
              : 'border-border hover:border-brand-mid/30',
          )}
        >
          <Bot className="h-8 w-8 text-brand-mid dark:text-brand-lime" aria-hidden />
          <p className="mt-3 text-lg font-bold text-text-primary">Agent bilan boshlash</p>
          <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">$0</p>
          <p className="mt-2 text-sm text-text-secondary">Har actiondan oldin Telegram: «ROAS 1.8 → kamaytiramanmi?»</p>
        </button>
        <button
          type="button"
          onClick={() => setPath('specialist')}
          className={cn(
            'rounded-2xl border-2 p-6 text-left transition-all',
            path === 'specialist'
              ? 'border-brand-mid bg-brand-mid/10 dark:border-brand-lime dark:bg-brand-lime/10'
              : 'border-border hover:border-brand-mid/30',
          )}
        >
          <UserCircle2 className="h-8 w-8 text-brand-mid dark:text-brand-lime" aria-hidden />
          <p className="mt-3 text-lg font-bold text-text-primary">Mutaxassis yollash</p>
          <p className="mt-1 text-2xl font-black text-text-primary">$50/hafta</p>
          <p className="mt-2 text-sm text-text-secondary">Marketplace → BM, pixel, kreativ access</p>
        </button>
      </div>

      <button
        type="button"
        disabled={!path}
        onClick={commit}
        className={cn(
          'w-full rounded-2xl bg-brand-ink py-4 text-sm font-bold text-brand-lime disabled:opacity-40',
        )}
      >
        Davom etish (qaytish yo‘q)
      </button>

      <details className="rounded-2xl border border-border bg-surface-1 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-text-primary">7 ta edge holat</summary>
        <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-text-secondary">
          {EDGE_CASES.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </details>
    </div>
  )
}
