'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { PageSpinner } from '@/components/ui/Spinner'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { formatCurrency } from '@/lib/utils'
import { campaigns, aiAgent } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'

// Types
interface Platform {
  id: string
  name: string
  displayName: string
  logo: string
  connected: boolean
  color: string
}

interface CampaignFormData {
  platforms: string[]
  name: string
  objective: string
  budget: {
    amount: number
    currency: string
    type: 'daily' | 'weekly'
  }
  schedule: {
    startDate: string
    endDate: string
    alwaysOn: boolean
    hours: string[]
  }
  strategy: {
    type: string
    bidCap?: number
    advantagePlus?: boolean
  }
  utm: {
    source: string
    medium: string
    campaign: string
    content: string
    term: string
  }
  extensions: {
    quickLinks: string[]
    clarifiers: string[]
    promoCode?: string
    delivery?: boolean
  }
  aiOptimization: {
    autoReplaceCreatives: boolean
    optimizeAudience: boolean
    weeklyBudgetOptimization: boolean
    dynamicText: boolean
  }
  negativeKeywords: {
    keywords: string[]
    matchType: 'exact' | 'phrase' | 'broad'
  }
  exclusions: {
    sites: string[]
    ips: string[]
  }
  bidAdjustments: {
    genderAge: { [key: string]: number }
    devices: { [key: string]: number }
    audience: { [key: string]: number }
    format: { [key: string]: number }
    income: { [key: string]: number }
    weather: { [key: string]: number }
    kpi: { [key: string]: number }
  }
  geoTargeting: {
    mode: 'list' | 'map'
    locations: string[]
    radius?: number
    city?: string
  }
  adGroup: {
    name: string
    scenario: 'all' | 'new'
    autoTargeting: {
      queries: boolean
      narrowQueries: boolean
      broadQueries: boolean
      additionalQueries: boolean
      alternativeQueries: boolean
      brandReminders: {
        own: boolean
        competitors: boolean
        nonBrand: boolean
      }
    }
    keywords: {
      phrases: string[]
      matchTypes: { [key: string]: 'broad' | 'phrase' | 'exact' }
    }
    negativeKeywords: string[]
    interests: string[]
    audiences: {
      buyers: boolean
      frequentBuyers: boolean
      lookalike: boolean
      abandonedCart: boolean
      viewedNotBought: boolean
      custom: string[]
    }
    extensions: {
      quickLinks: string[]
      clarifiers: string[]
      promoCode?: string
    }
    urlParams: {
      utmContent: string
    }
    bidAdjustments: {
      campaignOverrides: boolean
      adjustments: { [key: string]: number }
    }
    contentRating: {
      adult: boolean
      alcohol: boolean
      gambling: boolean
      violence: boolean
      drugs: boolean
    }
  }
  creative: {
    headlines: string[]
    descriptions: string[]
    images: File[]
    cta: string
    primaryText: string
    testing: {
      enabled: boolean
      variants: number
    }
  }
}

// Mock data
const PLATFORMS: Platform[] = [
  {
    id: 'yandex',
    name: 'yandex',
    displayName: 'Yandex Direct',
    logo: '📘',
    connected: false,
    color: '#FFCC00'
  },
  {
    id: 'google',
    name: 'google',
    displayName: 'Google Ads',
    logo: '🔍',
    connected: true,
    color: '#4285F4'
  },
  {
    id: 'meta',
    name: 'meta',
    displayName: 'Meta Ads',
    logo: '📘',
    connected: true,
    color: '#1877F2'
  },
  {
    id: 'telegram',
    name: 'telegram',
    displayName: 'Telegram Ads',
    logo: '✈️',
    connected: false,
    color: '#2CA5E0'
  }
]

const OBJECTIVES = [
  { value: 'leads', label: 'Leads', icon: '📈' },
  { value: 'traffic', label: 'Traffic', icon: '🚗' },
  { value: 'sales', label: 'Sales', icon: '💰' },
  { value: 'awareness', label: 'Awareness', icon: '👁️' }
]

const CURRENCIES = ['UZS', 'USD', 'EUR', 'RUB']

