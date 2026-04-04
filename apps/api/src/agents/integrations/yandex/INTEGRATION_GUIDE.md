# Yandex Direct Integration - Technical Integration Guide

## Overview

This guide covers integrating the YandexPerformanceSyncService into your NestJS application, including module setup, REST endpoints, cron scheduling, and audit logging.

## Prerequisites

- NestJS >= 9.0
- TypeORM with PostgreSQL
- @nestjs/config for environment variables
- @nestjs/axios for HTTP requests
- @nestjs/schedule for cron jobs (optional, for scheduled syncs)

## Step 1: Module Integration

### Update IntegrationsModule

File: `/apps/api/src/agents/integrations/integrations.module.ts`

```typescript
import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MetaPerformanceSyncService } from "./meta-sync.service";
import { YandexPerformanceSyncService } from "./yandex-sync.service";
import { AgentProfile } from "../entities/agent-profile.entity";
import { AgentPlatformMetrics } from "../entities/agent-platform-metrics.entity";
import { ServiceEngagement } from "../entities/service-engagement.entity";
import { ConnectedAccount } from "../../platforms/entities/connected-account.entity";
import { Workspace } from "../../workspaces/entities/workspace.entity";
import { MetaModule } from "../../meta/meta.module";

/**
 * IntegrationsModule handles marketplace integrations for syncing specialist
 * performance data from external platforms (Meta, Google, Yandex, etc.) into Performa.
 *
 * Services:
 * - MetaPerformanceSyncService: Syncs real campaign performance from Meta Ads API
 * - YandexPerformanceSyncService: Syncs real campaign performance from Yandex Direct API
 *
 * This module is imported by AgentsModule to provide marketplace data collection
 * capabilities alongside agent profile management.
 */
@Module({
  imports: [
    HttpModule,
    MetaModule,
    TypeOrmModule.forFeature([
      AgentProfile,
      AgentPlatformMetrics,
      ServiceEngagement,
      ConnectedAccount,
      Workspace,
    ]),
  ],
  providers: [MetaPerformanceSyncService, YandexPerformanceSyncService],
  exports: [MetaPerformanceSyncService, YandexPerformanceSyncService],
})
export class IntegrationsModule {}
```

### Verify Entity Registration

Ensure all required entities are registered in your main TypeORM module:

```typescript
// app.module.ts
TypeOrmModule.forRoot({
  // ...
  entities: [
    AgentProfile,
    AgentPlatformMetrics,
    ServiceEngagement,
    ConnectedAccount,
    Workspace,
    // ... other entities
  ],
})
```

## Step 2: Environment Configuration

### Add Environment Variables

File: `.env` or `.env.production`

```bash
# Yandex Direct OAuth Credentials
# Register OAuth app at https://oauth.yandex.com/
YANDEX_CLIENT_ID=your_client_id_here
YANDEX_CLIENT_SECRET=your_client_secret_here

# Encryption Key for OAuth Token Storage
# Generate with: openssl rand -hex 16
ENCRYPTION_KEY=your_32_character_key_here

# Currency Exchange Rates (JSON format)
# Updates rates for currency conversion
# Base unit is RUB; other values are multipliers to target currency
CURRENCY_RATES_JSON='{"USD": 0.011, "EUR": 0.010, "GBP": 0.009}'

# Optional: Yandex API Timeout (milliseconds)
YANDEX_API_TIMEOUT=30000

# Optional: Max concurrent campaign report requests
YANDEX_MAX_CONCURRENT=5
```

### Update ConfigService

File: `.env.example`

```bash
# Document all expected variables for developers
YANDEX_CLIENT_ID=
YANDEX_CLIENT_SECRET=
ENCRYPTION_KEY=
CURRENCY_RATES_JSON=
```

## Step 3: Database Migration

If not already present, create migration for agent_platform_metrics index optimization:

```typescript
// migration file: add-yandex-platform-metrics-index.ts
export class AddYandexPlatformMetricsIndex1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Index on platform and agentProfileId for fast Yandex queries
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_agent_platform_metrics_platform_agent 
       ON agent_platform_metrics(platform, agent_profile_id, aggregation_period DESC)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_agent_platform_metrics_platform_agent`);
  }
}
```

Run migrations:

```bash
npm run migration:run
```

## Step 4: ServiceEngagement Token Storage

The Yandex service expects to store tokens in ServiceEngagement. You may need to extend the entity:

### Option A: Add Custom Fields (Simple)

File: `/apps/api/src/agents/entities/service-engagement.entity.ts`

```typescript
@Column({ type: 'text', nullable: true, name: 'yandex_access_token' })
yandexAccessToken?: string;

