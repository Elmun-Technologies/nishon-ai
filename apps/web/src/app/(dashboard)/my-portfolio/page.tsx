'use client'

import { ArrowRight, Edit2, Plus, BarChart3, Settings } from 'lucide-react'

export const dynamic = 'force-dynamic'

const PORTFOLIO_ITEMS = [
  {
    id: 1,
    name: 'Meta Ads',
    accounts: 3,
    status: 'active',
    lastSync: '2 min ago',
    performance: '+24%',
  },
  {
    id: 2,
    name: 'Google Ads',
    accounts: 2,
    status: 'active',
    lastSync: '5 min ago',
    performance: '+18%',
  },
  {
    id: 3,
    name: 'TikTok Ads',
    accounts: 1,
    status: 'inactive',
    lastSync: '1 hour ago',
    performance: '+5%',
  },
]

export default function MyPortfolioPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mening Portfolio</h1>
          <p className="text-slate-600 mt-1">Barcha reklama hisoblaringizni boshqaring</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg">
          <Plus className="w-5 h-5" />
          Yangi Hisob Qo'sh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Jami Hisoblar', value: '6', color: 'blue' },
          { label: 'Aktiv Kampaniyalar', value: '24', color: 'green' },
          { label: 'O\'rtacha ROI', value: '+22%', color: 'purple' },
          { label: 'Bu oyning Spend', value: '$4,250', color: 'orange' },
        ].map((stat, i) => (
          <div
            key={i}
            className={`p-6 rounded-xl border-2 bg-gradient-to-br border-${stat.color}-200`}
            style={{
              background: stat.color === 'blue' ? 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' :
                          stat.color === 'green' ? 'linear-gradient(135deg, #F0FDF4, #DCFCE7)' :
                          stat.color === 'purple' ? 'linear-gradient(135deg, #FAF5FF, #F3E8FF)' :
                          'linear-gradient(135deg, #FFFBEB, #FEF3C7)'
            }}
          >
            <p className="text-sm font-medium text-slate-600">{stat.label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Portfolio Items */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Mening Hisoblarim</h2>
        
        {PORTFOLIO_ITEMS.map((item) => (
          <div
            key={item.id}
            className="p-6 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.status === 'active' ? '🟢 Aktiv' : '⚫ Noaktiv'}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{item.accounts} hisob ulangan</p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">{item.performance}</p>
                <p className="text-xs text-slate-500">Bu oyda o'sish</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-500">Oxirgi sinxronizatsiya: {item.lastSync}</p>
              <div className="flex gap-2">
                <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                  <BarChart3 className="w-5 h-5" />
                </button>
                <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                  <Edit2 className="w-5 h-5" />
                </button>
                <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Section */}
      <div className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">
          Yangi platformani ulash?
        </h3>
        <p className="text-slate-600 mb-6">
          TikTok, Pinterest, LinkedIn va boshqa platformalarni ulang
        </p>
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all">
          Platform Qo'sh
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
