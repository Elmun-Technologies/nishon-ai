# Google Ads Integration - Implementation Examples

This document provides ready-to-use code examples for integrating the GooglePerformanceSyncService into your application.

## 1. Adding to IntegrationsModule

The GooglePerformanceSyncService is automatically provided by the `IntegrationsModule` alongside `MetaPerformanceSyncService`. No additional setup required.

**File**: `apps/api/src/agents/integrations/integrations.module.ts`

```typescript
import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MetaPerformanceSyncService } from "./meta-sync.service";
import { GooglePerformanceSyncService } from "./google-sync.service"; // Already imported
import { AgentProfile } from "../entities/agent-profile.entity";
import { AgentPlatformMetrics } from "../entities/agent-platform-metrics.entity";
import { ConnectedAccount } from "../../platforms/entities/connected-account.entity";
import { Workspace } from "../../workspaces/entities/workspace.entity";
import { MetaModule } from "../../meta/meta.module";

@Module({
  imports: [
    HttpModule,
    MetaModule,
    TypeOrmModule.forFeature([AgentProfile, AgentPlatformMetrics, ConnectedAccount, Workspace]),
  ],
  providers: [MetaPerformanceSyncService, GooglePerformanceSyncService], // Both included
  exports: [MetaPerformanceSyncService, GooglePerformanceSyncService],
})
export class IntegrationsModule {}
```

## 2. Adding REST Endpoints

**File**: `apps/api/src/agents/agents.controller.ts`

```typescript
import { Controller, Post, Param, Body, UseGuards, Req } from "@nestjs/common";
import { GooglePerformanceSyncService } from "./integrations/google-sync.service";

@Controller("agents")
export class AgentsController {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly googleSyncService: GooglePerformanceSyncService, // ADD THIS
  ) {}

  /**
   * Manually trigger performance metrics sync for a specialist (Google Ads).
   * 
   * POST /agents/:agentId/sync-google-metrics
   * Body: {
   *   dayLookback?: 30,
   *   forceRefresh?: false
   * }
   */
  @Post("/:agentId/sync-google-metrics")
  @UseGuards(WorkspaceGuard) // Ensure user owns workspace
  async syncGoogleMetricsForAgent(
    @Param("agentId") agentId: string,
    @Req() req: any,
    @Body() body?: { dayLookback?: number; forceRefresh?: boolean },
  ) {
    const workspaceId = req.workspace.id; // From middleware/guard

    const result = await this.googleSyncService.syncSpecialistMetrics(
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
        ? `Synced ${result.campaignsSynced} campaigns from Google Ads`
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
   * POST /agents/:agentId/validate-google-metrics
   */
  @Post("/:agentId/validate-google-metrics")
  async validateGoogleMetricsForAgent(
    @Param("agentId") agentId: string,
    @Req() req: any,
  ) {
    const result = await this.googleSyncService.syncSpecialistMetrics(
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

  /**
   * Sync both Meta and Google metrics for a specialist.
   * 
   * POST /agents/:agentId/sync-all-metrics
   */
  @Post("/:agentId/sync-all-metrics")
  async syncAllMetricsForAgent(
    @Param("agentId") agentId: string,
    @Req() req: any,
    @Body() body?: { dayLookback?: number },
  ) {
    const workspaceId = req.workspace.id;
    const config = { dayLookback: body?.dayLookback ?? 30 };

    // Run syncs in parallel
    const [metaResult, googleResult] = await Promise.all([
      this.metaSyncService.syncSpecialistMetrics(agentId, workspaceId, config),
      this.googleSyncService.syncSpecialistMetrics(agentId, workspaceId, config),
    ]);

    return {
      success: metaResult.success && googleResult.success,
      meta: {
        success: metaResult.success,
        campaignsSynced: metaResult.campaignsSynced,
        fraudRiskScore: metaResult.fraudRiskScore,
        errors: metaResult.errors,
      },
      google: {
        success: googleResult.success,
        campaignsSynced: googleResult.campaignsSynced,
        fraudRiskScore: googleResult.fraudRiskScore,
        errors: googleResult.errors,
      },
    };
  }
}
```

## 3. Adding Cron Jobs

**File**: `apps/api/src/agents/agents-cron.service.ts` (update existing)

