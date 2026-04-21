import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MetaInsight } from "../meta/entities/meta-insight.entity";

export interface ConversionSummaryDto {
  totalConversions: number;
  totalConversionValue: number;
  avgConversionValue: number;
  costPerConversion: number;
  conversionRateByClicks: number;
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
  date: string;
  conversions: number;
  conversionValue: number;
  spend: number;
  clicks: number;
  costPerConversion: number;
}

/**
 * Provides aggregated conversion analytics from Meta insights.
 * All aggregations are pushed to the database to avoid loading large row sets
 * into application memory.
 */
@Injectable()
export class ConversionAnalyticsService {
  private readonly logger = new Logger(ConversionAnalyticsService.name);

  constructor(
    @InjectRepository(MetaInsight)
    private readonly insightRepo: Repository<MetaInsight>,
  ) {}

  async getConversionSummary(
    workspaceId: string,
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ConversionSummaryDto> {
    const raw = await this.insightRepo
      .createQueryBuilder("i")
      .select("COALESCE(SUM(i.conversions), 0)", "totalConversions")
      .addSelect("COALESCE(SUM(CAST(i.conversionValue AS decimal)), 0)", "totalConversionValue")
      .addSelect("COALESCE(SUM(CAST(i.spend AS decimal)), 0)", "totalSpend")
      .addSelect("COALESCE(SUM(i.clicks), 0)", "totalClicks")
      .where("i.workspaceId = :workspaceId", { workspaceId })
      .andWhere("i.campaignId = :campaignId", { campaignId })
      .andWhere("i.date BETWEEN :startDate AND :endDate", { startDate, endDate })
      .getRawOne();

    const totalConversions = Number(raw.totalConversions);
    const totalConversionValue = Number(raw.totalConversionValue);
    const totalSpend = Number(raw.totalSpend);
    const totalClicks = Number(raw.totalClicks);

    return {
      totalConversions,
      totalConversionValue,
      avgConversionValue: totalConversions > 0 ? totalConversionValue / totalConversions : 0,
      costPerConversion: totalConversions > 0 ? totalSpend / totalConversions : 0,
      conversionRateByClicks: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      totalSpend,
      totalClicks,
    };
  }

  async getTopConvertingCampaigns(
    workspaceId: string,
    startDate: Date,
    endDate: Date,
    limit = 10,
  ): Promise<ConvertingAdSetDto[]> {
    const rows = await this.insightRepo
      .createQueryBuilder("i")
      .select("i.campaignId", "campaignId")
      .addSelect("COALESCE(SUM(i.conversions), 0)", "conversionCount")
      .addSelect("COALESCE(SUM(CAST(i.conversionValue AS decimal)), 0)", "conversionValue")
      .addSelect("COALESCE(SUM(CAST(i.spend AS decimal)), 0)", "totalSpend")
      .where("i.workspaceId = :workspaceId", { workspaceId })
      .andWhere("i.date BETWEEN :startDate AND :endDate", { startDate, endDate })
      .groupBy("i.campaignId")
      .orderBy("SUM(i.conversions)", "DESC")
      .limit(limit)
      .getRawMany();

    return rows.map((row) => {
      const conversionCount = Number(row.conversionCount);
      const conversionValue = Number(row.conversionValue);
      const totalSpend = Number(row.totalSpend);

      return {
        campaignId: row.campaignId,
        conversionCount,
        conversionValue,
        avgValue: conversionCount > 0 ? conversionValue / conversionCount : 0,
        costPerConversion: conversionCount > 0 ? totalSpend / conversionCount : 0,
        totalSpend,
      };
    });
  }

  async getConversionTrend(
    workspaceId: string,
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ConversionTrendDto[]> {
    const insights = await this.insightRepo.find({
      where: { workspaceId, campaignId },
      order: { date: "ASC" },
      select: ["date", "conversions", "conversionValue", "spend", "clicks"],
    });

    // Filter by date range in memory after select to avoid TypeORM Between type issues
    // (date column is type 'date', not timestamp)
    return insights
      .filter((i) => i.date >= startDate && i.date <= endDate)
      .map((i) => ({
        date: i.date.toISOString().split("T")[0],
        conversions: i.conversions,
        conversionValue: Number(i.conversionValue),
        spend: Number(i.spend),
        clicks: i.clicks,
        costPerConversion: i.conversions > 0 ? Number(i.spend) / i.conversions : 0,
      }));
  }

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
    changes: { conversionsDelta: number; spendDelta: number; cpaDelta: number };
  }> {
    const [period1, period2] = await Promise.all([
      this.getConversionSummary(workspaceId, campaignId, period1Start, period1End),
      this.getConversionSummary(workspaceId, campaignId, period2Start, period2End),
    ]);

    const conversionsDelta =
      period1.totalConversions > 0
        ? ((period2.totalConversions - period1.totalConversions) / period1.totalConversions) * 100
        : 0;

    const spendDelta =
      period1.totalSpend > 0
        ? ((period2.totalSpend - period1.totalSpend) / period1.totalSpend) * 100
        : 0;

    const cpaDelta =
      period1.costPerConversion > 0
        ? ((period2.costPerConversion - period1.costPerConversion) / period1.costPerConversion) * 100
        : 0;

    return { period1, period2, changes: { conversionsDelta, spendDelta, cpaDelta } };
  }

  async getDecliningConversionCampaigns(
    workspaceId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{
    campaignId: string;
    currentConversionRate: number;
    previousConversionRate: number;
    decline: number;
  }>> {
    const midpoint = new Date((startDate.getTime() + endDate.getTime()) / 2);

    // Fetch both periods in a single query using conditional aggregation
    const rows = await this.insightRepo
      .createQueryBuilder("i")
      .select("i.campaignId", "campaignId")
      .addSelect(
        "COALESCE(SUM(CASE WHEN i.date >= :midpoint THEN i.conversions ELSE 0 END), 0)",
        "currentConversions",
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN i.date >= :midpoint THEN i.clicks ELSE 0 END), 0)",
        "currentClicks",
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN i.date < :midpoint THEN i.conversions ELSE 0 END), 0)",
        "previousConversions",
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN i.date < :midpoint THEN i.clicks ELSE 0 END), 0)",
        "previousClicks",
      )
      .where("i.workspaceId = :workspaceId", { workspaceId })
      .andWhere("i.date BETWEEN :startDate AND :endDate", { startDate, endDate })
      .setParameter("midpoint", midpoint)
      .groupBy("i.campaignId")
      .getRawMany();

    return rows
      .map((row) => {
        const currClicks = Number(row.currentClicks);
        const prevClicks = Number(row.previousClicks);
        const currRate = currClicks > 0 ? (Number(row.currentConversions) / currClicks) * 100 : 0;
        const prevRate = prevClicks > 0 ? (Number(row.previousConversions) / prevClicks) * 100 : 0;
        return {
          campaignId: row.campaignId,
          currentConversionRate: currRate,
          previousConversionRate: prevRate,
          decline: prevRate - currRate,
        };
      })
      .filter((r) => r.decline > 0)
      .sort((a, b) => b.decline - a.decline);
  }
}
