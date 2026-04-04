/**
 * PERFORMANCE SYNC INTEGRATION EXAMPLES
 *
 * This file demonstrates how to integrate PerformanceSyncService into your
 * controllers, cron jobs, and background services. It's not meant to be executed
 * directly, but rather as a reference for implementation patterns.
 */

// ============================================================================
// EXAMPLE 1: Controller Integration
// ============================================================================

import { Controller, Post, Get, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PerformanceSyncService } from './performance-sync.service';
import { AgentsService } from '../agents.service';

interface SyncPerformanceDto {
  platformsToSync?: ('meta' | 'google' | 'yandex')[];
  forceSync?: boolean;
}

@Controller('agents')
@UseGuards(AuthGuard('jwt'))
export class AgentsPerformanceController {
  constructor(
    private readonly performanceSync: PerformanceSyncService,
    private readonly agentsService: AgentsService,
  ) {}

  /**
   * POST /agents/:id/sync-performance
   * Manually trigger performance sync for an agent
   *
   * Example request:
   * POST /agents/agent-123/sync-performance
   * {
   *   "platformsToSync": ["meta", "google"],
   *   "forceSync": false
   * }
   */
  @Post(':id/sync-performance')
  async syncAgentPerformance(
    @Param('id') agentId: string,
    @Body() dto: SyncPerformanceDto,
    @Req() req: any,
  ) {
    // Verify caller has permission to sync this agent
    const agent = await this.agentsService.findOne(agentId);

    // Only the agent owner or admins can trigger sync
    if (agent.ownerId && agent.ownerId !== req.user.id && req.user.role !== 'admin') {
      throw new ForbiddenException('Access denied');
    }

    // Trigger sync
    const result = await this.performanceSync.syncAgentPerformance(agentId, {
      platformsToSync: dto.platformsToSync,
      forceSync: dto.forceSync,
    });

    return {
      success: result.success,
      message: result.success
        ? `Successfully synced ${result.metricsStored} metrics from ${result.platformsProcessed.join(', ')}`
        : `Sync completed with errors: ${result.errors.join('; ')}`,
      data: result,
    };
  }

  /**
   * GET /agents/:id/performance-metrics
   * Get current month's performance metrics (per platform)
   *
   * Example request:
   * GET /agents/agent-123/performance-metrics
   *
   * Example response:
   * {
   *   "data": [
   *     {
   *       "id": "metric-123",
   *       "platform": "meta",
   *       "aggregationPeriod": "2024-04-01",
   *       "totalSpend": 15000,
   *       "campaignsCount": 12,
   *       "avgRoas": 3.2,
   *       "avgCpa": 25.50,
   *       "avgCtr": 0.032,
   *       "conversionCount": 587,
   *       "totalRevenue": 48000
   *     }
   *   ]
   * }
   */
  @Get(':id/performance-metrics')
  async getCurrentMetrics(@Param('id') agentId: string) {
    const agent = await this.agentsService.findOne(agentId);
    const metrics = await this.performanceSync.getCurrentMetrics(agentId);

    return {
      agentId,
      displayName: agent.displayName,
      metrics,
      lastSyncedAt: agent.lastPerformanceSync,
      syncStatus: agent.performanceSyncStatus,
    };
  }

  /**
   * GET /agents/:id/performance-history
   * Get historical performance data (yearly trends)
   *
   * Example request:
   * GET /agents/agent-123/performance-history?year=2024
   *
   * Example response:
   * {
   *   "data": [
   *     {
   *       "yearMonth": "2024-01",
   *       "platforms": ["meta", "google"],
   *       "totalCampaigns": 45,
   *       "totalSpend": 150000,
   *       "avgRoas": 3.5,
   *       "avgCpa": 28.50,
   *       "avgCtr": 0.034,
   *       "bestRoas": 5.2,
   *       "successRate": 87.5
   *     }
   *   ]
   * }
   */
  @Get(':id/performance-history')
  async getHistoricalPerformance(
    @Param('id') agentId: string,
    @Query('year') year?: string,
  ) {
    const agent = await this.agentsService.findOne(agentId);
    const history = await this.performanceSync.getHistoricalPerformance(
      agentId,
      year ? parseInt(year) : undefined,
    );

    return {
      agentId,
      displayName: agent.displayName,
      history,
      year: year || 'all',
      cachedStats: agent.cachedStats,
    };
  }

