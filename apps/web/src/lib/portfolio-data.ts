export interface PortfolioTargetologist {
  id: string
  slug: string
  name: string
  avatar: string          // initials fallback
  avatarColor: string
  title: string
  location: string
  bio: string
  verified: boolean
  proMember: boolean
  joinedAt: string
  responseTime: string    // "2 soat ichida"
  rating: number
  reviewCount: number
  price: { from: number; currency: string; unit: string }

  // platforms with verification status
  platforms: {
    id: string
    name: string
    icon: string
    color: string
    verified: boolean
    accountsConnected: number
  }[]

  // aggregated stats (from connected accounts)
  stats: {
    totalSpendManaged: number   // USD
    avgROAS: number
    avgCPA: number
    avgCTR: number
    totalCampaigns: number
    activeCampaigns: number
    successRate: number         // % profitable campaigns
    bestROAS: number
  }

  // niche specialization
  niches: string[]

  // monthly performance history (last 6 months)
  monthlyPerformance: {
    month: string
    roas: number
    spend: number
    campaigns: number
  }[]

  // platform split
  platformSplit: { platform: string; percent: number; color: string }[]

  // recent campaigns (anonymized)
  recentCampaigns: {
    id: string
    niche: string
    platform: string
    duration: string
    spend: number
    roas: number
    cpa: number
    status: 'active' | 'completed' | 'paused'
  }[]

  // reviews
  reviews: {
    id: string
    author: string
    company: string
    rating: number
    text: string
    date: string
    verified: boolean
  }[]
}

