'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { triggersets as triggersetsApi } from '@/lib/api-client'

// ─── Types ────────────────────────────────────────────────────────────────────

type Metric = 'ctr' | 'cpc' | 'spend' | 'clicks' | 'impressions'
type Operator = 'gt' | 'lt' | 'gte' | 'lte'
type ActionType = 'pause_campaign' | 'increase_budget' | 'decrease_budget' | 'notify_telegram'

interface TriggerCondition {
  metric: Metric
  operator: Operator
  value: number
  windowDays: number
  dimension: 'campaign' | 'workspace'
}

interface TriggerAction {
  type: ActionType
  value?: number
  message?: string
}

interface Triggerset {
  id: string
  name: string
  enabled: boolean
  conditions: TriggerCondition[]
  actions: TriggerAction[]
  lastRunStatus: string | null
  lastRunAt: string | null
  totalFires: number
  createdAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const METRIC_LABELS: Record<Metric, string> = {
  ctr: 'CTR (%)',
  cpc: 'CPC ($)',
  spend: 'Xarajat ($)',
  clicks: 'Kliklar',
  impressions: 'Ko\'rinishlar',
}

const OP_LABELS: Record<Operator, string> = {
  gt: '> dan katta',
  lt: '< dan kichik',
  gte: '>= katta yoki teng',
  lte: '<= kichik yoki teng',
}

const ACTION_LABELS: Record<ActionType, string> = {
  pause_campaign: '⏸ Kampaniyani to\'xtat',
  increase_budget: '📈 Byudjetni oshir',
  decrease_budget: '📉 Byudjetni kamayt',
  notify_telegram: '📱 Telegram xabar',
}

const STATUS_COLORS: Record<string, string> = {
  success: 'text-emerald-400 bg-emerald-400/10',
  failed: 'text-red-400 bg-red-400/10',
  no_match: 'text-[#6B7280] bg-[#F3F4F6]',
  skipped: 'text-amber-400 bg-amber-400/10',
}

const STATUS_LABELS: Record<string, string> = {
  success: '✓ Muvaffaqiyat',
  failed: '✗ Xato',
  no_match: '— Mos kelmadi',
  skipped: '↷ O\'tkazib yuborildi',
}

// ─── Default new triggerset ────────────────────────────────────────────────────

function defaultForm(): { name: string; conditions: TriggerCondition[]; actions: TriggerAction[] } {
  return {
    name: '',
    conditions: [{ metric: 'ctr', operator: 'lt', value: 0.5, windowDays: 3, dimension: 'campaign' }],
    actions: [{ type: 'notify_telegram' }],
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TriggerSetsPage() {
  const router = useRouter()
  const { currentWorkspace } = useWorkspaceStore()
  const [items, setItems] = useState<Triggerset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(defaultForm())
  const [runningId, setRunningId] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!currentWorkspace?.id) return
    setLoading(true)
    triggersetsApi.list(currentWorkspace.id)
      .then((res) => setItems((res.data as any) ?? []))
      .catch(() => setError('Triggersetlarni yuklashda xatolik'))
      .finally(() => setLoading(false))
  }, [currentWorkspace?.id])

  useEffect(() => { load() }, [load])

