'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, MapPin, DollarSign, Clock, Check, Mail, MessageSquare } from 'lucide-react'
import { PublicContainer, PublicFooter, PublicNavbar } from '@/components/public/PublicLayout'

const SPECIALIST_DATA = {
  spec_1: {
    id: 'spec_1',
    name: 'Dilshod Rakhimov',
    avatar: '👨‍💼',
    title: 'Meta & Google Ads Specialist',
    bio: "E-commerce va performance marketing'da 7 yillik tajriba. Meta va Google da sertifikatsiyalangan.",
    basePrice: 250,
    roas: 4.8,
    rating: 4.9,
    reviewCount: 127,
    certifications: ['meta', 'google'],
    specialties: ['ecommerce', 'performance'],
    experience: 7,
    campaignsManaged: 340,
    totalSpend: 45.2,
    responseTime: 2,
    successRate: 94,
    location: 'Tashkent, Uzbekistan',
    languages: ['Uzbek', 'Russian', 'English'],
    verified: true,
    description:
      "E-commerce markolog sifatida men kichik online shop'larni katta biznesga o'tkazishni yordam beradim. Mening strategiyam:\n\n1. Data-driven audience segmentation\n2. Creative testing framework\n3. Automated budget allocation\n4. Real-time optimization\n\nO'rtacha natijalarim:\n- ROAS 4.8x\n- CPA reduction 30%\n- Campaign setup time 75% qisqarish\n- Team productivity 3x o'sish",
    portfolio: [
      {
        title: 'E-commerce Brand — Uzbek Market',
        roas: 6.2,
        spend: 125000,
        industry: 'Fashion & Apparel',
      },
      {
        title: 'SaaS Product Launch — Regional',
        roas: 3.8,
        spend: 89000,
        industry: 'B2B Software',
      },
      {
        title: 'Digital Agency Client Portfolio',
        roas: 5.1,
        spend: 250000,
        industry: 'Multi-vertical',
      },
    ],
    testimonials: [
      {
        text: "Dilshod bizning kampaniyani 3 oydada 2x ROAS o'sishiga yordam berdi. Professionali va responsive.",
        author: 'Farida M., E-commerce CEO',
        rating: 5,
      },
      {
        text: "Admin ish juda ko'p edi, ammo Dilshod buni Performa bilan avtomatizatsiya qildi. Ajoyib!",
        author: 'Rustam K., Store Owner',
        rating: 5,
      },
      {
        text: 'Ayniqsa Google Ads tarafida chuqur bilimiga ega. Tavsiya qilamiz.',
        author: 'Aziz T., Marketing Manager',
        rating: 4,
      },
    ],
  },
  spec_2: {
    id: 'spec_2',
    name: 'Saida Karimova',
    avatar: '👩‍💼',
    title: 'Growth Marketing Strategist',
    bio: "Funnel, lifecycle va retention yo'nalishida 6 yillik tajriba. Growth stackni tez scale qilishga ixtisoslashgan.",
    basePrice: 220,
    roas: 4.2,
    rating: 4.8,
    reviewCount: 93,
    certifications: ['meta', 'google'],
    specialties: ['funnel', 'retention'],
    experience: 6,
    campaignsManaged: 280,
    totalSpend: 31.7,
    responseTime: 3,
    successRate: 91,
    location: 'Samarkand, Uzbekistan',
    languages: ['Uzbek', 'Russian', 'English'],
    verified: true,
    description:
      "Growth marketing bo'yicha asosiy kuchim - acquisition va retention orasidagi uzilishni yopish.\n\n1. Funnel leak audit\n2. Creative-message alignment\n3. Channel by channel budget pacing\n4. Weekly optimization loops",
    portfolio: [
      { title: 'Beauty D2C Growth Sprint', roas: 5.0, spend: 98000, industry: 'Beauty' },
      { title: 'EdTech Enrollment Campaign', roas: 3.6, spend: 72000, industry: 'Education' },
      { title: 'Subscription App Reactivation', roas: 4.1, spend: 64000, industry: 'Mobile App' },
    ],
    testimonials: [
      { text: "Saida funneldagi asosiy to'siqlarni aniqlab CPA ni sezilarli pasaytirdi.", author: 'Javlon R., Founder', rating: 5 },
      { text: 'Har haftalik hisobotlari juda aniq va amaliy bo`ladi.', author: 'Malika A., Marketing Lead', rating: 5 },
    ],
  },
  spec_3: {
    id: 'spec_3',
    name: 'Akmal Tursunov',
    avatar: '👨‍🔧',
    title: 'Media Buying Lead',
    bio: "Lead gen va byudjet intizomi bo'yicha ishlaydi. Performance panel va reporting intizomi kuchli.",
    basePrice: 180,
    roas: 3.9,
    rating: 4.7,
    reviewCount: 86,
    certifications: ['meta'],
    specialties: ['leadgen', 'reporting'],
    experience: 5,
    campaignsManaged: 240,
    totalSpend: 24.4,
    responseTime: 4,
    successRate: 89,
    location: 'Tashkent, Uzbekistan',
    languages: ['Uzbek', 'Russian'],
    verified: false,
    description:
      "Media buying workflowlari va budget control bo'yicha amaliy yondashuvga ega.\n\n1. KPI-ga asoslangan campaign structure\n2. Spend volatility nazorati\n3. Fast creatives rotation\n4. Reporting discipline",
    portfolio: [
      { title: 'Real Estate Leads Campaign', roas: 3.4, spend: 56000, industry: 'Real Estate' },
      { title: 'Automotive Performance Push', roas: 4.0, spend: 79000, industry: 'Automotive' },
      { title: 'Healthcare Acquisition', roas: 4.3, spend: 68000, industry: 'Healthcare' },
    ],
    testimonials: [
      { text: 'Akmal performance pasayishini juda tez tutib optimizatsiya qiladi.', author: 'Dilnoza P., COO', rating: 5 },
      { text: 'Byudjetni nazorat qilishda juda tartibli ishlaydi.', author: 'Bekzod M., Owner', rating: 4 },
    ],
  },
}

