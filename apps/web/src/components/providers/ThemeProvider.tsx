'use client'

import { ThemeProvider } from 'next-themes'
import { I18nProvider } from '@/i18n/i18n-context'
import { ReactNode } from 'react'
import { ToastProvider } from '@/components/ui/Toaster'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <ToastProvider>
          {children}
        </ToastProvider>
      </ThemeProvider>
    </I18nProvider>
  )
}
