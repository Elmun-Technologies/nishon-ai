'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui'
import { useI18n } from '@/i18n/use-i18n'

/**
 * Top-of-page banner shown only when the user is in demo mode.
 * Sets clear expectations: real-feel data, real flow, but the
 * launch step ends in a sign-up CTA — nothing is sent to Meta.
 */
export function DemoBanner() {
  const { t } = useI18n()
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-300/60 bg-gradient-to-r from-amber-50 via-amber-50/40 to-transparent px-4 py-3 dark:border-amber-500/30 dark:from-amber-500/10 dark:via-amber-500/5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            {t('adLauncher.demoBannerTitle', 'Demo rejim — namunaviy ma\'lumotlar')}
          </p>
          <p className="text-xs text-amber-800/85 dark:text-amber-200/80">
            {t(
              'adLauncher.demoBannerBody',
              'Siz to\'liq flow\'ni sinab ko\'rishingiz mumkin. Yakuniy launch faqat haqiqiy hisob bilan ishlaydi.',
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/register">
            <Button size="sm">
              {t('adLauncher.demoBannerCtaSignup', 'Bepul ro\'yxatdan o\'tish')}
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm" variant="ghost">
              {t('adLauncher.demoBannerCtaLogin', 'Login')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
