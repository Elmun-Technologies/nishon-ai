'use client'

import { useState } from 'react'
import { campaigns as campaignsApi } from '@/lib/api-client'

// ─── Types ────────────────────────────────────────────────────────────────────

type Objective = 'leads' | 'traffic' | 'sales' | 'awareness'
type BudgetType = 'daily' | 'weekly'
type Currency = 'USD' | 'UZS'

interface ScheduleState {
  always: boolean
  hours: number[] // 0-23
}

interface FormState {
  name: string
  objective: Objective | ''
  budgetType: BudgetType
  budget: string
  currency: Currency
  startDate: string
  endDate: string
  schedule: ScheduleState
}

// ─── Constants ────────────────────────────────────────────────────────────────

const OBJECTIVES: { value: Objective; label: string; description: string; icon: string }[] = [
  { value: 'leads',     label: 'Leads',      description: 'Kontakt va so\'rov yig\'ish',    icon: '🎯' },
  { value: 'traffic',   label: 'Traffic',    description: 'Saytga tashrif buyuruvchilar',   icon: '🌐' },
  { value: 'sales',     label: 'Sales',      description: 'Sotuvlar va konversiyalar',      icon: '🛒' },
  { value: 'awareness', label: 'Awareness',  description: 'Brend tanishishini oshirish',    icon: '📣' },
]

// Work-hours presets
const HOUR_PRESETS = [
  { label: 'Ish vaqti (9–18)', hours: [9,10,11,12,13,14,15,16,17,18] },
  { label: 'Kechki (18–24)',   hours: [18,19,20,21,22,23] },
  { label: 'Hafta kunlari',    hours: Array.from({ length: 24 }, (_, i) => i) },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">{children}</p>
}

