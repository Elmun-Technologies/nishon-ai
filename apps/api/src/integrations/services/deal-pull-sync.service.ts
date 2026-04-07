import { Injectable, Logger } from '@nestjs/common'
import { Repository, MoreThanOrEqual } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { AxiosInstance } from 'axios'
import {
  LinkedDeal,
  RevenueSyncLog,
  CampaignRevenue,
} from '../entities'
import {
  AmoCRMDeal,
  SyncEventType,
  SyncStatus,
} from '../types/integration.types'
import { AmoCRMConnectorService } from './amocrm-connector.service'
import { ContactSyncService } from './contact-sync.service'

@Injectable()
export class DealPullSyncService {
  private readonly logger = new Logger(DealPullSyncService.name)

  constructor(
    @InjectRepository(LinkedDeal)
    private linkedDealRepository: Repository<LinkedDeal>,
    @InjectRepository(RevenueSyncLog)
    private revenueSyncLogRepository: Repository<RevenueSyncLog>,
    @InjectRepository(CampaignRevenue)
    private campaignRevenueRepository: Repository<CampaignRevenue>,
    private amoCrmConnector: AmoCRMConnectorService,
    private contactSyncService: ContactSyncService,
  ) {}

  /**
   * Pull deals from AmoCRM and calculate ROAS
   */
  async syncDealsAndCalculateRoas(
    connectionId: string,
    client: AxiosInstance,
    lookbackDays: number = 90
  ): Promise<{
    dealsProcessed: number
    dealsWithRoas: number
    dealsFailed: number
    totalRevenue: number
    aggregateRoas: number | null
  }> {
    const startTime = Date.now()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - lookbackDays)

    let dealsProcessed = 0
    let dealsWithRoas = 0
    let dealsFailed = 0
    let totalRevenue = 0
    let campaignsLinked = 0
    let newCampaigns = 0

    const syncLog = this.revenueSyncLogRepository.create({
      connectionId,
      syncType: 'deal_pull',
      status: SyncStatus.IN_PROGRESS,
      dateRangeFrom: startDate,
      dateRangeTo: new Date(),
      triggeredBy: 'scheduled',
    })

