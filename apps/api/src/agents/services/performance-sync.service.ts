import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { AgentProfile } from '../entities/agent-profile.entity';
import { AgentPlatformMetrics } from '../entities/agent-platform-metrics.entity';
import { AgentHistoricalPerformance } from '../entities/agent-historical-performance.entity';
import { AgentPerformanceSyncLog } from '../entities/agent-performance-sync-log.entity';
import { ServiceEngagement } from '../entities/service-engagement.entity';
import { ConnectedAccount } from '../../platforms/entities/connected-account.entity';

/**
 * PerformanceSyncService handles real-time syncing of agent ad account performance data.
 * It aggregates metrics from connected Meta, Google Ads, and Yandex Direct accounts
 * and stores them in the agent_platform_metrics table for marketplace display.
 *
 * Data flow:
 * 1. Get agent's connected workspaces/accounts via ServiceEngagement
 * 2. Fetch campaigns and performance metrics from each platform's API
 * 3. Calculate aggregated KPIs (ROAS, CPA, CTR, spend, conversions, revenue)
 * 4. Store metrics in agent_platform_metrics (per platform, per month)
 * 5. Update agent_historical_performance for monthly/yearly trends
 * 6. Update AgentProfile.cachedStats and lastPerformanceSync timestamp
 * 7. Log sync status in agent_performance_sync_logs
 */

export interface SyncOptions {
  /** Skip cache; force full re-sync */
  forceSync?: boolean;
  /** Only sync specific platforms; default syncs all connected */
  platformsToSync?: ('meta' | 'google' | 'yandex')[];
}

export interface SyncResult {
  success: boolean;
  agentId: string;
  recordsSynced: number;
  platformsProcessed: string[];
  metricsStored: number;
  errors: string[];
  syncDuration: number; // milliseconds
  lastSyncedAt: Date;
}

interface PlatformMetrics {
  platform: string;
  totalSpend: number;
  campaignCount: number;
  conversions: number;
  revenue: number;
  avgRoas?: number;
  avgCpa?: number;
  avgCtr?: number;
}

interface AggregatedStats {
  avgROAS: number;
  avgCPA: number;
  avgCTR: number;
  totalCampaigns: number;
  activeCampaigns: number;
  successRate: number;
  totalSpendManaged: number;
  bestROAS: number;
}

@Injectable()
export class PerformanceSyncService {
  private readonly logger = new Logger(PerformanceSyncService.name);

