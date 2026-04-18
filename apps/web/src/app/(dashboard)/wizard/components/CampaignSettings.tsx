'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
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
    { value: 'roas_goal', label: 'ROAS Goal' }
  ],
  google: [
    { value: 'maximize_clicks', label: 'Maximize Clicks' },
    { value: 'maximize_conversions', label: 'Maximize Conversions' },
    { value: 'target_cpa', label: 'Target CPA' },
    { value: 'target_roas', label: 'Target ROAS' },
    { value: 'manual_cpc', label: 'Manual CPC' }
  ],
  yandex: [
    { value: 'maximize_clicks', label: 'Maximize Clicks' },
    { value: 'target_cpa', label: 'Target CPA' },
    { value: 'target_roas', label: 'Target ROAS' },
    { value: 'manual', label: 'Manual Bidding' }
  ]
}

const ALL_HOURS = Array.from({ length: 24 }, (_, i) => i)

const AD_PRIORITIES = [
  { value: 'best_combo', label: 'Eng yaxshi kombinatsiya (tavsiya etiladi)' },
  { value: 'close_phrase", label: \"So'rovga yaqin ibora\" },
  { value: "exact_match', label: 'Aniq moslik' },
  { value: 'broad_match', label: 'Keng moslik' }
]

function BidInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="number"
        step="0.1"
        min="0"
        max="10"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder="1.0"
      />
    </div>
  )
}

