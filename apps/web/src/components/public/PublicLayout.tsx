import Link from 'next/link'
import { cn } from '@/lib/utils'

export function PublicContainer({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-7xl px-4 md:px-6', className)}>{children}</div>
}

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur">
      <PublicContainer className="flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-text-primary">
          Performa AI
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-text-secondary md:flex">
          <Link href="/features" className="hover:text-text-primary">Features</Link>
          <Link href="/solutions" className="hover:text-text-primary">Solutions</Link>
          <Link href="/marketplace" className="hover:text-text-primary">Marketplace</Link>
          <Link href="/leaderboard" className="hover:text-text-primary">Leaderboard</Link>
          <Link href="/portfolio" className="hover:text-text-primary">Portfolio</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:bg-surface-2"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:opacity-95"
          >
            Start Free
          </Link>
        </div>
      </PublicContainer>
    </header>
  )
}

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

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <PublicContainer className="flex flex-col gap-4 py-6 text-sm text-text-secondary md:flex-row md:items-center md:justify-between">
        <p>Performa AI - Campaign Operations Platform</p>
        <div className="flex items-center gap-4">
          <Link href="/features" className="hover:text-text-primary">Features</Link>
          <Link href="/solutions" className="hover:text-text-primary">Solutions</Link>
          <Link href="/terms" className="hover:text-text-primary">Terms</Link>
          <Link href="/privacy" className="hover:text-text-primary">Privacy</Link>
        </div>
      </PublicContainer>
    </footer>
  )
}