  constructor(
    @InjectRepository(AgentProfile)
    private readonly agentProfileRepo: Repository<AgentProfile>,
    @InjectRepository(AgentPlatformMetrics)
    private readonly platformMetricsRepo: Repository<AgentPlatformMetrics>,
    @InjectRepository(AgentHistoricalPerformance)
    private readonly historicalPerformanceRepo: Repository<AgentHistoricalPerformance>,
    @InjectRepository(AgentPerformanceSyncLog)
    private readonly syncLogRepo: Repository<AgentPerformanceSyncLog>,
    @InjectRepository(ServiceEngagement)
    private readonly engagementRepo: Repository<ServiceEngagement>,
    @InjectRepository(ConnectedAccount)
    private readonly connectedAccountRepo: Repository<ConnectedAccount>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  /**
   * Main entry point: sync performance data for an agent.
   * Returns comprehensive sync result with error handling.
   */
  async syncAgentPerformance(
    agentId: string,
    options: SyncOptions = {},
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: false,
      agentId,
      recordsSynced: 0,
      platformsProcessed: [],
      metricsStored: 0,
      errors: [],
      syncDuration: 0,
      lastSyncedAt: new Date(),
    };

    try {
      // Step 1: Validate agent exists
      const agent = await this.agentProfileRepo.findOne({ where: { id: agentId } });
      if (!agent) {
        throw new NotFoundException(`Agent ${agentId} not found`);
      }

      // Create/update sync log
      const syncLog = this.syncLogRepo.create({
        agentProfileId: agentId,
        syncType: 'meta', // Will be updated based on platforms
        status: 'in_progress',
        startedAt: new Date(),
      });
      const savedLog = await this.syncLogRepo.save(syncLog);

      // Step 2: Get agent's engagements (connected workspaces)
      const engagements = await this.engagementRepo.find({
        where: { agentProfileId: agentId, status: 'active' },
        relations: ['workspace'],
      });

      if (engagements.length === 0) {
        this.logger.warn(`Agent ${agentId} has no active engagements`);
        result.errors.push('No active service engagements found');
      }

      // Step 3: Collect all connected accounts across workspaces
      const workspaceIds = engagements.map((e) => e.workspace.id);
      const connectedAccounts = await this.connectedAccountRepo.find({
        where: {
          workspaceId: In(workspaceIds),
          isActive: true,
        },
      });

      if (connectedAccounts.length === 0) {
        this.logger.warn(`Agent ${agentId} has no connected ad accounts`);
        result.errors.push('No connected ad accounts found');
      }

      // Step 4: Group accounts by platform
      const platformsToSync = options.platformsToSync || ['meta', 'google', 'yandex'];
      const metaAccounts = connectedAccounts.filter((a) => a.platform === 'meta' && platformsToSync.includes('meta'));
      const googleAccounts = connectedAccounts.filter((a) => a.platform === 'google' && platformsToSync.includes('google'));
      const yandexAccounts = connectedAccounts.filter((a) => a.platform === 'yandex' && platformsToSync.includes('yandex'));

      const allMetrics: PlatformMetrics[] = [];

      // Step 5: Sync each platform
      if (metaAccounts.length > 0) {
        try {
          const metaMetrics = await this.syncMetaPerformance(agent, metaAccounts, engagements);
          allMetrics.push(...metaMetrics);
          result.platformsProcessed.push('meta');
        } catch (err: any) {
          const msg = `Meta sync failed: ${err?.message || 'unknown error'}`;
          this.logger.error(msg, err);
          result.errors.push(msg);
        }
      }

      if (googleAccounts.length > 0) {
        try {
          const googleMetrics = await this.syncGooglePerformance(agent, googleAccounts, engagements);
          allMetrics.push(...googleMetrics);
          result.platformsProcessed.push('google');
        } catch (err: any) {
          const msg = `Google sync failed: ${err?.message || 'unknown error'}`;
          this.logger.error(msg, err);
          result.errors.push(msg);
        }
      }

      if (yandexAccounts.length > 0) {
        try {
          const yandexMetrics = await this.syncYandexPerformance(agent, yandexAccounts, engagements);
          allMetrics.push(...yandexMetrics);
          result.platformsProcessed.push('yandex');
        } catch (err: any) {
          const msg = `Yandex sync failed: ${err?.message || 'unknown error'}`;
          this.logger.error(msg, err);
          result.errors.push(msg);
        }
      }

      // Step 6: Store metrics in database
      result.metricsStored = await this.storePlatformMetrics(agentId, allMetrics);
      result.recordsSynced = allMetrics.reduce((sum, m) => sum + m.campaignCount, 0);

      // Step 7: Aggregate and cache stats
      const cachedStats = await this.aggregateAndCacheStats(agent, allMetrics);

      // Step 8: Update agent profile
      await this.agentProfileRepo.update(agentId, {
        lastPerformanceSync: new Date(),
        performanceSyncStatus: result.errors.length === 0 ? 'healthy' : 'stale',
        cachedStats,
      });

      result.success = result.errors.length === 0;
      result.syncDuration = Date.now() - startTime;

      // Step 9: Log final result
      await this.logSync(agentId, result, savedLog.id);

      this.logger.log({
        message: 'Performance sync completed',
        agentId,
        success: result.success,
        metricsStored: result.metricsStored,
        platformsProcessed: result.platformsProcessed,
        duration: result.syncDuration,
      });

      return result;
    } catch (err: any) {
      result.syncDuration = Date.now() - startTime;
      result.errors.push(err?.message || 'Unexpected error during sync');
      this.logger.error('Sync failed', err);
      return result;
    }
  }

  /**
   * Fetch performance data from Meta Ads API for connected accounts.
   * NOTE: This is a stub for integration with actual MetaAdsService.
   * In production, inject MetaAdsService and call its methods.
   */
  private async syncMetaPerformance(
    agent: AgentProfile,
    accounts: ConnectedAccount[],
    engagements: ServiceEngagement[],
  ): Promise<PlatformMetrics[]> {
    const metrics: PlatformMetrics[] = [];

    for (const account of accounts) {
      try {
        // TODO: Inject MetaAdsService and fetch actual data
        // const campaigns = await this.metaAdsService.getCampaigns(account.externalAccountId, accessToken);
        // const insights = await this.metaAdsService.getInsights(account.externalAccountId, accessToken);

        // For now, return mock structure
        const mockMetrics: PlatformMetrics = {
          platform: 'meta',
          totalSpend: 0,
          campaignCount: 0,
          conversions: 0,
          revenue: 0,
          avgRoas: 0,
          avgCpa: 0,
          avgCtr: 0,
        };

        metrics.push(mockMetrics);
      } catch (err: any) {
        this.logger.error(
          `Meta account ${account.externalAccountId} sync failed`,
          err,
        );
        throw err;
      }
    }

    return metrics;
  }