  /**
   * GET /agents/:id/sync-history
   * Get recent sync operation logs (for monitoring)
   *
   * Example request:
   * GET /agents/agent-123/sync-history?limit=20
   */
  @Get(':id/sync-history')
  async getSyncHistory(
    @Param('id') agentId: string,
    @Query('limit') limit: string = '10',
  ) {
    const history = await this.performanceSync.getSyncHistory(
      agentId,
      Math.min(parseInt(limit), 100), // Max 100 records
    );

    return {
      agentId,
      syncHistory: history,
      recordCount: history.length,
    };
  }

  /**
   * GET /agents/:id/performance-health
   * Get agent's performance sync health status
   *
   * Example response:
   * {
   *   "status": "healthy",
   *   "lastSyncedAt": "2024-04-04T10:30:00Z",
   *   "isStale": false,
   *   "hasCachedStats": true,
   *   "cachedStats": {
   *     "avgROAS": 3.2,
   *     "avgCPA": 25.50,
   *     "avgCTR": 0.032,
   *     "totalCampaigns": 45,
   *     "activeCampaigns": 32,
   *     "successRate": 87.5,
   *     "totalSpendManaged": 150000,
   *     "bestROAS": 5.2
   *   }
   * }
   */
  @Get(':id/performance-health')
  async checkPerformanceHealth(@Param('id') agentId: string) {
    const agent = await this.agentsService.findOne(agentId);

    const lastSync = agent.lastPerformanceSync
      ? new Date(agent.lastPerformanceSync)
      : null;
    const now = new Date();
    const hoursSinceSync = lastSync
      ? Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60 * 60))
      : null;

    return {
      agentId,
      status: agent.performanceSyncStatus,
      lastSyncedAt: lastSync,
      hoursSinceSyncLastSync: hoursSinceSync,
      isStale: hoursSinceSync ? hoursSinceSync > 24 : true,
      hasCachedStats: !!agent.cachedStats,
      cachedStats: agent.cachedStats,
      nextRecommendedSync: this.calculateNextRecommendedSync(
        agent.performanceSyncStatus,
        lastSync,
      ),
    };
  }

  private calculateNextRecommendedSync(status: string, lastSync: Date | null): Date {
    const now = new Date();
    if (status === 'failed') {
      // Retry in 1 hour for failed syncs
      return new Date(now.getTime() + 60 * 60 * 1000);
    } else if (status === 'healthy' && lastSync) {
      // Next sync in 24 hours
      return new Date(lastSync.getTime() + 24 * 60 * 60 * 1000);
    } else {
      // First sync or unknown — sync immediately
      return now;
    }
  }
}

// ============================================================================
// EXAMPLE 2: Cron Service for Automatic Syncs
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentProfile } from '../entities/agent-profile.entity';

@Injectable()
export class PerformanceSyncCronService {
  private readonly logger = new Logger(PerformanceSyncCronService.name);

  constructor(
    private readonly performanceSync: PerformanceSyncService,
    @InjectRepository(AgentProfile)
    private readonly agentRepo: Repository<AgentProfile>,
  ) {}

