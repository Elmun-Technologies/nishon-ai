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
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { IsOptional, IsString, IsNumber, IsArray, IsEmail, IsEnum, Min, Max } from "class-validator";
import { Type } from "class-transformer";

import { MarketplaceAdminService } from "../services/marketplace-admin.service";
import { MarketplaceSearchService } from "../services/marketplace-search.service";
import { MarketplaceProfileService } from "../services/marketplace-profile.service";
import { MarketplaceContactService } from "../services/marketplace-contact.service";
import { MarketplacePerformanceService } from "../services/marketplace-performance.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AdminGuard } from "../../common/guards/admin.guard";
import { SyncPerformanceDto, VerifyPerformanceDto, SyncStatusDto } from "../dtos/marketplace.dto";

// ─── QUERY DTOs ───────────────────────────────────────────────────────────────

class SearchSpecialistsQueryDto {
  @IsOptional() @IsString() query?: string;
  @IsOptional() @IsArray() platforms?: string[];
  @IsOptional() @IsArray() niches?: string[];
  @IsOptional() @IsArray() certifications?: string[];
  @IsOptional() @IsArray() languages?: string[];
  @IsOptional() @IsArray() countries?: string[];
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(5) minRating?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minExperience?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minRoas?: number;
  @IsOptional() @IsEnum(["rating", "roas", "experience", "price", "trending"]) sortBy?: string = "rating";
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(100) pageSize?: number = 20;
}

class PerformanceQueryDto {
  @IsOptional() @IsEnum(["1m", "3m", "6m", "12m", "all"]) period?: string = "3m";
  @IsOptional() @IsEnum(["meta", "google", "yandex", "all"]) platform?: string = "all";
}

class ContactSpecialistDto {
  @IsEmail() email: string;
  @IsString() message: string;
  @IsOptional() @IsEnum(["email", "phone", "message"]) preferredContactMethod?: string = "email";
  @IsOptional() @IsString() phone?: string;
}

class CreateSpecialistProfileDto {
  @IsString() displayName: string;
  @IsString() title: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsArray() platforms?: string[];
  @IsOptional() @IsArray() niches?: string[];
  @IsOptional() @IsArray() specializations?: string[];
  @IsOptional() @IsArray() languages?: string[];
  @IsOptional() @IsArray() countries?: string[];
  @IsOptional() @Type(() => Number) @IsNumber() monthlyRate?: number = 0;
  @IsOptional() @Type(() => Number) @IsNumber() commissionRate?: number = 0;
  @IsOptional() @IsString() pricingModel?: "fixed" | "commission" | "hybrid" = "commission";
  @IsOptional() @IsString() avatar?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() responseTime?: string;
}

class UpdateSpecialistProfileDto {
  @IsOptional() @IsString() displayName?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsArray() platforms?: string[];
  @IsOptional() @IsArray() niches?: string[];
  @IsOptional() @IsArray() specializations?: string[];
  @IsOptional() @IsArray() languages?: string[];
  @IsOptional() @IsArray() countries?: string[];
  @IsOptional() @Type(() => Number) @IsNumber() monthlyRate?: number;
  @IsOptional() @Type(() => Number) @IsNumber() commissionRate?: number;
  @IsOptional() @IsString() pricingModel?: "fixed" | "commission" | "hybrid";
  @IsOptional() @IsString() avatar?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() responseTime?: string;
}

class AddCaseStudyDto {
  @IsString() title: string;
  @IsString() industry: string;
  @IsString() platform: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() metrics?: Record<string, any>;
  @IsOptional() @IsArray() images?: string[];
  @IsOptional() @IsString() proofUrl?: string;
}

class CreateCertificationDto {
  @IsString() name: string;
  @IsString() issuer: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() iconUrl?: string;
  @IsOptional() @IsString() badgeColor?: string;
}

class VerifyCertificationDto {
  @IsOptional() verified?: boolean = true;
  @IsOptional() @IsString() expiresAt?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════

@ApiTags("Marketplace - Specialists")
@Controller("marketplace")
export class MarketplaceController {
  constructor(
    private readonly marketplaceAdminService: MarketplaceAdminService,
    private readonly marketplaceSearchService: MarketplaceSearchService,
    private readonly marketplaceProfileService: MarketplaceProfileService,
    private readonly marketplaceContactService: MarketplaceContactService,
    private readonly marketplacePerformanceService: MarketplacePerformanceService,
  ) {}

