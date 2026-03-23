import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, IsNull, Not } from "typeorm";
import { MetaInsight } from "../meta/entities/meta-insight.entity";

export interface ConversionSummaryDto {
  totalConversions: number;
  totalConversionValue: number;
  avgConversionValue: number;
  costPerConversion: number; // spend / conversions
  conversionRateByClicks: number; // conversions / clicks
  totalSpend: number;
  totalClicks: number;
}

export interface ConvertingAdSetDto {
  campaignId: string;
  conversionCount: number;
  conversionValue: number;
  avgValue: number;
  costPerConversion: number;
  totalSpend: number;
}

export interface ConversionTrendDto {
  date: string; // YYYY-MM-DD
  conversions: number;
  conversionValue: number;
  spend: number;
  clicks: number;
  costPerConversion: number;
}

/**
 * Provides aggregated conversion analytics from Meta insights.
 * Queries the meta_insights table for conversion data and returns
 * dashboard-ready metrics.
 */
@Injectable()
export class ConversionAnalyticsService {
  private readonly logger = new Logger(ConversionAnalyticsService.name);

  constructor(
    @InjectRepository(MetaInsight)
    private readonly insightRepo: Repository<MetaInsight>,
  ) {}

  /**
   * Get conversion summary for a single campaign over a date range.
   */
  async getConversionSummary(
    workspaceId: string,
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ConversionSummaryDto> {
    const insights = await this.insightRepo.find({
      where: {
        workspaceId,
        campaignId,
        date: Between(startDate, endDate),
      },
    });

    const totalConversions = insights.reduce((sum, i) => sum + i.conversions, 0);
    const totalConversionValue = insights.reduce(
      (sum, i) => sum + Number(i.conversionValue),
      0,
    );
    const totalSpend = insights.reduce((sum, i) => sum + Number(i.spend), 0);
    const totalClicks = insights.reduce((sum, i) => sum + i.clicks, 0);

    const avgConversionValue =
      totalConversions > 0 ? totalConversionValue / totalConversions : 0;
    const costPerConversion =
      totalConversions > 0 ? totalSpend / totalConversions : 0;
    const conversionRateByClicks =
      totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    return {
      totalConversions,
      totalConversionValue,
      avgConversionValue,
      costPerConversion,
      conversionRateByClicks,
      totalSpend,
      totalClicks,
    };
  }

  /**
   * Get top converting ad sets (campaigns) for a workspace.
   * Sorted by conversion rate (conversions / clicks).
   */
  async getTopConvertingCampaigns(
    workspaceId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10,
  ): Promise<ConvertingAdSetDto[]> {
    // Aggregate insights by campaign
    const insights = await this.insightRepo.find({
      where: {
        workspaceId,
        date: Between(startDate, endDate),
      },
    });

    // Group by campaignId
    const campaignMap: Map<string, MetaInsight[]> = new Map();
    insights.forEach((insight) => {
      if (!campaignMap.has(insight.campaignId)) {
        campaignMap.set(insight.campaignId, []);
      }
      campaignMap.get(insight.campaignId)!.push(insight);
    });

    // Aggregate and sort by conversion rate
    const results: ConvertingAdSetDto[] = Array.from(campaignMap.entries())
      .map(([campaignId, campaignInsights]) => {
        const conversionCount = campaignInsights.reduce(
          (sum, i) => sum + i.conversions,
          0,
        );
        const conversionValue = campaignInsights.reduce(
          (sum, i) => sum + Number(i.conversionValue),
          0,
        );
        const totalSpend = campaignInsights.reduce(
          (sum, i) => sum + Number(i.spend),
          0,
        );

        const avgValue =
          conversionCount > 0 ? conversionValue / conversionCount : 0;
        const costPerConversion =
          conversionCount > 0 ? totalSpend / conversionCount : 0;

        return {
          campaignId,
          conversionCount,
          conversionValue,
          avgValue,
          costPerConversion,
          totalSpend,
        };
      })
      .sort((a, b) => b.conversionCount - a.conversionCount)
      .slice(0, limit);

    return results;
  }

  /**
   * Get daily conversion trend for a campaign.
   * Returns conversion count, value, spend, and CPA for each day.
   */
  async getConversionTrend(
    workspaceId: string,
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ConversionTrendDto[]> {
    const insights = await this.insightRepo.find({
      where: {
        workspaceId,
        campaignId,
        date: Between(startDate, endDate),
      },
      order: { date: "ASC" },
    });

    return insights.map((insight) => ({
      date: insight.date.toISOString().split("T")[0],
      conversions: insight.conversions,
      conversionValue: Number(insight.conversionValue),
      spend: Number(insight.spend),
      clicks: insight.clicks,
      costPerConversion:
        insight.conversions > 0
          ? Number(insight.spend) / insight.conversions
          : 0,
    }));
  }

  /**
   * Calculate conversion metrics comparison between two periods.
   * Returns change deltas (% change) for key metrics.
   */
  async compareConversionPeriods(
    workspaceId: string,
    campaignId: string,
    period1Start: Date,
    period1End: Date,
    period2Start: Date,
    period2End: Date,
  ): Promise<{
    period1: ConversionSummaryDto;
    period2: ConversionSummaryDto;
    changes: {
      conversionsDelta: number; // percentage
      spendDelta: number; // percentage
      cpaDelta: number; // percentage
    };
  }> {
    const period1 = await this.getConversionSummary(
      workspaceId,
      campaignId,
      period1Start,
      period1End,
    );

    const period2 = await this.getConversionSummary(
      workspaceId,
      campaignId,
      period2Start,
      period2End,
    );

    const conversionsDelta =
      period1.totalConversions > 0
        ? ((period2.totalConversions - period1.totalConversions) /
            period1.totalConversions) *
          100
        : 0;

    const spendDelta =
      period1.totalSpend > 0
        ? ((period2.totalSpend - period1.totalSpend) / period1.totalSpend) * 100
        : 0;

    const cpaDelta =
      period1.costPerConversion > 0
        ? ((period2.costPerConversion - period1.costPerConversion) /
            period1.costPerConversion) *
          100
        : 0;

    return {
      period1,
      period2,
      changes: {
        conversionsDelta,
        spendDelta,
        cpaDelta,
      },
    };
  }

  /**
   * Get campaigns with declining conversion rates (potential optimization targets).
   */
  async getDecli ningConversionCampaigns(
    workspaceId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<
    Array<{
      campaignId: string;
      currentConversionRate: number;
      previousConversionRate: number;
      decline: number; // percentage points
    }>
  > {
    const midpoint = new Date(
      (startDate.getTime() + endDate.getTime()) / 2,
    );

    const currentPeriodInsights = await this.insightRepo.find({
      where: {
        workspaceId,
        date: Between(midpoint, endDate),
      },
    });

    const previousPeriodInsights = await this.insightRepo.find({
      where: {
        workspaceId,
        date: Between(startDate, midpoint),
      },
    });

    // Group by campaign and calculate conversion rates
    const currentRates: Map<string, { conversions: number; clicks: number }> =
      new Map();
    const previousRates: Map<string, { conversions: number; clicks: number }> =
      new Map();

    currentPeriodInsights.forEach((insight) => {
      if (!currentRates.has(insight.campaignId)) {
        currentRates.set(insight.campaignId, {
          conversions: 0,
          clicks: 0,
        });
      }
      const rate = currentRates.get(insight.campaignId)!;
      rate.conversions += insight.conversions;
      rate.clicks += insight.clicks;
    });

    previousPeriodInsights.forEach((insight) => {
      if (!previousRates.has(insight.campaignId)) {
        previousRates.set(insight.campaignId, {
          conversions: 0,
          clicks: 0,
        });
      }
      const rate = previousRates.get(insight.campaignId)!;
      rate.conversions += insight.conversions;
      rate.clicks += insight.clicks;
    });

    const decliningCampaigns: Array<{
      campaignId: string;
      currentConversionRate: number;
      previousConversionRate: number;
      decline: number;
    }> = [];

    previousRates.forEach((prev, campaignId) => {
      const curr = currentRates.get(campaignId);
      if (!curr) return; // Skip if not in current period

      const prevRate = prev.clicks > 0 ? (prev.conversions / prev.clicks) * 100 : 0;
      const currRate = curr.clicks > 0 ? (curr.conversions / curr.clicks) * 100 : 0;

      if (currRate < prevRate) {
        decliningCampaigns.push({
          campaignId,
          currentConversionRate: currRate,
          previousConversionRate: prevRate,
          decline: prevRate - currRate,
        });
      }
    });

    return decliningCampaigns.sort((a, b) => b.decline - a.decline);
  }
}
