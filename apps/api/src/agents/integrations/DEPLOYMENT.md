# Deployment & Operations Guide

## Pre-Deployment Checklist

### Code Changes

- [ ] `IntegrationsModule` imported in `AgentsModule`
- [ ] `MetaPerformanceSyncService` injection configured
- [ ] REST endpoints added to `AgentsController`
- [ ] Cron service created with sync job
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing

### Database

- [ ] Migration created for new columns
- [ ] Migration tested locally
- [ ] Backup of production database taken
- [ ] Rollback plan documented

### Configuration

- [ ] `META_APP_ID` set in environment
- [ ] `META_APP_SECRET` set in environment
- [ ] `ENCRYPTION_KEY` set (32-char hex)
- [ ] `META_CALLBACK_URL` configured (if needed)
- [ ] All secrets in secure vault (not .env file)

### Infrastructure

- [ ] NestJS scheduler enabled
- [ ] Database connection pooling adequate
- [ ] Rate limiting configured on API gateway (if any)
- [ ] Monitoring/alerting rules created

## Deployment Steps

### 1. Prepare Environment

```bash
# Verify environment variables
echo "META_APP_ID=${META_APP_ID:?not set}"
echo "META_APP_SECRET=${META_APP_SECRET:?not set}"
echo "ENCRYPTION_KEY=${ENCRYPTION_KEY:?not set}"

# Test database connection
npm run typeorm migration:show

# Run migrations in dry-run first
npm run typeorm migration:run -- --dry-run
```

### 2. Run Migrations

```bash
# Apply database migrations
npm run typeorm migration:run

# Verify migration succeeded
npm run typeorm migration:show  # Should show migration as successful

# Query to verify new columns exist
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns 
  WHERE table_name='agent_profiles' 
  AND column_name IN ('fraud_risk_score', 'last_performance_sync', 
                      'performance_sync_status', 'is_performance_data_verified')"
```

### 3. Build & Test

```bash
# Build NestJS app
npm run build

# Run full test suite
npm test

# Run integration tests
npm run test:e2e

# Verify no TypeScript errors
npm run type-check
```

### 4. Deploy

```bash
# Option A: Docker
docker build -t performa-api:vX.Y.Z .
docker push your-registry/performa-api:vX.Y.Z
kubectl apply -f deployment.yaml  # Update image tag first

# Option B: Direct deployment
npm run build
cp -r dist /var/www/performa-api/
systemctl restart performa-api
```

### 5. Post-Deployment Verification

```bash
# Check service is running
curl http://localhost:3000/health

# Test Meta OAuth flow
# 1. Get auth URL: GET /auth/meta/authorize
# 2. Complete OAuth
# 3. Check ConnectedAccount created in DB

# Test manual sync endpoint
curl -X POST http://localhost:3000/agents/:agentId/sync-meta-metrics \
  -H "Authorization: Bearer TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dayLookback": 7}'

# Verify cron job scheduled
# Check logs for "Starting daily performance metrics sync" at midnight UTC
```

## Rollback Plan

If issues found post-deployment:

### Option 1: Revert Code

```bash
# Revert to previous version
git revert HEAD
npm run build
# Redeploy previous version
```

### Option 2: Revert Database

```bash
# Rollback migrations
npm run typeorm migration:revert

# Verify columns removed
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns 
  WHERE table_name='agent_profiles' AND column_name = 'fraud_risk_score'"
# Should return empty
```

### Option 3: Disable Feature

If code is deployed but causing issues:

```typescript
// In meta-sync.service.ts
async syncSpecialistMetrics(...) {
  if (!this.config.get("FEATURE_META_SYNC_ENABLED")) {
    throw new Error("Feature temporarily disabled");
  }
  // ... rest of code
}
```

Set `FEATURE_META_SYNC_ENABLED=false` to disable.

## Monitoring Setup

### Logs to Watch

**INFO** (normal):
```
"Sync started for specialist"
"Sync completed successfully"
"Token refreshed successfully"
"Metrics persisted"
```

**WARN** (investigate):
```
"No campaigns found"
"Rate limit hit"
"Token decryption failed"
"High fraud score detected"
```

**ERROR** (critical):
```
"Sync failed: Token expired (can't refresh)"
"Database transaction failed"
"Account sync failed"
```

### Key Metrics to Monitor

```typescript
// In your monitoring dashboard (DataDog, Prometheus, etc.)
{
  "sync_duration_ms": {
    "p50": 3000,
    "p95": 8000,
    "p99": 15000
  },
  "campaigns_synced": {
    "p50": 30,
    "p95": 100
  },
  "fraud_risk_score": {
    "avg": 15,
    "max": 85
  },
  "sync_success_rate": 0.98,  // 98% success
  "error_rate": 0.02           // 2% errors
}
```

### Alerts to Set Up