@Column({ type: 'timestamp', nullable: true, name: 'yandex_token_expires_at' })
yandexTokenExpiresAt?: Date;

@Column({ type: 'text', nullable: true, name: 'yandex_refresh_token' })
yandexRefreshToken?: string;

@Column({ type: 'text', nullable: true, name: 'yandex_account_id' })
yandexAccountId?: string;

@Column({ type: 'varchar', length: 100, nullable: true, name: 'yandex_account_name' })
yandexAccountName?: string;
```

Create migration:

```typescript
export class AddYandexTokenFieldsToServiceEngagement1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'service_engagements',
      new TableColumn({
        name: 'yandex_access_token',
        type: 'text',
        isNullable: true,
      })
    );
    
    await queryRunner.addColumn(
      'service_engagements',
      new TableColumn({
        name: 'yandex_token_expires_at',
        type: 'timestamp',
        isNullable: true,
      })
    );
    
    // ... add other fields
  }
}
```

### Option B: Separate Credentials Table (Recommended)

Create a new entity for platform credentials:

```typescript
// platform-credentials.entity.ts
@Entity('platform_credentials')
@Index(['workspaceId', 'platform'])
export class PlatformCredential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workspaceId: string;

  @Column()
  platform: string; // "yandex", "meta", "google", etc.

  @Column('text')
  accessToken: string; // Encrypted

  @Column({ nullable: true })
  refreshToken: string; // Encrypted

  @Column({ type: 'timestamp', nullable: true })
  tokenExpiresAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column()
  accountId: string; // Yandex account ID

  @Column()
  accountName: string; // Display name

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

Then update the service to use this table:

```typescript
// In YandexPerformanceSyncService
private async resolveAccessToken(workspaceId: string): Promise<string | null> {
  const credential = await this.platformCredentialRepo.findOne({
    where: {
      workspaceId,
      platform: 'yandex',
    },
    order: { createdAt: 'DESC' },
  });

  if (!credential) {
    return null;
  }

  let token = credential.accessToken;
  
  if (this.encryptionKey && token.includes(':')) {
    token = decrypt(token, this.encryptionKey);
  }

  // Token refresh logic...
  return token;
}
```

## Step 5: REST Endpoints

Create controller for manual sync triggering:

File: `/apps/api/src/agents/integrations/yandex.controller.ts`

```typescript
import { Controller, Post, Param, Body, UseGuards, HttpCode } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { YandexPerformanceSyncService, MetricsPullConfig } from './yandex-sync.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../auth/entities/user.entity';

@Controller('sync/yandex')
@UseGuards(AuthGuard('jwt'))
export class YandexSyncController {
  constructor(private readonly yandexSync: YandexPerformanceSyncService) {}

  /**
   * POST /sync/yandex/specialist/:agentProfileId
   * Manually trigger sync for a single specialist
   */
  @Post('specialist/:agentProfileId')
  @HttpCode(200)
  async syncSpecialist(
    @Param('agentProfileId') agentProfileId: string,
    @CurrentUser() user: User,
    @Body() config?: Partial<MetricsPullConfig>,
  ) {
    return this.yandexSync.syncSpecialistMetrics(
      agentProfileId,
      user.workspaceId,
      config
    );
  }

  /**
   * POST /sync/yandex/bulk
   * Manually trigger bulk sync for entire workspace
   */
  @Post('bulk')
  @HttpCode(200)
  async syncBulk(
    @CurrentUser() user: User,
    @Body() config?: Partial<MetricsPullConfig>,
  ) {
    return this.yandexSync.syncAllSpecialists(user.workspaceId, config);
  }

  /**
   * POST /sync/yandex/specialist/:agentProfileId/validate
   * Dry run: validate without persisting
   */
  @Post('specialist/:agentProfileId/validate')
  @HttpCode(200)
  async validateSpecialist(
    @Param('agentProfileId') agentProfileId: string,
    @CurrentUser() user: User,
    @Body() config?: Partial<MetricsPullConfig>,
  ) {
    return this.yandexSync.syncSpecialistMetrics(
      agentProfileId,
      user.workspaceId,
      {
        ...config,
        dryRun: true, // Force dry-run
      }
    );
  }
}
```

