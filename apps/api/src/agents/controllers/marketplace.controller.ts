import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  Optional,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiExtraModels,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsEmail,
  IsEnum,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { MarketplaceAdminService } from "../services/marketplace-admin.service";
import { MarketplaceSearchService } from "../services/marketplace-search.service";
import { SyncPerformanceDto, VerifyPerformanceDto, SyncStatusDto } from "../dtos/marketplace.dto";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MARKETPLACE CONTROLLER - Performa Specialist Marketplace
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Handles public marketplace discovery, specialist profiles, performance data,
 * and specialist profile management for authenticated users and administrators.
 *
 * Routes:
 *   PUBLIC:  GET /marketplace/* (search, filters, profiles)
 *   AUTH:    POST/PATCH /my-profile/specialists/* (profile management)
 *   ADMIN:   POST /admin/specialists/* (verification, syncing)
 */

// ─── QUERY DTO ────────────────────────────────────────────────────────────

class SearchSpecialistsQueryDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsArray()
  platforms?: string[];

  @IsOptional()
  @IsArray()
  niches?: string[];

  @IsOptional()
  @IsArray()
  certifications?: string[];

  @IsOptional()
  @IsArray()
  languages?: string[];

  @IsOptional()
  @IsArray()
  countries?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minExperience?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minRoas?: number;

  @IsOptional()
  @IsEnum(["rating", "roas", "experience", "price", "trending"])
  sortBy?: string = "rating";

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

class PerformanceQueryDto {
  @IsOptional()
  @IsEnum(["1m", "3m", "6m", "12m", "all"])
  period?: string = "3m";

  @IsOptional()
  @IsEnum(["meta", "google", "yandex", "all"])
  platform?: string = "all";
}

// ─── REQUEST/RESPONSE DTO ─────────────────────────────────────────────────

class ContactSpecialistDto {
  @IsEmail()
  email: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsEnum(["email", "phone", "message"])
  preferredContactMethod?: string = "email";
}

class CreateSpecialistProfileDto {
  @IsString()
  displayName: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  platforms?: string[];

  @IsOptional()
  @IsArray()
  niches?: string[];

  @IsOptional()
  @IsArray()
  specializations?: string[];

  @IsOptional()
  @IsArray()
  languages?: string[];

  @IsOptional()
  @IsArray()
  countries?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  monthlyRate?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  commissionRate?: number = 0;

  @IsOptional()
  @IsString()
  pricingModel?: "fixed" | "commission" | "hybrid" = "commission";

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  responseTime?: string;
}

class UpdateSpecialistProfileDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  platforms?: string[];

  @IsOptional()
  @IsArray()
  niches?: string[];

  @IsOptional()
  @IsArray()
  specializations?: string[];

  @IsOptional()
  @IsArray()
  languages?: string[];

  @IsOptional()
  @IsArray()
  countries?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  monthlyRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  commissionRate?: number;

  @IsOptional()
  @IsString()
  pricingModel?: "fixed" | "commission" | "hybrid";

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  responseTime?: string;
}

class AddCaseStudyDto {
  @IsString()
  title: string;

  @IsString()
  industry: string;

  @IsString()
  platform: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  metrics?: Record<string, any>;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsString()
  proofUrl?: string;
}

class CreateCertificationDto {
  @IsString()
  name: string;

  @IsString()
  issuer: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  badge?: string;
}

class VerifyCertificationDto {
  @IsOptional()
  verified?: boolean = true;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}

// ─── RESPONSE DTO ─────────────────────────────────────────────────────────

class SpecialistProfileDto {
  id: string;
  slug: string;
  displayName: string;
  title: string;
  bio?: string;
  avatar?: string;
  avatarColor?: string;
  location?: string;
  responseTime?: string;
  platforms: string[];
  niches: string[];
  specializations?: string[];
  languages: string[];
  countries: string[];
  monthlyRate: number;
  commissionRate: number;
  pricingModel: string;
  isVerified: boolean;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  stats?: {
    avgROAS: number;
    avgCPA: number;
    totalCampaigns: number;
    activeCampaigns: number;
    successRate: number;
    totalSpendManaged: number;
  };
  certifications?: any[];
  caseStudies?: any[];
  createdAt: Date;
  updatedAt: Date;
}

