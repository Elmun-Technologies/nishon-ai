'use client'

import { Info, Sparkles, X } from 'lucide-react'
import { useState } from 'react'

export function DemoBanner({
  onOptimize,
  optimizing = false,
  hasWorkspace,
}: {
  onOptimize?: () => void
  optimizing?: boolean
  hasWorkspace: boolean
}) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="relative rounded-2xl border border-amber-500/30 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/[0.08]">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
          <Info className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            Hozir demo ma'lumotlar ko'rsatilmoqda
          </p>
          <p className="mt-1 text-xs text-amber-800 dark:text-amber-200/80">
            {hasWorkspace
              ? "Workspace ulanmagan yoki hali AI tavsiya yaratmagan. Pastdagi tugma orqali real AI optimizatsiyani ishga tushiring — sizning kampaniyalaringizni tahlil qiladi va haqiqiy tavsiyalar yaratadi."
              : "Workspace tanlang — keyin AI tavsiyalari sizning kampaniyalaringiz asosida real ravishda yaratiladi."}
          </p>
          {onOptimize && hasWorkspace && (
            <button
              type="button"
              onClick={() => void onOptimize()}
              disabled={optimizing}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-amber-700 disabled:opacity-50"
            >
              {optimizing ? (
                <>
                  <Sparkles className="h-3 w-3 animate-spin" aria-hidden />
                  AI tahlil qilmoqda…
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Real AI tavsiya yaratish
                </>
              )}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Yopish"
          className="shrink-0 rounded-lg p-1 text-amber-700/60 transition-colors hover:bg-amber-500/10 hover:text-amber-700 dark:text-amber-300/60"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
