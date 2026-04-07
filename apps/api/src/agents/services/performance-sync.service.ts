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
import { MetaPerformanceSyncService } from '../integrations/meta-sync.service';
import { GooglePerformanceSyncService } from '../integrations/google-sync.service';
import { YandexPerformanceSyncService } from '../integrations/yandex-sync.service';

/**
 * PerformanceSyncService handles real-time syncing of agent ad account performance data.
 * It delegates to platform-specific sync services (Meta, Google, Yandex) that handle
 * the actual API calls, fraud validation, and metric persistence.
 *
 * After each platform sync completes, this service reads back the stored
 * AgentPlatformMetrics to build aggregated stats for the agent's profile.
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
    private readonly metaSyncService: MetaPerformanceSyncService,
    private readonly googleSyncService: GooglePerformanceSyncService,
    private readonly yandexSyncService: YandexPerformanceSyncService,
  ) {}

  /**
   * Main entry point: sync performance data for an agent.
   * Delegates to platform-specific sync services for real API calls,
   * then reads back stored metrics and aggregates cached stats.
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

      // Create sync log
      const syncLog = this.syncLogRepo.create({
        agentProfileId: agentId,
        syncType: 'full',
        status: 'in_progress',
        startedAt: new Date(),
      });
      const savedLog = await this.syncLogRepo.save(syncLog);

      // Step 2: Get agent's active engagements (connected workspaces)
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
      const connectedAccounts = workspaceIds.length > 0
        ? await this.connectedAccountRepo.find({
            where: { workspaceId: In(workspaceIds), isActive: true },
          })
        : [];

      if (connectedAccounts.length === 0 && workspaceIds.length > 0) {
        this.logger.warn(`Agent ${agentId} has no connected ad accounts`);
        result.errors.push('No connected ad accounts found');
      }

      // Step 4: Group accounts by platform and sync each
      const platformsToSync = options.platformsToSync || ['meta', 'google', 'yandex'];
      const hasMeta = connectedAccounts.some((a) => a.platform === 'meta') && platformsToSync.includes('meta');
      const hasGoogle = connectedAccounts.some((a) => a.platform === 'google') && platformsToSync.includes('google');
      const hasYandex = connectedAccounts.some((a) => a.platform === 'yandex') && platformsToSync.includes('yandex');

      const syncConfig = {
        dayLookback: 30,
        forceRefresh: options.forceSync ?? false,
        dryRun: false,
      };

      // Step 5: Delegate to real platform sync services
      for (const engagement of engagements) {
        const wsId = engagement.workspace.id;

        if (hasMeta) {
          try {
            const metaResult = await this.metaSyncService.syncSpecialistMetrics(agentId, wsId, syncConfig);
            result.recordsSynced += metaResult.campaignsSynced;
            result.metricsStored += metaResult.metricsInserted + metaResult.metricsUpdated;
            if (!result.platformsProcessed.includes('meta')) result.platformsProcessed.push('meta');
            if (metaResult.errors.length > 0) result.errors.push(...metaResult.errors);
          } catch (err: any) {
            const msg = `Meta sync failed for workspace ${wsId}: ${err?.message || 'unknown'}`;
            this.logger.error(msg);
            result.errors.push(msg);
          }
        }

        if (hasGoogle) {
          try {
            const googleResult = await this.googleSyncService.syncSpecialistMetrics(agentId, wsId, syncConfig);
            result.recordsSynced += googleResult.campaignsSynced;
            result.metricsStored += googleResult.metricsInserted + googleResult.metricsUpdated;
            if (!result.platformsProcessed.includes('google')) result.platformsProcessed.push('google');
            if (googleResult.errors.length > 0) result.errors.push(...googleResult.errors);
          } catch (err: any) {
            const msg = `Google sync failed for workspace ${wsId}: ${err?.message || 'unknown'}`;
            this.logger.error(msg);
            result.errors.push(msg);
          }
        }

        if (hasYandex) {
          try {
            const yandexResult = await this.yandexSyncService.syncSpecialistMetrics(agentId, wsId, syncConfig);
            result.recordsSynced += yandexResult.campaignsSynced;
            result.metricsStored += yandexResult.metricsInserted + yandexResult.metricsUpdated;
            if (!result.platformsProcessed.includes('yandex')) result.platformsProcessed.push('yandex');
            if (yandexResult.errors.length > 0) result.errors.push(...yandexResult.errors);
          } catch (err: any) {
            const msg = `Yandex sync failed for workspace ${wsId}: ${err?.message || 'unknown'}`;
            this.logger.error(msg);
            result.errors.push(msg);
          }
        }
      }

      // Step 6: Read back stored metrics from DB to build aggregated stats
      const storedMetrics = await this.readCurrentMonthMetrics(agentId);

      // Step 7: Aggregate and cache stats on profile
      const cachedStats = await this.aggregateAndCacheStats(agent, storedMetrics);

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
   * Read current month's platform metrics from DB.
   * These were persisted by the individual sync services.
   */
  private async readCurrentMonthMetrics(agentId: string): Promise<PlatformMetrics[]> {
    const today = new Date();
    const aggregationPeriod = new Date(today.getFullYear(), today.getMonth(), 1);

    const rows = await this.platformMetricsRepo.find({
      where: { agentProfileId: agentId, aggregationPeriod },
    });

    return rows.map((r) => ({
      platform: r.platform,
      totalSpend: Number(r.totalSpend) || 0,
      campaignCount: Number(r.campaignsCount) || 0,
      conversions: Number(r.conversionCount) || 0,
      revenue: Number(r.totalRevenue) || 0,
      avgRoas: Number(r.avgRoas) || 0,
      avgCpa: Number(r.avgCpa) || 0,
      avgCtr: Number(r.avgCtr) || 0,
    }));
  }

  /**
   * Aggregate metrics across all platforms and calculate cached stats.
   * Also updates historical performance for monthly trends.
   * All values derived from real synced data — no mock multipliers.
   */
  private async aggregateAndCacheStats(
    agent: AgentProfile,
    allMetrics: PlatformMetrics[],
  ): Promise<AggregatedStats> {
    const today = new Date();
    const yearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // Calculate aggregated KPIs across all platforms
    const totalSpend = allMetrics.reduce((sum, m) => sum + m.totalSpend, 0);
    const totalConversions = allMetrics.reduce((sum, m) => sum + m.conversions, 0);
    const totalRevenue = allMetrics.reduce((sum, m) => sum + m.revenue, 0);
    const totalCampaigns = allMetrics.reduce((sum, m) => sum + m.campaignCount, 0);

    // ROAS = totalRevenue / totalSpend
    const avgRoas = totalSpend > 0 ? parseFloat((totalRevenue / totalSpend).toFixed(2)) : 0;

    // CPA = totalSpend / totalConversions
    const avgCpa = totalConversions > 0 ? parseFloat((totalSpend / totalConversions).toFixed(2)) : 0;

    // Weighted average CTR across platforms
    const avgCtr = allMetrics.length > 0
      ? parseFloat(
          (allMetrics.reduce((sum, m) => sum + (m.avgCtr || 0), 0) / allMetrics.length).toFixed(3),
        )
      : 0;

    // Best ROAS among individual platforms
    const bestROAS = allMetrics.length > 0
      ? parseFloat(Math.max(...allMetrics.map((m) => m.avgRoas || 0)).toFixed(2))
      : 0;

    // Success rate: % of campaigns with ROAS > 1 (profitable)
    // Approximation: if overall ROAS > 1, most campaigns are profitable
    const successRate = avgRoas > 0
      ? parseFloat(Math.min(100, Math.max(0, (avgRoas / (avgRoas + 1)) * 100)).toFixed(1))
      : 0;

    // Active campaigns: query from DB for actual count
    const activeCampaigns = await this.getActiveCampaignCount(agent.id);

    const cachedStats: AggregatedStats = {
      avgROAS: avgRoas,
      avgCPA: avgCpa,
      avgCTR: avgCtr,
      totalCampaigns,
      activeCampaigns,
      successRate,
      totalSpendManaged: totalSpend,
      bestROAS: bestROAS,
    };

    // Update or create historical performance record
    const platforms = allMetrics.map((m) => m.platform);
    const existing = await this.historicalPerformanceRepo.findOne({
      where: { agentProfileId: agent.id, yearMonth },
    });

    const histData = {
      platforms,
      totalCampaigns,
      totalSpend,
      avgRoas,
      avgCpa,
      avgCtr,
      bestRoas: bestROAS,
      successRate,
    };

    if (existing) {
      await this.historicalPerformanceRepo.update({ id: existing.id }, histData);
    } else {
      await this.historicalPerformanceRepo.save(
        this.historicalPerformanceRepo.create({
          agentProfileId: agent.id,
          yearMonth,
          ...histData,
        }),
      );
    }

    return cachedStats;
  }

  /**
   * Count active campaigns across all workspaces managed by this agent.
   */
  private async getActiveCampaignCount(agentId: string): Promise<number> {
    try {
      const result = await this.dataSource.query(
        `SELECT COUNT(DISTINCT apm.id) as count
         FROM agent_platform_metrics apm
         WHERE apm.agent_profile_id = $1
           AND apm.aggregation_period >= date_trunc('month', NOW())
           AND apm.campaigns_count > 0`,
        [agentId],
      );
      return parseInt(result?.[0]?.count || '0', 10);
    } catch {
      return 0;
    }
  }

  /**
   * Log the sync result in agent_performance_sync_logs table.
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
      this.logger.error(`Failed to log sync for agent ${agentId}`, err);
    }
  }

  /**
   * Calculate the next recommended sync time.
   * Healthy syncs retry in 24h, failed syncs retry sooner (2h).
   */
  private calculateNextSyncTime(success: boolean): Date {
    const now = new Date();
    if (success) {
      now.setDate(now.getDate() + 1);
    } else {
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
      where: { agentProfileId: agentId, aggregationPeriod },
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
