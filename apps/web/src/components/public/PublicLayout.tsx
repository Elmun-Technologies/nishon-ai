import { cn } from '@/lib/utils'

export { PublicContainer } from '@/components/public/PublicContainer'
export { PublicNavbar, PublicFooter } from '@/components/public/PublicSiteChrome'

export function PublicSectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description?: string
}) {
  return (
    <div className="mb-8 max-w-3xl">
      {eyebrow && <p className="text-sm font-medium text-primary">{eyebrow}</p>}
      <h2 className="mt-1 text-2xl font-semibold md:text-3xl">{title}</h2>
      {description && <p className="mt-3 text-body text-text-secondary">{description}</p>}
    </div>
  )
}

export function PublicCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <article className={cn('rounded-xl border border-border bg-surface p-5 transition hover:border-primary/30', className)}>
      {children}
    </article>
  )
}
