# CertificationService Quick Start Guide

Get the CertificationService up and running in 5 minutes.

## Step 1: Verify Module Integration

The service is already integrated into `AgentsModule`. Verify in `agents.module.ts`:

```typescript
// Should already have these imports
import { AgentCertification } from './entities/agent-certification.entity';
import { MarketplaceCertification } from './entities/marketplace-certification.entity';
import { CertificationService } from './services/certification.service';
import { CertificationController } from './services/certification.controller';

// Should have these in TypeOrmModule.forFeature()
AgentCertification,
MarketplaceCertification,

// Should have these providers/controllers
controllers: [AgentsController, CertificationController],
providers: [AgentsService, CertificationService],
exports: [AgentsService, CertificationService],
```

✓ **Status**: Already done

## Step 2: Run Database Migrations

```bash
# Generate migration (if not auto-generated)
npm run migration:generate -- AddCertificationSupport

# Run migrations
npm run migration:run
```

Or manually create these tables:

```sql
-- marketplace_certifications table
CREATE TABLE marketplace_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  issuer VARCHAR(255),
  icon_url VARCHAR(2048),
  badge_color VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- agent_certifications table
CREATE TABLE agent_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_profile_id UUID NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
  certification_id UUID NOT NULL REFERENCES marketplace_certifications(id) ON DELETE CASCADE,
  proof_url VARCHAR(2048),
  verified BOOLEAN DEFAULT false,
  verification_status VARCHAR(50) DEFAULT 'pending_review',
  verified_at TIMESTAMP,
  verified_by VARCHAR(255),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Update agent_profiles table
ALTER TABLE agent_profiles 
ADD COLUMN certification_level VARCHAR(50) DEFAULT 'unverified',
ADD COLUMN verification_level_updated_at TIMESTAMP,
ADD COLUMN verified_by_admin VARCHAR(255);

-- Create indexes for performance
CREATE INDEX idx_agent_certs_agent_status 
  ON agent_certifications(agent_profile_id, verification_status);
CREATE INDEX idx_agent_certs_cert_verified 
  ON agent_certifications(certification_id, verified);
CREATE INDEX idx_marketplace_certs_slug 
  ON marketplace_certifications(slug, is_active);
```

## Step 3: Initialize Default Certifications

Add to your app's initialization (e.g., `main.ts` or `app.module.ts`):

```typescript
import { CertificationService } from './agents/services/certification.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Initialize default certifications
  const certService = app.get(CertificationService);
  await certService.initializeDefaultCertifications();
  
  await app.listen(3000);
}

bootstrap();
```

Or in app initialization hook:

```typescript
@Injectable()
export class AppInitService {
  constructor(private certService: CertificationService) {}
  
  async onModuleInit() {
    await this.certService.initializeDefaultCertifications();
  }
}
```

## Step 4: Test the Service

### Run Unit Tests
```bash
npm run test -- certification.service.spec.ts
npm run test:cov -- certification.service.spec.ts
```

### Manual Test

```bash
# Start your API
npm run start:dev

# In another terminal, test endpoints
curl http://localhost:3000/certifications

# Should return:
[
  {
    "id": "...",
    "name": "Google Partner",
    "slug": "google-partner",
    "issuer": "Google",
    "badgeColor": "#4285F4",
    "isActive": true
  },
  // ... more certs
]
```

## Step 5: Verify Integration

Test the full workflow:

```bash
# 1. Get certifications
curl http://localhost:3000/certifications

# 2. Add certification to agent
curl -X POST http://localhost:3000/certifications/{certId}/agents/{agentId} \
  -H "Content-Type: application/json" \
  -d '{
    "proofUrl": "https://example.com/certificate.png"
  }'

# 3. Get agent certifications
curl http://localhost:3000/agents/{agentId}/certifications

# 4. Admin gets pending (requires auth)
curl http://localhost:3000/certifications/admin/pending

# 5. Admin verifies (requires auth and admin role)
curl -X PATCH http://localhost:3000/agents/{agentId}/certifications/{certId}/verify \
  -H "Content-Type: application/json" \
  -d '{
    "verified": true,
    "expiresAt": "2026-12-31T23:59:59Z"
  }'
```

## Step 6: Configure Authorization (Optional)

Add auth guards to admin endpoints in `certification.controller.ts`:

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Post()
@UseGuards(JwtAuthGuard, AdminGuard)
async createCertification(
  @Body() data: CreateCertificationDTO,
  @Request() req: any,
): Promise<CertificationDetailDTO> {
  return this.certService.createCertification(data);
}