/* ── Mock data ─────────────────────────────────────────────────────────── */
export const MOCK_TARGETOLOGISTS: PortfolioTargetologist[] = [
  {
    id: '1',
    slug: 'akbar-rakhimov',
    name: 'Akbar Rahimov',
    avatar: 'AR',
    avatarColor: 'from-[#7C3AED] to-[#5B21B6]',
    title: 'Senior Performance Marketer',
    location: 'Toshkent, O\'zbekiston',
    bio: '5+ yil tajriba. E-commerce va mobile app uchun ixtisoslashgan. Meta va Google bo\'yicha sertifikatlangan mutaxassis. 2M+ USD reklama byudjeti boshqargan.',
    verified: true,
    proMember: true,
    joinedAt: '2022-03',
    responseTime: '2 soat ichida',
    rating: 4.9,
    reviewCount: 47,
    price: { from: 800, currency: 'USD', unit: 'oyiga' },
    platforms: [
      { id: 'meta', name: 'Meta Ads', icon: '📘', color: '#1877F2', verified: true, accountsConnected: 12 },
      { id: 'google', name: 'Google Ads', icon: '🔍', color: '#4285F4', verified: true, accountsConnected: 8 },
      { id: 'yandex', name: 'Yandex Direct', icon: '🟡', color: '#FFCC00', verified: true, accountsConnected: 5 },
    ],
    stats: {
      totalSpendManaged: 2_340_000,
      avgROAS: 4.2,
      avgCPA: 8.4,
      avgCTR: 3.8,
      totalCampaigns: 183,
      activeCampaigns: 14,
      successRate: 87,
      bestROAS: 12.6,
    },
    niches: ['E-commerce', 'Fashion', 'Mobile App', 'B2B SaaS'],
    monthlyPerformance: [
      { month: 'Okt', roas: 3.8, spend: 180_000, campaigns: 28 },
      { month: 'Noy', roas: 4.1, spend: 210_000, campaigns: 31 },
      { month: 'Dek', roas: 4.8, spend: 290_000, campaigns: 38 },
      { month: 'Yan', roas: 3.9, spend: 175_000, campaigns: 26 },
      { month: 'Fev', roas: 4.4, spend: 225_000, campaigns: 33 },
      { month: 'Mar', roas: 4.2, spend: 240_000, campaigns: 27 },
    ],
    platformSplit: [
      { platform: 'Meta', percent: 55, color: '#1877F2' },
      { platform: 'Google', percent: 30, color: '#4285F4' },
      { platform: 'Yandex', percent: 15, color: '#FFCC00' },
    ],
    recentCampaigns: [
      { id: 'c1', niche: 'Fashion E-commerce', platform: 'meta', duration: '45 kun', spend: 28_500, roas: 5.2, cpa: 6.8, status: 'completed' },
      { id: 'c2', niche: 'Mobile App Install', platform: 'google', duration: 'Faol', spend: 12_400, roas: 3.8, cpa: 1.2, status: 'active' },
      { id: 'c3', niche: 'Electronics', platform: 'meta', duration: '30 kun', spend: 18_000, roas: 4.6, cpa: 9.5, status: 'completed' },
      { id: 'c4', niche: 'Food Delivery', platform: 'yandex', duration: 'Faol', spend: 8_200, roas: 3.1, cpa: 4.2, status: 'active' },
    ],
    reviews: [
      { id: 'r1', author: 'Sardor M.', company: 'TechShop UZ', rating: 5, text: 'ROAS 2.3x dan 5.2x ga ko\'tarildi 2 oyda. Ajoyib natijalar!', date: '2025-03-10', verified: true },
      { id: 'r2', author: 'Dilnoza K.', company: 'Moda Store', rating: 5, text: 'CPA 40% kamaydi. Juda professional ishlaydi.', date: '2025-02-28', verified: true },
      { id: 'r3', author: 'Rustam A.', company: 'AutoParts', rating: 4, text: 'Yaxshi natijalar, kommunikatsiya ham zo\'r.', date: '2025-02-15', verified: true },
    ],
  },
  {
    id: '2',
    slug: 'nilufar-yusupova',
    name: 'Nilufar Yusupova',
    avatar: 'NY',
    avatarColor: 'from-[#EC4899] to-[#BE185D]',
    title: 'Meta & Instagram Ads Specialist',
    location: 'Samarqand, O\'zbekiston',
    bio: '3 yil Meta ekosistemasi bo\'yicha ixtisoslashgan. Beauty, lifestyle va food niche\'larida kuchli. Instagram Reels va Stories formatlarida yuqori CTR.',
    verified: true,
    proMember: false,
    joinedAt: '2023-01',
    responseTime: '4 soat ichida',
    rating: 4.7,
    reviewCount: 31,
    price: { from: 500, currency: 'USD', unit: 'oyiga' },
    platforms: [
      { id: 'meta', name: 'Meta Ads', icon: '📘', color: '#1877F2', verified: true, accountsConnected: 9 },
      { id: 'telegram', name: 'Telegram Ads', icon: '✈️', color: '#2CA5E0', verified: false, accountsConnected: 3 },
    ],
    stats: {
      totalSpendManaged: 890_000,
      avgROAS: 3.8,
      avgCPA: 11.2,
      avgCTR: 4.6,
      totalCampaigns: 94,
      activeCampaigns: 8,
      successRate: 82,
      bestROAS: 8.4,
    },
    niches: ['Beauty & Cosmetics', 'Lifestyle', 'Food & Beverage', 'Clothing'],
    monthlyPerformance: [
      { month: 'Okt', roas: 3.2, spend: 95_000, campaigns: 14 },
      { month: 'Noy', roas: 3.6, spend: 120_000, campaigns: 17 },
      { month: 'Dek', roas: 4.1, spend: 160_000, campaigns: 21 },
      { month: 'Yan', roas: 3.5, spend: 98_000, campaigns: 13 },
      { month: 'Fev', roas: 3.9, spend: 115_000, campaigns: 16 },
      { month: 'Mar', roas: 3.8, spend: 112_000, campaigns: 13 },
    ],
    platformSplit: [
      { platform: 'Meta', percent: 78, color: '#1877F2' },
      { platform: 'Telegram', percent: 22, color: '#2CA5E0' },
    ],
    recentCampaigns: [
      { id: 'c5', niche: 'Beauty Brand', platform: 'meta', duration: '60 kun', spend: 22_000, roas: 4.8, cpa: 8.4, status: 'completed' },
      { id: 'c6', niche: 'Online Food', platform: 'meta', duration: 'Faol', spend: 9_800, roas: 3.4, cpa: 5.2, status: 'active' },
    ],
    reviews: [
      { id: 'r4', author: 'Kamola B.', company: 'BeautyGlow', rating: 5, text: 'Instagram Reels orqali juda yaxshi natijalar. Maslahat ham zo\'r.', date: '2025-03-05', verified: true },
    ],
  },
  {
    id: '3',
    slug: 'bobur-mirzayev',
    name: 'Bobur Mirzayev',
    avatar: 'BM',
    avatarColor: 'from-[#059669] to-[#065F46]',
    title: 'Google Ads & Yandex Direct Expert',
    location: 'Toshkent, O\'zbekiston',
    bio: 'Google Certified Partner. B2B va real estate niches uchun ixtisoslashgan. Search kampaniyalarida past CPA bilan yuqori konversiya.',
    verified: true,
    proMember: true,
    joinedAt: '2021-09',
    responseTime: '1 soat ichida',
    rating: 4.8,
    reviewCount: 62,
    price: { from: 1200, currency: 'USD', unit: 'oyiga' },
    platforms: [
      { id: 'google', name: 'Google Ads', icon: '🔍', color: '#4285F4', verified: true, accountsConnected: 15 },
      { id: 'yandex', name: 'Yandex Direct', icon: '🟡', color: '#FFCC00', verified: true, accountsConnected: 11 },
      { id: 'meta', name: 'Meta Ads', icon: '📘', color: '#1877F2', verified: false, accountsConnected: 4 },
    ],
    stats: {
      totalSpendManaged: 4_100_000,
      avgROAS: 5.1,
      avgCPA: 14.2,
      avgCTR: 5.2,
      totalCampaigns: 241,
      activeCampaigns: 19,
      successRate: 91,
      bestROAS: 18.3,
    },
    niches: ['Real Estate', 'B2B SaaS', 'Finance', 'Healthcare', 'Education'],
    monthlyPerformance: [
      { month: 'Okt', roas: 4.8, spend: 380_000, campaigns: 38 },
      { month: 'Noy', roas: 5.2, spend: 420_000, campaigns: 41 },
      { month: 'Dek', roas: 5.6, spend: 510_000, campaigns: 47 },
      { month: 'Yan', roas: 4.9, spend: 360_000, campaigns: 35 },
      { month: 'Fev', roas: 5.3, spend: 440_000, campaigns: 43 },
      { month: 'Mar', roas: 5.1, spend: 415_000, campaigns: 37 },
    ],
    platformSplit: [
      { platform: 'Google', percent: 52, color: '#4285F4' },
      { platform: 'Yandex', percent: 38, color: '#FFCC00' },
      { platform: 'Meta', percent: 10, color: '#1877F2' },
    ],
    recentCampaigns: [
      { id: 'c7', niche: 'Real Estate', platform: 'google', duration: '90 kun', spend: 85_000, roas: 6.8, cpa: 42.0, status: 'completed' },
      { id: 'c8', niche: 'B2B Software', platform: 'google', duration: 'Faol', spend: 32_000, roas: 4.2, cpa: 28.5, status: 'active' },
      { id: 'c9', niche: 'Finance Services', platform: 'yandex', duration: 'Faol', spend: 41_000, roas: 5.5, cpa: 18.4, status: 'active' },
    ],
    reviews: [
      { id: 'r5', author: 'Jasur T.', company: 'PropTech UZ', rating: 5, text: 'Real estate bo\'yicha eng yaxshi mutaxassis. 18x ROAS ko\'rdik.', date: '2025-03-12', verified: true },
      { id: 'r6', author: 'Alisher N.', company: 'FinanceApp', rating: 5, text: 'Google Search da CPA 50% kamaydi. Zo\'r professional.', date: '2025-02-20', verified: true },
    ],
  },
]

export function formatSpend(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
  return `$${amount}`
}