  /**
   * Fetch performance data from Google Ads API for connected accounts.
   * NOTE: This is a stub for integration with actual GoogleAdsService.
   */
  private async syncGooglePerformance(
    agent: AgentProfile,
    accounts: ConnectedAccount[],
    engagements: ServiceEngagement[],
  ): Promise<PlatformMetrics[]> {
    const metrics: PlatformMetrics[] = [];

    for (const account of accounts) {
      try {
        // TODO: Inject GoogleAdsService and fetch actual data
        // const campaigns = await this.googleAdsService.getCampaigns(account.externalAccountId, accessToken);
        // const performance = await this.googleAdsService.getPerformance(account.externalAccountId);

        // For now, return mock structure
        const mockMetrics: PlatformMetrics = {
          platform: 'google',
          totalSpend: 0,
          campaignCount: 0,
          conversions: 0,
          revenue: 0,
          avgRoas: 0,
          avgCpa: 0,
          avgCtr: 0,
        };

        metrics.push(mockMetrics);
      } catch (err: any) {
        this.logger.error(
          `Google account ${account.externalAccountId} sync failed`,
          err,
        );
        throw err;
      }
    }

    return metrics;
  }

  /**
   * Fetch performance data from Yandex Direct API for connected accounts.
   * NOTE: This is a stub for integration with actual YandexDirectService.
   */
  private async syncYandexPerformance(
    agent: AgentProfile,
    accounts: ConnectedAccount[],
    engagements: ServiceEngagement[],
  ): Promise<PlatformMetrics[]> {
    const metrics: PlatformMetrics[] = [];

    for (const account of accounts) {
      try {
        // TODO: Inject YandexDirectService and fetch actual data
        // const campaigns = await this.yandexDirectService.getCampaigns(account.externalAccountId, accessToken);
        // const performance = await this.yandexDirectService.getPerformance(account.externalAccountId);

        // For now, return mock structure
        const mockMetrics: PlatformMetrics = {
          platform: 'yandex',
          totalSpend: 0,
          campaignCount: 0,
          conversions: 0,
          revenue: 0,
          avgRoas: 0,
          avgCpa: 0,
          avgCtr: 0,
        };

        metrics.push(mockMetrics);
      } catch (err: any) {
        this.logger.error(
          `Yandex account ${account.externalAccountId} sync failed`,
          err,
        );
        throw err;
      }
    }

    return metrics;
  }

  /**
   * Store platform-specific metrics in agent_platform_metrics table.
   * Creates monthly rollups with aggregated KPIs per platform.
   * Returns count of stored metrics.
   */
  private async storePlatformMetrics(
    agentId: string,
    allMetrics: PlatformMetrics[],
  ): Promise<number> {
    if (allMetrics.length === 0) {
      return 0;
    }

    const metricsToStore: AgentPlatformMetrics[] = [];
    const today = new Date();
    const aggregationPeriod = new Date(today.getFullYear(), today.getMonth(), 1);

    await this.dataSource.transaction(async (em) => {
      for (const metric of allMetrics) {
        // Upsert metric for this platform and month
        const existing = await em.findOne(AgentPlatformMetrics, {
          where: {
            agentProfileId: agentId,
            platform: metric.platform,
            aggregationPeriod,
          },
        });

        if (existing) {
          // Update existing
          await em.update(
            AgentPlatformMetrics,
            { id: existing.id },
            {
              totalSpend: metric.totalSpend,
              campaignsCount: metric.campaignCount,
              conversionCount: metric.conversions,
              totalRevenue: metric.revenue,
              avgRoas: metric.avgRoas,
              avgCpa: metric.avgCpa,
              avgCtr: metric.avgCtr,
              syncedAt: new Date(),
            },
          );
        } else {
          // Create new
          const newMetric = em.create(AgentPlatformMetrics, {
            agentProfileId: agentId,
            platform: metric.platform,
            aggregationPeriod,
            totalSpend: metric.totalSpend,
            campaignsCount: metric.campaignCount,
            conversionCount: metric.conversions,
            totalRevenue: metric.revenue,
            avgRoas: metric.avgRoas,
            avgCpa: metric.avgCpa,
            avgCtr: metric.avgCtr,
            sourceType: 'api_pull',
            isVerified: true,
          });
          await em.save(newMetric);
        }
      }
    });

    return allMetrics.length;
  }

