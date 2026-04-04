# PerformanceSyncService Documentation

## Overview

The `PerformanceSyncService` handles real-time synchronization of agent ad account performance data from multiple advertising platforms (Meta, Google Ads, Yandex Direct) for the Performa marketplace.

This service aggregates performance metrics from connected ad accounts, calculates key performance indicators (ROAS, CPA, CTR, spend, conversions, revenue), and stores them in the marketplace database for display on agent profiles.

## Architecture

### Data Flow

```
ServiceEngagement (agent + workspace)
    ↓
ConnectedAccount (workspace's ad account credentials)
    ↓
Platform APIs (Meta/Google/Yandex)
    ↓
PlatformMetrics (aggregated)
    ↓
agent_platform_metrics (monthly rollups)
agent_historical_performance (yearly trends)
AgentProfile.cachedStats (marketplace display)
```

### Entities

| Entity | Purpose |
|--------|---------|
| `AgentPlatformMetrics` | Monthly KPIs per platform (ROAS, CPA, CTR, spend, conversions) |
| `AgentHistoricalPerformance` | Yearly trend data with success rates and best ROAS |
| `AgentPerformanceSyncLog` | Audit trail of sync operations, timestamps, and error tracking |
| `ServiceEngagement` | Links agent to client workspaces (used to find accounts) |
| `ConnectedAccount` | OAuth credentials for ad platform accounts |

## Usage

### Basic Sync

```typescript
import { PerformanceSyncService } from './services/performance-sync.service';

constructor(
  private readonly performanceSync: PerformanceSyncService,
) {}

// Sync all platforms
const result = await this.performanceSync.syncAgentPerformance(agentId);

// Sync specific platforms only
const result = await this.performanceSync.syncAgentPerformance(agentId, {
  platformsToSync: ['meta', 'google'],
});

// Force full re-sync (skip cache)
const result = await this.performanceSync.syncAgentPerformance(agentId, {
  forceSync: true,
});
```

### Response Format

```typescript
interface SyncResult {
  success: boolean;                    // Did all platforms sync successfully?
  agentId: string;                     // Agent UUID
  recordsSynced: number;               // Total campaigns synced
  platformsProcessed: string[];        // ['meta', 'google', 'yandex']
  metricsStored: number;               // Number of metrics rows created
  errors: string[];                    // Platform-specific errors
  syncDuration: number;                // Milliseconds
  lastSyncedAt: Date;                  // Timestamp
}
```

### Retrieve Sync History

```typescript
// Get last 10 syncs for an agent
const history = await this.performanceSync.getSyncHistory(agentId, 10);
```

### Get Current Metrics

```typescript
// Get current month metrics (per platform)
const metrics = await this.performanceSync.getCurrentMetrics(agentId);
// Returns: AgentPlatformMetrics[]
```

### Get Historical Performance

```typescript
// Get all historical data
const history = await this.performanceSync.getHistoricalPerformance(agentId);

// Get specific year
const history = await this.performanceSync.getHistoricalPerformance(agentId, 2024);
```

## Integration Steps

### 1. Inject Platform Services

Currently, the service has stub implementations for Meta, Google, and Yandex syncs. To activate real syncing, inject the actual platform services:

```typescript
// In performance-sync.service.ts constructor
constructor(
  // ... existing repos ...
  private readonly metaAdsService: MetaAdsService,      // Add
  private readonly googleAdsService: GoogleAdsService,  // Add
  private readonly yandexService: YandexDirectService,  // Add
) {}
```

### 2. Implement Platform Sync Methods

Replace the stub methods with actual API calls. Example for Meta:

```typescript
private async syncMetaPerformance(
  agent: AgentProfile,
  accounts: ConnectedAccount[],
  engagements: ServiceEngagement[],
): Promise<PlatformMetrics[]> {
  const metrics: PlatformMetrics[] = [];

  for (const account of accounts) {
    const accessToken = await this.decryptToken(account.accessToken);
    
    // Get campaigns
    const campaigns = await this.metaAdsService.getCampaigns(
      account.externalAccountId,
      accessToken,
    );

    // Get insights for each campaign
    const insights = await this.metaAdsService.getInsights(
      account.externalAccountId,
      accessToken,
    );

    // Aggregate metrics
    const spend = insights.reduce((sum, i) => sum + i.spend, 0);
    const conversions = insights.reduce((sum, i) => sum + i.conversions, 0);
    const revenue = insights.reduce((sum, i) => sum + i.conversionValue, 0);

    metrics.push({
      platform: 'meta',
      totalSpend: spend,
      campaignCount: campaigns.length,
      conversions,
      revenue,
      avgRoas: spend > 0 ? revenue / spend : 0,
      avgCpa: conversions > 0 ? spend / conversions : 0,
      avgCtr: insights.length > 0
        ? insights.reduce((sum, i) => sum + (i.ctr || 0), 0) / insights.length
        : 0,
    });
  }

  return metrics;
}
```

