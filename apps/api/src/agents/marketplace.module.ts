import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

// ── CONTROLLERS ────────────────────────────────────────────────────────────
import { MarketplaceController } from "./controllers/marketplace.controller";

// ── SERVICES (TO BE CREATED) ──────────────────────────────────────────────
// import { MarketplaceSearchService } from "./services/marketplace-search.service";
// import { MarketplaceProfileService } from "./services/marketplace-profile.service";
// import { MarketplacePerformanceService } from "./services/marketplace-performance.service";
// import { MarketplaceContactService } from "./services/marketplace-contact.service";
// import { MarketplaceAdminService } from "./services/marketplace-admin.service";

// ── ENTITIES (EXISTING + NEW) ──────────────────────────────────────────────
import { AgentProfile } from "./entities/agent-profile.entity";
// import { SpecialistCaseStudy } from "./entities/specialist-case-study.entity"; // TODO: Create
// import { SpecialistCertification } from "./entities/specialist-certification.entity"; // TODO: Create
// import { SpecialistPerformanceSyncLog } from "./entities/specialist-performance-sync-log.entity"; // TODO: Create
// import { SpecialistAnalytics } from "./entities/specialist-analytics.entity"; // TODO: Create
// import { SpecialistContact } from "./entities/specialist-contact.entity"; // TODO: Create

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MARKETPLACE MODULE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Handles specialist marketplace functionality including:
 * - Public specialist discovery and search
 * - Specialist profile management
 * - Performance tracking and verification
 * - Case study portfolio management
 * - Certification management
 * - Admin features
 *
 * This module integrates with the Agents module and provides marketplace-specific
 * endpoints for the Performa platform.
 *
 * TODO: Complete service implementations below
 */

@Module({
  imports: [
    // Database entities
    TypeOrmModule.forFeature([
      AgentProfile,
      // SpecialistCaseStudy,
      // SpecialistCertification,
      // SpecialistPerformanceSyncLog,
      // SpecialistAnalytics,
      // SpecialistContact,
    ]),
  ],
  controllers: [MarketplaceController],
  providers: [
    // TODO: Uncomment and implement these services:
    // MarketplaceSearchService,
    // MarketplaceProfileService,
    // MarketplacePerformanceService,
    // MarketplaceContactService,
    // MarketplaceAdminService,
  ],
  exports: [
    // TODO: Export services if needed by other modules:
    // MarketplaceSearchService,
    // MarketplaceProfileService,
  ],
})
export class MarketplaceModule {}
