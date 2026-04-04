# Fraud Detection Service - Developer Guide

## Overview

The `FraudDetectionService` is a comprehensive fraud detection and metric validation system for the Performa marketplace. It validates performance data from AI agents and human targetologists, detecting anomalies and calculating fraud risk scores.

## Architecture

### Services

1. **FraudDetectionService** - Core fraud detection engine
   - Verifies performance metrics against platform-specific rules
   - Detects anomalies and inconsistencies
   - Calculates fraud risk scores (0-1)
   - Maintains audit trail

2. **FraudDetectionAdminService** - Administrative tools
   - Reviews flagged metrics
   - Manages false positive corrections
   - Adjusts detection thresholds
   - Generates risk analysis reports

### Entities

- **FraudDetectionAudit** - Audit trail for all fraud checks and admin actions
- **AgentProfile** - Extended with `fraudRiskScore` field
- **AgentPlatformMetrics** - Performance metrics with `isVerified` flag
- **AgentPerformanceSyncLog** - Data source tracking

## Usage

### Basic Fraud Verification

```typescript
import { FraudDetectionService } from './services/fraud-detection.service';

// Inject the service
constructor(private fraudDetectionService: FraudDetectionService) {}

// Verify metrics
const result = await this.fraudDetectionService.verify(
  agentId,
  'meta',
  {
    platform: 'meta',
    totalSpend: 5000,
    campaignsCount: 10,
    avgRoas: 4.5,
    avgCpa: 8.2,
    avgCtr: 2.5,
    conversionCount: 100,
    totalRevenue: 22500,
    clicks: 500,
    impressions: 10000,
    timestamp: new Date(),
  }
);

// Check result
if (!result.passed) {
  console.log(`Fraud detected: ${result.reason}`);
  console.log(`Risk score: ${result.riskScore}`);
  console.log('Failed checks:');
  result.failedChecks.forEach(check => {
    console.log(`  - ${check.rule} (${check.severity}): ${check.message}`);
  });
}
```

### Integration with Performance Sync

```typescript
// In PerformanceSyncService
async syncMetrics(agentId: string, platform: string, metrics: MetricsData) {
  // Verify metrics before saving
  const fraudCheck = await this.fraudDetectionService.verify(agentId, platform, metrics);

  if (!fraudCheck.passed) {
    // Block critical issues
    throw new BadRequestException(`Fraud check failed: ${fraudCheck.reason}`);
  }

  if (fraudCheck.failedChecks.length > 0) {
    // Flag warnings for review
    this.logger.warn(`Warnings for agent ${agentId}: ${JSON.stringify(fraudCheck.failedChecks)}`);
    // Could send notification to admins
  }

  // Save metrics
  await this.metricsRepo.save({
    agentProfileId: agentId,
    platform,
    ...metrics,
    isVerified: fraudCheck.passed,
  });
}
```

### Admin Review

```typescript
import { FraudDetectionAdminService } from './services/fraud-detection-admin.service';

// Get agents with high fraud risk
const highRiskAgents = await this.adminService.getHighRiskAgents(0.6);

// Analyze fraud risk for specific agent
const analysis = await this.adminService.analyzeFraudRisk(agentId);
console.log(`Risk trend: ${analysis.trends.riskTrend}`);
console.log(`Top issues: ${analysis.topFailedRules.map(r => r.rule).join(', ')}`);

// Review a fraud detection audit
await this.adminService.reviewFraudAudit(
  auditId,
  {
    action: 'approve',
    comment: 'Data verified manually. No fraudulent activity detected.'
  },
  adminId
);

// Mark as false positive
await this.adminService.reviewFraudAudit(
  auditId,
  {
    action: 'mark_false_positive',
    rule: 'roas_anomaly',
    comment: 'Agent legitimately achieved high ROAS during campaign launch.'
  },
  adminId
);

// Adjust thresholds
await this.adminService.adjustThresholds(
  'meta',
  { maxRoas: 18, maxConversionRate: 18 },
  adminId
);
```

## Fraud Detection Rules

### 1. ROAS Anomaly
**Rule:** `roas_anomaly`

Detects unrealistically high ROAS values which may indicate:
- Data fabrication
- Calculator errors
- Extreme market conditions (rare)