class SearchSpecialistsResponseDto {
  specialists: SpecialistProfileDto[];
  total: number;
  page: number;
  pageSize: number;
  filters: {
    platforms: string[];
    niches: string[];
    certifications: string[];
    languages: string[];
    countries: string[];
    priceRanges: string[];
    experienceLevels: string[];
  };
}

class MarketplaceFiltersDto {
  platforms: string[];
  niches: string[];
  certifications: string[];
  languages: string[];
  countries: string[];
  priceRanges: string[];
  experienceLevels: string[];
}

class SpecialistPerformanceDto {
  summary: {
    avgROAS: number;
    totalSpend: number;
    totalRevenue: number;
    campaignCount: number;
    successRate: number;
  };
  timeline: Array<{
    date: string;
    roas: number;
    spend: number;
    revenue: number;
  }>;
  byPlatform: Record<string, any>;
  caseStudies: any[];
}

class ContactResponseDto {
  success: boolean;
  message: string;
  contactId?: string;
}

class CaseStudyResponseDto {
  id: string;
  status: "pending_review" | "approved" | "rejected";
  title: string;
  industry: string;
  platform: string;
  createdAt: Date;
}

class AnalyticsDto {
  profileViews: number;
  profileViewsTrend: number;
  impressions: number;
  impressionsTrend: number;
  contacts: number;
  contactsTrend: number;
  engagement: number;
  engagementTrend: number;
  conversion: number;
  conversionTrend: number;
  timeline: Array<{
    date: string;
    views: number;
    impressions: number;
    contacts: number;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════

@ApiTags("Marketplace - Specialists")
@Controller("marketplace")
export class MarketplaceController {
  constructor(
    private readonly marketplaceAdminService: MarketplaceAdminService,
    private readonly marketplaceSearchService: MarketplaceSearchService,
    // private readonly marketplaceProfileService: MarketplaceProfileService,
    // private readonly marketplacePerformanceService: MarketplacePerformanceService,
    // private readonly marketplaceContactService: MarketplaceContactService,
  ) {}

  // ═════════════════════════════════════════════════════════════════════════
  // PUBLIC ENDPOINTS
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * GET /marketplace/specialists
   * Search and filter specialists in the marketplace
   */
  @Get("specialists")
  @ApiOperation({
    summary: "Search specialists",
    description:
      "Search and filter specialists by various criteria. Returns paginated results with available filters.",
  })
  @ApiResponse({
    status: 200,
    description: "List of specialists with filters",
    type: SearchSpecialistsResponseDto,
  })
  @ApiQuery({ name: "query", required: false, description: "Search query (name, title, bio)" })
  @ApiQuery({ name: "platforms", required: false, isArray: true, description: "Filter by platforms" })
  @ApiQuery({ name: "niches", required: false, isArray: true, description: "Filter by niches" })
  @ApiQuery({ name: "certifications", required: false, isArray: true, description: "Filter by certifications" })
  @ApiQuery({ name: "languages", required: false, isArray: true, description: "Filter by languages" })
  @ApiQuery({ name: "countries", required: false, isArray: true, description: "Filter by countries" })
  @ApiQuery({ name: "minRating", required: false, type: Number, description: "Minimum rating (0-5)" })
  @ApiQuery({ name: "minExperience", required: false, type: Number, description: "Minimum years of experience" })
  @ApiQuery({ name: "minRoas", required: false, type: Number, description: "Minimum average ROAS" })
  @ApiQuery({ name: "sortBy", required: false, enum: ["rating", "roas", "experience", "price", "trending"] })
  @ApiQuery({ name: "page", required: false, type: Number, description: "Page number (default: 1)" })
  @ApiQuery({ name: "pageSize", required: false, type: Number, description: "Results per page (default: 20, max: 100)" })
  async searchSpecialists(
    @Query() query: SearchSpecialistsQueryDto,
  ): Promise<SearchSpecialistsResponseDto> {
    return this.marketplaceSearchService.searchSpecialists(query);
  }

  /**
   * GET /marketplace/filters
   * Get available marketplace filters
   */
  @Get("filters")
  @ApiOperation({
    summary: "Get marketplace filters",
    description: "Retrieve available filter options for specialist search (platforms, niches, languages, etc.)",
  })
  @ApiResponse({
    status: 200,
    description: "Available marketplace filters",
    type: MarketplaceFiltersDto,
  })
  async getFilters(): Promise<MarketplaceFiltersDto> {
    return this.marketplaceSearchService.getAvailableFilters();
  }

  /**
   * GET /specialists/:slug
   * Get complete public specialist profile
   */
  @Get("specialists/:slug")
  @ApiOperation({
    summary: "Get specialist profile",
    description:
      "Retrieve complete public specialist profile with certifications, case studies, languages, coverage area, and performance metrics. Cacheable.",
  })
  @ApiResponse({
    status: 200,
    description: "Specialist profile details",
    type: SpecialistProfileDto,
  })
  @ApiResponse({
    status: 404,
    description: "Specialist not found",
  })
  @ApiParam({ name: "slug", description: "Specialist slug" })
  async getSpecialistDetail(
    @Param("slug") slug: string,
  ): Promise<SpecialistProfileDto> {
    if (!slug || slug.trim().length === 0) {
      throw new BadRequestException("Invalid specialist slug");
    }
    return this.marketplaceSearchService.getSpecialistDetail(slug);
  }

  /**
   * GET /specialists/:slug/performance
   * Get specialist performance metrics and analytics
   */
  @Get("specialists/:slug/performance")
  @ApiOperation({
    summary: "Get specialist performance",
    description:
      "Retrieve performance metrics for a specialist including summary, timeline, platform-specific data, and case studies.",
  })
  @ApiResponse({
    status: 200,
    description: "Performance metrics",
    type: SpecialistPerformanceDto,
  })
  @ApiResponse({
    status: 404,
    description: "Specialist not found",
  })
  @ApiParam({ name: "slug", description: "Specialist slug" })
  @ApiQuery({ name: "period", required: false, enum: ["1m", "3m", "6m", "12m", "all"] })
  @ApiQuery({ name: "platform", required: false, enum: ["meta", "google", "yandex", "all"] })
  async getSpecialistPerformance(
    @Param("slug") slug: string,
    @Query() query: PerformanceQueryDto,
  ): Promise<SpecialistPerformanceDto> {
    if (!slug || slug.trim().length === 0) {
      throw new BadRequestException("Invalid specialist slug");
    }
    return this.marketplaceSearchService.getSpecialistPerformance(slug, query.period, query.platform);
  }

  /**
   * POST /specialists/:slug/contact
   * Send contact message to specialist (optional auth)
   */
  @Post("specialists/:slug/contact")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Contact specialist",
    description:
      "Send contact message to a specialist. Authentication is optional. Message is sent to specialist and support team.",
  })
  @ApiResponse({
    status: 200,
    description: "Contact message sent",
    type: ContactResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid request",
  })
  @ApiResponse({
    status: 404,
    description: "Specialist not found",
  })
  @ApiParam({ name: "slug", description: "Specialist slug" })
  async contactSpecialist(
    @Param("slug") slug: string,
    @Body() dto: ContactSpecialistDto,
    @Request() req?: any,
  ): Promise<ContactResponseDto> {
    if (!slug || slug.trim().length === 0) {
      throw new BadRequestException("Invalid specialist slug");
    }
    if (!dto.email || !dto.message) {
      throw new BadRequestException("Email and message are required");
    }
    // TODO: Call marketplaceContactService.contactSpecialist(slug, dto, req?.user?.id)
    throw new Error("Not implemented - awaiting marketplaceContactService");
  }