export default function SpecialistProfilePage({ params }: { params: { slug: string } }) {
  const specialist = SPECIALIST_DATA[params.slug as keyof typeof SPECIALIST_DATA]
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'testimonials'>('overview')

  if (!specialist) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-2 text-text-primary">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-bold">Specialist topilmadi</h1>
          <Link href="/marketplace" className="text-primary hover:underline">
            ← Marketplace'ga qaytish
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-surface-2 text-text-primary">
      <PublicNavbar />

      <section className="border-b border-border bg-surface py-8">
        <PublicContainer>
          <Link href="/marketplace" className="mb-4 inline-block text-primary hover:underline">
            ← Marketplace'ga qaytish
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-5xl">{specialist.avatar}</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{specialist.name}</h1>
                {specialist.verified && <Check size={20} className="text-emerald-500" />}
              </div>
              <p className="text-lg text-text-secondary">{specialist.title}</p>
            </div>
          </div>
        </PublicContainer>
      </section>

      <section className="py-10">
        <PublicContainer>
        <div className="grid gap-8 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2">
            {/* Quick Stats */}
            <div className="mb-8 rounded-2xl border border-border bg-surface p-8">
              <h2 className="mb-6 text-2xl font-bold">Statistika</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="mb-2 text-sm text-text-tertiary">ROAS</p>
                  <p className="text-3xl font-bold text-emerald-600">{specialist.roas}x</p>
                </div>
                <div>
                  <p className="mb-2 text-sm text-text-tertiary">Reytingi</p>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold">{specialist.rating}</span>
                    <Star size={20} className="text-yellow-400 fill-yellow-400" />
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm text-text-tertiary">Success Rate</p>
                  <p className="text-3xl font-bold text-primary">{specialist.successRate}%</p>
                </div>
                <div>
                  <p className="mb-2 text-sm text-text-tertiary">Omonatlari</p>
                  <p className="text-3xl font-bold">{specialist.reviewCount}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-8 rounded-2xl border border-border bg-surface p-8">
              <div className="mb-8 flex gap-4 border-b border-border">
                {(['overview', 'portfolio', 'testimonials'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
                      activeTab === tab
                        ? 'border-primary text-primary'
                        : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {tab === 'overview' && 'Haqida'}
                    {tab === 'portfolio' && 'Portfolio'}
                    {tab === 'testimonials' && 'Omonatlari'}
                  </button>
                ))}
              </div>

              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-3 text-xl font-semibold">Bio</h3>
                    <p className="text-text-secondary whitespace-pre-line">{specialist.description}</p>
                  </div>

                  <div className="border-t border-border pt-6">
                    <h3 className="mb-4 text-xl font-semibold">Bilgisi</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">📚</div>
                        <div>
                          <p className="text-text-tertiary text-sm">Tajribasi</p>
                          <p className="text-lg font-semibold">{specialist.experience} yil</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">📊</div>
                        <div>
                          <p className="text-text-tertiary text-sm">Boshqariladigan Kampaniyalar</p>
                          <p className="text-lg font-semibold">{specialist.campaignsManaged}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">💰</div>
                        <div>
                          <p className="text-text-tertiary text-sm">Total Spend</p>
                          <p className="text-lg font-semibold">${specialist.totalSpend}M</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">⚡</div>
                        <div>
                          <p className="text-text-tertiary text-sm">Response Time</p>
                          <p className="text-lg font-semibold">{specialist.responseTime} soat</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-6">
                    <h3 className="mb-4 text-xl font-semibold">Tillar</h3>
                    <div className="flex flex-wrap gap-2">
                      {specialist.languages.map((lang) => (
                        <span
                          key={lang}
                          className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-sm text-text-secondary"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border pt-6">
                    <h3 className="mb-4 text-xl font-semibold">Sertifikatsiyalar</h3>
                    <div className="flex flex-wrap gap-2">
                      {specialist.certifications.map((cert) => (
                        <span
                          key={cert}
                          className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-sm text-text-secondary"
                        >
                          {cert === 'meta' && '📘 Meta'}
                          {cert === 'google' && '🔵 Google'}
                          {cert === 'tiktok' && '🎵 TikTok'}
                          {cert === 'yandex' && '🔴 Yandex'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'portfolio' && (
                <div className="space-y-4">
                  {specialist.portfolio.map((project, idx) => (
                    <div key={idx} className="rounded-xl border border-border bg-surface-2 p-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-text-primary">{project.title}</h4>
                          <p className="text-sm text-text-tertiary">{project.industry}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-emerald-600">{project.roas}x</p>
                          <p className="text-xs text-text-tertiary">ROAS</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-text-secondary">
                        <span>💰 ${(project.spend / 1000).toFixed(0)}K spend</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'testimonials' && (
                <div className="space-y-4">
                  {specialist.testimonials.map((testimonial, idx) => (
                    <div key={idx} className="rounded-xl border border-border bg-surface-2 p-5">
                      <div className="mb-3 flex items-center gap-1">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                      <p className="mb-4 leading-relaxed text-text-primary">"{testimonial.text}"</p>
                      <p className="text-sm text-text-tertiary">— {testimonial.author}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - CTA */}
          <div className="md:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-border bg-surface p-8">
              <h2 className="mb-6 text-2xl font-bold">Ishga olib boshlang</h2>

              <div className="mb-8 space-y-4 border-b border-border pb-8">
                <div className="flex items-center gap-3">
                  <DollarSign size={20} className="text-emerald-400" />
                  <div>
                    <p className="text-text-tertiary text-sm">Narxi</p>
                    <p className="text-2xl font-bold">${specialist.basePrice}</p>
                    <p className="text-xs text-text-tertiary">/soat</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-primary" />
                  <div>
                    <p className="text-text-tertiary text-sm">Javob vaqti</p>
                    <p className="text-lg font-semibold">{specialist.responseTime} soat</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin size={20} className="text-primary" />
                  <div>
                    <p className="text-text-tertiary text-sm">Joylashuvi</p>
                    <p className="text-sm font-semibold">{specialist.location}</p>
                  </div>
                </div>
              </div>

              <button className="mb-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-white hover:opacity-95">
                <Mail size={18} /> Xabar yuborish
              </button>

              <button className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-surface-2 px-6 py-3 font-semibold text-text-primary hover:bg-surface">
                <MessageSquare size={18} /> Foydalanuvchi profili
              </button>

              <div className="mt-8 rounded-xl border border-border bg-surface-2 p-4">
                <p className="text-xs text-text-tertiary mb-3">
                  ℹ️ Marketplace orqali aloqa qilib, hozirdan ishona boshlang. Barcha to'lovlar Performa orqali xavfsiz.
                </p>
              </div>
            </div>
          </div>
        </div>
        </PublicContainer>
      </section>

      <PublicFooter />
    </main>
  )
}
