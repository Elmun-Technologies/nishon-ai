# CertificationService Documentation

## Overview

The `CertificationService` manages the complete certification lifecycle for agents in the Performa marketplace. It handles:

- Certification type management (creation, retrieval)
- Agent self-declaration of certifications
- Admin verification workflow
- Automatic certification level calculation
- Expiration tracking and cleanup
- Audit trail management
- Search and filter capabilities

## Architecture

### Core Entities

1. **MarketplaceCertification** - Certification types available in the marketplace
   - name: Certification name (e.g., "Google Partner")
   - slug: URL-friendly identifier
   - description: Long-form description
   - issuer: Issuing organization (Google, Meta, etc.)
   - iconUrl: Badge icon URL
   - badgeColor: CSS color or gradient for badge display
   - isActive: Active/inactive status

2. **AgentCertification** - Agent's certification records
   - agentProfileId: Reference to agent
   - certificationId: Reference to certification type
   - proofUrl: URL to proof document (screenshot, certificate, etc.)
   - verified: Boolean flag (for quick queries)
   - verificationStatus: 'pending_review' | 'approved' | 'rejected'
   - verifiedAt: Timestamp of verification
   - verifiedBy: Admin ID who verified
   - expiresAt: Optional expiration date

3. **AgentProfile** - Updated with certification level
   - certificationLevel: 'unverified' | 'self_declared' | 'verified' | 'premium'
   - verificationLevelUpdatedAt: Last update timestamp
   - verifiedByAdmin: Admin who performed verification

## Pre-Populated Certifications

The service initializes with 5 certification types:

1. **Google Partner**
   - Issuer: Google
   - Slug: google-partner
   - Badge Color: #4285F4

2. **Meta Blueprint Certified**
   - Issuer: Meta
   - Slug: meta-blueprint-certified
   - Badge Color: #1877F2

3. **Yandex Certified**
   - Issuer: Yandex
   - Slug: yandex-certified
   - Badge Color: #FF0000

4. **Performance Marketing Expert**
   - Issuer: Performa
   - Slug: performance-marketing-expert
   - Badge Color: #8B5CF6

5. **AI Agent Developer**
   - Issuer: Performa
   - Slug: ai-agent-developer
   - Badge Color: #06B6D4

Initialize on startup:
```typescript
await certService.initializeDefaultCertifications();
```

## Certification Level Logic

### Level Calculation

- **unverified**: Agent has no certifications
- **self_declared**: Agent added certs (pending_review), none verified yet
- **verified**: Admin verified at least 1 certification
- **premium**: 2+ verified certifications AND pro member status

### Automatic Recalculation

The certification level is automatically recalculated whenever:
- Agent adds a certification
- Admin verifies/rejects a certification
- Certification is removed
- Expiration cleanup runs
- Pro membership status changes (manual trigger needed)

## Main Methods

### Certification Management (Admin)

#### getCertificationsList(includeStats?: boolean)
Get all active certifications with optional agent count statistics.

```typescript
// Without stats
const certs = await certService.getCertificationsList();

// With stats (includes agent count and verified count)
const certsWithStats = await certService.getCertificationsList(true);
```

#### createCertification(data: CreateCertificationDTO)
Create a new certification type (admin only).

```typescript
const newCert = await certService.createCertification({
  name: 'AWS Certified',
  slug: 'aws-certified',
  description: 'AWS certification for cloud expertise',
  issuer: 'AWS',
  iconUrl: 'https://cdn.example.com/aws.png',
  badgeColor: '#FF9900',
});
```

**Error Cases:**
- ConflictException: Certification slug already exists

### Agent Certification Workflow

#### addCertificationToAgent(agentId, certificationId, proofUrl?)
Agent self-declares a certification with optional proof URL.

