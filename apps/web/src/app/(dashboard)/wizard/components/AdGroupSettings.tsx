'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Accordion } from '@/components/ui/accordion'
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

function BidInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
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

export function AdGroupSettings({
  formData,
  onFormDataChange,
  onGenerateKeywords,
  aiLoading
}: AdGroupSettingsProps) {
  const { generateKeywords } = useAiAgent()

  const [activeAutoTargeting, setActiveAutoTargeting] = useState<string[]>([])
  const [activeSegments, setActiveSegments] = useState<string[]>([])
  const [geoInput, setGeoInput] = useState('')
  const [activeGroupExtensions, setActiveGroupExtensions] = useState<string[]>([])
  const [aiInterestLoading, setAiInterestLoading] = useState(false)
  const [parsedInterests, setParsedInterests] = useState<string[]>([])

  const toggleAutoTargeting = (t: string) =>
    setActiveAutoTargeting(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const toggleSegment = (s: string) =>
    setActiveSegments(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const toggleGroupExtension = (ext: string) =>
    setActiveGroupExtensions(prev => prev.includes(ext) ? prev.filter(x => x !== ext) : [...prev, ext])

  // --- Geo helpers ---
  const geoLocations: string[] = formData.geoTargeting?.locations ?? []

  const addGeoLocation = () => {
    const val = geoInput.trim()
    if (val && !geoLocations.includes(val)) {
      onFormDataChange('geoTargeting', { ...formData.geoTargeting, locations: [...geoLocations, val] })
    }
    setGeoInput('')
  }

  const removeGeoLocation = (loc: string) => {
    onFormDataChange('geoTargeting', {
      ...formData.geoTargeting,
      locations: geoLocations.filter(l => l !== loc)
    })
  }

  const handleGeoKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addGeoLocation() }
  }

  // --- Group extensions: Quick links ---
  const groupQuickLinks: { title: string; url: string; desc: string }[] =
    formData.extensions?.quickLinksList ?? [{ title: '', url: '', desc: '' }]

  const updateGroupQuickLink = (i: number, field: string, val: string) => {
    const updated = groupQuickLinks.map((item, idx) => idx === i ? { ...item, [field]: val } : item)
    onFormDataChange('extensions', { ...formData.extensions, quickLinksList: updated })
  }
  const addGroupQuickLink = () => {
    if (groupQuickLinks.length < 8)
      onFormDataChange('extensions', { ...formData.extensions, quickLinksList: [...groupQuickLinks, { title: '', url: '', desc: '' }] })
  }
  const removeGroupQuickLink = (i: number) => {
    onFormDataChange('extensions', { ...formData.extensions, quickLinksList: groupQuickLinks.filter((_, idx) => idx !== i) })
  }

  // --- Group extensions: Clarifiers ---
  const groupClarifiers: string[] = formData.extensions?.clarifiersList ?? ['']
  const updateGroupClarifier = (i: number, val: string) => {
    const updated = groupClarifiers.map((item, idx) => (idx === i ? val : item))
    onFormDataChange('extensions', { ...formData.extensions, clarifiersList: updated })
  }
  const addGroupClarifier = () => {
    if (groupClarifiers.length < 8)
      onFormDataChange('extensions', { ...formData.extensions, clarifiersList: [...groupClarifiers, ''] })
  }
  const removeGroupClarifier = (i: number) => {
    onFormDataChange('extensions', { ...formData.extensions, clarifiersList: groupClarifiers.filter((_, idx) => idx !== i) })
  }

  // --- Bid adjustments (group) ---
  const groupBid = formData.bidAdjustments ?? {}
  const setGroupBid = (category: string, val: any) =>
    onFormDataChange('bidAdjustments', { ...groupBid, [category]: val })

  // --- AI parse interests ---
  const handleAiParseInterests = async () => {
    const raw = formData.interests?.custom ?? ''
    if (!raw.trim()) return
    setAiInterestLoading(true)
    try {
      // Simple client-side parse: split by comma/semicolon and trim
      const segments = raw
        .split(/[,;،\n]+/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 2)
      setParsedInterests(segments)
      onFormDataChange('interests', { ...formData.interests, parsed: segments })
    } finally {
      setAiInterestLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-white">Ad Group Settings</h2>

      {/* Basic Info */}
      <Card className="p-8">
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
              {SCENARIOS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
            <p className="text-xs text-[#6B7280] mt-1">
              {SCENARIOS.find(s => s.value === formData.scenario)?.description}
            </p>
          </div>
        </div>
      </Card>

      {/* Geo Targeting */}
      <Card className="p-8">
        <h3 className="text-lg font-semibold text-white mb-4">Geo Targeting</h3>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={formData.geoTargeting?.mode === 'list' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onFormDataChange('geoTargeting', { ...formData.geoTargeting, mode: 'list' })}
          >
            List Mode
          </Button>
          <Button
            variant={formData.geoTargeting?.mode === 'map' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onFormDataChange('geoTargeting', { ...formData.geoTargeting, mode: 'map' })}
          >
            Map Mode
          </Button>
        </div>

        {/* List mode — chips */}
        {formData.geoTargeting?.mode === 'list' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Shahar yoki mamlakat qo'shing (Enter)"
                value={geoInput}
                onChange={(e) => setGeoInput(e.target.value)}
                onKeyDown={handleGeoKeyDown}
              />
              <Button variant="secondary" size="sm" onClick={addGeoLocation}>
                Qo'shish
              </Button>
            </div>

            {geoLocations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {geoLocations.map(loc => (
                  <span
                    key={loc}
                    className="flex items-center gap-1 bg-[#1F2937] text-white text-sm px-3 py-1 rounded-full"
                  >
                    {loc}
                    <button
                      onClick={() => removeGeoLocation(loc)}
                      className="text-[#9CA3AF] hover:text-white ml-1"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

            {geoLocations.length === 0 && (
              <p className="text-xs text-[#6B7280]">Hech qaysi joy tanlanmagan</p>
            )}
          </div>
        )}

        {/* Map mode — city + radius */}
        {formData.geoTargeting?.mode === 'map' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Shahar</Label>
              <Input
                placeholder="Masalan: Toshkent"
                value={formData.geoTargeting.city ?? ''}
                onChange={(e) =>
                  onFormDataChange('geoTargeting', { ...formData.geoTargeting, city: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Radius (km)</Label>
              <Input
                type="number"
                min="1"
                placeholder="10"
                value={formData.geoTargeting.radiusKm ?? ''}
                onChange={(e) =>
                  onFormDataChange('geoTargeting', { ...formData.geoTargeting, radiusKm: Number(e.target.value) })
                }
              />
              <p className="text-xs text-[#6B7280] mt-1">
                Markazdan {formData.geoTargeting.radiusKm || 10} km radius
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Auto Targeting */}
      <Card className="p-8">
        <h3 className="text-lg font-semibold text-white mb-4">Auto Targeting (AI-based)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { id: 'directQueries', label: 'Direct Queries', desc: 'Mahsulotga oid aniq so\'rovlar' },
            { id: 'narrowQueries', label: 'Narrow Queries', desc: 'Aniq xususiyatlar' },
            { id: 'broadQueries', label: 'Broad Queries', desc: 'Umumiy kategoriya' },
            { id: 'additionalQueries', label: 'Additional Queries', desc: 'Bog\'liq mahsulotlar' },
            { id: 'alternativeQueries', label: 'Alternative Queries', desc: 'Muqobil yechimlar' },
          ].map(({ id, label, desc }) => (
            <div key={id} className="flex items-center gap-3">
              <Checkbox
                id={id}
                checked={activeAutoTargeting.includes(id)}
                onChange={() => toggleAutoTargeting(id)}
              />
              <div>
                <Label htmlFor={id}>{label}</Label>
                <p className="text-xs text-[#6B7280]">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium text-white mb-3">Brand Reminders</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'ownBrand', label: 'Own Brand' },
              { id: 'competitorBrands', label: 'Competitor Brands' },
              { id: 'brandlessQueries', label: 'Brandless Queries' },
            ].map(({ id, label }) => (
              <div key={id} className="flex items-center gap-3">
                <Checkbox
                  id={id}
                  checked={activeAutoTargeting.includes(id)}
                  onChange={() => toggleAutoTargeting(id)}
                />
                <Label htmlFor={id}>{label}</Label>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Keywords */}
      <Card className="p-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Keywords</h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              generateKeywords({
                productName: formData.name,
                niche: formData.scenario,
                platform: 'meta',
                matchType: 'broad'
              })
            }
            disabled={aiLoading}
          >
            {aiLoading ? 'Generating...' : 'AI Generate'}
          </Button>
        </div>

        <div className="space-y-3">
          {(formData.keywords ?? []).map((keyword: any, index: number) => (
            <div key={index} className="flex gap-3 items-center">
              <div className="flex-1">
                <Input
                  placeholder="Kalit so'z"
                  value={keyword.phrase}
                  onChange={(e) => {
                    const updated = [...formData.keywords]
                    updated[index] = { ...updated[index], phrase: e.target.value }
                    onFormDataChange('keywords', updated)
                  }}
                />
              </div>
              <Select
                value={keyword.matchType}
                onChange={(e) => {
                  const updated = [...formData.keywords]
                  updated[index] = { ...updated[index], matchType: e.target.value }
                  onFormDataChange('keywords', updated)
                }}
              >
                {MATCH_TYPES.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </Select>
              <div className="flex items-center gap-2">
                <Switch
                  checked={keyword.isNegative}
                  onChange={(checked) => {
                    const updated = [...formData.keywords]
                    updated[index] = { ...updated[index], isNegative: checked }
                    onFormDataChange('keywords', updated)
                  }}
                />
                <span className="text-xs text-[#9CA3AF]">Minus</span>
              </div>
              <button
                onClick={() =>
                  onFormDataChange('keywords', formData.keywords.filter((_: any, i: number) => i !== index))
                }
                className="text-[#EF4444] hover:text-red-400 text-sm"
              >
                ✕
              </button>
            </div>
          ))}

          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              onFormDataChange('keywords', [
                ...(formData.keywords ?? []),
                { phrase: '', matchType: 'broad', isNegative: false }
              ])
            }
          >
            + Kalit so'z qo'shish
          </Button>
        </div>
      </Card>

      {/* Interests & Habits */}
      <Card className="p-8">
        <h3 className="text-lg font-semibold text-white mb-4">Interests & Habits</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Qiziqishlar (erkin matn)</Label>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAiParseInterests}
                disabled={aiInterestLoading}
              >
                {aiInterestLoading ? 'Parsing...' : 'AI Parse'}
              </Button>
            </div>
            <Textarea
              placeholder="Masalan: 'sport bilan shug'ullanuvchi 25-35 yoshli erkaklar, fitness, sog'lom ovqatlanish'"
              rows={3}
              value={formData.interests?.custom ?? ''}
              onChange={(e) =>
                onFormDataChange('interests', { ...formData.interests, custom: e.target.value })
              }
            />
            <p className="text-xs text-[#6B7280] mt-1">
              AI bu matnni platforma segmentlariga aylantiradi
            </p>
          </div>

          {/* Parsed interests chips */}
          {(parsedInterests.length > 0 || (formData.interests?.parsed ?? []).length > 0) && (
            <div>
              <p className="text-xs text-[#9CA3AF] mb-2">Aniqlangan segmentlar:</p>
              <div className="flex flex-wrap gap-2">
                {(parsedInterests.length > 0 ? parsedInterests : formData.interests?.parsed ?? []).map(
                  (seg: string) => (
                    <span
                      key={seg}
                      className="bg-[#6366F1]/20 text-[#A5B4FC] text-xs px-3 py-1 rounded-full border border-[#6366F1]/30"
                    >
                      {seg}
                    </span>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Audience Segments & Retargeting */}
      <Card className="p-8">
        <h3 className="text-lg font-semibold text-white mb-4">Audience Segments & Retargeting</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { id: 'buyers', label: 'Buyers', desc: 'Kamida 1 xarid' },
              { id: 'frequentBuyers', label: 'Frequent Buyers', desc: 'Ko\'p marta xarid' },
              { id: 'lookalike', label: 'Lookalike', desc: 'Xaridorlarga o\'xshash' },
              { id: 'abandonedCart', label: 'Abandoned Cart', desc: 'Savatga qo\'yib ketgan' },
              { id: 'viewedNotBought', label: 'Viewed Not Bought', desc: 'Ko\'rgan, xarid qilmagan' },
            ].map(({ id, label, desc }) => (
              <div key={id} className="flex items-center gap-3">
                <Checkbox
                  id={id}
                  checked={activeSegments.includes(id)}
                  onChange={() => toggleSegment(id)}
                />
                <div>
                  <Label htmlFor={id}>{label}</Label>
                  <p className="text-xs text-[#6B7280]">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Custom Rule Builder */}
          <div>
            <h4 className="text-sm font-medium text-white mb-3">Custom Rule Builder</h4>
            <Card className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Rule Name</Label>
                    <Input
                      placeholder="Masalan: Qadrli mijozlar"
                      value={formData.customRule?.name ?? ''}
                      onChange={(e) =>
                        onFormDataChange('customRule', { ...formData.customRule, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Logic</Label>
                    <Select
                      value={formData.customRule?.logic ?? 'OR'}
                      onChange={(e) =>
                        onFormDataChange('customRule', { ...formData.customRule, logic: e.target.value })
                      }
                    >
                      <option value="OR">At least one (OR)</option>
                      <option value="AND">All conditions (AND)</option>
                      <option value="NOT">None of (NOT)</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Targeting Type</Label>
                    <Select
                      value={formData.customRule?.targetingType ?? 'metric'}
                      onChange={(e) =>
                        onFormDataChange('customRule', { ...formData.customRule, targetingType: e.target.value })
                      }
                    >
                      <option value="metric">Metric Goal</option>
                      <option value="audience">Audience Segment</option>
                      <option value="behavior">User Behavior</option>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Conditions</Label>
                  <div className="space-y-2">
                    {(formData.customRule?.conditions ?? []).map((cond: any, i: number) => (
                      <div key={i} className="flex gap-2 items-center">
                        <div className="flex-1">
                          <Input
                            placeholder="Masalan: Purchase Value > 1000"
                            value={cond.description}
                            onChange={(e) => {
                              const updated = [...formData.customRule.conditions]
                              updated[i] = { ...updated[i], description: e.target.value }
                              onFormDataChange('customRule', { ...formData.customRule, conditions: updated })
                            }}
                          />
                        </div>
                        <Input
                          type="number"
                          placeholder="Kunlar"
                          value={cond.days}
                          className="w-24"
                          onChange={(e) => {
                            const updated = [...formData.customRule.conditions]
                            updated[i] = { ...updated[i], days: Number(e.target.value) }
                            onFormDataChange('customRule', { ...formData.customRule, conditions: updated })
                          }}
                        />
                        <button
                          onClick={() => {
                            const updated = formData.customRule.conditions.filter((_: any, j: number) => j !== i)
                            onFormDataChange('customRule', { ...formData.customRule, conditions: updated })
                          }}
                          className="text-[#EF4444] hover:text-red-400 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        onFormDataChange('customRule', {
                          ...formData.customRule,
                          conditions: [...(formData.customRule?.conditions ?? []), { description: '', days: 30 }]
                        })
                      }
                    >
                      + Shart qo'shish
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="offerRetargeting"
              checked={formData.offerRetargeting ?? false}
              onChange={(checked) => onFormDataChange('offerRetargeting', checked)}
            />
            <Label htmlFor="offerRetargeting">Enable Offer Retargeting</Label>
          </div>

          <div>
            <h4 className="text-sm font-medium text-white mb-2">Targeting Logic</h4>
            <div className="bg-[#F9FAFB] p-3 rounded-lg">
              <p className="text-xs text-[#6B7280]">
                {activeSegments.length > 0
                  ? activeSegments.join(' OR ')
                  : 'Hech qaysi segment tanlanmagan'}
                {activeAutoTargeting.length > 0 && ` AND (${activeAutoTargeting.join(' OR ')})`}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Ad Group Extensions */}
      <Card className="p-8">
        <h3 className="text-lg font-semibold text-white mb-4">Ad Group Extensions</h3>
        <div className="space-y-4">

          {/* Quick Links */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="groupQuickLinks"
              checked={activeGroupExtensions.includes('quickLinks')}
              onChange={() => toggleGroupExtension('quickLinks')}
            />
            <Label htmlFor="groupQuickLinks">Quick Links (Kampaniya ustini yozadi)</Label>
          </div>

          {activeGroupExtensions.includes('quickLinks') && (
            <div className="ml-6 space-y-3">
              {groupQuickLinks.map((link, i) => (
                <div key={i} className="border border-[#374151] rounded-lg p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-[#9CA3AF]">Quick Link {i + 1}</span>
                    {groupQuickLinks.length > 1 && (
                      <button onClick={() => removeGroupQuickLink(i)} className="text-xs text-[#EF4444]">
                        O'chirish
                      </button>
                    )}
                  </div>
                  <Input
                    placeholder="Sarlavha (maks 25 belgi)"
                    value={link.title}
                    maxLength={25}
                    onChange={(e) => updateGroupQuickLink(i, 'title', e.target.value)}
                  />
                  <Input
                    placeholder="URL (https://...)"
                    value={link.url}
                    onChange={(e) => updateGroupQuickLink(i, 'url', e.target.value)}
                  />
                  <Input
                    placeholder="Qisqa tavsif (ixtiyoriy)"
                    value={link.desc}
                    onChange={(e) => updateGroupQuickLink(i, 'desc', e.target.value)}
                  />
                </div>
              ))}
              {groupQuickLinks.length < 8 && (
                <Button variant="secondary" size="sm" onClick={addGroupQuickLink}>
                  + Quick Link qo'shish
                </Button>
              )}
            </div>
          )}

          {/* Clarifiers */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="groupClarifiers"
              checked={activeGroupExtensions.includes('clarifiers')}
              onChange={() => toggleGroupExtension('clarifiers')}
            />
            <Label htmlFor="groupClarifiers">Clarifiers (Kampaniya ustini yozadi)</Label>
          </div>

          {activeGroupExtensions.includes('clarifiers') && (
            <div className="ml-6 space-y-2">
              {groupClarifiers.map((text, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder={`Clarifier ${i + 1} (maks 25 belgi)`}
                    value={text}
                    maxLength={25}
                    onChange={(e) => updateGroupClarifier(i, e.target.value)}
                  />
                  {groupClarifiers.length > 1 && (
                    <button onClick={() => removeGroupClarifier(i)} className="text-[#EF4444] px-2">✕</button>
                  )}
                </div>
              ))}
              {groupClarifiers.length < 8 && (
                <Button variant="secondary" size="sm" onClick={addGroupClarifier}>
                  + Clarifier qo'shish
                </Button>
              )}
            </div>
          )}

          {/* Promo Code */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="groupPromoCode"
              checked={activeGroupExtensions.includes('promoCode')}
              onChange={() => toggleGroupExtension('promoCode')}
            />
            <Label htmlFor="groupPromoCode">Promo Code (Kampaniya ustini yozadi)</Label>
          </div>

          {activeGroupExtensions.includes('promoCode') && (
            <div className="ml-6">
              <Input
                placeholder="Promo kod (masalan: GROUP25)"
                value={formData.extensions?.promoCode ?? ''}
                onChange={(e) =>
                  onFormDataChange('extensions', { ...formData.extensions, promoCode: e.target.value })
                }
              />
            </div>
          )}
        </div>
      </Card>

      {/* URL Parameters */}
      <Card className="p-8">
        <h3 className="text-lg font-semibold text-white mb-4">Ad Group URL Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>UTM Content</Label>
            <Input
              placeholder="{ad_group_name}"
              value={formData.urlParams?.utmContent ?? ''}
              onChange={(e) => onFormDataChange('urlParams', { ...formData.urlParams, utmContent: e.target.value })}
            />
            <p className="text-xs text-[#6B7280] mt-1">Dinamik: {'{ad_group_name}'}</p>
          </div>
          <div>
            <Label>Custom Parameters</Label>
            <Textarea
              placeholder="e.g., ad_group_id=123&source=wizard"
              rows={3}
              value={formData.urlParams?.custom ?? ''}
              onChange={(e) => onFormDataChange('urlParams', { ...formData.urlParams, custom: e.target.value })}
            />
          </div>
        </div>
      </Card>

      {/* Bid Adjustments (Group Level) — 7 types */}
      <Accordion type="multiple">
        <Card className="p-8">
          <Accordion.Item value="group-bid-adjustments">
            <Accordion.Trigger>
              <h3 className="text-lg font-semibold text-white">Ad Group Bid Adjustments (7 tur)</h3>
            </Accordion.Trigger>
            <Accordion.Content>
              <div className="space-y-6 pt-4">
                <p className="text-xs text-[#6B7280]">
                  Bu sozlamalar kampaniya darajasidagi bid korreksiyalarini guruh uchun ustiga yozadi
                </p>

                {/* 1. Age/Gender */}
                <div>
                  <h4 className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">1. Yosh va Jins</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <BidInput label="Erkak" value={groupBid.genderAge?.male ?? 1}
                      onChange={v => setGroupBid('genderAge', { ...groupBid.genderAge, male: v })} />
                    <BidInput label="Ayol" value={groupBid.genderAge?.female ?? 1}
                      onChange={v => setGroupBid('genderAge', { ...groupBid.genderAge, female: v })} />
                    <BidInput label="18–24" value={groupBid.genderAge?.age18_24 ?? 1}
                      onChange={v => setGroupBid('genderAge', { ...groupBid.genderAge, age18_24: v })} />
                    <BidInput label="25–34" value={groupBid.genderAge?.age25_34 ?? 1}
                      onChange={v => setGroupBid('genderAge', { ...groupBid.genderAge, age25_34: v })} />
                    <BidInput label="35–44" value={groupBid.genderAge?.age35_44 ?? 1}
                      onChange={v => setGroupBid('genderAge', { ...groupBid.genderAge, age35_44: v })} />
                    <BidInput label="45–54" value={groupBid.genderAge?.age45_54 ?? 1}
                      onChange={v => setGroupBid('genderAge', { ...groupBid.genderAge, age45_54: v })} />
                    <BidInput label="55+" value={groupBid.genderAge?.age55plus ?? 1}
                      onChange={v => setGroupBid('genderAge', { ...groupBid.genderAge, age55plus: v })} />
                  </div>
                </div>

                {/* 2. Devices */}
                <div>
                  <h4 className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">2. Qurilmalar</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <BidInput label="Mobil" value={groupBid.devices?.mobile ?? 1}
                      onChange={v => setGroupBid('devices', { ...groupBid.devices, mobile: v })} />
                    <BidInput label="Desktop" value={groupBid.devices?.desktop ?? 1}
                      onChange={v => setGroupBid('devices', { ...groupBid.devices, desktop: v })} />
                    <BidInput label="Tablet" value={groupBid.devices?.tablet ?? 1}
                      onChange={v => setGroupBid('devices', { ...groupBid.devices, tablet: v })} />
                  </div>
                </div>

                {/* 3. Audience */}
                <div>
                  <h4 className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">3. Auditoriya</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <BidInput label="Retargeting" value={groupBid.audience?.retargeting ?? 1}
                      onChange={v => setGroupBid('audience', { ...groupBid.audience, retargeting: v })} />
                    <BidInput label="Lookalike" value={groupBid.audience?.lookalike ?? 1}
                      onChange={v => setGroupBid('audience', { ...groupBid.audience, lookalike: v })} />
                    <BidInput label="Custom" value={groupBid.audience?.custom ?? 1}
                      onChange={v => setGroupBid('audience', { ...groupBid.audience, custom: v })} />
                  </div>
                </div>

                {/* 4. Format */}
                <div>
                  <h4 className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">4. Reklama Formati</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <BidInput label="Image" value={groupBid.format?.image ?? 1}
                      onChange={v => setGroupBid('format', { ...groupBid.format, image: v })} />
                    <BidInput label="Video" value={groupBid.format?.video ?? 1}
                      onChange={v => setGroupBid('format', { ...groupBid.format, video: v })} />
                    <BidInput label="Carousel" value={groupBid.format?.carousel ?? 1}
                      onChange={v => setGroupBid('format', { ...groupBid.format, carousel: v })} />
                    <BidInput label="Collection" value={groupBid.format?.collection ?? 1}
                      onChange={v => setGroupBid('format', { ...groupBid.format, collection: v })} />
                  </div>
                </div>

                {/* 5. Income */}
                <div>
                  <h4 className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">5. Daromad darajasi</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <BidInput label="Past" value={groupBid.income?.low ?? 1}
                      onChange={v => setGroupBid('income', { ...groupBid.income, low: v })} />
                    <BidInput label="O'rta" value={groupBid.income?.medium ?? 1}
                      onChange={v => setGroupBid('income', { ...groupBid.income, medium: v })} />
                    <BidInput label="Yuqori" value={groupBid.income?.high ?? 1}
                      onChange={v => setGroupBid('income', { ...groupBid.income, high: v })} />
                  </div>
                </div>

                {/* 6. Weather */}
                <div>
                  <h4 className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">6. Ob-havo</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <BidInput label="Quyoshli" value={groupBid.weather?.sunny ?? 1}
                      onChange={v => setGroupBid('weather', { ...groupBid.weather, sunny: v })} />
                    <BidInput label="Yomg'irli" value={groupBid.weather?.rainy ?? 1}
                      onChange={v => setGroupBid('weather', { ...groupBid.weather, rainy: v })} />
                    <BidInput label="Sovuq" value={groupBid.weather?.cold ?? 1}
                      onChange={v => setGroupBid('weather', { ...groupBid.weather, cold: v })} />
                  </div>
                </div>

                {/* 7. KPI */}
                <div>
                  <h4 className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">
                    7. KPI Korreksiyasi
                    <span className="ml-2 text-[#6366F1] normal-case">(Target CPA/ROAS)</span>
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <BidInput label="Umumiy KPI" value={groupBid.kpi?.general ?? 1}
                      onChange={v => setGroupBid('kpi', { ...groupBid.kpi, general: v })} />
                    <BidInput label="Mobil KPI" value={groupBid.kpi?.mobile ?? 1}
                      onChange={v => setGroupBid('kpi', { ...groupBid.kpi, mobile: v })} />
                    <BidInput label="Desktop KPI" value={groupBid.kpi?.desktop ?? 1}
                      onChange={v => setGroupBid('kpi', { ...groupBid.kpi, desktop: v })} />
                    <BidInput label="Yangi foydalanuvchi" value={groupBid.kpi?.newUser ?? 1}
                      onChange={v => setGroupBid('kpi', { ...groupBid.kpi, newUser: v })} />
                    <BidInput label="Qaytuvchi" value={groupBid.kpi?.returning ?? 1}
                      onChange={v => setGroupBid('kpi', { ...groupBid.kpi, returning: v })} />
                    <BidInput label="Premium segment" value={groupBid.kpi?.premium ?? 1}
                      onChange={v => setGroupBid('kpi', { ...groupBid.kpi, premium: v })} />
                  </div>
                </div>
              </div>
            </Accordion.Content>
          </Accordion.Item>
        </Card>
      </Accordion>

      {/* Content Type */}
      <Card className="p-8">
        <h3 className="text-lg font-semibold text-white mb-4">Content Type</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="adultContent"
              checked={formData.contentType?.adult ?? false}
              onChange={(checked) =>
                onFormDataChange('contentType', { ...formData.contentType, adult: checked })
              }
            />
            <Label htmlFor="adultContent">Faqat kattalar uchun</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="sensitiveContent"
              checked={formData.contentType?.sensitive ?? false}
              onChange={(checked) =>
                onFormDataChange('contentType', { ...formData.contentType, sensitive: checked })
              }
            />
            <Label htmlFor="sensitiveContent">Sezgir kontent</Label>
          </div>
        </div>
      </Card>
    </div>
  )
}
