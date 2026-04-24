import type { AuditTab } from './types'

export const TAB_IDS: AuditTab[] = ['meta', 'targeting', 'auction', 'geo', 'creative', 'adcopy']

export const CREATIVE_FORMATS = [
  { id: 'image', labelKey: 'metaAudit.formatImage', fallback: 'Image', icon: '🖼' },
  { id: 'short', labelKey: 'metaAudit.formatShortVideo', fallback: 'Short Video', icon: '▶' },
  { id: 'medium', labelKey: 'metaAudit.formatMediumVideo', fallback: 'Medium Video', icon: '▶▶' },
  { id: 'long', labelKey: 'metaAudit.formatLongVideo', fallback: 'Long Video', icon: '▶▶▶' },
  { id: 'carousel', labelKey: 'metaAudit.formatCarousel', fallback: 'Carousel', icon: '◫' },
  { id: 'dpa', labelKey: 'metaAudit.formatDpa', fallback: 'DPA', icon: '⊞' },
] as const

export const FORMAT_STATS: Record<string, { spend: number; cpl: number; ctr: number; conv: number }> = {
  image:    { spend: 1240, cpl: 4.2, ctr: 1.85, conv: 2.1 },
  short:    { spend: 980,  cpl: 5.1, ctr: 2.4,  conv: 1.6 },
  medium:   { spend: 720,  cpl: 6.3, ctr: 1.9,  conv: 1.2 },
  long:     { spend: 540,  cpl: 7.8, ctr: 1.4,  conv: 0.9 },
  carousel: { spend: 1580, cpl: 3.6, ctr: 2.1,  conv: 2.8 },
  dpa:      { spend: 2100, cpl: 3.1, ctr: 2.6,  conv: 3.2 },
}

export const MOCK_CAMPAIGNS = [
  { id: 'c1', name: 'Prospecting — Catalog sales',     spend: 4200, roas: 2.4, status: 'Active' },
  { id: 'c2', name: 'Retargeting — 30d visitors',      spend: 1890, roas: 3.8, status: 'Active' },
  { id: 'c3', name: 'Lead gen — Instant form',         spend: 960,  roas: 1.2, status: 'Limited' },
  { id: 'c4', name: 'ASC — Advantage+ shopping',       spend: 6120, roas: 2.9, status: 'Active' },
]

export const MOCK_TARGETING = [
  { id: 't1', segment: 'Broad + Advantage+',        health: 88, note: 'Stable CPM' },
  { id: 't2', segment: 'Lookalike 1% purchasers',   health: 76, note: 'Watch frequency' },
  { id: 't3', segment: 'Engaged shoppers 30d',       health: 64, note: 'Overlap with retargeting' },
]

export const MOCK_AUCTION = [
  { key: 'overlap',     labelKey: 'metaAudit.overlap',     fb: 'Audience overlap',    value: 62 },
  { key: 'delivery',   labelKey: 'metaAudit.delivery',   fb: 'Delivery stability',   value: 78 },
  { key: 'competition',labelKey: 'metaAudit.competition', fb: 'Competition index',    value: 54 },
]

export const MOCK_GEO = [
  { region: 'Tashkent city', share: 34, spend: 1280 },
  { region: 'Regions',       share: 41, spend: 1540 },
  { region: 'Samarkand',     share: 12, spend: 450  },
  { region: 'Other',         share: 13, spend: 490  },
]

export const MOCK_COPY = [
  { id: 'cp1', headline: 'Free shipping today',    body: 'Order before midnight…',       ctr: 2.1, leads: 48 },
  { id: 'cp2', headline: 'Last units in stock',    body: 'Tap to see sizes…',            ctr: 1.7, leads: 31 },
  { id: 'cp3', headline: 'New collection drop',    body: 'Video + carousel bundle…',     ctr: 2.4, leads: 56 },
]

export const VIEW_STORAGE = 'meta-audit-saved-view-v1'

export const STATUS_COLORS: Record<string, string> = {
  ACTIVE:   'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-400/10 dark:border-emerald-400/20',
  PAUSED:   'text-amber-600  bg-amber-50  border-amber-200  dark:text-amber-400  dark:bg-amber-400/10  dark:border-amber-400/20',
  LIMITED:  'text-amber-600  bg-amber-50  border-amber-200  dark:text-amber-400  dark:bg-amber-400/10  dark:border-amber-400/20',
  DELETED:  'text-red-600    bg-red-50    border-red-200    dark:text-red-400    dark:bg-red-400/10    dark:border-red-400/20',
  ARCHIVED: 'text-text-tertiary bg-surface-2 border-border',
}