```typescript
const agentCert = await certService.addCertificationToAgent(
  'agent-uuid',
  'certification-uuid',
  'https://example.com/certificate.png', // Optional proof
);

// Response includes:
// {
//   id: string;
//   certificationName: string;
//   verificationStatus: 'pending_review'; // Awaiting admin review
//   proofUrl: string | null;
//   createdAt: Date;
// }
```

**Error Cases:**
- NotFoundException: Agent or certification not found
- ConflictException: Agent already has this certification
- BadRequestException: Invalid proof URL format

**Side Effects:**
- Creates agent notification for admin review
- Recalculates agent's certification level

#### getUserCertifications(agentId)
Get all certifications for a specific agent.

```typescript
const certs = await certService.getUserCertifications('agent-uuid');

// Returns array of AgentCertificationDetailDTO with:
// - Certification metadata (name, issuer, icon, color)
// - Verification status
// - Expiration date
// - isExpired flag
```

#### getAgentCertification(agentCertId)
Get specific certification record with full details including audit trail.

```typescript
const cert = await certService.getAgentCertification('agent-cert-uuid');
```

### Admin Verification Workflow

#### verifyCertification(agentCertId, data, adminId)
Admin verifies or rejects an agent's certification.

```typescript
// Approve with optional expiration date
const verified = await certService.verifyCertification(
  'agent-cert-uuid',
  {
    verified: true,
    expiresAt: new Date('2026-12-31'), // Optional
  },
  'admin-uuid',
);

// Reject certification
const rejected = await certService.verifyCertification(
  'agent-cert-uuid',
  {
    verified: false,
    rejectionReason: 'Proof document is unclear', // For logging
  },
  'admin-uuid',
);
```

**Approval Effects:**
- Sets verificationStatus to 'approved'
- Records verification timestamp and admin ID
- Sends notification to agent
- Recalculates agent's certification level

**Rejection Effects:**
- Sets verificationStatus to 'rejected'
- Records rejection timestamp
- Sends notification to agent
- Keeps certification record (for audit trail)

**Error Cases:**
- NotFoundException: Agent certification not found
- BadRequestException: Expiration date is in the past

### Certification Level Management

#### updateCertificationLevel(agentId)
Manually trigger recalculation of agent's certification level.

```typescript
// Usually called automatically, but can be triggered manually
await certService.updateCertificationLevel('agent-uuid');

// Agent's certificationLevel in database is updated to:
// 'unverified' | 'self_declared' | 'verified' | 'premium'
```

This is automatically called after:
- Adding certification
- Verifying/rejecting certification
- Removing certification
- Cleanup of expired certifications

## Admin Features

### getPendingCertifications(limit?, offset?)
Get certifications awaiting admin review with pagination.

```typescript
const pending = await certService.getPendingCertifications(
  50, // limit per page
  0,  // offset
);

// Returns: { items: AgentCertificationDetailDTO[], total: number }
```

### searchByAgentCertification(certificationId, status?)
Search agents who have a specific certification.

```typescript
// Get all agents with verified Google Partner certification
const agents = await certService.searchByAgentCertification(
  'google-partner-cert-id',
  'approved', // optional: 'approved' | 'rejected' | 'pending_review'
);
```

### getCertificationAuditTrail(agentCertId)
Get complete audit trail for a certification.

```typescript
const trail = await certService.getCertificationAuditTrail('agent-cert-uuid');

// Returns:
// {
//   certificationId: string;
//   certificationName: string;
//   agentId: string;
//   status: 'pending_review' | 'approved' | 'rejected';
//   verifiedBy: string | null;
//   verifiedAt: Date | null;
//   expiresAt: Date | null;
//   createdAt: Date;
// }
```

### removeCertificationFromAgent(agentCertId)
Admin removes a certification from an agent (soft delete).

```typescript
await certService.removeCertificationFromAgent('agent-cert-uuid');

// Side effects:
// - Recalculates certification level
// - Logs removal action
```

### cleanupExpiredCertifications()
Find and process expired certifications. Should be run periodically via scheduled task.

