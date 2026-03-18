'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { workspaces, aiAgent } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'

const STEPS = [
  { id: 1, title: 'Business Info', description: 'Tell us about your business' },
  { id: 2, title: 'Your Product', description: 'Describe what you are selling' },
  { id: 3, title: 'Target Audience', description: 'Who are your customers?' },
  { id: 4, title: 'Budget & Goals', description: 'Set your advertising budget' },
  { id: 5, title: 'AI Strategy', description: 'Generating your strategy...' },
  { id: 6, title: 'Ready!', description: 'Your AI agent is activated' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { setCurrentWorkspace } = useWorkspaceStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [strategy, setStrategy] = useState<any>(null)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    industry: '',
    productDescription: '',
    targetAudience: '',
    monthlyBudget: 500,
    goal: 'leads',
    targetLocation: 'Uzbekistan',
  })

  function updateForm(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleNext() {
    if (step === 4) {
      // Step 4 → 5: Create workspace then generate AI strategy
      setLoading(true)
      setError('')

      try {
        // Create the workspace
        const wsRes = await workspaces.create({
          name: form.name,
          industry: form.industry,
          productDescription: form.productDescription,
          targetAudience: form.targetAudience,
          monthlyBudget: form.monthlyBudget,
          goal: form.goal,
        })

        const newWorkspaceId = wsRes.data.id
        setWorkspaceId(newWorkspaceId)
        setStep(5)

        // Generate AI strategy (this takes 8-15 seconds)
        const strategyRes = await aiAgent.generateStrategy(newWorkspaceId)
        setStrategy(strategyRes.data)
        setCurrentWorkspace({ ...wsRes.data, aiStrategy: strategyRes.data })
        setStep(6)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Something went wrong')
        setStep(4)
      } finally {
        setLoading(false)
      }
    } else {
      setStep(s => s + 1)
    }
  }

  function handleBack() {
    if (step > 1) setStep(s => s - 1)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            Nishon <span className="text-[#7C3AED]">AI</span>
          </h1>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s) => (
            <div key={s.id} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s.id <= step ? 'bg-[#7C3AED]' : 'bg-[#2A2A3A]'
                }`}
              />
            </div>
          ))}
        </div>

        <div className="card">
          <div className="mb-6">
            <p className="text-[#7C3AED] text-sm font-medium">
              Step {step} of {STEPS.length}
            </p>
            <h2 className="text-xl font-semibold mt-1">{STEPS[step - 1].title}</h2>
            <p className="text-[#6B7280] text-sm mt-1">{STEPS[step - 1].description}</p>
          </div>

          {/* Step 1: Business Name + Industry */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="label">Business / Brand name</label>
                <input
                  className="input"
                  placeholder="e.g. TechShop Uzbekistan"
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Industry</label>
                <select
                  className="input"
                  value={form.industry}
                  onChange={(e) => updateForm('industry', e.target.value)}
                >
                  <option value="">Select industry</option>
                  <option value="ecommerce">E-commerce / Online store</option>
                  <option value="education">Education / Courses</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="beauty">Beauty / Cosmetics</option>
                  <option value="food">Food & Restaurant</option>
                  <option value="fitness">Fitness / Health</option>
                  <option value="services">Professional Services</option>
                  <option value="tech">Technology / SaaS</option>
                  <option value="retail">Retail / Fashion</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">
                  Target location
                </label>
                <select
                  className="input"
                  value={form.targetLocation}
                  onChange={(e) => updateForm('targetLocation', e.target.value)}
                >
                  <option value="Uzbekistan">🇺🇿 Uzbekistan</option>
                  <option value="Kazakhstan">🇰🇿 Kazakhstan</option>
                  <option value="Ukraine">🇺🇦 Ukraine</option>
                  <option value="Georgia">🇬🇪 Georgia</option>
                  <option value="Russia">🇷🇺 Russia</option>
                  <option value="Global">🌍 Global</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Product Description */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="label">
                  Describe your product or service
                  <span className="text-[#4B5563] ml-1">(be specific — AI uses this)</span>
                </label>
                <textarea
                  className="input min-h-[140px] resize-none"
                  placeholder="e.g. We sell premium handmade leather bags for women aged 25-45. Price range $80-200. We ship across Uzbekistan within 2 days. Our bestseller is the 'Tashkent Tote' bag."
                  value={form.productDescription}
                  onChange={(e) => updateForm('productDescription', e.target.value)}
                />
                <p className="text-[#4B5563] text-xs mt-2">
                  {form.productDescription.length} characters
                  {form.productDescription.length < 50 && (
                    <span className="text-yellow-500 ml-2">
                      ⚠ Add more detail for better AI strategy
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Target Audience */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="label">
                  Describe your ideal customer
                </label>
                <textarea
                  className="input min-h-[120px] resize-none"
                  placeholder="e.g. Women aged 25-40, living in Tashkent, interested in fashion and style. Have a middle-to-upper income. Active on Instagram. Buy gifts for themselves or as presents."
                  value={form.targetAudience}
                  onChange={(e) => updateForm('targetAudience', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 4: Budget & Goal */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <label className="label">
                  Monthly advertising budget
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]">$</span>
                  <input
                    type="number"
                    className="input pl-8"
                    min={50}
                    value={form.monthlyBudget}
                    onChange={(e) => updateForm('monthlyBudget', Number(e.target.value))}
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  {[100, 300, 500, 1000, 2000].map(amount => (
                    <button
                      key={amount}
                      onClick={() => updateForm('monthlyBudget', amount)}
                      className={`text-sm px-3 py-1 rounded-lg border transition-all ${
                        form.monthlyBudget === amount
                          ? 'border-[#7C3AED] bg-[#7C3AED]/10 text-[#A78BFA]'
                          : 'border-[#2A2A3A] text-[#6B7280] hover:border-[#7C3AED]'
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Primary goal</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'leads', label: '🎯 Generate Leads', desc: 'Get contact info from interested customers' },
                    { value: 'sales', label: '🛒 Drive Sales', desc: 'Direct purchases and conversions' },
                    { value: 'awareness', label: '📢 Brand Awareness', desc: 'Get more people to know your brand' },
                    { value: 'traffic', label: '🌐 Website Traffic', desc: 'Bring visitors to your website' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateForm('goal', option.value)}
                      className={`text-left p-3 rounded-lg border transition-all ${
                        form.goal === option.value
                          ? 'border-[#7C3AED] bg-[#7C3AED]/10'
                          : 'border-[#2A2A3A] hover:border-[#7C3AED]/50'
                      }`}
                    >
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-[#6B7280] text-xs mt-1">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Generating Strategy */}
          {step === 5 && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#7C3AED]/10 mb-4">
                <div className="w-8 h-8 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
              </div>
              <h3 className="text-lg font-medium mb-2">Analyzing your business...</h3>
              <p className="text-[#6B7280] text-sm max-w-sm mx-auto">
                Nishon AI is analyzing your market, competitors, and generating
                a personalized advertising strategy. This takes 10-15 seconds.
              </p>
              <div className="mt-6 space-y-2 text-left max-w-xs mx-auto">
                {[
                  '✅ Business profile analyzed',
                  '✅ Competitor landscape scanned',
                  '⏳ Generating platform strategy...',
                  '⏳ Calculating budget allocation...',
                  '⏳ Forecasting KPIs...',
                ].map((item, i) => (
                  <p key={i} className="text-sm text-[#6B7280]">{item}</p>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Strategy Ready */}
          {step === 6 && strategy && (
            <div className="space-y-4">
              <div className="bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-lg p-4">
                <p className="text-[#A78BFA] text-sm">{strategy.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1C1C27] rounded-lg p-3">
                  <p className="text-[#6B7280] text-xs">Est. Monthly Leads</p>
                  <p className="text-xl font-bold text-white mt-1">
                    {strategy.monthlyForecast?.estimatedLeads || '—'}
                  </p>
                </div>
                <div className="bg-[#1C1C27] rounded-lg p-3">
                  <p className="text-[#6B7280] text-xs">Est. ROAS</p>
                  <p className="text-xl font-bold text-emerald-400 mt-1">
                    {strategy.monthlyForecast?.estimatedRoas?.toFixed(1) || '—'}x
                  </p>
                </div>
                <div className="bg-[#1C1C27] rounded-lg p-3">
                  <p className="text-[#6B7280] text-xs">Est. CPA</p>
                  <p className="text-xl font-bold text-white mt-1">
                    ${strategy.monthlyForecast?.estimatedCpa?.toFixed(0) || '—'}
                  </p>
                </div>
                <div className="bg-[#1C1C27] rounded-lg p-3">
                  <p className="text-[#6B7280] text-xs">Recommended Platforms</p>
                  <p className="text-sm font-medium text-white mt-1">
                    {strategy.recommendedPlatforms?.join(', ') || '—'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm mt-4">
              {error}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && step !== 5 && step !== 6 && (
              <button onClick={handleBack} className="btn-secondary flex-1">
                Back
              </button>
            )}

            {step === 6 ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="btn-primary flex-1"
              >
                Open Dashboard →
              </button>
            ) : step !== 5 ? (
              <button
                onClick={handleNext}
                disabled={loading || step === 5}
                className="btn-primary flex-1"
              >
                {loading ? 'Please wait...' : step === 4 ? 'Generate Strategy →' : 'Continue →'}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}