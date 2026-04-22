'use client'

import LegalPageLayout from '@/components/layout/LegalPageLayout'
import { LegalDocumentView } from '@/components/legal/LegalDocumentView'
import { getLegalDocument } from '@/content/legal-documents'
import { useI18n } from '@/i18n/use-i18n'

export default function DataDeletionPage() {
  const { language } = useI18n()
  const doc = getLegalDocument('dataDeletion', language)

  return (
    <LegalPageLayout>
      <LegalDocumentView doc={doc} />
    </LegalPageLayout>
  )
}
