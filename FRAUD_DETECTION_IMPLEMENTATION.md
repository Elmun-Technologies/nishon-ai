# Fraud Detection Service - Implementation Summary

## Overview

A comprehensive fraud detection and metric validation system has been implemented for the Performa marketplace. This system detects anomalies in agent performance data, validates metrics, and calculates fraud risk scores.

## Files Created

### Core Services

1. **`/apps/api/src/agents/services/fraud-detection.service.ts`** (587 lines)
   - Main fraud detection engine
   - Validates performance metrics against platform-specific rules
   - Detects 5 types of anomalies (ROAS, spend spike, conversion rate, CPC variance, data consistency)
   - Calculates fraud risk scores (0-1 scale)
   - Updates agent fraud risk scores in database

2. **`/apps/api/src/agents/services/fraud-detection-admin.service.ts`** (442 lines)
   - Administrative tools for fraud management
   - Review and approval workflows
   - False positive handling
   - Dynamic threshold adjustment
   - Risk analysis and reporting
   - Audit history and compliance

### Database Entities

3. **`/apps/api/src/agents/entities/fraud-detection-audit.entity.ts`** (62 lines)
   - Audit trail entity for fraud detection checks
   - Stores all fraud checks, admin actions, and decisions
   - Indexed for efficient querying

4. **Updated `agent-profile.entity.ts`**
   - Added `fraudAudits` relationship for audit trail
   - Already had `fraudRiskScore` field (decimal 0-1)

### Database Migration

5. **`/apps/api/src/database/migrations/1712350000000-AddFraudDetectionAudit.ts`** (98 lines)
   - Creates `fraud_detection_audits` table with proper indexes
   - Supports historical analysis and compliance reporting

### Module Configuration

6. **Updated `agents.module.ts`**
   - Added FraudDetectionService and FraudDetectionAdminService to providers
   - Added FraudDetectionAudit and AgentPlatformMetrics to imports
   - Exported both services for use in other modules

### Testing

7. **`/apps/api/src/agents/services/fraud-detection.service.spec.ts`** (380 lines)
   - Comprehensive unit tests
   - Tests all fraud detection rules
   - Tests risk score calculation
   - Tests error handling
   - 11 test suites with 30+ test cases

### Documentation

8. **`/apps/api/src/agents/services/FRAUD_DETECTION_GUIDE.md`** (500+ lines)
   - Complete developer guide
   - Usage examples and patterns
   - Rule descriptions with thresholds
   - Database schema documentation
   - Troubleshooting guide
   - Performance and security considerations

9. **`/apps/api/src/agents/services/fraud-detection.examples.ts`** (400+ lines)
   - 10 practical usage examples
   - Integration patterns
   - Admin workflows
   - Batch processing
   - Real-time monitoring setup

## Key Features Implemented

### Fraud Detection Rules

1. **ROAS Anomaly** - Detects unrealistically high ROAS
   - Meta: >15 WARNING, >22.5 CRITICAL
   - Google: >12 WARNING, >18 CRITICAL
   - Yandex: >10 WARNING, >15 CRITICAL

2. **Spend Spike** - Detects abnormal MoM increases
   - >50% increase = WARNING

3. **Conversion Rate** - Detects unrealistic conversion rates
   - Meta/Google/Yandex: >10-15% = CRITICAL

4. **CPC Variance** - Detects high CPC inconsistency
   - >300% coefficient of variation = INFO

5. **Data Consistency** - Validates data integrity
   - Data age, campaign count, revenue-spend ratio, sync status

### Platform-Specific Thresholds

Customized for: Meta, Google, Yandex, TikTok, Telegram

Each with configurable:
- maxRoas
- maxConversionRate
- maxSpendSpikeMoM
- maxCpcVariance
- maxDataAge

### Risk Scoring Algorithm

- **0.0-0.1**: Safe (no issues)
- **0.1-0.3**: Low (minor warnings)
- **0.3-0.5**: Moderate (warnings)
- **0.5-0.8**: High (high warnings/low critical)
- **0.8-1.0**: Critical (critical issues)

### Admin Features

- **Review Flagged Metrics** - Examine suspicious data
- **Approve/Reject** - Publication control with audit trail
- **Mark False Positives** - Improve detection algorithm
- **Adjust Thresholds** - Fine-tune per platform
- **Risk Analysis** - Comprehensive fraud risk reports
- **Audit History** - Full compliance trail

### Severity Levels

- **CRITICAL** - Blocks publication, requires admin review
- **WARNING** - Flags for review, allows with caution
- **INFO** - Informational only, doesn't affect publication

## Database Changes

### New Table: fraud_detection_audits

```sql
CREATE TABLE fraud_detection_audits (
  id UUID PRIMARY KEY,
  agent_profile_id VARCHAR NOT NULL,
  action ENUM('fraud_check', 'admin_approved', 'admin_rejected', 'marked_false_positive', 'threshold_adjusted'),
  platform VARCHAR(50) NOT NULL,
  risk_score NUMERIC(3,2) NOT NULL,
  passed BOOLEAN NOT NULL,
  failed_checks JSONB,
  admin_comment TEXT,
  admin_id VARCHAR,
  false_pos_rule VARCHAR,
  source_type ENUM('api_pull', 'manual_upload', 'case_study'),
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (agent_profile_id) REFERENCES agent_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_fraud_audit_agent_date ON fraud_detection_audits(agent_profile_id, created_at);
CREATE INDEX idx_fraud_audit_risk_score ON fraud_detection_audits(risk_score, created_at);
CREATE INDEX idx_fraud_audit_action ON fraud_detection_audits(action);
CREATE INDEX idx_fraud_audit_platform ON fraud_detection_audits(platform);
```

