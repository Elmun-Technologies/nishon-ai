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
          <Button variant="secondary" onClick={() => {}}>
            Save Draft
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

function Step2CampaignSettings({ formData, setFormData }: { formData: CampaignFormData, setFormData: React.Dispatch<React.SetStateAction<CampaignFormData>> }) {
  return (
    <div className="space-y-8">
      {/* Basic Settings */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Campaign Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-2">
              Campaign Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-[#2A2A3A] border border-[#3A3A4A] rounded-lg text-white placeholder-[#6B7280] focus:outline-none focus:border-[#7C3AED]"
              placeholder="Enter campaign name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-2">
              Objective
            </label>
            <select
              value={formData.objective}
              onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
              className="w-full px-3 py-2 bg-[#2A2A3A] border border-[#3A3A4A] rounded-lg text-white focus:outline-none focus:border-[#7C3AED]"
            >
              {OBJECTIVES.map(obj => (
                <option key={obj.value} value={obj.value}>{obj.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Budget */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-2">
              Budget Amount
            </label>
            <input
              type="number"
              value={formData.budget.amount}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                budget: { ...prev.budget, amount: Number(e.target.value) } 
              }))}
              className="w-full px-3 py-2 bg-[#2A2A3A] border border-[#3A3A4A] rounded-lg text-white focus:outline-none focus:border-[#7C3AED]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-2">
              Currency
            </label>
            <select
              value={formData.budget.currency}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                budget: { ...prev.budget, currency: e.target.value } 
              }))}
              className="w-full px-3 py-2 bg-[#2A2A3A] border border-[#3A3A4A] rounded-lg text-white focus:outline-none focus:border-[#7C3AED]"
            >
              {CURRENCIES.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-2">
              Budget Type
            </label>
            <select
              value={formData.budget.type}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                budget: { ...prev.budget, type: e.target.value as 'daily' | 'weekly' } 
              }))}
              className="w-full px-3 py-2 bg-[#2A2A3A] border border-[#3A3A4A] rounded-lg text-white focus:outline-none focus:border-[#7C3AED]"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={formData.schedule.startDate}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                schedule: { ...prev.schedule, startDate: e.target.value } 
              }))}
              className="w-full px-3 py-2 bg-[#2A2A3A] border border-[#3A3A4A] rounded-lg text-white focus:outline-none focus:border-[#7C3AED]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-2">
              End Date
            </label>
            <input
              type="date"
              value={formData.schedule.endDate}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                schedule: { ...prev.schedule, endDate: e.target.value } 
              }))}
              className="w-full px-3 py-2 bg-[#2A2A3A] border border-[#3A3A4A] rounded-lg text-white focus:outline-none focus:border-[#7C3AED]"
            />
          </div>
        </div>
      </div>

      {/* UTM Parameters */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">UTM Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="utm_source"
            value={formData.utm.source}
            onChange={(e) => setFormData(prev => ({ ...prev, utm: { ...prev.utm, source: e.target.value } }))}
            className="px-3 py-2 bg-[#2A2A3A] border border-[#3A3A4A] rounded-lg text-white placeholder-[#6B7280] focus:outline-none focus:border-[#7C3AED]"
          />
          <input
            type="text"
            placeholder="utm_medium"
            value={formData.utm.medium}
            onChange={(e) => setFormData(prev => ({ ...prev, utm: { ...prev.utm, medium: e.target.value } }))}
            className="px-3 py-2 bg-[#2A2A3A] border border-[#3A3A4A] rounded-lg text-white placeholder-[#6B7280] focus:outline-none focus:border-[#7C3AED]"
          />
          <input
            type="text"
            placeholder="utm_campaign"
            value={formData.utm.campaign}
            onChange={(e) => setFormData(prev => ({ ...prev, utm: { ...prev.utm, campaign: e.target.value } }))}
            className="px-3 py-2 bg-[#2A2A3A] border border-[#3A3A4A] rounded-lg text-white placeholder-[#6B7280] focus:outline-none focus:border-[#7C3AED]"
          />
          <input
            type="text"
            placeholder="utm_content"
            value={formData.utm.content}
            onChange={(e) => setFormData(prev => ({ ...prev, utm: { ...prev.utm, content: e.target.value } }))}
            className="px-3 py-2 bg-[#2A2A3A] border border-[#3A3A4A] rounded-lg text-white placeholder-[#6B7280] focus:outline-none focus:border-[#7C3AED]"
          />
        </div>
      </div>

      {/* AI Optimization */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">AI Optimization</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.aiOptimization.autoReplaceCreatives}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                aiOptimization: { ...prev.aiOptimization, autoReplaceCreatives: e.target.checked } 
              }))}
              className="w-4 h-4 text-[#7C3AED] bg-[#2A2A3A] border-[#3A3A4A] rounded focus:ring-[#7C3AED]"
            />
            <span className="text-white">Automatically replace underperforming creatives</span>
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.aiOptimization.optimizeAudience}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                aiOptimization: { ...prev.aiOptimization, optimizeAudience: e.target.checked } 
              }))}
              className="w-4 h-4 text-[#7C3AED] bg-[#2A2A3A] border-[#3A3A4A] rounded focus:ring-[#7C3AED]"
            />
            <span className="text-white">Optimize audience targeting automatically</span>
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.aiOptimization.weeklyBudgetOptimization}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                aiOptimization: { ...prev.aiOptimization, weeklyBudgetOptimization: e.target.checked } 
              }))}
              className="w-4 h-4 text-[#7C3AED] bg-[#2A2A3A] border-[#3A3A4A] rounded focus:ring-[#7C3AED]"
            />
            <span className="text-white">Weekly budget optimization</span>
          </label>
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
  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-white">Ad Group Settings</h2>
      
      {/* Basic Ad Group */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#6B7280] mb-2">
            Ad Group Name
          </label>
          <input
            type="text"
            value={formData.adGroup.name}
            onChange={(e) => setFormData(prev => ({ ...prev, adGroup: { ...prev.adGroup, name: e.target.value } }))}
            className="w-full px-3 py-2 bg-[#2A2A3A] border border-[#3A3A4A] rounded-lg text-white placeholder-[#6B7280] focus:outline-none focus:border-[#7C3AED]"
            placeholder="Enter ad group name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[#6B7280] mb-2">
            Scenario
          </label>
          <select
            value={formData.adGroup.scenario}
            onChange={(e) => setFormData(prev => ({ ...prev, adGroup: { ...prev.adGroup, scenario: e.target.value as 'all' | 'new' } }))}
            className="w-full px-3 py-2 bg-[#2A2A3A] border border-[#3A3A4A] rounded-lg text-white focus:outline-none focus:border-[#7C3AED]"
          >
            <option value="all">All interested audience</option>
            <option value="new">New audience</option>
          </select>
        </div>
      </div>

      {/* Auto Targeting */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Auto Targeting (AI-based)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={formData.adGroup.autoTargeting.queries} onChange={() => {}} className="w-4 h-4" />
            <span className="text-white">Target queries</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={formData.adGroup.autoTargeting.narrowQueries} onChange={() => {}} className="w-4 h-4" />
            <span className="text-white">Narrow queries</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={formData.adGroup.autoTargeting.broadQueries} onChange={() => {}} className="w-4 h-4" />
            <span className="text-white">Broad queries</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={formData.adGroup.autoTargeting.additionalQueries} onChange={() => {}} className="w-4 h-4" />
            <span className="text-white">Additional queries</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={formData.adGroup.autoTargeting.alternativeQueries} onChange={() => {}} className="w-4 h-4" />
            <span className="text-white">Alternative queries</span>
          </label>
        </div>
      </div>

      {/* Keywords */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Keywords</h3>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Add keyword phrases..."
            className="w-full px-3 py-2 bg-[#2A2A3A] border border-[#3A3A4A] rounded-lg text-white placeholder-[#6B7280] focus:outline-none focus:border-[#7C3AED]"
          />
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={onGenerateKeywords}
              disabled={aiLoading}
            >
              {aiLoading ? 'Generating...' : 'AI Generate Keywords'}
            </Button>
            <Button variant="secondary" size="sm">Add from List</Button>
          </div>
        </div>
      </div>

      {/* Audience Targeting */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Audience Targeting</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={formData.adGroup.audiences.buyers} onChange={() => {}} className="w-4 h-4" />
            <span className="text-white">Buyers (at least 1 purchase)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={formData.adGroup.audiences.frequentBuyers} onChange={() => {}} className="w-4 h-4" />
            <span className="text-white">Frequent buyers</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={formData.adGroup.audiences.lookalike} onChange={() => {}} className="w-4 h-4" />
            <span className="text-white">Lookalike audiences</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={formData.adGroup.audiences.abandonedCart} onChange={() => {}} className="w-4 h-4" />
            <span className="text-white">Abandoned cart users</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={formData.adGroup.audiences.viewedNotBought} onChange={() => {}} className="w-4 h-4" />
            <span className="text-white">Viewed but didn't buy</span>
          </label>
        </div>
      </div>
    </div>
  )
}

function Step4Creative({ formData, setFormData, onGenerateAdCopy, aiLoading }: { 
  formData: CampaignFormData, 
  setFormData: React.Dispatch<React.SetStateAction<CampaignFormData>>,
  onGenerateAdCopy: () => void,
  aiLoading: boolean
}) {
  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-white">Creative Assets</h2>
      
      {/* Headlines */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Headlines</h3>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={onGenerateAdCopy}
            disabled={aiLoading}
          >
            {aiLoading ? 'Generating...' : 'AI Generate'}
          </Button>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <input
              key={i}
              type="text"
              placeholder={`Headline ${i} (max 30 characters)`}
              className="w-full px-3 py-2 bg-[#2A2A3A] border border-[#3A3A4A] rounded-lg text-white placeholder-[#6B7280] focus:outline-none focus:border-[#7C3AED]"
            />
          ))}
        </div>
      </div>

      {/* Descriptions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Descriptions</h3>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={onGenerateAdCopy}
            disabled={aiLoading}
          >
            {aiLoading ? 'Generating...' : 'AI Generate'}
          </Button>
        </div>
        <div className="space-y-2">
          {[1, 2].map(i => (
            <input
              key={i}
              type="text"
              placeholder={`Description ${i} (max 90 characters)`}
              className="w-full px-3 py-2 bg-[#2A2A3A] border border-[#3A3A4A] rounded-lg text-white placeholder-[#6B7280] focus:outline-none focus:border-[#7C3AED]"
            />
          ))}
        </div>
      </div>

      {/* Images/Videos */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Media Assets</h3>
        <div className="border-2 border-dashed border-[#3A3A4A] rounded-lg p-8 text-center">
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            id="media-upload"
          />
          <label htmlFor="media-upload" className="cursor-pointer">
            <div className="text-[#6B7280] mb-2">Upload images and videos</div>
            <div className="text-sm text-[#4B5563]">Supports JPG, PNG, MP4 formats</div>
          </label>
        </div>
      </div>

      {/* CTA */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Call to Action</h3>
        <select className="w-full px-3 py-2 bg-[#2A2A3A] border border-[#3A3A4A] rounded-lg text-white focus:outline-none focus:border-[#7C3AED]">
          <option>Learn More</option>
          <option>Shop Now</option>
          <option>Sign Up</option>
          <option>Get Quote</option>
          <option>Download</option>
        </select>
      </div>

      {/* A/B Testing */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">A/B Testing</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <span className="text-white">Enable creative testing</span>
          </label>
        </div>
        <div className="text-[#6B7280] text-sm">
          Test up to 5 different creative variations to find the best performing ones
        </div>
      </div>
    </div>
  )
}

function Step5Preview({ formData }: { formData: CampaignFormData }) {
  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-white">Preview</h2>
      
      {/* Platform Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {formData.platforms.map(platform => (
          <Card key={platform} padding="lg">
            <div className="flex items-center gap-3 mb-4">
              <PlatformIcon platform={platform} size="md" />
              <h3 className="font-semibold text-white">{platform.toUpperCase()} Preview</h3>
            </div>
            
            {/* Meta Preview */}
            {platform === 'meta' && (
              <div className="space-y-4">
                <div className="bg-[#1F2937] p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[#7C3AED] rounded-full flex items-center justify-center text-white font-bold">
                      N
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                        <span>Your Business</span>
                        <span>•</span>
                        <span>Sponsored</span>
                      </div>
                      <h4 className="font-semibold text-white mt-1">{formData.name}</h4>
                    </div>
                  </div>
                  <p className="text-[#9CA3AF] mt-3 text-sm">
                    {formData.creative.primaryText || 'Your primary text goes here...'}
                  </p>
                  <div className="mt-3 p-3 bg-[#0B0B0F] rounded border border-[#2A2A3A]">
                    <div className="text-xs text-[#6B7280] mb-1">Headline</div>
                    <div className="text-white font-semibold">
                      {formData.creative.headlines[0] || 'Your headline here...'}
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-[#0B0B0F] rounded border border-[#2A2A3A]">
                    <div className="text-xs text-[#6B7280] mb-1">Description</div>
                    <div className="text-white">
                      {formData.creative.descriptions[0] || 'Your description here...'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#2A2A3A]">
                    <span className="text-[#6B7280] text-sm">Learn More</span>
                    <span className="text-[#6B7280] text-xs">www.yoursite.com</span>
                  </div>
                </div>
              </div>
            )}

            {/* Google Preview */}
            {platform === 'google' && (
              <div className="space-y-4">
                <div className="bg-[#1F2937] p-4 rounded-lg">
                  <div className="text-xs text-[#6B7280] mb-1">www.yoursite.com</div>
                  <h4 className="font-semibold text-[#4285F4] text-lg mb-2">
                    {formData.creative.headlines[0] || 'Your headline here...'}
                  </h4>
                  <p className="text-[#9CA3AF]">
                    {formData.creative.descriptions[0] || 'Your description here...'}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-[#6B7280]">
                    <span>• Sponsored</span>
                    <span>• {formData.budget.currency} {formData.budget.amount}/{formData.budget.type}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Yandex Preview */}
            {platform === 'yandex' && (
              <div className="space-y-4">
                <div className="bg-[#1F2937] p-4 rounded-lg border border-yellow-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Sponsored</span>
                    <span className="text-xs text-[#6B7280]">{formData.budget.currency} {formData.budget.amount}/{formData.budget.type}</span>
                  </div>
                  <h4 className="font-semibold text-white text-lg mb-2">
                    {formData.creative.headlines[0] || 'Your headline here...'}
                  </h4>
                  <p className="text-[#9CA3AF]">
                    {formData.creative.descriptions[0] || 'Your description here...'}
                  </p>
                  <div className="mt-3 text-xs text-[#6B7280]">www.yoursite.com</div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">Campaign Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-[#6B7280] text-sm">Platforms</div>
            <div className="text-white font-semibold">{formData.platforms.length} selected</div>
          </div>
          <div>
            <div className="text-[#6B7280] text-sm">Daily Budget</div>
            <div className="text-white font-semibold">{formatCurrency(formData.budget.amount)}</div>
          </div>
          <div>
            <div className="text-[#6B7280] text-sm">Objective</div>
            <div className="text-white font-semibold capitalize">{formData.objective}</div>
          </div>
          <div>
            <div className="text-[#6B7280] text-sm">Ad Groups</div>
            <div className="text-white font-semibold">1</div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function Step6Publish({ formData, onPublish, loading }: { formData: CampaignFormData, onPublish: () => void, loading: boolean }) {
  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-white">Ready to Publish</h2>
      
      <Card padding="lg">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#7C3AED]/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🚀</span>
            </div>
            <div>
              <h3 className="font-semibold text-white">Campaign Review</h3>
              <p className="text-[#6B7280] text-sm">Your campaign is ready to go live</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#2A2A3A] p-4 rounded-lg">
              <div className="text-[#6B7280] text-sm mb-1">Platforms</div>
              <div className="text-white font-semibold">
                {formData.platforms.map(p => p.toUpperCase()).join(', ')}
              </div>
            </div>
            <div className="bg-[#2A2A3A] p-4 rounded-lg">
              <div className="text-[#6B7280] text-sm mb-1">Budget</div>
              <div className="text-white font-semibold">
                {formatCurrency(formData.budget.amount)}/{formData.budget.type}
              </div>
            </div>
            <div className="bg-[#2A2A3A] p-4 rounded-lg">
              <div className="text-[#6B7280] text-sm mb-1">Objective</div>
              <div className="text-white font-semibold capitalize">{formData.objective}</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#2A2A3A]">
            <div className="text-[#6B7280]">
              By publishing, you agree to our terms and conditions
            </div>
            <Button onClick={onPublish} disabled={loading} className="px-8">
              {loading ? 'Publishing...' : 'Publish Campaign'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}