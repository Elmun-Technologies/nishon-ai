'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { PageHeader } from '@/components/ui/PageHeader'
import { Alert } from '@/components/ui/Alert'
import type { VerticalId } from '@/lib/ai-agents/types'
import { cn } from '@/lib/utils'

const DEMO_CAMPAIGNS = [
  { id: 'cmp_101', name: 'Krossovka — Meta 2025 Q1' },
  { id: 'cmp_102', name: 'Retarget post-purchase' },
  { id: 'cmp_103', name: 'Lookalike 1% test' },
]

export default function AgentStudioPage() {
  const { currentWorkspace } = useWorkspaceStore()
  const [name, setName] = useState('Mening kiyim strategiyam')
  const [vertical, setVertical] = useState<VerticalId>('ecommerce')
  const [selected, setSelected] = useState<string[]>(['cmp_101', 'cmp_102'])
  const [rules, setRules] = useState("Agar ROAS < 2 bo'lsa, budgetni 20% kamaytirishni tavsiya qil.\nCPM > $5 bo'lsa, ogohlantir.")
  const [tone, setTone] = useState("O'zbekcha, do'stona, narx aytma")
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const toggle = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  const train = async () => {
    setLoading(true)
    setErr(null)
    setMsg(null)
    try {
      const res = await fetch('/api/ai-agents/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          vertical,
          campaignIds: selected,
          rules,
          toneUz: tone,
        }),
      })
      const j = (await res.json()) as { ok?: boolean; message?: string; jobId?: string }
      if (!res.ok || !j.ok) throw new Error(j.message || 'Xato')
      setMsg(`Job: ${j.jobId}. Test rejimi 3 kun — keyin Agent Store.`)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Xato')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <PageHeader
        title="Agent Studio"
        subtitle="Muvaffaqiyatli kampaniyalar + qoidalar + tone → RAG / prompt train (MVP stub). Agent avtomatik pause qilmaydi."
        actions={
          <Link href="/ai-agents" className="text-sm font-medium text-primary underline">
            ← Hub
          </Link>
        }
      />

      {!currentWorkspace?.id ? (
        <Alert variant="info">Workspace tanlang — kampaniya datalari shu yerga ulanadi (keyingi bosqich).</Alert>
      ) : null}

      {err ? <Alert variant="error">{err}</Alert> : null}
      {msg ? <Alert variant="info">{msg}</Alert> : null}

      <label className="block text-sm">
        <span className="text-text-secondary">Agent nomi</span>
        <input
          className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 dark:bg-slate-950"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className="block text-sm">
        <span className="text-text-secondary">Vertikal</span>
        <select
          className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 dark:bg-slate-950"
          value={vertical}
          onChange={(e) => setVertical(e.target.value as VerticalId)}
        >
          <option value="ecommerce">E-commerce</option>
          <option value="course">Kurs</option>
          <option value="restaurant">Restoran</option>
        </select>
      </label>

      <div>
        <p className="text-sm font-medium text-text-primary">Data — muvaffaqiyatli kampaniyalar (demo)</p>
        <p className="text-xs text-text-tertiary">Haqiqata: Signal bridge / Meta import</p>
        <div className="mt-2 space-y-2">
          {DEMO_CAMPAIGNS.map((c) => (
            <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface-1 p-3">
              <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />
              <span className="text-sm text-text-primary">{c.name}</span>
              <span className="ml-auto font-mono text-xs text-text-tertiary">{c.id}</span>
            </label>
          ))}
        </div>
      </div>

      <label className="block text-sm">
        <span className="text-text-secondary">Qoidalar (har qator)</span>
        <textarea
          className="mt-1 min-h-[120px] w-full rounded-xl border border-border bg-white px-3 py-2 font-mono text-sm dark:bg-slate-950"
          value={rules}
          onChange={(e) => setRules(e.target.value)}
        />
      </label>

      <label className="block text-sm">
        <span className="text-text-secondary">Tone</span>
        <input
          className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 dark:bg-slate-950"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
        />
      </label>

      <button
        type="button"
        disabled={loading || selected.length === 0}
        onClick={() => void train()}
        className={cn(
          'w-full rounded-xl bg-gradient-to-r from-brand-mid to-brand-lime py-3 text-sm font-bold text-brand-ink',
          'disabled:opacity-50',
        )}
      >
        {loading ? 'Train…' : 'Train (MVP)'}
      </button>
    </div>
  )
}
