import Link from 'next/link'

export default function LegalPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <header className="border-b border-[#2A2A3A] bg-[#0A0A0F]/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Nishon <span className="text-[#7C3AED]">AI</span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-[#9CA3AF] sm:flex">
            <Link href="/privacy" className="transition-colors hover:text-white">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-white">Terms</Link>
            <Link href="/data-deletion" className="transition-colors hover:text-white">Data Deletion</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">{children}</main>

      <footer className="border-t border-[#2A2A3A]">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-[#9CA3AF] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Nishon AI</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="transition-colors hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="transition-colors hover:text-white">Terms of Service</Link>
            <Link href="/data-deletion" className="transition-colors hover:text-white">Data Deletion</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
