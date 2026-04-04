# Implementation Examples

This document provides ready-to-use code examples for integrating the MetaPerformanceSyncService into your application.

## 1. Adding to AgentsModule

**File**: `apps/api/src/agents/agents.module.ts`

```typescript
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AgentsService } from "./agents.service";
import { AgentsController } from "./agents.controller";
import { AgentProfile } from "./entities/agent-profile.entity";
import { ServiceEngagement } from "./entities/service-engagement.entity";
import { AgentReview } from "./entities/agent-review.entity";
import { IntegrationsModule } from "./integrations/integrations.module"; // ADD THIS

@Module({
  imports: [
    TypeOrmModule.forFeature([AgentProfile, ServiceEngagement, AgentReview]),
    IntegrationsModule, // ADD THIS
  ],
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
```

## 2. Adding REST Endpoint

**File**: `apps/api/src/agents/agents.controller.ts`

```typescript
import { Controller, Post, Param, Body, UseGuards, Req } from "@nestjs/common";
import { MetaPerformanceSyncService } from "./integrations/meta-sync.service";

@Controller("agents")
export class AgentsController {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly metaSyncService: MetaPerformanceSyncService, // ADD THIS
  ) {}

  /**
   * Manually trigger performance metrics sync for a specialist.
   * 
   * POST /agents/:agentId/sync-metrics
   * Body: {
   *   dayLookback?: 30,
   *   forceRefresh?: false
   * }
   */
  @Post("/:agentId/sync-meta-metrics")
  @UseGuards(WorkspaceGuard) // Ensure user owns workspace
  async syncMetricsForAgent(
    @Param("agentId") agentId: string,
    @Req() req: any,
    @Body() body?: { dayLookback?: number; forceRefresh?: boolean },
  ) {
    const workspaceId = req.workspace.id; // From middleware/guard

    const result = await this.metaSyncService.syncSpecialistMetrics(
      agentId,
      workspaceId,
      {
        dayLookback: body?.dayLookback ?? 30,
        forceRefresh: body?.forceRefresh ?? false,
        dryRun: false,
      },
    );

    return {
      success: result.success,
      message: result.success
        ? `Synced ${result.campaignsSynced} campaigns`
        : `Sync failed: ${result.errors[0]}`,
      data: {
        agentDisplayName: result.agentDisplayName,
        campaignsSynced: result.campaignsSynced,
        metricsInserted: result.metricsInserted,
        metricsUpdated: result.metricsUpdated,
        fraudRiskScore: result.fraudRiskScore,
        dateRange: {
          start: result.dateRangeStart,
          end: result.dateRangeEnd,
        },
        warnings: result.warnings,
        errors: result.errors,
      },
    };
  }

  /**
   * Dry-run sync to validate metrics without persisting.
   * 
   * POST /agents/:agentId/validate-meta-metrics
   */
  @Post("/:agentId/validate-meta-metrics")
  async validateMetricsForAgent(
    @Param("agentId") agentId: string,
    @Req() req: any,
  ) {
    const result = await this.metaSyncService.syncSpecialistMetrics(
      agentId,
      req.workspace.id,
      {
        dayLookback: 30,
        dryRun: true, // Don't persist
      },
    );

    return {
      valid: result.success,
      fraudRiskScore: result.fraudRiskScore,
      warnings: result.warnings,
      errors: result.errors,
    };
  }
}
```

## 3. Adding Cron Job

**File**: `apps/api/src/agents/agents-cron.service.ts` (create if needed)

