# Yandex Direct Integration - Deployment Guide

This guide covers deploying the Yandex Direct integration to production environments, including configuration, monitoring, scaling, and operational procedures.

## Table of Contents

1. Pre-Deployment Checklist
2. Environment Configuration
3. Database Migration
4. Monitoring Setup
5. Scaling & Performance Tuning
6. Disaster Recovery
7. Operational Procedures
8. Security Hardening

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing: `npm test -- yandex-sync.service`
- [ ] Integration tests with mock API: `npm test -- yandex.integration`
- [ ] TypeScript strict mode: `npm run build`
- [ ] No console.log or debug code in production
- [ ] No TODO/FIXME comments in critical paths
- [ ] Code reviewed by 2+ team members

### Configuration

- [ ] YANDEX_CLIENT_ID set and validated
- [ ] YANDEX_CLIENT_SECRET set and validated
- [ ] ENCRYPTION_KEY exactly 32 characters
- [ ] CURRENCY_RATES_JSON valid JSON
- [ ] All env vars documented in .env.example
- [ ] No secrets committed to git (check git history)

### Infrastructure

- [ ] Database configured and tested
- [ ] Migrations created and tested locally
- [ ] Connection pooling configured
- [ ] Backup strategy in place
- [ ] Monitoring and alerting set up
- [ ] Load balancer/reverse proxy configured

### Documentation

- [ ] README.md reviewed
- [ ] INTEGRATION_GUIDE.md reviewed
- [ ] API_REFERENCE.md reviewed
- [ ] Operations runbook created
- [ ] Disaster recovery plan documented

### Testing in Staging

- [ ] Deployed to staging environment
- [ ] Full sync cycle tested with real Yandex account
- [ ] Monitored for 24+ hours without errors
- [ ] Load tested with production-like data volume
- [ ] Rollback procedure tested

---

## Environment Configuration

### Production Environment Variables

File: `.env.production`

```bash
# Yandex Direct API Credentials
# Register at https://oauth.yandex.com/
YANDEX_CLIENT_ID=your_production_client_id
YANDEX_CLIENT_SECRET=your_production_secret

# Token Encryption (generate: openssl rand -hex 16)
ENCRYPTION_KEY=your_32_character_encryption_key

# Currency Rates (JSON format)
# Format: {"CURRENCY": rate_multiplier}
# Example: 1 RUB = 0.011 USD
CURRENCY_RATES_JSON='{"USD": 0.011, "EUR": 0.010, "GBP": 0.009, "RUB": 1}'

# Optional: Performance Tuning
YANDEX_API_TIMEOUT=30000
YANDEX_MAX_CONCURRENT_REQUESTS=5
YANDEX_RATE_LIMIT_REQUESTS_PER_HOUR=900  # Use 90% of limit

# Optional: Monitoring
ENABLE_PROMETHEUS_METRICS=true
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
```

### Secrets Management

**Option A: AWS Secrets Manager**

```typescript
// Load secrets from AWS
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "us-east-1" });
const secret = await client.getSecretValue({ SecretId: "yandex-direct-prod" });
const config = JSON.parse(secret.SecretString);
```

**Option B: HashiCorp Vault**

```typescript
// Load secrets from Vault
const vault = new Vault({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
});

const secret = await vault.read('secret/data/yandex-direct');
```

**Option C: Kubernetes Secrets**

```yaml
# k8s-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: yandex-direct-secrets
type: Opaque
data:
  YANDEX_CLIENT_ID: base64_encoded_value
  YANDEX_CLIENT_SECRET: base64_encoded_value
  ENCRYPTION_KEY: base64_encoded_value
  CURRENCY_RATES_JSON: base64_encoded_value
```

### Configuration Validation

