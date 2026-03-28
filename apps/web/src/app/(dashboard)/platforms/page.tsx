'use client'

import { useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { PlatformSelector, PLATFORMS } from '@/components/platforms/PlatformSelector'
import type { PlatformId } from '@/components/platforms/PlatformSelector'

export default function PlatformsPage() {
  const router = useRouter()
  const { selectedPlatforms, setSelectedPlatforms, currentWorkspace } = useWorkspaceStore()

  function handleChange(platforms: PlatformId[]) {
    setSelectedPlatforms(platforms)
  }

  const canProceed = selectedPlatforms.length >= 1

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Reklama Platformalari</h1>
        <p className="text-sm text-[#9CA3AF]">
          Qaysi platformalarda reklama yuritmoqchisiz? Bir yoki bir nechtasini tanlang.
          Keyingi bosqichlarda faqat shu platformalar uchun sozlamalar ko'rsatiladi.
        </p>
      </div>

      {/* Platform Selector */}
      <PlatformSelector
        selected={selectedPlatforms}
        onChange={handleChange}
        platforms={PLATFORMS}
        minSelect={1}
      />

      {/* Action buttons */}
      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-[#6B7280] hover:text-white transition-colors"
        >
          ← Orqaga
        </button>

        <div className="flex items-center gap-3">
          {canProceed && (
            <p className="text-xs text-[#6B7280]">
              {selectedPlatforms.length} ta platforma tanlandi
            </p>
          )}
          <button
            type="button"
            disabled={!canProceed}
            onClick={() => router.push('/settings')}
            className={`
              px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
              ${canProceed
                ? 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-lg shadow-[#7C3AED]/25'
                : 'bg-[#1C1C27] text-[#4B5563] border border-[#2A2A3A] cursor-not-allowed'
              }
            `}
          >
            Davom etish →
          </button>
        </div>
      </div>

      {/* Info note */}
      <div className="mt-6 p-4 rounded-xl bg-[#13131F] border border-[#2A2A3A]">
        <div className="flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
          <div>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              Platformani tanlash hisobingizni ulash emas.
              Bu faqat qaysi platformalar uchun AI tavsiyalar va sozlamalar ko'rsatilishini belgilaydi.
              Haqiqiy ulanish uchun <span className="text-[#A78BFA]">Settings → Integrations</span> bo'limiga o'ting.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