```typescript
const cleaned = await certService.cleanupExpiredCertifications();
console.log(`Cleaned up ${cleaned} expired certifications`);

// Side effects:
// - Marks expired certs as unverified (verified: false)
// - Sets status back to 'pending_review'
// - Recalculates certification levels
```

## HTTP Endpoints

All endpoints are defined in `CertificationController`:

### Public Endpoints

```
GET  /certifications
     - List all active certifications
     - Query: stats=true (include counts)

GET  /certifications/:certId
     - Get certification details

GET  /agents/:agentId/certifications
     - Get agent's certifications (public profile)
```

### Agent Endpoints (authenticated)

```
POST /certifications/:certId/agents/:agentId
     - Agent adds certification
     - Body: { proofUrl?: string }

GET  /agents/:agentId/certifications/:certId
     - Get specific agent certification
```

### Admin Endpoints (admin auth required)

```
POST /certifications
     - Create new certification type
     - Body: CreateCertificationDTO

PATCH /agents/:agentId/certifications/:certId/verify
      - Admin verifies/rejects certification
      - Body: { verified: boolean, expiresAt?: Date }

DELETE /agents/:agentId/certifications/:certId
       - Remove certification from agent

GET  /certifications/admin/pending
     - Get pending certifications for review
     - Query: limit=50, offset=0

GET  /certifications/search/agents?certId=X&status=approved
     - Search agents by certification

GET  /certifications/audit/:certId
     - Get audit trail

POST /certifications/admin/cleanup-expired
     - Run expiration cleanup
     - Response: { cleaned: number }
```

## Verification Workflow Example

### Happy Path

1. **Agent adds certification**
   ```typescript
   const cert = await certService.addCertificationToAgent(
     'agent-123',
     'google-partner-cert-id',
     'https://example.com/google-certificate.png'
   );
   // Result: verificationStatus = 'pending_review'
   ```

2. **Admin reviews and approves**
   ```typescript
   const verified = await certService.verifyCertification(
     cert.id,
     { verified: true, expiresAt: new Date('2026-12-31') },
     'admin-456'
   );
   // Result: verificationStatus = 'approved', verified = true
   ```

3. **Agent gets certification badge**
   - Profile shows certification with badge
   - Certification level updated (e.g., 'unverified' → 'verified')
   - Badge displays on marketplace listing

4. **Optional: Expiration handling**
   ```typescript
   // Via scheduled cleanup task:
   const cleaned = await certService.cleanupExpiredCertifications();
   // Expired certs: verified = false, verificationStatus = 'pending_review'
   ```

## Error Handling

All methods follow consistent error handling:

```typescript
// NotFoundException
- Agent not found
- Certification not found
- Agent certification not found

// ConflictException
- Certification slug already exists
- Agent already has this certification

// BadRequestException
- Invalid proof URL format
- Expiration date in the past

// ForbiddenException (in controllers)
- User is not admin (for admin endpoints)
- User is not agent owner (for agent endpoints)
```

## Type Definitions

### DTOs

```typescript
// Input
CreateCertificationDTO {
  name: string;
  slug: string;
  description?: string;
  issuer: string;
  iconUrl?: string;
  badgeColor?: string;
}

AddCertificationDTO {
  certificationId: string;
  proofUrl?: string;
}

VerifyCertificationDTO {
  verified: boolean;
  expiresAt?: Date;
  rejectionReason?: string;
}

// Output
CertificationDetailDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  issuer: string;
  iconUrl: string;
  badgeColor: string;
  isActive: boolean;
  agentCount?: number;
  verifiedCount?: number;
}

AgentCertificationDetailDTO {
  id: string;
  certificationId: string;
  certificationName: string;
  certificationSlug: string;
  issuer: string;
  badgeColor: string;
  iconUrl: string;
  proofUrl: string | null;
  verified: boolean;
  verificationStatus: 'pending_review' | 'approved' | 'rejected';
  verifiedAt: Date | null;
  verifiedBy: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  isExpired: boolean;
}
```

