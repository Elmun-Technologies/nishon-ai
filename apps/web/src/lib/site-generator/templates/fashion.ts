import type { LandingSection } from '../types'

/** Kiyim / mahsulot — sotuvchi blok tartibi */
export const FASHION_SECTION_BLUEPRINT: Pick<LandingSection, 'id' | 'type'>[] = [
  { id: 'hero', type: 'hero' },
  { id: 'problem', type: 'problem_solution' },
  { id: 'gallery', type: 'gallery' },
  { id: 'utp', type: 'utp' },
  { id: 'reviews', type: 'reviews' },
  { id: 'faq', type: 'faq' },
  { id: 'form', type: 'lead_form' },
  { id: 'pay', type: 'payment_embed' },
  { id: 'tech', type: 'tech_strip' },
  { id: 'foot', type: 'footer' },
]