| Metric | Threshold | Action |
|--------|-----------|--------|
| Sync duration | > 30s | Page on-call |
| Fraud score avg | > 40 | Slack alert to admins |
| Sync failures | > 5% daily | Page on-call |
| Token refresh failures | > 10/day | Slack alert |
| Rate limit hits | > 100/day | Investigate API usage |
| Database errors | > 0 | Critical alert |

### Example Prometheus Alerts

```yaml
groups:
  - name: meta_sync
    rules:
      - alert: MetaSyncHighFraudScore
        expr: meta_sync_fraud_score_avg > 40
        for: 1h
        annotations:
          summary: "High average fraud score in Meta syncs"
          
      - alert: MetaSyncSlowDuration
        expr: meta_sync_duration_ms > 30000
        for: 15m
        annotations:
          summary: "Meta sync taking > 30 seconds"
          
      - alert: MetaSyncHighFailureRate
        expr: meta_sync_success_rate < 0.95
        for: 1h
        annotations:
          summary: "Meta sync failure rate > 5%"
```

## Health Checks

### Database Health

```sql
-- Check if metrics table is accessible
SELECT COUNT(*) FROM agent_platform_metrics;

-- Check recent syncs
SELECT MAX(synced_at) as last_sync FROM agent_platform_metrics;

-- Check for stale data (last sync > 7 days ago)
SELECT COUNT(*) FROM agent_profiles 
WHERE last_performance_sync < NOW() - INTERVAL '7 days';
```

### API Health

```bash
# Check if sync endpoint responds
curl -s http://localhost:3000/agents/test-id/sync-meta-metrics -I

# Check if cron job is running (should see log entries at midnight UTC)
tail -f /var/log/performa-api.log | grep "Starting daily performance"
```

### Service Health

```typescript
// Add health check endpoint
@Get("health/meta-sync")
async getMetaSyncHealth() {
  const lastSync = await metricsRepo
    .createQueryBuilder()
    .orderBy("synced_at", "DESC")
    .limit(1)
    .getOne();

  return {
    status: lastSync?.syncedAt > new Date(Date.now() - 86400000) 
      ? "healthy" 
      : "stale",
    lastSync: lastSync?.syncedAt,
    syncStale: Date.now() - lastSync?.syncedAt.getTime() > 86400000
  };
}
```

## Operational Tasks

### Manually Sync a Specialist

```bash
# Via API
curl -X POST https://api.example.com/agents/$AGENT_ID/sync-meta-metrics \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dayLookback": 30, "forceRefresh": true}'

# Via CLI (if available)
npm run cli -- sync-metrics --agent-id $AGENT_ID --workspace-id $WS_ID
```

### Fix High Fraud Score

1. **Investigate**: Check the warnings in sync result
   ```sql
   SELECT * FROM agent_platform_metrics 
   WHERE agent_profile_id = $ID AND fraud_risk_score > 50
   ORDER BY aggregation_period DESC;
   ```

2. **Review**: Check metrics in Meta Ads Manager
   - Verify conversion tracking is set up
   - Check for bot traffic or click fraud
   - Review campaign objectives

3. **Resolve**: After fixing in Meta, force refresh
   ```bash
   curl -X POST /agents/$ID/sync-meta-metrics \
     -d '{"forceRefresh": true}'
   ```

### Handle Token Expiration

```sql
-- Find accounts with expired tokens
SELECT ca.*, ap.display_name 
FROM connected_account ca
JOIN agent_profiles ap ON ap.id = ca.agent_profile_id
WHERE ca.platform = 'meta' 
  AND ca.token_expires_at < NOW();

-- Notify affected specialists
-- (Admin should send email asking them to re-authorize)
```

### Update Fraud Detection Rules

To modify fraud detection thresholds:

```typescript
// In meta-sync.service.ts validateMetricsWithFraudDetection()
private fraudDetectionConfig = {
  negativeSpendRisk: 25,        // Change here
  ctrMaxPercent: 100,
  cpaMinDollars: 0.01,
  cpaMaxDollars: 10000,
  roasMaxSpikeFactor: 2.0,      // Change here
  ...
};
```

After changes:
1. Deploy new code
2. Force refresh metrics: `forceRefresh: true`
3. Monitor fraud scores for changes

## Performance Tuning

### Database Query Optimization

```sql
-- Ensure indexes exist
CREATE INDEX idx_agent_platform_metrics_profile 
  ON agent_platform_metrics(agent_profile_id, platform, aggregation_period);

CREATE INDEX idx_agent_platform_metrics_synced 
  ON agent_platform_metrics(synced_at DESC);

-- Analyze table for query planner
ANALYZE agent_platform_metrics;

-- Check for missing indexes
SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;
```

### Rate Limiting Tuning

If hitting Meta API limits, adjust:

```typescript
// In meta-sync.service.ts
private async applyRateLimit(accountId: string) {
  const minDelay = 100 * state.backoffMultiplier;
  // Increase base delay if needed:
  const minDelay = 200 * state.backoffMultiplier; // 200ms instead of 100ms
}
```

### Batch Size Optimization

For large specialists with many campaigns:

