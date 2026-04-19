import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers/ThemeProvider'

export const metadata: Metadata = {
  title: 'AdSpectr — автономный рекламный агент',
  description:
    'Платформа с ИИ для управления рекламой: быстрее настройка кампаний, отчёты и автоматизация в одном месте.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
