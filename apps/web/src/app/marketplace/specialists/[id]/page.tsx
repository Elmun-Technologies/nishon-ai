'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, MapPin, Award, TrendingUp, Users, DollarSign, Clock, Check, Mail, MessageSquare } from 'lucide-react'

const SPECIALIST_DATA = {
  spec_1: {
    id: 'spec_1',
    name: 'Dilshod Rakhimov',
    avatar: '👨‍💼',
    title: 'Meta & Google Ads Specialist',
    bio: 'E-commerce va performance marketing'da 7 yillik tajriba. Meta va Google da sertifikatsiyalangan.',
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
}

export default function SpecialistProfilePage({ params }: { params: { id: string } }) {
  const specialist = SPECIALIST_DATA[params.id as keyof typeof SPECIALIST_DATA]
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'testimonials'>('overview')

  if (!specialist) {
    return (
      <div className="min-h-screen bg-[#031314] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Specialist topilmadi</h1>
          <Link href="/marketplace" className="text-emerald-300 hover:text-emerald-200">
            ← Marketplace'ga qaytish
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#031314] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#071c1e]/95 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <Link href="/marketplace" className="text-emerald-300 hover:text-emerald-200 transition-colors inline-block mb-4">
            ← Marketplace'ga qaytish
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-5xl">{specialist.avatar}</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{specialist.name}</h1>
                {specialist.verified && <Check size={20} className="text-emerald-400" />}
              </div>
              <p className="text-text-secondary text-lg">{specialist.title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2">
            {/* Quick Stats */}
            <div className="rounded-2xl border border-white/10 bg-surface-2/50 p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6">Statistika</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-text-tertiary text-sm mb-2">ROAS</p>
                  <p className="text-3xl font-bold text-emerald-400">{specialist.roas}x</p>
                </div>
                <div>
                  <p className="text-text-tertiary text-sm mb-2">Reytingi</p>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold">{specialist.rating}</span>
                    <Star size={20} className="text-yellow-400 fill-yellow-400" />
                  </div>
                </div>
                <div>
                  <p className="text-text-tertiary text-sm mb-2">Success Rate</p>
                  <p className="text-3xl font-bold text-cyan-400">{specialist.successRate}%</p>
                </div>
                <div>
                  <p className="text-text-tertiary text-sm mb-2">Omonatlari</p>
                  <p className="text-3xl font-bold">{specialist.reviewCount}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="rounded-2xl border border-white/10 bg-surface-2/50 p-8 mb-8">
              <div className="flex gap-4 mb-8 border-b border-white/10">
                {(['overview', 'portfolio', 'testimonials'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
                      activeTab === tab
                        ? 'border-emerald-400 text-emerald-300'
                        : 'border-transparent text-text-secondary hover:text-white'
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
                    <h3 className="text-xl font-semibold mb-3">Bio</h3>
                    <p className="text-text-secondary whitespace-pre-line">{specialist.description}</p>
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <h3 className="text-xl font-semibold mb-4">Bilgisi</h3>
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

                  <div className="border-t border-white/10 pt-6">
                    <h3 className="text-xl font-semibold mb-4">Tillar</h3>
                    <div className="flex flex-wrap gap-2">
                      {specialist.languages.map((lang) => (
                        <span
                          key={lang}
                          className="px-3 py-1.5 rounded-full bg-cyan-500/15 text-cyan-300 text-sm border border-cyan-500/30"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <h3 className="text-xl font-semibold mb-4">Sertifikatsiyalar</h3>
                    <div className="flex flex-wrap gap-2">
                      {specialist.certifications.map((cert) => (
                        <span
                          key={cert}
                          className="px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-300 text-sm border border-emerald-500/30"
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
                    <div key={idx} className="p-4 rounded-xl border border-white/10 bg-black/20">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-white">{project.title}</h4>
                          <p className="text-sm text-text-tertiary">{project.industry}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-emerald-400">{project.roas}x</p>
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
                    <div key={idx} className="p-5 rounded-xl border border-white/10 bg-black/20">
                      <div className="flex items-center gap-1 mb-3">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                      <p className="text-white mb-4 leading-relaxed">"{testimonial.text}"</p>
                      <p className="text-sm text-text-tertiary">— {testimonial.author}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - CTA */}
          <div className="md:col-span-1">
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-8 sticky top-24">
              <h2 className="text-2xl font-bold mb-6">Ishga olib boshlang</h2>

              <div className="space-y-4 mb-8 pb-8 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <DollarSign size={20} className="text-emerald-400" />
                  <div>
                    <p className="text-text-tertiary text-sm">Narxi</p>
                    <p className="text-2xl font-bold">${specialist.basePrice}</p>
                    <p className="text-xs text-text-tertiary">/soat</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-cyan-400" />
                  <div>
                    <p className="text-text-tertiary text-sm">Javob vaqti</p>
                    <p className="text-lg font-semibold">{specialist.responseTime} soat</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin size={20} className="text-sky-400" />
                  <div>
                    <p className="text-text-tertiary text-sm">Joylashuvi</p>
                    <p className="text-sm font-semibold">{specialist.location}</p>
                  </div>
                </div>
              </div>

              <button className="w-full px-6 py-3 bg-emerald-500 text-white font-semibold rounded-full hover:bg-emerald-400 transition-colors mb-3 flex items-center justify-center gap-2">
                <Mail size={18} /> Xabar yuborish
              </button>

              <button className="w-full px-6 py-3 border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-semibold rounded-full hover:border-emerald-500/60 hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2">
                <MessageSquare size={18} /> Foydalanuvchi profili
              </button>

              <div className="mt-8 p-4 rounded-xl bg-black/40 border border-white/10">
                <p className="text-xs text-text-tertiary mb-3">
                  ℹ️ Marketplace orqali aloqa qilib, hozirdan ishona boshlang. Barcha to'lovlar Performa orqali xavfsiz.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
