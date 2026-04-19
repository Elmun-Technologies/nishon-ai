import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Targetolog Portfolio — AdSpectr',
  description: 'O\'zbekistondagi eng yaxshi targetologlarning tasdiqlangan natijalari. Real-time kampaniya statistikasi.',
}

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return children
}
