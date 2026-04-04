# MarketplaceController - Service Implementation Guide

This guide provides templates and instructions for implementing the services required by the MarketplaceController.

## 1. Service Architecture

The MarketplaceController depends on 5 main services:

```
MarketplaceController
├── MarketplaceSearchService       (Search, filters, discovery)
├── MarketplaceProfileService      (Create, update specialist profiles)
├── MarketplacePerformanceService  (Analytics, syncing)
├── MarketplaceContactService      (Contact inquiries)
└── MarketplaceAdminService        (Admin operations)
```

---

## 2. Entity Models Needed

### A. SpecialistCaseStudy Entity

```typescript
// File: /src/agents/entities/specialist-case-study.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { AgentProfile } from "./agent-profile.entity";

@Entity("specialist_case_studies")
export class SpecialistCaseStudy {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", name: "specialist_id" })
  specialistId: string;

  @ManyToOne(() => AgentProfile, { onDelete: "CASCADE" })
  @JoinColumn({ name: "specialist_id" })
  specialist: AgentProfile;

  @Column({ type: "varchar", length: 200 })
  title: string;

  @Column({ type: "varchar", length: 100 })
  industry: string;

  @Column({ type: "varchar", length: 50 })
  platform: string; // meta, google, yandex, tiktok, etc.

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "jsonb", nullable: true })
  metrics: Record<string, any> | null; // { roas, cpa, ctr, spend, revenue, etc. }

  @Column({ type: "simple-array", nullable: true })
  images: string[] | null; // Image URLs

  @Column({ type: "varchar", length: 500, nullable: true })
  proofUrl: string | null; // Link to proof/documentation

  @Column({
    type: "varchar",
    length: 20,
    default: "pending_review",
    name: "verification_status",
  })
  verificationStatus: "pending_review" | "approved" | "rejected";

  @Column({
    type: "varchar",
    length: 20,
    default: "low",
    name: "fraud_risk_level",
  })
  fraudRiskLevel: "low" | "medium" | "high";

  @Column({ type: "text", nullable: true, name: "verification_notes" })
  verificationNotes: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
```

### B. SpecialistCertification Entity

```typescript
// File: /src/agents/entities/specialist-certification.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { AgentProfile } from "./agent-profile.entity";

export type CertificationStatus = "pending" | "verified" | "rejected" | "expired";

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  description?: string;
  icon?: string;
  badge?: string;
}

@Entity("specialist_certifications")
export class SpecialistCertification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", name: "specialist_id" })
  specialistId: string;

  @ManyToOne(() => AgentProfile, { onDelete: "CASCADE" })
  @JoinColumn({ name: "specialist_id" })
  specialist: AgentProfile;

  @Column({ type: "varchar", length: 150 })
  certificationId: string; // Reference to certification type

  @Column({ type: "varchar", length: 200 })
  name: string;

  @Column({ type: "varchar", length: 200 })
  issuer: string;

  @Column({
    type: "varchar",
    length: 20,
    default: "pending",
    name: "verification_status",
  })
  verificationStatus: CertificationStatus;

  @Column({ type: "timestamp", nullable: true, name: "issued_at" })
  issuedAt: Date | null;

  @Column({ type: "timestamp", nullable: true, name: "expires_at" })
  expiresAt: Date | null;

  @Column({ type: "text", nullable: true, name: "verification_notes" })
  verificationNotes: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
```

### C. SpecialistPerformanceSyncLog Entity

```typescript
// File: /src/agents/entities/specialist-performance-sync-log.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { AgentProfile } from "./agent-profile.entity";

export type SyncStatus = "pending" | "in_progress" | "completed" | "failed";

@Entity("specialist_performance_sync_logs")
export class SpecialistPerformanceSyncLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", name: "specialist_id" })
  specialistId: string;

  @ManyToOne(() => AgentProfile, { onDelete: "CASCADE" })
  @JoinColumn({ name: "specialist_id" })
  specialist: AgentProfile;

  @Column({ type: "varchar", length: 50 })
  platform: string; // meta, google, yandex

  @Column({
    type: "varchar",
    length: 20,
    default: "pending",
  })
  status: SyncStatus;

  @Column({ type: "timestamp", nullable: true, name: "started_at" })
  startedAt: Date | null;

  @Column({ type: "timestamp", nullable: true, name: "completed_at" })
  completedAt: Date | null;

  @Column({ type: "timestamp", nullable: true, name: "next_sync_at" })
  nextSyncAt: Date | null;

  @Column({ type: "integer", default: 0, name: "record_count" })
  recordCount: number;

  @Column({ type: "simple-array", nullable: true })
  errors: string[] | null;

  @Column({ type: "text", nullable: true })
  responseData: string | null; // Raw response for debugging

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
```

