'use client'

import { useState } from 'react'
import { Search, Filter, Star, Zap, Users, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

const SPECIALISTS = [
  {
    id: 1,
    name: 'Akbarali Karomatov',
    title: 'Meta & Google Ads Expert',
    rating: 4.9,
    reviews: 127,
    roas: '3.2x',
    specialties: ['Meta Ads', 'Google Ads', 'Retargeting'],
    monthlyRate: 1200,
    status: 'Verified',
    avatar: '👨‍💼',
    verified: true,
  },
  {
    id: 2,
    name: 'Gulnora Mirjalova',
    title: 'E-commerce Specialist',
    rating: 4.8,
    reviews: 95,
    roas: '2.8x',
    specialties: ['E-commerce', 'Product Ads', 'Conversion'],
    monthlyRate: 1000,
    status: 'Verified',
    avatar: '👩‍💼',
    verified: true,
  },
  {
    id: 3,
    name: 'Rustam Khujayev',
    title: 'TikTok & Instagram Specialist',
    rating: 4.7,
    reviews: 84,
    roas: '2.5x',
    specialties: ['TikTok', 'Instagram', 'Content'],
    monthlyRate: 800,
    status: 'Verified',
    avatar: '👨‍🎨',
    verified: true,
  },
]

export default function MarketplacePage() {
  const [selectedSort, setSelectedSort] = useState('rating')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-12 text-white">
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/5" />
        
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-4">Marketplace</h1>
          <p className="text-lg text-blue-100 max-w-2xl">
            Ozarbayjan, Tojikiston va boshqa mamlakatlardan certified marketing specialists
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: <Users className="w-6 h-6" />, label: 'Specialists', value: '150+', color: 'blue' },
          { icon: <Star className="w-6 h-6" />, label: 'Avg Rating', value: '4.8★', color: 'yellow' },
          { icon: <TrendingUp className="w-6 h-6" />, label: 'Avg ROAS', value: '3.2x', color: 'green' },
        ].map((stat, i) => (
          <div
            key={i}
            className={`p-6 rounded-xl border-2 bg-gradient-to-br ${
              stat.color === 'blue' ? 'from-blue-50 to-blue-100 border-blue-200' :
              stat.color === 'yellow' ? 'from-yellow-50 to-yellow-100 border-yellow-200' :
              'from-green-50 to-green-100 border-green-200'
            }`}
          >
            <div className={`inline-flex p-3 rounded-lg mb-3 ${
              stat.color === 'blue' ? 'bg-blue-200 text-blue-600' :
              stat.color === 'yellow' ? 'bg-yellow-200 text-yellow-600' :
              'bg-green-200 text-green-600'
            }`}>
              {stat.icon}
            </div>
            <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Specialist, speciality yoki skill qidiring..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Speciality
            </label>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Barcha</option>
              <option value="meta">Meta Ads</option>
              <option value="google">Google Ads</option>
              <option value="ecommerce">E-commerce</option>
              <option value="tiktok">TikTok</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Min Rating</label>
            <select className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Barcha</option>
              <option>4.5+</option>
              <option>4.0+</option>
              <option>3.5+</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tartiblash</label>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="rating">⭐ Eng yaxshi reyting</option>
              <option value="roas">📈 Eng yuqori ROAS</option>
              <option value="price">💰 Eng arzan</option>
              <option value="reviews">✓ Eng ko'p reviews</option>
            </select>
          </div>
        </div>
      </div>

      {/* Specialists Grid */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          {searchQuery ? `"${searchQuery}" bo'yicha natijalar` : 'Eng yaxshi Specialists'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SPECIALISTS.map((specialist) => (
            <div
              key={specialist.id}
              className="group bg-white rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-slate-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{specialist.avatar}</div>
                  {specialist.verified && (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      Verified
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900">{specialist.name}</h3>
                <p className="text-sm text-slate-600">{specialist.title}</p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Rating & Reviews */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(specialist.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-slate-600">{specialist.reviews} reviews</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">{specialist.rating}</p>
                    <p className="text-xs text-slate-500">Rating</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-slate-600">Avg ROAS</p>
                    <p className="text-xl font-bold text-green-600">{specialist.roas}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-slate-600">Monthly</p>
                    <p className="text-lg font-bold text-blue-600">${specialist.monthlyRate}</p>
                  </div>
                </div>

                {/* Specialties */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Specialties</p>
                  <div className="flex flex-wrap gap-2">
                    {specialist.specialties.map((specialty, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t-2 border-slate-200">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all group-hover:shadow-lg">
                  Profil Ko'rish
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Load More */}
      <div className="text-center">
        <button className="px-8 py-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold rounded-lg transition-all">
          Yana Specialists Ko'rsat (147)
        </button>
      </div>
    </div>
  )
}
