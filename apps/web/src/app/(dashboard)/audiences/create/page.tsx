'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, CheckCircle } from 'lucide-react'
import { useAudienceStore } from '@/stores/audience.store'
import type { AudienceType, FunnelStage } from '@/types/retargeting'

// ─── Config ───────────────────────────────────────────────────────────────────

const FUNNEL_OPTIONS: { value: FunnelStage; label: string; desc: string; color: string }[] = [
  { value: 'prospecting',  label: 'Prospecting',   desc: 'Yangi potentsial mijozlar',           color: 'border-blue-400 bg-blue-400/5' },
  { value: 'reengagement', label: 'Re-engagement', desc: 'Saytga kirgan lekin xarid qilmagan',  color: 'border-purple-400 bg-purple-400/5' },
  { value: 'retargeting',  label: 'Retargeting',   desc: 'Mahsulotni ko\'rgan, qaytarmagan',    color: 'border-orange-400 bg-orange-400/5' },
  { value: 'retention',    label: 'Retention',     desc: 'Mavjud mijozlarni ushlab turish',     color: 'border-green-400 bg-green-400/5' },
]

const TYPE_OPTIONS: { value: AudienceType; label: string; desc: string }[] = [
  { value: 'visitors',  label: 'Sayt tashrif buyuruvchilar', desc: 'Pixel yoki analytics orqali' },
  { value: 'engaged',   label: 'Faol foydalanuvchilar',      desc: 'Video ko\'rgan, like bosgan' },
  { value: 'customers', label: 'Mijozlar',                   desc: 'Xarid qilgan foydalanuvchilar' },
  { value: 'lookalike', label: 'Lookalike',                  desc: 'Mijozlarga o\'xshash yangilar' },
  { value: 'custom',    label: 'Custom',                     desc: 'O\'zingiz belgilagan shartlar' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreateAudiencePage() {
  const router = useRouter()
  const { addAudience } = useAudienceStore()

  const [form, setForm] = useState({
    name: '',
    type: 'visitors' as AudienceType,
    funnelStage: 'retargeting' as FunnelStage,
    recencyDays: 30,
    description: '',
  })

  const isValid = form.name.trim().length > 0

  const handleSubmit = () => {
    if (!isValid) return
    addAudience({
      ...form,
      size: Math.floor(Math.random() * 50000) + 5000, // mock
      isActive: true,
    })
    router.push('/retargeting')
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* Header */}
      <div>
        <Link href="/retargeting" className="flex items-center gap-1 text-sm text-info hover:underline mb-4">
          <ArrowLeft size={16} /> Retargetingga qaytish
        </Link>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Users size={24} /> Yangi auditoriya
        </h1>
        <p className="text-text-secondary mt-1">Retargeting uchun maqsadli auditoriya yarating</p>
      </div>

      {/* Funnel Stage */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-text-primary">Funnel bosqichi</label>
        <div className="grid grid-cols-2 gap-3">
          {FUNNEL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setForm({ ...form, funnelStage: opt.value })}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                form.funnelStage === opt.value
                  ? opt.color
                  : 'border-border hover:border-border-hover'
              }`}
            >
              <p className="font-medium text-text-primary">{opt.label}</p>
              <p className="text-xs text-text-secondary mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Audience Type */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-text-primary">Auditoriya turi</label>
        <div className="space-y-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setForm({ ...form, type: opt.value })}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                form.type === opt.value
                  ? 'border-info bg-info/5'
                  : 'border-border hover:border-border-hover'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                form.type === opt.value ? 'border-info' : 'border-border'
              }`}>
                {form.type === opt.value && <div className="w-2 h-2 rounded-full bg-info" />}
              </div>
              <div>
                <p className="font-medium text-text-primary text-sm">{opt.label}</p>
                <p className="text-xs text-text-tertiary">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-text-primary">Auditoriya nomi</label>
        <input
          type="text"
          placeholder="masalan: Savatga qo'shgan — 7 kun"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
        />
      </div>

      {/* Recency */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-text-primary">Muddati (kun)</label>
          <span className="text-sm font-bold text-info">{form.recencyDays} kun</span>
        </div>
        <input
          type="range"
          min={1} max={180} value={form.recencyDays}
          onChange={(e) => setForm({ ...form, recencyDays: Number(e.target.value) })}
          className="w-full h-2 rounded-lg accent-info"
        />
        <div className="flex justify-between text-xs text-text-tertiary">
          <span>1 kun</span>
          <span>90 kun</span>
          <span>180 kun</span>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-text-primary">
          Tavsif <span className="text-text-tertiary font-normal">(ixtiyoriy)</span>
        </label>
        <textarea
          placeholder="Bu auditoriya kimlardan iborat?"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Link
          href="/retargeting"
          className="px-5 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-2 transition-colors"
        >
          Bekor qilish
        </Link>
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
            isValid
              ? 'bg-info text-surface hover:opacity-90'
              : 'bg-surface-2 text-text-tertiary cursor-not-allowed'
          }`}
        >
          <CheckCircle size={18} /> Auditoriya yaratish
        </button>
      </div>

    </div>
  )
}
