'use client'

import { useState } from 'react'
import { ArrowRight, Zap, Layout, BarChart3, Smartphone } from 'lucide-react'

export const dynamic = 'force-dynamic'

const FEATURES = [
  {
    icon: <Layout className="w-5 h-5" />,
    text: 'Uzbek tilda matnlar',
    description: 'O\'z tilingizda professional landing sahifalar',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    text: 'Meta Pixel + Google Analytics ulash',
    description: 'Barcha conversion trackinglar avtomatik sozlanadi',
  },
  {
    icon: <Smartphone className="w-5 h-5" />,
    text: 'O\'zingizga moslangan WhatsApp tugmalari',
    description: 'Direct messaging qilib customers bilan bog\'laning',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    text: 'Mobil qurilmalar uchun optimallashtirilgan',
    description: 'Barcha ekranlarda perfect ko\'rinish',
  },
]

export default function LandingPagePage() {
  const [step, setStep] = useState(1)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Landing Page Yaratish
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            AI sizning biznesisingiz uchun professional landing page yaratadi. Faqat 10-20 soniyada ready bo'ladi!
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {FEATURES.map((feature, i) => (
            <div
              key={i}
              className="group p-5 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="text-blue-600 flex-shrink-0 mt-1 group-hover:text-blue-700 transition-colors">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{feature.text}</h3>
                  <p className="text-sm text-slate-600">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4 mb-8">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center gap-4">
                <button
                  onClick={() => setStep(num)}
                  className={`w-12 h-12 rounded-full font-bold text-sm transition-all ${
                    step === num
                      ? 'bg-blue-600 text-white shadow-lg scale-110'
                      : step > num
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  {step > num ? '✓' : num}
                </button>
                {num < 3 && (
                  <div
                    className={`h-1 w-8 transition-colors ${
                      step > num ? 'bg-green-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 mb-8">
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900">Loyihaning nomi</h2>
                <p className="text-slate-600 mb-6">
                  O'zingizning biznesini tavsiflovchi nom kiriting
                </p>
                <input
                  type="text"
                  placeholder="masalan: Sportiv kiyim do'koni"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900">Asosiy rang tanlang</h2>
                <p className="text-slate-600 mb-6">
                  Sizning brandingizga mos keladigan rangni tanlang
                </p>
                <div className="flex gap-3">
                  {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'].map((color) => (
                    <button
                      key={color}
                      className="w-12 h-12 rounded-lg border-2 border-slate-300 hover:border-slate-500 transition-all hover:scale-110"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900">Tugallandi! ✓</h2>
                <p className="text-slate-600 mb-4">
                  Sizning landing page muvaffaqiyatli yaratildi. Endi uni faollashtirish qoldi!
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-900 font-semibold">
                    👉 Keyingi qadamda: Domeni sozlash va reklama boshlash
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-8 py-3 border-2 border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 font-semibold rounded-lg transition-all hover:bg-slate-50"
            >
              Orqaga
            </button>
          )}

          <button
            onClick={() => setStep(Math.min(step + 1, 3))}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2 active:scale-95"
          >
            {step === 3 ? 'Landing Page-ni Boshlash' : 'Davom et'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Time Estimate */}
        <div className="text-center mt-8 text-slate-600 text-sm">
          ⏱️ Tahmini vaqt: 10-20 soniya
        </div>
      </div>
    </div>
  )
}
