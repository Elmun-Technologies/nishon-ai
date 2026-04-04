# Agent Services

This directory contains specialized services for agent-related functionality in the Performa marketplace.

## Services

### PerformanceSyncService

**File**: `performance-sync.service.ts`

Handles real-time synchronization of agent ad account performance data from Meta, Google Ads, and Yandex Direct APIs. Aggregates metrics and stores them for marketplace display.

**Key Features**:
- Syncs performance data from multiple advertising platforms
- Calculates KPIs (ROAS, CPA, CTR, spend, conversions, revenue)
- Stores metrics in `agent_platform_metrics` (monthly rollups)
- Updates historical performance trends
- Caches stats on agent profile for fast marketplace display
- Comprehensive error handling and logging
- Transaction-safe database operations

**Main Methods**:
- `syncAgentPerformance(agentId, options)` - Main sync entry point
- `getCurrentMetrics(agentId)` - Get current month metrics
- `getHistoricalPerformance(agentId, year?)` - Get yearly trends
- `getSyncHistory(agentId, limit)` - Get recent sync logs

**Integration Points**:
- Uses `ServiceEngagement` to find agent's connected workspaces
- Queries `ConnectedAccount` for OAuth-linked ad account credentials
- Stores data in `AgentPlatformMetrics`, `AgentHistoricalPerformance`, `AgentPerformanceSyncLog`
- Updates `AgentProfile.cachedStats` for marketplace display

**See**: `PERFORMANCE_SYNC_SERVICE.md` for detailed documentation

---

## Module Registration

The `AgentsModule` in `agents.module.ts` registers both the main agent service and the new `PerformanceSyncService`:

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([
      AgentProfile,
      ServiceEngagement,
      AgentReview,
      AgentPlatformMetrics,           // New
      AgentHistoricalPerformance,     // New
      AgentPerformanceSyncLog,        // New
      Workspace,
      User,
      ConnectedAccount,               // New
    ]),
  ],
  providers: [AgentsService, PerformanceSyncService],  // New
  exports: [AgentsService, PerformanceSyncService],    // New
})
```

---

## Quick Start

### 1. Inject into Controller

```typescript
import { PerformanceSyncService } from './services/performance-sync.service';

@Controller('agents')
export class AgentsController {
  constructor(
    private readonly performanceSync: PerformanceSyncService,
  ) {}