export default function CampaignWizardPage() {
  const router = useRouter()
  const { currentWorkspace } = useWorkspaceStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [formData, setFormData] = useState<CampaignFormData>({
    platforms: [],
    name: '',
    objective: 'leads',
    budget: {
      amount: 100,
      currency: 'USD',
      type: 'daily'
    },
    schedule: {
      startDate: '',
      endDate: '',
      alwaysOn: true,
      hours: []
    },
    strategy: {
      type: 'maximize_clicks',
      bidCap: undefined,
      advantagePlus: false
    },
    utm: {
      source: '',
      medium: 'cpc',
      campaign: '',
      content: '',
      term: ''
    },
    extensions: {
      quickLinks: [],
      clarifiers: [],
      promoCode: '',
      delivery: false
    },
    aiOptimization: {
      autoReplaceCreatives: true,
      optimizeAudience: true,
      weeklyBudgetOptimization: true,
      dynamicText: false
    },
    negativeKeywords: {
      keywords: [],
      matchType: 'broad'
    },
    exclusions: {
      sites: [],
      ips: []
    },
    bidAdjustments: {
      genderAge: {},
      devices: {},
      audience: {},
      format: {},
      income: {},
      weather: {},
      kpi: {}
    },
    geoTargeting: {
      mode: 'list',
      locations: [],
      radius: 10,
      city: ''
    },
    adGroup: {
      name: '',
      scenario: 'all',
      autoTargeting: {
        queries: true,
        narrowQueries: true,
        broadQueries: true,
        additionalQueries: true,
        alternativeQueries: true,
        brandReminders: {
          own: false,
          competitors: false,
          nonBrand: true
        }
      },
      keywords: {
        phrases: [],
        matchTypes: {}
      },
      negativeKeywords: [],
      interests: [],
      audiences: {
        buyers: true,
        frequentBuyers: false,
        lookalike: true,
        abandonedCart: true,
        viewedNotBought: false,
        custom: []
      },
      extensions: {
        quickLinks: [],
        clarifiers: [],
        promoCode: ''
      },
      urlParams: {
        utmContent: '{ad_group_name}'
      },
      bidAdjustments: {
        campaignOverrides: false,
        adjustments: {}
      },
      contentRating: {
        adult: false,
        alcohol: false,
        gambling: false,
        violence: false,
        drugs: false
      }
    },
    creative: {
      headlines: [],
      descriptions: [],
      images: [],
      cta: 'Learn More',
      primaryText: '',
      testing: {
        enabled: true,
        variants: 3
      }
    }
  })

  const totalSteps = 6

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handlePublish = async () => {
    if (!currentWorkspace?.id) return
    setLoading(true)
    try {
      const platformsToCreate = formData.platforms.length > 0 ? formData.platforms : ['meta']
      await Promise.all(
        platformsToCreate.map((platform) =>
          campaigns.create(currentWorkspace.id, {
            name: formData.name,
            platform,
            objective: formData.objective,
            dailyBudget: formData.budget.type === 'daily' ? formData.budget.amount : null,
            totalBudget: formData.budget.type === 'weekly' ? formData.budget.amount * 7 : null,
            startDate: formData.schedule.startDate || null,
            endDate: formData.schedule.alwaysOn ? null : formData.schedule.endDate || null,
            aiConfig: {
              strategy: formData.strategy,
              utm: formData.utm,
              geoTargeting: formData.geoTargeting,
              adGroup: formData.adGroup,
              creative: formData.creative,
              aiOptimization: formData.aiOptimization,
            },
          })
        )
      )
      router.push('/campaigns')
    } catch (error) {
      console.error('Error creating campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/campaigns/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, status: 'draft', savedAt: new Date().toISOString() }),
      })
      if (!res.ok) throw new Error(`Draft save failed: ${res.status}`)
      const data = await res.json()
      // Update URL to include draft ID so user can return to it
      router.replace(`/wizard?draft=${data.id}`)
    } catch (err) {
      console.error('Draft save error:', err)
      // Fallback: save to localStorage
      localStorage.setItem('wizard_draft', JSON.stringify({ ...formData, savedAt: new Date().toISOString() }))
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateKeywords = async () => {
    setAiLoading(true)
    try {
      const res = await aiAgent.wizardKeywords({
        productName: formData.name || 'Product',
        niche: formData.objective,
        platform: formData.platforms[0] || 'meta',
        matchType: 'broad',
      })
      const response = (res as any).data ?? res
      setFormData(prev => ({
        ...prev,
        adGroup: {
          ...prev.adGroup,
          keywords: {
            ...prev.adGroup.keywords,
            phrases: response.keywords || [],
            matchTypes: response.matchTypes || {},
          },
          negativeKeywords: response.negativeKeywords || [],
        },
      }))
    } catch (error) {
      console.error('Error generating keywords:', error)
    } finally {
      setAiLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!currentWorkspace?.id) return
    setLoading(true)
    try {
      await campaigns.create(currentWorkspace.id, {
        name: formData.name || 'Untitled Draft',
        platform: formData.platforms[0] || 'meta',
        objective: formData.objective,
        dailyBudget: formData.budget.type === 'daily' ? formData.budget.amount : null,
        totalBudget: formData.budget.type === 'weekly' ? formData.budget.amount * 7 : null,
        startDate: formData.schedule.startDate || null,
        endDate: formData.schedule.alwaysOn ? null : formData.schedule.endDate || null,
        status: 'draft',
        aiConfig: {
          strategy: formData.strategy,
          utm: formData.utm,
          geoTargeting: formData.geoTargeting,
          adGroup: formData.adGroup,
          creative: formData.creative,
          aiOptimization: formData.aiOptimization,
        },
      })
      router.push('/campaigns')
    } catch (error) {
      console.error('Error saving draft:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateAdCopy = async () => {
    setAiLoading(true)
    try {
      const res = await aiAgent.wizardAdCopy({
        productName: formData.name || 'Product',
        benefits: ['High Quality', 'Fast Delivery', 'Best Price'],
        objective: formData.objective,
        audience: 'Target Audience',
        platform: formData.platforms[0] || 'meta',
      })
      const response = (res as any).data ?? res
      setFormData(prev => ({
        ...prev,
        creative: {
          ...prev.creative,
          headlines: response.headlines || [],
          descriptions: response.descriptions || [],
          cta: response.cta || '',
          primaryText: response.primaryText || '',
        },
      }))
    } catch (error) {
      console.error('Error generating ad copy:', error)
    } finally {
      setAiLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Platforms formData={formData} setFormData={setFormData} />
      case 2:
        return <Step2CampaignSettings formData={formData} setFormData={setFormData} />
      case 3:
        return <Step3AdGroupSettings 
          formData={formData} 
          setFormData={setFormData} 
          onGenerateKeywords={handleGenerateKeywords}
          aiLoading={aiLoading}
        />
      case 4:
        return <Step4Creative 
          formData={formData} 
          setFormData={setFormData}
          onGenerateAdCopy={handleGenerateAdCopy}
          aiLoading={aiLoading}
        />
      case 5:
        return <Step5Preview formData={formData} />
      case 6:
        return <Step6Publish formData={formData} onPublish={handlePublish} loading={loading} />
      default:
        return null
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Create Campaign</h1>
          <p className="text-[#6B7280] text-sm">Step {currentStep} of {totalSteps}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => router.push('/campaigns')}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleSaveDraft} disabled={loading}>
            {loading ? 'Saqlanmoqda...' : 'Save Draft'}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-[#13131A] border border-[#2A2A3A] rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[#6B7280]">Progress</span>
          <span className="text-sm text-white">{currentStep}/{totalSteps}</span>
        </div>
        <div className="w-full bg-[#2A2A3A] rounded-full h-2">
          <div 
            className="bg-[#7C3AED] h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <Card padding="lg">
        {renderStep()}
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button 
          variant="secondary" 
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          Back
        </Button>
        <div className="flex items-center gap-2">
          {currentStep < totalSteps ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button onClick={handlePublish} disabled={loading}>
              {loading ? 'Publishing...' : 'Publish Campaign'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Step Components
function Step1Platforms({ formData, setFormData }: { formData: CampaignFormData, setFormData: React.Dispatch<React.SetStateAction<CampaignFormData>> }) {
  const togglePlatform = (platformId: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId]
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Select Platforms</h2>
        <p className="text-[#6B7280]">Choose where you want to run your campaign</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLATFORMS.map(platform => (
          <Card 
            key={platform.id}
            hoverable
            onClick={() => togglePlatform(platform.id)}
            className={`cursor-pointer transition-all ${
              formData.platforms.includes(platform.id) 
                ? 'border-[#7C3AED]/40 bg-[#7C3AED]/5' 
                : ''
            }`}
          >
            <div className="flex items-center gap-4">
              <PlatformIcon platform={platform.name} size="lg" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white">{platform.displayName}</h3>
                  {!platform.connected && (
                    <Badge variant="warning" size="sm">Not Connected</Badge>
                  )}
                </div>
                <p className="text-[#6B7280] text-sm">
                  {platform.connected ? 'Ready to use' : 'Connect account to enable'}
                </p>
              </div>
              <div className={`w-4 h-4 rounded border-2 ${
                formData.platforms.includes(platform.id) 
                  ? 'bg-[#7C3AED] border-[#7C3AED]' 
                  : 'border-[#3A3A4A] bg-[#2A2A3A]'
              }`}>
                {formData.platforms.includes(platform.id) && (
                  <svg className="w-3 h-3 text-white mt-0.5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {formData.platforms.length === 0 && (
        <div className="text-center py-8">
          <p className="text-[#6B7280]">Select at least one platform to continue</p>
        </div>
      )}
    </div>
  )
}

const BIDDING_STRATEGIES_BY_PLATFORM: Record<string, { value: string; label: string }[]> = {
  meta: [
    { value: 'highest_volume', label: 'Highest Volume' },
    { value: 'cost_per_result_goal', label: 'Cost per Result Goal' },
    { value: 'bid_cap', label: 'Bid Cap' },
    { value: 'roas_goal', label: 'ROAS Goal' },
  ],
  google: [
    { value: 'maximize_clicks', label: 'Maximize Clicks' },
    { value: 'maximize_conversions', label: 'Maximize Conversions' },
    { value: 'target_cpa', label: 'Target CPA' },
    { value: 'target_roas', label: 'Target ROAS' },
    { value: 'manual_cpc', label: 'Manual CPC' },
  ],
  yandex: [
    { value: 'maximize_clicks', label: 'Maximize Clicks' },
    { value: 'target_cpa', label: 'Target CPA' },
    { value: 'target_roas', label: 'Target ROAS' },
    { value: 'manual', label: 'Manual Bidding' },
  ],
  telegram: [
    { value: 'cpm', label: 'CPM (per 1000 views)' },
    { value: 'cpc', label: 'CPC (per click)' },
  ],
}

const HOURS_24 = Array.from({ length: 24 }, (_, i) => i)

function Step2CampaignSettings({ formData, setFormData }: { formData: CampaignFormData, setFormData: React.Dispatch<React.SetStateAction<CampaignFormData>> }) {
  const primaryPlatform = formData.platforms[0] || 'meta'
  const biddingOptions = BIDDING_STRATEGIES_BY_PLATFORM[primaryPlatform] || BIDDING_STRATEGIES_BY_PLATFORM.meta
  const selectedHours: string[] = formData.schedule.hours || []

  const toggleHour = (h: string) => {
    const next = selectedHours.includes(h)
      ? selectedHours.filter((x: string) => x !== h)
      : [...selectedHours, h]
    setFormData(prev => ({ ...prev, schedule: { ...prev.schedule, hours: next } }))
  }

  const cls = "w-full px-3 py-2 bg-[#2A2A3A] border border-[#3A3A4A] rounded-lg text-white focus:outline-none focus:border-[#7C3AED]"
  const lbl = "block text-sm font-medium text-[#6B7280] mb-2"

  const quickLinks: string[] = formData.extensions.quickLinks || []
  const clarifiers: string[] = formData.extensions.clarifiers || []

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-white">Campaign Settings</h2>

      {/* ── Basic ── */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Campaign Name</label>
            <input type="text" value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`${cls} placeholder-[#6B7280]`} placeholder="Enter campaign name" />
          </div>
          <div>
            <label className={lbl}>Objective</label>
            <select value={formData.objective}
              onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
              className={cls}>
              {OBJECTIVES.map(obj => <option key={obj.value} value={obj.value}>{obj.label}</option>)}
            </select>
          </div>
        </div>

        {/* Budget */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={lbl}>Budget Amount</label>
            <input type="number" value={formData.budget.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, budget: { ...prev.budget, amount: Number(e.target.value) } }))}
              className={cls} />
          </div>
          <div>
            <label className={lbl}>Currency</label>
            <select value={formData.budget.currency}
              onChange={(e) => setFormData(prev => ({ ...prev, budget: { ...prev.budget, currency: e.target.value } }))}
              className={cls}>
              {CURRENCIES.map(curr => <option key={curr} value={curr}>{curr}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Budget Type</label>
            <select value={formData.budget.type}
              onChange={(e) => setFormData(prev => ({ ...prev, budget: { ...prev.budget, type: e.target.value as 'daily' | 'weekly' } }))}
              className={cls}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Start Date</label>
            <input type="date" value={formData.schedule.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, schedule: { ...prev.schedule, startDate: e.target.value } }))}
              className={cls} />
          </div>
          <div>
            <label className={lbl}>End Date</label>
            <input type="date" value={formData.schedule.endDate}
              disabled={formData.schedule.alwaysOn}
              onChange={(e) => setFormData(prev => ({ ...prev, schedule: { ...prev.schedule, endDate: e.target.value } }))}
              className={`${cls} disabled:opacity-40`} />
          </div>
        </div>

        {/* Always On + hour grid */}
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={formData.schedule.alwaysOn}
              onChange={(e) => setFormData(prev => ({ ...prev, schedule: { ...prev.schedule, alwaysOn: e.target.checked } }))}
              className="w-4 h-4 accent-[#7C3AED]" />
            <span className="text-white">Show ad 24/7 (Always On)</span>
          </label>

          {!formData.schedule.alwaysOn && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={lbl} style={{ marginBottom: 0 }}>Ad Show Hours</span>
                <button type="button" onClick={() => {
                  const all = HOURS_24.map(String)
                  const allSelected = all.every(h => selectedHours.includes(h))
                  setFormData(prev => ({ ...prev, schedule: { ...prev.schedule, hours: allSelected ? [] : all } }))
                }} className="text-xs text-[#7C3AED] hover:underline">
                  {HOURS_24.every(h => selectedHours.includes(String(h))) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-8 sm:grid-cols-12 gap-1">
                {HOURS_24.map(h => {
                  const key = String(h)
                  const active = selectedHours.includes(key)
                  return (
                    <button key={h} type="button" onClick={() => toggleHour(key)}
                      className={`py-1 rounded text-xs font-mono transition-colors ${active ? 'bg-[#7C3AED] text-white' : 'bg-[#2A2A3A] text-[#9CA3AF] hover:bg-[#3A3A4A]'}`}>
                      {String(h).padStart(2, '0')}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-[#6B7280] mt-1">
                {selectedHours.length === 0 ? 'No hours — ad will not run' : `${selectedHours.length}/24 hours selected`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Strategy & Bidding ── */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Strategy & Bidding</h3>
        {formData.platforms.length > 0 && (
          <p className="text-xs text-[#6B7280]">
            Showing strategies for <span className="text-[#7C3AED] capitalize">{primaryPlatform}</span>
            {formData.platforms.length > 1 && ` (+${formData.platforms.length - 1} more)`}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Bidding Strategy</label>
            <select value={formData.strategy.type}
              onChange={(e) => setFormData(prev => ({ ...prev, strategy: { ...prev.strategy, type: e.target.value } }))}
              className={cls}>
              {biddingOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Bid Cap (optional)</label>
            <input type="number" value={formData.strategy.bidCap || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, strategy: { ...prev.strategy, bidCap: Number(e.target.value) } }))}
              placeholder="No cap" className={`${cls} placeholder-[#6B7280]`} />
          </div>
        </div>

        {/* Ad Priority (Step 2i) */}
        <div>
          <label className={lbl}>Ad Priority</label>
          <select value={(formData.strategy as any).adPriority || 'medium'}
            onChange={(e) => setFormData(prev => ({ ...prev, strategy: { ...prev.strategy, adPriority: e.target.value } as any }))}
            className={cls}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <p className="text-xs text-[#6B7280] mt-1">Higher priority wins same-account auctions.</p>
        </div>

        {primaryPlatform === 'meta' && (
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={formData.strategy.advantagePlus}
              onChange={(e) => setFormData(prev => ({ ...prev, strategy: { ...prev.strategy, advantagePlus: e.target.checked } }))}
              className="w-4 h-4 accent-[#7C3AED]" />
            <span className="text-white">Advantage+ Campaign Budget</span>
          </label>
        )}
      </div>

      {/* ── UTM Parameters ── */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">UTM Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['source', 'medium', 'campaign', 'content', 'term'] as const).map(field => (
            <input key={field} type="text" placeholder={`utm_${field}`}
              value={formData.utm[field]}
              onChange={(e) => setFormData(prev => ({ ...prev, utm: { ...prev.utm, [field]: e.target.value } }))}
              className={`${cls} placeholder-[#6B7280]`} />
          ))}
        </div>
        <p className="text-xs text-[#6B7280]">Dynamic: {'{keyword}'}, {'{campaign_id}'}, {'{placement}'}</p>
      </div>

      {/* ── Ad Extensions ── */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Ad Extensions</h3>

        {/* Quick Links */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer mb-2">
            <input type="checkbox" checked={(formData.extensions.quickLinks?.length ?? 0) > 0 || false}
              onChange={(e) => {
                if (!e.target.checked) setFormData(prev => ({ ...prev, extensions: { ...prev.extensions, quickLinks: [] } }))
                else setFormData(prev => ({ ...prev, extensions: { ...prev.extensions, quickLinks: [''] } }))
              }}
              className="w-4 h-4 accent-[#7C3AED]" />
            <span className="text-white">Quick Links (Sitelinks)</span>
          </label>
          {(formData.extensions.quickLinks?.length ?? 0) > 0 && (
            <div className="ml-7 space-y-2">
              {[0, 1, 2, 3].map(idx => (
                <input key={idx} type="text" placeholder={`Quick link ${idx + 1} title`}
                  value={quickLinks[idx] || ''}
                  onChange={(e) => {
                    const next = [...quickLinks]
                    next[idx] = e.target.value
                    setFormData(prev => ({ ...prev, extensions: { ...prev.extensions, quickLinks: next } }))
                  }}
                  className={`${cls} placeholder-[#6B7280]`} />
              ))}
            </div>
          )}
        </div>

        {/* Clarifiers */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer mb-2">
            <input type="checkbox" checked={(formData.extensions.clarifiers?.length ?? 0) > 0 || false}
              onChange={(e) => {
                if (!e.target.checked) setFormData(prev => ({ ...prev, extensions: { ...prev.extensions, clarifiers: [] } }))
                else setFormData(prev => ({ ...prev, extensions: { ...prev.extensions, clarifiers: [''] } }))
              }}
              className="w-4 h-4 accent-[#7C3AED]" />
            <span className="text-white">Clarifiers (Callouts)</span>
          </label>
          {(formData.extensions.clarifiers?.length ?? 0) > 0 && (
            <div className="ml-7 space-y-2">
              {[0, 1, 2, 3].map(idx => (
                <input key={idx} type="text" placeholder={`Clarifier ${idx + 1} (e.g. Free Shipping)`}
                  value={clarifiers[idx] || ''}
                  onChange={(e) => {
                    const next = [...clarifiers]
                    next[idx] = e.target.value
                    setFormData(prev => ({ ...prev, extensions: { ...prev.extensions, clarifiers: next } }))
                  }}
                  className={`${cls} placeholder-[#6B7280]`} />
              ))}
            </div>
          )}
        </div>

        {/* Promo Code */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={!!formData.extensions.promoCode}
            onChange={(e) => {
              if (!e.target.checked) setFormData(prev => ({ ...prev, extensions: { ...prev.extensions, promoCode: '' } }))
            }}
            className="w-4 h-4 accent-[#7C3AED]" />
          <span className="text-white">Promo Code</span>
        </label>
        {!!formData.extensions.promoCode && (
          <input type="text" placeholder="e.g. SAVE20" value={formData.extensions.promoCode}
            onChange={(e) => setFormData(prev => ({ ...prev, extensions: { ...prev.extensions, promoCode: e.target.value } }))}
            className={`${cls} placeholder-[#6B7280] ml-7`} />
        )}

        {/* Delivery */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={!!formData.extensions.delivery}
            onChange={(e) => setFormData(prev => ({ ...prev, extensions: { ...prev.extensions, delivery: e.target.checked } }))}
            className="w-4 h-4 accent-[#7C3AED]" />
          <span className="text-white">Delivery Extension</span>
        </label>
      </div>

      {/* ── AI Optimization ── */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">AI Optimization</h3>
        <div className="space-y-3">
          {([
            { key: 'autoReplaceCreatives' as const, label: 'Automatically replace underperforming creatives', desc: 'AI replaces low-performing ads with new variants' },
            { key: 'optimizeAudience' as const, label: 'Optimize audience targeting automatically', desc: 'AI adjusts targeting based on performance' },
            { key: 'weeklyBudgetOptimization' as const, label: 'Weekly budget optimization', desc: 'AI redistributes budget across days' },
            { key: 'dynamicText' as const, label: 'Dynamic text adaptation', desc: 'AI adapts ad text to user context' },
          ]).map(({ key, label, desc }) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.aiOptimization[key]}
                onChange={(e) => setFormData(prev => ({ ...prev, aiOptimization: { ...prev.aiOptimization, [key]: e.target.checked } }))}
                className="w-4 h-4 accent-[#7C3AED] mt-1" />
              <div>
                <span className="text-white">{label}</span>
                <p className="text-xs text-[#6B7280]">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* ── Minus Keywords ── */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Minus Keywords (Campaign Level)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Match Type</label>
            <select value={formData.negativeKeywords.matchType}
              onChange={(e) => setFormData(prev => ({ ...prev, negativeKeywords: { ...prev.negativeKeywords, matchType: e.target.value as any } }))}
              className={cls}>
              <option value="broad">Broad</option>
              <option value="phrase">Phrase</option>
              <option value="exact">Exact</option>
            </select>
          </div>
        </div>
        <textarea rows={5} placeholder="Enter negative keywords, one per line..."
          value={formData.negativeKeywords.keywords.join('\n')}
          onChange={(e) => setFormData(prev => ({ ...prev, negativeKeywords: { ...prev.negativeKeywords, keywords: e.target.value.split('\n').filter(Boolean) } }))}
          className={`${cls} resize-none`} />
      </div>

      {/* ── Bid Adjustments (Campaign) ── */}
      <details className="group">
        <summary className="cursor-pointer text-lg font-semibold text-white py-2 flex items-center gap-2">
          <span>Bid Adjustments (Campaign Level)</span>
          <span className="text-[#6B7280] text-sm group-open:hidden">▶</span>
          <span className="text-[#6B7280] text-sm hidden group-open:inline">▼</span>
        </summary>
        <div className="space-y-6 mt-4">
          {/* Age/Gender */}
          <div>
            <h4 className="text-sm font-medium text-[#9CA3AF] mb-3">Age & Gender</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['male', 'female', 'age_18_24', 'age_25_44'].map(k => (
                <div key={k}>
                  <label className={lbl}>{k.replace('_', ' ')}</label>
                  <input type="number" step="0.1" min="0" max="5" placeholder="1.0"
                    value={formData.bidAdjustments.genderAge[k] ?? 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, bidAdjustments: { ...prev.bidAdjustments, genderAge: { ...prev.bidAdjustments.genderAge, [k]: Number(e.target.value) } } }))}
                    className={cls} />
                </div>
              ))}
            </div>
          </div>
          {/* Devices */}
          <div>
            <h4 className="text-sm font-medium text-[#9CA3AF] mb-3">Devices</h4>
            <div className="grid grid-cols-3 gap-3">
              {['mobile', 'desktop', 'tablet'].map(k => (
                <div key={k}>
                  <label className={lbl}>{k}</label>
                  <input type="number" step="0.1" min="0" max="5" placeholder="1.0"
                    value={formData.bidAdjustments.devices[k] ?? 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, bidAdjustments: { ...prev.bidAdjustments, devices: { ...prev.bidAdjustments.devices, [k]: Number(e.target.value) } } }))}
                    className={cls} />
                </div>
              ))}
            </div>
          </div>
          {/* Audience */}
          <div>
            <h4 className="text-sm font-medium text-[#9CA3AF] mb-3">Audience Segments</h4>
            <div className="grid grid-cols-3 gap-3">
              {['retargeting', 'lookalike', 'custom'].map(k => (
                <div key={k}>
                  <label className={lbl}>{k}</label>
                  <input type="number" step="0.1" min="0" max="5" placeholder="1.0"
                    value={formData.bidAdjustments.audience[k] ?? 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, bidAdjustments: { ...prev.bidAdjustments, audience: { ...prev.bidAdjustments.audience, [k]: Number(e.target.value) } } }))}
                    className={cls} />
                </div>
              ))}
            </div>
          </div>
          {/* Format */}
          <div>
            <h4 className="text-sm font-medium text-[#9CA3AF] mb-3">Ad Format</h4>
            <div className="grid grid-cols-4 gap-3">
              {['image', 'video', 'carousel', 'collection'].map(k => (
                <div key={k}>
                  <label className={lbl}>{k}</label>
                  <input type="number" step="0.1" min="0" max="5" placeholder="1.0"
                    value={formData.bidAdjustments.format[k] ?? 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, bidAdjustments: { ...prev.bidAdjustments, format: { ...prev.bidAdjustments.format, [k]: Number(e.target.value) } } }))}
                    className={cls} />
                </div>
              ))}
            </div>
          </div>
          {/* Income */}
          <div>
            <h4 className="text-sm font-medium text-[#9CA3AF] mb-3">Income Level</h4>
            <div className="grid grid-cols-3 gap-3">
              {['low', 'medium', 'high'].map(k => (
                <div key={k}>
                  <label className={lbl}>{k} income</label>
                  <input type="number" step="0.1" min="0" max="5" placeholder="1.0"
                    value={formData.bidAdjustments.income[k] ?? 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, bidAdjustments: { ...prev.bidAdjustments, income: { ...prev.bidAdjustments.income, [k]: Number(e.target.value) } } }))}
                    className={cls} />
                </div>
              ))}
            </div>
          </div>
          {/* Weather */}
          <div>
            <h4 className="text-sm font-medium text-[#9CA3AF] mb-3">Weather</h4>
            <div className="grid grid-cols-3 gap-3">
              {['sunny', 'rainy', 'cold'].map(k => (
                <div key={k}>
                  <label className={lbl}>{k}</label>
                  <input type="number" step="0.1" min="0" max="5" placeholder="1.0"
                    value={formData.bidAdjustments.weather[k] ?? 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, bidAdjustments: { ...prev.bidAdjustments, weather: { ...prev.bidAdjustments.weather, [k]: Number(e.target.value) } } }))}
                    className={cls} />
                </div>
              ))}
            </div>
          </div>
          {/* KPI — 7th type */}
          <div>
            <h4 className="text-sm font-medium text-[#9CA3AF] mb-1">KPI Corrections</h4>
            <p className="text-xs text-[#6B7280] mb-3">Adjust bids when campaign KPI deviates from target</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { k: 'cpa_above', l: 'CPA above target' },
                { k: 'cpa_below', l: 'CPA below target' },
                { k: 'ctr_above', l: 'CTR above avg' },
                { k: 'ctr_below', l: 'CTR below avg' },
                { k: 'roas_above', l: 'ROAS above target' },
                { k: 'roas_below', l: 'ROAS below target' },
              ].map(({ k, l }) => (
                <div key={k}>
                  <label className={lbl}>{l}</label>
                  <input type="number" step="0.05" min="0" max="3" placeholder="1.0"
                    value={formData.bidAdjustments.kpi[k] ?? 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, bidAdjustments: { ...prev.bidAdjustments, kpi: { ...prev.bidAdjustments.kpi, [k]: Number(e.target.value) } } }))}
                    className={cls} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </details>

      {/* ── Placement Exclusions ── */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Placement Exclusions</h3>
        <div>
          <label className={lbl}>Excluded Sites (one per line)</label>
          <textarea rows={3} placeholder="example.com&#10;bad-site.net"
            value={formData.exclusions.sites.join('\n')}
            onChange={(e) => setFormData(prev => ({ ...prev, exclusions: { ...prev.exclusions, sites: e.target.value.split('\n').filter(Boolean) } }))}
            className={`${cls} resize-none`} />
        </div>
        <div>
          <label className={lbl}>Excluded IPs (one per line)</label>
          <textarea rows={3} placeholder="192.168.0.1"
            value={formData.exclusions.ips.join('\n')}
            onChange={(e) => setFormData(prev => ({ ...prev, exclusions: { ...prev.exclusions, ips: e.target.value.split('\n').filter(Boolean) } }))}
            className={`${cls} resize-none`} />
        </div>
      </div>
    </div>
  )
}