**Thresholds by platform:**
- Meta: > 15 = WARNING, > 22.5 = CRITICAL
- Google: > 12 = WARNING, > 18 = CRITICAL
- Yandex: > 10 = WARNING, > 15 = CRITICAL
- TikTok: > 14 = WARNING, > 21 = CRITICAL
- Telegram: > 8 = WARNING, > 12 = CRITICAL

### 2. Spend Spike
**Rule:** `spend_spike`

Detects abnormal month-over-month spending increases.

**Threshold:** > 50% MoM increase = WARNING

**Indicates:**
- Budget changes (legitimate)
- Scaling success (legitimate)
- Potential artificially inflated data

### 3. Conversion Rate
**Rule:** `conversion_rate`

Flags unrealistically high conversion rates which are extremely rare.

**Thresholds:**
- Meta: > 15% = CRITICAL
- Google: > 12% = CRITICAL
- Yandex: > 10% = CRITICAL

**Context:** Typical e-commerce conversion rates are 1-5%, search ads 5-10%

### 4. CPC Consistency
**Rule:** `cpc_variance`

Detects high variance in CPC over time.

**Threshold:** > 300% coefficient of variation = INFO

**Indicates:**
- Bid management issues
- Auction quality changes
- Seasonal variations (may be legitimate)

### 5. Data Consistency
**Rule:** `data_timestamp`, `campaign_count`, `roas_consistency`, `sync_status`

Multiple checks for data integrity:

- **data_timestamp:** Data older than 24-48 hours = WARNING
- **campaign_count:** Below minimum for platform = WARNING
- **roas_consistency:** Revenue-to-spend ROAS differs > 10% from reported = INFO
- **sync_status:** Last data sync failed = WARNING

## Risk Scoring

Risk scores range from 0 (safe) to 1 (high risk):

| Score Range | Meaning | Action |
|-----------|---------|--------|
| 0.0-0.1 | No issues or info only | Publish metrics |
| 0.1-0.3 | Minor warnings | Publish, monitor |
| 0.3-0.5 | Moderate warnings | Flag for review, publish |
| 0.5-0.8 | High warnings or low critical | Flag for review, don't publish |
| 0.8-1.0 | Critical issues | Block publication, admin review |

### Calculation Logic

```
Score = 0.0 (baseline)

If critical issues:
  Score = 0.8 + (number of critical * 0.1), capped at 1.0
Else if warnings:
  Score = 0.3 + (number of warnings * 0.15), capped at 0.7
Else if info only:
  Score = 0.1 + (number of info * 0.05), capped at 0.2
```

## Platform-Specific Thresholds

### Meta
```
maxRoas: 15
maxConversionRate: 15%
maxSpendSpikeMoM: 50%
maxCpcVariance: 300%
maxDataAge: 24 hours
```

### Google
```
maxRoas: 12
maxConversionRate: 12%
maxSpendSpikeMoM: 50%
maxCpcVariance: 300%
maxDataAge: 24 hours
```

### Yandex
```
maxRoas: 10
maxConversionRate: 10%
maxSpendSpikeMoM: 45%
maxCpcVariance: 280%
maxDataAge: 24 hours
```

### TikTok
```
maxRoas: 14
maxConversionRate: 13%
maxSpendSpikeMoM: 50%
maxCpcVariance: 300%
maxDataAge: 24 hours
```

### Telegram
```
maxRoas: 8
maxConversionRate: 8%
maxSpendSpikeMoM: 40%
maxCpcVariance: 250%
maxDataAge: 24 hours
```

## Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| **CRITICAL** | Likely fraud or invalid data | Block publication, require admin review |
| **WARNING** | Suspicious pattern or anomaly | Flag for review, allow with caution |
| **INFO** | Informational note | Log for analysis, doesn't affect publication |

## Admin Actions

### Approve Metrics
After manual verification, admin can approve metrics for publication:

```typescript
await adminService.approveMetrics(metricId, adminId, 'Verified manually.');
```

### Reject Metrics
Admin can reject suspicious metrics:

```typescript
await adminService.rejectMetrics(metricId, adminId, 'Data does not match source.');
```

### Mark False Positive
If a rule incorrectly flagged legitimate data:

