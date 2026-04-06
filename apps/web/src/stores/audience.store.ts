import { create } from 'zustand'
import type { Audience, AudienceMetrics } from '@/types/retargeting'

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_AUDIENCES: Audience[] = [
  // Prospecting
  {
    id: 'aud_1',
    name: 'Keng auditoriya',
    type: 'lookalike',
    funnelStage: 'prospecting',
    size: 2400000,
    recencyDays: 30,
    description: 'Mavjud mijozlarga o\'xshash yangi foydalanuvchilar',
    isActive: true,
    createdAt: '2024-01-10',
  },
  {
    id: 'aud_2',
    name: 'Raqobatchi auditoriyasi',
    type: 'custom',
    funnelStage: 'prospecting',
    size: 890000,
    recencyDays: 30,
    description: 'Raqobatchilarning sahifalarini ko\'rganlar',
    isActive: true,
    createdAt: '2024-01-12',
  },
  // Re-engagement
  {
    id: 'aud_3',
    name: 'Barcha sayt tashrif buyuruvchilar (30 kun)',
    type: 'visitors',
    funnelStage: 'reengagement',
    size: 145000,
    recencyDays: 30,
    description: 'Oxirgi 30 kunda saytga kirgan foydalanuvchilar',
    isActive: true,
    createdAt: '2024-01-05',
  },
  {
    id: 'aud_4',
    name: 'Video ko\'rganlar (50%+)',
    type: 'engaged',
    funnelStage: 'reengagement',
    size: 67000,
    recencyDays: 14,
    description: 'Videolarning kamida 50% ini ko\'rganlar',
    isActive: true,
    createdAt: '2024-01-08',
  },
  // Retargeting
  {
    id: 'aud_5',
    name: 'Yuqori niyatli tashrif buyuruvchilar (30 kun)',
    type: 'visitors',
    funnelStage: 'retargeting',
    size: 32000,
    recencyDays: 30,
    description: 'Mahsulot sahifasi yoki narx sahifasini ko\'rganlar',
    isActive: true,
    createdAt: '2024-01-03',
  },
  {
    id: 'aud_6',
    name: 'Savatga qo\'shgan, xarid qilmagan',
    type: 'visitors',
    funnelStage: 'retargeting',
    size: 8400,
    recencyDays: 7,
    description: 'Savatga mahsulot qo\'shgan lekin to\'lovga o\'tmagan',
    isActive: true,
    createdAt: '2024-01-15',
  },
  {
    id: 'aud_7',
    name: 'Bir necha marta kirganlar',
    type: 'visitors',
    funnelStage: 'retargeting',
    size: 19000,
    recencyDays: 14,
    description: 'Oxirgi 14 kunda 3+ marta saytga kirganlar',
    isActive: true,
    createdAt: '2024-01-11',
  },
  // Retention
  {
    id: 'aud_8',
    name: 'Faol mijozlar',
    type: 'customers',
    funnelStage: 'retention',
    size: 12500,
    recencyDays: 90,
    description: 'Oxirgi 90 kunda xarid qilgan mijozlar',
    isActive: true,
    createdAt: '2024-01-01',
  },
  {
    id: 'aud_9',
    name: 'VIP mijozlar',
    type: 'customers',
    funnelStage: 'retention',
    size: 2100,
    recencyDays: 180,
    description: '3+ marta xarid qilgan yoki yuqori LTV\'li mijozlar',
    isActive: true,
    createdAt: '2024-01-01',
  },
]

const MOCK_METRICS: AudienceMetrics[] = [
  { audienceId: 'aud_5', impressions: 184000, clicks: 5520, conversions: 276, spend: 1240, ctr: 3.0, cpc: 0.22, roas: 4.2, period: '30d' },
  { audienceId: 'aud_6', impressions: 67000,  clicks: 3350, conversions: 201, spend: 890,  ctr: 5.0, cpc: 0.27, roas: 6.8, period: '30d' },
  { audienceId: 'aud_7', impressions: 98000,  clicks: 2940, conversions: 147, spend: 760,  ctr: 3.0, cpc: 0.26, roas: 3.9, period: '30d' },
  { audienceId: 'aud_8', impressions: 52000,  clicks: 2600, conversions: 312, spend: 620,  ctr: 5.0, cpc: 0.24, roas: 8.1, period: '30d' },
]

// ─── Store ────────────────────────────────────────────────────────────────────

interface AudienceStore {
  audiences: Audience[]
  metrics: AudienceMetrics[]
  selectedAudience: Audience | null
  isLoading: boolean

  // Actions
  setSelectedAudience: (audience: Audience | null) => void
  addAudience: (audience: Omit<Audience, 'id' | 'createdAt'>) => void
  toggleAudience: (id: string) => void
  getByStage: (stage: Audience['funnelStage']) => Audience[]
  getMetrics: (audienceId: string) => AudienceMetrics | undefined
}

export const useAudienceStore = create<AudienceStore>((set, get) => ({
  audiences: MOCK_AUDIENCES,
  metrics: MOCK_METRICS,
  selectedAudience: null,
  isLoading: false,

  setSelectedAudience: (audience) => set({ selectedAudience: audience }),

  addAudience: (data) => {
    const newAudience: Audience = {
      ...data,
      id: `aud_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    }
    set((s) => ({ audiences: [newAudience, ...s.audiences] }))
  },

  toggleAudience: (id) =>
    set((s) => ({
      audiences: s.audiences.map((a) =>
        a.id === id ? { ...a, isActive: !a.isActive } : a
      ),
    })),

  getByStage: (stage) => get().audiences.filter((a) => a.funnelStage === stage),

  getMetrics: (audienceId) => get().metrics.find((m) => m.audienceId === audienceId),
}))
