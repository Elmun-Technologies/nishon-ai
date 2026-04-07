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
   * Calculate date range from period string
   */
  private getDateRange(period: string = "30d"): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    const match = period.match(/(\d+)([dwmy])/);
    if (!match) return { start, end };

    const [, amount, unit] = match;
    const num = parseInt(amount, 10);

    switch (unit) {
      case "d":
        start.setDate(start.getDate() - num);
        break;
      case "w":
        start.setDate(start.getDate() - num * 7);
        break;
      case "m":
        start.setMonth(start.getMonth() - num);
        break;
      case "y":
        start.setFullYear(start.getFullYear() - num);
        break;
    }

    return { start, end };
  }

  /**
   * Get specialist analytics dashboard
   */
  async getAnalytics(
    id: string,
    userId: string,
    period: string = "30d",
  ) {
    const profile = await this.agentProfileRepository.findOne({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException("Specialist profile not found");
    }

    if (profile.ownerId !== userId) {
      throw new ForbiddenException("You do not have access to this profile");
    }

    const { start, end } = this.getDateRange(period);

    // Fetch analytics data for period
    const analytics = await this.analyticsRepository.find({
      where: {
        specialistId: id,
      },
      order: { date: "ASC" },
    });

    // Calculate aggregates
    const totalProfileViews = analytics.reduce(
      (sum, a) => sum + a.profileViews,
      0,
    );
    const totalImpressions = analytics.reduce(
      (sum, a) => sum + a.impressions,
      0,
    );
    const totalContacts = analytics.reduce((sum, a) => sum + a.contacts, 0);
    const avgEngagement =
      analytics.length > 0
        ? analytics.reduce((sum, a) => sum + Number(a.engagement), 0) /
          analytics.length
        : 0;
    const avgConversion =
      analytics.length > 0
        ? analytics.reduce((sum, a) => sum + Number(a.conversion), 0) /
          analytics.length
        : 0;

    // Calculate trends (current vs previous period)
    const midPoint = new Date(
      (start.getTime() + end.getTime()) / 2,
    );
    const currentPeriod = analytics.filter((a) => a.date >= midPoint);
    const previousPeriod = analytics.filter((a) => a.date < midPoint);

    const currentViews = currentPeriod.reduce(
      (sum, a) => sum + a.profileViews,
      0,
    );
    const previousViews = previousPeriod.reduce(
      (sum, a) => sum + a.profileViews,
      0,
    );
    const viewsTrend =
      previousViews > 0
        ? ((currentViews - previousViews) / previousViews) * 100
        : 0;

    this.logger.log(`Analytics fetched for specialist ${id} (period: ${period})`);

    return {
      period,
      dateRange: { start, end },
      aggregates: {
        profileViews: totalProfileViews,
        impressions: totalImpressions,
        contacts: totalContacts,
        avgEngagement: avgEngagement.toFixed(2),
        avgConversion: avgConversion.toFixed(2),
      },
      trends: {
        profileViews: {
          current: currentViews,
          previous: previousViews,
          percentageChange: viewsTrend.toFixed(2),
        },
      },
      timeline: analytics.map((a) => ({
        date: a.date,
        profileViews: a.profileViews,
        impressions: a.impressions,
        contacts: a.contacts,
        engagement: a.engagement,
        conversion: a.conversion,
      })),
      cachedStats: profile.cachedStats,
      cachedRating: profile.cachedRating,
      cachedReviewCount: profile.cachedReviewCount,
    };
  }
}