  // ═════════════════════════════════════════════════════════════════════════
  // PUBLIC ENDPOINTS
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * GET /marketplace/specialists
   * Search and filter specialists
   */
  @Get("specialists")
  @ApiOperation({ summary: "Search specialists" })
  @ApiResponse({ status: 200, description: "List of specialists with filters" })
  async searchSpecialists(@Query() query: SearchSpecialistsQueryDto) {
    return this.marketplaceSearchService.searchSpecialists({
      query: query.query,
      platforms: query.platforms,
      niches: query.niches,
      certifications: query.certifications,
      languages: query.languages,
      countries: query.countries,
      minRating: query.minRating,
      minExperience: query.minExperience,
      minRoas: query.minRoas,
      sortBy: query.sortBy as any,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  /**
   * GET /marketplace/filters
   * Get available filter options
   */
  @Get("filters")
  @ApiOperation({ summary: "Get marketplace filters" })
  @ApiResponse({ status: 200, description: "Available filters" })
  async getFilters() {
    return this.marketplaceSearchService.getAvailableFilters();
  }

  /**
   * GET /marketplace/specialists/:slug
   * Get full public specialist profile
   */
  @Get("specialists/:slug")
  @ApiOperation({ summary: "Get specialist profile" })
  @ApiParam({ name: "slug", description: "Specialist slug" })
  async getSpecialistDetail(@Param("slug") slug: string) {
    if (!slug?.trim()) throw new BadRequestException("Invalid specialist slug");
    return this.marketplaceSearchService.getSpecialistDetail(slug);
  }

  /**
   * GET /marketplace/specialists/:slug/performance
   * Get specialist performance metrics
   */
  @Get("specialists/:slug/performance")
  @ApiOperation({ summary: "Get specialist performance" })
  @ApiParam({ name: "slug", description: "Specialist slug" })
  @ApiQuery({ name: "period", required: false, enum: ["1m", "3m", "6m", "12m", "all"] })
  @ApiQuery({ name: "platform", required: false, enum: ["meta", "google", "yandex", "all"] })
  async getSpecialistPerformance(
    @Param("slug") slug: string,
    @Query() query: PerformanceQueryDto,
  ) {
    if (!slug?.trim()) throw new BadRequestException("Invalid specialist slug");
    // Map frontend period format to service format
    const periodMap: Record<string, "month" | "quarter" | "year"> = {
      "1m": "month", "3m": "quarter", "6m": "quarter", "12m": "year", "all": "year",
    };
    const mappedPeriod = periodMap[query.period ?? "3m"] ?? "quarter";
    return this.marketplaceSearchService.getSpecialistPerformance(slug, mappedPeriod);
  }

  /**
   * POST /marketplace/specialists/:slug/contact
   * Send contact request to specialist
   */
  @Post("specialists/:slug/contact")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Contact specialist" })
  @ApiParam({ name: "slug", description: "Specialist slug" })
  async contactSpecialist(
    @Param("slug") slug: string,
    @Body() dto: ContactSpecialistDto,
    @Request() req?: any,
  ) {
    if (!slug?.trim()) throw new BadRequestException("Invalid specialist slug");
    if (!dto.email || !dto.message) throw new BadRequestException("Email and message are required");
    return this.marketplaceContactService.contactSpecialist(
      slug,
      dto as any,
      req?.user?.id,
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // AUTHENTICATED ENDPOINTS (User)
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * GET /marketplace/my-profile/specialists/:id
   * Get own specialist profile
   */
  @Get("my-profile/specialists/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get my specialist profile" })
  async getMySpecialistProfile(@Param("id") id: string, @Request() req: any) {
    if (!id?.trim()) throw new BadRequestException("Invalid specialist ID");
    return this.marketplaceProfileService.getOwnProfile(id, req.user.id);
  }

  /**
   * POST /marketplace/my-profile/specialists
   * Create specialist profile
   */
  @Post("my-profile/specialists")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create specialist profile" })
  async createSpecialistProfile(@Body() dto: CreateSpecialistProfileDto, @Request() req: any) {
    if (!dto.displayName || !dto.title) {
      throw new BadRequestException("displayName and title are required");
    }
    return this.marketplaceProfileService.createProfile(req.user.id, dto as any);
  }

  /**
   * PATCH /marketplace/my-profile/specialists/:id
   * Update specialist profile
   */
  @Patch("my-profile/specialists/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update specialist profile" })
  async updateSpecialistProfile(
    @Param("id") id: string,
    @Body() dto: UpdateSpecialistProfileDto,
    @Request() req: any,
  ) {
    if (!id?.trim()) throw new BadRequestException("Invalid specialist ID");
    return this.marketplaceProfileService.updateProfile(id, req.user.id, dto as any);
  }

  /**
   * POST /marketplace/my-profile/specialists/:id/case-studies
   * Add case study to portfolio
   */
  @Post("my-profile/specialists/:id/case-studies")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add case study" })
  async addCaseStudy(
    @Param("id") id: string,
    @Body() dto: AddCaseStudyDto,
    @Request() req: any,
  ) {
    if (!id?.trim()) throw new BadRequestException("Invalid specialist ID");
    if (!dto.title || !dto.industry || !dto.platform) {
      throw new BadRequestException("title, industry, and platform are required");
    }
    const caseStudy = await this.marketplaceProfileService.addCaseStudy(id, req.user.id, dto as any);
    return {
      id: caseStudy.id,
      status: "pending_review" as const,
      title: caseStudy.title,
      industry: caseStudy.industry,
      platform: caseStudy.platform,
      createdAt: caseStudy.createdAt,
    };
  }

  /**
   * GET /marketplace/my-profile/specialists/:id/analytics
   * Get specialist analytics dashboard
   */
  @Get("my-profile/specialists/:id/analytics")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get specialist analytics" })
  @ApiQuery({ name: "period", required: false, enum: ["7d", "30d", "90d", "all"] })
  async getAnalytics(
    @Param("id") id: string,
    @Query("period") period: string = "30d",
    @Request() req: any,
  ) {
    if (!id?.trim()) throw new BadRequestException("Invalid specialist ID");
    return this.marketplacePerformanceService.getAnalytics(id, req.user.id, period);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // ADMIN ENDPOINTS
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * POST /marketplace/admin/specialists/:id/sync-performance
   */
  @Post("admin/specialists/:id/sync-performance")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Sync specialist performance" })
  async syncPerformance(
    @Param("id") id: string,
    @Body() dto: SyncPerformanceDto,
    @Request() req: any,
  ) {
    if (!id?.trim()) throw new BadRequestException("Invalid specialist ID");
    if (!dto.platform) throw new BadRequestException("platform is required");
    const workspaceId = req.user?.workspaceId;
    try {
      return await this.marketplaceAdminService.syncPerformance(id, dto.platform, dto.force ?? false, workspaceId);
    } catch (err: any) {
      if (err instanceof NotFoundException || err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err?.message ?? `Failed to sync performance for specialist ${id}`);
    }
  }

  /**
   * POST /marketplace/admin/specialists/:id/verify-performance
   */
  @Post("admin/specialists/:id/verify-performance")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify performance data" })
  async verifyPerformance(@Param("id") id: string, @Body() dto: VerifyPerformanceDto) {
    if (!id?.trim()) throw new BadRequestException("Invalid specialist ID");
    const status = dto.verified ? "verified" : "rejected";
    const score = dto.fraudRiskLevel ?? 0;
    const fraudRiskLevel =
      score <= 0.25 ? "low" : score <= 0.5 ? "medium" : score <= 0.75 ? "high" : "critical";
    return { status, fraudRiskLevel };
  }

  /**
   * GET /marketplace/admin/specialists/sync-status
   */
  @Get("admin/specialists/sync-status")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get sync status" })
  @ApiQuery({ name: "status", required: false, enum: ["pending", "in_progress", "completed", "failed"] })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getSyncStatus(@Query("status") status?: string, @Query("limit") limit?: string) {
    const validStatuses = ["pending", "in_progress", "completed", "failed"];
    if (status && !validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Use: ${validStatuses.join(", ")}`);
    }
    const parsedLimit = limit ? parseInt(limit, 10) : 100;
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
      throw new BadRequestException("limit must be between 1 and 1000");
    }
    return this.marketplaceAdminService.getSyncStatus(status as any, parsedLimit);
  }

  /**
   * POST /marketplace/admin/certifications
   * Create new certification type
   */
  @Post("admin/certifications")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create certification type" })
  async createCertification(@Body() dto: CreateCertificationDto) {
    if (!dto.name || !dto.issuer) throw new BadRequestException("name and issuer are required");
    const cert = await this.marketplaceAdminService.createCertification({
      name: dto.name,
      issuer: dto.issuer,
      description: dto.description,
      iconUrl: dto.iconUrl,
      badgeColor: dto.badgeColor,
    });
    return { id: cert.id, name: cert.name, issuer: cert.issuer };
  }

  /**
   * POST /marketplace/admin/specialists/:id/certifications/:certId/verify
   * Verify specialist certification
   */
  @Post("admin/specialists/:id/certifications/:certId/verify")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify specialist certification" })
  async verifyCertification(
    @Param("id") id: string,
    @Param("certId") certId: string,
    @Body() dto: VerifyCertificationDto,
    @Request() req: any,
  ) {
    if (!id?.trim()) throw new BadRequestException("Invalid specialist ID");
    if (!certId?.trim()) throw new BadRequestException("Invalid certification ID");
    return this.marketplaceAdminService.verifyCertification(id, certId, dto as any, req.user.id);
  }
}