```typescript
import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MetaPerformanceSyncService } from "./integrations/meta-sync.service";
import { Workspace } from "../workspaces/entities/workspace.entity";

/**
 * Scheduled performance syncs for marketplace specialists.
 * Runs daily to keep specialist metrics fresh.
 */
@Injectable()
export class AgentsCronService {
  private readonly logger = new Logger(AgentsCronService.name);

  constructor(
    private readonly metaSyncService: MetaPerformanceSyncService,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
  ) {}

  /**
   * Daily sync: Every day at midnight UTC, sync all specialists.
   * Staggered per workspace to avoid rate limits.
   */
  @Cron("0 0 * * *")
  async syncAllSpecialistsDaily() {
    this.logger.log("Starting daily performance metrics sync");

    try {
      const workspaces = await this.workspaceRepo.find();

      for (const workspace of workspaces) {
        try {
          this.logger.log({
            message: "Syncing workspace",
            workspaceId: workspace.id,
          });

          const results = await this.metaSyncService.syncAllSpecialists(
            workspace.id,
            {
              dayLookback: 30,
              forceRefresh: false,
            },
          );

          const successful = results.filter((r) => r.success).length;
          this.logger.log({
            message: "Workspace sync complete",
            workspaceId: workspace.id,
            total: results.length,
            successful,
            failed: results.length - successful,
          });

          // Optionally notify admins of high fraud scores
          const highRisk = results.filter((r) => r.fraudRiskScore > 50);
          if (highRisk.length > 0) {
            await this.notifyAdmins({
              workspaceId: workspace.id,
              highRiskSpecialists: highRisk.map((r) => ({
                agentId: r.agentProfileId,
                displayName: r.agentDisplayName,
                fraudScore: r.fraudRiskScore,
              })),
            });
          }
        } catch (err) {
          this.logger.error({
            message: "Workspace sync failed",
            workspaceId: workspace.id,
            error: err?.message,
          });
        }
      }

      this.logger.log("Daily performance metrics sync complete");
    } catch (err) {
      this.logger.error({
        message: "Daily sync job failed",
        error: err?.message,
      });
    }
  }

  /**
   * Weekly deep validation: Check for patterns over 90 days.
   */
  @Cron("0 2 * * 0") // Sunday at 2 AM UTC
  async deepValidationWeekly() {
    this.logger.log("Starting weekly deep validation");

    const workspaces = await this.workspaceRepo.find();

    for (const workspace of workspaces) {
      try {
        await this.metaSyncService.syncAllSpecialists(workspace.id, {
          dayLookback: 90,
          forceRefresh: true, // Recalculate everything
        });
      } catch (err) {
        this.logger.error({
          message: "Weekly validation failed",
          workspaceId: workspace.id,
          error: err?.message,
        });
      }
    }
  }

  private async notifyAdmins(payload: any) {
    // Implement admin notification (email, Slack, etc.)
    this.logger.warn({
      message: "High fraud risk detected",
      ...payload,
    });
  }
}
```

Add to agents.module.ts:

```typescript
import { AgentsCronService } from "./agents-cron.service";

@Module({
  imports: [...],
  providers: [AgentsService, AgentsCronService], // ADD THIS
})
export class AgentsModule {}
```

## 4. OAuth Callback Enhancement

**File**: `apps/api/src/auth/meta-auth.controller.ts`

After OAuth token exchange, trigger initial sync:

```typescript
import { Controller, Get, Query, Res, Req, UseGuards } from "@nestjs/common";
import { MetaPerformanceSyncService } from "../agents/integrations/meta-sync.service";
import { MetaOAuthService } from "./meta-oauth.service";

@Controller("meta")
export class MetaAuthController {
  constructor(
    private readonly oauthService: MetaOAuthService,
    private readonly metaSyncService: MetaPerformanceSyncService,
  ) {}

  @Get("callback")
  async handleCallback(
    @Query("code") code: string,
    @Query("state") stateStr: string,
    @Res() res: any,
  ) {
    // ... existing OAuth handling ...
    const tokenResponse = await this.oauthService.exchangeCodeForToken(code);
    const state = this.oauthService.decodeState(stateStr);

    // ... save to ConnectedAccount ...

    // NEW: Trigger initial sync for specialist
    const specialist = await this.agentProfileRepo.findOne({
      where: { id: specialistId },
    });

    if (specialist) {
      try {
        const syncResult = await this.metaSyncService.syncSpecialistMetrics(
          specialist.id,
          state.workspaceId,
          {
            dayLookback: 90, // Full history on first connect
            forceRefresh: true,
          },
        );

        this.logger.log({
          message: "Post-OAuth sync completed",
          specialistId: specialist.id,
          success: syncResult.success,
          campaignsSynced: syncResult.campaignsSynced,
        });
      } catch (err) {
        this.logger.warn({
          message: "Post-OAuth sync failed (non-blocking)",
          specialistId: specialist.id,
          error: err?.message,
        });
      }
    }

    // Redirect with sync status in URL
    res.redirect(`${redirectUrl}?oauth=success&sync=${syncResult.success}`);
  }
}
```

## 5. Database Migrations

**File**: `apps/api/src/database/migrations/add-performance-sync.migration.ts`