function Step3AdGroupSettings({ formData, setFormData, onGenerateKeywords, aiLoading }: {
  formData: CampaignFormData,
  setFormData: React.Dispatch<React.SetStateAction<CampaignFormData>>,
  onGenerateKeywords: () => void,
  aiLoading: boolean
}) {
  const [geoInput, setGeoInput] = useState('')
  const [kwInput, setKwInput] = useState('')
  const [kwMatch, setKwMatch] = useState<'broad'|'phrase'|'exact'>('broad')

  const cls = "w-full px-3 py-2 bg-[#2A2A3A] border border-[#3A3A4A] rounded-lg text-white placeholder-[#6B7280] focus:outline-none focus:border-[#7C3AED]"
  const lbl = "block text-sm font-medium text-[#6B7280] mb-1"

  const addGeo = () => {
    const val = geoInput.trim()
    if (!val) return
    setFormData(prev => ({ ...prev, geoTargeting: { ...prev.geoTargeting, locations: [...prev.geoTargeting.locations, val] } }))
    setGeoInput('')
  }
  const removeGeo = (i: number) => {
    setFormData(prev => ({ ...prev, geoTargeting: { ...prev.geoTargeting, locations: prev.geoTargeting.locations.filter((_, j) => j !== i) } }))
  }

  const addKw = () => {
    const val = kwInput.trim()
    if (!val) return
    setFormData(prev => ({
      ...prev,
      adGroup: {
        ...prev.adGroup,
        keywords: {
          phrases: [...prev.adGroup.keywords.phrases, val],
          matchTypes: { ...prev.adGroup.keywords.matchTypes, [val]: kwMatch }
        }
      }
    }))
    setKwInput('')
  }
  const removeKw = (phrase: string) => {
    setFormData(prev => {
      const phrases = prev.adGroup.keywords.phrases.filter(p => p !== phrase)
      const matchTypes = { ...prev.adGroup.keywords.matchTypes }
      delete matchTypes[phrase]
      return { ...prev, adGroup: { ...prev.adGroup, keywords: { phrases, matchTypes } } }
    })
  }

  const toggleAt = (key: keyof typeof formData.adGroup.autoTargeting) => {
    setFormData(prev => ({
      ...prev,
      adGroup: { ...prev.adGroup, autoTargeting: { ...prev.adGroup.autoTargeting, [key]: !prev.adGroup.autoTargeting[key as keyof typeof prev.adGroup.autoTargeting] } }
    }))
  }
  const toggleAud = (key: keyof typeof formData.adGroup.audiences) => {
    setFormData(prev => ({
      ...prev,
      adGroup: { ...prev.adGroup, audiences: { ...prev.adGroup.audiences, [key]: !prev.adGroup.audiences[key as keyof typeof prev.adGroup.audiences] } }
    }))
  }

  const groupExtQl: string[] = formData.adGroup.extensions.quickLinks || []
  const groupExtCl: string[] = formData.adGroup.extensions.clarifiers || []

  const BID7 = [
    { k: 'genderAge', l: 'Age / Gender' },
    { k: 'devices', l: 'Devices' },
    { k: 'audience', l: 'Audience' },
    { k: 'format', l: 'Ad Format' },
    { k: 'income', l: 'Income Level' },
    { k: 'weather', l: 'Weather' },
    { k: 'kpi', l: 'KPI Correction' },
  ]

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-white">Ad Group Settings</h2>

      {/* ── Basic ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Ad Group Name</label>
          <input type="text" value={formData.adGroup.name}
            onChange={e => setFormData(prev => ({ ...prev, adGroup: { ...prev.adGroup, name: e.target.value } }))}
            className={`${cls} placeholder-[#6B7280]`} placeholder="e.g. Search — Shoes — Broad" />
        </div>
        <div>
          <label className={lbl}>Scenario</label>
          <select value={formData.adGroup.scenario}
            onChange={e => setFormData(prev => ({ ...prev, adGroup: { ...prev.adGroup, scenario: e.target.value as 'all' | 'new' } }))}
            className={cls}>
            <option value="all">All interested audience (new + existing)</option>
            <option value="new">New audience only (no retargeting)</option>
          </select>
        </div>
      </div>

      {/* ── Geo Targeting with chips ── */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Geo Targeting</h3>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, geoTargeting: { ...prev.geoTargeting, mode: 'list' } }))}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${formData.geoTargeting.mode === 'list' ? 'bg-[#7C3AED] text-white' : 'bg-[#2A2A3A] text-[#9CA3AF]'}`}>
            List Mode
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, geoTargeting: { ...prev.geoTargeting, mode: 'map' } }))}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${formData.geoTargeting.mode === 'map' ? 'bg-[#7C3AED] text-white' : 'bg-[#2A2A3A] text-[#9CA3AF]'}`}>
            Map Mode (Radius)
          </button>
        </div>

        {formData.geoTargeting.mode === 'list' ? (
          <div>
            <div className="flex gap-2 mb-2">
              <input type="text" value={geoInput} onChange={e => setGeoInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addGeo()}
                className={`${cls} flex-1`} placeholder="City or region, press Enter" />
              <button type="button" onClick={addGeo}
                className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] rounded-lg text-white text-sm font-medium">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.geoTargeting.locations.map((loc, i) => (
                <span key={i} className="flex items-center gap-1 bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#A78BFA] text-sm px-2 py-1 rounded-full">
                  📍 {loc}
                  <button type="button" onClick={() => removeGeo(i)} className="ml-1 hover:text-white">×</button>
                </span>
              ))}
              {formData.geoTargeting.locations.length === 0 && (
                <span className="text-[#6B7280] text-sm">No locations added yet</span>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>City</label>
              <input type="text" value={formData.geoTargeting.city || ''}
                onChange={e => setFormData(prev => ({ ...prev, geoTargeting: { ...prev.geoTargeting, city: e.target.value } }))}
                className={`${cls} placeholder-[#6B7280]`} placeholder="Tashkent" />
            </div>
            <div>
              <label className={lbl}>Radius (km)</label>
              <input type="number" min={1} value={formData.geoTargeting.radius || 10}
                onChange={e => setFormData(prev => ({ ...prev, geoTargeting: { ...prev.geoTargeting, radius: Number(e.target.value) } }))}
                className={cls} />
            </div>
          </div>
        )}
      </div>

      {/* ── Auto Targeting ── */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Auto Targeting (AI-based)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {([
            { key: 'queries', label: 'Direct queries', desc: 'Product-specific' },
            { key: 'narrowQueries', label: 'Narrow queries', desc: 'Exact specs' },
            { key: 'broadQueries', label: 'Broad queries', desc: 'Category' },
            { key: 'additionalQueries', label: 'Additional', desc: 'Related products' },
            { key: 'alternativeQueries', label: 'Alternative', desc: 'Substitutes' },
          ] as const).map(({ key, label, desc }) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer bg-[#1A1A2E] border border-[#2A2A3A] rounded-lg p-3 hover:border-[#7C3AED]/40">
              <input type="checkbox" checked={formData.adGroup.autoTargeting[key] as boolean}
                onChange={() => toggleAt(key)} className="w-4 h-4 accent-[#7C3AED] mt-0.5" />
              <div>
                <div className="text-white text-sm font-medium">{label}</div>
                <div className="text-[#6B7280] text-xs">{desc}</div>
              </div>
            </label>
          ))}
        </div>
        <div className="mt-3">
          <p className="text-[#6B7280] text-xs mb-2">Brand Reminders:</p>
          <div className="flex gap-4">
            {([
              { key: 'own', label: 'Own Brand' },
              { key: 'competitors', label: 'Competitor Brands' },
              { key: 'nonBrand', label: 'Brandless' },
            ] as const).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.adGroup.autoTargeting.brandReminders[key]}
                  onChange={() => setFormData(prev => ({ ...prev, adGroup: { ...prev.adGroup, autoTargeting: { ...prev.adGroup.autoTargeting, brandReminders: { ...prev.adGroup.autoTargeting.brandReminders, [key]: !prev.adGroup.autoTargeting.brandReminders[key] } } } }))}
                  className="w-4 h-4 accent-[#7C3AED]" />
                <span className="text-white text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ── Keywords ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Keywords</h3>
          <Button variant="secondary" size="sm" onClick={onGenerateKeywords} disabled={aiLoading}>
            {aiLoading ? 'Generating…' : '✨ AI Generate'}
          </Button>
        </div>
        <div className="flex gap-2 mb-3">
          <input type="text" value={kwInput} onChange={e => setKwInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addKw()}
            className={`${cls} flex-1`} placeholder="Type keyword, press Enter" />
          <select value={kwMatch} onChange={e => setKwMatch(e.target.value as any)}
            className="px-3 py-2 bg-[#2A2A3A] border border-[#3A3A4A] rounded-lg text-white text-sm">
            <option value="broad">Broad</option>
            <option value="phrase">Phrase</option>
            <option value="exact">Exact</option>
          </select>
          <button type="button" onClick={addKw}
            className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] rounded-lg text-white text-sm">Add</button>
        </div>
        <div className="space-y-1">
          {formData.adGroup.keywords.phrases.map((phrase, i) => (
            <div key={i} className="flex items-center justify-between bg-[#1A1A2E] border border-[#2A2A3A] rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-white text-sm">{phrase}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  formData.adGroup.keywords.matchTypes[phrase] === 'exact' ? 'bg-purple-500/20 text-purple-300' :
                  formData.adGroup.keywords.matchTypes[phrase] === 'phrase' ? 'bg-blue-500/20 text-blue-300' :
                  'bg-gray-500/20 text-gray-300'
                }`}>
                  {formData.adGroup.keywords.matchTypes[phrase] || 'broad'}
                </span>
              </div>
              <button type="button" onClick={() => removeKw(phrase)} className="text-[#6B7280] hover:text-red-400 text-sm">×</button>
            </div>
          ))}
          {formData.adGroup.keywords.phrases.length === 0 && (
            <p className="text-[#6B7280] text-sm text-center py-4">No keywords yet. Add manually or use AI Generate.</p>
          )}
        </div>
      </div>

      {/* ── Interests with AI parse ── */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Interests & Habits</h3>
        <textarea rows={3} placeholder="Describe your audience freely, e.g. 'sports fans aged 25-35 who shop online'"
          value={formData.adGroup.interests.join('\n')}
          onChange={e => setFormData(prev => ({ ...prev, adGroup: { ...prev.adGroup, interests: e.target.value.split('\n').filter(Boolean) } }))}
          className={`${cls} resize-none`} />
        <p className="text-xs text-[#6B7280] mt-1">AI will parse this and map to platform-specific interest segments automatically.</p>
      </div>

      {/* ── Audience Segments ── */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Audience Segments & Retargeting</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {([
            { key: 'buyers', label: 'Buyers', desc: '≥1 purchase' },
            { key: 'frequentBuyers', label: 'Frequent Buyers', desc: 'Multiple purchases' },
            { key: 'lookalike', label: 'Lookalike', desc: 'Similar to buyers' },
            { key: 'abandonedCart', label: 'Abandoned Cart', desc: 'Added but not bought' },
            { key: 'viewedNotBought', label: 'Viewed Not Bought', desc: 'Saw product, no purchase' },
          ] as const).map(({ key, label, desc }) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer bg-[#1A1A2E] border border-[#2A2A3A] rounded-lg p-3 hover:border-[#7C3AED]/40">
              <input type="checkbox" checked={formData.adGroup.audiences[key] as boolean}
                onChange={() => toggleAud(key)} className="w-4 h-4 accent-[#7C3AED] mt-0.5" />
              <div>
                <div className="text-white text-sm font-medium">{label}</div>
                <div className="text-[#6B7280] text-xs">{desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* ── Group Extensions with content ── */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Ad Group Extensions</h3>
        <p className="text-xs text-[#6B7280] mb-3">These override campaign-level extensions for this ad group only.</p>

        {/* Quick Links */}
        <div className="mb-4">
          <label className="flex items-center gap-3 cursor-pointer mb-2">
            <input type="checkbox"
              checked={(formData.adGroup.extensions.quickLinks?.length ?? 0) > 0}
              onChange={e => {
                if (!e.target.checked) setFormData(prev => ({ ...prev, adGroup: { ...prev.adGroup, extensions: { ...prev.adGroup.extensions, quickLinks: [] } } }))
                else setFormData(prev => ({ ...prev, adGroup: { ...prev.adGroup, extensions: { ...prev.adGroup.extensions, quickLinks: [''] } } }))
              }}
              className="w-4 h-4 accent-[#7C3AED]" />
            <span className="text-white">Quick Links (override campaign)</span>
          </label>
          {(formData.adGroup.extensions.quickLinks?.length ?? 0) > 0 && (
            <div className="ml-7 space-y-2">
              {[0, 1, 2, 3].map(idx => (
                <input key={idx} type="text"
                  placeholder={`Quick link ${idx + 1} title`}
                  value={groupExtQl[idx] || ''}
                  onChange={e => {
                    const next = [...groupExtQl]; next[idx] = e.target.value
                    setFormData(prev => ({ ...prev, adGroup: { ...prev.adGroup, extensions: { ...prev.adGroup.extensions, quickLinks: next } } }))
                  }}
                  className={`${cls} placeholder-[#6B7280]`} />
              ))}
            </div>
          )}
        </div>

        {/* Clarifiers */}
        <div className="mb-4">
          <label className="flex items-center gap-3 cursor-pointer mb-2">
            <input type="checkbox"
              checked={(formData.adGroup.extensions.clarifiers?.length ?? 0) > 0}
              onChange={e => {
                if (!e.target.checked) setFormData(prev => ({ ...prev, adGroup: { ...prev.adGroup, extensions: { ...prev.adGroup.extensions, clarifiers: [] } } }))
                else setFormData(prev => ({ ...prev, adGroup: { ...prev.adGroup, extensions: { ...prev.adGroup.extensions, clarifiers: [''] } } }))
              }}
              className="w-4 h-4 accent-[#7C3AED]" />
            <span className="text-white">Clarifiers (override campaign)</span>
          </label>
          {(formData.adGroup.extensions.clarifiers?.length ?? 0) > 0 && (
            <div className="ml-7 space-y-2">
              {[0, 1, 2, 3].map(idx => (
                <input key={idx} type="text"
                  placeholder={`Clarifier ${idx + 1}`}
                  value={groupExtCl[idx] || ''}
                  onChange={e => {
                    const next = [...groupExtCl]; next[idx] = e.target.value
                    setFormData(prev => ({ ...prev, adGroup: { ...prev.adGroup, extensions: { ...prev.adGroup.extensions, clarifiers: next } } }))
                  }}
                  className={`${cls} placeholder-[#6B7280]`} />
              ))}
            </div>
          )}
        </div>

        {/* Promo Code */}
        <label className="flex items-center gap-3 cursor-pointer mb-2">
          <input type="checkbox"
            checked={!!formData.adGroup.extensions.promoCode}
            onChange={e => {
              if (!e.target.checked) setFormData(prev => ({ ...prev, adGroup: { ...prev.adGroup, extensions: { ...prev.adGroup.extensions, promoCode: '' } } }))
            }}
            className="w-4 h-4 accent-[#7C3AED]" />
          <span className="text-white">Promo Code (override campaign)</span>
        </label>
        {!!formData.adGroup.extensions.promoCode && (
          <input type="text" placeholder="e.g. GROUP20"
            value={formData.adGroup.extensions.promoCode}
            onChange={e => setFormData(prev => ({ ...prev, adGroup: { ...prev.adGroup, extensions: { ...prev.adGroup.extensions, promoCode: e.target.value } } }))}
            className={`${cls} placeholder-[#6B7280] ml-7`} />
        )}
      </div>

      {/* ── Group Bid Adjustments — 7 types ── */}
      <details className="group">
        <summary className="cursor-pointer text-lg font-semibold text-white py-2 flex items-center gap-2">
          Ad Group Bid Adjustments (override campaign)
          <span className="text-[#6B7280] text-sm group-open:hidden">▶</span>
          <span className="text-[#6B7280] text-sm hidden group-open:inline">▼</span>
        </summary>
        <div className="mt-3 space-y-4">
          {BID7.map(({ k, l }) => (
            <div key={k}>
              <label className={lbl}>{l} multiplier</label>
              <input type="number" step="0.1" min="0" max="5" placeholder="1.0 = no change"
                value={formData.adGroup.bidAdjustments.adjustments[k] ?? 1}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  adGroup: { ...prev.adGroup, bidAdjustments: {
                    ...prev.adGroup.bidAdjustments,
                    adjustments: { ...prev.adGroup.bidAdjustments.adjustments, [k]: Number(e.target.value) }
                  }}
                }))}
                className={cls} />
            </div>
          ))}
        </div>
      </details>

      {/* ── URL Params ── */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">URL Parameters</h3>
        <div>
          <label className={lbl}>UTM Content</label>
          <input type="text" value={formData.adGroup.urlParams.utmContent}
            onChange={e => setFormData(prev => ({ ...prev, adGroup: { ...prev.adGroup, urlParams: { utmContent: e.target.value } } }))}
            className={`${cls} placeholder-[#6B7280]`} placeholder="{ad_group_name}" />
          <p className="text-xs text-[#6B7280] mt-1">Dynamic: {'{ad_group_name}'}, {'{keyword}'}</p>
        </div>
      </div>
    </div>
  )
}