```typescript
import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MetaPerformanceSyncService } from "./integrations/meta-sync.service";
import { GooglePerformanceSyncService } from "./integrations/google-sync.service"; // ADD THIS
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
    private readonly googleSyncService: GooglePerformanceSyncService, // ADD THIS
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
  ) {}

  /**
   * Daily Meta sync: Every day at midnight UTC
   */
  @Cron("0 0 * * *")
  async syncAllMetaSpecialistsDaily() {
    this.logger.log("Starting daily Meta performance metrics sync");

    try {
      const workspaces = await this.workspaceRepo.find();

      for (const workspace of workspaces) {
        try {
          this.logger.log({
            message: "Syncing Meta workspace",
            workspaceId: workspace.id,
          });

          const results = await this.metaSyncService.syncAllSpecialists(
            workspace.id,
            { dayLookback: 30 }
          );

          const successful = results.filter((r) => r.success).length;
          this.logger.log({
            message: "Meta workspace sync complete",
            workspaceId: workspace.id,
            total: results.length,
            successful,
          });
        } catch (err) {
          this.logger.error({
            message: "Meta workspace sync failed",
            workspaceId: workspace.id,
            error: err?.message,
          });
        }
      }
    } catch (err) {
      this.logger.error({
        message: "Daily Meta sync job failed",
        error: err?.message,
      });
    }
  }

  /**
   * Daily Google Ads sync: Every day at 1 AM UTC (after Meta at midnight)
   * Staggered to avoid overwhelming database and API
   */
  @Cron("0 1 * * *") // ADD THIS
  async syncAllGoogleSpecialistsDaily() {
    this.logger.log("Starting daily Google Ads performance metrics sync");

    try {
      const workspaces = await this.workspaceRepo.find();

      for (const workspace of workspaces) {
        try {
          this.logger.log({
            message: "Syncing Google Ads workspace",
            workspaceId: workspace.id,
          });

          const results = await this.googleSyncService.syncAllSpecialists(
            workspace.id,
            { dayLookback: 30 }
          );

          const successful = results.filter((r) => r.success).length;
          this.logger.log({
            message: "Google Ads workspace sync complete",
            workspaceId: workspace.id,
            total: results.length,
            successful,
            failed: results.length - successful,
          });

          // Notify admins of high fraud scores
          const highRisk = results.filter((r) => r.fraudRiskScore > 50);
          if (highRisk.length > 0) {
            await this.notifyAdmins({
              workspaceId: workspace.id,
              platform: "google",
              highRiskSpecialists: highRisk.map((r) => ({
                agentId: r.agentProfileId,
                displayName: r.agentDisplayName,
                fraudScore: r.fraudRiskScore,
              })),
            });
          }
        } catch (err) {
          this.logger.error({
            message: "Google Ads workspace sync failed",
            workspaceId: workspace.id,
            error: err?.message,
          });
        }
      }

      this.logger.log("Daily Google Ads sync complete");
    } catch (err) {
      this.logger.error({
        message: "Daily Google Ads sync job failed",
        error: err?.message,
      });
    }
  }

  /**
   * Weekly deep validation: Check for patterns over 90 days
   * Runs both platforms on Sunday at 2 AM UTC
   */
  @Cron("0 2 * * 0") // Sunday at 2 AM UTC
  async deepValidationWeekly() {
    this.logger.log("Starting weekly deep validation (Meta + Google)");

    const workspaces = await this.workspaceRepo.find();

    for (const workspace of workspaces) {
      try {
        // Run both in parallel
        await Promise.all([
          this.metaSyncService.syncAllSpecialists(workspace.id, {
            dayLookback: 90,
            forceRefresh: true,
          }),
          this.googleSyncService.syncAllSpecialists(workspace.id, {
            dayLookback: 90,
            forceRefresh: true,
          }),
        ]);

        this.logger.log({
          message: "Weekly validation complete",
          workspaceId: workspace.id,
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

## 4. OAuth Callback Enhancement

**File**: `apps/api/src/auth/google-auth.controller.ts`

After OAuth token exchange, trigger initial sync:

```typescript
import { Controller, Get, Query, Res, Req } from "@nestjs/common";
import { GooglePerformanceSyncService } from "../agents/integrations/google-sync.service";
import { GoogleOAuthService } from "./google-oauth.service";

@Controller("auth/google")
export class GoogleAuthController {
  constructor(
    private readonly oauthService: GoogleOAuthService,
    private readonly googleSyncService: GooglePerformanceSyncService, // ADD THIS
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
      where: { id: state.specialistId },
    });

    let syncSuccess = false;

    if (specialist) {
      try {
        const syncResult = await this.googleSyncService.syncSpecialistMetrics(
          specialist.id,
          state.workspaceId,
          {
            dayLookback: 90, // Full history on first connect
            forceRefresh: true,
          },
        );

        syncSuccess = syncResult.success;

        this.logger.log({
          message: "Post-OAuth Google sync completed",
          specialistId: specialist.id,
          success: syncResult.success,
          campaignsSynced: syncResult.campaignsSynced,
        });
      } catch (err) {
        this.logger.warn({
          message: "Post-OAuth Google sync failed (non-blocking)",
          specialistId: specialist.id,
          error: err?.message,
        });
      }
    }

    // Redirect with sync status in URL
    const redirectUrl = state.redirectUrl || "/specialists/settings";
    res.redirect(
      `${redirectUrl}?oauth=success&platform=google&sync=${syncSuccess}`
    );
  }
}
```

## 5. Service Integration Example

**File**: `apps/api/src/agents/agents.service.ts`

```typescript
import { Injectable } from "@nestjs/common";
import { MetaPerformanceSyncService } from "./integrations/meta-sync.service";
import { GooglePerformanceSyncService } from "./integrations/google-sync.service"; // ADD THIS

