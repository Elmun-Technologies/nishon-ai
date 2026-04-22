import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Google orqali kirish | AdSpectr',
  description: 'OAuth callback — tokenlarni saqlash va ilovaga kirish',
}

export default function GoogleCallbackLayout({ children }: { children: ReactNode }) {
  return children
}
