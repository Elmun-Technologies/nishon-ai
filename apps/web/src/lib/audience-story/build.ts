import type { AudienceStoryPayload } from '@/lib/audience-story/types'

/**
 * MVP: mock “Dilnoza” hikoyasi. Keyin: Meta Insights + Signal Bridge + klaster.
 * 100+ purchase bo‘lgach ishonchlilik oshadi — `confidenceNote`.
 */
export function buildAudienceStoryPayload(_workspaceId: string): AudienceStoryPayload {
  const now = new Date().toISOString()
  return {
    persona: {
      id: 'persona-dilnoza-1',
      name: 'Dilnoza',
      ageRange: '21–24',
      role: 'talaba',
      district: 'Chilonzor',
      city: 'Toshkent',
      avatarUrl: 'https://picsum.photos/seed/audience-dilnoza/320/320',
      onlineHours: '20:00 – 23:30',
      loves: ['krossovka', 'kofe', 'Instagram Reels', 'yangi kolleksiyalar'],
      monthlyBudgetUzs: 500_000,
      avgCheckUzs: 285_000,
      dataNote: 'O‘rtacha profil — klasterdan (mock). Haqiqiy deploy: 1000+ signal.',
    },
    journey: [
      {
        id: 's1',
        label: "Ko'rdi",
        count: 12_400,
        stageRatePct: 100,
        dropoffInsight: 'Boshlang‘ich trafik: Reach va saqlash yaxshi.',
      },
      {
        id: 's2',
        label: "Qiziqdi",
        count: 1_488,
        stageRatePct: 12,
        dropoffInsight: "Ko'rdi → Qiziqdi: kreativ diqqat tortdi, lekin headline CTA zaif — A/B qiling.",
      },
      {
        id: 's3',
        label: 'Saytga kirdi',
        count: 372,
        stageRatePct: 3,
        dropoffInsight: 'Qiziqdi → Sayt: landing yuklanishi sekin bo‘lishi mumkin (proxy).',
      },
      {
        id: 's4',
        label: "Savatga soldi",
        count: 149,
        stageRatePct: 1.2,
        dropoffInsight: 'Sayt → Savat: narx/shipping ijtimoiy isboti past.',
      },
      {
        id: 's5',
        label: "Sotib oldi",
        count: 99,
        stageRatePct: 0.8,
        dropoffInsight: "Savat → Sotib: yetkazib berish narxi qimmat deb ko'rinadi (67% drop).",
      },
    ],
    interests: [
      { name: 'Kiyim', pct: 92 },
      { name: "Go'zallik", pct: 78 },
      { name: 'Kofe', pct: 65 },
      { name: 'Sayohat', pct: 45 },
      { name: 'Fitness', pct: 38 },
    ],
    interestAiTip: "Go'zallik bilan cross-targeting — lookalike 1% + interest stack sinovi tavsiya.",
    creativeAffinity: [
      {
        id: 'vf',
        title: 'Format',
        multiplier: 3.2,
        winner: 'Video',
        loser: 'Rasm',
        shortInsight: 'Reels formatida saqlanish yuqori.',
      },
      {
        id: 'ugc',
        title: 'Ishlab chiqarish',
        multiplier: 2.1,
        winner: 'UGC',
        loser: 'Studio',
        shortInsight: 'Ishonch: “odam gapirayapti” effekti.',
      },
      {
        id: 'bg',
        title: 'Fon',
        multiplier: 1.8,
        winner: 'Oq fon',
        loser: 'Rangli',
        shortInsight: 'Minimal mahsulot fokus.',
      },
    ],
    compare: {
      you: { ageRange: '18–24', peakHours: '20:00–23:00', channel: 'Instagram Reels' },
      competitor: { ageRange: '25–34', peakHours: '12:00–15:00', channel: 'Feed + Stories' },
      lowTimeOverlap: true,
      summary: 'Siz kechqurun “tilga olinadigan” vaqt; raqib tush payti — auktsion to‘qnashuvi kamayadi.',
    },
    updatedAt: now,
    confidenceNote:
      'Hozircha mock. 100+ purchase + Signal Bridge bilan har 24 soat yangilanadigan persona ishonchliligi.',
  }
}