  // ═════════════════════════════════════════════════════════════════════════
  // AUTHENTICATED ENDPOINTS (User)
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * GET /my-profile/specialists/:id
   * Get own specialist profile details
   */
  @Get("my-profile/specialists/:id")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get my specialist profile",
    description: "Retrieve your own specialist profile with full details including analytics.",
  })
  @ApiResponse({
    status: 200,
    description: "Specialist profile",
    type: SpecialistProfileDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "You do not have access to this profile",
  })
  @ApiResponse({
    status: 404,
    description: "Specialist profile not found",
  })
  @ApiParam({ name: "id", description: "Specialist profile ID" })
  async getMySpecialistProfile(
    @Param("id") id: string,
    @Request() req: any,
  ): Promise<SpecialistProfileDto> {
    if (!id || id.trim().length === 0) {
      throw new BadRequestException("Invalid specialist ID");
    }
    // TODO: Call marketplaceProfileService.getOwnProfile(id, req.user.id)
    //       - Verify ownership
    //       - Return full profile with analytics
    throw new Error("Not implemented - awaiting marketplaceProfileService");
  }

  /**
   * POST /my-profile/specialists
   * Create new specialist profile
   */
  @Post("my-profile/specialists")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create specialist profile",
    description:
      "Create a new specialist profile for yourself. Profile will be listed in marketplace after verification.",
  })
  @ApiResponse({
    status: 201,
    description: "Specialist profile created",
    type: SpecialistProfileDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid request data",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  async createSpecialistProfile(
    @Body() dto: CreateSpecialistProfileDto,
    @Request() req: any,
  ): Promise<SpecialistProfileDto> {
    if (!dto.displayName || !dto.title) {
      throw new BadRequestException("displayName and title are required");
    }
    // TODO: Call marketplaceProfileService.createProfile(req.user.id, dto)
    //       - Validate inputs
    //       - Generate slug
    //       - Create profile entity
    //       - Return created profile
    throw new Error("Not implemented - awaiting marketplaceProfileService");
  }

  /**
   * PATCH /my-profile/specialists/:id
   * Update specialist profile
   */
  @Patch("my-profile/specialists/:id")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update specialist profile",
    description: "Update your specialist profile with partial updates.",
  })
  @ApiResponse({
    status: 200,
    description: "Profile updated",
    type: SpecialistProfileDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "You do not have access to this profile",
  })
  @ApiResponse({
    status: 404,
    description: "Specialist profile not found",
  })
  @ApiParam({ name: "id", description: "Specialist profile ID" })
  async updateSpecialistProfile(
    @Param("id") id: string,
    @Body() dto: UpdateSpecialistProfileDto,
    @Request() req: any,
  ): Promise<SpecialistProfileDto> {
    if (!id || id.trim().length === 0) {
      throw new BadRequestException("Invalid specialist ID");
    }
    // TODO: Call marketplaceProfileService.updateProfile(id, req.user.id, dto)
    //       - Verify ownership
    //       - Apply partial updates
    //       - Return updated profile
    throw new Error("Not implemented - awaiting marketplaceProfileService");
  }

  /**
   * POST /my-profile/specialists/:id/case-studies
   * Add case study to portfolio
   */
  @Post("my-profile/specialists/:id/case-studies")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Add case study",
    description:
      "Add a new case study to your specialist portfolio. Case studies go through a review process before being published.",
  })
  @ApiResponse({
    status: 201,
    description: "Case study created",
    type: CaseStudyResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid request data",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "You do not have access to this profile",
  })
  @ApiResponse({
    status: 404,
    description: "Specialist profile not found",
  })
  @ApiParam({ name: "id", description: "Specialist profile ID" })
  async addCaseStudy(
    @Param("id") id: string,
    @Body() dto: AddCaseStudyDto,
    @Request() req: any,
  ): Promise<CaseStudyResponseDto> {
    if (!id || id.trim().length === 0) {
      throw new BadRequestException("Invalid specialist ID");
    }
    if (!dto.title || !dto.industry || !dto.platform) {
      throw new BadRequestException("title, industry, and platform are required");
    }
    // TODO: Call marketplaceProfileService.addCaseStudy(id, req.user.id, dto)
    //       - Verify ownership
    //       - Create case study
    //       - Set status to "pending_review"
    //       - Return created case study
    throw new Error("Not implemented - awaiting marketplaceProfileService");
  }

  /**
   * GET /my-profile/specialists/:id/analytics
   * Get specialist dashboard analytics
   */
  @Get("my-profile/specialists/:id/analytics")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get specialist analytics",
    description:
      "Retrieve analytics dashboard for your specialist profile including views, impressions, contacts, and engagement metrics.",
  })
  @ApiResponse({
    status: 200,
    description: "Analytics data",
    type: AnalyticsDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "You do not have access to this profile",
  })
  @ApiResponse({
    status: 404,
    description: "Specialist profile not found",
  })
  @ApiParam({ name: "id", description: "Specialist profile ID" })
  @ApiQuery({ name: "period", required: false, enum: ["7d", "30d", "90d", "all"], description: "Analytics period" })
  async getAnalytics(
    @Param("id") id: string,
    @Query("period") period: string = "30d",
    @Request() req: any,
  ): Promise<AnalyticsDto> {
    if (!id || id.trim().length === 0) {
      throw new BadRequestException("Invalid specialist ID");
    }
    // TODO: Call marketplacePerformanceService.getAnalytics(id, req.user.id, period)
    //       - Verify ownership
    //       - Aggregate analytics for period
    //       - Return analytics with trends
    throw new Error("Not implemented - awaiting marketplacePerformanceService");
  }

  // ═════════════════════════════════════════════════════════════════════════
  // ADMIN ENDPOINTS
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * POST /admin/specialists/:id/sync-performance
   * Manually trigger performance data sync
   */
  @Post("admin/specialists/:id/sync-performance")
  @UseGuards(AuthGuard("jwt")) // TODO: Add AdminGuard
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Sync specialist performance",
    description: "Admin endpoint to manually trigger performance data synchronization for a specialist.",
  })
  @ApiResponse({
    status: 200,
    description: "Sync initiated or completed",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid request",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Admin access required",
  })
  @ApiResponse({
    status: 404,
    description: "Specialist not found",
  })
  @ApiParam({ name: "id", description: "Specialist profile ID" })
  async syncPerformance(
    @Param("id") id: string,
    @Body() dto: SyncPerformanceDto,
    @Request() req: any,
  ): Promise<{ synced: boolean; records: number; nextSync: Date; fraudRiskScore?: number }> {
    // Validate input
    if (!id || id.trim().length === 0) {
      throw new BadRequestException("Invalid specialist ID");
    }
    if (!dto.platform) {
      throw new BadRequestException("platform is required (meta, google, or yandex)");
    }

    // Extract workspace from request (typically from JWT claims)
    const workspaceId = req.user?.workspaceId;

    try {
      // Call marketplace admin service to perform sync
      const result = await this.marketplaceAdminService.syncPerformance(
        id,
        dto.platform,
        dto.force ?? false,
        workspaceId,
      );

      return result;
    } catch (err: any) {
      // Handle specific errors
      if (err instanceof NotFoundException) {
        throw err;
      }
      if (err instanceof BadRequestException) {
        throw err;
      }

      // Log unexpected errors
      throw new InternalServerErrorException(
        err?.message ?? `Failed to sync performance data for specialist ${id}`,
      );
    }
  }

  /**
   * POST /admin/specialists/:id/verify-performance
   * Verify specialist performance data
   */
  @Post("admin/specialists/:id/verify-performance")
  @UseGuards(AuthGuard("jwt")) // TODO: Add AdminGuard
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Verify performance data",
    description: "Admin endpoint to verify performance data and assess fraud risk for a specialist.",
  })
  @ApiResponse({
    status: 200,
    description: "Performance verified",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid request",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Admin access required",
  })
  @ApiResponse({
    status: 404,
    description: "Specialist not found",
  })
  @ApiParam({ name: "id", description: "Specialist profile ID" })
  async verifyPerformance(
    @Param("id") id: string,
    @Body() dto: VerifyPerformanceDto,
    @Request() req: any,
  ): Promise<{ status: "verified" | "rejected"; fraudRiskLevel: string }> {
    // Validate input
    if (!id || id.trim().length === 0) {
      throw new BadRequestException("Invalid specialist ID");
    }

    try {
      // Map DTO to verification status
      const status = dto.verified ? "verified" : "rejected";
      const fraudRiskLevel = this.mapFraudRiskScoreToLevel(dto.fraudRiskLevel ?? 0);

      return {
        status,
        fraudRiskLevel,
      };
    } catch (err: any) {
      // Handle specific errors
      if (err instanceof NotFoundException) {
        throw err;
      }
      if (err instanceof BadRequestException) {
        throw err;
      }

      // Log unexpected errors
      throw new InternalServerErrorException(
        err?.message ?? `Failed to verify performance data for specialist ${id}`,
      );
    }
  }

  /**
   * Maps numeric fraud risk score (0-1) to descriptive level
   */
  private mapFraudRiskScoreToLevel(score: number): string {
    if (score <= 0.25) {
      return "low";
    } else if (score <= 0.5) {
      return "medium";
    } else if (score <= 0.75) {
      return "high";
    } else {
      return "critical";
    }
  }

  /**
   * GET /admin/specialists/sync-status
   * Monitor all specialist syncs
   */
  @Get("admin/specialists/sync-status")
  @UseGuards(AuthGuard("jwt")) // TODO: Add AdminGuard
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get sync status",
    description:
      "Admin endpoint to monitor performance data synchronization status across all specialists.",
  })
  @ApiResponse({
    status: 200,
    description: "Sync status for all specialists",
    type: [SyncStatusDto],
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Admin access required",
  })
  @ApiQuery({ name: "status", required: false, enum: ["pending", "in_progress", "completed", "failed"] })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getSyncStatus(
    @Query("status") status?: string,
    @Query("limit") limit?: string,
    @Request() req?: any,
  ): Promise<SyncStatusDto[]> {
    try {
      // Validate status parameter if provided
      const validStatuses = ["pending", "in_progress", "completed", "failed"];
      let statusFilter: "pending" | "in_progress" | "completed" | "failed" | undefined;

      if (status) {
        if (!validStatuses.includes(status.toLowerCase())) {
          throw new BadRequestException(
            `Invalid status: ${status}. Supported values: ${validStatuses.join(", ")}`,
          );
        }
        statusFilter = status.toLowerCase() as "pending" | "in_progress" | "completed" | "failed";
      }

      // Parse limit
      let parsedLimit = 100;
      if (limit) {
        parsedLimit = parseInt(limit, 10);
        if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
          throw new BadRequestException("limit must be a number between 1 and 1000");
        }
      }

      // Retrieve sync status
      const syncStatus = await this.marketplaceAdminService.getSyncStatus(statusFilter, parsedLimit);

      return syncStatus;
    } catch (err: any) {
      // Handle specific errors
      if (err instanceof BadRequestException) {
        throw err;
      }

      // Log unexpected errors
      throw new InternalServerErrorException(
        err?.message ?? "Failed to retrieve sync status",
      );
    }
  }

  /**
   * POST /admin/certifications
   * Create new certification type
   */
  @Post("admin/certifications")
  @UseGuards(AuthGuard("jwt")) // TODO: Add AdminGuard
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create certification type",
    description: "Admin endpoint to create a new certification type available for specialists.",
  })
  @ApiResponse({
    status: 201,
    description: "Certification created",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid request",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Admin access required",
  })
  async createCertification(
    @Body() dto: CreateCertificationDto,
    @Request() req: any,
  ): Promise<{ id: string; name: string; issuer: string }> {
    if (!dto.name || !dto.issuer) {
      throw new BadRequestException("name and issuer are required");
    }
    // TODO: Call marketplaceAdminService.createCertification(dto)
    //       - Check admin role
    //       - Create certification entity
    //       - Return created certification
    throw new Error("Not implemented - awaiting marketplaceAdminService");
  }

  /**
   * POST /admin/specialists/:id/certifications/:certId/verify
   * Verify specialist certification
   */
  @Post("admin/specialists/:id/certifications/:certId/verify")
  @UseGuards(AuthGuard("jwt")) // TODO: Add AdminGuard
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Verify specialist certification",
    description: "Admin endpoint to verify a specialist certification.",
  })
  @ApiResponse({
    status: 200,
    description: "Certification verified",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid request",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Admin access required",
  })
  @ApiResponse({
    status: 404,
    description: "Specialist or certification not found",
  })
  @ApiParam({ name: "id", description: "Specialist profile ID" })
  @ApiParam({ name: "certId", description: "Certification ID" })
  async verifyCertification(
    @Param("id") id: string,
    @Param("certId") certId: string,
    @Body() dto: VerifyCertificationDto,
    @Request() req: any,
  ): Promise<{ status: "verified" | "rejected"; expiresAt?: string }> {
    if (!id || id.trim().length === 0) {
      throw new BadRequestException("Invalid specialist ID");
    }
    if (!certId || certId.trim().length === 0) {
      throw new BadRequestException("Invalid certification ID");
    }
    // TODO: Call marketplaceAdminService.verifyCertification(id, certId, dto)
    //       - Check admin role
    //       - Verify certification
    //       - Set expiration if provided
    //       - Return status
    throw new Error("Not implemented - awaiting marketplaceAdminService");
  }
}
