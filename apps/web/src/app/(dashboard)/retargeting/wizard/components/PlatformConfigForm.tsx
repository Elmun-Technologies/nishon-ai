'use client'

import { useState } from 'react'
import { type Platform, getPlatformConfig } from '@/types/platform-config'
import { type MetaCampaignSettings, type GoogleCampaignSettings, type TikTokCampaignSettings, type YandexCampaignSettings } from '@/types/platform-settings'

interface PlatformConfigFormProps {
  platform: Platform
  initialConfig?: Record<string, any>
  onConfigChange: (config: Record<string, any>) => void
}

// ─── Meta Config Form ─────────────────────────────────────────────────────────

function MetaConfigForm({
  initialConfig,
  onConfigChange,
}: {
  initialConfig?: Partial<MetaCampaignSettings>
  onConfigChange: (config: MetaCampaignSettings) => void
}) {
  const [config, setConfig] = useState<MetaCampaignSettings>({
    pixelConfig: { pixelId: '', trackingEvents: [] },
    interests: [],
    placements: ['facebook_feed', 'instagram_feed'],
    enableAutoAdvancedMatching: true,
    enableLookalikeAudience: false,
    ...initialConfig,
  })

  const handleChange = (updates: Partial<MetaCampaignSettings>) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    onConfigChange(newConfig)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-text-primary">Meta Pixel ID</label>
        <input
          type="text"
          placeholder="12345678901234567"
          value={config.pixelConfig.pixelId}
          onChange={(e) =>
            handleChange({
              pixelConfig: { ...config.pixelConfig, pixelId: e.target.value },
            })
          }
          className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
        />
        <p className="text-xs text-text-tertiary">
          Meta Pixel tracking ID for conversion tracking
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-text-primary">Placements</label>
        <div className="space-y-2">
          {(['facebook_feed', 'instagram_feed', 'instagram_stories', 'facebook_reels', 'audience_network'] as const).map(
            (placement) => (
              <label key={placement} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.placements.includes(placement)}
                  onChange={(e) => {
                    const newPlacements = e.target.checked
                      ? [...config.placements, placement]
                      : config.placements.filter((p) => p !== placement)
                    handleChange({ placements: newPlacements })
                  }}
                  className="rounded border-border"
                />
                <span className="text-sm text-text-primary capitalize">
                  {placement.replace(/_/g, ' ')}
                </span>
              </label>
            )
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.enableAutoAdvancedMatching}
            onChange={(e) => handleChange({ enableAutoAdvancedMatching: e.target.checked })}
            className="rounded border-border"
          />
          <span className="text-sm text-text-primary">Enable Auto Advanced Matching</span>
        </label>
        <p className="text-xs text-text-tertiary">Automatically match customers from your CRM</p>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.enableLookalikeAudience}
            onChange={(e) => handleChange({ enableLookalikeAudience: e.target.checked })}
            className="rounded border-border"
          />
          <span className="text-sm text-text-primary">Enable Lookalike Audience</span>
        </label>
        {config.enableLookalikeAudience && (
          <div className="ml-6 flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="10"
              value={config.lookalikePercentage || 1}
              onChange={(e) =>
                handleChange({ lookalikePercentage: Number(e.target.value) })
              }
              className="flex-1 h-2 rounded-lg accent-info"
            />
            <span className="text-sm font-medium text-text-primary w-8">
              {config.lookalikePercentage || 1}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Google Config Form ────────────────────────────────────────────────────────

function GoogleConfigForm({
  initialConfig,
  onConfigChange,
}: {
  initialConfig?: Partial<GoogleCampaignSettings>
  onConfigChange: (config: GoogleCampaignSettings) => void
}) {
  const [config, setConfig] = useState<GoogleCampaignSettings>({
    keywords: [],
    placements: [],
    bidStrategy: 'maximize_conversions',
    enableDynamicSearchAds: false,
    ...initialConfig,
  })

  const [newKeyword, setNewKeyword] = useState('')
  const [newKeywordType, setNewKeywordType] = useState<'broad' | 'phrase' | 'exact'>('broad')

  const handleChange = (updates: Partial<GoogleCampaignSettings>) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    onConfigChange(newConfig)
  }

  const addKeyword = () => {
    if (newKeyword.trim()) {
      const updatedKeywords = [
        ...config.keywords,
        { text: newKeyword.trim(), matchType: newKeywordType },
      ]
      handleChange({ keywords: updatedKeywords })
      setNewKeyword('')
    }
  }

  const removeKeyword = (index: number) => {
    const updatedKeywords = config.keywords.filter((_, i) => i !== index)
    handleChange({ keywords: updatedKeywords })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-text-primary">Bid Strategy</label>
        <select
          value={config.bidStrategy}
          onChange={(e) =>
            handleChange({ bidStrategy: e.target.value as GoogleCampaignSettings['bidStrategy'] })
          }
          className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
        >
          <option value="maximize_conversions">Maximize Conversions</option>
          <option value="maximize_clicks">Maximize Clicks</option>
          <option value="target_cpa">Target CPA</option>
          <option value="target_roas">Target ROAS</option>
        </select>
      </div>

      {config.bidStrategy === 'target_cpa' && (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-text-primary">
            Target CPA ($)
          </label>
          <input
            type="number"
            placeholder="25"
            value={config.targetCPA || ''}
            onChange={(e) => handleChange({ targetCPA: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
          />
        </div>
      )}

      {config.bidStrategy === 'target_roas' && (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-text-primary">
            Target ROAS (e.g., 3.0)
          </label>
          <input
            type="number"
            placeholder="3.0"
            step="0.1"
            value={config.targetROAS || ''}
            onChange={(e) => handleChange({ targetROAS: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-text-primary">Keywords</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter keyword"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            className="flex-1 px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
          />
          <select
            value={newKeywordType}
            onChange={(e) => setNewKeywordType(e.target.value as typeof newKeywordType)}
            className="px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
          >
            <option value="broad">Broad</option>
            <option value="phrase">Phrase</option>
            <option value="exact">Exact</option>
          </select>
          <button
            onClick={addKeyword}
            className="px-4 py-2 bg-info text-surface rounded-lg font-medium hover:opacity-90"
          >
            Add
          </button>
        </div>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {config.keywords.map((kw, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2 bg-surface-2 rounded border border-border"
            >
              <span className="text-sm text-text-primary">
                {kw.text} <span className="text-xs text-text-tertiary">({kw.matchType})</span>
              </span>
              <button
                onClick={() => removeKeyword(i)}
                className="text-text-tertiary hover:text-text-primary"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={config.enableDynamicSearchAds}
          onChange={(e) => handleChange({ enableDynamicSearchAds: e.target.checked })}
          className="rounded border-border"
        />
        <span className="text-sm text-text-primary">Enable Dynamic Search Ads</span>
      </label>
    </div>
  )
}

// ─── TikTok Config Form ────────────────────────────────────────────────────────

function TikTokConfigForm({
  initialConfig,
  onConfigChange,
}: {
  initialConfig?: Partial<TikTokCampaignSettings>
  onConfigChange: (config: TikTokCampaignSettings) => void
}) {
  const [config, setConfig] = useState<TikTokCampaignSettings>({
    pixelConfig: { pixelId: '', events: [] },
    interests: [],
    placements: ['feed'],
    enableAutoTargeting: true,
    ...initialConfig,
  })

  const handleChange = (updates: Partial<TikTokCampaignSettings>) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    onConfigChange(newConfig)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-text-primary">TikTok Pixel ID</label>
        <input
          type="text"
          placeholder="12345678901234567"
          value={config.pixelConfig.pixelId}
          onChange={(e) =>
            handleChange({
              pixelConfig: { ...config.pixelConfig, pixelId: e.target.value },
            })
          }
          className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
        />
        <p className="text-xs text-text-tertiary">TikTok Pixel ID for conversion tracking</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-text-primary">Placements</label>
        <div className="space-y-2">
          {(['feed', 'pax', 'search', 'top_level'] as const).map((placement) => (
            <label key={placement} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.placements.includes(placement)}
                onChange={(e) => {
                  const newPlacements = e.target.checked
                    ? [...config.placements, placement]
                    : config.placements.filter((p) => p !== placement)
                  handleChange({ placements: newPlacements })
                }}
                className="rounded border-border"
              />
              <span className="text-sm text-text-primary capitalize">
                {placement.replace(/_/g, ' ')}
              </span>
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={config.enableAutoTargeting}
          onChange={(e) => handleChange({ enableAutoTargeting: e.target.checked })}
          className="rounded border-border"
        />
        <span className="text-sm text-text-primary">Enable Auto Targeting</span>
      </label>
    </div>
  )
}

// ─── Yandex Config Form ───────────────────────────────────────────────────────

function YandexConfigForm({
  initialConfig,
  onConfigChange,
}: {
  initialConfig?: Partial<YandexCampaignSettings>
  onConfigChange: (config: YandexCampaignSettings) => void
}) {
  const [config, setConfig] = useState<YandexCampaignSettings>({
    keywords: [],
    bidStrategy: 'auto_budget',
    deviceTargeting: { desktop: true, mobile: true, tablet: true },
    region: 'US',
    useContextualPlacement: true,
    ...initialConfig,
  })

  const [newKeyword, setNewKeyword] = useState('')
  const [newBid, setNewBid] = useState('1')

  const handleChange = (updates: Partial<YandexCampaignSettings>) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    onConfigChange(newConfig)
  }

  const addKeyword = () => {
    if (newKeyword.trim()) {
      const updatedKeywords = [
        ...config.keywords,
        { text: newKeyword.trim(), bid: Number(newBid) },
      ]
      handleChange({ keywords: updatedKeywords })
      setNewKeyword('')
      setNewBid('1')
    }
  }

  const removeKeyword = (index: number) => {
    const updatedKeywords = config.keywords.filter((_, i) => i !== index)
    handleChange({ keywords: updatedKeywords })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-text-primary">Region</label>
        <input
          type="text"
          placeholder="US, RU, etc."
          value={config.region}
          onChange={(e) => handleChange({ region: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-text-primary">Bid Strategy</label>
        <select
          value={config.bidStrategy}
          onChange={(e) =>
            handleChange({ bidStrategy: e.target.value as 'fixed' | 'auto_budget' })
          }
          className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
        >
          <option value="fixed">Fixed Bid</option>
          <option value="auto_budget">Auto Budget</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-text-primary">Keywords</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter keyword"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            className="flex-1 px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
          />
          <input
            type="number"
            placeholder="Bid"
            value={newBid}
            onChange={(e) => setNewBid(e.target.value)}
            className="w-24 px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
          />
          <button
            onClick={addKeyword}
            className="px-4 py-2 bg-info text-surface rounded-lg font-medium hover:opacity-90"
          >
            Add
          </button>
        </div>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {config.keywords.map((kw, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2 bg-surface-2 rounded border border-border"
            >
              <span className="text-sm text-text-primary">
                {kw.text} <span className="text-xs text-text-tertiary">(${kw.bid})</span>
              </span>
              <button
                onClick={() => removeKeyword(i)}
                className="text-text-tertiary hover:text-text-primary"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-text-primary">Device Targeting</label>
        <div className="space-y-2">
          {(['desktop', 'mobile', 'tablet'] as const).map((device) => (
            <label key={device} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.deviceTargeting[device]}
                onChange={(e) =>
                  handleChange({
                    deviceTargeting: {
                      ...config.deviceTargeting,
                      [device]: e.target.checked,
                    },
                  })
                }
                className="rounded border-border"
              />
              <span className="text-sm text-text-primary capitalize">{device}</span>
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={config.useContextualPlacement}
          onChange={(e) => handleChange({ useContextualPlacement: e.target.checked })}
          className="rounded border-border"
        />
        <span className="text-sm text-text-primary">Use Contextual Placement</span>
      </label>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PlatformConfigForm({ platform, initialConfig, onConfigChange }: PlatformConfigFormProps) {
  const config = getPlatformConfig(platform)

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-text-primary">{config.fullName}</h3>
        <p className="text-xs text-text-tertiary mt-0.5">
          Configure platform-specific settings for your campaign
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface-2 p-4">
        {platform === 'meta' && (
          <MetaConfigForm initialConfig={initialConfig} onConfigChange={onConfigChange} />
        )}
        {platform === 'google' && (
          <GoogleConfigForm initialConfig={initialConfig} onConfigChange={onConfigChange} />
        )}
        {platform === 'tiktok' && (
          <TikTokConfigForm initialConfig={initialConfig} onConfigChange={onConfigChange} />
        )}
        {platform === 'yandex' && (
          <YandexConfigForm initialConfig={initialConfig} onConfigChange={onConfigChange} />
        )}
      </div>
    </div>
  )
}
