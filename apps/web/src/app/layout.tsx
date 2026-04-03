import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="en">
      <body className="font-sans bg-[#F9FAFB] text-[#111827] antialiased">
        {children}
      </body>
    </html>
  )
}