```typescript
// Adjust chunk size for upserts
for (const chunk of this.chunks(aggregatedMetrics, 1000)) {
  // Increase from 500 to 1000 if memory allows
  await em.upsert(AgentPlatformMetrics, chunk, {...});
}
```

## Scaling Considerations

### Horizontal Scaling

The service is stateless and can be horizontally scaled:

```yaml
# kubernetes deployment.yaml
replicas: 3  # Or use HPA

# Cron jobs will run on each replica!
# Need singleton cron execution (e.g., via leader election)
```

For single cron job across replicas, use:
- [Nest/Bull](https://docs.nestjs.com/techniques/queues) for job queue
- [NestJS Distributed Locking](https://github.com/nest-modules/redislock)
- External job scheduler (Temporal, CloudScheduler, etc.)

### Database Scaling

As metrics table grows:

```sql
-- Monitor table size
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename = 'agent_platform_metrics';
```

Consider:
- Partitioning by `agent_profile_id` or `aggregation_period`
- Archive old data (> 2 years) to separate table
- Increase connection pool if sync concurrency high

### Rate Limit Scaling

If syncing many specialists (> 100), implement:

```typescript
// Queue syncs instead of parallel
const queue = new PQueue({ concurrency: 5 }); // Max 5 parallel

for (const specialist of specialists) {
  queue.add(() => 
    this.syncSpecialistMetrics(specialist.id, workspaceId)
  );
}
```

## Incident Response

### Sync Outage

**Symptoms**: Sync fails for all specialists, last_performance_sync not updating

**Investigation**:
```bash
# Check service status
systemctl status performa-api
journalctl -u performa-api -n 100  # Last 100 lines

# Check database connectivity
npm run typeorm query "SELECT 1"

# Check Meta API status
curl https://developers.facebook.com/status/
```

**Recovery**:
```bash
# Restart service
systemctl restart performa-api

# If database issue, check connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Manual sync to verify fixed
curl -X POST /agents/test-id/sync-meta-metrics
```

### High Memory Usage

**Symptoms**: Process memory > 2GB, slow syncs

**Investigation**:
```bash
# Check memory
top -p $(pgrep -f "node.*api")

# Check for memory leaks
node --inspect dist/main.js
# Use Chrome DevTools to profile
```

**Fix**:
- Reduce batch size (chunks of 250 instead of 500)
- Increase Node heap size: `--max-old-space-size=4096`
- Reduce concurrent syncs (PQueue concurrency: 3)

### Database Locks

**Symptoms**: Upsert queries hang, slow syncs

**Investigation**:
```sql
-- Check for long-running transactions
SELECT pid, duration, query FROM pg_stat_statements 
WHERE duration > 10000 ORDER BY duration DESC;

-- Check for locks
SELECT * FROM pg_locks 
WHERE NOT granted;
```

**Fix**:
- Kill long-running query: `SELECT pg_terminate_backend(pid);`
- Increase `statement_timeout`: `SET statement_timeout TO '30s';`
- Add index on conflict columns

## Maintenance Windows

### Weekly

```bash
# Check error logs for patterns
tail -f /var/log/performa-api.log | grep ERROR

# Review fraud scores trending upward
psql $DATABASE_URL -c "SELECT DATE_TRUNC('week', synced_at), 
  AVG(fraud_risk_score) FROM agent_platform_metrics 
  GROUP BY DATE_TRUNC('week', synced_at);"
```

### Monthly

```bash
# Verify all specialists synced in last 30 days
psql $DATABASE_URL -c "SELECT COUNT(*) FROM agent_profiles 
  WHERE last_performance_sync < NOW() - INTERVAL '30 days';"

# Archive old metrics (> 24 months)
psql $DATABASE_URL -c "DELETE FROM agent_platform_metrics 
  WHERE aggregation_period < NOW() - INTERVAL '24 months';"

# Reindex table for performance
REINDEX TABLE agent_platform_metrics;
```

### Quarterly

- Review and update fraud detection thresholds
- Audit token refresh rate for unusual patterns
- Performance capacity planning
- Cost analysis (API calls, storage, compute)

## Disaster Recovery

### Full Database Restore

```bash
# From backup
pg_restore -d $DATABASE_URL /backups/postgres_backup.dump

# Verify migrations applied
npm run typeorm migration:show

# Verify data integrity
SELECT COUNT(*) FROM agent_platform_metrics;
SELECT MAX(synced_at) FROM agent_platform_metrics;
```

### Recreate from Scratch

```bash
# Drop and recreate
psql $DATABASE_URL -c "DROP TABLE agent_platform_metrics;"

# Run migrations
npm run typeorm migration:run

# Re-sync all specialists
curl -X POST /admin/resync-all-specialists \
  -d '{"dayLookback": 365, "forceRefresh": true}'
```

## Documentation

Keep these updated:
- [ ] Runbook for common issues
- [ ] Alert escalation procedures
- [ ] On-call rotation documentation
- [ ] Performance baselines and thresholds
- [ ] Fraud detection rule changes
