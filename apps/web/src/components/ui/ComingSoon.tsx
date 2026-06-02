import { Construction, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Honest "not real yet" markers. Use one of these instead of letting a
 * stub page imply it's fully functional:
 *
 * - <ComingSoonBadge />   — inline pill next to a section title
 * - <ComingSoonOverlay /> — full-page state (no real data wired yet)
 * - <PreviewBanner />     — soft top banner: "Demo data, real wiring in
 *                           progress"
 *
 * Each takes copy from i18n (`comingSoon.*`) so wording is consistent.
 */
export function ComingSoonBadge({
  variant = 'soft',
  className,
  label,
}: {
  variant?: 'soft' | 'solid'
  className?: string
  /** Override the default "Tez orada" text. */
  label?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        variant === 'solid'
          ? 'bg-amber-500 text-white'
          : 'border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        className,
      )}
    >
      <Sparkles className="h-2.5 w-2.5" aria-hidden />
      {label ?? 'Tez orada'}
    </span>
  )
}

export function PreviewBanner({
  title = 'Bu sahifada demo ma\'lumotlar ko\'rsatilmoqda',
  body = 'Real backend ulanmoqda — sahifaning umumiy ko\'rinishini hozir ham ko\'rishingiz mumkin.',
  className,
}: {
  title?: string
  body?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-amber-500/30 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/[0.08]',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
          <Construction className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">{title}</p>
          <p className="mt-1 text-xs text-amber-800 dark:text-amber-200/80">{body}</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Full-page placeholder for a route that's been advertised but isn't built
 * yet. Honest with the user: "this exists in the roadmap, here's what it
 * will do, and what to use today instead."
 */
export function ComingSoonOverlay({
  title,
  subtitle,
  whatItWillDo,
  useInsteadHref,
  useInsteadLabel,
}: {
  title: string
  subtitle?: string
  whatItWillDo?: string[]
  useInsteadHref?: string
  useInsteadLabel?: string
}) {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-surface p-10 text-center shadow-sm">
      <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
        <Construction className="h-7 w-7" aria-hidden />
      </div>
      <h2 className="mt-5 text-2xl font-bold text-text-primary">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>}

      {whatItWillDo && whatItWillDo.length > 0 && (
        <div className="mx-auto mt-6 max-w-md rounded-2xl bg-surface-2/40 p-5 text-left dark:bg-surface-elevated/30">
          <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">
            Bu sahifa nima qiladi
          </p>
          <ul className="mt-2 space-y-1.5">
            {whatItWillDo.map((line) => (
              <li key={line} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {useInsteadHref && (
        <a
          href={useInsteadHref}
          className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-[#1b2e06] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#243a12]"
        >
          {useInsteadLabel ?? "Hozir ishlatib turish"}
        </a>
      )}
    </div>
  )
}