    try {
      // 1. Fetch deals from AmoCRM
      this.logger.log(`Fetching deals from ${startDate.toISOString()}`)
      const deals = await this.amoCrmConnector.getDeals(client, {
        updatedAfter: startDate,
        limit: 100,
      })

      if (deals.length === 0) {
        this.logger.log('No deals found')
        syncLog.status = SyncStatus.SUCCESS
        syncLog.dealsProcessed = 0
        await this.revenueSyncLogRepository.save(syncLog)
        return {
          dealsProcessed: 0,
          dealsWithRoas: 0,
          dealsFailed: 0,
          totalRevenue: 0,
          aggregateRoas: null,
        }
      }

      // 2. Process each deal
      for (const deal of deals) {
        try {
          const result = await this.processDeal(connectionId, deal)
          dealsProcessed++

          if (result.hasRoas) {
            dealsWithRoas++
            totalRevenue += result.dealValue
          }

          if (result.campaignLinked) {
            campaignsLinked++
            if (result.isNewCampaign) {
              newCampaigns++
            }
          }
        } catch (error) {
          this.logger.error(`Failed to process deal ${deal.id}: ${error.message}`)
          dealsFailed++
        }
      }

      // 3. Calculate aggregate ROAS
      const aggregateRoas = await this.calculateAggregateRoas(
        connectionId,
        startDate
      )

      // 4. Log sync results
      syncLog.status = dealsFailed > 0 ? SyncStatus.PARTIAL : SyncStatus.SUCCESS
      syncLog.dealsProcessed = dealsProcessed
      syncLog.dealsWithRoas = dealsWithRoas
      syncLog.dealsFailed = dealsFailed
      syncLog.totalRevenueSynced = totalRevenue
      syncLog.aggregateRoas = aggregateRoas
      syncLog.metadata = {
        duration_ms: Date.now() - startTime,
        api_calls: Math.ceil(deals.length / 100),
        campaigns_linked: campaignsLinked,
        new_campaigns: newCampaigns,
      }

      await this.revenueSyncLogRepository.save(syncLog)

      this.logger.log(
        `Deal sync completed: ${dealsProcessed} processed, ${dealsWithRoas} with ROAS, ROAS: ${aggregateRoas}`
      )

      return {
        dealsProcessed,
        dealsWithRoas,
        dealsFailed,
        totalRevenue,
        aggregateRoas: aggregateRoas || null,
      }
    } catch (error) {
      this.logger.error(`Deal sync failed: ${error.message}`)

      syncLog.status = SyncStatus.FAILED
      syncLog.errorMessage = error.message
      syncLog.errorStack = error.stack
      await this.revenueSyncLogRepository.save(syncLog)

      throw error
    }
  }

  /**
   * Process a single deal and link to campaign
   */
  private async processDeal(
    connectionId: string,
    deal: AmoCRMDeal
  ): Promise<{
    hasRoas: boolean
    dealValue: number
    campaignLinked: boolean
    isNewCampaign: boolean
  }> {
    // Extract campaign ID from custom fields
    const campaignId = this.extractCampaignId(deal.custom_fields_values)
    const platform = this.extractPlatform(deal.custom_fields_values)

    // Check if deal already exists
    let linkedDeal = await this.linkedDealRepository.findOne({
      where: {
        connectionId,
        amoCrmDealId: deal.id,
      },
    })

    // Get or create linked deal
    if (!linkedDeal) {
      linkedDeal = this.linkedDealRepository.create({
        connectionId,
        amoCrmDealId: deal.id,
        dealName: deal.name,
        dealValue: deal.price || 0,
        status: this.mapDealStatus(deal.status_id),
        responsibleUserId: deal.responsible_user_id,
      })
    } else {
      // Update existing deal
      linkedDeal.dealValue = deal.price || 0
      linkedDeal.status = this.mapDealStatus(deal.status_id)
      linkedDeal.wonAt = deal.closed_at ? new Date(deal.closed_at * 1000) : null
    }

    // Link to campaign if ID found
    let isNewCampaign = false
    let hasRoas = false

    if (campaignId) {
      linkedDeal.campaignId = campaignId
      linkedDeal.platform = (platform as 'google' | 'meta' | 'tiktok' | 'yandex' | null) || null

      // TODO: Fetch campaign ad spend from Nishon campaigns table
      // For now, we'll assume campaign data exists
      const adSpend = await this.getCampaignAdSpend(campaignId)
      if (adSpend > 0) {
        linkedDeal.adSpend = adSpend
        linkedDeal.calculatedRoas = linkedDeal.dealValue / adSpend
        hasRoas = true
      }

      // Check if this is a new campaign-connection link
      const existingDeals = await this.linkedDealRepository.count({
        where: {
          connectionId,
          campaignId,
        },
      })
      isNewCampaign = existingDeals === 0
    }

    linkedDeal.lastSyncedAt = new Date()
    const savedDeal = await this.linkedDealRepository.save(linkedDeal)

    // PHASE 4 INTEGRATION: Update audiences based on deal status
    try {
      await this.contactSyncService.updateSegmentFromDeal(
        savedDeal.id,
        linkedDeal.status
      )
    } catch (error) {
      this.logger.warn(`Failed to update audience segments for deal: ${error.message}`)
      // Don't throw - this is non-blocking
    }

    return {
      hasRoas,
      dealValue: linkedDeal.dealValue,
      campaignLinked: !!campaignId,
      isNewCampaign,
    }
  }

  /**
   * Extract campaign ID from deal custom fields
   */
  private extractCampaignId(customFields: any[] | undefined): string | null {
    if (!customFields || !Array.isArray(customFields)) {
      return null
    }

    // Look for custom field with campaign ID
    // This would need to be configured based on AmoCRM setup
    for (const field of customFields) {
      if (field.field_id === 123456) {
        // TODO: Configure correct field ID
        return field.values?.[0]?.value
      }
    }

    return null
  }

  /**
   * Extract platform from deal custom fields
   */
  private extractPlatform(customFields: any[] | undefined): string | null {
    if (!customFields || !Array.isArray(customFields)) {
      return null
    }

    for (const field of customFields) {
      if (field.field_id === 654321) {
        // TODO: Configure correct field ID
        const value = field.values?.[0]?.value
        if (['meta', 'google', 'tiktok', 'yandex'].includes(value)) {
          return value
        }
      }
    }

    return null
  }

  /**
   * Get campaign ad spend (would connect to campaigns table)
   */
  private async getCampaignAdSpend(campaignId: string): Promise<number> {
    // TODO: Implement query to get ad spend from campaigns table
    // For now, return placeholder
    return 0
  }

  /**
   * Map AmoCRM status ID to our status
   */
  private mapDealStatus(
    statusId: number
  ): 'won' | 'lost' | 'in_progress' | 'other' {
    // Status IDs vary by AmoCRM account
    // Common: 142 (won), 143 (lost), 144+ (custom)
    // TODO: Configure based on actual AmoCRM setup

    if (statusId === 142) return 'won'
    if (statusId === 143) return 'lost'
    if (statusId >= 144 && statusId <= 200) return 'in_progress'
    return 'other'
  }

  /**
   * Calculate aggregate ROAS for connection
   */
  private async calculateAggregateRoas(
    connectionId: string,
    since: Date
  ): Promise<number | null> {
    const deals = await this.linkedDealRepository.find({
      where: {
        connectionId,
        status: 'won',
        wonAt: since ? MoreThanOrEqual(since) : undefined,
      },
    })

    if (deals.length === 0) return null

    const totalRevenue = deals.reduce((sum, d) => sum + Number(d.dealValue), 0)
    const totalSpend = deals.reduce((sum, d) => {
      return sum + (d.adSpend ? Number(d.adSpend) : 0)
    }, 0)

    if (totalSpend === 0) return null

    return totalRevenue / totalSpend
  }

  /**
   * Get revenue attribution data for dashboard
   */
  async getRevenueAttribution(connectionId: string): Promise<{
    totalRevenue: number
    totalSpend: number
    roas: number | null
    dealCount: number
    conversionCount: number
    byPlatform: Record<
      string,
      {
        revenue: number
        spend: number
        roas: number | null
        dealCount: number
      }
    >
  }> {
    const deals = await this.linkedDealRepository.find({
      where: {
        connectionId,
        status: 'won',
      },
    })

    let totalRevenue = 0
    let totalSpend = 0
    let conversionCount = 0

    const byPlatform: Record<
      string,
      { revenue: number; spend: number; dealCount: number }
    > = {
      meta: { revenue: 0, spend: 0, dealCount: 0 },
      google: { revenue: 0, spend: 0, dealCount: 0 },
      tiktok: { revenue: 0, spend: 0, dealCount: 0 },
      yandex: { revenue: 0, spend: 0, dealCount: 0 },
    }

    for (const deal of deals) {
      totalRevenue += Number(deal.dealValue)
      if (deal.adSpend) totalSpend += Number(deal.adSpend)
      conversionCount += deal.conversionCount

      if (deal.platform && byPlatform[deal.platform]) {
        byPlatform[deal.platform].revenue += Number(deal.dealValue)
        if (deal.adSpend)
          byPlatform[deal.platform].spend += Number(deal.adSpend)
        byPlatform[deal.platform].dealCount += 1
      }
    }

    const roas = totalSpend > 0 ? totalRevenue / totalSpend : null

    // Calculate ROAS by platform
    const platformData: Record<string, any> = {}
    for (const [platform, data] of Object.entries(byPlatform)) {
      platformData[platform] = {
        ...data,
        roas: data.spend > 0 ? data.revenue / data.spend : null,
      }
    }

    return {
      totalRevenue,
      totalSpend,
      roas,
      dealCount: deals.length,
      conversionCount,
      byPlatform: platformData,
    }
  }

  /**
   * Get revenue trends over time
   */
  async getRevenueTrends(
    connectionId: string,
    days: number = 30
  ): Promise<
    Array<{
      date: Date
      revenue: number
      deals: number
      roas: number | null
    }>
  > {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const deals = await this.linkedDealRepository.find({
      where: {
        connectionId,
        status: 'won',
        wonAt: since ? MoreThanOrEqual(since) : undefined,
      },
      order: { wonAt: 'ASC' },
    })

    // Group by date
    const grouped = new Map<
      string,
      { revenue: number; deals: number; spend: number }
    >()

    for (const deal of deals) {
      if (!deal.wonAt) continue

      const dateKey = deal.wonAt.toISOString().split('T')[0]
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, { revenue: 0, deals: 0, spend: 0 })
      }

      const dayData = grouped.get(dateKey)!
      dayData.revenue += Number(deal.dealValue)
      dayData.deals += 1
      if (deal.adSpend) dayData.spend += Number(deal.adSpend)
    }

    // Convert to array with ROAS
    return Array.from(grouped.entries()).map(([dateStr, data]) => ({
      date: new Date(dateStr),
      revenue: data.revenue,
      deals: data.deals,
      roas: data.spend > 0 ? data.revenue / data.spend : null,
    }))
  }
}
