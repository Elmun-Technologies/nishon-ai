/**
 * The public marketplace surfaces (featured specialists, live discovery,
 * portfolio and leaderboard) currently render sample profiles — the real
 * published-specialist listing isn't wired to these pages yet. This banner
 * labels them honestly so the sample people and stats aren't read as real,
 * hireable specialists.
 */
export function MarketplacePreviewBanner() {
  return (
    <div className="mx-auto mb-6 flex max-w-3xl items-start gap-2 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3">
      <span className="mt-0.5 text-base" aria-hidden>
        ⓘ
      </span>
      <p className="text-sm text-amber-800 dark:text-amber-200">
        Namuna — bu sahifadagi mutaxassislar, reyting va ko&apos;rsatkichlar
        ko&apos;rgazma uchun. Haqiqiy targetologlar bozori tez orada ochiladi.
      </p>
    </div>
  )
}
