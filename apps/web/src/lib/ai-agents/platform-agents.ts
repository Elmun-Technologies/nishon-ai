import type { PlatformAgentDef } from './types'

export const PLATFORM_AGENTS: PlatformAgentDef[] = [
  {
    id: 'media_buyer',
    nameUz: 'Media Buyer Agent',
    descriptionUz: 'Byudjet taqsimoti, pacing, tavsiyalar — tasdiq targetologda.',
    verticals: ['ecommerce', 'course', 'restaurant'],
  },
  {
    id: 'creative',
    nameUz: 'Creative Agent',
    descriptionUz: 'Kreativ g‘oya, briefdan variantlar — nashr tasdiq bilan.',
    verticals: ['ecommerce', 'course', 'restaurant'],
  },
  {
    id: 'analyst',
    nameUz: 'Analyst Agent',
    descriptionUz: 'Hisobot, anomaliya, ROAS/CPA izoh — strategiya odamda.',
    verticals: ['ecommerce', 'course', 'restaurant'],
  },
]
