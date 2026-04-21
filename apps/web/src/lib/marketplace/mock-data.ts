import type { PerformancePoint, TargetologistProfile } from './types'

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function genPerf(seedStr: string, days: number, baseRoas: number): PerformancePoint[] {
  const seed = [...seedStr].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)
  const rnd = mulberry32(Math.abs(seed))
  return Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - days + i)
    const noise = (rnd() - 0.5) * 0.8
    return {
      date: d.toISOString().split('T')[0]!,
      spend: 50 + rnd() * 150,
      roas: Math.max(0.5, baseRoas + noise),
      cpa: 15000 + rnd() * 10000,
      purchases: Math.floor(rnd() * 5),
    }
  })
}

export function getMockTargetologists(): TargetologistProfile[] {
  return [
    {
      id: '1',
      name: 'Dilshod Karimov',
      avatar: 'https://i.pravatar.cc/150?u=adspectr1',
      verified: true,
      niche: ['kiyim', 'e-commerce'],
      platforms: ['meta', 'telegram'],
      languages: ['uz', 'ru'],
      location: 'Toshkent',
      totalSpend: 12400,
      performance: genPerf('1', 90, 3.2),
      accountAgeDays: 420,
      policyViolations: 0,
      banHistoryMonthsAgo: null,
      roasWeekOverWeekDropPct: 4,
      portfolio: [
        {
          id: 'p1',
          client: 'StepUp.uz',
          niche: 'kiyim',
          durationDays: 60,
          startCpa: 28000,
          endCpa: 16500,
          spend: 3200,
          creativesUsed: 14,
          chart: genPerf('p1', 60, 3.5),
        },
      ],
    },
    {
      id: '2',
      name: 'Aziza Rahimova',
      avatar: 'https://i.pravatar.cc/150?u=adspectr2',
      verified: true,
      niche: ['kurs', 'edu'],
      platforms: ['meta', 'google', 'tiktok'],
      languages: ['uz', 'ru', 'en'],
      location: 'Samarqand',
      totalSpend: 8700,
      performance: genPerf('2', 90, 4.1),
      accountAgeDays: 210,
      policyViolations: 0,
      banHistoryMonthsAgo: null,
      roasWeekOverWeekDropPct: 0,
      portfolio: [],
    },
    {
      id: '3',
      name: 'Akmal Tursunov',
      avatar: 'https://i.pravatar.cc/150?u=adspectr3',
      verified: false,
      niche: ['restoran', 'local'],
      platforms: ['google', 'yandex'],
      languages: ['ru', 'uz'],
      location: 'Remote',
      totalSpend: 3200,
      performance: genPerf('3', 90, 2.4),
      accountAgeDays: 120,
      policyViolations: 1,
      banHistoryMonthsAgo: 3,
      roasWeekOverWeekDropPct: 62,
      portfolio: [],
    },
    {
      id: '4',
      name: 'Malika Yusupova',
      avatar: 'https://i.pravatar.cc/150?u=adspectr4',
      verified: true,
      niche: ['kiyim', 'med'],
      platforms: ['meta'],
      languages: ['uz', 'en'],
      location: 'Toshkent',
      totalSpend: 5600,
      performance: genPerf('4', 90, 4.6),
      accountAgeDays: 95,
      policyViolations: 0,
      banHistoryMonthsAgo: null,
      roasWeekOverWeekDropPct: 1,
      portfolio: [
        {
          id: 'p4',
          client: 'ModaLine',
          niche: 'kiyim',
          durationDays: 45,
          startCpa: 22000,
          endCpa: 9100,
          spend: 2100,
          creativesUsed: 22,
          chart: genPerf('p4', 45, 4.2),
        },
      ],
    },
  ]
}
