'use client'

import { useEffect } from 'react'
import { LanguagePreferencePanel } from '@/components/settings/LanguagePreferencePanel'

export default function WorkspaceLanguagePage() {
  useEffect(() => {
    document.title = 'Language — Workspace settings | AdSpectr'
  }, [])

  return (
    <div className="space-y-6">
      <LanguagePreferencePanel />
    </div>
  )
}
