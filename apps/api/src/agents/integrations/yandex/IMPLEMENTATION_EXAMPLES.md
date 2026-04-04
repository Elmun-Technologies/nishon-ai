# Yandex Direct Integration - Implementation Examples

This document provides practical code examples for common use cases when implementing the Yandex Direct integration.

## Table of Contents

1. Basic Sync Operations
2. Error Handling Patterns
3. Custom Workflows
4. Testing Patterns
5. Monitoring & Observability
6. Advanced Usage

---

## Basic Sync Operations

### Example 1: Simple Specialist Sync

Sync metrics for one specialist with default config:

```typescript
import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { YandexPerformanceSyncService } from './yandex-sync.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/specialists')
@UseGuards(AuthGuard('jwt'))
export class SpecialistController {
  constructor(private readonly yandexSync: YandexPerformanceSyncService) {}

  @Post(':agentId/sync-yandex')
  async syncYandex(
    @Param('agentId') agentId: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.yandexSync.syncSpecialistMetrics(
      agentId,
      user.workspaceId
    );

    return {
      status: result.success ? 'success' : 'failed',
      campaignsSynced: result.campaignsSynced,
      fraudScore: result.fraudRiskScore,
      message: result.success
        ? `Synced ${result.campaignsSynced} campaigns`
        : `Sync failed: ${result.errors[0]}`,
    };
  }
}
```

**Usage**:
```bash
curl -X POST http://localhost:3000/api/specialists/agent-uuid/sync-yandex \
  -H "Authorization: Bearer $TOKEN"
```

---

### Example 2: Sync with Custom Config

Sync with specific lookback period and force refresh:

```typescript
async syncWithCustomConfig(agentId: string, workspaceId: string) {
  const result = await this.yandexSync.syncSpecialistMetrics(
    agentId,
    workspaceId,
    {
      dayLookback: 60,        // Last 2 months instead of default 30 days
      forceRefresh: true,     // Overwrite existing data
      targetCurrency: 'EUR',  // Convert to Euro
    }
  );

  return result;
}
```

**When to use**:
- `dayLookback: 60` - Quarterly reconciliation
- `forceRefresh: true` - Monthly data validation
- `targetCurrency: 'EUR'` - European specialists

---

### Example 3: Bulk Sync All Specialists

Sync all specialists in workspace (e.g., daily cron):

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { YandexPerformanceSyncService } from './yandex-sync.service';
import { WorkspaceService } from '../../workspaces/workspace.service';

