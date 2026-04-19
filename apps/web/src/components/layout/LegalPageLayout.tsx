'use client'

import Link from 'next/link'
import { useI18n } from '@/i18n/use-i18n'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

export default function LegalPageLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-surface-2 text-text-primary">
      <header className="border-b border-border bg-surface-2/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight text-text-primary">
            {t('publicSite.brand', 'AdSpectr AI')}
          </Link>
          <div className="flex items-center gap-3">
            <nav className="hidden items-center gap-5 text-sm text-text-tertiary sm:flex">
              <Link href="/privacy" className="transition-colors hover:text-text-primary">
                {t('legal.layout.privacy', 'Privacy')}
              </Link>
              <Link href="/terms" className="transition-colors hover:text-text-primary">
                {t('legal.layout.terms', 'Terms')}
              </Link>
              <Link href="/data-deletion" className="transition-colors hover:text-text-primary">
                {t('legal.layout.dataDeletion', 'Data deletion')}
              </Link>
            </nav>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-text-tertiary sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {new Date().getFullYear()} AdSpectr
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="transition-colors hover:text-text-primary">
              {t('legal.footer.privacyPolicy', 'Privacy Policy')}
            </Link>
            <Link href="/terms" className="transition-colors hover:text-text-primary">
              {t('legal.footer.termsOfService', 'Terms of Service')}
            </Link>
            <Link href="/data-deletion" className="transition-colors hover:text-text-primary">
              {t('legal.footer.dataDeletion', 'Data deletion')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
