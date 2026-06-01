import { ArrowRight, Bot, Building2, User } from 'lucide-react'

export function EcosystemFlow() {
  return (
    <div className="rounded-3xl border border-border bg-gradient-to-br from-[#fafdf5] to-[#ecfccb]/30 p-6 dark:from-surface-elevated/40 dark:to-brand-lime/[0.04] md:p-8">
      <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <Card
          icon={<Building2 className="h-5 w-5" aria-hidden />}
          color="#0284c7"
          title="Platform Agent"
          subtitle="Tayyor"
          desc="Media Buyer · Creative · Analyst"
        />
        <Arrow />
        <Card
          icon={<User className="h-5 w-5" aria-hidden />}
          color="#7c3aed"
          title="Targetolog Agent"
          subtitle="Sotuv"
          desc="O'z metodikangizni AI ga o'rgating, Store'ga qo'ying"
          highlighted
        />
        <Arrow />
        <Card
          icon={<Bot className="h-5 w-5" aria-hidden />}
          color="#16a34a"
          title="Business Agent"
          subtitle="Saqlash"
          desc="Biznes xotirasi har platformaga ko'chadi"
        />
      </div>
    </div>
  )
}

function Card({
  icon,
  color,
  title,
  subtitle,
  desc,
  highlighted,
}: {
  icon: React.ReactNode
  color: string
  title: string
  subtitle: string
  desc: string
  highlighted?: boolean
}) {
  return (
    <div
      className={`relative rounded-2xl border bg-white p-4 shadow-sm dark:bg-surface-elevated ${
        highlighted
          ? 'border-[#84cc16] ring-2 ring-[#84cc16]/30'
          : 'border-border'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: `${color}1a`, color }}
        >
          {icon}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
          style={{ background: `${color}1a`, color }}
        >
          {subtitle}
        </span>
      </div>
      <p className="mt-2.5 text-sm font-bold text-text-primary">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-text-secondary">{desc}</p>
    </div>
  )
}

function Arrow() {
  return (
    <div className="flex items-center justify-center">
      <ArrowRight className="hidden h-5 w-5 text-text-tertiary md:block" aria-hidden />
      <span className="block h-5 w-px bg-border md:hidden" />
    </div>
  )
}
