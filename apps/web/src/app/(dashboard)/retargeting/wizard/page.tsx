'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Users, Globe, Rocket, Settings } from 'lucide-react'
import { useAudienceStore } from '@/stores/audience.store'
import { useRetargetingStore } from '@/stores/retargeting.store'
import type { Platform } from '@/types/retargeting'
import { PlatformConfigForm } from './components/PlatformConfigForm'

// ─── Config ───────────────────────────────────────────────────────────────────

const PLATFORMS: { value: Platform; label: string; icon: string }[] = [
  { value: 'meta',   label: 'Meta (Facebook / Instagram)', icon: '📘' },
  { value: 'google', label: 'Google Ads',                  icon: '🔵' },
  { value: 'tiktok', label: 'TikTok Ads',                  icon: '🎵' },
  { value: 'yandex', label: 'Yandex Direct',               icon: '🔴' },
]

const STEP_LABELS = ['Auditoriya', 'Platforma va byudjet', 'Platform moslashtirish', 'Tasdiqlash']

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepBar({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1
        const done    = n < current
        const active  = n === current
        return (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              done   ? 'bg-success text-surface' :
              active ? 'bg-info text-surface' :
                       'bg-surface-2 text-text-tertiary border border-border'
            }`}>
              {done ? '✓' : n}
            </div>
            <span className={`text-sm font-medium ${active ? 'text-text-primary' : 'text-text-tertiary'}`}>
              {label}
            </span>
            {i < STEP_LABELS.length - 1 && (
              <div className={`flex-1 h-px mx-1 ${done ? 'bg-success' : 'bg-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Steps ────────────────────────────────────────────────────────────────────

function Step1({ onNext }: { onNext: () => void }) {
  const { audiences } = useAudienceStore()
  const { wizard, updateWizard } = useRetargetingStore()

  const STAGE_COLORS: Record<string, string> = {
    prospecting:  'text-blue-500',
    reengagement: 'text-purple-500',
    retargeting:  'text-orange-500',
    retention:    'text-green-500',
  }
  const STAGE_LABELS: Record<string, string> = {
    prospecting: 'Prospecting', reengagement: 'Re-engagement',
    retargeting: 'Retargeting', retention: 'Retention',
  }

  function fmtNum(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
    return String(n)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Users size={22} /> Auditoriya tanlang
        </h2>
        <p className="text-text-secondary text-sm mt-1">
          Qaysi auditoriyani maqsad qilib olasiz?
        </p>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {audiences.map((aud) => {
          const selected = wizard.selectedAudience?.id === aud.id
          return (
            <button
              key={aud.id}
              onClick={() => updateWizard({ selectedAudience: aud })}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                selected ? 'border-info bg-info/5' : 'border-border hover:border-border-hover'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${selected ? 'border-info' : 'border-border'}`}>
                {selected && <div className="w-2 h-2 rounded-full bg-info" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary text-sm truncate">{aud.name}</p>
                <p className="text-xs text-text-tertiary">{aud.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-medium text-text-primary">{fmtNum(aud.size)}</p>
                <p className={`text-xs font-medium ${STAGE_COLORS[aud.funnelStage]}`}>
                  {STAGE_LABELS[aud.funnelStage]}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex justify-between pt-2">
        <Link href="/audiences/create" className="text-sm text-info hover:underline">
          + Yangi auditoriya yaratish
        </Link>
        <button
          onClick={onNext}
          disabled={!wizard.selectedAudience}
          className={`px-5 py-2 rounded-lg font-medium transition-all ${
            wizard.selectedAudience
              ? 'bg-info text-surface hover:opacity-90'
              : 'bg-surface-2 text-text-tertiary cursor-not-allowed'
          }`}
        >
          Davom etish →
        </button>
      </div>
    </div>
  )
}

function Step2({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { wizard, updateWizard } = useRetargetingStore()

  const togglePlatform = (p: Platform) => {
    const cur = wizard.selectedPlatforms
    const next = cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]
    updateWizard({ selectedPlatforms: next })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Globe size={22} /> Platforma va byudjet
        </h2>
        <p className="text-text-secondary text-sm mt-1">
          Qaysi platformalarda ishga tushirasiz?
        </p>
      </div>

      {/* Platforms */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-text-primary">Platformalar</label>
        {PLATFORMS.map((p) => {
          const active = wizard.selectedPlatforms.includes(p.value)
          return (
            <button
              key={p.value}
              onClick={() => togglePlatform(p.value)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left ${
                active ? 'border-info bg-info/5' : 'border-border hover:border-border-hover'
              }`}
            >
              <span className="text-xl">{p.icon}</span>
              <span className="font-medium text-text-primary">{p.label}</span>
              {active && <CheckCircle size={16} className="ml-auto text-info" />}
            </button>
          )
        })}
      </div>

      {/* Budget Type */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-text-primary">Byudjet turi</label>
        <div className="grid grid-cols-2 gap-3">
          {(['ABO', 'CBO'] as const).map((bt) => (
            <button
              key={bt}
              onClick={() => updateWizard({ budgetType: bt })}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                wizard.budgetType === bt
                  ? 'border-info bg-info/5'
                  : 'border-border hover:border-border-hover'
              }`}
            >
              <p className="font-bold text-text-primary">{bt}</p>
              <p className="text-xs text-text-tertiary mt-0.5">
                {bt === 'ABO' ? 'Ad darajasida byudjet' : 'Kampaniya darajasida byudjet'}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Daily Budget */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-text-primary">Kunlik byudjet</label>
          <span className="text-sm font-bold text-info">${wizard.dailyBudget}/kun</span>
        </div>
        <input
          type="range" min={5} max={500} step={5}
          value={wizard.dailyBudget}
          onChange={(e) => updateWizard({ dailyBudget: Number(e.target.value) })}
          className="w-full h-2 rounded-lg accent-info"
        />
        <div className="flex justify-between text-xs text-text-tertiary">
          <span>$5</span><span>$250</span><span>$500</span>
        </div>
        <p className="text-xs text-text-secondary">
          30 kunlik taxminiy xarajat: <span className="font-semibold text-text-primary">${wizard.dailyBudget * 30}</span>
        </p>
      </div>

      {/* Campaign Name */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-text-primary">
          Kampaniya nomi <span className="text-text-tertiary font-normal">(ixtiyoriy)</span>
        </label>
        <input
          type="text"
          placeholder={wizard.selectedAudience ? `${wizard.selectedAudience.name} — Retargeting` : 'Kampaniya nomi'}
          value={wizard.campaignName}
          onChange={(e) => updateWizard({ campaignName: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
        />
      </div>

      <div className="flex justify-between pt-2">
        <button onClick={onBack} className="px-5 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-2 transition-colors">
          ← Orqaga
        </button>
        <button
          onClick={onNext}
          disabled={wizard.selectedPlatforms.length === 0}
          className={`px-5 py-2 rounded-lg font-medium transition-all ${
            wizard.selectedPlatforms.length > 0
              ? 'bg-info text-surface hover:opacity-90'
              : 'bg-surface-2 text-text-tertiary cursor-not-allowed'
          }`}
        >
          Davom etish →
        </button>
      </div>
    </div>
  )
}

function Step3({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { wizard, updateWizard } = useRetargetingStore()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Settings size={22} /> Platform moslashtirish
        </h2>
        <p className="text-text-secondary text-sm mt-1">
          Har bir platformani o'z sozlamalariga muvofiq sozlang
        </p>
      </div>

      {/* Platform Configuration Tabs */}
      <div className="space-y-6">
        {wizard.selectedPlatforms.map((platform) => (
          <PlatformConfigForm
            key={platform}
            platform={platform}
            initialConfig={wizard.platformConfigs[platform]}
            onConfigChange={(config) => {
              updateWizard({
                platformConfigs: {
                  ...wizard.platformConfigs,
                  [platform]: config,
                },
              })
            }}
          />
        ))}
      </div>

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="px-5 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-2 transition-colors"
        >
          ← Orqaga
        </button>
        <button
          onClick={onNext}
          className="px-5 py-2 rounded-lg font-medium transition-all bg-info text-surface hover:opacity-90"
        >
          Davom etish →
        </button>
      </div>
    </div>
  )
}

function Step4({ onBack, onLaunch }: { onBack: () => void; onLaunch: () => void }) {
  const { wizard } = useRetargetingStore()
  const PLATFORM_ICONS: Record<Platform, string> = {
    meta: '📘', google: '🔵', tiktok: '🎵', yandex: '🔴',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Rocket size={22} /> Tasdiqlash va ishga tushirish
        </h2>
        <p className="text-text-secondary text-sm mt-1">Hamma narsani tekshirib chiqing</p>
      </div>

      {/* Summary Card */}
      <div className="rounded-lg border border-border bg-surface-2 divide-y divide-border">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-text-secondary">Auditoriya</span>
          <span className="text-sm font-medium text-text-primary">{wizard.selectedAudience?.name}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-text-secondary">Platformalar</span>
          <div className="flex gap-1">
            {wizard.selectedPlatforms.map((p) => (
              <span key={p} className="text-lg">{PLATFORM_ICONS[p]}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-text-secondary">Byudjet turi</span>
          <span className="text-sm font-medium text-text-primary">{wizard.budgetType}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-text-secondary">Kunlik byudjet</span>
          <span className="text-sm font-medium text-text-primary">${wizard.dailyBudget}/kun</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-text-secondary">Jami (30 kun)</span>
          <span className="text-sm font-bold text-info">${wizard.dailyBudget * 30}</span>
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="px-5 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-2 transition-colors"
        >
          ← Orqaga
        </button>
        <button
          onClick={onLaunch}
          className="flex items-center gap-2 px-6 py-2 bg-success text-surface rounded-lg font-medium hover:opacity-90 transition-all"
        >
          <Rocket size={18} /> Ishga tushirish
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RetargetingWizardPage() {
  const router = useRouter()
  const { wizard, setWizardStep, launchCampaign } = useRetargetingStore()

  const handleLaunch = () => {
    launchCampaign()
    router.push('/retargeting')
  }

  return (
    <div className="max-w-xl space-y-4">
      <Link href="/retargeting" className="flex items-center gap-1 text-sm text-info hover:underline">
        <ArrowLeft size={16} /> Orqaga
      </Link>

      <StepBar current={wizard.step} />

      {wizard.step === 1 && (
        <Step1 onNext={() => setWizardStep(2)} />
      )}
      {wizard.step === 2 && (
        <Step2 onNext={() => setWizardStep(3)} onBack={() => setWizardStep(1)} />
      )}
      {wizard.step === 3 && (
        <Step3 onNext={() => setWizardStep(4)} onBack={() => setWizardStep(2)} />
      )}
      {wizard.step === 4 && (
        <Step4 onBack={() => setWizardStep(3)} onLaunch={handleLaunch} />
      )}
    </div>
  )
}
