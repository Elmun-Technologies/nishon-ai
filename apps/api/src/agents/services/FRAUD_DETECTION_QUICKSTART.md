# Fraud Detection Service - Quick Start

## Installation & Setup (5 minutes)

### 1. Run Database Migration

```bash
npm run typeorm migration:run
```

This creates the `fraud_detection_audits` table.

### 2. Verify Module Configuration

The `AgentsModule` is already configured. No additional setup needed.

### 3. Start Using the Service

## Basic Usage (Copy-Paste Ready)

### Verify Metrics Before Publishing

```typescript
import { FraudDetectionService } from './services/fraud-detection.service';

// In your PerformanceSyncService
constructor(private fraudDetection: FraudDetectionService) {}

async syncMetrics(agentId: string, platform: string, metrics) {
  // Verify metrics
  const result = await this.fraudDetection.verify(agentId, platform, metrics);

  // Handle critical issues
  if (!result.passed) {
    throw new BadRequestException(`Fraud detected: ${result.reason}`);
  }

  // Log warnings
  if (result.failedChecks.length > 0) {
    this.logger.warn(`Warnings for agent ${agentId}:`);
    result.failedChecks.forEach(check => {
      this.logger.warn(`  - ${check.rule}: ${check.message}`);
    });
  }

  // Safe to save metrics
  return await this.saveMetrics(agentId, platform, metrics);
}
```

### Get Agent Fraud Status

```typescript
import { FraudDetectionService, FraudDetectionAdminService } from './services';

constructor(
  private fraudDetection: FraudDetectionService,
  private adminService: FraudDetectionAdminService,
) {}

// Get current risk score
const riskScore = await this.fraudDetection.getFraudRiskScore(agentId);
console.log(`Agent risk: ${(riskScore * 100).toFixed(1)}%`);

// Get detailed analysis
const analysis = await this.adminService.analyzeFraudRisk(agentId);
console.log(`Risk trend: ${analysis.trends.riskTrend}`);
console.log(`Top issues: ${analysis.topFailedRules.map(r => r.rule).join(', ')}`);
```

### Admin Approval Workflow

```typescript
// Get agents needing review
const highRiskAgents = await this.adminService.getHighRiskAgents(0.7);

// Review metrics
const audits = await this.adminService.getAuditHistory(agentId, 30);

// Approve metrics
await this.adminService.approveMetrics(metricId, adminId, 'Verified');

// Or reject if suspicious
await this.adminService.rejectMetrics(
  metricId,
  adminId,
  'Data inconsistent with source'
);

// Mark false positive to improve algorithm
await this.adminService.reviewFraudAudit(
  auditId,
  {
    action: 'mark_false_positive',
    rule: 'roas_anomaly',
  },
  adminId,
  'Legitimate high ROAS during launch'
);
```

## Common Scenarios

### Scenario 1: High ROAS Warning

**Problem**: Agent reports 18 ROAS (threshold: 15)

**Detection**: `roas_anomaly` warning (severity: WARNING)

**Action**: 
- Review the campaign details
- If legitimate (seasonal event, new product launch): Mark as false positive
- If suspicious: Reject and request documentation

**Code**:
```typescript
if (result.failedChecks.some(c => c.rule === 'roas_anomaly')) {
  // Request manual review
  await this.notifyAdmins(`High ROAS for agent ${agentId}`);
}
```

### Scenario 2: Conversion Rate Too High

**Problem**: 25% conversion rate (threshold: 15%)

**Detection**: `conversion_rate` check (severity: CRITICAL)

**Action**: Block publication and investigate

**Code**:
```typescript
if (result.failedChecks.some(c => c.severity === 'critical')) {
  throw new BadRequestException('Critical fraud indicators detected');
}
```

### Scenario 3: Spend Spike

**Problem**: 80% MoM increase (threshold: 50%)

**Detection**: `spend_spike` warning

**Action**: Flag for review but allow publication if other checks pass

**Code**:
```typescript
const warnings = result.failedChecks.filter(c => c.severity === 'warning');
if (warnings.length > 0) {
  // Log for admin review
  await this.createFlagForReview(agentId, warnings);
}
```

## Configuration

### Adjust Thresholds (Admin Only)

```typescript
// Make detection more strict for certain markets
await this.adminService.adjustThresholds('meta', {
  maxRoas: 12,          // Lower from 15
  maxConversionRate: 10, // Lower from 15
}, adminId);

// Make detection more lenient for high-growth accounts
await this.adminService.adjustThresholds('google', {
  maxRoas: 20,
  maxConversionRate: 20,
}, adminId);
```

### Get Current Thresholds

```typescript
const thresholds = this.fraudDetection.getPlatformThresholds('meta');
console.log(`Max ROAS for Meta: ${thresholds.maxRoas}`);
console.log(`Max conversion rate: ${thresholds.maxConversionRate}%`);
```

## Monitoring Dashboard

### Show High-Risk Agents