@Injectable()
export class DailyMetricsSyncService {
  constructor(
    private readonly yandexSync: YandexPerformanceSyncService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async runDailySync() {
    const workspaces = await this.workspaceService.findAll();

    for (const workspace of workspaces) {
      try {
        const results = await this.yandexSync.syncAllSpecialists(
          workspace.id,
          { dayLookback: 30 }
        );

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success);

        console.log(`[${workspace.id}] Synced ${successful}/${results.length}`);

        // Log failures for manual review
        if (failed.length > 0) {
          console.warn(`Failed specialists: ${failed.map(r => r.agentDisplayName).join(', ')}`);
        }
      } catch (error) {
        console.error(`Bulk sync failed for ${workspace.id}:`, error);
      }
    }
  }
}
```

---

### Example 4: Dry Run for Validation

Validate sync without persisting (useful for testing):

```typescript
async validateSyncBeforePersist(agentId: string, workspaceId: string) {
  // Test sync without saving
  const dryResult = await this.yandexSync.syncSpecialistMetrics(
    agentId,
    workspaceId,
    { dryRun: true }
  );

  if (!dryResult.success) {
    return {
      valid: false,
      errors: dryResult.errors,
      warnings: dryResult.warnings,
    };
  }

  if (dryResult.fraudRiskScore > 50) {
    return {
      valid: false,
      reason: 'High fraud risk score',
      fraudScore: dryResult.fraudRiskScore,
      warnings: dryResult.warnings,
    };
  }

  // If validation passed, run real sync
  const result = await this.yandexSync.syncSpecialistMetrics(
    agentId,
    workspaceId,
    { dryRun: false }
  );

  return {
    valid: true,
    metricsInserted: result.metricsInserted,
    campaignsSynced: result.campaignsSynced,
  };
}
```

---

## Error Handling Patterns

### Example 5: Comprehensive Error Handling

Handle different error types gracefully:

```typescript
async syncWithErrorHandling(agentId: string, workspaceId: string) {
  try {
    const result = await this.yandexSync.syncSpecialistMetrics(
      agentId,
      workspaceId
    );

    if (!result.success) {
      // Sync failed - handle based on error type
      for (const error of result.errors) {
        if (error.includes('No active Yandex integration')) {
          // Specialist hasn't connected their account
          await this.notifySpecialist({
            agentId,
            message: 'Please connect your Yandex Direct account',
            actionRequired: true,
          });
        } else if (error.includes('token')) {
          // Token issue - likely needs refresh
          await this.notifyAdmin({
            message: `Token issue for ${agentId}`,
            error,
          });
        } else {
          // Generic API error
          console.warn(`Sync failed: ${error}`);
        }
      }

      return { success: false, errors: result.errors };
    }

    // Sync succeeded but check for warnings
    if (result.warnings.length > 0) {
      console.log(`Warnings during sync: ${result.warnings.join('; ')}`);
    }

    // Check fraud score
    if (result.fraudRiskScore > 30) {
      await this.flagForReview({
        agentId,
        fraudScore: result.fraudRiskScore,
        reason: 'High fraud risk score',
      });
    }

    return {
      success: true,
      campaignsSynced: result.campaignsSynced,
      fraudScore: result.fraudRiskScore,
    };
  } catch (error) {
    // Unexpected error
    console.error('Sync failed with exception:', error);

    await this.notifyOps({
      message: 'Yandex sync service error',
      error: error.message,
      stack: error.stack,
    });

    throw error; // Re-throw for caller to handle
  }
}
```

---

### Example 6: Retry with Exponential Backoff

Implement retry logic for transient failures:

```typescript
async syncWithRetry(
  agentId: string,
  workspaceId: string,
  maxRetries: number = 3,
  baseDelayMs: number = 1000,
) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await this.yandexSync.syncSpecialistMetrics(
        agentId,
        workspaceId
      );

      if (result.success) {
        return result;
      }

      // Check if error is retryable
      if (!this.isRetryable(result.errors[0])) {
        throw new Error(result.errors[0]);
      }

      lastError = new Error(result.errors[0]);
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (!this.isRetryable(error.message)) {
        throw error; // Non-retryable, fail immediately
      }
    }

    // If not last attempt, wait before retrying
    if (attempt < maxRetries - 1) {
      const delayMs = baseDelayMs * Math.pow(2, attempt); // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs));

      console.log(
        `Retrying sync for ${agentId} (attempt ${attempt + 2}/${maxRetries})`
      );
    }
  }

  // All retries exhausted
  throw lastError || new Error('Unknown error');
}