### 3. Add to Controllers

```typescript
import { PerformanceSyncService } from './services/performance-sync.service';

@Controller('agents')
export class AgentsController {
  constructor(
    private readonly performanceSync: PerformanceSyncService,
  ) {}

  @Post(':id/sync-performance')
  async syncPerformance(
    @Param('id') agentId: string,
    @Body() options?: { platformsToSync?: string[] },
  ) {
    return this.performanceSync.syncAgentPerformance(agentId, options);
  }

  @Get(':id/performance-metrics')
  async getMetrics(@Param('id') agentId: string) {
    return this.performanceSync.getCurrentMetrics(agentId);
  }

  @Get(':id/performance-history')
  async getHistory(
    @Param('id') agentId: string,
    @Query('year') year?: number,
  ) {
    return this.performanceSync.getHistoricalPerformance(agentId, year);
  }
}
```

### 4. Schedule Automatic Syncs

Use NestJS `@Cron` decorator to schedule periodic syncs:

```typescript
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PerformanceSyncCronService {
  constructor(private readonly performanceSync: PerformanceSyncService) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async syncAllActiveAgents() {
    const activeAgents = await this.agentProfileRepo.find({
      where: { isPublished: true },
    });

    for (const agent of activeAgents) {
      try {
        await this.performanceSync.syncAgentPerformance(agent.id);
      } catch (err) {
        this.logger.error(`Sync failed for agent ${agent.id}`, err);
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateMonthlyAggregates() {
    // Trigger aggregate calculation for all agents
  }
}
```

## Database Schema

### agent_platform_metrics

Stores platform-specific KPIs per month:

```sql
CREATE TABLE agent_platform_metrics (
  id UUID PRIMARY KEY,
  agent_profile_id UUID NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL, -- 'meta', 'google', 'yandex', 'tiktok'
  aggregation_period DATE NOT NULL,
  total_spend DECIMAL(15,2) DEFAULT 0,
  campaigns_count INT DEFAULT 0,
  avg_roas DECIMAL(8,2),
  avg_cpa DECIMAL(10,2),
  avg_ctr DECIMAL(5,3),
  conversion_count INT DEFAULT 0,
  total_revenue DECIMAL(15,2) DEFAULT 0,
  source_type ENUM('api_pull', 'manual_upload', 'case_study') DEFAULT 'api_pull',
  is_verified BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_agent_platform_period (agent_profile_id, platform, aggregation_period),
  INDEX idx_synced_at (synced_at)
);
```

### agent_historical_performance

Stores yearly trends:

```sql
CREATE TABLE agent_historical_performance (
  id UUID PRIMARY KEY,
  agent_profile_id UUID NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
  year_month VARCHAR(7) NOT NULL, -- '2024-02'
  platforms TEXT[] NOT NULL,
  total_campaigns INT DEFAULT 0,
  total_spend DECIMAL(15,2) DEFAULT 0,
  avg_roas DECIMAL(8,2),
  avg_cpa DECIMAL(10,2),
  avg_ctr DECIMAL(5,3),
  best_roas DECIMAL(8,2),
  success_rate DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_agent_month (agent_profile_id, year_month)
);
```

### agent_performance_sync_logs

Audit trail of sync operations:

```sql
CREATE TABLE agent_performance_sync_logs (
  id UUID PRIMARY KEY,
  agent_profile_id UUID NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
  sync_type ENUM('meta', 'google', 'yandex', 'manual'),
  status ENUM('pending', 'in_progress', 'completed', 'failed'),
  records_synced INT DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  next_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Performance Considerations

### 1. Batching

The service processes multiple accounts efficiently:
- Groups accounts by platform
- Fetches data in parallel where possible
- Batches database writes using transactions

### 2. Caching

- Monthly metrics are cached in `AgentProfile.cachedStats`
- Updates marketplace display without recalculating each request
- Refreshed every 6 hours (configurable)

### 3. Error Handling

- Platform-specific errors don't stop other platforms from syncing
- All errors logged to `agent_performance_sync_logs`
- Partial syncs marked as "stale" status
- Failed syncs retry within 2 hours

## Metrics Calculation

### ROAS (Return On Ad Spend)
```
ROAS = Total Revenue / Total Spend
```

### CPA (Cost Per Acquisition)
```
CPA = Total Spend / Total Conversions
```

### CTR (Click Through Rate)
```
CTR = Total Clicks / Total Impressions (as decimal, e.g., 0.032 = 3.2%)
```

### Cached Stats Aggregation

The `cachedStats` object stored on `AgentProfile`:

```typescript
interface AgentStats {
  avgROAS: number;           // Weighted ROAS across all platforms
  avgCPA: number;            // Weighted CPA across all platforms
  avgCTR: number;            // Average CTR (mean of all platforms)
  totalCampaigns: number;    // Sum of campaigns across platforms
  activeCampaigns: number;   // Estimated active (mock: 70% of total)
  successRate: number;       // Percentage (mock: avgROAS * 10)
  totalSpendManaged: number; // Total spend all-time
  bestROAS: number;          // Highest ROAS observed (mock: avgROAS * 1.5)
}
```

## Security

### Token Encryption

ConnectedAccount tokens are encrypted at rest using AES-256:

```typescript
// Encryption happens in ConnectedAccount repository before storage
// Decryption happens when fetching for API calls
const decrypted = decrypt(account.accessToken, ENCRYPTION_KEY);
```

### Tenant Isolation

- All metrics tagged with `agentProfileId` for strict isolation
- Queries filter by agent to prevent cross-agent data leaks
- No sensitive credentials stored in metrics tables

## Monitoring

Monitor sync health via:

1. **LastPerformanceSync**: Check if stale (older than 24 hours)
2. **PerformanceSyncStatus**: One of `healthy`, `stale`, `failed`, `never_synced`
3. **SyncLogs**: Query `agent_performance_sync_logs` for recent errors
4. **CachedStats**: Check if null (indicates first sync or persistent failure)

Example health check:

```typescript
async checkAgentHealth(agentId: string) {
  const agent = await this.agentProfileRepo.findOne({ where: { id: agentId } });
  
  const syncStatus = {
    lastSync: agent.lastPerformanceSync,
    status: agent.performanceSyncStatus,
    isHealthy: agent.performanceSyncStatus === 'healthy',
    isStale: new Date().getTime() - agent.lastPerformanceSync.getTime() > 86400000, // 24h
    hasCachedStats: !!agent.cachedStats,
  };

  return syncStatus;
}
```

## Future Enhancements

1. **Real API Integration**: Replace stubs with actual Meta/Google/Yandex API calls
2. **Webhook Support**: Listen for platform webhooks for real-time updates
3. **Anomaly Detection**: Flag unusual metric changes
4. **Predictive Analytics**: ML-based ROAS forecasting
5. **Cross-Platform Comparison**: Benchmark agent against similar agents
6. **Attribution Modeling**: Multi-touch attribution across platforms
7. **Custom Metrics**: Support for agent-defined KPIs

## Troubleshooting

### Sync Fails with "No Active Engagements"

The agent must have at least one active `ServiceEngagement` with a workspace that has connected ad accounts.

```sql
SELECT se.*, ca.platform, ca.external_account_id 
FROM service_engagements se
JOIN workspaces w ON se.workspace_id = w.id
JOIN connected_accounts ca ON w.id = ca.workspace_id
WHERE se.agent_profile_id = $1 AND se.status = 'active';
```

### Metrics Show Zero Values

Verify that:
1. ConnectedAccount records exist and are marked `isActive = true`
2. Platform API integrations are properly implemented
3. API tokens have not expired (check `tokenExpiresAt`)
4. Workspace campaigns exist on the platform

### Sync Takes Too Long

- Monitor sync logs for slow platform API calls
- Consider async sync via background jobs
- Implement caching at platform API level
- Use parallel sync for multiple accounts

## Related Services

- **MetaSyncService**: Base implementation for Meta Ads API
- **GoogleAdsService**: Google Ads API integration (stub)
- **YandexDirectService**: Yandex Direct API integration (stub)
- **AgentsService**: Core agent profile management
- **WorkspaceService**: Workspace and connected account management
