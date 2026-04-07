'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, MapPin, Award, TrendingUp, Users, DollarSign, Clock, Check } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import type { Specialist, SpecialistLevel, CertificationType, SpecialtyType } from '@/types/marketplace'

const MOCK_SPECIALISTS: Specialist[] = [
  {
    id: 'spec_1',
    name: 'Dilshod Rakhimov',
    avatar: '👨‍💼',
    title: 'Meta & Google Ads Specialist',
    level: 'pro',
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
    featured: true,
  },
  {
    id: 'spec_2',
    name: 'Saida Karimova',
    avatar: '👩‍💼',
    title: 'TikTok & Instagram Ads Expert',
    level: 'expert',
    bio: 'Gen-Z auditoriyasi uchun creative-driven campaigns. UGC va influencer marketing specialisti.',
    basePrice: 200,
    roas: 5.2,
    rating: 4.85,
    reviewCount: 98,
    certifications: ['meta', 'tiktok'],
    specialties: ['brand', 'performance'],
    experience: 5,
    campaignsManaged: 220,
    totalSpend: 28.5,
    responseTime: 1,
    successRate: 92,
    location: 'Fergana, Uzbekistan',
    languages: ['Uzbek', 'Russian', 'English'],
    verified: true,
    featured: true,
  },
  {
    id: 'spec_3',
    name: 'Akmal Turogov',
    avatar: '👨‍💼',
    title: 'Lead Generation & SaaS Expert',
    level: 'pro',
    bio: 'B2B va SaaS brands uchun lead gen campaigns. CPA optimization mutahassisi.',
    basePrice: 300,
    roas: 3.5,
    rating: 4.75,
    reviewCount: 85,
    certifications: ['google', 'meta'],
    specialties: ['leadgen', 'saas'],
    experience: 6,
    campaignsManaged: 180,
    totalSpend: 52.3,
    responseTime: 3,
    successRate: 89,
    location: 'Samarkand, Uzbekistan',
    languages: ['Uzbek', 'Russian', 'English', 'Chinese'],
    verified: true,
    featured: false,
  },
  {
    id: 'spec_4',
    name: 'Nasim Yusupov',
    avatar: '👨‍💼',
    title: 'All-Platform Agency Head',
    level: 'agency',
    bio: 'Digital agency with 15+ team members. Multi-platform expertise at scale.',
    basePrice: 500,
    roas: 4.2,
    rating: 4.7,
    reviewCount: 156,
    certifications: ['meta', 'google', 'tiktok', 'yandex'],
    specialties: ['ecommerce', 'brand', 'performance'],
    experience: 9,
    campaignsManaged: 850,
    totalSpend: 320.7,
    responseTime: 4,
    successRate: 88,
    location: 'Tashkent, Uzbekistan',
    languages: ['Uzbek', 'Russian', 'English'],
    verified: true,
    featured: true,
  },
  {
    id: 'spec_5',
    name: 'Gulnora Normatova',
    avatar: '👩‍💼',
    title: 'E-commerce & Retargeting Specialist',
    level: 'expert',
    bio: 'Online store owners uchun retargeting automation. High-ticket e-commerce uzunmadda.',
    basePrice: 180,
    roas: 6.1,
    rating: 4.95,
    reviewCount: 73,
    certifications: ['meta'],
    specialties: ['ecommerce', 'performance'],
    experience: 4,
    campaignsManaged: 140,
    totalSpend: 18.2,
    responseTime: 1,
    successRate: 96,
    location: 'Bukhara, Uzbekistan',
    languages: ['Uzbek', 'Russian'],
    verified: true,
    featured: true,
  },
  {
    id: 'spec_6',
    name: 'Rustam Qurbanov',
    avatar: '👨‍💼',
    title: 'Yandex & Local Markets Specialist',
    level: 'expert',
    bio: 'Yandex Direct va lokal bozorlar. CIS regions uchun ixtisoslashgan.',
    basePrice: 150,
    roas: 3.8,
    rating: 4.6,
    reviewCount: 62,
    certifications: ['yandex'],
    specialties: ['performance', 'brand'],
    experience: 5,
    campaignsManaged: 190,
    totalSpend: 24.1,
    responseTime: 2,
    successRate: 85,
    location: 'Almaty, Kazakhstan',
    languages: ['Kazakh', 'Russian', 'English', 'Uzbek'],
    verified: true,
    featured: false,
  },
]