## Logging

The service logs important events:

```
✓ Initialized certification: Google Partner
✓ Agent [uuid] added certification: Google Partner (pending review)
✓ Admin [uuid] approved certification Google Partner for agent [uuid]
✓ Admin [uuid] rejected certification Google Partner for agent [uuid]
✓ Updated certification level for agent [uuid]: verified
✓ Removed certification [uuid] from agent
✓ Cleaned up [N] expired certifications
✓ [NOTIFICATION] New certification pending review
✓ [NOTIFICATION] Certification APPROVED/REJECTED
```

## Future Enhancements

1. **Notification System** - Implement actual email/Slack notifications
   - When admin needs to review pending certifications
   - When agent's certification is approved/rejected
   - When certification is about to expire (30 days notice)

2. **Batch Operations**
   - Bulk verify certifications
   - Bulk import from CSV

3. **Analytics**
   - Certification adoption rates
   - Verification time metrics
   - Most common certifications

4. **Integration**
   - Direct API calls to issuing platforms (Google, Meta, Yandex)
   - Automatic verification via platform APIs
   - Webhook support for certification updates

5. **Advanced Filtering**
   - Search agents by multiple certifications
   - Filter by issuer, certification type, verification status
   - Geographic certification requirements

## Testing

Unit tests are provided in `certification.service.spec.ts`:

- ✓ getCertificationsList
- ✓ addCertificationToAgent
- ✓ verifyCertification
- ✓ getUserCertifications
- ✓ updateCertificationLevel
- ✓ createCertification
- ✓ getPendingCertifications
- ✓ cleanupExpiredCertifications
- ✓ Error cases for all methods

Run tests:
```bash
npm run test -- certification.service.spec.ts
```

## Performance Considerations

1. **Caching** - Consider caching certification list (rarely changes)
2. **Indexes** - Database indexes on:
   - agent_certifications(agentProfileId, verificationStatus)
   - agent_certifications(certificationId, verified)
   - marketplace_certifications(slug, isActive)

3. **Query Optimization** - Relations are eager-loaded only when needed
4. **Bulk Operations** - Use batch inserts for cleanup tasks

## Security Notes

1. **Admin-Only Operations**
   - Certification creation/deletion
   - Verification/rejection
   - Cleanup operations

2. **Agent Authorization**
   - Agents can only add/remove their own certifications
   - Cannot modify verification status
   - Cannot set expiration dates

3. **Audit Trail**
   - All verifications logged with admin ID and timestamp
   - Removal operations tracked
   - Audit trail is immutable (part of entity history)

## Database Migrations

If migrations aren't auto-generated, create:

```sql
-- Update agent_profiles table
ALTER TABLE agent_profiles 
ADD COLUMN certification_level VARCHAR(50) DEFAULT 'unverified',
ADD COLUMN verification_level_updated_at TIMESTAMP,
ADD COLUMN verified_by_admin VARCHAR(255);

-- Indexes for performance
CREATE INDEX idx_agent_certs_agent_status 
ON agent_certifications(agent_profile_id, verification_status);

CREATE INDEX idx_agent_certs_cert_verified 
ON agent_certifications(certification_id, verified);
```

## Support & Troubleshooting

### Issue: Certification level not updating
- Check if service method is being called after cert changes
- Verify agent exists in database
- Check database transaction isolation levels

### Issue: Expiration cleanup not running
- Ensure `cleanupExpiredCertifications()` is called periodically
- Consider using NestJS @Cron decorator for scheduled tasks

### Issue: Proof URL validation failing
- Ensure proofUrl is valid HTTP(S) URL
- Check URL length (max 2048 chars recommended)

## Contact

For questions or issues with CertificationService, contact the Performa API team.
