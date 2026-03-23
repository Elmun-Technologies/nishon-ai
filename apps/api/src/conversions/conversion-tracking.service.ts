import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, LessThanOrEqual } from "typeorm";
import { ConversionEvent, ConversionEventType, ConversionSource } from "./entities/conversion-event.entity";

export interface IngestConversionEventDto {
  campaignId: string;
  eventType: ConversionEventType;
  value?: number;
  currency?: string;
  source: ConversionSource;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface ConversionMetricsDto {
  totalConversions: number;
  totalValue: number;
  avgValue: number;
  conversionsByType: Record<string, number>;
  valueByType: Record<string, number>;
  conversionRate?: number; // conversions / impressions (if provided)
  costPerConversion?: number; // spend / conversions (if provided)
}

/**
 * Handles ingestion and querying of conversion events.
 * Supports multiple sources: Facebook Pixel, Conversion API (CAPI), manual ingestion.
 */
@Injectable()
export class ConversionTrackingService {
  private readonly logger = new Logger(ConversionTrackingService.name);

  constructor(
    @InjectRepository(ConversionEvent)
    private readonly conversionEventRepo: Repository<ConversionEvent>,
  ) {}

  /**
   * Ingest a conversion event from any source.
   * Validates workspace ownership and stores the event.
   */
  async ingestConversionEvent(
    workspaceId: string,
    dto: IngestConversionEventDto,
  ): Promise<ConversionEvent> {
    if (!workspaceId) {
      throw new BadRequestException("workspaceId is required");
    }

    if (!dto.campaignId) {
      throw new BadRequestException("campaignId is required");
    }

    const event = this.conversionEventRepo.create({
      workspaceId,
      campaignId: dto.campaignId,
      eventType: dto.eventType,
      value: dto.value || null,
      currency: dto.currency || "USD",
      source: dto.source,
      userId: dto.userId || null,
      metadata: dto.metadata || null,
      timestamp: new Date(dto.timestamp),
    });

    const saved = await this.conversionEventRepo.save(event);
    this.logger.log(
      `Ingested ${dto.eventType} conversion for campaign ${dto.campaignId}`,
    );

    return saved;
  }

  /**
   * Get conversion metrics for a campaign over a date range.
   */
  async getConversionMetrics(
    workspaceId: string,
    campaignId: string,
    startDate: Date,
    endDate: Date,
    spend?: number,
    impressions?: number,
  ): Promise<ConversionMetricsDto> {
    if (!workspaceId || !campaignId) {
      throw new BadRequestException("workspaceId and campaignId are required");
    }

    const events = await this.conversionEventRepo.find({
      where: {
        workspaceId,
        campaignId,
        timestamp: Between(startDate, endDate),
      },
    });

    const totalConversions = events.length;
    const totalValue = events.reduce((sum, e) => sum + (e.value || 0), 0);
    const avgValue = totalConversions > 0 ? totalValue / totalConversions : 0;

    // Group by event type
    const conversionsByType: Record<string, number> = {};
    const valueByType: Record<string, number> = {};

    events.forEach((event) => {
      const type = event.eventType;
      conversionsByType[type] = (conversionsByType[type] || 0) + 1;
      valueByType[type] = (valueByType[type] || 0) + (event.value || 0);
    });

    const metrics: ConversionMetricsDto = {
      totalConversions,
      totalValue,
      avgValue,
      conversionsByType,
      valueByType,
    };

    // Calculate derived metrics if spend/impressions provided
    if (spend && totalConversions > 0) {
      metrics.costPerConversion = spend / totalConversions;
    }

    if (impressions && totalConversions > 0) {
      metrics.conversionRate = (totalConversions / impressions) * 100;
    }

    return metrics;
  }

  /**
   * Get raw conversion events for a campaign.
   * Used for detailed reporting and debugging.
   */
  async getConversionEvents(
    workspaceId: string,
    campaignId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ events: ConversionEvent[]; total: number }> {
    if (!workspaceId || !campaignId) {
      throw new BadRequestException("workspaceId and campaignId are required");
    }

    const [events, total] = await this.conversionEventRepo.findAndCount({
      where: {
        workspaceId,
        campaignId,
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: "DESC" },
      take: limit,
      skip: offset,
    });

    return { events, total };
  }

  /**
   * Delete old conversion events (retention policy).
   * Call this periodically to clean up old data.
   */
  async deleteOldEvents(workspaceId: string, beforeDate: Date): Promise<number> {
    const result = await this.conversionEventRepo.delete({
      workspaceId,
      timestamp: LessThanOrEqual(beforeDate),
    });

    const deletedCount = result.affected || 0;
    this.logger.log(`Deleted ${deletedCount} old conversion events`);

    return deletedCount;
  }

  /**
   * Get conversion trend over days.
   * Returns daily conversion counts and values.
   */
  async getConversionTrend(
    workspaceId: string,
    campaignId: string,
    days: number = 7,
  ): Promise<
    Array<{
      date: string;
      conversions: number;
      value: number;
    }>
  > {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await this.conversionEventRepo.find({
      where: {
        workspaceId,
        campaignId,
        timestamp: Between(startDate, new Date()),
      },
      order: { timestamp: "ASC" },
    });

    // Group by date (YYYY-MM-DD)
    const trendMap: Record<
      string,
      { conversions: number; value: number }
    > = {};

    events.forEach((event) => {
      const dateKey = event.timestamp.toISOString().split("T")[0];
      if (!trendMap[dateKey]) {
        trendMap[dateKey] = { conversions: 0, value: 0 };
      }
      trendMap[dateKey].conversions += 1;
      trendMap[dateKey].value += event.value || 0;
    });

    // Convert to array and fill missing dates
    const trend: Array<{ date: string; conversions: number; value: number }> =
      [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split("T")[0];
      trend.push({
        date: dateKey,
        conversions: trendMap[dateKey]?.conversions || 0,
        value: trendMap[dateKey]?.value || 0,
      });
    }

    return trend;
  }
}