### D. SpecialistAnalytics Entity

```typescript
// File: /src/agents/entities/specialist-analytics.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { AgentProfile } from "./agent-profile.entity";

@Entity("specialist_analytics")
export class SpecialistAnalytics {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", name: "specialist_id" })
  specialistId: string;

  @ManyToOne(() => AgentProfile, { onDelete: "CASCADE" })
  @JoinColumn({ name: "specialist_id" })
  specialist: AgentProfile;

  @Column({ type: "date" })
  date: Date; // One record per day

  @Column({ type: "integer", default: 0, name: "profile_views" })
  profileViews: number;

  @Column({ type: "integer", default: 0 })
  impressions: number;

  @Column({ type: "integer", default: 0 })
  contacts: number;

  @Column({ type: "decimal", precision: 5, scale: 2, default: 0 })
  engagement: number; // percentage

  @Column({ type: "decimal", precision: 5, scale: 2, default: 0 })
  conversion: number; // percentage (hires/contacts)

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
```

### E. SpecialistContact Entity

```typescript
// File: /src/agents/entities/specialist-contact.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { AgentProfile } from "./agent-profile.entity";
import { User } from "../../users/entities/user.entity";

export type ContactStatus = "new" | "read" | "responded" | "spam";

@Entity("specialist_contacts")
export class SpecialistContact {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", name: "specialist_id" })
  specialistId: string;

  @ManyToOne(() => AgentProfile, { onDelete: "CASCADE" })
  @JoinColumn({ name: "specialist_id" })
  specialist: AgentProfile;

  @Column({ type: "varchar", nullable: true, name: "user_id" })
  userId: string | null; // null if anonymous

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "user_id" })
  user: User | null;

  @Column({ type: "varchar", length: 255 })
  email: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  phone: string | null;

  @Column({ type: "text" })
  message: string;

  @Column({
    type: "varchar",
    length: 20,
    default: "email",
    name: "preferred_contact_method",
  })
  preferredContactMethod: "email" | "phone" | "message";

  @Column({
    type: "varchar",
    length: 20,
    default: "new",
  })
  status: ContactStatus;

  @Column({ type: "text", nullable: true, name: "specialist_response" })
  specialistResponse: string | null;

  @Column({ type: "timestamp", nullable: true, name: "responded_at" })
  respondedAt: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
```

---

## 3. Service Template: MarketplaceSearchService

```typescript
// File: /src/agents/services/marketplace-search.service.ts

import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AgentProfile } from "../entities/agent-profile.entity";

@Injectable()
export class MarketplaceSearchService {
  private readonly logger = new Logger(MarketplaceSearchService.name);

  constructor(
    @InjectRepository(AgentProfile)
    private readonly agentProfileRepository: Repository<AgentProfile>,
  ) {}

  /**
   * Search specialists with filtering and pagination
   */
  async searchSpecialists(query: {
    query?: string;
    platforms?: string[];
    niches?: string[];
    certifications?: string[];
    languages?: string[];
    countries?: string[];
    minRating?: number;
    minExperience?: number;
    minRoas?: number;
    sortBy?: string;
    page?: number;
    pageSize?: number;
  }) {
    // TODO: Implement search logic
    // 1. Build query with filters
    // 2. Apply sorting
    // 3. Apply pagination
    // 4. Calculate available filters
    // 5. Return results

    throw new Error("Not implemented");
  }

  /**
   * Get available filters for marketplace
   */
  async getAvailableFilters() {
    // TODO: Implement
    // 1. Query unique platforms, niches, certifications, languages, countries
    // 2. Define price ranges
    // 3. Define experience levels
    // 4. Return filters object

    throw new Error("Not implemented");
  }

  /**
   * Get complete specialist profile by slug
   */
  async getSpecialistDetail(slug: string) {
    if (!slug) {
      throw new Error("Slug is required");
    }

    const specialist = await this.agentProfileRepository.findOne({
      where: { slug },
      relations: [
        "owner",
        // TODO: Add relations for:
        // - caseStudies
        // - certifications
        // - languages
        // - geographicCoverage
      ],
    });

    if (!specialist) {
      throw new NotFoundException(`Specialist with slug "${slug}" not found`);
    }

    // TODO: Format response with all related data

    return specialist;
  }

  /**
   * Get specialist performance metrics
   */
  async getSpecialistPerformance(
    slug: string,
    period: string = "3m",
    platform: string = "all",
  ) {
    const specialist = await this.getSpecialistDetail(slug);

    // TODO: Implement
    // 1. Fetch performance data for period and platform
    // 2. Aggregate metrics (ROAS, spend, revenue)
    // 3. Create timeline
    // 4. Get platform-specific data
    // 5. Include case studies
    // 6. Return formatted response

    throw new Error("Not implemented");
  }
}
```

