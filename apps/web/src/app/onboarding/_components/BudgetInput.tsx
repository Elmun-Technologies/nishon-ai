import { TrendingUp } from 'lucide-react'
import { formatCompactInt, formatUzsFull } from '../_lib/budget-allocator'

const BUDGET_PRESETS = [
  { id: 'starter', label: 'Test', uzs: 1_500_000, desc: '1.5 mln/oy — kichik test' },
  { id: 'standard', label: 'Standard', uzs: 5_000_000, desc: '5 mln/oy — eng tanlangan' },
  { id: 'growth', label: "Yetuk biznes", uzs: 15_000_000, desc: '15 mln/oy — masshtab' },
  { id: 'enterprise', label: 'Korxona', uzs: 50_000_000, desc: '50 mln/oy — agentlik' },
] as const

export function BudgetInput({
  valueUzs,
  onChange,
  estimatedReach,
}: {
  valueUzs: number
  onChange: (n: number) => void
  estimatedReach: number
}) {
  const MIN = 500_000
  const MAX = 100_000_000
  const STEP = 100_000

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {BUDGET_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.uzs)}
            aria-pressed={valueUzs === p.uzs}
            className={`group rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b2e06]/30 ${
              valueUzs === p.uzs
                ? 'border-[#1b2e06] bg-[#1b2e06] text-white'
                : 'border-[#cfe8c0] bg-white text-text-primary hover:border-[#84cc16]/60'
            }`}
          >
            <p className="text-xs font-semibold">{p.label}</p>
            <p className={`mt-0.5 text-[11px] ${valueUzs === p.uzs ? 'text-white/75' : 'text-text-tertiary'}`}>
              {p.desc}
            </p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-5 ring-1 ring-inset ring-[#e6efd9] shadow-[0_1px_3px_rgba(27,46,6,0.05)]">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            Oylik byudjet
          </span>
          <span className="text-2xl font-bold tabular-nums tracking-tight text-[#3f6212] md:text-3xl">
            {formatUzsFull(valueUzs)}
          </span>
        </div>

        <input
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={valueUzs}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Oylik byudjet"
          className="h-2 w-full cursor-pointer accent-[#65a30d]"
        />
        <div className="mt-1 flex justify-between text-[11px] text-text-tertiary tabular-nums">
          <span>500k</span>
          <span>100 mln</span>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#fafdf5] p-3 ring-1 ring-inset ring-[#eef3e3]">
          <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[#65a30d]" aria-hidden />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#65a30d]">
              Taxminiy oylik reach
            </p>
            <p className="mt-0.5 text-sm font-semibold text-text-primary">
              ~{formatCompactInt(estimatedReach)} kishi ko'radi
            </p>
            <p className="mt-0.5 text-[11px] text-text-tertiary">
              Hamma kanallar bo'yicha, taxminiy CPM asosida
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
