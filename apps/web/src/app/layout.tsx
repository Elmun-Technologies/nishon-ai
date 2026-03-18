import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Nishon AI — Autonomous Advertising Agent',
  description: 'AI-powered platform that manages your ads better than a human targetolog',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0A0A0F] text-white antialiased`}>
        {children}
      </body>
    </html>
  )
}