@Patch('agents/:agentId/:certId/verify')
@UseGuards(JwtAuthGuard, AdminGuard)
async verifyCertification(
  @Param('agentId') agentId: string,
  @Param('certId') certId: string,
  @Body() data: VerifyCertificationDTO,
  @Request() req: any,
): Promise<AgentCertificationDetailDTO> {
  return this.certService.verifyCertification(certId, data, req.user.id);
}
```

## Step 7: Set Up Scheduled Cleanup (Optional)

Create a scheduled task for expired certifications:

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CertificationService } from './certification.service';

@Injectable()
export class CertificationMaintenanceService {
  constructor(private certService: CertificationService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpired(): Promise<void> {
    const cleaned = await this.certService.cleanupExpiredCertifications();
    console.log(`Cleaned up ${cleaned} expired certifications`);
  }
}
```

Add to your module:
```typescript
@Module({
  providers: [CertificationMaintenanceService],
})
export class ScheduleModule {}
```

## Usage Examples

### Get All Certifications
```typescript
const certs = await certService.getCertificationsList();
console.log(certs); // Array of CertificationDetailDTO
```

### Agent Adds Certification
```typescript
const agentCert = await certService.addCertificationToAgent(
  'agent-uuid-123',
  'google-partner-cert-uuid',
  'https://example.com/certificate.png'
);
console.log(agentCert.verificationStatus); // 'pending_review'
```

### Admin Reviews Pending
```typescript
const { items, total } = await certService.getPendingCertifications(50, 0);
console.log(`${items.length} of ${total} certifications pending review`);
```

### Admin Approves
```typescript
const verified = await certService.verifyCertification(
  'agent-cert-uuid',
  { verified: true, expiresAt: new Date('2026-12-31') },
  'admin-uuid'
);
console.log(verified.verificationStatus); // 'approved'
```

### Get Agent Certifications
```typescript
const agentCerts = await certService.getUserCertifications('agent-uuid');
console.log(agentCerts); // Array of agent's certifications
```

### Search by Certification
```typescript
const agents = await certService.searchByAgentCertification(
  'google-partner-cert-id',
  'approved'
);
console.log(agents.length); // Count of verified agents
```

## Common Issues

### Issue: `AgentCertification` entity not found
**Solution**: Ensure `AgentCertification` is imported in `agents.module.ts`:
```typescript
import { AgentCertification } from './entities/agent-certification.entity';
```

### Issue: Certification level not updating
**Solution**: Make sure `updateCertificationLevel()` is called after certification changes (happens automatically in the service).

### Issue: Admin endpoints returning 401 Unauthorized
**Solution**: 
1. Ensure you have auth guards configured (step 6)
2. Include valid JWT token in request headers
3. Verify user has admin role

### Issue: Expired certifications not cleaning up
**Solution**: 
1. Ensure `cleanupExpiredCertifications()` is called
2. Either manually call it or set up scheduled task (step 7)
3. Check that expiration dates are in the past

### Issue: Tests failing
**Solution**: 
1. Run `npm install` to install dependencies
2. Ensure TypeORM is installed
3. Check mock repositories are properly set up

## Next Steps

1. **Configure Authorization** - Add auth guards to admin endpoints
2. **Set Up Notifications** - Implement email/Slack notifications (optional)
3. **Configure Cleanup** - Set up scheduled expiration cleanup (optional)
4. **Monitor Metrics** - Track certification adoption and verification rates
5. **Custom Integrations** - Add external platform verification (future)

## API Reference

### Core Methods

| Method | Purpose |
|--------|---------|
| `getCertificationsList()` | Get all active certifications |
| `createCertification(data)` | Create new cert type (admin) |
| `addCertificationToAgent(agentId, certId, proofUrl?)` | Agent adds cert |
| `verifyCertification(certId, data, adminId)` | Admin verifies |
| `getUserCertifications(agentId)` | Get agent's certs |
| `updateCertificationLevel(agentId)` | Recalculate cert level |
| `getPendingCertifications(limit?, offset?)` | Get pending for review |
| `searchByAgentCertification(certId, status?)` | Find agents by cert |
| `getCertificationAuditTrail(certId)` | Get history |
| `cleanupExpiredCertifications()` | Process expired certs |

### Pre-Populated Certifications

1. Google Partner (#4285F4)
2. Meta Blueprint Certified (#1877F2)
3. Yandex Certified (#FF0000)
4. Performance Marketing Expert (#8B5CF6)
5. AI Agent Developer (#06B6D4)

## Documentation

- **API Docs**: `services/CERTIFICATION_SERVICE.md`
- **Integration Examples**: `services/certification.integration.ts`
- **Unit Tests**: `services/certification.service.spec.ts`
- **Services Guide**: `SERVICES_GUIDE.md`
- **Full Summary**: `CERTIFICATION_SERVICE_SUMMARY.md`

## Support

For detailed information:
1. Check `CERTIFICATION_SERVICE.md` in the services directory
2. Review integration examples in `certification.integration.ts`
3. Look at unit tests in `certification.service.spec.ts`
4. Consult `SERVICES_GUIDE.md` for all services

---

**Time to integrate**: ~15 minutes  
**Difficulty**: Easy  
**Status**: Ready for production
