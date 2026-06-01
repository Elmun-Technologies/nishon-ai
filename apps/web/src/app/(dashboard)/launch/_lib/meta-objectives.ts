import {
  Globe,
  Megaphone,
  MessageCircle,
  ShoppingCart,
  Smartphone,
  Target,
} from 'lucide-react'
import type { MetaObjective } from './types'

export interface MetaObjectiveDef {
  id: MetaObjective
  icon: React.ComponentType<{ className?: string }>
  label: string
  desc: string
  goodFor: string[]
  color: string
  iconColor: string
  recommendedForBusiness: string[]
}

export const META_OBJECTIVES: MetaObjectiveDef[] = [
  {
    id: 'awareness',
    icon: Megaphone,
    label: 'Awareness',
    desc: 'Show your ads to people who are most likely to remember them.',
    goodFor: ['Reach', 'Brand awareness', 'Video views'],
    color: 'bg-amber-500/15',
    iconColor: 'text-amber-600 dark:text-amber-400',
    recommendedForBusiness: ['new_brand', 'event'],
  },
  {
    id: 'traffic',
    icon: Globe,
    label: 'Traffic',
    desc: 'Send people to a destination, like your website, app, Instagram profile or Facebook event.',
    goodFor: [
      'Link clicks',
      'Landing page views',
      'Instagram profile visits',
      'Messenger, Instagram and WhatsApp',
      'Calls',
    ],
    color: 'bg-yellow-400/15',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    recommendedForBusiness: ['content', 'blog'],
  },
  {
    id: 'engagement',
    icon: MessageCircle,
    label: 'Engagement',
    desc: 'Get more messages, purchases through messaging, video views, post engagement, Page likes or event responses.',
    goodFor: [
      'Messenger, Instagram and WhatsApp',
      'Video views',
      'Post engagement',
      'Conversions',
      'Calls',
    ],
    color: 'bg-sky-500/15',
    iconColor: 'text-sky-600 dark:text-sky-400',
    recommendedForBusiness: ['community', 'service'],
  },
  {
    id: 'leads',
    icon: Target,
    label: 'Leads',
    desc: 'Collect leads for your business or brand.',
    goodFor: [
      'Website and instant forms',
      'Instant forms',
      'Messenger, Instagram and WhatsApp',
      'Conversions',
      'Calls',
    ],
    color: 'bg-orange-500/15',
    iconColor: 'text-orange-600 dark:text-orange-400',
    recommendedForBusiness: ['b2b', 'service', 'local'],
  },
  {
    id: 'app_promotion',
    icon: Smartphone,
    label: 'App promotion',
    desc: 'Find new people to install your app and continue using it.',
    goodFor: ['App installs', 'App events'],
    color: 'bg-violet-500/15',
    iconColor: 'text-violet-600 dark:text-violet-400',
    recommendedForBusiness: ['app'],
  },
  {
    id: 'sales',
    icon: ShoppingCart,
    label: 'Sales',
    desc: 'Find people likely to purchase your product or service.',
    goodFor: [
      'Conversions',
      'Catalog sales',
      'Messenger, Instagram and WhatsApp',
      'Calls',
    ],
    color: 'bg-emerald-500/15',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    recommendedForBusiness: ['ecommerce', 'product'],
  },
]

export function findMetaObjective(id: MetaObjective | '' | null | undefined) {
  if (!id) return null
  return META_OBJECTIVES.find((o) => o.id === id) ?? null
}