export function CampaignSettings({
  formData,
  onFormDataChange,
  onGenerateUTM,
  aiLoading
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
    setActiveExtensions(prev =>
      prev.includes(extension)
        ? prev.filter(e => e !== extension)
        : [...prev, extension]
    )
  }

  const handleBidAdjustment = (category: string, value: any) => {
    onFormDataChange('bidAdjustments', {
      ...formData.bidAdjustments,
      [category]: value,
    })
  }

  // Determine which bidding strategies to show based on selected platforms
  const activePlatform: string =
    formData.platforms && formData.platforms.length > 0
      ? formData.platforms[0]
      : 'meta'
  const biddingStrategies =
    BIDDING_STRATEGIES[activePlatform] ?? BIDDING_STRATEGIES.meta

  // Hour grid helpers
  const selectedHours: string[] = formData.schedule.hours ?? []
  const toggleHour = (hour: number) => {
    const h = String(hour)
    const updated = selectedHours.includes(h)
      ? selectedHours.filter(x => x !== h)
      : [...selectedHours, h]
    onFormDataChange('schedule', { ...formData.schedule, hours: updated })
  }
  const applyHourPreset = (preset: 'work' | 'evening' | 'all') => {
    let hours: string[] = []
    if (preset === 'work') hours = ALL_HOURS.filter(h => h >= 9 && h < 18).map(String)
    else if (preset === 'evening') hours = ALL_HOURS.filter(h => h >= 18).map(String)
    else hours = ALL_HOURS.map(String)
    onFormDataChange('schedule', { ...formData.schedule, hours })
  }

  // Quick links helpers (title + url pairs stored as objects)
  const quickLinksList: { title: string; url: string; desc: string }[] =
    formData.extensions.quickLinksList ?? [{ title: '', url: '', desc: '' }]
  const updateQuickLink = (i: number, field: string, val: string) => {
    const updated = quickLinksList.map((item, idx) =>
      idx === i ? { ...item, [field]: val } : item
    )
    onFormDataChange('extensions', { ...formData.extensions, quickLinksList: updated })
  }
  const addQuickLink = () => {
    if (quickLinksList.length < 8)
      onFormDataChange('extensions', {
        ...formData.extensions,
        quickLinksList: [...quickLinksList, { title: '', url: '', desc: '' }]
      })
  }
  const removeQuickLink = (i: number) => {
    onFormDataChange('extensions', {
      ...formData.extensions,
      quickLinksList: quickLinksList.filter((_, idx) => idx !== i)
    })
  }

  // Clarifiers helpers (plain text list)
  const clarifiersList: string[] = formData.extensions.clarifiers ?? ['']
  const updateClarifier = (i: number, val: string) => {
    const updated = clarifiersList.map((item, idx) => (idx === i ? val : item))
    onFormDataChange('extensions', { ...formData.extensions, clarifiers: updated })
  }
  const addClarifier = () => {
    if (clarifiersList.length < 8)
      onFormDataChange('extensions', {
        ...formData.extensions,
        clarifiers: [...clarifiersList, '']
      })
  }
  const removeClarifier = (i: number) => {
    onFormDataChange('extensions', {
      ...formData.extensions,
      clarifiers: clarifiersList.filter((_, idx) => idx !== i)
    })
  }

  // AI optimization - master toggle
  const aiEnabled = formData.aiOptimization.enabled ?? false

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-white">Campaign Settings</h2>

      {/* Basic Settings */}
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

        {/* Schedule */}
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

        <div className="flex items-center gap-4 mt-4">
          <Switch
            id="alwaysOn"
            checked={formData.schedule.alwaysOn}
            onChange={(checked) => onFormDataChange('schedule", { ...formData.schedule, alwaysOn: checked })}
          />
          <Label htmlFor=\"alwaysOn\">Always On (24/7)</Label>
        </div>

        {/* Hour Schedule Grid — shown only when alwaysOn is false */}
        {!formData.schedule.alwaysOn && (
          <div className=\"mt-4\">
            <div className=\"flex items-center justify-between mb-2\">
              <Label>Ko'rsatish soatlari</Label>
              <div className=\"flex gap-2\">
                <Button variant=\"secondary\" size=\"sm\" onClick={() => applyHourPreset("work')}>Ish vaqti (9–18)</Button>
                <Button variant="secondary" size="sm" onClick={() => applyHourPreset('evening')}>Kechki (18–24)</Button>
                <Button variant="secondary" size="sm" onClick={() => applyHourPreset('all')}>Hammasi</Button>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-1">
              {ALL_HOURS.map(h => {
                const active = selectedHours.includes(String(h))
                return (
                  <button
                    key={h}
                    onClick={() => toggleHour(h)}
                    className={`py-2 rounded text-xs font-medium transition-colors ${
                      active
                        ? 'bg-[#6366F1] text-white'
                        : 'bg-surface text-text-tertiary hover:bg-surface-2'
                    }`}
                  >
                    {h}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-text-tertiary mt-1">
              {selectedHours.length === 0
                ? 'Hech qaysi soat tanlanmagan'
                : `${selectedHours.length} soat tanlangan`}
            </p>
          </div>
        )}
      </Card>

      {/* ── Strategy & Bidding ── */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-1">Strategy & Bidding</h3>
        {formData.platforms?.length > 0 && (
          <p className="text-xs text-text-tertiary mb-4">
            Showing strategies for{' '}
            <span className="text-violet-600 capitalize">{primaryPlatform}</span>
            {formData.platforms.length > 1 && ` (+${formData.platforms.length - 1} more)`}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="biddingStrategy">
              Bidding Strategy
              {formData.platforms?.length > 1 && (
                <span className="ml-2 text-xs text-text-tertiary">
                  ({activePlatform} uchun)
                </span>
              )}
            </Label>
            <Select
              id="biddingStrategy"
              value={formData.strategy.type}
              onChange={(e) =>
                onFormDataChange('strategy', { ...formData.strategy, type: e.target.value })
              }
            >
              {biddingStrategies.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </div>

          {(formData.strategy.type === 'bid_cap' ||
            formData.strategy.type === 'target_cpa' ||
            formData.strategy.type === 'manual_cpc' ||
            formData.strategy.type === 'manual') && (
            <div>
              <Label htmlFor="bidCap">
                {formData.strategy.type === 'target_cpa' ? 'Target CPA' : 'Bid Cap'}
              </Label>
              <Input
                id="bidCap"
                type="number"
                value={formData.strategy.bidCap || ''}
                onChange={(e) => onFormDataChange('strategy', { ...formData.strategy, bidCap: Number(e.target.value) })}
                placeholder="Qiymatni kiriting"
              />
            </div>
          )}

          {formData.strategy.type === 'target_roas' && (
            <div>
              <Label htmlFor="targetRoas">Target ROAS (%)</Label>
              <Input
                id="targetRoas"
                type="number"
                value={formData.strategy.targetRoas || ''}
                onChange={(e) => onFormDataChange('strategy', { ...formData.strategy, targetRoas: Number(e.target.value) })}
                placeholder="Masalan: 300"
              />
            </div>
          )}
        </div>

        {/* Advantage+ — only for Meta */}
        {(formData.platforms?.includes('meta') || !formData.platforms?.length) && (
          <div className="flex items-center gap-3 mt-4">
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

        {/* Ad Priority */}
        <div className="mt-4">
          <Label htmlFor="adPriority">Reklama prioriteti</Label>
          <Select
            id="adPriority"
            value={formData.strategy.adPriority ?? 'best_combo'}
            onChange={(e) => onFormDataChange('strategy', { ...formData.strategy, adPriority: e.target.value })}
          >
            {AD_PRIORITIES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </Select>
        </div>
      </Card>

      {/* ── UTM Parameters ── */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">UTM Parameters</h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={onGenerateUTM}
            disabled={aiLoading}
          >
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
        <p className="text-xs text-text-tertiary mt-2">
          Dynamic params: {'{keyword}'}, {'{campaign_id}'}, {'{placement}'}
        </p>
      </Card>

      {/* ── Ad Extensions ── */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">Ad Extensions</h3>
        <div className="space-y-3">
          {/* Quick Links toggle */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="quickLinks"
              checked={activeExtensions.includes('quickLinks')}
              onChange={() => handleExtensionToggle('quickLinks')}
            />
            <Label htmlFor="quickLinks">Quick Links (sitelink extensions)</Label>
          </div>

          {activeExtensions.includes('quickLinks') && (
            <div className="ml-6 space-y-3">
              {quickLinksList.map((link, i) => (
                <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-tertiary">Quick Link {i + 1}</span>
                    {quickLinksList.length > 1 && (
                      <button
                        onClick={() => removeQuickLink(i)}
                        className="text-xs text-red-500 hover:text-red-400"
                      >
                        O'chirish
                      </button>
                    )}
                  </div>
                  <Input
                    placeholder="Sarlavha (maks 25 belgi)"
                    value={link.title}
                    onChange={(e) => updateQuickLink(i, 'title', e.target.value)}
                    maxLength={25}
                  />
                  <Input
                    placeholder="URL (https://...)"
                    value={link.url}
                    onChange={(e) => updateQuickLink(i, 'url', e.target.value)}
                  />
                  <Input
                    placeholder="Qisqa tavsif (ixtiyoriy)"
                    value={link.desc}
                    onChange={(e) => updateQuickLink(i, 'desc", e.target.value)}
                  />
                </div>
              ))}
              {quickLinksList.length < 8 && (
                <Button variant=\"secondary\" size=\"sm\" onClick={addQuickLink}>
                  + Quick Link qo'shish
                </Button>
              )}
            </div>
          )}

          {/* Clarifiers toggle */}
          <div className=\"flex items-center gap-3\">
            <Checkbox
              id=\"clarifiers\"
              checked={activeExtensions.includes("clarifiers')}
              onChange={() => handleExtensionToggle('clarifiers')}
            />
            <Label htmlFor="clarifiers">Clarifiers (callout extensions)</Label>
          </div>

          {activeExtensions.includes('clarifiers") && (
            <div className=\"ml-6 space-y-2\">
              {clarifiersList.map((text, i) => (
                <div key={i} className=\"flex gap-2\">
                  <Input
                    placeholder={`Clarifier ${i + 1} (maks 25 belgi)`}
                    value={text}
                    onChange={(e) => updateClarifier(i, e.target.value)}
                    maxLength={25}
                  />
                  {clarifiersList.length > 1 && (
                    <button
                      onClick={() => removeClarifier(i)}
                      className=\"text-red-500 hover:text-red-400 text-sm px-2\"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {clarifiersList.length < 8 && (
                <Button variant=\"secondary\" size=\"sm\" onClick={addClarifier}>
                  + Clarifier qo'shish
                </Button>
              )}
            </div>
          )}

          {/* Promo Code toggle */}
          <div className=\"flex items-center gap-3\">
            <Checkbox
              id=\"promoCode\"
              checked={activeExtensions.includes("promoCode')}
              onChange={() => handleExtensionToggle('promoCode')}
            />
            <Label htmlFor="promoCode">Promo Code</Label>
          </div>

          {activeExtensions.includes('promoCode') && (
            <div className="ml-6">
              <Input
                placeholder="Promo kod (masalan: SUMMER25)"
                value={formData.extensions.promoCode ?? ''}
                onChange={(e) => onFormDataChange('extensions', { ...formData.extensions, promoCode: e.target.value })}
              />
            </div>
          )}

          {/* Delivery toggle */}
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
            <Label htmlFor="delivery">Yetkazib berish extension</Label>
          </div>
        </div>
      </Card>

      {/* ── AI Optimization ── */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">AI Optimization</h3>
        <div className="space-y-4">
          {/* Master toggle */}
          <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
            <Switch
              id="aiEnabled"
              checked={aiEnabled}
              onChange={(checked) =>
                onFormDataChange('aiOptimization", { ...formData.aiOptimization, enabled: checked })
              }
            />
            <div>
              <Label htmlFor=\"aiEnabled\">AI avtomatik tavsiyalarni qo'llash</Label>
              <p className=\"text-xs text-text-tertiary\">Barcha AI optimizatsiya funksiyalarini yoqish/o"chirish</p>
            </div>
          </div>

          {/* Sub-toggles — shown only when master is ON */}
          {aiEnabled && (
            <div className="ml-4 space-y-3 border-l-2 border-border pl-4">
              <div className="flex items-center gap-3">
                <Switch
                  id="autoReplaceCreatives"
                  checked={formData.aiOptimization.autoReplaceCreatives}
                  onChange={(checked) =>
                    onFormDataChange('aiOptimization", { ...formData.aiOptimization, autoReplaceCreatives: checked })
                  }
                />
                <div>
                  <Label htmlFor=\"autoReplaceCreatives\">Samarasiz kreatiflarni almashtirish</Label>
                  <p className=\"text-xs text-text-tertiary\">AI past ko'rsatkichli reklamalarni yangi variantlar bilan almashtiradi</p>
                </div>
              </div>

              <div className=\"flex items-center gap-3\">
                <Switch
                  id=\"optimizeAudience\"
                  checked={formData.aiOptimization.optimizeAudience}
                  onChange={(checked) =>
                    onFormDataChange("aiOptimization', { ...formData.aiOptimization, optimizeAudience: checked })
                  }
                />
                <div>
                  <Label htmlFor="optimizeAudience">Auditoriya sozlamalarini optimizatsiya</Label>
                  <p className="text-xs text-text-tertiary">AI natijalarga qarab targeting ni moslashtiradi</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="weeklyBudgetOptimization"
                  checked={formData.aiOptimization.weeklyBudgetOptimization}
                  onChange={(checked) =>
                    onFormDataChange('aiOptimization", { ...formData.aiOptimization, weeklyBudgetOptimization: checked })
                  }
                />
                <div>
                  <Label htmlFor=\"weeklyBudgetOptimization\">Haftalik byudjetni taqsimlash</Label>
                  <p className=\"text-xs text-text-tertiary\">AI byudjetni kun bo'yicha yaxshi natija uchun qayta taqsimlaydi</p>
                </div>
              </div>
            </div>
          )}

          {/* Separate toggle: match text to query */}
          <div className=\"flex items-center gap-3 pt-2 border-t border-border\">
            <Switch
              id=\"dynamicText\"
              checked={formData.aiOptimization.dynamicText}
              onChange={(checked) =>
                onFormDataChange("aiOptimization", { ...formData.aiOptimization, dynamicText: checked })
              }
            />
            <div>
              <Label htmlFor=\"dynamicText\">Reklama matnini so'rovga moslashtirish</Label>
              <p className=\"text-xs text-text-tertiary\">AI foydalanuvchi so"roviga qarab reklama matnini dinamik o'zgartiradi</p>
            </div>
          </div>
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
                  onFormDataChange('negativeKeywords', { ...formData.negativeKeywords, matchType: e.target.value })
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
                    platform: activePlatform,
                    matchType: 'broad'
                  })
                }
                disabled={aiLoading}
              >
                {aiLoading ? 'Generating...' : 'AI Generate Keywords"}
              </Button>
            </div>
          </div>

          <Textarea
            placeholder=\"Manfiy kalit so'zlarni kiriting (har biri alohida qatorda)...\"
            rows={6}
            value={formData.negativeKeywords.keywords.join("\n')}
            onChange={(e) =>
              onFormDataChange('negativeKeywords', {
                ...formData.negativeKeywords,
                keywords: e.target.value.split('\n').filter(Boolean)
              })
            }
          />
        </div>
      </Card>

      {/* Bid Adjustments (Campaign Level) */}
      <Accordion type="multiple">
        <Card padding="lg">
          <Accordion.Item value="bid-adjustments">
            <Accordion.Trigger>
              <h3 className="text-lg font-semibold text-white">Bid Adjustments (Campaign Level)</h3>
            </Accordion.Trigger>
            <Accordion.Content>
              <div className="space-y-6 pt-4">

                {/* Age/Gender */}
                <div>
                  <h4 className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-3">Yosh va Jins</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <BidInput label="Erkak" value={formData.bidAdjustments.genderAge.male ?? 1}
                      onChange={v => handleBidAdjustment('genderAge', { ...formData.bidAdjustments.genderAge, male: v })} />
                    <BidInput label="Ayol" value={formData.bidAdjustments.genderAge.female ?? 1}
                      onChange={v => handleBidAdjustment('genderAge', { ...formData.bidAdjustments.genderAge, female: v })} />
                    <BidInput label="18–24" value={formData.bidAdjustments.genderAge.age18_24 ?? 1}
                      onChange={v => handleBidAdjustment('genderAge', { ...formData.bidAdjustments.genderAge, age18_24: v })} />
                    <BidInput label="25–34" value={formData.bidAdjustments.genderAge.age25_34 ?? 1}
                      onChange={v => handleBidAdjustment('genderAge', { ...formData.bidAdjustments.genderAge, age25_34: v })} />
                    <BidInput label="35–44" value={formData.bidAdjustments.genderAge.age35_44 ?? 1}
                      onChange={v => handleBidAdjustment('genderAge', { ...formData.bidAdjustments.genderAge, age35_44: v })} />
                    <BidInput label="45–54" value={formData.bidAdjustments.genderAge.age45_54 ?? 1}
                      onChange={v => handleBidAdjustment('genderAge', { ...formData.bidAdjustments.genderAge, age45_54: v })} />
                    <BidInput label="55+" value={formData.bidAdjustments.genderAge.age55plus ?? 1}
                      onChange={v => handleBidAdjustment('genderAge', { ...formData.bidAdjustments.genderAge, age55plus: v })} />
                  </div>
                </div>

                {/* Devices */}
                <div>
                  <h4 className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-3">Qurilmalar</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <BidInput label="Mobil" value={formData.bidAdjustments.devices.mobile ?? 1}
                      onChange={v => handleBidAdjustment('devices', { ...formData.bidAdjustments.devices, mobile: v })} />
                    <BidInput label="Desktop" value={formData.bidAdjustments.devices.desktop ?? 1}
                      onChange={v => handleBidAdjustment('devices', { ...formData.bidAdjustments.devices, desktop: v })} />
                    <BidInput label="Tablet" value={formData.bidAdjustments.devices.tablet ?? 1}
                      onChange={v => handleBidAdjustment('devices', { ...formData.bidAdjustments.devices, tablet: v })} />
                  </div>
                </div>

                {/* Audience */}
                <div>
                  <h4 className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-3">Auditoriya segmentlari</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <BidInput label="Retargeting" value={formData.bidAdjustments.audience.retargeting ?? 1}
                      onChange={v => handleBidAdjustment('audience', { ...formData.bidAdjustments.audience, retargeting: v })} />
                    <BidInput label="Lookalike" value={formData.bidAdjustments.audience.lookalike ?? 1}
                      onChange={v => handleBidAdjustment('audience', { ...formData.bidAdjustments.audience, lookalike: v })} />
                    <BidInput label="Custom" value={formData.bidAdjustments.audience.custom ?? 1}
                      onChange={v => handleBidAdjustment('audience', { ...formData.bidAdjustments.audience, custom: v })} />
                  </div>
                </div>

                {/* Ad Format */}
                <div>
                  <h4 className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-3">Reklama formatlari</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <BidInput label="Image" value={formData.bidAdjustments.format.image ?? 1}
                      onChange={v => handleBidAdjustment('format', { ...formData.bidAdjustments.format, image: v })} />
                    <BidInput label="Video" value={formData.bidAdjustments.format.video ?? 1}
                      onChange={v => handleBidAdjustment('format', { ...formData.bidAdjustments.format, video: v })} />
                    <BidInput label="Carousel" value={formData.bidAdjustments.format.carousel ?? 1}
                      onChange={v => handleBidAdjustment('format', { ...formData.bidAdjustments.format, carousel: v })} />
                    <BidInput label="Collection" value={formData.bidAdjustments.format.collection ?? 1}
                      onChange={v => handleBidAdjustment('format', { ...formData.bidAdjustments.format, collection: v })} />
                  </div>
                </div>

                {/* Income */}
                <div>
                  <h4 className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-3">Daromad darajasi</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <BidInput label="Past" value={formData.bidAdjustments.income.low ?? 1}
                      onChange={v => handleBidAdjustment('income', { ...formData.bidAdjustments.income, low: v })} />
                    <BidInput label="O'rta" value={formData.bidAdjustments.income.medium ?? 1}
                      onChange={v => handleBidAdjustment('income', { ...formData.bidAdjustments.income, medium: v })} />
                    <BidInput label="Yuqori" value={formData.bidAdjustments.income.high ?? 1}
                      onChange={v => handleBidAdjustment('income', { ...formData.bidAdjustments.income, high: v })} />
                  </div>
                </div>

                {/* Weather */}
                <div>
                  <h4 className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-3">Ob-havo sharoiti</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <BidInput label="Quyoshli" value={formData.bidAdjustments.weather.sunny ?? 1}
                      onChange={v => handleBidAdjustment('weather", { ...formData.bidAdjustments.weather, sunny: v })} />
                    <BidInput label=\"Yomg'irli\" value={formData.bidAdjustments.weather.rainy ?? 1}
                      onChange={v => handleBidAdjustment("weather', { ...formData.bidAdjustments.weather, rainy: v })} />
                    <BidInput label="Sovuq" value={formData.bidAdjustments.weather.cold ?? 1}
                      onChange={v => handleBidAdjustment('weather", { ...formData.bidAdjustments.weather, cold: v })} />
                  </div>
                </div>

                {/* KPI Correction — 7th type */}
                <div>
                  <h4 className=\"text-sm font-medium text-text-tertiary uppercase tracking-wider mb-3\">
                    KPI Korreksiyasi
                    <span className=\"ml-2 text-[#6366F1] text-xs normal-case\">(Target CPA/ROAS bo'yicha segmentlash)</span>
                  </h4>
                  <div className=\"grid grid-cols-2 md:grid-cols-3 gap-3\">
                    <BidInput label=\"Umumiy KPI\" value={formData.bidAdjustments.kpi.general ?? 1}
                      onChange={v => handleBidAdjustment("kpi', { ...formData.bidAdjustments.kpi, general: v })} />
                    <BidInput label="Mobil KPI" value={formData.bidAdjustments.kpi.mobile ?? 1}
                      onChange={v => handleBidAdjustment('kpi', { ...formData.bidAdjustments.kpi, mobile: v })} />
                    <BidInput label="Desktop KPI" value={formData.bidAdjustments.kpi.desktop ?? 1}
                      onChange={v => handleBidAdjustment('kpi', { ...formData.bidAdjustments.kpi, desktop: v })} />
                    <BidInput label="Yangi foydalanuvchi" value={formData.bidAdjustments.kpi.newUser ?? 1}
                      onChange={v => handleBidAdjustment('kpi', { ...formData.bidAdjustments.kpi, newUser: v })} />
                    <BidInput label="Qaytuvchi" value={formData.bidAdjustments.kpi.returning ?? 1}
                      onChange={v => handleBidAdjustment('kpi', { ...formData.bidAdjustments.kpi, returning: v })} />
                    <BidInput label="Premium segment" value={formData.bidAdjustments.kpi.premium ?? 1}
                      onChange={v => handleBidAdjustment('kpi', { ...formData.bidAdjustments.kpi, premium: v })} />
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
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="geoExpansion"
                checked={formData.geoExpansion}
                onChange={(checked) => onFormDataChange('geoExpansion', checked)}
              />
              <Label htmlFor="geoExpansion">Geo kengayishni yoqish</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="siteMonitoring"
                checked={formData.siteMonitoring}
                onChange={(checked) => onFormDataChange('siteMonitoring', checked)}
              />
              <Label htmlFor="siteMonitoring">Saytni monitoring qilish</Label>
            </div>
          </div>

          <div>
            <Label>Placement Exclusions (Sites)</Label>
            <Textarea
              placeholder="Chiqarib tashlanadigan sayt URLlarini kiriting (har biri alohida qatorda)..."
              rows={3}
              value={formData.exclusions.sites.join('\n')}
              onChange={(e) =>
                onFormDataChange('exclusions', {
                  ...formData.exclusions,
                  sites: e.target.value.split('\n').filter(Boolean)
                })
              }
            />
          </div>

          <div>
            <Label>IP Exclusions</Label>
            <Textarea
              placeholder="Chiqarib tashlanadigan IP manzillarini kiriting (har biri alohida qatorda)..."
              rows={3}
              value={formData.exclusions.ips.join('\n')}
              onChange={(e) =>
                onFormDataChange('exclusions', {
                  ...formData.exclusions,
                  ips: e.target.value.split('\n').filter(Boolean)
                })
              }
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
