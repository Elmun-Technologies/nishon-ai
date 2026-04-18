'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle2, Zap, BarChart3, Shield } from 'lucide-react'

const PLATFORMS = [
  {
    id: 'meta',
    name: 'Meta',
    subtitle: 'Facebook & Instagram',
    icon: '📘',
    description: 'Reklama hisoblarini ulash va real vaqtda natijalarini kuzatish',
    features: ['Kampaniya boshqaruvi', 'Analytics', 'Budget optimization'],
    color: 'from-blue-50 to-blue-100',
    borderColor: 'border-blue-200',
  },
  {
    id: 'google',
    name: 'Google Ads',
    subtitle: 'Search & Display',
    icon: '🔍',
    description: 'Google Ads reklama kampaniyalarini boshqarish va yaxshilash',
    features: ['Search campaigns', 'Display ads', 'Smart bidding'],
    color: 'from-red-50 to-red-100',
    borderColor: 'border-red-200',
  },
  {
    id: 'yandex',
    name: 'Yandex Direct',
    subtitle: 'Russian Market',
    icon: '🟡',
    description: 'Yandex Direct platformasida reklama kampaniyalarini boshqaring',
    features: ['Search ads', 'Network ads', 'Retargeting'],
    color: 'from-yellow-50 to-yellow-100',
    borderColor: 'border-yellow-200',
  },
]

const BENEFITS = [
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Real-time Analytics',
    description: 'Barcha platformada kampaniya natijalarini yagona paneldan ko\'ring',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'AI Optimization',
    description: 'Sun\'iy intellekt orqali automatik tavsiyalar oling',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Secure Integration',
    description: 'Barcha ma\'lumotlar xavfsiz va shifrlanadi',
  },
]

export default function PortfolioPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-16">
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Portfolio Yaratish
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl">
            Barcha reklama platformalaringizni bir joyda boshqaring. Kampaniyalaringizni real vaqtda kuzating va AI orqali optimallashtiring.
          </p>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {BENEFITS.map((benefit, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
            >
              <div className="text-blue-600 mb-4">{benefit.icon}</div>
              <h3 className="font-semibold text-slate-900 mb-2">{benefit.title}</h3>
              <p className="text-slate-600 text-sm">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* Platform Selection */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-sm">
              1
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Qaysi platform uchun hisobni ulaaysiz?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={`group p-6 rounded-xl transition-all duration-300 text-left border-2 ${
                  selectedPlatform === platform.id
                    ? `bg-gradient-to-br ${platform.color} ${platform.borderColor} border-blue-400 shadow-lg`
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{platform.icon}</div>
                  {selectedPlatform === platform.id && (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {platform.name}
                </h3>
                <p className="text-sm text-slate-600 mb-3">{platform.subtitle}</p>
                <p className="text-sm text-slate-700 mb-4">{platform.description}</p>

                <div className="space-y-2">
                  {platform.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {feature}
                    </div>
                  ))}
                </div>

                <button className={`mt-6 flex items-center gap-2 font-semibold transition-all ${
                  selectedPlatform === platform.id
                    ? 'text-blue-600 group-hover:gap-3'
                    : 'text-slate-600 group-hover:text-blue-600'
                }`}>
                  Tanlash <ArrowRight className="w-4 h-4" />
                </button>
              </button>
            ))}
          </div>
        </div>

        {/* Next Step Button */}
        {selectedPlatform && (
          <div className="flex justify-end animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2">
              Davom et <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-20 bg-blue-50 border border-blue-200 rounded-xl p-8">
          <h3 className="font-semibold text-slate-900 mb-4">Nima kerak?</h3>
          <ul className="space-y-3 text-slate-700">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Reklama platformasida admin huquqlari</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Aktiv kampaniyalari yoki hisob ochiqligi</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Performa platformasiga kiritish ruxsati</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
