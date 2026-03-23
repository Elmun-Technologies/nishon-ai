import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  Logger,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiParam,
} from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConversionTrackingService } from "./conversion-tracking.service";
import { ConversionEvent, ConversionEventType, ConversionSource } from "./entities/conversion-event.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { User } from "../users/entities/user.entity";

interface TrackConversionRequest {
  campaignId: string;
  eventType: ConversionEventType;
  value?: number;
  currency?: string;
  source: ConversionSource;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp?: string; // ISO 8601 string
}

interface ConversionMetricsQuery {
  campaignId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  spend?: number;
  impressions?: number;
}

/**
 * Conversion tracking endpoints.
 * Handles ingestion of conversion events and retrieval of conversion metrics.
 *
 * Auth:
 * - POST /conversions/track requires workspace ownership (JWT guard + workspace validation)
 * - GET endpoints require JWT guard + workspace validation
 */
@ApiTags("Conversions")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("conversions")
export class ConversionTrackingController {
  private readonly logger = new Logger(ConversionTrackingController.name);

  constructor(
    private readonly conversionTrackingService: ConversionTrackingService,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
  ) {}

  /**
   * Ingest a conversion event from Pixel, CAPI, or manual API.
   * Validates workspace ownership before storing.
   */
  @Post("track")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Track a conversion event",
    description:
      "Accept conversion events from Facebook Pixel, Conversion API (CAPI), or manual ingestion",
  })
  @ApiBody({ type: TrackConversionRequest })
  @ApiResponse({
    status: 201,
    description: "Conversion event recorded successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid request" })
  @ApiResponse({ status: 403, description: "Workspace ownership mismatch" })
  async trackConversion(
    @CurrentUser() user: User,
    @Query("workspaceId") workspaceId: string,
    @Body() dto: TrackConversionRequest,
  ) {
    // Validate workspace ownership
    if (!workspaceId) {
      throw new BadRequestException("workspaceId query parameter is required");
    }

    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new ForbiddenException("Workspace not found");
    }

    if (workspace.ownerId !== user.id) {
      throw new ForbiddenException("You do not own this workspace");
    }

    // Ingest event
    const event = await this.conversionTrackingService.ingestConversionEvent(
      workspaceId,
      {
        campaignId: dto.campaignId,
        eventType: dto.eventType,
        value: dto.value,
        currency: dto.currency,
        source: dto.source,
        userId: dto.userId,
        metadata: dto.metadata,
        timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
      },
    );

    return {
      success: true,
      event,
    };
  }

  /**
   * Get conversion metrics for a campaign.
   * Returns aggregated conversion stats (count, value, CPA, etc.).
   */
  @Get("metrics/:campaignId")
  @ApiOperation({
    summary: "Get conversion metrics for a campaign",
    description:
      "Retrieve aggregated conversion metrics including count, value, CPA, and conversion rate",
  })
  @ApiParam({
    name: "campaignId",
    description: "Meta campaign ID",
    type: String,
  })
  @ApiQuery({
    name: "workspaceId",
    description: "Workspace ID",
    required: true,
    type: String,
  })
  @ApiQuery({
    name: "startDate",
    description: "Start date (YYYY-MM-DD)",
    required: true,
    type: String,
  })
  @ApiQuery({
    name: "endDate",
    description: "End date (YYYY-MM-DD)",
    required: true,
    type: String,
  })
  @ApiQuery({
    name: "spend",
    description: "Total spend (optional, for CPA calculation)",
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: "impressions",
    description: "Total impressions (optional, for conversion rate calculation)",
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Conversion metrics returned successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid parameters" })
  @ApiResponse({ status: 403, description: "Workspace ownership mismatch" })
  async getConversionMetrics(
    @CurrentUser() user: User,
    @Param("campaignId") campaignId: string,
    @Query("workspaceId") workspaceId: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Query("spend") spend?: string,
    @Query("impressions") impressions?: string,
  ) {
    // Validate workspace ownership
    if (!workspaceId) {
      throw new BadRequestException("workspaceId query parameter is required");
    }

    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new ForbiddenException("Workspace not found");
    }

    if (workspace.ownerId !== user.id) {
      throw new ForbiddenException("You do not own this workspace");
    }

    // Parse dates
    const start = new Date(startDate + "T00:00:00Z");
    const end = new Date(endDate + "T23:59:59Z");

    if (start > end) {
      throw new BadRequestException("startDate must be before endDate");
    }

    // Get metrics
    const metrics = await this.conversionTrackingService.getConversionMetrics(
      workspaceId,
      campaignId,
      start,
      end,
      spend ? parseFloat(spend) : undefined,
      impressions ? parseInt(impressions) : undefined,
    );

    return {
      success: true,
      campaignId,
      startDate,
      endDate,
      metrics,
    };
  }

  /**
   * Get conversion trend over the last N days.
   * Returns daily conversion counts and values.
   */
  @Get("trend/:campaignId")
  @ApiOperation({
    summary: "Get conversion trend for a campaign",
    description: "Retrieve daily conversion counts and values over the specified period",
  })
  @ApiParam({
    name: "campaignId",
    description: "Meta campaign ID",
    type: String,
  })
  @ApiQuery({
    name: "workspaceId",
    description: "Workspace ID",
    required: true,
    type: String,
  })
  @ApiQuery({
    name: "days",
    description: "Number of days to look back (default: 7)",
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Conversion trend returned successfully",
  })
  async getConversionTrend(
    @CurrentUser() user: User,
    @Param("campaignId") campaignId: string,
    @Query("workspaceId") workspaceId: string,
    @Query("days") daysStr?: string,
  ) {
    // Validate workspace ownership
    if (!workspaceId) {
      throw new BadRequestException("workspaceId query parameter is required");
    }

    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new ForbiddenException("Workspace not found");
    }

    if (workspace.ownerId !== user.id) {
      throw new ForbiddenException("You do not own this workspace");
    }

    const days = daysStr ? parseInt(daysStr) : 7;

    if (days < 1 || days > 365) {
      throw new BadRequestException("days must be between 1 and 365");
    }

    const trend = await this.conversionTrackingService.getConversionTrend(
      workspaceId,
      campaignId,
      days,
    );

    return {
      success: true,
      campaignId,
      days,
      trend,
    };
  }

  /**
   * Get raw conversion events for detailed analysis.
   */
  @Get("events/:campaignId")
  @ApiOperation({
    summary: "Get conversion events for a campaign",
    description: "Retrieve detailed conversion event records",
  })
  @ApiParam({
    name: "campaignId",
    description: "Meta campaign ID",
    type: String,
  })
  @ApiQuery({
    name: "workspaceId",
    description: "Workspace ID",
    required: true,
    type: String,
  })
  @ApiQuery({
    name: "startDate",
    description: "Start date (YYYY-MM-DD)",
    required: true,
    type: String,
  })
  @ApiQuery({
    name: "endDate",
    description: "End date (YYYY-MM-DD)",
    required: true,
    type: String,
  })
  @ApiQuery({
    name: "limit",
    description: "Results per page (default: 100)",
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: "offset",
    description: "Pagination offset (default: 0)",
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Conversion events returned successfully",
  })
  async getConversionEvents(
    @CurrentUser() user: User,
    @Param("campaignId") campaignId: string,
    @Query("workspaceId") workspaceId: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Query("limit") limitStr?: string,
    @Query("offset") offsetStr?: string,
  ) {
    // Validate workspace ownership
    if (!workspaceId) {
      throw new BadRequestException("workspaceId query parameter is required");
    }

    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new ForbiddenException("Workspace not found");
    }

    if (workspace.ownerId !== user.id) {
      throw new ForbiddenException("You do not own this workspace");
    }

    // Parse dates
    const start = new Date(startDate + "T00:00:00Z");
    const end = new Date(endDate + "T23:59:59Z");

    const limit = limitStr ? parseInt(limitStr) : 100;
    const offset = offsetStr ? parseInt(offsetStr) : 0;

    const { events, total } =
      await this.conversionTrackingService.getConversionEvents(
        workspaceId,
        campaignId,
        start,
        end,
        limit,
        offset,
      );

    return {
      success: true,
      campaignId,
      startDate,
      endDate,
      limit,
      offset,
      total,
      events,
    };
  }
}