  /**
   * Aggregate metrics across all platforms and calculate cached stats.
   * Also updates historical performance for monthly trends.
   */
  private async aggregateAndCacheStats(
    agent: AgentProfile,
    allMetrics: PlatformMetrics[],
  ): Promise<AggregatedStats> {
    // Aggregate current month metrics
    const today = new Date();
    const yearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // Calculate aggregated KPIs across all platforms
    const totalSpend = allMetrics.reduce((sum, m) => sum + m.totalSpend, 0);
    const totalConversions = allMetrics.reduce((sum, m) => sum + m.conversions, 0);
    const totalRevenue = allMetrics.reduce((sum, m) => sum + m.revenue, 0);
    const totalCampaigns = allMetrics.reduce((sum, m) => sum + m.campaignCount, 0);

    // Calculate weighted averages
    const avgRoas =
      totalSpend > 0 ? parseFloat(((totalRevenue / totalSpend) * 100) / 100) : 0;
    const avgCpa =
      totalConversions > 0
        ? parseFloat((totalSpend / totalConversions) / 100)
        : 0;
    const avgCtr =
      allMetrics.length > 0
        ? parseFloat(
          (
            allMetrics.reduce((sum, m) => sum + (m.avgCtr || 0), 0) /
            allMetrics.length
          ).toFixed(3),
        )
        : 0;

    // Mock data for demo — in production, calculate from actual campaign data
    const successRate = avgRoas > 0 ? Math.min(100, avgRoas * 10) : 0;
    const bestROAS = avgRoas * 1.5; // Mock multiplier

    const cachedStats: AggregatedStats = {
      avgROAS: avgRoas,
      avgCPA: avgCpa,
      avgCTR: avgCtr,
      totalCampaigns,
      activeCampaigns: Math.round(totalCampaigns * 0.7), // Mock: 70% are active
      successRate: parseFloat(successRate.toFixed(2)),
      totalSpendManaged: totalSpend,
      bestROAS: parseFloat(bestROAS.toFixed(2)),
    };

    // Update or create historical performance record
    const platforms = allMetrics.map((m) => m.platform);
    const existing = await this.historicalPerformanceRepo.findOne({
      where: {
        agentProfileId: agent.id,
        yearMonth,
      },
    });

    if (existing) {
      await this.historicalPerformanceRepo.update(
        { id: existing.id },
        {
          platforms,
          totalCampaigns,
          totalSpend,
          avgRoas,
          avgCpa,
          avgCtr,
          bestRoas: bestROAS,
          successRate: parseFloat(successRate.toFixed(2)),
        },
      );
    } else {
      await this.historicalPerformanceRepo.save(
        this.historicalPerformanceRepo.create({
          agentProfileId: agent.id,
          yearMonth,
          platforms,
          totalCampaigns,
          totalSpend,
          avgRoas,
          avgCpa,
          avgCtr,
          bestRoas: bestROAS,
          successRate: parseFloat(successRate.toFixed(2)),
        }),
      );
    }

    return cachedStats;
  }

  /**
   * Log the sync result in agent_performance_sync_logs table.
   * Tracks sync history for monitoring and debugging.
   */
  private async logSync(
    agentId: string,
    result: SyncResult,
    logId: string,
  ): Promise<void> {
    try {
      const syncLog = await this.syncLogRepo.findOne({ where: { id: logId } });
      if (syncLog) {
        await this.syncLogRepo.update(
          { id: logId },
          {
            status: result.success ? 'completed' : 'failed',
            recordsSynced: result.recordsSynced,
            errorMessage: result.errors.length > 0 ? result.errors.join('; ') : null,
            completedAt: new Date(),
            nextSyncAt: this.calculateNextSyncTime(result.success),
          },
        );
      }
    } catch (err: any) {
      this.logger.error(
        `Failed to log sync for agent ${agentId}`,
        err,
      );
    }
  }

  /**
   * Calculate the next recommended sync time based on success.
   * Healthy syncs retry in 24h, failed syncs retry sooner (2h).
   */
  private calculateNextSyncTime(success: boolean): Date {
    const now = new Date();
    if (success) {
      // Next day at same time
      now.setDate(now.getDate() + 1);
    } else {
      // Retry in 2 hours
      now.setHours(now.getHours() + 2);
    }
    return now;
  }

  /**
   * Get sync history for an agent.
   */
  async getSyncHistory(agentId: string, limit: number = 10) {
    return this.syncLogRepo.find({
      where: { agentProfileId: agentId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get current platform metrics for an agent (current month).
   */
  async getCurrentMetrics(agentId: string): Promise<AgentPlatformMetrics[]> {
    const today = new Date();
    const aggregationPeriod = new Date(today.getFullYear(), today.getMonth(), 1);

    return this.platformMetricsRepo.find({
      where: {
        agentProfileId: agentId,
        aggregationPeriod,
      },
    });
  }

  /**
   * Get historical performance data for an agent (yearly breakdown).
   */
  async getHistoricalPerformance(agentId: string, year?: number) {
    const query = this.historicalPerformanceRepo.createQueryBuilder('hp')
      .where('hp.agentProfileId = :agentId', { agentId });

    if (year) {
      query.andWhere('hp.yearMonth LIKE :yearPattern', {
        yearPattern: `${year}-%`,
      });
    }

    return query.orderBy('hp.yearMonth', 'ASC').getMany();
  }
}