private isRetryable(errorMessage: string): boolean {
  // Retryable errors
  const retryablePatterns = [
    'rate limit',
    'timeout',
    'temporarily unavailable',
    '502',
    '503',
    '504',
  ];

  return retryablePatterns.some(pattern =>
    errorMessage.toLowerCase().includes(pattern)
  );
}
```

---

### Example 7: Handle Partial Failures

Gracefully handle when some campaigns fail:

```typescript
async syncAndReportPartialFailures(agentId: string, workspaceId: string) {
  const result = await this.yandexSync.syncSpecialistMetrics(
    agentId,
    workspaceId
  );

  const summary = {
    totalAttempted: result.campaignsSynced + result.warnings.length,
    successful: result.campaignsSynced,
    failed: result.warnings.length,
    successRate: result.campaignsSynced > 0
      ? (result.campaignsSynced / (result.campaignsSynced + result.warnings.length)) * 100
      : 0,
  };

  if (summary.failed > 0) {
    // Some campaigns failed - still consider overall sync successful
    // if threshold passed
    if (summary.successRate >= 80) {
      // 80% success threshold
      await this.logPartialSuccess({
        agentId,
        ...summary,
        warnings: result.warnings,
      });

      return { status: 'partial_success', ...summary };
    } else {
      // Too many failures
      throw new Error(
        `Sync failed: only ${summary.successRate}% of campaigns synced`
      );
    }
  }

  return { status: 'success', ...summary };
}
```

---

## Custom Workflows

### Example 8: Sync Specific Date Range

Sync metrics for a specific date range (e.g., Q1):

```typescript
async syncSpecificDateRange(
  agentId: string,
  workspaceId: string,
  startDate: Date,
  endDate: Date,
) {
  // Calculate dayLookback
  const today = new Date();
  const daysAgo = Math.floor(
    (today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const dayLookback = daysAgo + Math.floor(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (dayLookback > 730) {
    throw new Error('Date range exceeds 2-year limit');
  }

  const result = await this.yandexSync.syncSpecialistMetrics(
    agentId,
    workspaceId,
    {
      dayLookback,
      forceRefresh: true, // Overwrite to ensure clean data
    }
  );

  return result;
}
```

---

### Example 9: Multi-Currency Sync

Sync same specialist in multiple currencies:

```typescript
async syncMultipleCurrencies(
  agentId: string,
  workspaceId: string,
  currencies: string[] = ['USD', 'EUR', 'GBP'],
) {
  const results: Record<string, any> = {};

  for (const currency of currencies) {
    try {
      const result = await this.yandexSync.syncSpecialistMetrics(
        agentId,
        workspaceId,
        { targetCurrency: currency }
      );

      results[currency] = {
        success: result.success,
        spend: result.warnings.find(w => w.includes('spend')),
      };
    } catch (error) {
      results[currency] = {
        success: false,
        error: error.message,
      };
    }
  }

  return results;
}
```

---

### Example 10: Monthly Reconciliation

Run deep audit monthly:

```typescript
@Cron('0 2 1 * *') // First day of month at 2 AM
async monthlyReconciliation() {
  const workspaces = await this.workspaceService.findAll();

  for (const workspace of workspaces) {
    console.log(`Starting monthly reconciliation for ${workspace.id}`);

    // Do 90-day sync with force refresh
    const results = await this.yandexSync.syncAllSpecialists(workspace.id, {
      dayLookback: 90,
      forceRefresh: true, // Overwrite for accuracy
    });

    // Analyze results
    const analysis = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      flaggedForReview: results.filter(r => r.fraudRiskScore > 50).length,
      averageFraudScore:
        results.reduce((sum, r) => sum + r.fraudRiskScore, 0) / results.length,
    };

    console.log(`Reconciliation complete:`, analysis);

    // Store audit trail
    await this.auditService.log({
      workspaceId: workspace.id,
      action: 'MONTHLY_RECONCILIATION',
      metadata: analysis,
    });
  }
}
```

---

## Testing Patterns

### Example 11: Unit Test Sync Logic

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { YandexPerformanceSyncService } from './yandex-sync.service';

describe('YandexPerformanceSyncService', () => {
  let service: YandexPerformanceSyncService;
  let mockAgentProfileRepo: any;
  let mockMetricsRepo: any;

  beforeEach(async () => {
    mockAgentProfileRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    mockMetricsRepo = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YandexPerformanceSyncService,
        {
          provide: getRepositoryToken(AgentProfile),
          useValue: mockAgentProfileRepo,
        },
        {
          provide: getRepositoryToken(AgentPlatformMetrics),
          useValue: mockMetricsRepo,
        },
        // ... other mocks
      ],
    }).compile();

    service = module.get<YandexPerformanceSyncService>(
      YandexPerformanceSyncService
    );
  });

  describe('syncSpecialistMetrics', () => {
    it('should throw NotFoundException for unknown specialist', async () => {
      mockAgentProfileRepo.findOne.mockResolvedValue(null);

      await expect(
        service.syncSpecialistMetrics('unknown-id', 'workspace-id')
      ).rejects.toThrow('Agent profile unknown-id not found');
    });

    it('should return fraud score when metrics are suspicious', async () => {
      mockAgentProfileRepo.findOne.mockResolvedValue({
        id: 'agent-id',
        displayName: 'Test Agent',
      });

      // Mock API response with suspicious metrics
      jest.spyOn(service as any, 'fetchAccountMetrics').mockResolvedValue([
        {
          accountId: 'acc-1',
          performanceRows: [
            {
              spend: -100, // Negative spend = fraud
              ctr: 150, // CTR > 100% = fraud
              // ...
            },
          ],
        },
      ]);

      const result = await service.syncSpecialistMetrics(
        'agent-id',
        'workspace-id'
      );

      expect(result.fraudRiskScore).toBeGreaterThan(40);
    });
  });
});
```

---

### Example 12: Integration Test with Mock API

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

describe('YandexPerformanceSyncService (Integration)', () => {
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
        // ... other providers
      ],
    }).compile();

    service = module.get(YandexPerformanceSyncService);
    httpService = module.get(HttpService);
  });

  it('should fetch and sync Yandex campaigns', async () => {
    // Mock Yandex API responses
    const accountsResponse = {
      data: {
        result: [{ id: 'acc-1', name: 'Test Account' }],
      },
    };

    const campaignsResponse = {
      data: {
        result: {
          Campaigns: [{ Id: 123, Name: 'Test Campaign', Currency: 'RUB' }],
        },
      },
    };

    const reportResponse = {
      data: {
        result: {
          ReportData: [
            {
              date: '2024-03-01',
              impressions: 1000,
              clicks: 50,
              cost: 500.00,
              conversions: 10,
              conversionsCost: 5000.00,
            },
          ],
        },
      },
    };

    httpService.get = jest.fn().mockReturnValue(of(accountsResponse));
    httpService.post = jest
      .fn()
      .mockReturnValueOnce(of(campaignsResponse))
      .mockReturnValueOnce(of(reportResponse));

    const result = await service.syncSpecialistMetrics('agent-1', 'workspace-1');

    expect(result.success).toBe(true);
    expect(result.campaignsSynced).toBe(1);
  });
});
```

---

## Monitoring & Observability

### Example 13: Track Sync Metrics with Prometheus

```typescript
import { Injectable } from '@nestjs/common';
import {
  Counter,
  Histogram,
  Registry,
  register as defaultRegister,
} from 'prom-client';