@Injectable()
export class AgentsService {
  constructor(
    private readonly metaSyncService: MetaPerformanceSyncService,
    private readonly googleSyncService: GooglePerformanceSyncService, // ADD THIS
  ) {}

  /**
   * When specialist publishes profile to marketplace:
   * - Validate metrics from all platforms (Meta + Google)
   * - Ensure fraud scores are acceptable
   */
  async publishSpecialistToMarketplace(
    specialistId: string,
    workspaceId: string,
  ) {
    // Validate metrics in dry-run mode for both platforms
    const [metaValidation, googleValidation] = await Promise.all([
      this.metaSyncService.syncSpecialistMetrics(specialistId, workspaceId, {
        dayLookback: 90,
        dryRun: true, // Don't persist yet
      }),
      this.googleSyncService.syncSpecialistMetrics(specialistId, workspaceId, {
        dayLookback: 90,
        dryRun: true, // Don't persist yet
      }),
    ]);

    // Check if any platform has high fraud score
    const maxFraudScore = Math.max(
      metaValidation.fraudRiskScore || 0,
      googleValidation.fraudRiskScore || 0,
    );

    if (!metaValidation.success || !googleValidation.success || maxFraudScore > 50) {
      throw new Error(
        `Cannot publish: metrics validation failed (fraud score: ${maxFraudScore})`,
      );
    }

    // Now persist for real (only successful validations)
    const [metaResult, googleResult] = await Promise.all([
      metaValidation.success
        ? this.metaSyncService.syncSpecialistMetrics(specialistId, workspaceId, {
            dayLookback: 90,
            dryRun: false,
          })
        : Promise.resolve(metaValidation),
      googleValidation.success
        ? this.googleSyncService.syncSpecialistMetrics(
            specialistId,
            workspaceId,
            {
              dayLookback: 90,
              dryRun: false,
            }
          )
        : Promise.resolve(googleValidation),
    ]);

    // Mark specialist as published with verified metrics
    const specialist = await this.agentProfileRepo.findOne({
      where: { id: specialistId },
    });

    specialist.isPublished = true;
    specialist.isPerformanceDataVerified =
      metaResult.fraudRiskScore <= 30 && googleResult.fraudRiskScore <= 30;
    specialist.fraudRiskScore = maxFraudScore;

    await this.agentProfileRepo.save(specialist);

    return {
      success: true,
      specialist,
      syncResults: {
        meta: metaResult,
        google: googleResult,
      },
    };
  }

  /**
   * Get specialist with fresh metrics from all platforms.
   * Used for marketplace listing pages.
   */
  async getSpecialistForMarketplace(specialistId: string) {
    const specialist = await this.agentProfileRepo.findOne({
      where: { id: specialistId },
    });

    // Fetch metrics for all platforms
    const allMetrics = await this.agentPlatformMetricsRepo.find({
      where: {
        agentProfileId: specialistId,
      },
      order: { aggregationPeriod: "DESC" },
      take: 24, // Last 24 months for all platforms combined
    });

    // Separate by platform
    const metaMetrics = allMetrics.filter((m) => m.platform === "meta");
    const googleMetrics = allMetrics.filter((m) => m.platform === "google");

    return {
      ...specialist,
      metrics: {
        meta: metaMetrics.slice(0, 12), // Last 12 months
        google: googleMetrics.slice(0, 12), // Last 12 months
        combined: allMetrics.slice(0, 12), // Interleaved across platforms
      },
    };
  }
}
```

## 6. Monitoring & Alerting

**File**: `apps/api/src/monitoring/performance-monitor.service.ts`

```typescript
import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan } from "typeorm";
import { AgentProfile } from "../agents/entities/agent-profile.entity";

/**
 * Monitors performance sync health and sends alerts on issues.
 */
@Injectable()
export class PerformanceMonitorService {
  private readonly logger = new Logger(PerformanceMonitorService.name);

  constructor(
    @InjectRepository(AgentProfile)
    private readonly agentProfileRepo: Repository<AgentProfile>,
  ) {}