### Existing Tables Extended

- **agent_profiles**: Already has `fraud_risk_score` column
- **agent_platform_metrics**: Already has `isVerified` flag
- **agent_performance_sync_logs**: Already tracks data sources

## Usage Patterns

### Basic Verification

```typescript
const result = await fraudDetectionService.verify(agentId, 'meta', metrics);
if (!result.passed) {
  throw new Error(`Fraud detected: ${result.reason}`);
}
```

### Integration with Performance Sync

```typescript
async syncMetrics(agentId: string, metrics: MetricsData) {
  const fraudCheck = await fraudDetectionService.verify(agentId, 'meta', metrics);
  
  if (!fraudCheck.passed) {
    // Block critical issues
    throw new BadRequestException('Fraud detected');
  }
  
  // Save metrics
  await saveMetrics(agentId, metrics, fraudCheck.passed);
}
```

### Admin Review

```typescript
const analysis = await adminService.analyzeFraudRisk(agentId);
await adminService.reviewFraudAudit(auditId, {
  action: 'approve',
  comment: 'Verified manually'
}, adminId);
```

## Type Safety

Full TypeScript support with interfaces for:

```typescript
FraudDetectionResult {
  passed: boolean
  riskScore: number (0-1)
  reason: string
  failedChecks: FailedCheck[]
  timestamp: Date
}

MetricsData {
  platform: 'meta' | 'google' | 'yandex' | 'tiktok' | 'telegram'
  totalSpend: number
  campaignsCount: number
  avgRoas: number
  avgCpa: number
  avgCtr: number
  conversionCount: number
  totalRevenue: number
  clicks?: number
  impressions?: number
  timestamp?: Date
}

FraudSeverity = 'critical' | 'warning' | 'info'
```

## Error Handling

- Graceful error handling with informative messages
- Returns cautious result (0.8 risk score) on service errors
- Detailed error logging for debugging
- Database transaction safety

## Performance Considerations

1. **Async Operations**: Spend spike and CPC checks are async
2. **Database Queries**: Indexed tables for efficient lookups
3. **Batch Processing**: Can handle multiple agents/metrics
4. **Caching**: Uses cached agent stats where available

## Testing Coverage

- ✓ Valid metric verification
- ✓ ROAS anomaly detection
- ✓ Conversion rate detection
- ✓ Data consistency checks
- ✓ Risk score calculation
- ✓ Error handling
- ✓ Platform thresholds
- ✓ Threshold adjustment

Run tests with:
```bash
npm test -- fraud-detection.service.spec.ts
npm test -- fraud-detection.service.spec.ts --coverage
```

## Security Features

1. **Admin-Only Actions**: Threshold adjustments require admin verification
2. **Audit Trail**: Every action logged with admin ID and timestamp
3. **Data Isolation**: Per-agent data separation
4. **Compliance**: Full historical record for regulatory requirements

## Integration Points

### Before Publishing Metrics

```typescript
// In PerformanceSyncService
const fraudCheck = await fraudDetectionService.verify(agentId, platform, metrics);
if (!fraudCheck.passed) {
  // Block publication
}
```

### Before Updating Agent Profile

```typescript
// Fraud risk score automatically updated after verification
// Visible in agent marketplace profile
```

### Admin Dashboard

```typescript
// Show high-risk agents
const agents = await adminService.getHighRiskAgents(0.5);

// Get fraud statistics
const stats = await adminService.getFraudStatistics();
```

## Future Enhancements

1. **Machine Learning**: ML-based anomaly detection
2. **Behavioral Analysis**: Track individual agent patterns
3. **Network Analysis**: Detect coordinated fraud
4. **Real-time Alerts**: WebSocket notifications
5. **Custom Rules**: Per-workspace rules
6. **External Integration**: Connect to fraud detection APIs

## Migration Checklist

Before deploying to production:

- [ ] Run database migration: `1712350000000-AddFraudDetectionAudit.ts`
- [ ] Update AgentsModule imports and providers
- [ ] Deploy FraudDetectionService and FraudDetectionAdminService
- [ ] Test with sample metrics in each platform
- [ ] Configure admin endpoints for fraud review
- [ ] Set up monitoring and alerts
- [ ] Train admins on false positive marking
- [ ] Document threshold values for your market

## Configuration

Default thresholds are production-ready but can be adjusted:

```typescript
// Per platform
service.setPlatformThresholds('meta', {
  maxRoas: 20,
  maxConversionRate: 18,
  // ...
});

// Runtime adjustment (admin only)
await adminService.adjustThresholds('meta', newThresholds, adminId);
```

## Monitoring

Key metrics to monitor:

1. Average fraud risk score
2. Critical findings rate
3. False positive rate
4. Admin review backlog
5. High-risk agent count

## Support

For questions or issues:

- See `FRAUD_DETECTION_GUIDE.md` for detailed documentation
- Review `fraud-detection.examples.ts` for usage patterns
- Check test file for implementation examples
- Review GitHub issues tagged with `fraud-detection`

---

**Status**: Production-Ready ✓

All components are fully implemented, tested, documented, and ready for integration with the PerformanceSyncService and Performa marketplace.