  /**
   * Run every 6 hours
   * Sync all published agents with active engagements
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async syncPublishedAgents() {
    this.logger.log('Starting scheduled performance sync for all published agents');

    try {
      // Find all published agents
      const agents = await this.agentRepo.find({
        where: { isPublished: true },
      });

      let successCount = 0;
      let failureCount = 0;

      for (const agent of agents) {
        try {
          const result = await this.performanceSync.syncAgentPerformance(agent.id);

          if (result.success) {
            successCount++;
            this.logger.debug(
              `Agent ${agent.slug}: synced ${result.metricsStored} metrics`,
            );
          } else {
            failureCount++;
            this.logger.warn(`Agent ${agent.slug}: ${result.errors.join('; ')}`);
          }
        } catch (err: any) {
          failureCount++;
          this.logger.error(
            `Agent ${agent.slug}: unexpected error`,
            err,
          );
        }
      }

      this.logger.log({
        message: 'Scheduled sync complete',
        totalAgents: agents.length,
        successCount,
        failureCount,
      });
    } catch (err: any) {
      this.logger.error('Scheduled sync failed', err);
    }
  }

  /**
   * Run every hour
   * Retry failed syncs for agents with 'failed' status
   */
  @Cron(CronExpression.EVERY_HOUR)
  async retryFailedSyncs() {
    try {
      const failedAgents = await this.agentRepo.find({
        where: { performanceSyncStatus: 'failed' },
      });

      for (const agent of failedAgents) {
        // Only retry if we haven't synced in the last hour
        const lastSync = agent.lastPerformanceSync
          ? new Date(agent.lastPerformanceSync)
          : null;
        const hoursSince = lastSync
          ? Math.floor((Date.now() - lastSync.getTime()) / (1000 * 60 * 60))
          : 999;

        if (hoursSince > 1) {
          this.logger.log(`Retrying sync for agent ${agent.slug}`);
          await this.performanceSync.syncAgentPerformance(agent.id);
        }
      }
    } catch (err: any) {
      this.logger.error('Retry sync failed', err);
    }
  }

  /**
   * Run at midnight every day
   * Generate daily digest of sync results
   */
  @Cron('0 0 * * *')
  async generateDailyDigest() {
    try {
      const agents = await this.agentRepo.find({
        where: { isPublished: true },
      });

      const healthStatuses = {
        healthy: 0,
        stale: 0,
        failed: 0,
        never_synced: 0,
      };

      for (const agent of agents) {
        healthStatuses[agent.performanceSyncStatus]++;
      }

      this.logger.log({
        message: 'Daily sync digest',
        totalAgents: agents.length,
        healthStatuses,
      });

      // Could send email notification, log to monitoring, etc.
    } catch (err: any) {
      this.logger.error('Daily digest generation failed', err);
    }
  }
}

// ============================================================================
// EXAMPLE 3: Background Job Queue (BullMQ)
// ============================================================================

import { Job } from 'bull';
import { Process, Processor, OnGlobalQueueError } from '@nestjs/bull';

@Processor('performance-sync')
export class PerformanceSyncQueueProcessor {
  private readonly logger = new Logger(PerformanceSyncQueueProcessor.name);

  constructor(
    private readonly performanceSync: PerformanceSyncService,
  ) {}

  /**
   * Process sync jobs from queue
   * Allows async syncs without blocking HTTP requests
   *
   * Usage:
   * const job = await this.performanceSyncQueue.add(
   *   { agentId: 'agent-123' },
   *   { priority: 10, delay: 1000 }
   * );
   */
  @Process()
  async syncAgent(job: Job<{ agentId: string }>) {
    this.logger.log(`Processing sync job for agent ${job.data.agentId}`);

    try {
      const result = await this.performanceSync.syncAgentPerformance(
        job.data.agentId,
      );

      return {
        success: result.success,
        metricsStored: result.metricsStored,
        platformsProcessed: result.platformsProcessed,
        errors: result.errors,
      };
    } catch (err: any) {
      this.logger.error(`Job failed for agent ${job.data.agentId}`, err);
      throw err;
    }
  }

  @OnGlobalQueueError()
  globalError(error: Error) {
    this.logger.error('Queue error occurred', error);
  }
}

// ============================================================================
// EXAMPLE 4: Admin Panel Service
// ============================================================================

@Injectable()
export class AdminPerformanceService {
  constructor(
    private readonly performanceSync: PerformanceSyncService,
    @InjectRepository(AgentProfile)
    private readonly agentRepo: Repository<AgentProfile>,
  ) {}