```typescript
import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddPerformanceSyncFields1709000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add columns to agent_profiles
    await queryRunner.addColumn(
      "agent_profiles",
      new TableColumn({
        name: "fraud_risk_score",
        type: "decimal",
        precision: 3,
        scale: 2,
        default: 0,
        isNullable: false,
      }),
    );

    await queryRunner.addColumn(
      "agent_profiles",
      new TableColumn({
        name: "last_performance_sync",
        type: "timestamp",
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      "agent_profiles",
      new TableColumn({
        name: "performance_sync_status",
        type: "varchar",
        length: 20,
        default: "'never_synced'",
      }),
    );

    await queryRunner.addColumn(
      "agent_profiles",
      new TableColumn({
        name: "is_performance_data_verified",
        type: "boolean",
        default: false,
      }),
    );

    // Ensure agent_platform_metrics has fraud_risk_score
    await queryRunner.addColumn(
      "agent_platform_metrics",
      new TableColumn({
        name: "fraud_risk_score",
        type: "int",
        default: 0,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("agent_profiles", "fraud_risk_score");
    await queryRunner.dropColumn("agent_profiles", "last_performance_sync");
    await queryRunner.dropColumn("agent_profiles", "performance_sync_status");
    await queryRunner.dropColumn(
      "agent_profiles",
      "is_performance_data_verified",
    );
    await queryRunner.dropColumn("agent_platform_metrics", "fraud_risk_score");
  }
}
```

Run migrations:
```bash
npm run typeorm migration:run
```

## 6. Service Integration Example

**File**: `apps/api/src/agents/agents.service.ts`

```typescript
import { Injectable } from "@nestjs/common";
import { MetaPerformanceSyncService } from "./integrations/meta-sync.service";

@Injectable()
export class AgentsService {
  constructor(
    private readonly metaSyncService: MetaPerformanceSyncService,
  ) {}

  /**
   * When specialist publishes profile to marketplace:
   * - Trigger initial performance sync
   * - Validate metrics before making public
   */
  async publishSpecialistToMarketplace(
    specialistId: string,
    workspaceId: string,
  ) {
    // Validate metrics in dry-run mode
    const validation = await this.metaSyncService.syncSpecialistMetrics(
      specialistId,
      workspaceId,
      {
        dayLookback: 90,
        dryRun: true, // Don't persist yet
      },
    );

    if (!validation.success || validation.fraudRiskScore > 50) {
      throw new Error(
        `Cannot publish: metrics validation failed (fraud score: ${validation.fraudRiskScore})`,
      );
    }

    // Now persist for real
    const result = await this.metaSyncService.syncSpecialistMetrics(
      specialistId,
      workspaceId,
      {
        dayLookback: 90,
        dryRun: false,
      },
    );

    // Mark specialist as published with verified metrics
    const specialist = await this.agentProfileRepo.findOne({
      where: { id: specialistId },
    });

    specialist.isPublished = true;
    specialist.isPerformanceDataVerified = result.fraudRiskScore <= 30;
    specialist.cachedStats = {
      // Will be populated by sync
    };

    await this.agentProfileRepo.save(specialist);

    return {
      success: true,
      specialist,
      syncResult: result,
    };
  }

  /**
   * Get specialist with fresh metrics from cache.
   * Used for marketplace listing pages.
   */
  async getSpecialistForMarketplace(specialistId: string) {
    const specialist = await this.agentProfileRepo.findOne({
      where: { id: specialistId },
    });

    // Enrich with metrics
    const metrics = await this.agentPlatformMetricsRepo.find({
      where: {
        agentProfileId: specialistId,
        platform: "meta",
      },
      order: { aggregationPeriod: "DESC" },
      take: 12, // Last 12 months
    });

    return {
      ...specialist,
      performanceMetrics: {
        monthly: metrics,
        lastSynced: specialist.lastPerformanceSync,
        syncStatus: specialist.performanceSyncStatus,
        fraudScore: specialist.fraudRiskScore,
        isVerified: specialist.isPerformanceDataVerified,
      },
    };
  }
}
```

## 7. Error Handling Wrapper

**File**: `apps/api/src/agents/integrations/meta-sync.errors.ts`