const SPECIALTIES = [
  { id: 'ecommerce', label: 'E-commerce', icon: '🛍️' },
  { id: 'saas', label: 'SaaS', icon: '💻' },
  { id: 'leadgen', label: 'Lead Generation', icon: '📋' },
  { id: 'brand', label: 'Brand Building', icon: '✨' },
  { id: 'performance', label: 'Performance', icon: '📈' },
]

const CERTIFICATIONS = [
  { id: 'meta', label: 'Meta Certified', icon: '📘' },
  { id: 'google', label: 'Google Partner', icon: '🔵' },
  { id: 'tiktok', label: 'TikTok Certified', icon: '🎵' },
  { id: 'yandex', label: 'Yandex Expert', icon: '🔴' },
]

function SpecialistCard({ specialist, t }: { specialist: Specialist; t: (key: string) => string }) {
  return (
    <Link href={`/marketplace/specialists/${specialist.id}`}>
      <div className="group rounded-2xl border border-white/10 bg-surface-2/50 p-6 hover:border-emerald-500/50 hover:bg-surface-2 transition-all cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="text-4xl">{specialist.avatar}</div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">{specialist.name}</h3>
                {specialist.verified && <Check size={16} className="text-emerald-400" />}
              </div>
              <p className="text-sm text-text-tertiary">{specialist.title}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-400">${specialist.basePrice}</div>
            <p className="text-xs text-text-tertiary">/hour</p>
          </div>
        </div>

        {/* Rating & Stats */}
        <div className="flex items-center gap-3 py-3 border-y border-white/10 mb-4">
          <div className="flex items-center gap-1">
            <Star size={16} className="text-yellow-400 fill-yellow-400" />
            <span className="font-semibold text-white">{specialist.rating}</span>
            <span className="text-sm text-text-tertiary">({specialist.reviewCount})</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-1">
            <TrendingUp size={16} className="text-cyan-400" />
            <span className="font-semibold text-white">{specialist.roas}x ROAS</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4 py-3 border-y border-white/10">
          <div>
            <p className="text-xs text-text-tertiary">{t('marketplace.results')}</p>
            <p className="text-lg font-semibold text-white">{specialist.campaignsManaged}</p>
          </div>
          <div>
            <p className="text-xs text-text-tertiary">{t('portfolio.successRate')}</p>
            <p className="text-lg font-semibold text-white">{specialist.successRate}%</p>
          </div>
          <div>
            <p className="text-xs text-text-tertiary">{t('portfolio.experience')}</p>
            <p className="text-lg font-semibold text-white">{specialist.experience} yil</p>
          </div>
          <div>
            <p className="text-xs text-text-tertiary">{t('portfolio.responseTime')}</p>
            <p className="text-lg font-semibold text-white">{specialist.responseTime}h</p>
          </div>
        </div>

        {/* Certifications */}
        <div className="mb-4">
          <p className="text-xs text-text-tertiary mb-2">{t('marketplace.certifications')}</p>
          <div className="flex flex-wrap gap-1">
            {specialist.certifications.map((cert) => {
              const certData = CERTIFICATIONS.find((c) => c.id === cert)
              return (
                <span
                  key={cert}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs border border-emerald-500/30"
                >
                  {certData?.icon} {certData?.label}
                </span>
              )
            })}
          </div>
        </div>

        {/* Specialties */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {specialist.specialties.map((specialty) => {
              const specData = SPECIALTIES.find((s) => s.id === specialty)
              return (
                <span
                  key={specialty}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs border border-cyan-500/30"
                >
                  {specData?.icon} {specData?.label}
                </span>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex items-center gap-1 text-sm text-text-tertiary">
            <MapPin size={14} />
            {specialist.location}
          </div>
          <button className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-medium hover:bg-emerald-500/30 transition-colors">
            Chekinish
          </button>
        </div>
      </div>
    </Link>
  )
}

export default function MarketplacePage() {
  const { t } = useI18n()
  const [filters, setFilters] = useState({
    level: [] as SpecialistLevel[],
    certification: [] as CertificationType[],
    specialty: [] as SpecialtyType[],
    minRating: 0,
    minRoas: 0,
  })

  const [sortBy, setSortBy] = useState<'rating' | 'roas' | 'price'>('rating')

  const filteredSpecialists = MOCK_SPECIALISTS.filter((specialist) => {
    if (filters.level.length > 0 && !filters.level.includes(specialist.level)) return false
    if (filters.certification.length > 0 && !filters.certification.some((c) => specialist.certifications.includes(c)))
      return false
    if (filters.specialty.length > 0 && !filters.specialty.some((s) => specialist.specialties.includes(s))) return false
    if (filters.minRating > 0 && specialist.rating < filters.minRating) return false
    if (filters.minRoas > 0 && specialist.roas < filters.minRoas) return false
    return true
  })

  const sorted = [...filteredSpecialists].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating
    if (sortBy === 'roas') return b.roas - a.roas
    return a.basePrice - b.basePrice
  })

  const featuredSpecialists = sorted.filter((s) => s.featured).slice(0, 3)

  return (
    <div className="min-h-screen bg-[#031314] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#071c1e]/95 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{t('marketplace.title')}</h1>
              <p className="text-text-secondary mt-1">{t('marketplace.subtitle')}</p>
            </div>
            <Link href="/" className="text-emerald-300 hover:text-emerald-200 transition-colors">
              ← {t('common.home')}
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Featured Section */}
        {featuredSpecialists.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">{t('marketplace.featured')}</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {featuredSpecialists.map((specialist) => (
                <SpecialistCard key={specialist.id} specialist={specialist} t={t} />
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{t('marketplace.filters')}</h2>
          <div className="rounded-2xl border border-white/10 bg-surface-2/50 p-6 space-y-6">
            {/* Sorting */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">{t('marketplace.sorting')}</label>
              <div className="flex gap-3">
                {(['rating', 'roas', 'price'] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setSortBy(option)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      sortBy === option
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/10 text-text-secondary hover:bg-white/20'
                    }`}
                  >
                    {option === 'rating' && t('marketplace.sortBy.rating')}
                    {option === 'roas' && t('marketplace.sortBy.roas')}
                    {option === 'price' && t('marketplace.sortBy.price')}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">Minimal Reytingi</label>
              <div className="flex gap-2">
                {[0, 4.0, 4.5, 4.8].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setFilters({ ...filters, minRating: rating })}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filters.minRating === rating
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/10 text-text-secondary hover:bg-white/20'
                    }`}
                  >
                    {rating === 0 ? 'Barchasi' : `${rating}+`}
                  </button>
                ))}
              </div>
            </div>

            {/* ROAS Filter */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">Minimal ROAS</label>
              <div className="flex gap-2">
                {[0, 3, 4, 5].map((roas) => (
                  <button
                    key={roas}
                    onClick={() => setFilters({ ...filters, minRoas: roas })}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filters.minRoas === roas
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/10 text-text-secondary hover:bg-white/20'
                    }`}
                  >
                    {roas === 0 ? 'Barchasi' : `${roas}x+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Specialties */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">Mutahassisliklari</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {SPECIALTIES.map((specialty) => (
                  <button
                    key={specialty.id}
                    onClick={() => {
                      const newSpecialties = filters.specialty.includes(specialty.id as SpecialtyType)
                        ? filters.specialty.filter((s) => s !== specialty.id)
                        : [...filters.specialty, specialty.id as SpecialtyType]
                      setFilters({ ...filters, specialty: newSpecialties })
                    }}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                      filters.specialty.includes(specialty.id as SpecialtyType)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/10 text-text-secondary hover:bg-white/20'
                    }`}
                  >
                    {specialty.icon} {specialty.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">Sertifikatsiyalar</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {CERTIFICATIONS.map((cert) => (
                  <button
                    key={cert.id}
                    onClick={() => {
                      const newCertifications = filters.certification.includes(cert.id as CertificationType)
                        ? filters.certification.filter((c) => c !== cert.id)
                        : [...filters.certification, cert.id as CertificationType]
                      setFilters({ ...filters, certification: newCertifications })
                    }}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                      filters.certification.includes(cert.id as CertificationType)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/10 text-text-secondary hover:bg-white/20'
                    }`}
                  >
                    {cert.icon} {cert.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              {t('marketplace.results')}: <span className="text-emerald-400">{sorted.length}</span> {t('marketplace.specialist')}
            </h2>
          </div>

          {sorted.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sorted.map((specialist) => (
                <SpecialistCard key={specialist.id} specialist={specialist} t={t} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-surface-2/50 p-12 text-center">
              <p className="text-text-tertiary text-lg">{t('marketplace.noResults')}</p>
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="mt-16 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('marketplace.cta.title')}</h2>
          <p className="text-text-secondary mb-6 max-w-2xl mx-auto">
            {t('marketplace.cta.subtitle')}
          </p>
          <Link
            href="/register?role=specialist"
            className="inline-block px-8 py-3 bg-emerald-500 text-white font-semibold rounded-full hover:bg-emerald-400 transition-colors"
          >
            {t('marketplace.cta.button')}
          </Link>
        </section>
      </div>
    </div>
  )
}
