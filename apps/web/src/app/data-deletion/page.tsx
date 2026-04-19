'use client'

import LegalPageLayout from '@/components/layout/LegalPageLayout'
import { useI18n } from '@/i18n/use-i18n'

export default function DataDeletionPage() {
  const { t } = useI18n()

  return (
    <LegalPageLayout>
      <article className="prose prose-neutral max-w-none dark:prose-invert">
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
          {t('legal.dataDeletion.title', 'Data deletion')}
        </h1>
        <p className="mt-4 text-body text-text-secondary">{t('legal.dataDeletion.intro', '')}</p>
      </article>
    </LegalPageLayout>
  )
}