---

## 4. Service Template: MarketplaceProfileService

```typescript
// File: /src/agents/services/marketplace-profile.service.ts

import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AgentProfile } from "../entities/agent-profile.entity";
import { SpecialistCaseStudy } from "../entities/specialist-case-study.entity";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

@Injectable()
export class MarketplaceProfileService {
  private readonly logger = new Logger(MarketplaceProfileService.name);

  constructor(
    @InjectRepository(AgentProfile)
    private readonly agentProfileRepository: Repository<AgentProfile>,
    @InjectRepository(SpecialistCaseStudy)
    private readonly caseStudyRepository: Repository<SpecialistCaseStudy>,
  ) {}

  /**
   * Create new specialist profile
   */
  async createProfile(userId: string, dto: any) {
    // TODO: Implement
    // 1. Generate slug from displayName
    // 2. Check slug uniqueness
    // 3. Create AgentProfile with agentType="human"
    // 4. Set ownerId=userId
    // 5. Save and return

    const slug = slugify(dto.displayName);
    const existingSlug = await this.agentProfileRepository.findOne({
      where: { slug },
    });

    if (existingSlug) {
      throw new BadRequestException(`Slug "${slug}" is already taken`);
    }

    // TODO: Create and save profile

    throw new Error("Not implemented");
  }

  /**
   * Get own specialist profile
   */
  async getOwnProfile(id: string, userId: string) {
    const profile = await this.agentProfileRepository.findOne({
      where: { id },
      relations: ["owner"],
    });

    if (!profile) {
      throw new NotFoundException("Specialist profile not found");
    }

    if (profile.ownerId !== userId) {
      throw new ForbiddenException("You do not have access to this profile");
    }

    // TODO: Load related data (case studies, certifications, analytics)

    return profile;
  }

  /**
   * Update specialist profile
   */
  async updateProfile(id: string, userId: string, dto: any) {
    const profile = await this.getOwnProfile(id, userId);

    // TODO: Implement
    // 1. Apply partial updates from dto
    // 2. Validate data
    // 3. Save changes
    // 4. Return updated profile

    throw new Error("Not implemented");
  }

  /**
   * Add case study to specialist portfolio
   */
  async addCaseStudy(id: string, userId: string, dto: any) {
    // TODO: Implement
    // 1. Verify ownership
    // 2. Create SpecialistCaseStudy entity
    // 3. Set verificationStatus = "pending_review"
    // 4. Save and return

    throw new Error("Not implemented");
  }
}
```

---

## 5. Service Template: MarketplacePerformanceService

