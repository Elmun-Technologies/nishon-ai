'use client'

import { useState } from 'react'
import { Search, TrendingUp, AlertCircle, CheckCircle2, BarChart3, Share2 } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Card } from '@/components/ui/card'
import { apiClient } from '@/lib/api-client'

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

interface CompetitorAnalysis {
  overallScore: number
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  monthlyStrategy: {
    focus: string
    tactics: string[]
    budget: number
  }
  quarterlyStrategy: {
    focus: string
    initiatives: string[]
    expectedRoas: number
    budgetRequired: number
  }
  annualStrategy: {
    longTermGoal: string
    keyMilestones: string[]
    budgetAdvice: string
  }
}

const MOCK_RESULT: CompetitorAnalysis = {
  overallScore: 72,
  strengths: [
    'Consistent posting schedule (4-5 posts/week)',
    'High engagement rate (6.2% vs industry 3-4%)',
    'Professional content quality',
    'Strong follower base (48K followers)',
  ],
  weaknesses: [
    'Limited video content strategy',
    'No visible retargeting campaigns',
    'Slow response to DMs (24-48 hours)',
    'Minimal use of Stories/Reels',
  ],
  opportunities: [
    'Launch aggressive Reels campaign',
    'Start retargeting existing website visitors',
    'Implement chatbot for faster customer response',
    'Create limited-time offers to boost conversions',
  ],
  monthlyStrategy: {
    focus: 'Increase content frequency and engagement on Reels',
    tactics: [
      'Publish 8-10 Reels per month (2-3 per week)',
      'Host weekly Instagram Lives (10-15 mins)',
      'Create product-focused Carousel posts',
      'Run 3-4 targeted ads to engaged followers',
      'Monitor comments and respond within 2 hours',
    ],
    budget: 500,
  },
  quarterlyStrategy: {
    focus: 'Build comprehensive content ecosystem and launch paid strategy',
    initiatives: [
      'Create Content Calendar for 3 months',
      'Launch Lookalike Audience campaigns on Instagram',
      'Start A/B testing ad creatives and copy',
      'Build email list through lead magnets',
      'Launch influencer collaboration program',
    ],
    expectedRoas: 2.5,
    budgetRequired: 1500,
  },
  annualStrategy: {
    longTermGoal: 'Establish market leadership in your niche with 150K+ followers and 10%+ engagement rate',
    keyMilestones: [
      'Month 3: 75K followers, 7% engagement',
      'Month 6: 100K followers, 8% engagement',
      'Month 9: 125K followers, 9% engagement',
      'Month 12: 150K+ followers, 10%+ engagement',
    ],
    budgetAdvice: 'Hozirgi byudjetning 60%ini Meta/Instagram reklamalariga, 25%ini Google Ads, 15%ini kontent ishlab chiqarishga yo\'naltiring. Eng kam $1,500/oy zarur samarali natija uchun.',
  },
}

export default function CompetitorsPage() {
  const { currentWorkspace } = useWorkspaceStore()

  const [form, setForm] = useState({
    name: '',
    instagram: '',
    website: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<CompetitorAnalysis | null>(MOCK_RESULT)
  const [openCategory, setOpenCategory] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'audit' | 'strategy'>('audit')

  function update(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  function validate(): string | null {
    if (!form.name.trim()) return 'Raqobatchi nomini kiriting'
    if (!form.instagram.trim() && !form.website.trim())
      return 'Kamida bitta havola kiriting (Instagram yoki sayt)'
    return null
  }

  async function handleAnalyze() {
    const err = validate()
    if (err) {
      setError(err)
      return
    }
    setError('')
    setLoading(true)
    setResult(null)

    try {
      const res = await apiClient.post('/ai-agent/competitor-analysis', {
        workspaceId: currentWorkspace?.id,
        competitor: form,
        businessContext: {
          name: currentWorkspace?.name,
          industry: (currentWorkspace as any)?.industry,
          productDescription: (currentWorkspace as any)?.productDescription,
          targetLocation: (currentWorkspace as any)?.targetLocation,
          monthlyBudget: (currentWorkspace as any)?.monthlyBudget,
          goal: (currentWorkspace as any)?.goal,
          aiStrategy: currentWorkspace?.aiStrategy,
        },
      })
      setResult(res.data)
    } catch (err) {
      setError('Failed to analyze competitor. Please try again.')
      setResult(MOCK_RESULT)
    } finally {
      setLoading(false)
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
          Yangi Raqobatchi Qo\'sh
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Raqobatchi nomi"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Instagram profili (ixtiyoriy)"
            value={form.instagram}
            onChange={(e) => update('instagram', e.target.value)}
            className="px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Veb-sayt (ixtiyoriy)"
            value={form.website}
            onChange={(e) => update('website', e.target.value)}
            className="px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {loading ? 'Analiz qilinmoqda...' : 'Raqobatchi Analiz Qil'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'audit'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📊 Audit
            </button>
            <button
              onClick={() => setActiveTab('strategy')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'strategy'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📈 Strategiya
            </button>
          </div>

          {/* Audit Tab */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Umumiy Natija</h3>
                  <div className="text-4xl font-bold text-blue-600">{result.overallScore}/100</div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full"
                    style={{ width: `${result.overallScore}%` }}
                  />
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6">
                  <h3 className="font-bold text-green-600 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Kuchli Tomonlar
                  </h3>
                  <ul className="space-y-2">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-slate-600">• {s}</li>
                    ))}
                  </ul>
                </Card>

                <Card className="p-6">
                  <h3 className="font-bold text-red-600 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Zaif Tomonlar
                  </h3>
                  <ul className="space-y-2">
                    {result.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm text-slate-600">• {w}</li>
                    ))}
                  </ul>
                </Card>
              </div>
            </div>
          )}

          {/* Strategy Tab */}
          {activeTab === 'strategy' && (
            <div className="space-y-6">
              {/* Monthly */}
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">📅 Oylik Strategiya</h3>
                <p className="text-slate-600 mb-4">{result.monthlyStrategy.focus}</p>
                <div className="space-y-2 mb-4">
                  {result.monthlyStrategy.tactics.map((t, i) => (
                    <div key={i} className="text-sm text-slate-600">• {t}</div>
                  ))}
                </div>
                <div className="text-right text-lg font-bold text-blue-600">${result.monthlyStrategy.budget}/month</div>
              </Card>

              {/* Quarterly */}
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">📊 Uchlyk Strategiya</h3>
                <p className="text-slate-600 mb-4">{result.quarterlyStrategy.focus}</p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-slate-600">Expected ROAS</p>
                    <p className="text-2xl font-bold text-blue-600">{result.quarterlyStrategy.expectedRoas}x</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-slate-600">Budget Required</p>
                    <p className="text-2xl font-bold text-green-600">${result.quarterlyStrategy.budgetRequired}</p>
                  </div>
                </div>
              </Card>

              {/* Annual */}
              {result === MOCK_RESULT && (
                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-4">🚀 Yillik Strategiya</h3>
                  <p className="text-slate-600 mb-4">{result.annualStrategy.longTermGoal}</p>
                  <div className="space-y-2 mb-4">
                    {result.annualStrategy.keyMilestones.map((m, i) => (
                      <div key={i} className="text-sm text-slate-600">• {m}</div>
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 bg-yellow-50 p-4 rounded-lg">
                    {result.annualStrategy.budgetAdvice}
                  </p>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}