```typescript
const agents = await this.adminService.getHighRiskAgents(0.5);
// Returns agents with riskScore >= 0.5

agents.forEach(agent => {
  console.log(`${agent.displayName}: ${(agent.fraudRiskScore * 100).toFixed(1)}%`);
});
```

### Get Summary Statistics

```typescript
const stats = await this.adminService.getFraudStatistics();

console.log('Fraud Detection Summary:');
console.log(`  Total agents: ${stats.totalAgents}`);
console.log(`  High-risk agents: ${stats.highRiskAgents}`);
console.log(`  Average risk score: ${(stats.averageRiskScore * 100).toFixed(1)}%`);
console.log(`  Critical issues (7d): ${stats.recentCriticalIssues}`);
console.log(`  Total audits: ${stats.totalAudits}`);
```

## Testing

### Run Tests

```bash
npm test -- fraud-detection.service.spec.ts
npm test -- fraud-detection.service.spec.ts --coverage
```

### Manual Testing

```typescript
// Test ROAS detection
const result = await fraudDetection.verify(agentId, 'meta', {
  platform: 'meta',
  totalSpend: 5000,
  campaignsCount: 10,
  avgRoas: 20,  // Above threshold
  avgCpa: 8,
  avgCtr: 2.5,
  conversionCount: 100,
  totalRevenue: 100000,
});

console.log(result.passed);           // false
console.log(result.riskScore);        // > 0.8
console.log(result.failedChecks[0]);  // roas_anomaly
```

## Troubleshooting

### "Agent not found" Error

```typescript
// Make sure agent exists in database
const agent = await agentProfileRepo.findOne({ where: { id: agentId } });
if (!agent) {
  throw new NotFoundException(`Agent ${agentId} not found`);
}
```

### High False Positive Rate

1. Review marked false positives:
   ```typescript
   const audits = await adminService.getAuditHistory(agentId);
   const falsePositives = audits.filter(a => a.action === 'marked_false_positive');
   ```

2. Identify pattern in false positives

3. Adjust thresholds if needed:
   ```typescript
   await adminService.adjustThresholds(platform, newThresholds, adminId);
   ```

### Audit Trail Not Updating

1. Check migration ran: `SELECT * FROM fraud_detection_audits;`
2. Verify module imports `FraudDetectionAudit`
3. Check database logs for errors

## API Endpoints (Example)

```typescript
// GET /admin/agents/:agentId/fraud-status
@Get('agents/:agentId/fraud-status')
async getFraudStatus(@Param('agentId') agentId: string) {
  const analysis = await this.adminService.analyzeFraudRisk(agentId);
  return {
    agentId,
    riskScore: analysis.currentRiskScore,
    trends: analysis.trends,
    topIssues: analysis.topFailedRules.slice(0, 3),
  };
}

// POST /admin/audits/:auditId/approve
@Post('audits/:auditId/approve')
async approveAudit(
  @Param('auditId') auditId: string,
  @Body() body: { comment?: string },
  @User() user,
) {
  await this.adminService.reviewFraudAudit(
    auditId,
    { action: 'approve', comment: body.comment },
    user.id
  );
  return { status: 'approved' };
}

// GET /admin/fraud-statistics
@Get('fraud-statistics')
async getStatistics() {
  return this.adminService.getFraudStatistics();
}

// GET /admin/high-risk-agents
@Get('high-risk-agents')
async getHighRiskAgents(@Query('threshold') threshold = 0.5) {
  return this.adminService.getHighRiskAgents(threshold, 50);
}
```

## Next Steps

1. **Integrate with PerformanceSyncService** (15 min)
   - Add fraud check before saving metrics
   - Handle critical issues appropriately

2. **Create Admin Endpoints** (30 min)
   - Review flagged metrics
   - Approve/reject interface
   - Threshold adjustment endpoints

3. **Set Up Alerts** (20 min)
   - Slack notifications for high-risk agents
   - Email alerts for critical issues
   - Dashboard monitoring

4. **Train Admins** (30 min)
   - How to review flagged metrics
   - How to mark false positives
   - When to adjust thresholds

## Documentation Reference

- **FRAUD_DETECTION_GUIDE.md** - Complete developer guide
- **FRAUD_DETECTION_API.md** - Full API reference
- **fraud-detection.examples.ts** - 10 practical examples
- **fraud-detection.service.spec.ts** - Test examples

## Support

For questions:
1. Check the documentation files
2. Review test examples
3. Check example patterns file
4. Refer to inline code comments

## Production Checklist

- [ ] Database migration ran successfully
- [ ] Services deployed and working
- [ ] Integration with PerformanceSyncService complete
- [ ] Admin endpoints created
- [ ] Alerts configured
- [ ] Admins trained
- [ ] Thresholds tuned for your market
- [ ] Monitoring dashboard set up
- [ ] Compliance logging verified
- [ ] Performance tested under load

That's it! You're ready to go.