Add to IntegrationsModule:

```typescript
@Module({
  // ...
  controllers: [YandexSyncController],
})
export class IntegrationsModule {}
```

## Step 6: Cron Scheduling

Set up daily automatic sync:

File: `/apps/api/src/agents/integrations/yandex-sync.scheduler.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { YandexPerformanceSyncService } from './yandex-sync.service';
import { WorkspaceService } from '../../workspaces/workspace.service';

@Injectable()
export class YandexSyncScheduler {
  constructor(
    private readonly yandexSync: YandexPerformanceSyncService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  /**
   * Run daily at 3 AM UTC
   * (Safe time: avoids peak hours, minimal load)
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async syncAllWorkspaces() {
    const workspaces = await this.workspaceService.findAll();

    for (const workspace of workspaces) {
      try {
        const results = await this.yandexSync.syncAllSpecialists(workspace.id, {
          dayLookback: 30,
          forceRefresh: false,
        });

        const successful = results.filter(r => r.success).length;
        console.log(
          `[${workspace.id}] Synced ${successful}/${results.length} specialists`
        );
      } catch (err) {
        console.error(`[${workspace.id}] Bulk sync failed:`, err.message);
      }
    }
  }

  /**
   * Weekly deep refresh: Overwrites data for consistency
   * Run every Sunday at 2 AM UTC
   */
  @Cron('0 2 * * 0')
  async weeklyRefresh() {
    const workspaces = await this.workspaceService.findAll();

    for (const workspace of workspaces) {
      try {
        await this.yandexSync.syncAllSpecialists(workspace.id, {
          dayLookback: 60, // Longer lookback
          forceRefresh: true, // Overwrite existing
        });

        console.log(`[${workspace.id}] Weekly refresh completed`);
      } catch (err) {
        console.error(`[${workspace.id}] Weekly refresh failed:`, err.message);
      }
    }
  }
}
```

Add to IntegrationsModule:

```typescript
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot(), /* ... */],
  providers: [
    MetaPerformanceSyncService,
    YandexPerformanceSyncService,
    YandexSyncScheduler,
  ],
})
export class IntegrationsModule {}
```

## Step 7: Audit Logging

Log all sync operations for compliance and debugging:

File: `/apps/api/src/agents/integrations/yandex-sync.service.ts`

Add audit logging in syncSpecialistMetrics:

```typescript
// After successful sync, log the operation
await this.auditLog.log({
  workspaceId,
  agentProfileId,
  action: 'PLATFORM_SYNC_COMPLETED',
  platform: 'yandex',
  metadata: {
    metricsInserted: result.metricsInserted,
    metricsUpdated: result.metricsUpdated,
    campaignsSynced: result.campaignsSynced,
    fraudRiskScore: result.fraudRiskScore,
    durationMs: Date.now() - startTime,
  },
  success: result.success,
});
```

## Step 8: Error Monitoring

Integrate with error tracking (Sentry, etc.):

```typescript
import * as Sentry from '@sentry/node';

// In syncSpecialistMetrics catch block
} catch (err: any) {
  result.errors.push(err?.message ?? 'Unknown error');
  
  // Send to Sentry
  Sentry.captureException(err, {
    tags: {
      service: 'yandex-sync',
      workspace: workspaceId,
      specialist: agentProfileId,
    },
  });
  
  // ...
}
```

## Step 9: Health Checks

Add health indicator for Yandex API:

File: `/apps/api/src/health/yandex.health.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class YandexHealthIndicator extends HealthIndicator {
  constructor(private readonly http: HttpService) {
    super();
  }

  async isHealthy(): Promise<HealthIndicatorResult> {
    try {
      // Simple check: API accessibility
      await this.http.get('https://api.direct.yandex.com/json/v5/accounts', {
        timeout: 5000,
      }).toPromise();

      return this.getStatus('yandex', true);
    } catch (err) {
      throw new HealthCheckError('Yandex API unhealthy', this.getStatus('yandex', false));
    }
  }
}
```