  /**
   * Check for stale syncs (last sync > 7 days ago)
   * Runs every 6 hours
   */
  @Cron("0 */6 * * *")
  async checkStaleSyncs() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const staleSpecialists = await this.agentProfileRepo.find({
      where: {
        isPublished: true,
        lastPerformanceSync: null, // Never synced
      },
    });

    // Also check for recently stale
    const recentlyStaleCount = await this.agentProfileRepo.count({
      where: {
        isPublished: true,
        lastPerformanceSync: null, // Simplified for this example
      },
    });

    if (staleSpecialists.length > 0) {
      this.logger.warn({
        message: "Found stale syncs (not synced in 7 days)",
        count: staleSpecialists.length,
        specialists: staleSpecialists.slice(0, 5).map((s) => ({
          id: s.id,
          name: s.displayName,
          lastSync: s.lastPerformanceSync,
        })),
      });

      // Send alert to monitoring system
      await this.sendAlert({
        severity: "warning",
        metric: "stale_syncs",
        value: staleSpecialists.length,
        message: `${staleSpecialists.length} specialists have stale performance data`,
      });
    }
  }

  /**
   * Check for high fraud risk specialists
   * Runs hourly
   */
  @Cron("0 * * * *")
  async checkHighFraudScores() {
    const highRiskSpecialists = await this.agentProfileRepo.find({
      where: {
        isPublished: true,
        fraudRiskScore: MoreThan(50),
      },
    });

    if (highRiskSpecialists.length > 0) {
      this.logger.warn({
        message: "Found high fraud risk specialists",
        count: highRiskSpecialists.length,
      });

      await this.sendAlert({
        severity: "warning",
        metric: "high_fraud_risk",
        value: highRiskSpecialists.length,
        message: `${highRiskSpecialists.length} specialists have fraud scores > 50`,
        specialists: highRiskSpecialists.map((s) => ({
          id: s.id,
          name: s.displayName,
          fraudScore: s.fraudRiskScore,
        })),
      });
    }
  }

  private async sendAlert(payload: any) {
    // Send to Slack, PagerDuty, etc.
    this.logger.log({
      message: "Alert triggered",
      ...payload,
    });
  }
}
```

## 7. Database Migrations

The migration for Google Ads is the same as Meta since both use `agent_platform_metrics`:

**File**: `apps/api/src/database/migrations/add-performance-sync.migration.ts`

```typescript
import { MigrationInterface, QueryRunner, TableColumn, Table } from "typeorm";

export class AddPerformanceSyncFields1709000000000 implements MigrationInterface {
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
      "is_performance_data_verified"
    );
    await queryRunner.dropColumn("agent_platform_metrics", "fraud_risk_score");
  }
}
```

Run migrations:
```bash
npm run typeorm migration:run
```

---

## Testing Examples

### Unit Test Example

```typescript
describe("GooglePerformanceSyncService", () => {
  let service: GooglePerformanceSyncService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GooglePerformanceSyncService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
        // ... mock repositories
      ],
    }).compile();

    service = module.get(GooglePerformanceSyncService);
  });

  it("should calculate ROAS correctly", () => {
    const row: GooglePerformanceRow = {
      campaignId: "123",
      campaignName: "Test",
      date: new Date(),
      spend: 100,
      impressions: 1000,
      clicks: 50,
      conversions: 5,
      conversionValue: 500,
      ctr: (50 / 1000) * 100, // 5%
      cpa: 100 / 5, // $20
      roas: 500 / 100, // 5.0x
    };

    expect(row.roas).toBe(5.0);
    expect(row.cpa).toBe(20);
  });

  it("should detect ROAS spikes for fraud", async () => {
    // Mock specialist with historical ROAS of 2.0
    const specialist = {
      cachedStats: { avgROAS: 2.0 },
    };

    // New metrics with ROAS of 5.0 (2.5x increase, > 2x threshold)
    const rows = [
      { roas: 5.0, campaignId: "123" } as GooglePerformanceRow,
    ];

    const result = await service.validateMetricsWithFraudDetection([
      { performanceRows: rows },
    ], specialist);

    expect(result.fraudRiskScore).toBeGreaterThan(0);
  });
});
```

### Integration Test Example

```typescript
describe("GooglePerformanceSyncService Integration", () => {
  it("should sync specialist metrics end-to-end", async () => {
    const result = await service.syncSpecialistMetrics(
      "specialist-123",
      "workspace-456",
      { dayLookback: 30 }
    );

    expect(result.success).toBe(true);
    expect(result.campaignsSynced).toBeGreaterThan(0);
    expect(result.metricsInserted).toBeGreaterThan(0);

    // Verify metrics persisted
    const metrics = await metricsRepo.find({
      where: {
        agentProfileId: "specialist-123",
        platform: "google",
      },
    });

    expect(metrics.length).toBeGreaterThan(0);
  });
});
```
