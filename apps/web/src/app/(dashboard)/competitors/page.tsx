'use client'

import { useState } from 'react'
import { Search, TrendingUp, AlertCircle, CheckCircle2, BarChart3, Share2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

const COMPARISON_DATA = {
  yourBrand: {
    name: 'Sizning Branding',
    score: 59,
    color: 'emerald',
    highlights: [
      'Yaxshi kontentga izohlar',
      'Tez javob berish',
      'Authentic o\'z fotosuratlar',
    ],
  },
  competitor: {
    name: 'Raqobatchi',
    score: 71,
    color: 'red',
    highlights: [
      'Katta follower bazasi',
      'Paid ads strategiyasi',
      'Professional photography',
    ],
  },
}

const AUDIT_CATEGORIES = [
  {
    title: 'Instagram Identity',
    score: 65,
    status: 'good',
    description: 'Bio, profil rasm, username',
  },
  {
    title: 'Statistics',
    score: 58,
    status: 'fair',
    description: 'Engagement rate, follower o\'sishi',
  },
  {
    title: 'SMM Strategy',
    score: 52,
    status: 'fair',
    description: 'Post frequency, hashtag usage',
  },
  {
    title: 'Paid Advertising',
    score: 71,
    status: 'good',
    description: 'Ads budget, kampaniya types',
  },
  {
    title: 'Response Speed',
    score: 45,
    status: 'poor',
    description: 'DM javob vaqti, comment response',
  },
  {
    title: 'Website',
    score: 68,
    status: 'good',
    description: 'Mobile-friendly, conversion optimized',
  },
]

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<any[]>([])
  const [instagram, setInstagram] = useState('')
  const [website, setWebsite] = useState('')

  const handleAddCompetitor = () => {
    if (instagram.trim()) {
      setCompetitors([
        ...competitors,
        { id: Date.now(), instagram, website },
      ])
      setInstagram('')
      setWebsite('')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Raqobatchi Tahlili</h1>
          <p className="text-slate-600 mt-1">Raqobatchileringizni tekshiring va strategiya ishlab chiqing</p>
        </div>
      </div>

      {/* Add Competitor Form */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Search className="w-6 h-6 text-blue-600" />
          Yangi Raqobatchi Qo'sh
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Instagram Handle
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-500">@</span>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="texnomart_uz"
                className="w-full pl-8 pr-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Website URL
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <button
          onClick={handleAddCompetitor}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          <Search className="w-5 h-5" />
          Raqobatchi Tahlilini Boshlash
        </button>
      </div>

      {/* Audit Categories */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Audit Kategoriyalari</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AUDIT_CATEGORIES.map((category, i) => {
            const statusColor =
              category.status === 'good'
                ? 'bg-green-50 border-green-300'
                : category.status === 'fair'
                  ? 'bg-yellow-50 border-yellow-300'
                  : 'bg-red-50 border-red-300'

            const statusBg =
              category.status === 'good'
                ? 'bg-green-100'
                : category.status === 'fair'
                  ? 'bg-yellow-100'
                  : 'bg-red-100'

            const textColor =
              category.status === 'good'
                ? 'text-green-700'
                : category.status === 'fair'
                  ? 'text-yellow-700'
                  : 'text-red-700'

            return (
              <div
                key={i}
                className={`p-5 rounded-xl border-2 ${statusColor} hover:shadow-md transition-all`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">{category.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${statusBg} ${textColor}`}>
                    {category.score}%
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-3">{category.description}</p>
                <div className="w-full bg-slate-300 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      category.status === 'good'
                        ? 'bg-green-500'
                        : category.status === 'fair'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${category.score}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Comparison Section */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Taqqoslash</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Your Brand */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-300 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Sizning Branding</h3>
            </div>

            <div className="mb-8">
              <div className="flex items-end gap-4 mb-2">
                <span className="text-5xl font-bold text-emerald-600">
                  {COMPARISON_DATA.yourBrand.score}
                </span>
                <span className="text-emerald-600 font-semibold mb-2">/ 100</span>
              </div>
              <div className="w-full bg-slate-300 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all"
                  style={{ width: `${COMPARISON_DATA.yourBrand.score}%` }}
                />
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Ustunliklaringiz
              </h4>
              <ul className="space-y-2">
                {COMPARISON_DATA.yourBrand.highlights.map((highlight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Competitor */}
          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border-2 border-red-300 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Raqobatchi</h3>
            </div>

            <div className="mb-8">
              <div className="flex items-end gap-4 mb-2">
                <span className="text-5xl font-bold text-red-600">
                  {COMPARISON_DATA.competitor.score}
                </span>
                <span className="text-red-600 font-semibold mb-2">/ 100</span>
              </div>
              <div className="w-full bg-slate-300 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-red-400 to-rose-500 transition-all"
                  style={{ width: `${COMPARISON_DATA.competitor.score}%` }}
                />
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Ularning Kuchlari
              </h4>
              <ul className="space-y-2">
                {COMPARISON_DATA.competitor.highlights.map((highlight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <TrendingUp className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-8 border-t border-slate-200">
        <button className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-lg transition-all">
          <BarChart3 className="w-5 h-5" />
          Batafsil Hisoboti
        </button>
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg">
          <Share2 className="w-5 h-5" />
          Hisobotni Ulashish
        </button>
      </div>
    </div>
  )
}