function TogglePill({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="inline-flex rounded-lg border border-[#E5E7EB] bg-[#0F0F15] p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
            value === o.value
              ? 'bg-[#111827] text-white shadow'
              : 'text-[#6B7280] hover:text-[#111827]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ─── Main Form ─────────────────────────────────────────────────────────────────

interface Props {
  workspaceId: string
  platform: string
  onSuccess: (campaign: Record<string, unknown>) => void
  onCancel: () => void
}

export function CreateCampaignForm({ workspaceId, platform, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState<FormState>({
    name: '',
    objective: '',
    budgetType: 'daily',
    budget: '',
    currency: 'USD',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    schedule: { always: true, hours: [] },
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleHour(hour: number) {
    const hours = form.schedule.hours.includes(hour)
      ? form.schedule.hours.filter((h) => h !== hour)
      : [...form.schedule.hours, hour].sort((a, b) => a - b)
    set('schedule', { ...form.schedule, hours })
  }

  function applyHourPreset(hours: number[]) {
    set('schedule', { always: false, hours })
  }

  const isValid =
    form.name.trim().length > 0 &&
    form.objective !== '' &&
    Number(form.budget) > 0 &&
    form.startDate !== ''

  async function handleSubmit() {
    if (!isValid) return
    setSaving(true)
    setError('')
    try {
      const res = await campaignsApi.create(workspaceId, {
        name: form.name.trim(),
        platform,
        objective: form.objective,
        budget: Number(form.budget),
        budgetType: form.budgetType,
        currency: form.currency,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        schedule: form.schedule.always
          ? { always: true }
          : { always: false, hours: form.schedule.hours },
      })
      onSuccess((res as any).data)
    } catch (err: any) {
      setError(err?.message ?? 'Xatolik yuz berdi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* ── 1. Campaign name ─────────────────────────────────────── */}
      <div>
        <SectionLabel>Kampaniya nomi</SectionLabel>
        <input
          type="text"
          placeholder="Masalan: Yoz chegirma kampaniyasi"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          maxLength={255}
          className="w-full bg-[#0F0F15] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#111827]/50 focus:ring-1 focus:ring-[#111827]/30 transition-colors"
        />
      </div>

      {/* ── 2. Objective ─────────────────────────────────────────── */}
      <div>
        <SectionLabel>Maqsad</SectionLabel>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {OBJECTIVES.map((obj) => (
            <button
              key={obj.value}
              type="button"
              onClick={() => set('objective', obj.value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all duration-150 ${
                form.objective === obj.value
                  ? 'border-[#111827]/50 bg-[#F3F4F6] text-[#111827]'
                  : 'border-[#E5E7EB] bg-[#0F0F15] text-[#9CA3AF] hover:border-[#E5E7EB] hover:text-[#111827]'
              }`}
            >
              <span className="text-2xl">{obj.icon}</span>
              <span className="text-xs font-semibold">{obj.label}</span>
              <span className="text-[10px] text-[#6B7280] leading-tight">{obj.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. Budget ────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Byudjet</SectionLabel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Daily / Weekly toggle */}
          <TogglePill
            options={[{ value: 'daily', label: 'Kunlik' }, { value: 'weekly', label: 'Haftalik' }]}
            value={form.budgetType}
            onChange={(v) => set('budgetType', v as BudgetType)}
          />

          {/* Amount */}
          <div className="relative flex-1">
            <input
              type="number"
              min="1"
              placeholder="0"
              value={form.budget}
              onChange={(e) => set('budget', e.target.value)}
              className="w-full bg-[#0F0F15] border border-[#E5E7EB] rounded-xl px-4 py-3 pr-20 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#111827]/50 focus:ring-1 focus:ring-[#111827]/30 transition-colors"
            />
            {/* Currency toggle */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <TogglePill
                options={[{ value: 'USD', label: '$' }, { value: 'UZS', label: '₸' }]}
                value={form.currency}
                onChange={(v) => set('currency', v as Currency)}
              />
            </div>
          </div>
        </div>

        {/* Budget hint */}
        {form.budget && Number(form.budget) > 0 && (
          <p className="mt-2 text-xs text-[#6B7280]">
            {form.budgetType === 'weekly'
              ? `≈ ${form.currency === 'USD' ? '$' : '₸'}${(Number(form.budget) / 7).toFixed(2)} kunlik`
              : `≈ ${form.currency === 'USD' ? '$' : '₸'}${(Number(form.budget) * 7).toFixed(0)} haftalik`}
          </p>
        )}
      </div>

      {/* ── 4. Dates ─────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Sana oralig'i</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[#6B7280] mb-1">Boshlanish</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
              className="w-full bg-[#0F0F15] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:border-[#111827]/50 focus:ring-1 focus:ring-[#111827]/30 transition-colors [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-xs text-[#6B7280] mb-1">Tugash (ixtiyoriy)</label>
            <input
              type="date"
              value={form.endDate}
              min={form.startDate}
              onChange={(e) => set('endDate', e.target.value)}
              className="w-full bg-[#0F0F15] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:border-[#111827]/50 focus:ring-1 focus:ring-[#111827]/30 transition-colors [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      {/* ── 5. Schedule ──────────────────────────────────────────── */}
      <div>
        <SectionLabel>Ko'rsatish jadvali</SectionLabel>

        <TogglePill
          options={[{ value: 'always', label: 'Har doim' }, { value: 'custom', label: 'Aniq soatlar' }]}
          value={form.schedule.always ? 'always' : 'custom'}
          onChange={(v) => set('schedule', { ...form.schedule, always: v === 'always' })}
        />

        {!form.schedule.always && (
          <div className="mt-4 space-y-3">
            {/* Presets */}
            <div className="flex flex-wrap gap-2">
              {HOUR_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyHourPreset(preset.hours)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-[#9CA3AF] hover:border-[#D1D5DB] hover:text-[#111827] transition-colors"
                >
                  {preset.label}
                </button>
              ))}
              {form.schedule.hours.length > 0 && (
                <button
                  type="button"
                  onClick={() => set('schedule', { ...form.schedule, hours: [] })}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:text-red-400 transition-colors"
                >
                  Tozalash
                </button>
              )}
            </div>

            {/* Hour grid */}
            <div className="grid grid-cols-8 gap-1.5">
              {Array.from({ length: 24 }, (_, h) => {
                const selected = form.schedule.hours.includes(h)
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => toggleHour(h)}
                    className={`py-2 rounded-lg text-xs font-medium transition-all duration-100 ${
                      selected
                        ? 'bg-[#111827] text-white'
                        : 'bg-[#F9FAFB] text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]'
                    }`}
                  >
                    {h.toString().padStart(2, '0')}
                  </button>
                )
              })}
            </div>

            {form.schedule.hours.length > 0 && (
              <p className="text-xs text-[#6B7280]">
                {form.schedule.hours.length} soat tanlandi:{' '}
                <span className="text-[#9CA3AF]">
                  {form.schedule.hours[0].toString().padStart(2,'0')}:00
                  {' – '}
                  {(form.schedule.hours[form.schedule.hours.length - 1] + 1).toString().padStart(2,'0')}:00
                </span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Error ────────────────────────────────────────────────── */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* ── Actions ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E5E7EB]">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-[#6B7280] hover:text-[#111827] transition-colors"
        >
          Bekor qilish
        </button>
        <button
          type="button"
          disabled={!isValid || saving}
          onClick={handleSubmit}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            isValid && !saving
              ? 'bg-[#111827] hover:bg-[#1F2937] text-white shadow-lg shadow-gray-200'
              : 'bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB] cursor-not-allowed'
          }`}
        >
          {saving ? 'Yaratilmoqda…' : 'Kampaniya yaratish'}
        </button>
      </div>
    </div>
  )
}
