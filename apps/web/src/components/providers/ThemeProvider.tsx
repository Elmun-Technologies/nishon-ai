'use client'

import { ThemeProvider } from 'next-themes'
import { I18nProvider } from '@/i18n/i18n-context'
import { ToastContainer } from '@/components/ui/Toast'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        {children}
        <ToastContainer />
      </ThemeProvider>
    </I18nProvider>
  )
}
