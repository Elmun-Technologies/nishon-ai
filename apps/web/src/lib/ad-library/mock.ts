import type { AdLibraryAdvertiser, AdLibraryNiche, AdLibraryRawAd } from '@/lib/ad-library/types'

const PAGES: Array<{ name: string; niche: AdLibraryNiche; base: number; growth: number }> = [
  { name: 'StepUp', niche: 'fashion', base: 24, growth: 18 },
  { name: 'IT Academy', niche: 'course', base: 18, growth: 32 },
  { name: 'Evos', niche: 'restaurant', base: 31, growth: 9 },
  { name: 'Texnomart', niche: 'services', base: 28, growth: 4 },
  { name: 'Anor Bank', niche: 'services', base: 22, growth: 41 },
  { name: 'Cambridge Unit School', niche: 'edu', base: 16, growth: 27 },
  { name: 'Olma Shop', niche: 'fashion', base: 19, growth: 12 },
  { name: 'Yandex Go UZ', niche: 'services', base: 35, growth: 7 },
  { name: 'Afsona Osh', niche: 'food', base: 14, growth: 45 },
  { name: 'Skillbox UZ', niche: 'course', base: 21, growth: 19 },
  { name: 'Korzinka', niche: 'food', base: 40, growth: 3 },
  { name: 'Humo', niche: 'services', base: 17, growth: 55 },
  { name: 'Streetwear Tash', niche: 'fashion', base: 11, growth: 62 },
  { name: 'Milliy taomlar', niche: 'restaurant', base: 13, growth: 8 },
  { name: 'Uzum Market', niche: 'services', base: 44, growth: 22 },
  { name: 'Space Web', niche: 'course', base: 9, growth: 14 },
  { name: 'Choyxona Navoiy', niche: 'restaurant', base: 8, growth: 33 },
  { name: 'Kids Fashion UZ', niche: 'fashion', base: 15, growth: 11 },
  { name: 'Pro English', niche: 'edu', base: 12, growth: 28 },
  { name: 'Apex Fitness', niche: 'services', base: 10, growth: 17 },
  { name: 'Sushi88', niche: 'restaurant', base: 18, growth: 6 },
  { name: 'Moda Plaza', niche: 'fashion', base: 20, growth: 2 },
  { name: 'Data School', niche: 'course', base: 7, growth: 48 },
  { name: 'Nonvoy', niche: 'food', base: 26, growth: 5 },
  { name: 'Click', niche: 'services', base: 38, growth: 13 },
  { name: 'Payme', niche: 'services', base: 33, growth: 16 },
  { name: 'Beeline UZ', niche: 'services', base: 29, growth: 1 },
  { name: 'Ucell', niche: 'services', base: 25, growth: 4 },
  { name: 'MARS Gym', niche: 'services', base: 12, growth: 39 },
  { name: 'Burger Lab', niche: 'food', base: 17, growth: 21 },
]

const CATEGORY_UZ: Record<AdLibraryNiche, string> = {
  fashion: 'Fashion',
  course: 'Kurslar',
  restaurant: 'Restoran',
  food: 'Oziq-ovqat',
  edu: 'Ta’lim',
  services: 'Xizmat / fintech',
}

export function getTopAdvertisers(): AdLibraryAdvertiser[] {
  return [...PAGES]
    .sort((a, b) => b.base - a.base)
    .slice(0, 30)
    .map((p, i) => ({
      rank: i + 1,
      pageName: p.name,
      niche: p.niche,
      activeAds: p.base,
      growthPct: p.growth,
      categoryLabel: CATEGORY_UZ[p.niche],
    }))
}

function plat(letter: 'm' | 'y' | 't'): Array<'Facebook' | 'Instagram' | 'Yandex' | 'TikTok'> {
  if (letter === 'y') return ['Yandex']
  if (letter === 't') return ['TikTok']
  return ['Facebook', 'Instagram']
}

function buildAd(
  id: string,
  pageIdx: number,
  variant: number,
  overrides: Partial<AdLibraryRawAd>,
): AdLibraryRawAd {
  const p = PAGES[pageIdx % PAGES.length]
  const letters: Array<'m' | 'y' | 't'> = ['m', 'm', 'm', 'y', 't']
  const letter = letters[pageIdx % letters.length]
  const fmt: Array<'video' | 'image' | 'carousel'> = ['video', 'image', 'carousel']
  const format = fmt[variant % 3]
  const seed = `${id}-${variant}`.replace(/\W/g, '')
  return {
    id,
    pageName: p.name,
    niche: p.niche,
    platforms: plat(letter),
    format,
    headline: `${p.name} — maxsus taklif`,
    primaryText:
      variant % 2 === 0
        ? 'Bugun boshlang: chegirma va tez yetkazib berish. O‘zbekiston bo‘ylab.'
        : 'Ro‘yxatdan o‘ting va bonus oling. Faqat cheklangan vaqt.',
    creativeUrl: `https://picsum.photos/seed/${seed}/480/480`,
    daysActive: 3 + ((pageIdx * 7 + variant * 5) % 28),
    variationCount: 1 + ((pageIdx + variant) % 6),
    engagement01: 0.25 + ((pageIdx * 13 + variant * 7) % 65) / 100,
    creativeAgeDays: (variant * 3 + pageIdx) % 20,
    launchedDaysAgo: (pageIdx + variant * 2) % 25,
    ...overrides,
  }
}

/** ~48 ta mock reklama (MVP). Real: Meta ads_archive + UZ */
export function getMockAdLibraryRows(): AdLibraryRawAd[] {
  const rows: AdLibraryRawAd[] = []
  let n = 0
  for (let pageIdx = 0; pageIdx < PAGES.length; pageIdx++) {
    for (let v = 0; v < 2; v++) {
      rows.push(buildAd(`ad_uz_${n++}`, pageIdx, v, {}))
    }
  }
  return rows
}
