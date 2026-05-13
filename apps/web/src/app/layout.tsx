import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Providers } from '@/components/providers/ThemeProvider'

const basisGrotesque = localFont({
  src: [
    { path: '../../public/fonts/BasisGrotesquePro-Light.woff', weight: '300', style: 'normal' },
    { path: '../../public/fonts/BasisGrotesquePro-Regular.woff', weight: '400', style: 'normal' },
    { path: '../../public/fonts/BasisGrotesquePro-Medium.woff', weight: '500', style: 'normal' },
    { path: '../../public/fonts/BasisGrotesquePro-Bold.woff', weight: '700', style: 'normal' },
    { path: '../../public/fonts/BasisGrotesquePro-Black.woff', weight: '900', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'sans-serif'],
})

export const metadata: Metadata = {
  title: 'AdSpectr — автономный рекламный агент',
  description:
    'Платформа с ИИ для управления рекламой: быстрее настройка кампаний, отчёты и автоматизация в одном месте.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning className={basisGrotesque.variable}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
