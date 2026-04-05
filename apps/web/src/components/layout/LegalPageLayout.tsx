import Link from 'next/link'

export default function LegalPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-2 text-text-primary">
      <header className="border-b border-border bg-surface-2/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Performa <span className="text-text-secondary">AI</span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-text-tertiary sm:flex">
            <Link href="/privacy" className="transition-colors hover:text-text-primary">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-text-primary">Terms</Link>
            <Link href="/data-deletion" className="transition-colors hover:text-text-primary">Data Deletion</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-text-tertiary sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Performa</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="transition-colors hover:text-text-primary">Privacy Policy</Link>
            <Link href="/terms" className="transition-colors hover:text-text-primary">Terms of Service</Link>
            <Link href="/data-deletion" className="transition-colors hover:text-text-primary">Data Deletion</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
