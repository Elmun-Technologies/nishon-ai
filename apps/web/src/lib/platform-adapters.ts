'use client'

// Platform Adapter Types
export interface CampaignData {
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
  }
  utm: {
    source: string
    medium: string
    campaign: string
    content: string
    term: string
  }
  platforms: string[]
}

export interface AdGroupData {
  name: string
  scenario: 'all' | 'new'
  keywords: {
    phrases: string[]
    matchTypes: { [key: string]: 'broad' | 'phrase' | 'exact' }
  }
  negativeKeywords: string[]
  audiences: {
    buyers: boolean
    frequentBuyers: boolean
    lookalike: boolean
    abandonedCart: boolean
    viewedNotBought: boolean
  }
  geoTargeting: {
    mode: 'list' | 'map'
    locations: string[]
  }
}

export interface CreativeData {
  headlines: string[]
  descriptions: string[]
  cta: string
  primaryText: string
  images: File[]
}

export interface PlatformAdapter {
  platform: string
  createCampaign(data: CampaignData): Promise<any>
  createAdGroup(campaignId: string, data: AdGroupData): Promise<any>
  createAd(adGroupId: string, data: CreativeData): Promise<any>
  pauseCampaign(campaignId: string): Promise<any>
  resumeCampaign(campaignId: string): Promise<any>
  updateBudget(campaignId: string, budget: number): Promise<any>
  getStatus(campaignId: string): Promise<any>
}

// Meta Ads Adapter
export class MetaAdapter implements PlatformAdapter {
  platform = 'meta'

  async createCampaign(data: CampaignData): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    return {
      id: `meta_campaign_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      status: 'ACTIVE',
      objective: this.mapObjective(data.objective),
      budget: {
        amount: data.budget.amount,
        currency: data.budget.currency,
        type: data.budget.type
      }
    }
  }

  async createAdGroup(campaignId: string, data: AdGroupData): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 800))

    return {
      id: `meta_adgroup_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      targeting: {
        geo_locations: {
          countries: data.geoTargeting.locations
        },
        interests: this.generateInterests(data.keywords.phrases)
      }
    }
  }

  async createAd(adGroupId: string, data: CreativeData): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 1200))

    return {
      id: `meta_ad_${Math.random().toString(36).substr(2, 9)}`,
      name: `${data.headlines[0]} - Ad`,
      status: 'ACTIVE',
      creative: {
        primary_text: data.primaryText,
        headline: data.headlines[0],
        description: data.descriptions[0],
        call_to_action: data.cta
      }
    }
  }

  async pauseCampaign(campaignId: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 500))
    return { status: 'PAUSED' }
  }

  async resumeCampaign(campaignId: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 500))
    return { status: 'ACTIVE' }
  }

  async updateBudget(campaignId: string, budget: number): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 600))
    return { budget: { amount: budget, currency: 'USD' } }
  }

  async getStatus(campaignId: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 400))
    return {
      status: 'ACTIVE',
      spend: 1500,
      clicks: 150,
      conversions: 15
    }
  }

  private mapObjective(objective: string): string {
    const mapping: { [key: string]: string } = {
      'leads': 'LEAD_GENERATION',
      'sales': 'CONVERSIONS',
      'traffic': 'TRAFFIC',
      'awareness': 'BRAND_AWARENESS'
    }
    return mapping[objective] || 'CONVERSIONS'
  }

  private generateInterests(keywords: string[]): string[] {
    return keywords.map(keyword => `${keyword} interest`).slice(0, 5)
  }
}

// Google Ads Adapter
export class GoogleAdapter implements PlatformAdapter {
  platform = 'google'

  async createCampaign(data: CampaignData): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 1200))

    return {
      id: `google_campaign_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      status: 'ENABLED',
      campaign_type: this.mapCampaignType(data.objective),
      budget: {
        amount: data.budget.amount,
        currency: data.budget.currency,
        delivery_method: data.budget.type === 'daily' ? 'STANDARD' : 'ACCELERATED'
      }
    }
  }

  async createAdGroup(campaignId: string, data: AdGroupData): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 900))

    return {
      id: `google_adgroup_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      targeting: {
        geo_target_type_setting: {
          positive_geo_target_type: 'DONT_CARE',
          negative_geo_target_type: 'DONT_CARE'
        }
      }
    }
  }

  async createAd(adGroupId: string, data: CreativeData): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 1500))

    return {
      id: `google_ad_${Math.random().toString(36).substr(2, 9)}`,
      name: `${data.headlines[0]} - Responsive Search Ad`,
      status: 'ENABLED',
      ad_type: 'RESPONSIVE_SEARCH_AD',
      creative: {
        headlines: data.headlines.slice(0, 3),
        descriptions: data.descriptions.slice(0, 2),
        call_to_action: data.cta
      }
    }
  }

  async pauseCampaign(campaignId: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 600))
    return { status: 'PAUSED' }
  }

  async resumeCampaign(campaignId: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 600))
    return { status: 'ENABLED' }
  }

  async updateBudget(campaignId: string, budget: number): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 700))
    return { budget: { amount_micros: budget * 1000000 } }
  }

  async getStatus(campaignId: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      status: 'ENABLED',
      metrics: {
        cost_micros: 2500000000,
        clicks: 250,
        conversions: 25
      }
    }
  }

  private mapCampaignType(objective: string): string {
    const mapping: { [key: string]: string } = {
      'leads': 'SEARCH',
      'sales': 'SHOPPING',
      'traffic': 'DISPLAY',
      'awareness': 'VIDEO_OUTSTREAM'
    }
    return mapping[objective] || 'SEARCH'
  }
}