Add startup validation:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class YandexConfigValidator implements OnModuleInit {
  constructor(private config: ConfigService) {}

  onModuleInit() {
    // Validate required env vars
    const required = [
      'YANDEX_CLIENT_ID',
      'YANDEX_CLIENT_SECRET',
      'ENCRYPTION_KEY',
    ];

    for (const key of required) {
      const value = this.config.get<string>(key);
      if (!value) {
        throw new Error(`Missing required env var: ${key}`);
      }
    }

    // Validate ENCRYPTION_KEY format
    const encKey = this.config.get<string>('ENCRYPTION_KEY');
    if (encKey.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be exactly 32 characters');
    }

    // Validate CURRENCY_RATES_JSON
    try {
      const rates = JSON.parse(
        this.config.get<string>('CURRENCY_RATES_JSON', '{}')
      );
      if (!rates.USD || typeof rates.USD !== 'number') {
        throw new Error('CURRENCY_RATES_JSON must include USD rate');
      }
    } catch (e) {
      throw new Error(`Invalid CURRENCY_RATES_JSON: ${e.message}`);
    }
  }
}
```

---

## Database Migration

### Create Initial Migration

```typescript
// migration: 1710000000000-CreateYandexMetricsIndexes.ts
import {
  MigrationInterface,
  QueryRunner,
  TableIndex,
} from 'typeorm';

