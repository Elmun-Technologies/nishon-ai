'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Switch } from '@/components/ui/Switch'
import { Label } from '@/components/ui/Label'
import { Checkbox } from '@/components/ui/Checkbox'
import { Accordion } from '@/components/ui/Accordion'
import { useAiAgent } from '@/hooks/useAiAgent'

interface CampaignSettingsProps {
  formData: any
  onFormDataChange: (field: string, value: any) => void
  onGenerateUTM: () => void
  aiLoading: boolean
}

const OBJECTIVES = [
  { value: 'leads', label: 'Leads', icon: '📈' },
  { value: 'traffic', label: 'Traffic', icon: '🚗' },
  { value: 'sales', label: 'Sales', icon: '💰' },
  { value: 'awareness', label: 'Awareness', icon: '👁️' },
]

const CURRENCIES = ['UZS', 'USD', 'EUR', 'RUB']

const BIDDING_STRATEGIES: Record<string, { value: string; label: string }[]> = {
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
    { value: 'cpm', label: 'CPM (Cost per 1000 views)' },
    { value: 'cpc', label: 'CPC (Cost per Click)' },
  ],
}

const AD_PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const HOURS_24 = Array.from({ length: 24 }, (_, i) => i)
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function CampaignSettings({
  formData,
  onFormDataChange,
  onGenerateUTM,
  aiLoading,
}: CampaignSettingsProps) {
  const { generateKeywords } = useAiAgent()
  const [activeExtensions, setActiveExtensions] = useState<string[]>([
    ...(formData.extensions?.quickLinks?.length ? ['quickLinks'] : []),
    ...(formData.extensions?.clarifiers?.length ? ['clarifiers'] : []),
    ...(formData.extensions?.promoCode ? ['promoCode'] : []),
    ...(formData.extensions?.delivery ? ['delivery'] : []),
  ])

  // Detect primary platform for bidding strategy options
  const primaryPlatform = formData.platforms?.[0] || 'meta'
  const biddingOptions =
    BIDDING_STRATEGIES[primaryPlatform] || BIDDING_STRATEGIES.meta

  const handleExtensionToggle = (extension: string) => {
    setActiveExtensions((prev) =>
      prev.includes(extension) ? prev.filter((e) => e !== extension) : [...prev, extension]
    )
  }

  const handleBidAdjustment = (category: string, value: any) => {
    onFormDataChange('bidAdjustments', {
      ...formData.bidAdjustments,
      [category]: value,
    })
  }

  // Hour-grid helpers
  const selectedHours: string[] = formData.schedule?.hours || []
  const toggleHour = (hour: string) => {
    const current: string[] = formData.schedule?.hours || []
    const next = current.includes(hour)
      ? current.filter((h: string) => h !== hour)
      : [...current, hour]
    onFormDataChange('schedule', { ...formData.schedule, hours: next })
  }
  const toggleAllHours = () => {
    const allHours = HOURS_24.map(String)
    const allSelected = allHours.every((h) => selectedHours.includes(h))
    onFormDataChange('schedule', {
      ...formData.schedule,
      hours: allSelected ? [] : allHours,
    })
  }

  // Quick-link helpers
  const quickLinks: string[] = formData.extensions?.quickLinks || []
  const clarifiers: string[] = formData.extensions?.clarifiers || []

  const updateQuickLink = (idx: number, val: string) => {
    const next = [...quickLinks]
    next[idx] = val
    onFormDataChange('extensions', { ...formData.extensions, quickLinks: next })
  }
  const updateClarifier = (idx: number, val: string) => {
    const next = [...clarifiers]
    next[idx] = val
    onFormDataChange('extensions', { ...formData.extensions, clarifiers: next })
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-white">Campaign Settings</h2>

      {/* ── Basic Information ── */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="campaignName">Campaign Name</Label>
            <Input
              id="campaignName"
              value={formData.name}
              onChange={(e) => onFormDataChange('name', e.target.value)}
              placeholder="Enter campaign name"
            />
          </div>

          <div>
            <Label htmlFor="objective">Objective</Label>
            <Select
              id="objective"
              value={formData.objective}
              onChange={(e) => onFormDataChange('objective', e.target.value)}
            >
              {OBJECTIVES.map((obj) => (
                <option key={obj.value} value={obj.value}>
                  {obj.icon} {obj.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <Label htmlFor="budgetAmount">Budget Amount</Label>
            <Input
              id="budgetAmount"
              type="number"
              value={formData.budget.amount}
              onChange={(e) =>
                onFormDataChange('budget', { ...formData.budget, amount: Number(e.target.value) })
              }
            />
          </div>

          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select
              id="currency"
              value={formData.budget.currency}
              onChange={(e) =>
                onFormDataChange('budget', { ...formData.budget, currency: e.target.value })
              }
            >
              {CURRENCIES.map((curr) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="budgetType">Budget Type</Label>
            <Select
              id="budgetType"
              value={formData.budget.type}
              onChange={(e) =>
                onFormDataChange('budget', { ...formData.budget, type: e.target.value })
              }
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </Select>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.schedule.startDate}
              onChange={(e) =>
                onFormDataChange('schedule', { ...formData.schedule, startDate: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              disabled={formData.schedule.alwaysOn}
              value={formData.schedule.endDate}
              onChange={(e) =>
                onFormDataChange('schedule', { ...formData.schedule, endDate: e.target.value })
              }
            />
          </div>
        </div>

        {/* Always On + hour grid */}
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <Switch
              id="alwaysOn"
              checked={formData.schedule.alwaysOn}
              onChange={(checked) =>
                onFormDataChange('schedule', {
                  ...formData.schedule,
                  alwaysOn: checked,
                  hours: checked ? [] : formData.schedule.hours,
                })
              }
            />
            <Label htmlFor="alwaysOn">Show ad always (24/7)</Label>
          </div>

          {!formData.schedule.alwaysOn && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Ad Show Hours</Label>
                <button
                  type="button"
                  onClick={toggleAllHours}
                  className="text-xs text-[#7C3AED] hover:underline"
                >
                  {HOURS_24.every((h) => selectedHours.includes(String(h)))
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-8 sm:grid-cols-12 gap-1">
                {HOURS_24.map((h) => {
                  const key = String(h)
                  const active = selectedHours.includes(key)
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => toggleHour(key)}
                      className={`py-1 rounded text-xs font-mono transition-colors ${
                        active
                          ? 'bg-[#7C3AED] text-white'
                          : 'bg-[#2A2A3A] text-[#9CA3AF] hover:bg-[#3A3A4A]'
                      }`}
                    >
                      {String(h).padStart(2, '0')}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-[#6B7280] mt-1">
                {selectedHours.length === 0
                  ? 'No hours selected — ad will not show'
                  : `${selectedHours.length} hours selected`}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* ── Strategy & Bidding ── */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-1">Strategy & Bidding</h3>
        {formData.platforms?.length > 0 && (
          <p className="text-xs text-[#6B7280] mb-4">
            Showing strategies for{' '}
            <span className="text-[#7C3AED] capitalize">{primaryPlatform}</span>
            {formData.platforms.length > 1 && ` (+${formData.platforms.length - 1} more)`}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="biddingStrategy">Bidding Strategy</Label>
            <Select
              id="biddingStrategy"
              value={formData.strategy.type}
              onChange={(e) =>
                onFormDataChange('strategy', { ...formData.strategy, type: e.target.value })
              }
            >
              {biddingOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="bidCap">
              {primaryPlatform === 'yandex' ? 'Max CPC (bid cap)' : 'Bid Cap'}
            </Label>
            <Input
              id="bidCap"
              type="number"
              value={formData.strategy.bidCap || ''}
              onChange={(e) =>
                onFormDataChange('strategy', {
                  ...formData.strategy,
                  bidCap: Number(e.target.value),
                })
              }
              placeholder="Optional bid cap"
            />
          </div>
        </div>

        {/* Platform-specific extras */}
        {(primaryPlatform === 'meta' || !formData.platforms?.length) && (
          <div className="flex items-center gap-2 mt-4">
            <Switch
              id="advantagePlus"
              checked={formData.strategy.advantagePlus}
              onChange={(checked) =>
                onFormDataChange('strategy', { ...formData.strategy, advantagePlus: checked })
              }
            />
            <Label htmlFor="advantagePlus">Advantage+ Campaign Budget (Meta)</Label>
          </div>
        )}

        {primaryPlatform === 'google' && (
          <div className="mt-4">
            <Label htmlFor="targetCpa">
              {formData.strategy.type === 'target_cpa' ? 'Target CPA' : 'Target ROAS (%)'}
            </Label>
            <Input
              id="targetCpa"
              type="number"
              value={formData.strategy.targetValue || ''}
              onChange={(e) =>
                onFormDataChange('strategy', {
                  ...formData.strategy,
                  targetValue: Number(e.target.value),
                })
              }
              placeholder={formData.strategy.type === 'target_roas' ? 'e.g. 400 = 400%' : 'e.g. 5.00'}
            />
          </div>
        )}

        {/* Ad Priority (Step 2i) */}
        <div className="mt-4">
          <Label htmlFor="adPriority">Ad Priority</Label>
          <Select
            id="adPriority"
            value={formData.strategy.adPriority || 'medium'}
            onChange={(e) =>
              onFormDataChange('strategy', { ...formData.strategy, adPriority: e.target.value })
            }
          >
            {AD_PRIORITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
          <p className="text-xs text-[#6B7280] mt-1">
            Higher priority campaigns win auctions against same-account campaigns with lower priority.
          </p>
        </div>
      </Card>

      {/* ── UTM Parameters ── */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">UTM Parameters</h3>
          <Button variant="secondary" size="sm" onClick={onGenerateUTM} disabled={aiLoading}>
            {aiLoading ? 'Generating...' : 'AI Generate UTM'}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['source', 'medium', 'campaign', 'content', 'term'] as const).map((field) => (
            <Input
              key={field}
              placeholder={`utm_${field}`}
              value={formData.utm[field]}
              onChange={(e) => onFormDataChange('utm', { ...formData.utm, [field]: e.target.value })}
            />
          ))}
        </div>
        <p className="text-xs text-[#6B7280] mt-2">
          Dynamic params: {'{keyword}'}, {'{campaign_id}'}, {'{placement}'}
        </p>
      </Card>

      {/* ── Ad Extensions ── */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">Ad Extensions</h3>
        <div className="space-y-4">
          {/* Quick Links */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Checkbox
                id="quickLinks"
                checked={activeExtensions.includes('quickLinks')}
                onChange={() => handleExtensionToggle('quickLinks')}
              />
              <Label htmlFor="quickLinks">Quick Links (Sitelinks)</Label>
            </div>
            {activeExtensions.includes('quickLinks') && (
              <div className="ml-7 space-y-2">
                {[0, 1, 2, 3].map((idx) => (
                  <Input
                    key={idx}
                    placeholder={`Quick link ${idx + 1} title`}
                    value={quickLinks[idx] || ''}
                    onChange={(e) => updateQuickLink(idx, e.target.value)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Clarifiers */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Checkbox
                id="clarifiers"
                checked={activeExtensions.includes('clarifiers')}
                onChange={() => handleExtensionToggle('clarifiers')}
              />
              <Label htmlFor="clarifiers">Clarifiers (Callouts)</Label>
            </div>
            {activeExtensions.includes('clarifiers') && (
              <div className="ml-7 space-y-2">
                {[0, 1, 2, 3].map((idx) => (
                  <Input
                    key={idx}
                    placeholder={`Clarifier ${idx + 1} (e.g. Free Shipping)`}
                    value={clarifiers[idx] || ''}
                    onChange={(e) => updateClarifier(idx, e.target.value)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Promo Code */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Checkbox
                id="promoCode"
                checked={activeExtensions.includes('promoCode')}
                onChange={() => handleExtensionToggle('promoCode')}
              />
              <Label htmlFor="promoCode">Promo Code</Label>
            </div>
            {activeExtensions.includes('promoCode') && (
              <div className="ml-7">
                <Input
                  placeholder="Enter promo code (e.g. SAVE20)"
                  value={formData.extensions?.promoCode || ''}
                  onChange={(e) =>
                    onFormDataChange('extensions', {
                      ...formData.extensions,
                      promoCode: e.target.value,
                    })
                  }
                />
              </div>
            )}
          </div>

          {/* Delivery */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="delivery"
              checked={activeExtensions.includes('delivery')}
              onChange={() => {
                handleExtensionToggle('delivery')
                onFormDataChange('extensions', {
                  ...formData.extensions,
                  delivery: !activeExtensions.includes('delivery'),
                })
              }}
            />
            <Label htmlFor="delivery">Delivery Extension</Label>
          </div>
        </div>
      </Card>

      {/* ── AI Optimization ── */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">AI Optimization</h3>
        <div className="space-y-4">
          {(
            [
              {
                key: 'autoReplaceCreatives',
                label: 'Automatically replace underperforming creatives',
                desc: 'AI will replace low-performing ads with new variants',
              },
              {
                key: 'optimizeAudience',
                label: 'Optimize audience targeting automatically',
                desc: 'AI will adjust targeting based on performance',
              },
              {
                key: 'weeklyBudgetOptimization',
                label: 'Weekly budget optimization',
                desc: 'AI will redistribute budget across days for better performance',
              },
              {
                key: 'dynamicText',
                label: 'Dynamic text adaptation',
                desc: 'AI will adapt ad text based on user context',
              },
            ] as const
          ).map(({ key, label, desc }) => (
            <div key={key} className="flex items-start gap-3">
              <Switch
                id={key}
                checked={formData.aiOptimization[key]}
                onChange={(checked) =>
                  onFormDataChange('aiOptimization', {
                    ...formData.aiOptimization,
                    [key]: checked,
                  })
                }
              />
              <div>
                <Label htmlFor={key}>{label}</Label>
                <p className="text-sm text-[#6B7280]">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Negative Keywords ── */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">Negative Keywords (Campaign Level)</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Match Type</Label>
              <Select
                value={formData.negativeKeywords.matchType}
                onChange={(e) =>
                  onFormDataChange('negativeKeywords', {
                    ...formData.negativeKeywords,
                    matchType: e.target.value,
                  })
                }
              >
                <option value="broad">Broad</option>
                <option value="phrase">Phrase</option>
                <option value="exact">Exact</option>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={() =>
                  generateKeywords({
                    productName: formData.name,
                    niche: formData.objective,
                    platform: primaryPlatform,
                    matchType: 'broad',
                  })
                }
                disabled={aiLoading}
              >
                {aiLoading ? 'Generating...' : 'AI Generate Keywords'}
              </Button>
            </div>
          </div>

          <Textarea
            placeholder="Enter negative keywords (one per line)..."
            rows={6}
            value={formData.negativeKeywords.keywords.join('\n')}
            onChange={(e) =>
              onFormDataChange('negativeKeywords', {
                ...formData.negativeKeywords,
                keywords: e.target.value.split('\n').filter(Boolean),
              })
            }
          />
        </div>
      </Card>

      {/* ── Bid Adjustments ── */}
      <Accordion type="multiple">
        <Card padding="lg">
          <Accordion.Item value="bid-adjustments">
            <Accordion.Trigger>
              <h3 className="text-lg font-semibold text-white">Bid Adjustments (Campaign Level)</h3>
            </Accordion.Trigger>
            <Accordion.Content>
              <div className="space-y-6 pt-2">
                {/* Age / Gender */}
                <div>
                  <h4 className="text-md font-medium text-white mb-3">Age & Gender</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(['male', 'female', 'age_18_24', 'age_25_44'] as const).map((key) => (
                      <div key={key}>
                        <Label className="capitalize">{key.replace('_', ' ')}</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={formData.bidAdjustments.genderAge[key] ?? 1}
                          onChange={(e) =>
                            handleBidAdjustment('genderAge', {
                              ...formData.bidAdjustments.genderAge,
                              [key]: Number(e.target.value),
                            })
                          }
                          placeholder="1.0"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Devices */}
                <div>
                  <h4 className="text-md font-medium text-white mb-3">Devices</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {(['mobile', 'desktop', 'tablet'] as const).map((key) => (
                      <div key={key}>
                        <Label className="capitalize">{key}</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={formData.bidAdjustments.devices[key] ?? 1}
                          onChange={(e) =>
                            handleBidAdjustment('devices', {
                              ...formData.bidAdjustments.devices,
                              [key]: Number(e.target.value),
                            })
                          }
                          placeholder="1.0"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audience */}
                <div>
                  <h4 className="text-md font-medium text-white mb-3">Audience Segments</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {(['retargeting', 'lookalike', 'custom'] as const).map((key) => (
                      <div key={key}>
                        <Label className="capitalize">{key}</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={formData.bidAdjustments.audience[key] ?? 1}
                          onChange={(e) =>
                            handleBidAdjustment('audience', {
                              ...formData.bidAdjustments.audience,
                              [key]: Number(e.target.value),
                            })
                          }
                          placeholder="1.0"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ad Format */}
                <div>
                  <h4 className="text-md font-medium text-white mb-3">Ad Format</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(['image', 'video', 'carousel', 'collection'] as const).map((key) => (
                      <div key={key}>
                        <Label className="capitalize">{key}</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={formData.bidAdjustments.format[key] ?? 1}
                          onChange={(e) =>
                            handleBidAdjustment('format', {
                              ...formData.bidAdjustments.format,
                              [key]: Number(e.target.value),
                            })
                          }
                          placeholder="1.0"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Income */}
                <div>
                  <h4 className="text-md font-medium text-white mb-3">Income Level</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {(['low', 'medium', 'high'] as const).map((key) => (
                      <div key={key}>
                        <Label className="capitalize">{key} Income</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={formData.bidAdjustments.income[key] ?? 1}
                          onChange={(e) =>
                            handleBidAdjustment('income', {
                              ...formData.bidAdjustments.income,
                              [key]: Number(e.target.value),
                            })
                          }
                          placeholder="1.0"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weather */}
                <div>
                  <h4 className="text-md font-medium text-white mb-3">Weather Conditions</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {(['sunny', 'rainy', 'cold'] as const).map((key) => (
                      <div key={key}>
                        <Label className="capitalize">{key}</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={formData.bidAdjustments.weather[key] ?? 1}
                          onChange={(e) =>
                            handleBidAdjustment('weather', {
                              ...formData.bidAdjustments.weather,
                              [key]: Number(e.target.value),
                            })
                          }
                          placeholder="1.0"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* KPI (7th type) */}
                <div>
                  <h4 className="text-md font-medium text-white mb-3">KPI Corrections</h4>
                  <p className="text-xs text-[#6B7280] mb-3">
                    Adjust bids when campaign KPI deviates from target (e.g. CPA too high → lower bids)
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {([
                      { key: 'cpa_above_target', label: 'CPA above target' },
                      { key: 'cpa_below_target', label: 'CPA below target' },
                      { key: 'ctr_above_avg', label: 'CTR above avg' },
                      { key: 'ctr_below_avg', label: 'CTR below avg' },
                      { key: 'roas_above_target', label: 'ROAS above target' },
                      { key: 'roas_below_target', label: 'ROAS below target' },
                    ] as const).map(({ key, label }) => (
                      <div key={key}>
                        <Label>{label}</Label>
                        <Input
                          type="number"
                          step="0.05"
                          min="0"
                          max="3"
                          value={formData.bidAdjustments.kpi[key] ?? 1}
                          onChange={(e) =>
                            handleBidAdjustment('kpi', {
                              ...formData.bidAdjustments.kpi,
                              [key]: Number(e.target.value),
                            })
                          }
                          placeholder="1.0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Accordion.Content>
          </Accordion.Item>
        </Card>
      </Accordion>

      {/* ── Additional Settings ── */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">Additional Settings</h3>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="geoExpansion"
                checked={formData.geoExpansion}
                onChange={(checked) => onFormDataChange('geoExpansion', checked)}
              />
              <Label htmlFor="geoExpansion">Enable geo expansion</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="siteMonitoring"
                checked={formData.siteMonitoring}
                onChange={(checked) => onFormDataChange('siteMonitoring', checked)}
              />
              <Label htmlFor="siteMonitoring">Enable site monitoring</Label>
            </div>
          </div>

          <div>
            <Label>Placement Exclusions (Sites)</Label>
            <Textarea
              placeholder="Enter site URLs to exclude (one per line)..."
              rows={3}
              value={formData.exclusions.sites.join('\n')}
              onChange={(e) =>
                onFormDataChange('exclusions', {
                  ...formData.exclusions,
                  sites: e.target.value.split('\n').filter(Boolean),
                })
              }
            />
          </div>

          <div>
            <Label>IP Exclusions</Label>
            <Textarea
              placeholder="Enter IP addresses to exclude (one per line)..."
              rows={3}
              value={formData.exclusions.ips.join('\n')}
              onChange={(e) =>
                onFormDataChange('exclusions', {
                  ...formData.exclusions,
                  ips: e.target.value.split('\n').filter(Boolean),
                })
              }
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