  async function handleToggle(ts: Triggerset) {
    try {
      await triggersetsApi.update(ts.id, { enabled: !ts.enabled })
      setItems((prev) => prev.map((t) => t.id === ts.id ? { ...t, enabled: !t.enabled } : t))
    } catch {
      setError('O\'zgartirishda xatolik')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Ushbu triggersетni o\'chirishni tasdiqlaysizmi?')) return
    try {
      await triggersetsApi.remove(id)
      setItems((prev) => prev.filter((t) => t.id !== id))
    } catch {
      setError('O\'chirishda xatolik')
    }
  }

  async function handleRunNow(id: string) {
    setRunningId(id)
    try {
      await triggersetsApi.runNow(id)
      load()
    } catch {
      setError('Ishga tushirishda xatolik')
    } finally {
      setRunningId(null)
    }
  }

  async function handleCreate() {
    if (!currentWorkspace?.id || !form.name.trim()) return
    setSaving(true)
    try {
      await triggersetsApi.create(currentWorkspace.id, form)
      setShowCreate(false)
      setForm(defaultForm())
      load()
    } catch {
      setError('Yaratishda xatolik')
    } finally {
      setSaving(false)
    }
  }

  function updateCondition(idx: number, patch: Partial<TriggerCondition>) {
    setForm((f) => ({
      ...f,
      conditions: f.conditions.map((c, i) => i === idx ? { ...c, ...patch } : c),
    }))
  }

  function updateAction(idx: number, patch: Partial<TriggerAction>) {
    setForm((f) => ({
      ...f,
      actions: f.actions.map((a, i) => i === idx ? { ...a, ...patch } : a),
    }))
  }

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[#6B7280]">Workspace tanlanmagan</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-5xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#111827] flex items-center gap-2">
            ⚡ Triggersetlar
          </h1>
          <p className="text-[#6B7280] text-sm mt-0.5">
            Avtomatik qoidalar — har 30 daqiqada tekshiriladi
          </p>
        </div>
        <Button onClick={() => { setShowCreate(true); setForm(defaultForm()) }}>
          + Yangi triggerset
        </Button>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      {/* ── Create form ── */}
      {showCreate && (
        <Card className="border-[#D1D5DB]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#111827]">Yangi triggerset</h2>
            <button onClick={() => setShowCreate(false)} className="text-[#6B7280] hover:text-[#111827] text-lg">×</button>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-xs text-[#6B7280] mb-1.5">Nomi</label>
            <Input
              value={form.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Masalan: Past CTR kampaniyalarini to'xtat"
            />
          </div>

          {/* Conditions */}
          <div className="mb-4">
            <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-2">Shart (AGAR)</p>
            {form.conditions.map((cond, idx) => (
              <div key={idx} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3 mb-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] text-[#6B7280] mb-1">Metrika</label>
                  <select
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] text-xs rounded-lg px-2 py-1.5"
                    value={cond.metric}
                    onChange={(e) => updateCondition(idx, { metric: e.target.value as Metric })}
                  >
                    {Object.entries(METRIC_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-[#6B7280] mb-1">Operator</label>
                  <select
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] text-xs rounded-lg px-2 py-1.5"
                    value={cond.operator}
                    onChange={(e) => updateCondition(idx, { operator: e.target.value as Operator })}
                  >
                    {Object.entries(OP_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-[#6B7280] mb-1">Qiymat</label>
                  <input
                    type="number"
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] text-xs rounded-lg px-2 py-1.5"
                    value={cond.value}
                    onChange={(e) => updateCondition(idx, { value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#6B7280] mb-1">Davr (kun)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] text-xs rounded-lg px-2 py-1.5"
                    value={cond.windowDays}
                    onChange={(e) => updateCondition(idx, { windowDays: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mb-5">
            <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-2">Amal (U HOLDA)</p>
            {form.actions.map((action, idx) => (
              <div key={idx} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3 mb-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-[#6B7280] mb-1">Amal turi</label>
                  <select
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] text-xs rounded-lg px-2 py-1.5"
                    value={action.type}
                    onChange={(e) => updateAction(idx, { type: e.target.value as ActionType })}
                  >
                    {Object.entries(ACTION_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                {(action.type === 'increase_budget' || action.type === 'decrease_budget') && (
                  <div>
                    <label className="block text-[10px] text-[#6B7280] mb-1">Miqdor (%)</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] text-xs rounded-lg px-2 py-1.5"
                      value={action.value ?? 10}
                      onChange={(e) => updateAction(idx, { value: parseInt(e.target.value) || 10 })}
                    />
                  </div>
                )}
                {action.type === 'notify_telegram' && (
                  <div>
                    <label className="block text-[10px] text-[#6B7280] mb-1">Xabar shablon (ixtiyoriy)</label>
                    <input
                      type="text"
                      className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] text-xs rounded-lg px-2 py-1.5"
                      placeholder="{name} kampaniyasi diqqat talab qiladi"
                      value={action.message ?? ''}
                      onChange={(e) => updateAction(idx, { message: e.target.value })}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Bekor qilish</Button>
            <Button onClick={handleCreate} loading={saving} disabled={!form.name.trim()}>
              Saqlash
            </Button>
          </div>
        </Card>
      )}

      {/* ── List ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-white border border-[#E5E7EB] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="text-center py-16">
          <span className="text-4xl block mb-3">⚡</span>
          <p className="text-[#111827] font-semibold mb-1">Triggersetlar yo'q</p>
          <p className="text-[#6B7280] text-sm mb-5">
            Birinchi qoidangizni yarating — AI har 30 daqiqada tekshiradi
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
            {[
              { icon: '📉', title: 'Past CTR', desc: 'CTR < 0.5% bo\'lsa kampaniyani to\'xtat' },
              { icon: '🚀', title: 'Yuqori ROAS', desc: 'ROAS > 3x bo\'lsa byudjetni +20% oshir' },
              { icon: '📱', title: 'Ogohlantirish', desc: 'Xarajat limitga yetganda Telegram xabar' },
            ].map((ex) => (
              <div key={ex.title} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3">
                <span className="text-xl mb-1.5 block">{ex.icon}</span>
                <p className="text-[#111827] text-xs font-medium mb-0.5">{ex.title}</p>
                <p className="text-[#6B7280] text-[11px]">{ex.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((ts) => (
            <Card key={ts.id} className={ts.enabled ? '' : 'opacity-60'}>
              <div className="flex items-start justify-between gap-4">
                {/* Toggle + info */}
                <div className="flex items-start gap-3 min-w-0">
                  {/* Toggle switch */}
                  <button
                    type="button"
                    onClick={() => handleToggle(ts)}
                    className={`
                      relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200
                      ${ts.enabled ? 'bg-[#111827]' : 'bg-[#F3F4F6]'}
                    `}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200
                        ${ts.enabled ? 'translate-x-6' : 'translate-x-1'}
                      `}
                    />
                  </button>

                  <div className="min-w-0">
                    <p className="text-[#111827] font-medium text-sm">{ts.name}</p>

                    {/* Conditions summary */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {ts.conditions.map((c, i) => (
                        <span key={i} className="text-[11px] bg-[#F9FAFB] border border-[#E5E7EB] text-[#9CA3AF] px-2 py-0.5 rounded-md">
                          {METRIC_LABELS[c.metric]} {c.operator} {c.value} ({c.windowDays}k)
                        </span>
                      ))}
                      <span className="text-[11px] text-[#6B7280]">→</span>
                      {ts.actions.map((a, i) => (
                        <span key={i} className="text-[11px] bg-[#F3F4F6] border border-[#D1D5DB] text-[#374151] px-2 py-0.5 rounded-md">
                          {ACTION_LABELS[a.type as ActionType] ?? a.type}
                          {a.value ? ` ${a.value}%` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stats + actions */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* Last run status */}
                  {ts.lastRunStatus && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${STATUS_COLORS[ts.lastRunStatus] ?? 'text-[#6B7280] bg-[#F3F4F6]'}`}>
                      {STATUS_LABELS[ts.lastRunStatus] ?? ts.lastRunStatus}
                    </span>
                  )}

                  {/* Total fires */}
                  <span className="text-[11px] text-[#6B7280]">
                    {ts.totalFires} marta ishladi
                  </span>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRunNow(ts.id)}
                      loading={runningId === ts.id}
                      className="text-xs"
                    >
                      ▶ Ishga tushir
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(ts.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      O'chirish
                    </Button>
                  </div>
                </div>
              </div>

              {/* Last run time */}
              {ts.lastRunAt && (
                <p className="text-[10px] text-[#6B7280] mt-2 ml-14">
                  Oxirgi tekshiruv: {new Date(ts.lastRunAt).toLocaleString('uz-UZ')}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