export class CreateYandexMetricsIndexes1710000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add index for fast Yandex queries
    await queryRunner.createIndex(
      'agent_platform_metrics',
      new TableIndex({
        name: 'idx_agent_platform_metrics_yandex',
        columnNames: ['agent_profile_id', 'platform', 'aggregation_period'],
        where: `platform = 'yandex'`,
      })
    );

    // Add index for performance history queries
    await queryRunner.createIndex(
      'agent_platform_metrics',
      new TableIndex({
        name: 'idx_agent_platform_metrics_synced',
        columnNames: ['synced_at'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'agent_platform_metrics',
      'idx_agent_platform_metrics_yandex'
    );
    await queryRunner.dropIndex(
      'agent_platform_metrics',
      'idx_agent_platform_metrics_synced'
    );
  }
}
```

### Migration Process

```bash
# Generate migration
npm run migration:generate -- AddYandexMetricsIndexes

# Test migration locally
npm run migration:run -- --dataSource=ormconfig.local.ts

# Backup production database
pg_dump prod_database > backup_$(date +%s).sql

# Run migration on production
NODE_ENV=production npm run migration:run

# Verify migration
SELECT COUNT(*) FROM agent_platform_metrics WHERE platform = 'yandex';
```

### Rollback Procedure

If migration fails:

```bash
# Restore from backup
psql prod_database < backup_1234567890.sql

# Or revert programmatically
npm run migration:revert -- --step=1
```

---

## Monitoring Setup

### 1. Prometheus Metrics

File: `prometheus.yml`

```yaml
scrape_configs:
  - job_name: 'yandex-sync'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/metrics'
    scrape_interval: 60s
```

Key metrics to track:

```typescript
// Alerts based on these metrics
const alerts = {
  // Sync success rate (should be > 95%)
  'yandex_sync_success_rate < 0.95': {
    severity: 'critical',
    action: 'Page on-call engineer',
  },

  // Sync duration (should be < 30s per specialist)
  'yandex_sync_duration_seconds > 30': {
    severity: 'warning',
    action: 'Investigate performance',
  },

  // Fraud score spike (unusual if > 50)
  'yandex_fraud_score > 50': {
    severity: 'info',
    action: 'Flag for manual review',
  },

  // API quota (alert when < 100 requests remaining)
  'yandex_api_quota_remaining < 100': {
    severity: 'warning',
    action: 'Check for API abuse',
  },
};
```

### 2. Application Performance Monitoring (APM)

Setup with Datadog or New Relic:

```typescript
import * as dd from 'dd-trace';

dd.init({
  hostname: 'apm-agent.yourcompany.com',
  logInjection: true,
  env: 'production',
  service: 'yandex-direct-sync',
});

// Trace sync operations
const span = dd.tracer.startSpan('yandex.syncSpecialistMetrics', {
  tags: { agentProfileId, workspaceId },
});

try {
  const result = await yandexSync.syncSpecialistMetrics(agentProfileId, workspaceId);
  span.setTag('success', result.success);
  span.setTag('campaignsSynced', result.campaignsSynced);
} catch (error) {
  span.setTag('error', true);
  span.setTag('errorMessage', error.message);
} finally {
  span.finish();
}
```

### 3. Error Tracking

Setup with Sentry:

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Don't send events with sensitive data
    if (event.request?.headers?.Authorization) {
      delete event.request.headers.Authorization;
    }
    return event;
  },
});

// Use in service
try {
  // ... code
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      service: 'yandex-sync',
      agentProfileId,
    },
  });
}
```

### 4. Logging

Structured JSON logging to centralized service (ELK, Splunk):

```typescript
import { Logger } from 'winston';

const logger = new Logger({
  format: combine(
    timestamp(),
    json(),
    metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] })
  ),
  transports: [
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' }),
  ],
});

// Log with context
logger.info('Sync completed', {
  agentProfileId,
  campaignsSynced: 5,
  fraudRiskScore: 20,
  durationMs: 2345,
});
```

---

## Scaling & Performance Tuning

### Horizontal Scaling

Run sync service on multiple instances:

```yaml
# docker-compose.yml
services:
  api:
    image: performa-api:latest
    environment:
      NODE_ENV: production
    deploy:
      replicas: 3  # 3 instances
    ports:
      - "3000:3000"

  # Separate sync worker pool
  sync-workers:
    image: performa-api:latest
    environment:
      NODE_ENV: production
      WORKER_MODE: true
    deploy:
      replicas: 5  # 5 workers for sync
    depends_on:
      - postgres
      - redis
```

### Database Connection Pooling

```typescript
// TypeORM config for production
createConnection({
  // ...
  pool: {
    min: 10,
    max: 50,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
  },
});
```

### Rate Limiting Strategy

Distribute API quota across workers:

```typescript
const totalQuota = 1000; // Requests per hour
const workerCount = 5;
const quotaPerWorker = Math.floor(totalQuota / workerCount);

// Each worker respects its quota
const rateLimitConfig = {
  requestsPerHour: quotaPerWorker,
  retryBackoffMs: 1000,
};
```

### Caching Strategy

Cache campaign lists to reduce API calls:

```typescript
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 3600, // 1 hour
      max: 1000, // Max 1000 cache entries
    }),
  ],
})
export class AppModule {}

// Cache campaigns for 1 hour
private async getYandexCampaigns(accountId: string, accessToken: string) {
  const cacheKey = `yandex:campaigns:${accountId}`;
  
  const cached = await this.cacheManager.get(cacheKey);
  if (cached) return cached;

  const campaigns = await this.fetchCampaignsFromAPI(accountId, accessToken);
  
  await this.cacheManager.set(cacheKey, campaigns, 3600000); // 1 hour TTL
  
  return campaigns;
}
```

### Query Optimization

Use database indexes effectively:

```sql
-- Add indexes for common queries
CREATE INDEX idx_metrics_agent_platform_recent
ON agent_platform_metrics(agent_profile_id, platform, aggregation_period DESC)
WHERE platform = 'yandex';

-- Partition large tables by platform
CREATE TABLE agent_platform_metrics_yandex
  PARTITION OF agent_platform_metrics
  FOR VALUES IN ('yandex');
```

---

## Disaster Recovery

### Backup Strategy

```bash
#!/bin/bash
# backup.sh - Run daily at 2 AM UTC

BACKUP_DIR="/backups/yandex-metrics"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup database
pg_dump -Fc performa_db > "$BACKUP_DIR/db_$TIMESTAMP.dump"

# Compress backup
gzip "$BACKUP_DIR/db_$TIMESTAMP.dump"

# Upload to S3
aws s3 cp "$BACKUP_DIR/db_$TIMESTAMP.dump.gz" \
  s3://performa-backups/yandex/

# Cleanup old backups (keep 30 days)
find "$BACKUP_DIR" -name "db_*.dump.gz" -mtime +30 -delete
```

### Recovery Procedure

```bash
#!/bin/bash
# recover.sh - Restore from backup

BACKUP_FILE="$1"
if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: recover.sh <backup-file.dump.gz>"
  exit 1
fi

# Decompress
gunzip -c "$BACKUP_FILE" | pg_restore -d performa_db --verbose

# Verify recovery
psql -d performa_db -c "SELECT COUNT(*) FROM agent_platform_metrics WHERE platform = 'yandex';"
```

### High Availability Setup

```yaml
# Kubernetes HA configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: yandex-sync-ha
spec:
  replicas: 3
  selector:
    matchLabels:
      app: yandex-sync
  template:
    metadata:
      labels:
        app: yandex-sync
    spec:
      # Spread across availability zones
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchExpressions:
                  - key: app
                    operator: In
                    values:
                      - yandex-sync
              topologyKey: topology.kubernetes.io/zone
      
      containers:
        - name: api
          image: performa-api:latest
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5
```

---

## Operational Procedures

### Daily Operations

#### Morning Health Check (7 AM UTC)

```bash
#!/bin/bash
# health-check.sh

echo "=== Yandex Sync Health Check ==="

# Check service status
curl -s http://localhost:3000/health | jq .

# Check recent sync success rate
psql performa_db -c "
  SELECT platform, COUNT(*) as total_syncs, 
    SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful
  FROM agent_performance_sync_logs
  WHERE platform = 'yandex' AND created_at > NOW() - INTERVAL '24 hours'
  GROUP BY platform;
"

# Check for fraud flags
psql performa_db -c "
  SELECT COUNT(*) as high_fraud_count
  FROM agent_profiles
  WHERE fraud_risk_score > 50 AND platform = 'yandex';
"

# Check API quota
echo "Checking rate limit status..."
# Implementation depends on tracking strategy
```

#### Weekly Reconciliation (Sunday 1 AM UTC)

```bash
#!/bin/bash
# weekly-reconciliation.sh

echo "=== Weekly Yandex Metrics Reconciliation ==="

# Backup before reconciliation
./backup.sh

# Trigger deep refresh (60-day lookback, force refresh)
curl -X POST http://localhost:3000/sync/yandex/bulk \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dayLookback": 60,
    "forceRefresh": true
  }'

# Wait for completion
sleep 600

# Verify results
psql performa_db -c "
  SELECT COUNT(*) as metrics_updated
  FROM agent_platform_metrics
  WHERE platform = 'yandex' AND synced_at > NOW() - INTERVAL '1 hour';
"
```

### Incident Response

#### Sync Failures

```
Symptom: Sync success rate drops below 90%

1. Check logs
   - grep "Performance sync failed" /var/log/performa/api.log
   - Look for pattern in failures (specific workspace? specialist?)

2. Diagnose
   - Is Yandex API responding? (ping api.direct.yandex.com)
   - Is database accepting writes? (check connection pool)
   - Are tokens valid? (check token expiry)

3. Remediate
   - If Yandex API down: Wait for recovery, disable sync temporarily
   - If database issue: Increase connection pool, check disk space
   - If token issues: Notify affected specialists to reconnect
```

#### High Fraud Scores

```
Symptom: Fraud risk scores suddenly spike to 50+

1. Investigate
   - Pull metrics with fraud flags
   - Review specialist's Yandex account for unusual activity
   - Check if there were known marketing changes (new campaigns, etc)

2. Assess
   - Are metrics actually fraudulent or just outliers?
   - Is specialist's performance legitimately different?

3. Action
   - Update fraud thresholds if needed
   - Contact specialist if suspicious
   - Flag for manual verification
```

#### Rate Limit Exhaustion

```
Symptom: API returning 429 (Too Many Requests)

1. Check quota usage
   - SELECT * FROM yandex_api_quota_logs ORDER BY timestamp DESC LIMIT 10;

2. Identify culprit
   - Which workspace is making excessive requests?
   - Is there a runaway sync job?

3. Remediate
   - Stop sync jobs temporarily
   - Kill runaway processes
   - Increase retry delay
   - Wait for hourly quota reset
```

---

## Security Hardening

### Network Security

```yaml
# Kubernetes Network Policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: yandex-sync-network-policy
spec:
  podSelector:
    matchLabels:
      app: yandex-sync
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: default
      ports:
        - protocol: TCP
          port: 3000
  egress:
    # Only allow outbound to Yandex API and database
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
    - to:
        - namespaceSelector: {}
      ports:
        - protocol: TCP
          port: 443
          # Restrict to api.direct.yandex.com only
```

### Data Security

```typescript
// Encrypt sensitive data at rest
@Entity()
export class ServiceEngagement {
  @Column({ type: 'text', transformer: new EncryptionTransformer() })
  yandexAccessToken: string;

  @Column({ type: 'text', transformer: new EncryptionTransformer() })
  yandexRefreshToken: string;
}

// Custom transformer
class EncryptionTransformer implements ValueTransformer {
  to(value: string): string {
    return encrypt(value, process.env.ENCRYPTION_KEY);
  }

  from(value: string): string {
    return decrypt(value, process.env.ENCRYPTION_KEY);
  }
}
```

### Access Control

```typescript
// Only allow sync operations by workspace admins or service account
@Post('sync/yandex/bulk')
@UseGuards(AuthGuard('jwt'), WorkspaceAdminGuard)
async syncBulk(@CurrentUser() user: User) {
  // ...
}

// Service account with limited scopes
const serviceAccount = {
  clientId: 'service-account-yandex-sync',
  permissions: ['sync:read', 'sync:write'],
};
```

### Audit Logging

Log all sensitive operations:

```typescript
await this.auditLog.log({
  action: 'YANDEX_SYNC_COMPLETED',
  actor: user.id,
  resource: agentProfileId,
  details: {
    platform: 'yandex',
    campaignsSynced: result.campaignsSynced,
    fraudRiskScore: result.fraudRiskScore,
  },
  timestamp: new Date(),
});
```

---

## Rollout Plan

### Phase 1: Staging (Week 1)

- [ ] Deploy to staging environment
- [ ] Test with real Yandex account (test account)
- [ ] Monitor for 5+ days without errors
- [ ] Load test with production volume

### Phase 2: Canary (Week 2)

- [ ] Deploy to 10% of production traffic
- [ ] Monitor key metrics (success rate, latency, errors)
- [ ] Verify no data corruption
- [ ] Check monitoring and alerting

### Phase 3: Full Production (Week 3)

- [ ] Deploy to remaining 90% of production
- [ ] Monitor continuously for 1 week
- [ ] Keep rollback plan ready
- [ ] Celebrate success

### Rollback Procedure

If critical issues discovered:

```bash
# 1. Stop sync operations
curl -X POST http://localhost:3000/admin/sync/pause \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 2. Revert code to previous version
git revert HEAD

# 3. Rebuild and redeploy
npm run build && docker build -t performa-api:previous .

# 4. Restore database from backup
psql performa_db < backup_pre_deployment.sql

# 5. Verify rollback
curl http://localhost:3000/health | jq .
```

---

## Post-Deployment

### 24-Hour Verification

- [ ] Zero errors in logs
- [ ] All specialists successfully synced
- [ ] No fraud false positives
- [ ] Database performance stable
- [ ] API quota usage within expected range

### 7-Day Evaluation

- [ ] Gather success metrics
- [ ] Review customer feedback
- [ ] Identify optimization opportunities
- [ ] Document lessons learned

---

## Contacts & Escalation

```
Incident Severity: CRITICAL (Sync completely down)
  -> PagerDuty escalation to VP Engineering
  -> Yandex API status page

Incident Severity: HIGH (Success rate < 90%)
  -> Page on-call engineer
  -> Check Yandex API status

Incident Severity: MEDIUM (Individual specialist failures)
  -> Log ticket, monitor over 24 hours
  -> Notify specialist if token refresh fails

Incident Severity: LOW (Warnings, minor performance issues)
  -> Log and monitor
  -> Address in next sprint
```