// Yandex Direct Adapter
export class YandexAdapter implements PlatformAdapter {
  platform = 'yandex'

  async createCampaign(data: CampaignData): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 1100))

    return {
      id: `yandex_campaign_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      status: 'ON',
      type: this.mapCampaignType(data.objective),
      daily_budget: {
        amount: data.budget.amount,
        currency: data.budget.currency
      }
    }
  }

  async createAdGroup(campaignId: string, data: AdGroupData): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 850))

    return {
      id: `yandex_adgroup_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      targeting: {
        geo_targeting: {
          items: data.geoTargeting.locations.map(loc => ({ name: loc, id: Math.random() }))
        }
      }
    }
  }

  async createAd(adGroupId: string, data: CreativeData): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 1300))

    return {
      id: `yandex_ad_${Math.random().toString(36).substr(2, 9)}`,
      name: `${data.headlines[0]} - Text Ad`,
      status: 'ON',
      type: 'TEXT_AD',
      text_ad: {
        headline: data.headlines[0],
        text: data.descriptions[0],
        href: 'https://example.com',
        display_domain: 'example.com'
      }
    }
  }

  async pauseCampaign(campaignId: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 550))
    return { status: 'OFF' }
  }

  async resumeCampaign(campaignId: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 550))
    return { status: 'ON' }
  }

  async updateBudget(campaignId: string, budget: number): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 650))
    return { daily_budget: { amount: budget } }
  }

  async getStatus(campaignId: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 450))
    return {
      status: 'ON',
      stats: {
        clicks: 180,
        conversions: 18,
        cost: 1800
      }
    }
  }

  private mapCampaignType(objective: string): string {
    const mapping: { [key: string]: string } = {
      'leads': 'TEXT_CAMPAIGN',
      'sales': 'CPC_BANNER_CAMPAIGN',
      'traffic': 'DYNAMIC_TEXT_CAMPAIGN',
      'awareness': 'COUNTER_CAMPAIGN'
    }
    return mapping[objective] || 'TEXT_CAMPAIGN'
  }
}

// Campaign Publisher Service
export class CampaignPublisher {
  private adapters: Map<string, PlatformAdapter> = new Map()

  constructor() {
    this.adapters.set('meta', new MetaAdapter())
    this.adapters.set('google', new GoogleAdapter())
    this.adapters.set('yandex', new YandexAdapter())
  }

  async publishCampaign(data: CampaignData): Promise<any> {
    const results: any = {
      campaign: null,
      adGroups: [],
      ads: [],
      errors: []
    }

    try {
      // Create campaign on all selected platforms
      const campaignPromises = data.platforms.map(async (platform) => {
        const adapter = this.adapters.get(platform)
        if (!adapter) {
          throw new Error(`Adapter not found for platform: ${platform}`)
        }

        try {
          const campaign = await adapter.createCampaign(data)
          return { platform, campaign, success: true }
        } catch (error) {
          return { platform, error, success: false }
        }
      })

      const campaignResults = await Promise.all(campaignPromises)

      // Process results
      campaignResults.forEach(result => {
        if (result.success) {
          results.campaign = results.campaign || result.campaign
          results.adGroups.push({ platform: result.platform, adGroup: null })
          results.ads.push({ platform: result.platform, ad: null })
        } else {
          results.errors.push({
            platform: result.platform,
            error: result.error instanceof Error ? result.error.message : 'Unknown error'
          })
        }
      })

      return results
    } catch (error) {
      throw new Error(`Campaign creation failed: ${error.message}`)
    }
  }

  async publishAdGroup(campaignId: string, platform: string, data: AdGroupData): Promise<any> {
    const adapter = this.adapters.get(platform)
    if (!adapter) {
      throw new Error(`Adapter not found for platform: ${platform}`)
    }

    try {
      return await adapter.createAdGroup(campaignId, data)
    } catch (error) {
      throw new Error(`Ad group creation failed for ${platform}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async publishAd(adGroupId: string, platform: string, data: CreativeData): Promise<any> {
    const adapter = this.adapters.get(platform)
    if (!adapter) {
      throw new Error(`Adapter not found for platform: ${platform}`)
    }

    try {
      return await adapter.createAd(adGroupId, data)
    } catch (error) {
      throw new Error(`Ad creation failed for ${platform}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async pauseCampaign(campaignId: string, platform: string): Promise<any> {
    const adapter = this.adapters.get(platform)
    if (!adapter) {
      throw new Error(`Adapter not found for platform: ${platform}`)
    }

    try {
      return await adapter.pauseCampaign(campaignId)
    } catch (error) {
      throw new Error(`Campaign pause failed for ${platform}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async resumeCampaign(campaignId: string, platform: string): Promise<any> {
    const adapter = this.adapters.get(platform)
    if (!adapter) {
      throw new Error(`Adapter not found for platform: ${platform}`)
    }

    try {
      return await adapter.resumeCampaign(campaignId)
    } catch (error) {
      throw new Error(`Campaign resume failed for ${platform}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async updateBudget(campaignId: string, platform: string, budget: number): Promise<any> {
    const adapter = this.adapters.get(platform)
    if (!adapter) {
      throw new Error(`Adapter not found for platform: ${platform}`)
    }

    try {
      return await adapter.updateBudget(campaignId, budget)
    } catch (error) {
      throw new Error(`Budget update failed for ${platform}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  getAdapter(platform: string): PlatformAdapter | null {
    return this.adapters.get(platform) || null
  }
}

// Export singleton instance
export const campaignPublisher = new CampaignPublisher()