  @Post(':id/sync-performance')
  async syncPerformance(@Param('id') agentId: string) {
    return this.performanceSync.syncAgentPerformance(agentId);
  }
}
```

### 2. Add Cron Job

```typescript
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PerformanceSyncCron {
  @Cron(CronExpression.EVERY_6_HOURS)
  async syncAllAgents() {
    const agents = await this.agentRepo.find({ where: { isPublished: true } });
    for (const agent of agents) {
      await this.performanceSync.syncAgentPerformance(agent.id);
    }
  }
}
```

### 3. Setup in App Module

```typescript
import { AgentsModule } from './agents/agents.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),  // Enable cron support
    AgentsModule,
  ],
})
export class AppModule {}
```

---

## Platform Integration

### Currently Implemented

The service has production-ready stubs for all three platforms:

- **Meta**: `syncMetaPerformance()`
- **Google Ads**: `syncGooglePerformance()`
- **Yandex Direct**: `syncYandexPerformance()`

Each returns metrics in a standardized format:

```typescript
interface PlatformMetrics {
  platform: string;        // 'meta', 'google', 'yandex'
  totalSpend: number;
  campaignCount: number;
  conversions: number;
  revenue: number;
  avgRoas?: number;
  avgCpa?: number;
  avgCtr?: number;
}
```

### To Activate Real API Calls

**Step 1**: Inject platform-specific services

```typescript
constructor(
  private readonly metaAdsService: MetaAdsService,
  private readonly googleAdsService: GoogleAdsService,
  private readonly yandexService: YandexDirectService,
) {}
```

**Step 2**: Replace stub implementations with real API calls

Example for Meta:

```typescript
private async syncMetaPerformance(
  agent: AgentProfile,
  accounts: ConnectedAccount[],
  engagements: ServiceEngagement[],
): Promise<PlatformMetrics[]> {
  const metrics: PlatformMetrics[] = [];

  for (const account of accounts) {
    const accessToken = await this.decryptToken(account.accessToken);
    
    const campaigns = await this.metaAdsService.getCampaigns(
      account.externalAccountId,
      accessToken,
    );

    const insights = await this.metaAdsService.getInsights(
      account.externalAccountId,
      accessToken,
    );

    metrics.push({
      platform: 'meta',
      totalSpend: insights.reduce((sum, i) => sum + i.spend, 0),
      campaignCount: campaigns.length,
      conversions: insights.reduce((sum, i) => sum + i.conversions, 0),
      revenue: insights.reduce((sum, i) => sum + i.conversionValue, 0),
      avgRoas: /* calculate */,
      avgCpa: /* calculate */,
      avgCtr: /* calculate */,
    });
  }

  return metrics;
}
```

---

## API Response Examples

### Sync Performance (POST)

**Request**:
```
POST /agents/agent-123/sync-performance
{
  "platformsToSync": ["meta", "google"],
  "forceSync": false
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "agentId": "agent-123",
  "recordsSynced": 45,
  "platformsProcessed": ["meta", "google"],
  "metricsStored": 2,
  "errors": [],
  "syncDuration": 2345,
  "lastSyncedAt": "2024-04-04T10:30:00Z"
}
```

### Get Performance Metrics (GET)

**Request**:
```
GET /agents/agent-123/performance-metrics
```

**Response** (200 OK):
```json
{
  "agentId": "agent-123",
  "displayName": "Meta Specialist AI",
  "metrics": [
    {
      "id": "uuid",
      "platform": "meta",
      "aggregationPeriod": "2024-04-01",
      "totalSpend": 15000,
      "campaignsCount": 12,
      "avgRoas": 3.2,
      "avgCpa": 25.50,
      "avgCtr": 0.032,
      "conversionCount": 587,
      "totalRevenue": 48000,
      "sourceType": "api_pull",
      "isVerified": true,
      "syncedAt": "2024-04-04T10:30:00Z"
    }
  ],
  "lastSyncedAt": "2024-04-04T10:30:00Z",
  "syncStatus": "healthy"
}
```

### Get Historical Performance (GET)

**Request**:
```
GET /agents/agent-123/performance-history?year=2024
```

**Response** (200 OK):
```json
{
  "agentId": "agent-123",
  "displayName": "Meta Specialist AI",
  "history": [
    {
      "id": "uuid",
      "yearMonth": "2024-01",
      "platforms": ["meta"],
      "totalCampaigns": 32,
      "totalSpend": 150000,
      "avgRoas": 3.5,
      "avgCpa": 28.50,
      "avgCtr": 0.034,
      "bestRoas": 5.2,
      "successRate": 87.5,
      "createdAt": "2024-02-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "yearMonth": "2024-02",
      "platforms": ["meta"],
      "totalCampaigns": 38,
      "totalSpend": 165000,
      "avgRoas": 3.8,
      "avgCpa": 26.50,
      "avgCtr": 0.038,
      "bestRoas": 5.8,
      "successRate": 89.2,
      "createdAt": "2024-03-01T00:00:00Z"
    }
  ],
  "year": "2024",
  "cachedStats": {
    "avgROAS": 3.6,
    "avgCPA": 27.5,
    "avgCTR": 0.036,
    "totalCampaigns": 120,
    "activeCampaigns": 84,
    "successRate": 88.4,
    "totalSpendManaged": 475000,
    "bestROAS": 5.8
  }
}
```

---

## Database Schema

### agent_platform_metrics

```sql
CREATE TABLE agent_platform_metrics (
  id UUID PRIMARY KEY,
  agent_profile_id UUID NOT NULL,
  platform VARCHAR(20) NOT NULL,
  aggregation_period DATE NOT NULL,
  total_spend DECIMAL(15,2),
  campaigns_count INT,
  avg_roas DECIMAL(8,2),
  avg_cpa DECIMAL(10,2),
  avg_ctr DECIMAL(5,3),
  conversion_count INT,
  total_revenue DECIMAL(15,2),
  source_type VARCHAR(20),
  is_verified BOOLEAN,
  created_at TIMESTAMP,
  synced_at TIMESTAMP,
  FOREIGN KEY (agent_profile_id) REFERENCES agent_profiles(id) ON DELETE CASCADE,
  INDEX idx_agent_platform_period (agent_profile_id, platform, aggregation_period),
  INDEX idx_synced_at (synced_at)
);
```

### agent_historical_performance

```sql
CREATE TABLE agent_historical_performance (
  id UUID PRIMARY KEY,
  agent_profile_id UUID NOT NULL,
  year_month VARCHAR(7) NOT NULL,
  platforms TEXT[],
  total_campaigns INT,
  total_spend DECIMAL(15,2),
  avg_roas DECIMAL(8,2),
  avg_cpa DECIMAL(10,2),
  avg_ctr DECIMAL(5,3),
  best_roas DECIMAL(8,2),
  success_rate DECIMAL(5,2),
  created_at TIMESTAMP,
  FOREIGN KEY (agent_profile_id) REFERENCES agent_profiles(id) ON DELETE CASCADE,
  UNIQUE KEY unique_agent_month (agent_profile_id, year_month)
);
```

### agent_performance_sync_logs

```sql
CREATE TABLE agent_performance_sync_logs (
  id UUID PRIMARY KEY,
  agent_profile_id UUID NOT NULL,
  sync_type VARCHAR(20),
  status VARCHAR(20),
  records_synced INT,
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  next_sync_at TIMESTAMP,
  created_at TIMESTAMP,
  FOREIGN KEY (agent_profile_id) REFERENCES agent_profiles(id) ON DELETE CASCADE
);
```

---

## Error Handling

All errors are captured gracefully:

1. **Platform-level errors**: Don't stop other platforms from syncing
2. **Partial syncs**: Marked as `performanceSyncStatus = 'stale'`
3. **Failed syncs**: Retry within 2 hours
4. **All errors logged**: In `agent_performance_sync_logs` for monitoring

Example error response:

```json
{
  "success": false,
  "agentId": "agent-123",
  "recordsSynced": 0,
  "platformsProcessed": [],
  "metricsStored": 0,
  "errors": [
    "Meta sync failed: Invalid access token",
    "Google sync failed: API rate limit exceeded"
  ],
  "syncDuration": 1234,
  "lastSyncedAt": "2024-04-04T10:30:00Z"
}
```

---

## Monitoring & Health Checks

Monitor agent performance sync health via:

1. **AgentProfile.performanceSyncStatus**: One of `healthy`, `stale`, `failed`, `never_synced`
2. **AgentProfile.lastPerformanceSync**: Timestamp of last successful sync
3. **AgentPerformanceSyncLog**: Query for recent errors and trends
4. **AgentProfile.cachedStats**: Verify it's not null (indicates data freshness)

Example health check:

```typescript
async checkHealth(agentId: string) {
  const agent = await this.agentRepo.findOne({ where: { id: agentId } });
  const now = new Date();
  const hoursSincSync = agent.lastPerformanceSync
    ? (now.getTime() - agent.lastPerformanceSync.getTime()) / (1000 * 60 * 60)
    : null;

  return {
    status: agent.performanceSyncStatus,
    lastSync: agent.lastPerformanceSync,
    isStale: hoursSincSync > 24,
    hasCachedStats: !!agent.cachedStats,
  };
}
```

---

## Performance Tips

1. **Batch Syncs**: Use cron jobs to sync at off-peak hours
2. **Async Processing**: Queue syncs via BullMQ for non-blocking requests
3. **Rate Limiting**: Implement backoff for platform API rate limits
4. **Caching**: Leverage `AgentProfile.cachedStats` for fast marketplace display
5. **Indexing**: Queries use indexed `(agent_profile_id, platform, aggregation_period)` for fast lookups

---

## Security

- **Token Encryption**: ConnectedAccount tokens are AES-256 encrypted
- **Tenant Isolation**: All metrics tagged with `agentProfileId`
- **Access Control**: Only agent owner/admin can trigger sync
- **No Sensitive Data**: Credentials never stored in metrics tables

---

## Examples

See `performance-sync.integration-example.ts` for comprehensive examples of:
- Controller integration
- Cron jobs
- Background queue processing (BullMQ)
- Admin dashboard integration
- Marketplace display integration

---

## Related Documentation

- **Entity Documentation**: See entity files in `../entities/`
- **Module Setup**: See `agents.module.ts`
- **Service Details**: See `PERFORMANCE_SYNC_SERVICE.md`
- **Integration Examples**: See `performance-sync.integration-example.ts`
