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
  { value: 'awareness', label: 'Awareness', icon: '👁️' }
]

const CURRENCIES = ['UZS', 'USD', 'EUR', 'RUB']

const BIDDING_STRATEGIES = {
  meta: [
    { value: 'highest_volume', label: 'Highest Volume' },
    { value: 'cost_per_result_goal', label: 'Cost per Result Goal' },
    { value: 'bid_cap', label: 'Bid Cap' }
  ],
  google: [
    { value: 'maximize_clicks', label: 'Maximize Clicks' },
    { value: 'maximize_conversions', label: 'Maximize Conversions' },
    { value: 'target_cpa', label: 'Target CPA' }
  ],
  yandex: [
    { value: 'maximize_clicks', label: 'Maximize Clicks' },
    { value: 'target_cpa', label: 'Target CPA' },
    { value: 'manual', label: 'Manual Bidding' }
  ]
}

export function CampaignSettings({ 
  formData, 
  onFormDataChange, 
  onGenerateUTM, 
  aiLoading 
}: CampaignSettingsProps) {
  const { generateKeywords } = useAiAgent()
  const [activeExtensions, setActiveExtensions] = useState<string[]>([])

  const handleExtensionToggle = (extension: string) => {
    setActiveExtensions(prev => 
      prev.includes(extension) 
        ? prev.filter(e => e !== extension)
        : [...prev, extension]
    )
  }

  const handleBidAdjustment = (category: string, value: number) => {
    onFormDataChange('bidAdjustments', {
      ...formData.bidAdjustments,
      [category]: value
    })
  }

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
              {OBJECTIVES.map(obj => (
                <option key={obj.value} value={obj.value}>{obj.label}</option>
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
              onChange={(e) => onFormDataChange('budget', { ...formData.budget, amount: Number(e.target.value) })}
            />
          </div>
          
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select
              id="currency"
              value={formData.budget.currency}
              onChange={(e) => onFormDataChange('budget', { ...formData.budget, currency: e.target.value })}
            >
              {CURRENCIES.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </Select>
          </div>
          
          <div>
            <Label htmlFor="budgetType">Budget Type</Label>
            <Select
              id="budgetType"
              value={formData.budget.type}
              onChange={(e) => onFormDataChange('budget', { ...formData.budget, type: e.target.value })}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.schedule.startDate}
              onChange={(e) => onFormDataChange('schedule', { ...formData.schedule, startDate: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.schedule.endDate}
              onChange={(e) => onFormDataChange('schedule', { ...formData.schedule, endDate: e.target.value })}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Switch
              id="alwaysOn"
              checked={formData.schedule.alwaysOn}
              onChange={(checked) => onFormDataChange('schedule', { ...formData.schedule, alwaysOn: checked })}
            />
            <Label htmlFor="alwaysOn">Always On</Label>
          </div>
        </div>
      </Card>

      {/* Strategy & Bidding */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">Strategy & Bidding</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="biddingStrategy">Bidding Strategy</Label>
            <Select
              id="biddingStrategy"
              value={formData.strategy.type}
              onChange={(e) => onFormDataChange('strategy', { ...formData.strategy, type: e.target.value })}
            >
              {BIDDING_STRATEGIES.meta.map(strategy => (
                <option key={strategy.value} value={strategy.value}>{strategy.label}</option>
              ))}
            </Select>
          </div>
          
          <div>
            <Label htmlFor="bidCap">Bid Cap</Label>
            <Input
              id="bidCap"
              type="number"
              value={formData.strategy.bidCap || ''}
              onChange={(e) => onFormDataChange('strategy', { ...formData.strategy, bidCap: Number(e.target.value) })}
              placeholder="Optional bid cap"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Switch
              id="advantagePlus"
              checked={formData.strategy.advantagePlus}
              onChange={(checked) => onFormDataChange('strategy', { ...formData.strategy, advantagePlus: checked })}
            />
            <Label htmlFor="advantagePlus">Advantage+ Campaign Budget</Label>
          </div>
        </div>
      </Card>

      {/* UTM Parameters */}
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
          <Input
            placeholder="utm_source"
            value={formData.utm.source}
            onChange={(e) => onFormDataChange('utm', { ...formData.utm, source: e.target.value })}
          />
          <Input
            placeholder="utm_medium"
            value={formData.utm.medium}
            onChange={(e) => onFormDataChange('utm', { ...formData.utm, medium: e.target.value })}
          />
          <Input
            placeholder="utm_campaign"
            value={formData.utm.campaign}
            onChange={(e) => onFormDataChange('utm', { ...formData.utm, campaign: e.target.value })}
          />
          <Input
            placeholder="utm_content"
            value={formData.utm.content}
            onChange={(e) => onFormDataChange('utm', { ...formData.utm, content: e.target.value })}
          />
          <Input
            placeholder="utm_term"
            value={formData.utm.term}
            onChange={(e) => onFormDataChange('utm', { ...formData.utm, term: e.target.value })}
          />
        </div>
      </Card>

      {/* Ad Extensions */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">Ad Extensions</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="quickLinks"
              checked={activeExtensions.includes('quickLinks')}
              onChange={() => handleExtensionToggle('quickLinks')}
            />
            <Label htmlFor="quickLinks">Quick Links</Label>
          </div>
          
          <div className="flex items-center gap-3">
            <Checkbox
              id="clarifiers"
              checked={activeExtensions.includes('clarifiers')}
              onChange={() => handleExtensionToggle('clarifiers')}
            />
            <Label htmlFor="clarifiers">Clarifiers</Label>
          </div>
          
          <div className="flex items-center gap-3">
            <Checkbox
              id="promoCode"
              checked={activeExtensions.includes('promoCode')}
              onChange={() => handleExtensionToggle('promoCode')}
            />
            <Label htmlFor="promoCode">Promo Code</Label>
          </div>
          
          <div className="flex items-center gap-3">
            <Checkbox
              id="delivery"
              checked={activeExtensions.includes('delivery')}
              onChange={() => handleExtensionToggle('delivery')}
            />
            <Label htmlFor="delivery">Delivery</Label>
          </div>
        </div>

        {activeExtensions.includes('quickLinks') && (
          <div className="mt-4 space-y-2">
            <Label>Quick Links</Label>
            <Input placeholder="Link 1" />
            <Input placeholder="Link 2" />
            <Input placeholder="Link 3" />
          </div>
        )}

        {activeExtensions.includes('clarifiers') && (
          <div className="mt-4 space-y-2">
            <Label>Clarifiers</Label>
            <Input placeholder="Clarifier 1" />
            <Input placeholder="Clarifier 2" />
          </div>
        )}

        {activeExtensions.includes('promoCode') && (
          <div className="mt-4">
            <Label>Promo Code</Label>
            <Input placeholder="Enter promo code" />
          </div>
        )}
      </Card>

      {/* AI Optimization */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">AI Optimization</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch
                id="autoReplaceCreatives"
                checked={formData.aiOptimization.autoReplaceCreatives}
                onChange={(checked) => onFormDataChange('aiOptimization', { ...formData.aiOptimization, autoReplaceCreatives: checked })}
              />
              <div>
                <Label htmlFor="autoReplaceCreatives">Automatically replace underperforming creatives</Label>
                <p className="text-sm text-[#6B7280]">AI will replace low-performing ads with new variants</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch
                id="optimizeAudience"
                checked={formData.aiOptimization.optimizeAudience}
                onChange={(checked) => onFormDataChange('aiOptimization', { ...formData.aiOptimization, optimizeAudience: checked })}
              />
              <div>
                <Label htmlFor="optimizeAudience">Optimize audience targeting automatically</Label>
                <p className="text-sm text-[#6B7280]">AI will adjust targeting based on performance</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch
                id="weeklyBudgetOptimization"
                checked={formData.aiOptimization.weeklyBudgetOptimization}
                onChange={(checked) => onFormDataChange('aiOptimization', { ...formData.aiOptimization, weeklyBudgetOptimization: checked })}
              />
              <div>
                <Label htmlFor="weeklyBudgetOptimization">Weekly budget optimization</Label>
                <p className="text-sm text-[#6B7280]">AI will redistribute budget across days for better performance</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch
                id="dynamicText"
                checked={formData.aiOptimization.dynamicText}
                onChange={(checked) => onFormDataChange('aiOptimization', { ...formData.aiOptimization, dynamicText: checked })}
              />
              <div>
                <Label htmlFor="dynamicText">Dynamic text adaptation</Label>
                <p className="text-sm text-[#6B7280]">AI will adapt ad text based on user context</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Negative Keywords */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">Negative Keywords (Campaign Level)</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Match Type</Label>
              <Select
                value={formData.negativeKeywords.matchType}
                onChange={(e) => onFormDataChange('negativeKeywords', { ...formData.negativeKeywords, matchType: e.target.value })}
              >
                <option value="broad">Broad</option>
                <option value="phrase">Phrase</option>
                <option value="exact">Exact</option>
              </Select>
            </div>
            <div>
              <Button 
                variant="secondary" 
                onClick={() => generateKeywords({ productName: formData.name, niche: formData.objective, platform: 'meta', matchType: 'broad' })}
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
            onChange={(e) => onFormDataChange('negativeKeywords', { ...formData.negativeKeywords, keywords: e.target.value.split('\n').filter(Boolean) })}
          />
        </div>
      </Card>

      {/* Bid Adjustments */}
      <Accordion type="multiple">
        <Card padding="lg">
          <Accordion.Item value="bid-adjustments">
            <Accordion.Trigger>
              <h3 className="text-lg font-semibold text-white">Bid Adjustments (Campaign Level)</h3>
            </Accordion.Trigger>
            <Accordion.Content>
              <div className="space-y-6">
                {/* Age/Gender Adjustments */}
                <div>
                  <h4 className="text-md font-medium text-white mb-3">Age & Gender</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label>Male</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.bidAdjustments.genderAge.male || 1}
                        onChange={(e) => handleBidAdjustment('genderAge', { ...formData.bidAdjustments.genderAge, male: Number(e.target.value) })}
                        placeholder="1.0"
                      />
                    </div>
                    <div>
                      <Label>Female</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.bidAdjustments.genderAge.female || 1}
                        onChange={(e) => handleBidAdjustment('genderAge', { ...formData.bidAdjustments.genderAge, female: Number(e.target.value) })}
                        placeholder="1.0"
                      />
                    </div>
                  </div>
                </div>

                {/* Device Adjustments */}
                <div>
                  <h4 className="text-md font-medium text-white mb-3">Devices</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Mobile</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.bidAdjustments.devices.mobile || 1}
                        onChange={(e) => handleBidAdjustment('devices', { ...formData.bidAdjustments.devices, mobile: Number(e.target.value) })}
                        placeholder="1.0"
                      />
                    </div>
                    <div>
                      <Label>Desktop</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.bidAdjustments.devices.desktop || 1}
                        onChange={(e) => handleBidAdjustment('devices', { ...formData.bidAdjustments.devices, desktop: Number(e.target.value) })}
                        placeholder="1.0"
                      />
                    </div>
                    <div>
                      <Label>Tablet</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.bidAdjustments.devices.tablet || 1}
                        onChange={(e) => handleBidAdjustment('devices', { ...formData.bidAdjustments.devices, tablet: Number(e.target.value) })}
                        placeholder="1.0"
                      />
                    </div>
                  </div>
                </div>

                {/* Audience Adjustments */}
                <div>
                  <h4 className="text-md font-medium text-white mb-3">Audience Segments</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label>Retargeting</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.bidAdjustments.audience.retargeting || 1}
                        onChange={(e) => handleBidAdjustment('audience', { ...formData.bidAdjustments.audience, retargeting: Number(e.target.value) })}
                        placeholder="1.0"
                      />
                    </div>
                    <div>
                      <Label>Lookalike</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.bidAdjustments.audience.lookalike || 1}
                        onChange={(e) => handleBidAdjustment('audience', { ...formData.bidAdjustments.audience, lookalike: Number(e.target.value) })}
                        placeholder="1.0"
                      />
                    </div>
                    <div>
                      <Label>Custom</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.bidAdjustments.audience.custom || 1}
                        onChange={(e) => handleBidAdjustment('audience', { ...formData.bidAdjustments.audience, custom: Number(e.target.value) })}
                        placeholder="1.0"
                      />
                    </div>
                  </div>
                </div>

                {/* Format Adjustments */}
                <div>
                  <h4 className="text-md font-medium text-white mb-3">Ad Format</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label>Image</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.bidAdjustments.format.image || 1}
                        onChange={(e) => handleBidAdjustment('format', { ...formData.bidAdjustments.format, image: Number(e.target.value) })}
                        placeholder="1.0"
                      />
                    </div>
                    <div>
                      <Label>Video</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.bidAdjustments.format.video || 1}
                        onChange={(e) => handleBidAdjustment('format', { ...formData.bidAdjustments.format, video: Number(e.target.value) })}
                        placeholder="1.0"
                      />
                    </div>
                    <div>
                      <Label>Carousel</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.bidAdjustments.format.carousel || 1}
                        onChange={(e) => handleBidAdjustment('format', { ...formData.bidAdjustments.format, carousel: Number(e.target.value) })}
                        placeholder="1.0"
                      />
                    </div>
                    <div>
                      <Label>Collection</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.bidAdjustments.format.collection || 1}
                        onChange={(e) => handleBidAdjustment('format', { ...formData.bidAdjustments.format, collection: Number(e.target.value) })}
                        placeholder="1.0"
                      />
                    </div>
                  </div>
                </div>

                {/* Income Adjustments */}
                <div>
                  <h4 className="text-md font-medium text-white mb-3">Income Level</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Low Income</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.bidAdjustments.income.low || 1}
                        onChange={(e) => handleBidAdjustment('income', { ...formData.bidAdjustments.income, low: Number(e.target.value) })}
                        placeholder="1.0"
                      />
                    </div>
                    <div>
                      <Label>Medium Income</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.bidAdjustments.income.medium || 1}
                        onChange={(e) => handleBidAdjustment('income', { ...formData.bidAdjustments.income, medium: Number(e.target.value) })}
                        placeholder="1.0"
                      />
                    </div>
                    <div>
                      <Label>High Income</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.bidAdjustments.income.high || 1}
                        onChange={(e) => handleBidAdjustment('income', { ...formData.bidAdjustments.income, high: Number(e.target.value) })}
                        placeholder="1.0"
                      />
                    </div>
                  </div>
                </div>

                {/* Weather Adjustments */}
                <div>
                  <h4 className="text-md font-medium text-white mb-3">Weather Conditions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label>Sunny</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.bidAdjustments.weather.sunny || 1}
                        onChange={(e) => handleBidAdjustment('weather', { ...formData.bidAdjustments.weather, sunny: Number(e.target.value) })}
                        placeholder="1.0"
                      />
                    </div>
                    <div>
                      <Label>Rainy</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.bidAdjustments.weather.rainy || 1}
                        onChange={(e) => handleBidAdjustment('weather', { ...formData.bidAdjustments.weather, rainy: Number(e.target.value) })}
                        placeholder="1.0"
                      />
                    </div>
                    <div>
                      <Label>Cold</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.bidAdjustments.weather.cold || 1}
                        onChange={(e) => handleBidAdjustment('weather', { ...formData.bidAdjustments.weather, cold: Number(e.target.value) })}
                        placeholder="1.0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Accordion.Content>
          </Accordion.Item>
        </Card>
      </Accordion>

      {/* Additional Settings */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">Additional Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
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
              onChange={(e) => onFormDataChange('exclusions', { ...formData.exclusions, sites: e.target.value.split('\n').filter(Boolean) })}
            />
          </div>
          
          <div>
            <Label>IP Exclusions</Label>
            <Textarea
              placeholder="Enter IP addresses to exclude (one per line)..."
              rows={3}
              value={formData.exclusions.ips.join('\n')}
              onChange={(e) => onFormDataChange('exclusions', { ...formData.exclusions, ips: e.target.value.split('\n').filter(Boolean) })}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}