```typescript
// File: /src/agents/services/marketplace-performance.service.ts

import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AgentProfile } from "../entities/agent-profile.entity";
import { SpecialistAnalytics } from "../entities/specialist-analytics.entity";

@Injectable()
export class MarketplacePerformanceService {
  private readonly logger = new Logger(MarketplacePerformanceService.name);

  constructor(
    @InjectRepository(AgentProfile)
    private readonly agentProfileRepository: Repository<AgentProfile>,
    @InjectRepository(SpecialistAnalytics)
    private readonly analyticsRepository: Repository<SpecialistAnalytics>,
  ) {}

  /**
   * Get specialist analytics dashboard
   */
  async getAnalytics(id: string, userId: string, period: string = "30d") {
    const profile = await this.agentProfileRepository.findOne({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException("Specialist profile not found");
    }

    if (profile.ownerId !== userId) {
      throw new ForbiddenException("You do not have access to this profile");
    }

    // TODO: Implement
    // 1. Calculate date range from period
    // 2. Fetch analytics data for period
    // 3. Calculate trends (current vs previous period)
    // 4. Aggregate timeline data
    // 5. Return formatted response

    throw new Error("Not implemented");
  }
}
```

---

## 6. Service Template: MarketplaceContactService

```typescript
// File: /src/agents/services/marketplace-contact.service.ts

import {
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AgentProfile } from "../entities/agent-profile.entity";
import { SpecialistContact } from "../entities/specialist-contact.entity";
// import { EmailService } from "../../email/email.service";

@Injectable()
export class MarketplaceContactService {
  private readonly logger = new Logger(MarketplaceContactService.name);

  constructor(
    @InjectRepository(AgentProfile)
    private readonly agentProfileRepository: Repository<AgentProfile>,
    @InjectRepository(SpecialistContact)
    private readonly contactRepository: Repository<SpecialistContact>,
    // private readonly emailService: EmailService,
  ) {}

  /**
   * Send contact message to specialist
   */
  async contactSpecialist(
    slug: string,
    dto: any,
    userId?: string,
  ) {
    const specialist = await this.agentProfileRepository.findOne({
      where: { slug },
      relations: ["owner"],
    });

    if (!specialist) {
      throw new NotFoundException(
        `Specialist with slug "${slug}" not found`,
      );
    }

    // TODO: Implement
    // 1. Create SpecialistContact record
    // 2. Send email to specialist
    // 3. Send confirmation email to sender
    // 4. Send notification to support team
    // 5. Return success response

    throw new Error("Not implemented");
  }
}
```

---

## 7. Service Template: MarketplaceAdminService

```typescript
// File: /src/agents/services/marketplace-admin.service.ts

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AgentProfile } from "../entities/agent-profile.entity";
import { SpecialistPerformanceSyncLog } from "../entities/specialist-performance-sync-log.entity";
import { SpecialistCaseStudy } from "../entities/specialist-case-study.entity";
import { SpecialistCertification } from "../entities/specialist-certification.entity";

@Injectable()
export class MarketplaceAdminService {
  private readonly logger = new Logger(MarketplaceAdminService.name);

  constructor(
    @InjectRepository(AgentProfile)
    private readonly agentProfileRepository: Repository<AgentProfile>,
    @InjectRepository(SpecialistPerformanceSyncLog)
    private readonly syncLogRepository: Repository<SpecialistPerformanceSyncLog>,
    @InjectRepository(SpecialistCaseStudy)
    private readonly caseStudyRepository: Repository<SpecialistCaseStudy>,
    @InjectRepository(SpecialistCertification)
    private readonly certificationRepository: Repository<SpecialistCertification>,
  ) {}

  /**
   * Sync specialist performance data
   */
  async syncPerformance(id: string, platform: string, force: boolean = false) {
    // TODO: Implement
    // 1. Fetch specialist
    // 2. Create sync log entry
    // 3. Call platform API (Meta, Google, Yandex)
    // 4. Update metrics
    // 5. Return sync status

    throw new Error("Not implemented");
  }

  /**
   * Verify case study performance data
   */
  async verifyPerformance(id: string, dto: any) {
    // TODO: Implement
    // 1. Fetch case study
    // 2. Cross-check with platform data
    // 3. Assess fraud risk
    // 4. Update verification status
    // 5. Return result

    throw new Error("Not implemented");
  }

  /**
   * Get sync status for all specialists
   */
  async getSyncStatus(status?: string, limit: number = 100) {
    // TODO: Implement
    // 1. Query sync logs
    // 2. Group by specialist
    // 3. Get latest sync for each specialist
    // 4. Filter by status if provided
    // 5. Return formatted response

    throw new Error("Not implemented");
  }

  /**
   * Create certification type
   */
  async createCertification(dto: any) {
    // TODO: Implement
    // 1. Create certification entity
    // 2. Make available for specialists
    // 3. Return created certification

    throw new Error("Not implemented");
  }

  /**
   * Verify specialist certification
   */
  async verifyCertification(id: string, certId: string, dto: any) {
    // TODO: Implement
    // 1. Fetch specialist certification
    // 2. Validate with issuer if needed
    // 3. Set verification status
    // 4. Set expiration date
    // 5. Return status

    throw new Error("Not implemented");
  }
}
```