@Injectable()
export class YandexSyncMetrics {
  private syncCounter: Counter;
  private syncDuration: Histogram;
  private fraudScoreHistogram: Histogram;

  constructor() {
    this.syncCounter = new Counter({
      name: 'yandex_sync_total',
      help: 'Total Yandex syncs',
      labelNames: ['workspace_id', 'status'],
      registers: [defaultRegister],
    });

    this.syncDuration = new Histogram({
      name: 'yandex_sync_duration_seconds',
      help: 'Yandex sync duration',
      labelNames: ['workspace_id'],
      registers: [defaultRegister],
    });

    this.fraudScoreHistogram = new Histogram({
      name: 'yandex_fraud_score',
      help: 'Fraud risk score distribution',
      labelNames: ['workspace_id'],
      buckets: [0, 10, 25, 50, 75, 100],
      registers: [defaultRegister],
    });
  }

  recordSync(workspaceId: string, success: boolean, durationMs: number, fraudScore: number) {
    this.syncCounter.inc({ workspace_id: workspaceId, status: success ? 'success' : 'failure' });
    this.syncDuration.observe({ workspace_id: workspaceId }, durationMs / 1000);
    this.fraudScoreHistogram.observe({ workspace_id: workspaceId }, fraudScore);
  }
}
```

---

### Example 14: Send Sync Results to Slack

```typescript
@Injectable()
export class YandexSyncNotifier {
  constructor(private readonly slack: SlackService) {}

