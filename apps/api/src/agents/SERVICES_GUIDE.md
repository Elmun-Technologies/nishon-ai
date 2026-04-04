# Agents Services Guide

Complete guide to all services in the Performa agent marketplace.

## Table of Contents

1. [CertificationService](#certificationservice)
2. [PerformanceSyncService](#performancesyncservice)
3. [MarketplaceSearchService](#marketplacesearchservice)
4. [FraudDetectionService](#frauddetectionservice)
5. [Integration Patterns](#integration-patterns)
6. [Best Practices](#best-practices)

---

## CertificationService

Manages agent certifications with verification workflow and level tracking.

### File Location
- Service: `/services/certification.service.ts` (26KB)
- Controller: `/services/certification.controller.ts` (8.7KB)
- Tests: `/services/certification.service.spec.ts` (16KB)
- Examples: `/services/certification.integration.ts` (13KB)
- Docs: `/services/CERTIFICATION_SERVICE.md` (16KB)

### Quick Facts
- **Entities**: `AgentCertification`, `MarketplaceCertification`, `AgentProfile`
- **Pre-Populated Types**: 5 (Google Partner, Meta Blueprint, Yandex, Performance Marketing Expert, AI Agent Developer)
- **Status Values**: pending_review, approved, rejected
- **Certification Levels**: unverified, self_declared, verified, premium

### Main API

```typescript
// Get all certifications
getCertificationsList(includeStats?: boolean): Promise<CertificationDetailDTO[]>

// Create new cert type (admin)
createCertification(data: CreateCertificationDTO): Promise<CertificationDetailDTO>

// Agent adds certification
addCertificationToAgent(
  agentId: string, 
  certificationId: string, 
  proofUrl?: string
): Promise<AgentCertificationDetailDTO>

// Admin verifies/rejects
verifyCertification(
  agentCertId: string, 
  data: VerifyCertificationDTO, 
  adminId: string
): Promise<AgentCertificationDetailDTO>

// Get agent's certifications
getUserCertifications(agentId: string): Promise<AgentCertificationDetailDTO[]>

// Auto-recalculate agent's cert level
updateCertificationLevel(agentId: string): Promise<void>

// Get pending reviews
getPendingCertifications(limit?: number, offset?: number)

// Search agents by cert
searchByAgentCertification(certId: string, status?: string)

// Get audit trail
getCertificationAuditTrail(agentCertId: string)

// Cleanup expired
cleanupExpiredCertifications(): Promise<number>
```

### REST Endpoints

```
# Public
GET    /certifications
GET    /certifications/:certId
GET    /agents/:agentId/certifications

# Agent (authenticated)
POST   /certifications/:certId/agents/:agentId
GET    /agents/:agentId/certifications/:certId

# Admin
POST   /certifications
PATCH  /agents/:agentId/certifications/:certId/verify
DELETE /agents/:agentId/certifications/:certId
GET    /certifications/admin/pending
GET    /certifications/search/agents?certId=X&status=approved
GET    /certifications/audit/:certId
POST   /certifications/admin/cleanup-expired
```

### Workflow Example

```typescript
// 1. Initialize on startup
await certService.initializeDefaultCertifications();

// 2. Agent adds certification
const cert = await certService.addCertificationToAgent(
  'agent-123',
  'google-partner-id',
  'https://example.com/certificate.png'
);
// Result: verificationStatus = 'pending_review'

// 3. Admin gets pending
const { items, total } = await certService.getPendingCertifications();

// 4. Admin approves
const verified = await certService.verifyCertification(
  cert.id,
  { verified: true, expiresAt: new Date('2026-12-31') },
  'admin-456'
);
// Result: verificationStatus = 'approved', agent level updated

// 5. Get agent's certs (for profile display)
const certs = await certService.getUserCertifications('agent-123');
// Returns only active/non-expired verified certs
```

### Error Handling

```typescript
try {
  await certService.addCertificationToAgent(agentId, certId, proofUrl);
} catch (error) {
  // NotFoundException - Agent or cert not found
  // ConflictException - Agent already has this cert
  // BadRequestException - Invalid proof URL
}
```

### Important Notes

- Certification levels auto-update on cert changes
- Levels: unverified → self_declared → verified → premium
- Expiration dates are optional
- Audit trail is immutable (for compliance)
- Admin notifications triggered on pending certs
- Agent notifications sent on verification result

---

## PerformanceSyncService

Synchronizes agent performance metrics from advertising platforms.

### File Location
- Service: `/services/performance-sync.service.ts` (20KB)
- Docs: `/services/PERFORMANCE_SYNC_SERVICE.md`
- Examples: `/services/performance-sync.integration-example.ts`

### Supported Platforms
- Google Ads
- Meta Ads (Facebook, Instagram)
- Yandex Direct
- TikTok Ads
- Telegram Ads

### Key Features
- Real-time metric synchronization
- Multi-platform aggregation
- Automatic data validation
- Performance history tracking
- Scheduled background jobs
- Fraud detection integration

### Main API

```typescript
// Sync single agent
syncAgentMetrics(agentId: string): Promise<AgentStats>

// Sync all agents
syncAllAgents(): Promise<SyncResult>

// Get cached stats
getAgentStats(agentId: string): Promise<AgentStats | null>

// Calculate derived metrics
calculateMetrics(agentId: string): Promise<AgentStats>

// Get sync logs
getSyncLogs(agentId: string, limit?: number): Promise<AgentPerformanceSyncLog[]>
```

### Metrics Tracked

```typescript
interface AgentStats {
  avgROAS: number;              // Return on Ad Spend
  avgCPA: number;               // Cost Per Acquisition
  avgCTR: number;               // Click-Through Rate
  totalCampaigns: number;
  activeCampaigns: number;
  successRate: number;          // % of successful campaigns
  totalSpendManaged: number;    // USD
  bestROAS: number;             // Highest ROAS achieved
}
```

### Scheduled Tasks

```typescript
// Automatic sync every 4 hours
@Cron('0 */4 * * *')
async handlePeriodicSync(): Promise<void>

// Cache refresh every 6 hours
@Cron('0 */6 * * *')
async refreshAgentStats(): Promise<void>

// Daily anomaly detection
@Cron('0 2 * * *')
async detectAnomalies(): Promise<void>
```

### Database Tables

```sql
-- Agent platform metrics
agent_platform_metrics: {
  agentProfileId UUID
  platformId VARCHAR        -- 'google', 'meta', 'yandex', etc.
  metricsData JSONB        -- Platform-specific metrics
  lastUpdated TIMESTAMP
}

-- Performance history
agent_historical_performance: {
  agentProfileId UUID
  year INT
  month INT
  metrics JSONB            -- Monthly aggregated metrics
}

-- Sync logs
agent_performance_sync_log: {
  agentProfileId UUID
  platformId VARCHAR
  status ENUM('success', 'failed', 'partial')
  syncedAt TIMESTAMP
  recordsCount INT
}
```

### Important Notes

- Synced data is cached in `agent_profiles.cached_stats`
- History kept for 12+ months
- Sync failures are logged but non-blocking
- Anomalies trigger fraud detection review
- Requires platform OAuth tokens

---

## MarketplaceSearchService

Advanced search and filtering for marketplace agent discovery.

### File Location
- Service: `/services/marketplace-search.service.ts` (30KB)

### Key Features
- Full-text search
- Multi-criteria filtering
- Relevance scoring
- Geographic filtering
- Performance-based sorting
- Pagination support

### Main API

```typescript
searchAgents(
  query: string,
  filters: MarketplaceFilters,
  options?: SearchOptions
): Promise<MarketplaceSearchResponse>

filterByPlatforms(platforms: string[]): Promise<AgentProfile[]>

filterByNiches(niches: string[]): Promise<AgentProfile[]>

filterByPricing(minRate: number, maxRate: number): Promise<AgentProfile[]>

getAvailableFilters(): Promise<AvailableFiltersResponse>
```

### Filter Types

```typescript
interface MarketplaceFilters {
  platforms?: string[];           // 'meta', 'google', 'yandex', 'tiktok'
  niches?: string[];              // 'E-commerce', 'SaaS', etc.
  certifications?: string[];       // 'google-partner', 'meta-blueprint'
  priceRange?: { min: number; max: number };
  rating?: { min: number; max: number };
  experience?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  location?: string;
  language?: string[];
  responseTime?: 'instant' | '1hour' | '4hours' | '1day';
  isVerified?: boolean;
  isPro?: boolean;
  isFeatured?: boolean;
}
```

### REST Endpoints

```
GET /agents/search
    ?q=google&platforms=meta,google&niches=ecommerce
    &priceMin=50&priceMax=500&sortBy=rating&limit=20&page=1

GET /agents/filters/available

GET /agents/categories/:category/recommended

GET /agents/:agentId/similar
```

### Database Indexes

```sql
-- For search performance
CREATE INDEX idx_agents_platforms ON agent_profiles USING GIN(platforms);
CREATE INDEX idx_agents_niches ON agent_profiles USING GIN(niches);
CREATE INDEX idx_agents_rating ON agent_profiles(cached_rating DESC);
CREATE INDEX idx_agents_featured ON agent_profiles(is_featured, cached_rating);
```

### Important Notes

- Search uses PostgreSQL full-text search for performance
- Filters use GIN indexes for array queries
- Results ranked by relevance + rating
- Caches popular searches
- Excludes unverified agents by default

---

## FraudDetectionService

Analyzes agent profiles for fraud indicators.

### File Location
- Service: `/services/fraud-detection.service.ts` (20KB)
- Admin Service: `/services/fraud-detection-admin.service.ts` (17KB)

### Key Features
- Performance anomaly detection
- Review authenticity analysis
- Certification validation
- Risk scoring
- Automated alerts
- Investigation tools

### Risk Score Calculation

```typescript
// Combines multiple factors (0-100)
riskScore = (
  performanceAnomalies * 30 +      // Sudden changes
  reviewAnomales * 25 +            // Suspicious reviews
  certificationIssues * 20 +       // Invalid certs
  accountBehavior * 15 +           // Unusual activity
  reportHistory * 10               // Previous reports
) / 100
```

### Alert Triggers

```
Risk Score >= 80   → CRITICAL (Immediate suspension)
Risk Score >= 60   → HIGH (Manual review)
Risk Score >= 40   → MEDIUM (Monitor)
Risk Score < 40    → LOW (Normal monitoring)
```

---

## Integration Patterns

### 1. Certification + Performance Flow

```typescript
// When agent adds certification
async addCertificationToAgent(agentId, certId, proofUrl) {
  const cert = await certService.addCertificationToAgent(agentId, certId, proofUrl);
  
  // Trigger performance sync
  await performanceService.syncAgentMetrics(agentId);
  
  // Run fraud check
  const riskScore = await fraudService.calculateRiskScore(agentId);
  
  // Update search index
  await searchService.updateAgentIndex(agentId);
  
  return cert;
}
```

### 2. Scheduled Maintenance Tasks

```typescript
// Daily maintenance
@Cron('0 2 * * *')  // 2 AM UTC
async dailyMaintenance() {
  // Clean up expired certs
  await certService.cleanupExpiredCertifications();
  
  // Sync all agent metrics
  await performanceService.syncAllAgents();
  
  // Detect fraud anomalies
  await fraudService.detectAnomalies();
  
  // Refresh search index
  await searchService.rebuildIndex();
}
```

### 3. Admin Dashboard Integration

```typescript
// Get admin overview
async getAdminDashboard() {
  const pending = await certService.getPendingCertifications();
  const alerts = await fraudService.getHighRiskAgents();
  const syncStatus = await performanceService.getSyncStatus();
  
  return {
    pendingCertifications: pending.total,
    highRiskAgents: alerts.length,
    syncStatus,
    recentActions: []
  };
}
```

---

## Best Practices

### Error Handling

```typescript
// Always handle specific errors
try {
  await certService.addCertificationToAgent(agentId, certId);
} catch (error) {
  if (error instanceof NotFoundException) {
    // Resource not found - 404
    return res.status(404).json({ message: error.message });
  } else if (error instanceof ConflictException) {
    // Conflict - 409
    return res.status(409).json({ message: error.message });
  } else if (error instanceof BadRequestException) {
    // Bad request - 400
    return res.status(400).json({ message: error.message });
  } else {
    // Unexpected error
    logger.error('Unexpected error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
```

### Validation

```typescript
// Validate inputs before service calls
if (!agentId || !agentId.match(UUID_REGEX)) {
  throw new BadRequestException('Invalid agent ID');
}

if (proofUrl && !isValidUrl(proofUrl)) {
  throw new BadRequestException('Invalid proof URL');
}

if (expiresAt && new Date(expiresAt) <= new Date()) {
  throw new BadRequestException('Expiration date must be in the future');
}
```

### Logging

```typescript
// Log important operations
logger.log(`Agent ${agentId} added certification ${certId}`);
logger.warn(`Certification sync failed for agent ${agentId}`);
logger.error(`Fraud detection error: ${error.message}`, error.stack);
```

### Performance

```typescript
// Use pagination for large result sets
const { items, total } = await certService.getPendingCertifications(
  50,  // limit
  0    // offset
);

// Cache frequently accessed data
const certs = await cache.get('certifications') || 
  await certService.getCertificationsList();

// Batch operations when possible
const syncResults = await Promise.all(
  agentIds.map(id => performanceService.syncAgentMetrics(id))
);
```

### Testing

```typescript
// Test error cases
it('should throw NotFoundException when agent not found', async () => {
  jest.spyOn(agentRepo, 'findOne').mockResolvedValue(null);
  await expect(
    certService.addCertificationToAgent('invalid-id', certId)
  ).rejects.toThrow(NotFoundException);
});

// Test side effects
it('should update certification level', async () => {
  await certService.addCertificationToAgent(agentId, certId);
  const level = await agentRepo.getCertificationLevel(agentId);
  expect(level).toBe('self_declared');
});
```

### Security

```typescript
// Always verify authorization
if (req.user.id !== agentId && !req.user.isAdmin) {
  throw new ForbiddenException('Unauthorized');
}

// Sanitize inputs
const slug = sanitize(data.slug).toLowerCase();

// Use parameterized queries
// TypeORM handles this automatically

// Log security events
logger.warn(`Unauthorized access attempt: ${req.ip} → ${resource}`);
```

---

## Database Schema

### Complete ER Diagram

```
agent_profiles
├── id (PK)
├── slug (UNIQUE)
├── agent_type (human/ai)
├── owner_id (FK → users)
├── display_name
├── title
├── certification_level ← UPDATED BY CertificationService
├── cached_stats (JSON) ← UPDATED BY PerformanceSyncService
├── cached_rating
├── is_verified
├── is_pro_member
└── [other fields]

marketplace_certifications (1:M → agent_certifications)
├── id (PK)
├── name (UNIQUE)
├── slug (UNIQUE)
├── issuer
├── badge_color
├── is_active
└── [metadata]

agent_certifications (M:N bridge)
├── id (PK)
├── agent_profile_id (FK)
├── certification_id (FK)
├── proof_url
├── verified
├── verification_status
├── verified_at
├── verified_by
├── expires_at
└── created_at

agent_platform_metrics
├── agent_profile_id (FK)
├── platform_id
├── metrics_data (JSON)
└── last_updated

agent_historical_performance
├── agent_profile_id (FK)
├── year
├── month
└── metrics (JSON)
```

---

## Troubleshooting

### Issue: Certification level not updating
**Solution**: Ensure `updateCertificationLevel()` is called after cert changes.

### Issue: Performance sync failing
**Solution**: Check platform API tokens in `connected_accounts` table.

### Issue: Search returning no results
**Solution**: Verify agent is published (`is_published = true`) and indexes are built.

### Issue: Fraud detection false positives
**Solution**: Review and adjust risk score thresholds in config.

---

## Further Reading

- [CertificationService Documentation](./services/CERTIFICATION_SERVICE.md)
- [Certification Integration Examples](./services/certification.integration.ts)
- [Unit Tests](./services/certification.service.spec.ts)
- [Performance Sync Documentation](./services/PERFORMANCE_SYNC_SERVICE.md)

---

## Support

For issues or questions:
1. Check relevant service documentation
2. Review integration examples
3. Check unit tests for usage patterns
4. Contact Performa API team

Last Updated: 2026-04-04
