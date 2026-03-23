import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
  Logger,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiParam,
} from "@nestjs/swagger";
import { Request } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConversionTrackingService } from "./conversion-tracking.service";
import { ConversionEventType, ConversionSource } from "./entities/conversion-event.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { User } from "../users/entities/user.entity";

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

  private getRequestUserId(req: Request): string {
    const user = (req as any).user as User | undefined;
    if (!user?.id) throw new UnauthorizedException("Authenticated user not found in request");
    return user.id;
  }

  private async assertWorkspaceOwnership(workspaceId: string, userId: string): Promise<void> {
    const workspace = await this.workspaceRepo.findOne({ where: { id: workspaceId } });
    if (!workspace) throw new ForbiddenException("Workspace not found");
    if (workspace.userId !== userId) throw new ForbiddenException("You do not own this workspace");
  }

  @Post("track")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Track a conversion event" })
  @ApiQuery({ name: "workspaceId", required: true, type: String })
  @ApiResponse({ status: 201, description: "Conversion event recorded" })
  @ApiResponse({ status: 400, description: "Invalid request" })
  @ApiResponse({ status: 403, description: "Workspace ownership mismatch" })
  async trackConversion(
    @Req() req: Request,
    @Query("workspaceId") workspaceId: string,
    @Body() dto: {
      campaignId: string;
      eventType: ConversionEventType;
      value?: number;
      currency?: string;
      source: ConversionSource;
      userId?: string;
      metadata?: Record<string, any>;
      timestamp?: string;
    },
  ) {
    if (!workspaceId) throw new BadRequestException("workspaceId query parameter is required");
    await this.assertWorkspaceOwnership(workspaceId, this.getRequestUserId(req));

    const event = await this.conversionTrackingService.ingestConversionEvent(workspaceId, {
      campaignId: dto.campaignId,
      eventType: dto.eventType,
      value: dto.value,
      currency: dto.currency,
      source: dto.source,
      userId: dto.userId,
      metadata: dto.metadata,
      timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
    });

    return { success: true, event };
  }

  @Get("metrics/:campaignId")
  @ApiOperation({ summary: "Get conversion metrics for a campaign" })
  @ApiParam({ name: "campaignId", type: String })
  @ApiQuery({ name: "workspaceId", required: true, type: String })
  @ApiQuery({ name: "startDate", required: true, type: String })
  @ApiQuery({ name: "endDate", required: true, type: String })
  @ApiQuery({ name: "spend", required: false, type: Number })
  @ApiQuery({ name: "impressions", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Conversion metrics returned" })
  async getConversionMetrics(
    @Req() req: Request,
    @Param("campaignId") campaignId: string,
    @Query("workspaceId") workspaceId: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Query("spend") spend?: string,
    @Query("impressions") impressions?: string,
  ) {
    if (!workspaceId) throw new BadRequestException("workspaceId is required");
    await this.assertWorkspaceOwnership(workspaceId, this.getRequestUserId(req));

    const start = new Date(startDate + "T00:00:00Z");
    const end = new Date(endDate + "T23:59:59Z");
    if (start > end) throw new BadRequestException("startDate must be before endDate");

    const metrics = await this.conversionTrackingService.getConversionMetrics(
      workspaceId,
      campaignId,
      start,
      end,
      spend ? parseFloat(spend) : undefined,
      impressions ? parseInt(impressions) : undefined,
    );

    return { success: true, campaignId, startDate, endDate, metrics };
  }

  @Get("trend/:campaignId")
  @ApiOperation({ summary: "Get conversion trend for a campaign" })
  @ApiParam({ name: "campaignId", type: String })
  @ApiQuery({ name: "workspaceId", required: true, type: String })
  @ApiQuery({ name: "days", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Conversion trend returned" })
  async getConversionTrend(
    @Req() req: Request,
    @Param("campaignId") campaignId: string,
    @Query("workspaceId") workspaceId: string,
    @Query("days") daysStr?: string,
  ) {
    if (!workspaceId) throw new BadRequestException("workspaceId is required");
    await this.assertWorkspaceOwnership(workspaceId, this.getRequestUserId(req));

    const days = daysStr ? parseInt(daysStr) : 7;
    if (days < 1 || days > 365) throw new BadRequestException("days must be between 1 and 365");

    const trend = await this.conversionTrackingService.getConversionTrend(workspaceId, campaignId, days);
    return { success: true, campaignId, days, trend };
  }

  @Get("events/:campaignId")
  @ApiOperation({ summary: "Get conversion events for a campaign" })
  @ApiParam({ name: "campaignId", type: String })
  @ApiQuery({ name: "workspaceId", required: true, type: String })
  @ApiQuery({ name: "startDate", required: true, type: String })
  @ApiQuery({ name: "endDate", required: true, type: String })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Conversion events returned" })
  async getConversionEvents(
    @Req() req: Request,
    @Param("campaignId") campaignId: string,
    @Query("workspaceId") workspaceId: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Query("limit") limitStr?: string,
    @Query("offset") offsetStr?: string,
  ) {
    if (!workspaceId) throw new BadRequestException("workspaceId is required");
    await this.assertWorkspaceOwnership(workspaceId, this.getRequestUserId(req));

    const start = new Date(startDate + "T00:00:00Z");
    const end = new Date(endDate + "T23:59:59Z");
    const limit = limitStr ? parseInt(limitStr) : 100;
    const offset = offsetStr ? parseInt(offsetStr) : 0;

    const { events, total } = await this.conversionTrackingService.getConversionEvents(
      workspaceId,
      campaignId,
      start,
      end,
      limit,
      offset,
    );

    return { success: true, campaignId, startDate, endDate, limit, offset, total, events };
  }
}