  async notifySyncCompletion(result: PerformanceSyncResult) {
    const color = result.success ? 'good' : 'danger';
    const status = result.success ? '✅' : '❌';

    const message = {
      color,
      title: `${status} Yandex Sync: ${result.agentDisplayName}`,
      fields: [
        {
          title: 'Campaigns',
          value: result.campaignsSynced,
          short: true,
        },
        {
          title: 'Metrics',
          value: `+${result.metricsInserted} new, +${result.metricsUpdated} updated`,
          short: true,
        },
        {
          title: 'Fraud Score',
          value: result.fraudRiskScore,
          short: true,
        },
        {
          title: 'Duration',
          value: `${((result.syncedAt.getTime() - result.dateRangeStart.getTime()) / 1000).toFixed(1)}s`,
          short: true,
        },
      ],
    };

    if (result.errors.length > 0) {
      message.fields.push({
        title: 'Errors',
        value: result.errors.join('\n'),
      });
    }

    await this.slack.send(message);
  }
}
```

---

### Example 15: Monitor Rate Limit Quotas

```typescript
@Injectable()
export class RateLimitMonitor {
  @Cron(CronExpression.EVERY_HOUR)
  async checkQuota() {
    // Track API requests per hour
    const quota = {
      hourly_limit: 1000,
      requests_remaining: await this.getRequestsRemaining(),
      estimated_reset: new Date(Date.now() + 3600000),
    };

    if (quota.requests_remaining < 100) {
      // Alert when approaching limit
      await this.alertOps({
        severity: 'warning',
        message: `Yandex API quota low: ${quota.requests_remaining}/${quota.hourly_limit}`,
      });
    }
  }

  private async getRequestsRemaining(): Promise<number> {
    // Implementation depends on rate limit tracking strategy
    // Could query database, Redis, or in-memory state
    return 0;
  }
}
```

---

## Advanced Usage

### Example 16: Intelligent Currency Selection

Choose target currency based on specialist profile:

```typescript
async smartCurrencySync(agentId: string, workspaceId: string) {
  // Load specialist profile
  const specialist = await this.agentProfileRepo.findOne(agentId);

  // Determine target currency from profile
  let targetCurrency = 'USD'; // Default

  if (specialist.location?.country === 'DE') {
    targetCurrency = 'EUR';
  } else if (specialist.location?.country === 'GB') {
    targetCurrency = 'GBP';
  } else if (specialist.currencies?.preferred) {
    targetCurrency = specialist.currencies.preferred;
  }

  return this.yandexSync.syncSpecialistMetrics(
    agentId,
    workspaceId,
    { targetCurrency }
  );
}
```

---

### Example 17: Sync Performance Trends

Calculate and store performance trends over time:

```typescript
async calculateTrends(agentId: string, months: number = 12) {
  // Fetch last N months of metrics
  const metrics = await this.metricsRepo.find({
    where: {
      agentProfileId: agentId,
      platform: 'yandex',
      aggregationPeriod: Between(
        new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000),
        new Date()
      ),
    },
    order: { aggregationPeriod: 'ASC' },
  });

  // Calculate trends
  const trends = {
    spendTrend: this.calculateTrend(metrics.map(m => Number(m.totalSpend))),
    roasTrend: this.calculateTrend(metrics.map(m => Number(m.avgRoas ?? 0))),
    conversionsTrend: this.calculateTrend(
      metrics.map(m => m.conversionCount)
    ),
  };

  return trends;
}

