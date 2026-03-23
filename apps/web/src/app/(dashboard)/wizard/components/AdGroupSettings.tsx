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

interface AdGroupSettingsProps {
  formData: any
  onFormDataChange: (field: string, value: any) => void
  onGenerateKeywords: () => void
  aiLoading: boolean
}

const SCENARIOS = [
  { value: 'all', label: 'All Interested Audience', description: 'New + existing (maximal coverage)' },
  { value: 'new', label: 'New Audience Only', description: 'Define your own targeting (retargeting excluded)' }
]

const MATCH_TYPES = [
  { value: 'broad', label: 'Broad' },
  { value: 'phrase', label: 'Phrase' },
  { value: 'exact', label: 'Exact' }
]

const GEO_MODES = [
  { value: 'list', label: 'List Mode' },
  { value: 'map', label: 'Map Mode' }
]

export function AdGroupSettings({ 
  formData, 
  onFormDataChange, 
  onGenerateKeywords, 
  aiLoading 
}: AdGroupSettingsProps) {
  const { generateKeywords } = useAiAgent()
  const [activeAutoTargeting, setActiveAutoTargeting] = useState<string[]>([])
  const [activeSegments, setActiveSegments] = useState<string[]>([])

  const handleAutoTargetingToggle = (targeting: string) => {
    setActiveAutoTargeting(prev => 
      prev.includes(targeting) 
        ? prev.filter(t => t !== targeting)
        : [...prev, targeting]
    )
  }

  const handleSegmentToggle = (segment: string) => {
    setActiveSegments(prev => 
      prev.includes(segment) 
        ? prev.filter(s => s !== segment)
        : [...prev, segment]
    )
  }

  const handleGeoModeChange = (mode: string) => {
    onFormDataChange('geoTargeting', {
      ...formData.geoTargeting,
      mode
    })
  }

  const handleKeywordMatchType = (index: number, matchType: string) => {
    const updatedKeywords = [...formData.keywords]
    updatedKeywords[index] = { ...updatedKeywords[index], matchType }
    onFormDataChange('keywords', updatedKeywords)
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-white">Ad Group Settings</h2>
      
      {/* Basic Settings */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="adGroupName">Ad Group Name</Label>
            <Input
              id="adGroupName"
              value={formData.name}
              onChange={(e) => onFormDataChange('name', e.target.value)}
              placeholder="Enter ad group name"
            />
          </div>
          
          <div>
            <Label htmlFor="scenario">Scenario</Label>
            <Select
              id="scenario"
              value={formData.scenario}
              onChange={(e) => onFormDataChange('scenario', e.target.value)}
            >
              {SCENARIOS.map(scenario => (
                <option key={scenario.value} value={scenario.value}>{scenario.label}</option>
              ))}
            </Select>
            <p className="text-sm text-[#6B7280] mt-1">{SCENARIOS.find(s => s.value === formData.scenario)?.description}</p>
          </div>
        </div>
      </Card>

      {/* Geo Targeting */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">Geo Targeting</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Mode</Label>
            <div className="flex gap-2">
              <Button
                variant={formData.geoTargeting.mode === 'list' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handleGeoModeChange('list')}
              >
                List Mode
              </Button>
              <Button
                variant={formData.geoTargeting.mode === 'map' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handleGeoModeChange('map')}
              >
                Map Mode
              </Button>
            </div>
          </div>
          
          {formData.geoTargeting.mode === 'list' && (
            <div>
              <Label>Locations</Label>
              <Textarea
                placeholder="Enter locations (one per line)..."
                rows={4}
                value={formData.geoTargeting.locations.join('\n')}
                onChange={(e) => onFormDataChange('geoTargeting', { ...formData.geoTargeting, locations: e.target.value.split('\n').filter(Boolean) })}
              />
            </div>
          )}
          
          {formData.geoTargeting.mode === 'map' && (
            <div>
              <Label>City</Label>
              <Input
                placeholder="Enter city name"
                value={formData.geoTargeting.city}
                onChange={(e) => onFormDataChange('geoTargeting', { ...formData.geoTargeting, city: e.target.value })}
              />
              <Label className="mt-2">Radius (meters)</Label>
              <Input
                type="number"
                placeholder="1000"
                value={formData.geoTargeting.radius_meters}
                onChange={(e) => onFormDataChange('geoTargeting', { ...formData.geoTargeting, radius_meters: Number(e.target.value) })}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Auto Targeting (AI-based) */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">Auto Targeting (AI-based)</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Checkbox
                id="directQueries"
                checked={activeAutoTargeting.includes('directQueries')}
                onChange={() => handleAutoTargetingToggle('directQueries')}
              />
              <div>
                <Label htmlFor="directQueries">Direct Queries</Label>
                <p className="text-sm text-[#6B7280]">Product-specific queries</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Checkbox
                id="narrowQueries"
                checked={activeAutoTargeting.includes('narrowQueries')}
                onChange={() => handleAutoTargetingToggle('narrowQueries')}
              />
              <div>
                <Label htmlFor="narrowQueries">Narrow Queries</Label>
                <p className="text-sm text-[#6B7280]">Specific specifications</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Checkbox
                id="broadQueries"
                checked={activeAutoTargeting.includes('broadQueries')}
                onChange={() => handleAutoTargetingToggle('broadQueries')}
              />
              <div>
                <Label htmlFor="broadQueries">Broad Queries</Label>
                <p className="text-sm text-[#6B7280]">General category</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Checkbox
                id="additionalQueries"
                checked={activeAutoTargeting.includes('additionalQueries')}
                onChange={() => handleAutoTargetingToggle('additionalQueries')}
              />
              <div>
                <Label htmlFor="additionalQueries">Additional Queries</Label>
                <p className="text-sm text-[#6B7280]">Related products</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Checkbox
                id="alternativeQueries"
                checked={activeAutoTargeting.includes('alternativeQueries')}
                onChange={() => handleAutoTargetingToggle('alternativeQueries')}
              />
              <div>
                <Label htmlFor="alternativeQueries">Alternative Queries</Label>
                <p className="text-sm text-[#6B7280]">Alternative solutions</p>
              </div>
            </div>
          </div>

          {/* Brand Reminders */}
          <div>
            <h4 className="text-md font-medium text-white mb-3">Brand Reminders</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="ownBrand"
                  checked={activeAutoTargeting.includes('ownBrand')}
                  onChange={() => handleAutoTargetingToggle('ownBrand')}
                />
                <Label htmlFor="ownBrand">Own Brand</Label>
              </div>
              
              <div className="flex items-center gap-3">
                <Checkbox
                  id="competitorBrands"
                  checked={activeAutoTargeting.includes('competitorBrands')}
                  onChange={() => handleAutoTargetingToggle('competitorBrands')}
                />
                <Label htmlFor="competitorBrands">Competitor Brands</Label>
              </div>
              
              <div className="flex items-center gap-3">
                <Checkbox
                  id="brandlessQueries"
                  checked={activeAutoTargeting.includes('brandlessQueries')}
                  onChange={() => handleAutoTargetingToggle('brandlessQueries')}
                />
                <Label htmlFor="brandlessQueries">Brandless Queries</Label>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Keywords */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Keywords</h3>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => generateKeywords({ productName: formData.name, niche: formData.scenario, platform: 'meta', matchType: 'broad' })}
            disabled={aiLoading}
          >
            {aiLoading ? 'Generating...' : 'AI Generate Keywords'}
          </Button>
        </div>
        
        <div className="space-y-4">
          {formData.keywords.map((keyword: any, index: number) => (
            <div key={index} className="flex gap-4 items-end">
              <div className="flex-1">
                <Input
                  placeholder="Enter keyword"
                  value={keyword.phrase}
                  onChange={(e) => {
                    const updatedKeywords = [...formData.keywords]
                    updatedKeywords[index] = { ...updatedKeywords[index], phrase: e.target.value }
                    onFormDataChange('keywords', updatedKeywords)
                  }}
                />
              </div>
              <div>
                <Select
                  value={keyword.matchType}
                  onChange={(e) => handleKeywordMatchType(index, e.target.value)}
                >
                  {MATCH_TYPES.map(match => (
                    <option key={match.value} value={match.value}>{match.label}</option>
                  ))}
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={keyword.isNegative}
                  onChange={(checked) => {
                    const updatedKeywords = [...formData.keywords]
                    updatedKeywords[index] = { ...updatedKeywords[index], isNegative: checked }
                    onFormDataChange('keywords', updatedKeywords)
                  }}
                />
                <Label>Negative</Label>
              </div>
            </div>
          ))}
          
          <Button
            variant="secondary"
            onClick={() => onFormDataChange('keywords', [...formData.keywords, { phrase: '', matchType: 'broad', isNegative: false }])}
          >
            Add Keyword
          </Button>
        </div>
      </Card>

      {/* Interests & Habits */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">Interests & Habits</h3>
        <div className="space-y-4">
          <div>
            <Label>Custom Interests</Label>
            <Textarea
              placeholder="e.g., 'sports enthusiasts aged 25-35'"
              rows={4}
              value={formData.interests.custom}
              onChange={(e) => onFormDataChange('interests', { ...formData.interests, custom: e.target.value })}
            />
            <p className="text-sm text-[#6B7280] mt-1">AI will parse this and suggest platform-specific segments</p>
          </div>
        </div>
      </Card>

      {/* Audience Segments & Retargeting */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">Audience Segments & Retargeting</h3>
        
        <div className="space-y-4">
          {/* Preset Segments */}
          <div>
            <h4 className="text-md font-medium text-white mb-3">Preset Segments</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="buyers"
                  checked={activeSegments.includes('buyers')}
                  onChange={() => handleSegmentToggle('buyers')}
                />
                <div>
                  <Label htmlFor="buyers">Buyers</Label>
                  <p className="text-sm text-[#6B7280]">At least 1 purchase</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Checkbox
                  id="frequentBuyers"
                  checked={activeSegments.includes('frequentBuyers')}
                  onChange={() => handleSegmentToggle('frequentBuyers')}
                />
                <div>
                  <Label htmlFor="frequentBuyers">Frequent Buyers</Label>
                  <p className="text-sm text-[#6B7280]">Multiple purchases</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Checkbox
                  id="lookalike"
                  checked={activeSegments.includes('lookalike')}
                  onChange={() => handleSegmentToggle('lookalike')}
                />
                <div>
                  <Label htmlFor="lookalike">Lookalike</Label>
                  <p className="text-sm text-[#6B7280]">Similar to buyers</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Checkbox
                  id="abandonedCart"
                  checked={activeSegments.includes('abandonedCart')}
                  onChange={() => handleSegmentToggle('abandonedCart')}
                />
                <div>
                  <Label htmlFor="abandonedCart">Abandoned Cart</Label>
                  <p className="text-sm text-[#6B7280]">Viewed but didn't buy</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Checkbox
                  id="viewedNotBought"
                  checked={activeSegments.includes('viewedNotBought')}
                  onChange={() => handleSegmentToggle('viewedNotBought')}
                />
                <div>
                  <Label htmlFor="viewedNotBought">Viewed Not Bought</Label>
                  <p className="text-sm text-[#6B7280]">Saw product but didn't purchase</p>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Rule Builder */}
          <div>
            <h4 className="text-md font-medium text-white mb-3">Custom Rule Builder</h4>
            <Card padding="md">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Rule Name</Label>
                    <Input
                      placeholder="e.g., High Value Customers"
                      value={formData.customRule.name}
                      onChange={(e) => onFormDataChange('customRule', { ...formData.customRule, name: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label>Logic</Label>
                    <Select
                      value={formData.customRule.logic}
                      onChange={(e) => onFormDataChange('customRule', { ...formData.customRule, logic: e.target.value })}
                    >
                      <option value="OR">At least one (OR)</option>
                      <option value="AND">All conditions (AND)</option>
                      <option value="NOT">None of (NOT)</option>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Targeting Type</Label>
                    <Select
                      value={formData.customRule.targetingType}
                      onChange={(e) => onFormDataChange('customRule', { ...formData.customRule, targetingType: e.target.value })}
                    >
                      <option value="metric">Metric Goal</option>
                      <option value="audience">Audience Segment</option>
                      <option value="behavior">User Behavior</option>
                    </Select>
                  </div>
                </div>

                {/* Rule Conditions */}
                <div>
                  <Label>Conditions</Label>
                  <div className="space-y-2">
                    {formData.customRule.conditions.map((condition: any, index: number) => (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Input
                            placeholder="e.g., 'Purchase Value > 1000'"
                            value={condition.description}
                            onChange={(e) => {
                              const updatedConditions = [...formData.customRule.conditions]
                              updatedConditions[index] = { ...updatedConditions[index], description: e.target.value }
                              onFormDataChange('customRule', { ...formData.customRule, conditions: updatedConditions })
                            }}
                          />
                        </div>
                        <div>
                          <Input
                            type="number"
                            placeholder="Days"
                            value={condition.days}
                            onChange={(e) => {
                              const updatedConditions = [...formData.customRule.conditions]
                              updatedConditions[index] = { ...updatedConditions[index], days: Number(e.target.value) }
                              onFormDataChange('customRule', { ...formData.customRule, conditions: updatedConditions })
                            }}
                          />
                        </div>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            const updatedConditions = formData.customRule.conditions.filter((_: any, i: number) => i !== index)
                            onFormDataChange('customRule', { ...formData.customRule, conditions: updatedConditions })
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="secondary"
                      onClick={() => onFormDataChange('customRule', { 
                        ...formData.customRule, 
                        conditions: [...formData.customRule.conditions, { description: '', days: 30 }] 
                      })}
                    >
                      Add Condition
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Offer Retargeting */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="offerRetargeting"
                checked={formData.offerRetargeting}
                onChange={(checked) => onFormDataChange('offerRetargeting', checked)}
              />
              <Label htmlFor="offerRetargeting">Enable Offer Retargeting</Label>
            </div>
          </div>

          {/* Targeting Logic Visualization */}
          <div>
            <h4 className="text-md font-medium text-white mb-3">Targeting Logic</h4>
            <div className="bg-[#1F1F2E] p-4 rounded-lg">
              <p className="text-sm text-[#6B7280]">
                Visual representation of targeting logic: {activeSegments.join(' OR ')} 
                {activeAutoTargeting.length > 0 && ` AND (${activeAutoTargeting.join(' OR ')})`}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Ad Group Extensions */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">Ad Group Extensions</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="groupQuickLinks"
              checked={formData.extensions.quickLinks}
              onChange={(checked) => onFormDataChange('extensions', { ...formData.extensions, quickLinks: checked })}
            />
            <Label htmlFor="groupQuickLinks">Quick Links (Override Campaign)</Label>
          </div>
          
          <div className="flex items-center gap-3">
            <Checkbox
              id="groupClarifiers"
              checked={formData.extensions.clarifiers}
              onChange={(checked) => onFormDataChange('extensions', { ...formData.extensions, clarifiers: checked })}
            />
            <Label htmlFor="groupClarifiers">Clarifiers (Override Campaign)</Label>
          </div>
          
          <div className="flex items-center gap-3">
            <Checkbox
              id="groupPromoCode"
              checked={formData.extensions.promoCode}
              onChange={(checked) => onFormDataChange('extensions', { ...formData.extensions, promoCode: checked })}
            />
            <Label htmlFor="groupPromoCode">Promo Code (Override Campaign)</Label>
          </div>
        </div>
      </Card>

      {/* Ad Group URL Parameters */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">Ad Group URL Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>UTM Content</Label>
            <Input
              placeholder="{ad_group_name}"
              value={formData.urlParams.utmContent}
              onChange={(e) => onFormDataChange('urlParams', { ...formData.urlParams, utmContent: e.target.value })}
            />
            <p className="text-sm text-[#6B7280] mt-1">Dynamic parameter: {ad_group_name}</p>
          </div>
          
          <div>
            <Label>Custom Parameters</Label>
            <Textarea
              placeholder="e.g., ad_group_id=123&source=wizard"
              rows={3}
              value={formData.urlParams.custom}
              onChange={(e) => onFormDataChange('urlParams', { ...formData.urlParams, custom: e.target.value })}
            />
          </div>
        </div>
      </Card>

      {/* Ad Group Bid Adjustments */}
      <Accordion type="multiple">
        <Card padding="lg">
          <Accordion.Item value="group-bid-adjustments">
            <Accordion.Trigger>
              <h3 className="text-lg font-semibold text-white">Ad Group Bid Adjustments</h3>
            </Accordion.Trigger>
            <Accordion.Content>
              <div className="space-y-6">
                <div>
                  <h4 className="text-md font-medium text-white mb-3">Override Campaign Adjustments</h4>
                  <p className="text-sm text-[#6B7280] mb-4">
                    These adjustments will override the campaign-level bid adjustments for this ad group
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label>Age/Gender Multiplier</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.bidAdjustments.ageGender || 1}
                        onChange={(e) => onFormDataChange('bidAdjustments', { ...formData.bidAdjustments, ageGender: Number(e.target.value) })}
                        placeholder="1.0"
                      />
                    </div>
                    <div>
                      <Label>Device Multiplier</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.bidAdjustments.device || 1}
                        onChange={(e) => onFormDataChange('bidAdjustments', { ...formData.bidAdjustments, device: Number(e.target.value) })}
                        placeholder="1.0"
                      />
                    </div>
                    <div>
                      <Label>Audience Multiplier</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.bidAdjustments.audience || 1}
                        onChange={(e) => onFormDataChange('bidAdjustments', { ...formData.bidAdjustments, audience: Number(e.target.value) })}
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

      {/* Content Type */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">Content Type</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="adultContent"
                checked={formData.contentType.adult}
                onChange={(checked) => onFormDataChange('contentType', { ...formData.contentType, adult: checked })}
              />
              <Label htmlFor="adultContent">Show to adults only</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="sensitiveContent"
                checked={formData.contentType.sensitive}
                onChange={(checked) => onFormDataChange('contentType', { ...formData.contentType, sensitive: checked })}
              />
              <Label htmlFor="sensitiveContent">Sensitive content</Label>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}