## Step 10: Testing

Create test suite for Yandex service:

File: `/apps/api/src/agents/integrations/yandex-sync.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { YandexPerformanceSyncService } from './yandex-sync.service';
import { AgentProfile } from '../entities/agent-profile.entity';
import { AgentPlatformMetrics } from '../entities/agent-platform-metrics.entity';

describe('YandexPerformanceSyncService', () => {
  let service: YandexPerformanceSyncService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YandexPerformanceSyncService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                ENCRYPTION_KEY: 'a'.repeat(32),
                YANDEX_CLIENT_ID: 'test',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
        {
          provide: getRepositoryToken(AgentProfile),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AgentPlatformMetrics),
          useValue: {
            find: jest.fn(),
          },
        },
        // ... other repositories
      ],
    }).compile();

    service = module.get<YandexPerformanceSyncService>(YandexPerformanceSyncService);
    httpService = module.get<HttpService>(HttpService);
  });

  describe('syncSpecialistMetrics', () => {
    it('should sync metrics for valid specialist', async () => {
      // Test implementation
    });

    it('should handle missing specialist', async () => {
      // Test implementation
    });

    it('should validate metrics for fraud', async () => {
      // Test implementation
    });
  });

  describe('currency conversion', () => {
    it('should convert RUB to USD', () => {
      // Test implementation
    });

    it('should handle missing exchange rates', () => {
      // Test implementation
    });
  });
});
```

## Step 11: Documentation Updates

Update main README:

```markdown
## Platform Integrations

Performa supports syncing real performance data from multiple advertising platforms:

### Supported Platforms

- **Meta Ads** - Facebook/Instagram campaigns
- **Google Ads** - Search and Display network campaigns
- **Yandex Direct** - Russian/CIS market campaigns

### Yandex Direct Setup

1. Register OAuth application at [Yandex OAuth Console](https://oauth.yandex.com)
2. Get Client ID and Secret
3. Set environment variables: `YANDEX_CLIENT_ID`, `YANDEX_CLIENT_SECRET`
4. Specialists connect their Yandex Direct account via OAuth
5. Metrics automatically sync daily

See [Yandex Integration Guide](./yandex/INTEGRATION_GUIDE.md) for details.
```

## Step 12: Deployment Checklist

Before deploying to production:

### Configuration
- [ ] YANDEX_CLIENT_ID set in production env
- [ ] YANDEX_CLIENT_SECRET set in production env
- [ ] ENCRYPTION_KEY set and matches schema
- [ ] CURRENCY_RATES_JSON valid JSON format
- [ ] Database migrations applied

### Monitoring
- [ ] Error tracking (Sentry) configured
- [ ] Health checks responding correctly
- [ ] Audit logging enabled
- [ ] Rate limit alerts set up

### Security
- [ ] Tokens encrypted at rest
- [ ] No secrets in logs
- [ ] HTTPS enforced for OAuth flows
- [ ] Access controls on sync endpoints

### Testing
- [ ] Unit tests passing
- [ ] Integration tests with mock Yandex API
- [ ] Load test with realistic specialist count
- [ ] Staging environment tested for 7 days

## Troubleshooting

### Service not injecting

Error: `Cannot find YandexPerformanceSyncService`

**Solution**: Ensure YandexPerformanceSyncService is exported from IntegrationsModule:

```typescript
@Module({
  providers: [YandexPerformanceSyncService],
  exports: [YandexPerformanceSyncService], // Add this
})
```

### Cron jobs not running

Error: ScheduleModule not initialized

**Solution**: Ensure ScheduleModule is imported in your root module:

```typescript
imports: [ScheduleModule.forRoot()],
```

### Token refresh failures

Error: 401 Unauthorized on refresh

**Solution**: Check that refresh token is stored and not expired. May require specialist to reconnect.

## Next Steps

After integration:

1. Create Yandex OAuth callback handler for specialist onboarding
2. Add specialist profile UI to display Yandex metrics
3. Set up monitoring dashboard for sync health
4. Implement manual metric verification flow for high fraud scores
5. Consider implementing real-time currency rate provider

See API_REFERENCE.md for complete method documentation.