---

## 8. Integration with agents.module.ts

Update `agents.module.ts` to include marketplace services:

```typescript
// Add these imports:
import { MarketplaceController } from "./controllers/marketplace.controller";
import { MarketplaceSearchService } from "./services/marketplace-search.service";
import { MarketplaceProfileService } from "./services/marketplace-profile.service";
import { MarketplacePerformanceService } from "./services/marketplace-performance.service";
import { MarketplaceContactService } from "./services/marketplace-contact.service";
import { MarketplaceAdminService } from "./services/marketplace-admin.service";

// Add these entities to TypeOrmModule:
import {
  SpecialistCaseStudy,
  SpecialistCertification,
  SpecialistPerformanceSyncLog,
  SpecialistAnalytics,
  SpecialistContact,
} from "./entities";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AgentProfile,
      ServiceEngagement,
      AgentReview,
      Workspace,
      User,
      // NEW:
      SpecialistCaseStudy,
      SpecialistCertification,
      SpecialistPerformanceSyncLog,
      SpecialistAnalytics,
      SpecialistContact,
    ]),
  ],
  controllers: [AgentsController, MarketplaceController], // ADD MarketplaceController
  providers: [
    AgentsService,
    // NEW:
    MarketplaceSearchService,
    MarketplaceProfileService,
    MarketplacePerformanceService,
    MarketplaceContactService,
    MarketplaceAdminService,
  ],
  exports: [
    AgentsService,
    // NEW:
    MarketplaceSearchService,
    MarketplaceProfileService,
  ],
})
export class AgentsModule {}
```

---

## 9. Testing Checklist

- [ ] All endpoints respond with correct HTTP status codes
- [ ] DTOs validate input correctly
- [ ] Ownership checks prevent unauthorized access
- [ ] Admin endpoints require admin role
- [ ] Search filters work correctly
- [ ] Pagination works correctly
- [ ] Case study verification workflow works
- [ ] Contact emails are sent
- [ ] Performance sync updates metrics
- [ ] Analytics calculations are correct

---

## 10. Performance Considerations

1. **Caching:**
   - Cache marketplace filters (Redis, 24h TTL)
   - Cache specialist profiles (Redis, 1h TTL)
   - Cache performance data (Redis, 6h TTL)

2. **Database:**
   - Index on `slug`, `platform`, `niche`, `language` columns
   - Index on `specialist_id` for joins
   - Index on `created_at` for sorting

3. **Asynchronous Tasks:**
   - Performance sync should be queued (Bull/RabbitMQ)
   - Email sending should be asynchronous
   - Analytics aggregation should run periodically

4. **Rate Limiting:**
   - Apply rate limiting to public search endpoints
   - Limit contact form submissions (5 per IP per day)
   - Limit case study uploads (10 per specialist per month)

---

## 11. Security Considerations

1. **CORS:** Ensure marketplace endpoints are properly CORS-configured
2. **Input Validation:** Validate and sanitize all user inputs
3. **SQL Injection:** Use TypeORM parameterized queries
4. **XSS Prevention:** Sanitize HTML in case study descriptions
5. **Rate Limiting:** Prevent abuse of public endpoints
6. **Email Verification:** Verify email addresses for contacts
7. **Fraud Detection:** Monitor case study metrics for suspicious patterns

---

## Next Steps

1. Create entity files from templates above
2. Create service files from templates
3. Implement service methods (start with simple queries)
4. Write unit tests for services
5. Write integration tests for controller endpoints
6. Set up performance syncing jobs
7. Add monitoring and logging
8. Deploy and monitor in production