// Per-platform headline/description char limits
const CHAR_LIMITS: Record<string, { headline: number; description: number }> = {
  google:   { headline: 30,  description: 90 },
  meta:     { headline: 125, description: 125 },
  yandex:   { headline: 56,  description: 81 },
  telegram: { headline: 80,  description: 200 },
}

function CharCounter({ value, max }: { value: string; max: number }) {
  const len = value.length
  const over = len > max
  return (
    <span className={`text-xs ml-auto ${over ? 'text-red-400' : len > max * 0.8 ? 'text-yellow-400' : 'text-[#4B5563]'}`}>
      {len}/{max}
    </span>
  )
}

function Step4Creative({ formData, setFormData, onGenerateAdCopy, aiLoading }: {
  formData: CampaignFormData,
  setFormData: React.Dispatch<React.SetStateAction<CampaignFormData>>,
  onGenerateAdCopy: () => void,
  aiLoading: boolean
}) {
  const [videoError, setVideoError] = useState<string>('')
  const primaryPlatform = formData.platforms[0] || 'meta'
  const limits = CHAR_LIMITS[primaryPlatform] || CHAR_LIMITS.meta

  const cls = "w-full px-3 py-2 bg-[#2A2A3A] border border-[#3A3A4A] rounded-lg text-white placeholder-[#6B7280] focus:outline-none focus:border-[#7C3AED]"
  const lbl = "block text-sm font-medium text-[#6B7280] mb-1"

  const headlines: string[] = formData.creative.headlines.length >= 3
    ? formData.creative.headlines
    : ['', '', '']
  const descriptions: string[] = formData.creative.descriptions.length >= 2
    ? formData.creative.descriptions
    : ['', '']

  const setHeadline = (idx: number, val: string) => {
    const next = [...headlines]
    next[idx] = val
    setFormData(prev => ({ ...prev, creative: { ...prev.creative, headlines: next } }))
  }
  const setDescription = (idx: number, val: string) => {
    const next = [...descriptions]
    next[idx] = val
    setFormData(prev => ({ ...prev, creative: { ...prev.creative, descriptions: next } }))
  }

  // Aspect ratio validation per platform
  const ASPECT_RATIOS: Record<string, { w: number; h: number; label: string }> = {
    meta:     { w: 4, h: 5, label: '4:5 (vertical)' },
    google:   { w: 1, h: 1, label: '1:1 (square)' },
    yandex:   { w: 3, h: 2, label: '3:2 (landscape)' },
    telegram: { w: 1, h: 1, label: '1:1 (square)' },
  }
  const expectedRatio = ASPECT_RATIOS[primaryPlatform] || ASPECT_RATIOS.meta

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoError('')
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.src = url
    video.onloadedmetadata = () => {
      const w = video.videoWidth
      const h = video.videoHeight
      URL.revokeObjectURL(url)
      const ratio = w / h
      const expected = expectedRatio.w / expectedRatio.h
      const diff = Math.abs(ratio - expected) / expected
      if (diff > 0.1) {
        setVideoError(`Video aspect ratio ${w}:${h} does not match required ${expectedRatio.label} for ${primaryPlatform}`)
      } else {
        setVideoError('')
        // store file name as placeholder (File objects can't be in plain state easily)
        setFormData(prev => ({ ...prev, creative: { ...prev.creative, images: [...prev.creative.images, file] } }))
      }
    }
  }

  const CTA_OPTIONS = ['Learn More', 'Shop Now', 'Sign Up', 'Get Quote', 'Download', 'Contact Us', 'Book Now', 'Subscribe']

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Creative Assets</h2>
          {formData.platforms.length > 0 && (
            <p className="text-xs text-[#6B7280] mt-1">
              Char limits for <span className="text-[#7C3AED] capitalize">{primaryPlatform}</span>:
              headline {limits.headline}, description {limits.description}
            </p>
          )}
        </div>
        <Button variant="secondary" size="sm" onClick={onGenerateAdCopy} disabled={aiLoading}>
          {aiLoading ? '✨ Generating...' : '✨ AI Generate All'}
        </Button>
      </div>

      {/* Primary Text (Meta only) */}
      {primaryPlatform === 'meta' && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={lbl} style={{ marginBottom: 0 }}>Primary Text</label>
            <CharCounter value={formData.creative.primaryText} max={125} />
          </div>
          <textarea rows={3} placeholder="Main ad body text..."
            value={formData.creative.primaryText}
            onChange={e => setFormData(prev => ({ ...prev, creative: { ...prev.creative, primaryText: e.target.value } }))}
            className={`${cls} resize-none`} />
        </div>
      )}

      {/* Headlines */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Headlines</h3>
        {headlines.slice(0, 3).map((h, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <label className={lbl} style={{ marginBottom: 0 }}>Headline {i + 1}{i === 0 ? ' *' : ''}</label>
              <CharCounter value={h} max={limits.headline} />
            </div>
            <input type="text" placeholder={`Headline ${i + 1} (max ${limits.headline} chars)`}
              value={h}
              onChange={e => setHeadline(i, e.target.value)}
              className={`${cls} ${h.length > limits.headline ? 'border-red-500/60' : ''}`} />
          </div>
        ))}
      </div>

      {/* Descriptions */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Descriptions</h3>
        {descriptions.slice(0, 2).map((d, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <label className={lbl} style={{ marginBottom: 0 }}>Description {i + 1}{i === 0 ? ' *' : ''}</label>
              <CharCounter value={d} max={limits.description} />
            </div>
            <textarea rows={2} placeholder={`Description ${i + 1} (max ${limits.description} chars)`}
              value={d}
              onChange={e => setDescription(i, e.target.value)}
              className={`${cls} resize-none ${d.length > limits.description ? 'border-red-500/60' : ''}`} />
          </div>
        ))}
      </div>

      {/* Media Upload */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Media Assets</h3>
        <p className="text-xs text-[#6B7280]">
          Required aspect ratio for <span className="text-[#7C3AED] capitalize">{primaryPlatform}</span>: {expectedRatio.label}
        </p>

        {/* Image upload */}
        <div className="border-2 border-dashed border-[#3A3A4A] hover:border-[#7C3AED]/40 rounded-lg p-6 text-center transition-colors">
          <input type="file" multiple accept="image/*" className="hidden" id="image-upload"
            onChange={e => {
              const files = Array.from(e.target.files || [])
              setFormData(prev => ({ ...prev, creative: { ...prev.creative, images: [...prev.creative.images, ...files] } }))
            }} />
          <label htmlFor="image-upload" className="cursor-pointer block">
            <div className="text-3xl mb-2">🖼️</div>
            <div className="text-white text-sm font-medium mb-1">Upload Images</div>
            <div className="text-xs text-[#4B5563]">JPG, PNG · max 30 MB each</div>
          </label>
        </div>

        {/* Video upload */}
        <div className="border-2 border-dashed border-[#3A3A4A] hover:border-[#7C3AED]/40 rounded-lg p-6 text-center transition-colors">
          <input type="file" accept="video/*" className="hidden" id="video-upload"
            onChange={handleVideoUpload} />
          <label htmlFor="video-upload" className="cursor-pointer block">
            <div className="text-3xl mb-2">🎬</div>
            <div className="text-white text-sm font-medium mb-1">Upload Video</div>
            <div className="text-xs text-[#4B5563]">MP4, MOV · {expectedRatio.label} required</div>
          </label>
        </div>

        {videoError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
            ⚠️ {videoError}
          </div>
        )}

        {/* Uploaded media list */}
        {formData.creative.images.length > 0 && (
          <div className="space-y-2">
            {formData.creative.images.map((file, i) => (
              <div key={i} className="flex items-center justify-between bg-[#2A2A3A] rounded-lg px-3 py-2">
                <span className="text-white text-sm truncate">{(file as File).name}</span>
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, creative: { ...prev.creative, images: prev.creative.images.filter((_, j) => j !== i) } }))}
                  className="text-[#6B7280] hover:text-red-400 ml-2 shrink-0">×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div>
        <label className={lbl}>Call to Action</label>
        <select value={formData.creative.cta}
          onChange={e => setFormData(prev => ({ ...prev, creative: { ...prev.creative, cta: e.target.value } }))}
          className={cls}>
          {CTA_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>

      {/* A/B Testing */}
      <div className="bg-[#13131A] border border-[#2A2A3A] rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">A/B Testing</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">Test multiple creative variants automatically</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formData.creative.testing.enabled}
              onChange={e => setFormData(prev => ({ ...prev, creative: { ...prev.creative, testing: { ...prev.creative.testing, enabled: e.target.checked } } }))}
              className="w-4 h-4 accent-[#7C3AED]" />
            <span className="text-white text-sm">Enable</span>
          </label>
        </div>
        {formData.creative.testing.enabled && (
          <div>
            <label className={lbl}>Number of variants: {formData.creative.testing.variants}</label>
            <input type="range" min={2} max={5} value={formData.creative.testing.variants}
              onChange={e => setFormData(prev => ({ ...prev, creative: { ...prev.creative, testing: { ...prev.creative.testing, variants: Number(e.target.value) } } }))}
              className="w-full accent-[#7C3AED]" />
            <div className="flex justify-between text-xs text-[#4B5563] mt-1">
              <span>2</span><span>3</span><span>4</span><span>5</span>
            </div>
            <p className="text-xs text-[#6B7280] mt-2">
              AI will create {formData.creative.testing.variants} variants and allocate budget to the best performer after 48h.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function MetaFeedPreview({ formData }: { formData: CampaignFormData }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-[#7C3AED] rounded-full flex items-center justify-center text-white font-bold text-sm">N</div>
          <div>
            <div className="text-black text-sm font-semibold">{formData.name || 'Your Business'}</div>
            <div className="text-[#65676B] text-xs">Sponsored · 🌐</div>
          </div>
        </div>
        <span className="text-[#65676B] text-xl">···</span>
      </div>
      {/* Text */}
      <div className="px-4 pb-3">
        <p className="text-black text-sm">{formData.creative.primaryText || 'Your primary text goes here...'}</p>
      </div>
      {/* Image placeholder */}
      <div className="bg-gradient-to-br from-[#7C3AED]/30 to-[#1877F2]/20 h-64 flex items-center justify-center">
        <span className="text-4xl">🖼️</span>
      </div>
      {/* Link card */}
      <div className="bg-[#F0F2F5] px-4 py-3 flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-[#65676B] text-xs uppercase tracking-wide">yoursite.com</div>
          <div className="text-black text-sm font-semibold truncate">{formData.creative.headlines[0] || 'Your headline here'}</div>
          <div className="text-[#65676B] text-xs truncate">{formData.creative.descriptions[0] || 'Description...'}</div>
        </div>
        <button className="ml-3 shrink-0 bg-[#E4E6EA] text-black text-sm font-semibold px-4 py-2 rounded-lg whitespace-nowrap">
          {formData.creative.cta || 'Learn More'}
        </button>
      </div>
      {/* Reactions */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-[#E4E6EA]">
        <div className="flex gap-4 text-[#65676B] text-sm">
          <span>👍 Like</span>
          <span>💬 Comment</span>
          <span>↗ Share</span>
        </div>
      </div>
    </div>
  )
}

function MetaStoriesPreview({ formData }: { formData: CampaignFormData }) {
  return (
    <div className="relative bg-black rounded-2xl overflow-hidden max-w-[240px] mx-auto" style={{ aspectRatio: '9/16' }}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/50 to-[#1877F2]/30 flex items-center justify-center">
        <span className="text-6xl">🖼️</span>
      </div>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 px-3 pt-3 z-10">
        <div className="flex gap-1 mb-2">
          <div className="flex-1 h-0.5 bg-white rounded-full" />
          <div className="flex-1 h-0.5 bg-white/40 rounded-full" />
          <div className="flex-1 h-0.5 bg-white/40 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#7C3AED] rounded-full flex items-center justify-center text-white text-xs font-bold">N</div>
          <div>
            <div className="text-white text-xs font-semibold">{formData.name || 'Your Business'}</div>
            <div className="text-white/70 text-xs">Sponsored</div>
          </div>
        </div>
      </div>
      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pt-8 pb-4 z-10">
        <p className="text-white text-sm font-semibold mb-1">{formData.creative.headlines[0] || 'Your headline'}</p>
        <p className="text-white/80 text-xs mb-3">{formData.creative.descriptions[0] || 'Tap to learn more'}</p>
        {/* Swipe up CTA */}
        <div className="flex flex-col items-center text-white/90 text-xs">
          <span className="text-lg">↑</span>
          <span>{formData.creative.cta || 'Learn More'}</span>
        </div>
      </div>
    </div>
  )
}

function Step5Preview({ formData }: { formData: CampaignFormData }) {
  const [previewTab, setPreviewTab] = useState<Record<string, string>>({})
  const getTab = (platform: string) => previewTab[platform] || 'feed'
  const setTab = (platform: string, tab: string) =>
    setPreviewTab(prev => ({ ...prev, [platform]: tab }))

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-white">Preview</h2>
        <p className="text-[#6B7280] text-sm mt-1">See how your ad will look on each platform</p>
      </div>

      {/* No platforms selected */}
      {formData.platforms.length === 0 && (
        <div className="text-center py-12 text-[#6B7280]">
          <div className="text-4xl mb-3">📱</div>
          <p>Select platforms in Step 1 to see previews</p>
        </div>
      )}

      {/* Platform Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {formData.platforms.map(platform => (
          <div key={platform}>
            <div className="flex items-center gap-3 mb-3">
              <PlatformIcon platform={platform} size="md" />
              <h3 className="font-semibold text-white capitalize">{platform} Preview</h3>
            </div>

            {/* Meta: Feed / Stories tabs */}
            {platform === 'meta' && (
              <>
                <div className="flex gap-2 mb-4">
                  {['feed', 'stories'].map(tab => (
                    <button key={tab} type="button" onClick={() => setTab(platform, tab)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${getTab(platform) === tab ? 'bg-[#7C3AED] text-white' : 'bg-[#2A2A3A] text-[#6B7280] hover:text-white'}`}>
                      {tab === 'feed' ? '📰 Feed' : '📲 Stories'}
                    </button>
                  ))}
                </div>
                {getTab(platform) === 'feed' ? (
                  <MetaFeedPreview formData={formData} />
                ) : (
                  <MetaStoriesPreview formData={formData} />
                )}
              </>
            )}

            {/* Google Search Preview */}
            {platform === 'google' && (
              <div className="bg-white rounded-xl p-5 shadow-lg max-w-lg mx-auto">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-[#1a73e8] text-white text-xs px-1.5 py-0.5 rounded font-medium">Ad</span>
                  <span className="text-[#202124] text-sm">www.yoursite.com</span>
                </div>
                <div className="text-[#1a0dab] text-xl font-medium hover:underline cursor-pointer mb-1">
                  {formData.creative.headlines.filter(Boolean).join(' | ') || 'Your Headline · Second Part · Third'}
                </div>
                <div className="text-[#4d5156] text-sm">
                  {formData.creative.descriptions[0] || 'Your description goes here. Make it compelling and relevant to your keywords.'}
                </div>
                {formData.extensions.quickLinks.some(Boolean) && (
                  <div className="flex flex-wrap gap-x-4 mt-2">
                    {formData.extensions.quickLinks.filter(Boolean).map((ql, i) => (
                      <span key={i} className="text-[#1a0dab] text-sm hover:underline cursor-pointer">{ql}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Yandex Preview */}
            {platform === 'yandex' && (
              <div className="bg-white rounded-xl p-5 shadow-lg max-w-lg mx-auto border border-[#e5e5e5]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="border border-[#FFCC00] text-[#888] text-xs px-1.5 py-0.5 rounded">Реклама</span>
                  <span className="text-[#888] text-sm">yoursite.com</span>
                </div>
                <div className="text-[#0d0dcc] text-lg font-medium hover:underline cursor-pointer mb-1">
                  {formData.creative.headlines[0] || 'Заголовок объявления'}
                </div>
                <div className="text-[#333] text-sm">
                  {formData.creative.descriptions[0] || 'Текст объявления — опишите ваш продукт или услугу'}
                </div>
                <div className="mt-2 text-xs text-[#888]">
                  {formatCurrency(formData.budget.amount)}/{formData.budget.type}
                </div>
              </div>
            )}

            {/* Telegram Preview */}
            {platform === 'telegram' && (
              <div className="bg-[#17212B] rounded-xl p-1 max-w-sm mx-auto shadow-lg">
                <div className="bg-[#17212B] rounded-lg overflow-hidden">
                  {/* Channel header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-[#0E1621]">
                    <div className="w-10 h-10 bg-[#2CA5E0] rounded-full flex items-center justify-center text-white font-bold">N</div>
                    <div>
                      <div className="text-white text-sm font-semibold">{formData.name || 'Your Channel'}</div>
                      <div className="text-[#6B7280] text-xs">Sponsored</div>
                    </div>
                  </div>
                  {/* Ad card */}
                  <div className="mx-3 my-3 bg-[#202B36] rounded-xl overflow-hidden">
                    <div className="h-40 bg-gradient-to-br from-[#2CA5E0]/30 to-[#7C3AED]/20 flex items-center justify-center">
                      <span className="text-4xl">🖼️</span>
                    </div>
                    <div className="p-3">
                      <div className="text-white font-semibold text-sm mb-1">{formData.creative.headlines[0] || 'Ad headline'}</div>
                      <div className="text-[#8E9BA7] text-xs">{formData.creative.descriptions[0] || 'Ad description text'}</div>
                      <button className="mt-3 w-full bg-[#2CA5E0] text-white rounded-lg py-2 text-sm font-medium">
                        {formData.creative.cta || 'Learn More'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Campaign Summary */}
      <div className="bg-[#13131A] border border-[#2A2A3A] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Campaign Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Platforms', value: formData.platforms.length > 0 ? formData.platforms.map(p => p.toUpperCase()).join(', ') : '—' },
            { label: 'Daily Budget', value: `${formatCurrency(formData.budget.amount)} ${formData.budget.currency}` },
            { label: 'Objective', value: formData.objective ? formData.objective.charAt(0).toUpperCase() + formData.objective.slice(1) : '—' },
            { label: 'Strategy', value: formData.strategy.type.replace(/_/g, ' ') },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#1C1C27] rounded-lg p-3">
              <div className="text-[#6B7280] text-xs mb-1">{label}</div>
              <div className="text-white font-semibold text-sm">{value}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Keywords', value: `${formData.adGroup.keywords.phrases.length} phrases` },
            { label: 'Geo Targets', value: formData.geoTargeting.locations.length > 0 ? formData.geoTargeting.locations.join(', ') : 'All locations' },
            { label: 'A/B Variants', value: formData.creative.testing.enabled ? `${formData.creative.testing.variants} variants` : 'Disabled' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#1C1C27] rounded-lg p-3">
              <div className="text-[#6B7280] text-xs mb-1">{label}</div>
              <div className="text-white text-sm">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const PLATFORM_ICONS: Record<string, string> = {
  meta: '📘', google: '🔍', yandex: '🟡', telegram: '✈️',
}
const PLATFORM_COLORS: Record<string, string> = {
  meta: '#1877F2', google: '#4285F4', yandex: '#FFCC00', telegram: '#2CA5E0',
}

function Step6Publish({ formData, onPublish, loading }: { formData: CampaignFormData, onPublish: () => void, loading: boolean }) {
  const CHECKLIST = [
    { key: 'name',      label: 'Campaign name set',         ok: formData.name.length > 0 },
    { key: 'platform',  label: 'At least one platform',     ok: formData.platforms.length > 0 },
    { key: 'budget',    label: 'Budget configured',         ok: formData.budget.amount > 0 },
    { key: 'headline',  label: 'At least one headline',     ok: (formData.creative.headlines.filter(Boolean).length > 0) },
    { key: 'desc',      label: 'At least one description',  ok: (formData.creative.descriptions.filter(Boolean).length > 0) },
    { key: 'geo',       label: 'Geo targeting set',         ok: formData.geoTargeting.locations.length > 0 },
  ]
  const passCount = CHECKLIST.filter(c => c.ok).length
  const allGood = passCount === CHECKLIST.length

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-white">Ready to Publish</h2>
        <p className="text-[#6B7280] text-sm mt-1">Review your campaign before going live</p>
      </div>

      {/* Checklist */}
      <div className="bg-[#13131A] border border-[#2A2A3A] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Pre-launch checklist</h3>
          <span className={`text-sm font-medium ${allGood ? 'text-green-400' : 'text-yellow-400'}`}>
            {passCount}/{CHECKLIST.length} complete
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CHECKLIST.map(item => (
            <div key={item.key} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${item.ok ? 'bg-green-500/10' : 'bg-[#2A2A3A]'}`}>
              <span className={item.ok ? 'text-green-400' : 'text-[#4B5563]'}>
                {item.ok ? '✓' : '○'}
              </span>
              <span className={`text-sm ${item.ok ? 'text-white' : 'text-[#6B7280]'}`}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Per-platform status cards */}
      <div>
        <h3 className="font-semibold text-white mb-3">Platforms to publish</h3>
        {formData.platforms.length === 0 ? (
          <p className="text-[#6B7280] text-sm">No platforms selected. Go back to Step 1.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {formData.platforms.map(platform => (
              <div key={platform}
                className="flex items-center gap-4 bg-[#13131A] border border-[#2A2A3A] rounded-xl px-4 py-4"
                style={{ borderLeftColor: PLATFORM_COLORS[platform] || '#7C3AED', borderLeftWidth: 3 }}>
                <span className="text-2xl">{PLATFORM_ICONS[platform] || '📣'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold capitalize">{platform}</div>
                  <div className="text-xs text-[#6B7280] mt-0.5">
                    {loading ? 'Submitting...' : 'Ready to publish'}
                  </div>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Budget + Schedule summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Name', value: formData.name || '—' },
          { label: 'Budget', value: `${formatCurrency(formData.budget.amount)} ${formData.budget.currency}/${formData.budget.type}` },
          { label: 'Objective', value: formData.objective ? formData.objective.charAt(0).toUpperCase() + formData.objective.slice(1) : '—' },
          { label: 'Strategy', value: formData.strategy.type.replace(/_/g, ' ') },
          { label: 'Schedule', value: formData.schedule.alwaysOn ? 'Always On' : `${formData.schedule.startDate || '?'} → ${formData.schedule.endDate || '?'}` },
          { label: 'Keywords', value: `${formData.adGroup.keywords.phrases.length} phrases` },
          { label: 'A/B Test', value: formData.creative.testing.enabled ? `${formData.creative.testing.variants} variants` : 'Off' },
          { label: 'Geo', value: formData.geoTargeting.locations.length > 0 ? `${formData.geoTargeting.locations.length} locations` : 'Global' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#13131A] border border-[#2A2A3A] rounded-lg p-3">
            <div className="text-[#6B7280] text-xs mb-1">{label}</div>
            <div className="text-white text-sm font-medium truncate">{value}</div>
          </div>
        ))}
      </div>

      {/* Terms + Publish button */}
      <div className="bg-[#13131A] border border-[#2A2A3A] rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-[#6B7280] text-sm">
          By publishing you confirm this campaign complies with platform policies and our{' '}
          <span className="text-[#7C3AED] cursor-pointer hover:underline">terms of service</span>.
        </div>
        <Button
          onClick={onPublish}
          disabled={loading || formData.platforms.length === 0}
          className="shrink-0 px-8"
        >
          {loading ? '🚀 Publishing...' : '🚀 Publish Campaign'}
        </Button>
      </div>
    </div>
  )
}