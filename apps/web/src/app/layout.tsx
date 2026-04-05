import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers/ThemeProvider'

// Use system font stack — no network dependency
const inter = { className: 'font-sans' }

export const metadata: Metadata = {
  title: 'Performa — Autonomous Advertising Agent',
  description: 'AI-powered platform that manages your ads better than a human targetolog',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans bg-surface-alt text-text-primary antialiased transition-colors">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}