```typescript
await adminService.reviewFraudAudit(auditId, {
  action: 'mark_false_positive',
  rule: 'roas_anomaly',
  comment: 'Agent legitimately achieved high ROAS.'
}, adminId);
```

This helps improve the detection algorithm.

### Adjust Thresholds
Dynamically tune detection sensitivity:

```typescript
await adminService.adjustThresholds('meta', {
  maxRoas: 20,
  maxConversionRate: 20
}, adminId);
```

## Database Schema

### fraud_detection_audits Table

```sql
CREATE TABLE fraud_detection_audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_profile_id VARCHAR NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
  action ENUM('fraud_check', 'admin_approved', 'admin_rejected', 'marked_false_positive', 'threshold_adjusted'),
  platform VARCHAR(50) NOT NULL,
  risk_score NUMERIC(3,2) NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT true,
  failed_checks JSONB,
  admin_comment TEXT,
  admin_id VARCHAR,
  false_pos_rule VARCHAR,
  source_type ENUM('api_pull', 'manual_upload', 'case_study'),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fraud_audit_agent_date ON fraud_detection_audits(agent_profile_id, created_at);
CREATE INDEX idx_fraud_audit_risk_score ON fraud_detection_audits(risk_score, created_at);
CREATE INDEX idx_fraud_audit_action ON fraud_detection_audits(action);
CREATE INDEX idx_fraud_audit_platform ON fraud_detection_audits(platform);
```

## Error Handling

The service handles errors gracefully:

```typescript
try {
  const result = await fraudDetectionService.verify(agentId, platform, metrics);
} catch (error) {
  // Returns cautious result with 0.8 risk score
  // Logs error for investigation
  // Recommends manual review
}
```

## Testing

Run the test suite:

```bash
npm test -- fraud-detection.service.spec.ts
```

Tests cover:
- Valid metric verification
- High ROAS detection
- High conversion rate detection
- Error handling
- Platform-specific thresholds
- Risk score calculation
- Data consistency checks

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Average fraud risk score** - Should remain stable (< 0.2)
2. **Critical findings rate** - Track critical issues over time
3. **False positive rate** - Monitor marked false positives
4. **Admin review backlog** - Flagged metrics awaiting review

### Alert Triggers

- Agent fraud risk score > 0.8 → Immediate admin review
- Multiple critical issues in 24 hours → Alert fraud detection team
- False positive rate > 10% → Review detection rules
- High-risk agents with new metrics → Escalate for manual review

## Performance Considerations

1. **Caching:** Agent's current metrics are cached in `AgentProfile.cachedStats`
2. **Batch Operations:** Process multiple metrics efficiently using bulk checks
3. **Historical Data:** Spend spike check queries last 30 days (indexed by date)
4. **Async Operations:** Heavy checks (CPC variance) are async

## Security

1. **Admin-only Actions:** Threshold adjustment and metric approval require admin verification
2. **Audit Trail:** All actions logged in `fraud_detection_audits`
3. **Data Isolation:** Each agent's metrics isolated by `agentProfileId`
4. **Compliance:** Full audit trail for regulatory requirements

## Future Enhancements

1. **Machine Learning:** ML-based anomaly detection
2. **Behavioral Analysis:** Track individual agent patterns over time
3. **Network Analysis:** Detect coordinated fraud across agents
4. **Real-time Alerts:** WebSocket notifications for critical issues
5. **Custom Rules:** Per-workspace fraud detection rules
6. **Integration:** Connect to external fraud detection services

## Troubleshooting

### High False Positives
- Check if agent type (human vs AI) is accurate
- Verify platform thresholds are calibrated for your market
- Review successful similar agents' metrics
- Consider marking false positives to improve algorithm

### Missing Sync Data
- Verify `AgentPerformanceSyncLog` entries
- Check if data source (API, manual, case study) is correct
- Confirm connected accounts are still valid
- Look for failed sync attempts in logs

### Risk Score Not Updating
- Verify `AgentProfile.update()` succeeded
- Check database connection
- Confirm migration ran (`AddFraudDetectionAudit`)
- Look for permission issues on fraud_risk_score column

## Contact

For questions or issues with fraud detection:
- Slack: #fraud-detection-team
- Email: fraud-detection@performa.dev
