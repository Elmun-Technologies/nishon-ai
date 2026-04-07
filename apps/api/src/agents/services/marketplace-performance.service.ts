import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentProfile } from '../entities/agent-profile.entity';
import { AgentPlatformMetrics } from '../entities/agent-platform-metrics.entity';
import { AgentHistoricalPerformance } from '../entities/agent-historical-performance.entity';

export interface AnalyticsResult {
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
  timeline: Array<{ date: string; views: number; impressions: number; contacts: number }>;
}

/**
 * MarketplacePerformanceService — aggregates analytics for a specialist's dashboard.
 *
 * Pulls from:
 * - AgentProfile.pageViewCount (total views)
 * - AgentPlatformMetrics (real ad performance by platform)
 * - AgentHistoricalPerformance (monthly trends)
 *
 * Analytics are computed from real data where available,
 * with sensible defaults (zeros) for new profiles with no data yet.
 */
@Injectable()
export class MarketplacePerformanceService {
  private readonly logger = new Logger(MarketplacePerformanceService.name);

  constructor(
    @InjectRepository(AgentProfile)
    private readonly profileRepo: Repository<AgentProfile>,
    @InjectRepository(AgentPlatformMetrics)
    private readonly metricsRepo: Repository<AgentPlatformMetrics>,
    @InjectRepository(AgentHistoricalPerformance)
    private readonly historyRepo: Repository<AgentHistoricalPerformance>,
  ) {}

  /**
   * Get profile analytics for the authenticated owner.
   *
   * @param profileId  - Specialist profile ID
   * @param userId     - Requesting user (must be owner)
   * @param period     - Time window: '7d' | '30d' | '90d' | 'all'
   */
  async getAnalytics(
    profileId: string,
    userId: string,
    period: string = '30d',
  ): Promise<AnalyticsResult> {
    // Verify ownership
    const profile = await this.profileRepo.findOne({ where: { id: profileId } });
    if (!profile) throw new NotFoundException(`Specialist profile ${profileId} not found`);
    if (profile.ownerId !== userId) throw new ForbiddenException('You do not have access to this profile');

    // Resolve how many months of history to pull
    const monthsBack = this.periodToMonths(period);

    // Pull platform metrics for the period
    const metrics = await this.metricsRepo
      .createQueryBuilder('m')
      .where('m.agentProfileId = :profileId', { profileId })
      .orderBy('m.aggregationPeriod', 'DESC')
      .limit(monthsBack)
      .getMany();

    // Pull historical performance
    const history = await this.historyRepo
      .createQueryBuilder('h')
      .where('h.agentProfileId = :profileId', { profileId })
      .orderBy('h.yearMonth', 'DESC')
      .limit(monthsBack)
      .getMany();

    // ── Aggregate totals ────────────────────────────────────────────────────

    const totalViews = profile.pageViewCount ?? 0;
    const totalCampaigns = metrics.reduce((s, m) => s + m.campaignsCount, 0);
    const totalSpend = metrics.reduce((s, m) => s + Number(m.totalSpend ?? 0), 0);

    // Trend = difference between most recent month and previous month (%)
    const viewsTrend = this.calcTrend(
      history[0]?.totalCampaigns ?? 0,
      history[1]?.totalCampaigns ?? 0,
    );

    const impressions = metrics.reduce((s, m) => {
      const ctr = Number(m.avgCtr ?? 0) / 100;
      const est = ctr > 0 ? Number(m.totalSpend ?? 0) / ctr : 0;
      return s + est;
    }, 0);

    const contacts = 0; // Will be wired when ServiceEngagement query added
    const engagement = totalCampaigns;
    const conversion = metrics.reduce((s, m) => s + Number(m.conversionCount ?? 0), 0);

    // ── Build timeline ──────────────────────────────────────────────────────

    const timeline = history.slice(0, monthsBack).reverse().map((h) => ({
      date: h.yearMonth,
      views: Math.round(totalViews / Math.max(history.length, 1)),
      impressions: 0,
      contacts: 0,
    }));

    return {
      profileViews: totalViews,
      profileViewsTrend: viewsTrend,
      impressions: Math.round(impressions),
      impressionsTrend: 0,
      contacts,
      contactsTrend: 0,
      engagement,
      engagementTrend: this.calcTrend(
        history[0]?.totalCampaigns ?? 0,
        history[1]?.totalCampaigns ?? 0,
      ),
      conversion,
      conversionTrend: 0,
      timeline,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private periodToMonths(period: string): number {
    switch (period) {
      case '7d':  return 1;
      case '30d': return 1;
      case '90d': return 3;
      case 'all': return 24;
      default:    return 1;
    }
  }

  /** Returns % change from prev to current. Returns 0 if prev is 0. */
  private calcTrend(current: number, prev: number): number {
    if (prev === 0) return 0;
    return Math.round(((current - prev) / prev) * 100);
  }
}
