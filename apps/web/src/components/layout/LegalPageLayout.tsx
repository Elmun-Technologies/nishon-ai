import Link from 'next/link'

export default function LegalPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827]">
      <header className="border-b border-[#E5E7EB] bg-[#F9FAFB]/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Performa <span className="text-[#374151]">AI</span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-[#9CA3AF] sm:flex">
            <Link href="/privacy" className="transition-colors hover:text-[#111827]">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-[#111827]">Terms</Link>
            <Link href="/data-deletion" className="transition-colors hover:text-[#111827]">Data Deletion</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">{children}</main>

      <footer className="border-t border-[#E5E7EB]">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-[#9CA3AF] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Performa</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="transition-colors hover:text-[#111827]">Privacy Policy</Link>
            <Link href="/terms" className="transition-colors hover:text-[#111827]">Terms of Service</Link>
            <Link href="/data-deletion" className="transition-colors hover:text-[#111827]">Data Deletion</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