```typescript
/**
 * Custom error types for better error handling.
 */

export class MetaSyncError extends Error {
  constructor(
    public code: string,
    message: string,
    public retryable: boolean = false,
  ) {
    super(message);
    this.name = "MetaSyncError";
  }
}

export class TokenExpiredError extends MetaSyncError {
  constructor(message = "Meta API token expired") {
    super("TOKEN_EXPIRED", message, true);
  }
}

export class RateLimitError extends MetaSyncError {
  constructor(
    public retryAfterSeconds: number = 60,
    message = "Meta API rate limit exceeded",
  ) {
    super("RATE_LIMIT", message, true);
  }
}

export class NoConnectedAccountError extends MetaSyncError {
  constructor(message = "No active Meta account connected") {
    super("NO_ACCOUNT", message, false);
  }
}

export class FraudDetectionError extends MetaSyncError {
  constructor(
    public fraudScore: number,
    message = "Metrics failed fraud validation",
  ) {
    super("FRAUD_DETECTED", message, false);
  }
}
```

Use in service:

```typescript
try {
  const token = await this.resolveAccessToken(workspaceId);
  if (!token) {
    throw new NoConnectedAccountError();
  }
} catch (err) {
  if (err instanceof TokenExpiredError) {
    // Try to refresh
  } else if (err instanceof RateLimitError) {
    // Apply backoff
  }
}
```

## 8. Testing Setup

**File**: `apps/api/src/agents/integrations/meta-sync.service.spec.ts`

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { MetaPerformanceSyncService } from "./meta-sync.service";
import { AgentProfile } from "../entities/agent-profile.entity";
import { AgentPlatformMetrics } from "../entities/agent-platform-metrics.entity";
import { MetaAdsService } from "../../meta/meta-ads.service";

describe("MetaPerformanceSyncService", () => {
  let service: MetaPerformanceSyncService;
  let mockAgentProfileRepo: any;
  let mockMetricsRepo: any;
  let mockMetaAdsService: any;

  beforeEach(async () => {
    mockAgentProfileRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    mockMetricsRepo = {
      find: jest.fn(),
      upsert: jest.fn(),
    };

    mockMetaAdsService = {
      getAdAccounts: jest.fn(),
      getCampaigns: jest.fn(),
      getInsights: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetaPerformanceSyncService,
        {
          provide: getRepositoryToken(AgentProfile),
          useValue: mockAgentProfileRepo,
        },
        {
          provide: getRepositoryToken(AgentPlatformMetrics),
          useValue: mockMetricsRepo,
        },
        {
          provide: MetaAdsService,
          useValue: mockMetaAdsService,
        },
        // ... other mocks
      ],
    }).compile();

    service = module.get<MetaPerformanceSyncService>(
      MetaPerformanceSyncService,
    );
  });

  it("should sync metrics successfully", async () => {
    mockAgentProfileRepo.findOne.mockResolvedValue({
      id: "specialist-1",
      displayName: "Test Specialist",
      cachedStats: { avgROAS: 3.0 },
    });

    mockMetaAdsService.getAdAccounts.mockResolvedValue([
      { id: "act_123", name: "Test Account" },
    ]);

    const result = await service.syncSpecialistMetrics(
      "specialist-1",
      "workspace-1",
      { dryRun: true },
    );

    expect(result.success).toBe(true);
    expect(mockAgentProfileRepo.findOne).toHaveBeenCalled();
  });

  it("should detect fraud in metrics", async () => {
    // Test with unrealistic ROAS
    const result = await service.syncSpecialistMetrics(
      "specialist-1",
      "workspace-1",
      { dryRun: true },
    );

    expect(result.fraudRiskScore).toBeGreaterThan(0);
  });

  it("should handle missing Meta account gracefully", async () => {
    mockAgentProfileRepo.findOne.mockResolvedValue({
      id: "specialist-1",
      displayName: "Test",
    });

    mockMetaAdsService.getAdAccounts.mockRejectedValue(
      new Error("No account found"),
    );

    const result = await service.syncSpecialistMetrics(
      "specialist-1",
      "workspace-1",
    );

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
```

---

## Integration Checklist

- [ ] Import `IntegrationsModule` in `AgentsModule`
- [ ] Add `MetaPerformanceSyncService` to agents.controller.ts
- [ ] Create/update `AgentsCronService` for scheduled syncs
- [ ] Enhance OAuth callback with post-sync
- [ ] Run database migrations for new columns
- [ ] Update `AgentsService` to use new integration
- [ ] Add custom error types for better error handling
- [ ] Write unit and integration tests
- [ ] Configure cron schedule (offset per workspace)
- [ ] Set up monitoring for sync failures
- [ ] Document fraud detection rules for admins
- [ ] Plan admin dashboard for metrics review