  /**
   * Get overall performance sync dashboard stats
   */
  async getDashboardStats() {
    const agents = await this.agentRepo.find();

    const stats = {
      totalAgents: agents.length,
      publishedAgents: agents.filter((a) => a.isPublished).length,
      syncStatus: {
        healthy: agents.filter((a) => a.performanceSyncStatus === 'healthy').length,
        stale: agents.filter((a) => a.performanceSyncStatus === 'stale').length,
        failed: agents.filter((a) => a.performanceSyncStatus === 'failed').length,
        never_synced: agents.filter((a) => a.performanceSyncStatus === 'never_synced').length,
      },
      totalCachedSpend: agents.reduce(
        (sum, a) => sum + (a.cachedStats?.totalSpendManaged || 0),
        0,
      ),
      averageROAS: agents.length > 0
        ? agents.reduce((sum, a) => sum + (a.cachedStats?.avgROAS || 0), 0) / agents.length
        : 0,
    };

    return stats;
  }

  /**
   * Force sync all agents (admin command)
   */
  async forceSyncAll() {
    const agents = await this.agentRepo.find({ where: { isPublished: true } });

    const results = [];

    for (const agent of agents) {
      try {
        const result = await this.performanceSync.syncAgentPerformance(agent.id, {
          forceSync: true,
        });
        results.push({
          agentId: agent.id,
          slug: agent.slug,
          success: result.success,
          metricsStored: result.metricsStored,
        });
      } catch (err: any) {
        results.push({
          agentId: agent.id,
          slug: agent.slug,
          success: false,
          error: err?.message,
        });
      }
    }

    return results;
  }
}

// ============================================================================
// EXAMPLE 5: Marketplace Service
// ============================================================================

@Injectable()
export class MarketplacePerformanceService {
  constructor(
    private readonly performanceSync: PerformanceSyncService,
    @InjectRepository(AgentProfile)
    private readonly agentRepo: Repository<AgentProfile>,
  ) {}

  /**
   * Get agent's public performance profile for marketplace
   */
  async getAgentMarketplaceProfile(agentId: string) {
    const agent = await this.agentRepo.findOne({ where: { id: agentId } });

    if (!agent?.isPublished) {
      throw new NotFoundException('Agent not found or not published');
    }

    const metrics = await this.performanceSync.getCurrentMetrics(agentId);
    const history = await this.performanceSync.getHistoricalPerformance(agentId);

    return {
      id: agent.id,
      slug: agent.slug,
      displayName: agent.displayName,
      title: agent.title,
      bio: agent.bio,
      avatar: agent.avatar,
      // Current performance
      cachedStats: agent.cachedStats,
      // Per-platform breakdown
      platformMetrics: metrics,
      // Historical trend
      monthlyPerformance: history,
      // Trust indicators
      isVerified: agent.isVerified,
      cachedRating: agent.cachedRating,
      cachedReviewCount: agent.cachedReviewCount,
      // Last sync info
      lastSyncedAt: agent.lastPerformanceSync,
      syncStatus: agent.performanceSyncStatus,
    };
  }

  /**
   * Rank agents by performance metric
   */
  async rankAgentsByMetric(metric: keyof any, limit: number = 10) {
    const agents = await this.agentRepo.find({
      where: { isPublished: true },
      order: { isProMember: 'DESC' }, // Pro members first
    });

    const ranked = agents
      .filter((a) => a.cachedStats)
      .sort((a, b) => {
        const aVal = a.cachedStats?.[metric] || 0;
        const bVal = b.cachedStats?.[metric] || 0;
        return bVal - aVal;
      })
      .slice(0, limit);

    return ranked.map((agent) => ({
      slug: agent.slug,
      displayName: agent.displayName,
      [metric]: agent.cachedStats?.[metric],
      rating: agent.cachedRating,
    }));
  }
}

// ============================================================================
// EXAMPLE 6: Usage in Module Registration
// ============================================================================

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'performance-sync',
    }),
  ],
  providers: [
    PerformanceSyncService,
    PerformanceSyncCronService,
    PerformanceSyncQueueProcessor,
    AdminPerformanceService,
    MarketplacePerformanceService,
  ],
  controllers: [
    AgentsPerformanceController,
  ],
})
export class PerformanceSyncModule {}

export { ForbiddenException } from '@nestjs/common';