private calculateTrend(values: number[]): { direction: 'up' | 'down' | 'flat'; percentChange: number } {
  if (values.length < 2) return { direction: 'flat', percentChange: 0 };

  const first = values[0];
  const last = values[values.length - 1];
  const percentChange = ((last - first) / first) * 100;

  return {
    direction: percentChange > 5 ? 'up' : percentChange < -5 ? 'down' : 'flat',
    percentChange,
  };
}
```

---

### Example 18: Batch Sync with Progress Tracking

Sync multiple specialists with progress updates:

```typescript
async syncWithProgress(
  workspaceId: string,
  onProgress?: (current: number, total: number) => void
) {
  const specialists = await this.agentProfileRepo.find({
    where: { agentType: 'human', isVerified: true },
  });

  const results: PerformanceSyncResult[] = [];

  for (let i = 0; i < specialists.length; i++) {
    const result = await this.yandexSync.syncSpecialistMetrics(
      specialists[i].id,
      workspaceId
    );
    results.push(result);

    // Report progress
    if (onProgress) {
      onProgress(i + 1, specialists.length);
    }
  }

  return results;
}

// Usage in controller
@Post('sync-with-progress')
async syncProgress(@CurrentUser() user: User, @Res() res: Response) {
  const specialists = await this.agentProfileRepo.find({
    where: { workspaceId: user.workspaceId },
  });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let current = 0;

  for (const specialist of specialists) {
    await this.yandexSync.syncSpecialistMetrics(
      specialist.id,
      user.workspaceId
    );

    current++;
    res.write(`data: ${JSON.stringify({ progress: current, total: specialists.length })}\n\n`);
  }

  res.end();
}
```

---

### Example 19: Export Metrics to CSV

Export synced metrics for reporting:

```typescript
async exportMetricsToCSV(agentId: string): Promise<string> {
  const metrics = await this.metricsRepo.find({
    where: { agentProfileId: agentId, platform: 'yandex' },
    order: { aggregationPeriod: 'DESC' },
  });

  let csv = 'Month,Spend,Revenue,ROAS,CPA,CTR,Conversions,Campaigns\n';

  for (const metric of metrics) {
    const row = [
      metric.aggregationPeriod.toISOString().split('T')[0],
      metric.totalSpend,
      metric.totalRevenue,
      metric.avgRoas ?? 'N/A',
      metric.avgCpa ?? 'N/A',
      (metric.avgCtr ?? 0).toFixed(2),
      metric.conversionCount,
      metric.campaignsCount,
    ].join(',');

    csv += row + '\n';
  }

  return csv;
}
```

---

### Example 20: Compare Multi-Platform Performance

Compare same specialist's performance across platforms:

```typescript
async comparePerformance(agentId: string): Promise<any> {
  const metrics = await this.metricsRepo.find({
    where: { agentProfileId: agentId },
    order: { aggregationPeriod: 'DESC' },
    take: 12, // Last 12 months
  });

  const byPlatform = {};

  for (const metric of metrics) {
    if (!byPlatform[metric.platform]) {
      byPlatform[metric.platform] = [];
    }
    byPlatform[metric.platform].push(metric);
  }

  // Calculate averages per platform
  const comparison = {};

  for (const [platform, platformMetrics] of Object.entries(byPlatform)) {
    const avgSpend =
      platformMetrics.reduce((sum, m) => sum + Number(m.totalSpend), 0) /
      platformMetrics.length;
    const avgRoas =
      platformMetrics.reduce((sum, m) => sum + Number(m.avgRoas ?? 0), 0) /
      platformMetrics.length;
    const totalConversions = platformMetrics.reduce(
      (sum, m) => sum + m.conversionCount,
      0
    );

    comparison[platform] = { avgSpend, avgRoas, totalConversions };
  }

  return comparison;
}
```

---

## Related Examples

See DEPLOYMENT.md for:
- Production monitoring setups
- Error alerting configurations
- Database backup strategies
- Rate limit management

See CHECKLIST.md for:
- Implementation tracking
- Testing checklists
- Production readiness checklists
