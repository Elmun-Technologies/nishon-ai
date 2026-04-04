import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MetaAdsService } from "./meta-ads.service";
import { MetaSyncService } from "./meta-sync.service";
import { MetaAiEngineService, CampaignInsights } from "./meta-ai-engine.service";
import { MetaAdAccount } from "./entities/meta-ad-account.entity";
import { MetaCampaignSync } from "./entities/meta-campaign-sync.entity";
import { MetaInsight } from "./entities/meta-insight.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { User } from "../users/entities/user.entity";
import { ConversionAnalyticsService } from "../analytics/conversion-analytics.service";

// Maps the user-facing range shorthand to Meta's date_preset values
const RANGE_TO_DATE_PRESET: Record<string, string> = {
  "7d": "last_7d",
  "30d": "last_30d",
  "today": "today",
};

/**
 * All Meta Ads endpoints live under /meta.
 *
 * Auth strategy:
 * - JWT guard protects all routes (user must be logged in to Performa).
 * - Data endpoints (dashboard, sync) validate workspace OWNERSHIP against the JWT
 *   user to prevent cross-tenant data access — ForbiddenException if mismatch.
 * - Passthrough endpoints (ad-accounts, campaigns, insights) use a Meta token
 *   from the Authorization header or meta_access_token cookie.
 */
@ApiTags("Meta Ads")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("meta")
export class MetaController {
  private readonly logger = new Logger(MetaController.name);

  constructor(
    private readonly metaAdsService: MetaAdsService,
    private readonly metaSyncService: MetaSyncService,
    private readonly aiEngine: MetaAiEngineService,
    private readonly conversionAnalytics: ConversionAnalyticsService,
    @InjectRepository(MetaAdAccount)
    private readonly adAccountRepo: Repository<MetaAdAccount>,
    @InjectRepository(MetaCampaignSync)
    private readonly campaignRepo: Repository<MetaCampaignSync>,
    @InjectRepository(MetaInsight)
    private readonly insightRepo: Repository<MetaInsight>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
  ) {}

  // ─── Passthrough Graph API endpoints ────────────────────────────────────────

  @Get("ad-accounts")
  @ApiOperation({ summary: "List all Meta ad accounts for the authenticated token" })
  @ApiResponse({ status: 200, description: "Ad accounts returned successfully" })
  async getAdAccounts(
    @Headers("authorization") authorization?: string,
    @Req() req?: Request,
  ) {
    const accessToken = this.extractMetaToken(authorization, req);
    const accounts = await this.metaAdsService.getAdAccounts(accessToken);
    return { success: true, accounts };
  }

  @Get("campaigns")
  @ApiOperation({ summary: "List campaigns for a specific ad account" })
  @ApiQuery({ name: "accountId", description: "Meta ad account ID (act_xxx)" })
  async getCampaigns(
    @Query("accountId") accountId: string | undefined,
    @Headers("authorization") authorization?: string,
    @Req() req?: Request,
  ) {
    if (!accountId) throw new BadRequestException("accountId query parameter is required");
    const accessToken = this.extractMetaToken(authorization, req);
    const campaigns = await this.metaAdsService.getCampaigns(accountId, accessToken);
    return { success: true, campaigns };
  }

  @Get("insights")
  @ApiOperation({ summary: "Fetch raw campaign insights for an ad account" })
  @ApiQuery({ name: "accountId", description: "Meta ad account ID (act_xxx)" })
  @ApiQuery({
    name: "range",
    required: false,
    description: "Date range: 7d | 30d | today. Defaults to 30d.",
    enum: ["7d", "30d", "today"],
  })
  @ApiQuery({
    name: "datePreset",
    required: false,
    description: "Raw Meta date_preset value. Overridden by range if both provided.",
  })
  async getInsights(
    @Query("accountId") accountId: string | undefined,
    @Query("range") range?: string,
    @Query("datePreset") datePreset?: string,
    @Headers("authorization") authorization?: string,
    @Req() req?: Request,
  ) {
    if (!accountId) throw new BadRequestException("accountId query parameter is required");
    const accessToken = this.extractMetaToken(authorization, req);
    const resolvedPreset = this.resolveRange(range, datePreset);
    const insights = await this.metaAdsService.getInsights(accountId, accessToken, resolvedPreset);
    return { success: true, insights };
  }

  // ─── Sync ────────────────────────────────────────────────────────────────────

  @Post("sync")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Trigger a full Meta Ads data sync for a workspace",
    description:
      "Fetches all ad accounts, campaigns, and daily insights from the Meta Graph API " +
      "and upserts them into the local database. Fully idempotent — safe to call repeatedly.",
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["workspaceId"],
      properties: {
        workspaceId: { type: "string", description: "Performa workspace UUID" },
        accessToken: {
          type: "string",
          description: "Optional Meta access token override.",
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Sync completed" })
  async sync(
    @Body() body: { workspaceId?: string; accessToken?: string },
    @Req() req: Request,
  ) {
    if (!body.workspaceId) {
      throw new BadRequestException("workspaceId is required in the request body");
    }

    // Security: verify the authenticated user owns this workspace
    await this.assertWorkspaceOwnership(body.workspaceId, this.getRequestUserId(req));

    this.logger.log({ message: "Sync triggered", workspaceId: body.workspaceId });

    const result = await this.metaSyncService.syncWorkspace(
      body.workspaceId,
      body.accessToken,
    );

    return { success: true, result };
  }

  // ─── Dashboard ───────────────────────────────────────────────────────────────

  @Get("dashboard")
  @ApiOperation({
    summary: "Get enriched dashboard data for a workspace",
    description:
      "Returns all synced ad accounts and their campaigns for the workspace, enriched with " +
      "aggregated metrics and an AI health/action recommendation per campaign. " +
      "Only data for the requesting user's workspace is returned.",
  })
  @ApiQuery({ name: "workspaceId", description: "Performa workspace UUID" })
  @ApiResponse({
    status: 200,
    description: "Dashboard data — scoped to the requesting workspace only",
    schema: {
      example: {
        workspaceId: "ws_uuid",
        accounts: [
          {
            id: "act_123456789",
            name: "My Store – Main",
            currency: "USD",
            timezone: "America/New_York",
            campaigns: [
              {
                id: "120214192783690",
                name: "Black Friday – Retargeting",
                status: "ACTIVE",
                metrics: { spend: 87.5, clicks: 412, impressions: 12843, ctr: 3.21, cpc: 0.21 },
                ai: { health: "GOOD", action: "SCALE", reason: "High CTR and low CPC" },
              },
            ],
          },
        ],
      },
    },
  })
  async dashboard(
    @Query("workspaceId") workspaceId: string | undefined,
    @Req() req: Request,
  ) {
    if (!workspaceId) {
      throw new BadRequestException("workspaceId query parameter is required");
    }

    // Security: verify the authenticated user owns this workspace
    await this.assertWorkspaceOwnership(workspaceId, this.getRequestUserId(req));

    const accounts = await this.adAccountRepo.find({
      where: { workspaceId },
      order: { name: "ASC" },
    });

    const enrichedAccounts = await Promise.all(
      accounts.map((account) => this.buildAccountPayload(account, workspaceId)),
    );

    return { workspaceId, accounts: enrichedAccounts };
  }

  // ─── Private: dashboard builders ────────────────────────────────────────────

  private async buildAccountPayload(account: MetaAdAccount, workspaceId: string) {
    // Filter campaigns by both adAccountId AND workspaceId for strict isolation
    const campaigns = await this.campaignRepo.find({
      where: { adAccountId: account.id, workspaceId },
      order: { name: "ASC" },
    });

    const enrichedCampaigns = await Promise.all(
      campaigns.map((c) => this.buildCampaignPayload(c, workspaceId)),
    );

    return {
      id: account.id,
      name: account.name,
      currency: account.currency,
      timezone: account.timezone,
      campaigns: enrichedCampaigns,
    };
  }

  private async buildCampaignPayload(campaign: MetaCampaignSync, workspaceId: string) {
    const aggregated = await this.aggregateInsights(campaign.id, workspaceId);
    const aiResult = this.aiEngine.analyzeCampaign(aggregated);

    return {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      metrics: {
        spend: aggregated.spend,
        clicks: aggregated.clicks,
        impressions: aggregated.impressions,
        ctr: aggregated.ctr,
        cpc: aggregated.cpc,
      },
      ai: {
        health: aiResult.health,
        action: aiResult.action,
        reason: aiResult.reason,
      },
    };
  }

  /**
   * Aggregates all MetaInsight rows for a campaign into a single totals snapshot.
   * ALWAYS filters by workspaceId to enforce tenant isolation — even though the
   * campaign PK is already unique, an explicit workspaceId filter prevents any
   * edge-case data leaks during upsert race conditions.
   */
  private async aggregateInsights(
    campaignId: string,
    workspaceId: string,
  ): Promise<CampaignInsights> {
    const rows = await this.insightRepo.find({ where: { campaignId, workspaceId } });

    if (rows.length === 0) {
      return { campaignId, spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0 };
    }

    const spend = rows.reduce((s, r) => s + Number(r.spend), 0);
    const impressions = rows.reduce((s, r) => s + Number(r.impressions), 0);
    const clicks = rows.reduce((s, r) => s + Number(r.clicks), 0);

    // Recalculate from totals to avoid averaging-bias; guard against division by zero
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;

    return { campaignId, spend, impressions, clicks, ctr, cpc };
  }

  // ─── Top performing campaigns ────────────────────────────────────────────────

  @Get("top-ads")
  @ApiOperation({ summary: "Get top performing campaigns by CTR for a workspace" })
  @ApiQuery({ name: "workspaceId", description: "Performa workspace UUID" })
  @ApiQuery({ name: "limit", required: false, description: "Number of results (default 5)" })
  async topAds(
    @Query("workspaceId") workspaceId: string | undefined,
    @Query("limit") limit = "5",
    @Req() req: Request,
  ) {
    if (!workspaceId) throw new BadRequestException("workspaceId is required");
    await this.assertWorkspaceOwnership(workspaceId, this.getRequestUserId(req));

    const since = new Date();
    since.setDate(since.getDate() - 30);
    const n = Math.min(parseInt(limit) || 5, 20);

    // Aggregate by campaign: sum spend/clicks/impressions, avg CTR
    const rows = await this.insightRepo
      .createQueryBuilder("insight")
      .where("insight.workspaceId = :wid", { wid: workspaceId })
      .andWhere("insight.date >= :since", { since })
      .select([
        "insight.campaignId AS campaignId",
        'COALESCE(SUM(insight.spend), 0) AS "spend"',
        'COALESCE(SUM(insight.clicks), 0) AS "clicks"',
        'COALESCE(SUM(insight.impressions), 0) AS "impressions"',
        'CASE WHEN SUM(insight.impressions) > 0 THEN ROUND(SUM(insight.clicks)::numeric / SUM(insight.impressions) * 100, 2) ELSE 0 END AS "ctr"',
      ])
      .groupBy("insight.campaignId")
      .having("SUM(insight.impressions) > 0")
      .orderBy('"ctr"', "DESC")
      .limit(n)
      .getRawMany();

    // Enrich with campaign names
    const campaignIds = rows.map((r) => r.campaignId);
    const campaigns = campaignIds.length
      ? await this.campaignRepo.find({ where: campaignIds.map((id) => ({ id })) })
      : [];
    const campaignMap = Object.fromEntries(campaigns.map((c) => [c.id, c]));

    return rows.map((r) => ({
      campaignId:  r.campaignId,
      name:        campaignMap[r.campaignId]?.name ?? r.campaignId,
      status:      campaignMap[r.campaignId]?.status ?? "UNKNOWN",
      spend:       parseFloat(r.spend) || 0,
      clicks:      parseInt(r.clicks) || 0,
      impressions: parseInt(r.impressions) || 0,
      ctr:         parseFloat(r.ctr) || 0,
    }));
  }

  // ─── Reporting (hierarchical Account → Campaign) ─────────────────────────────

  @Get("reporting")
  @ApiOperation({ summary: "Hierarchical report: Account → Campaign with aggregated metrics" })
  @ApiQuery({ name: "workspaceId" })
  @ApiQuery({ name: "days", required: false, description: "Lookback window in days (default 30)" })
  async reporting(
    @Query("workspaceId") workspaceId: string | undefined,
    @Query("days") days = "30",
    @Req() req: Request,
  ) {
    if (!workspaceId) throw new BadRequestException("workspaceId is required");
    await this.assertWorkspaceOwnership(workspaceId, this.getRequestUserId(req));

    const since = new Date();
    since.setDate(since.getDate() - (parseInt(days) || 30));

    // Aggregate MetaInsight per campaign
    const insightRows = await this.insightRepo
      .createQueryBuilder("insight")
      .where("insight.workspaceId = :wid", { wid: workspaceId })
      .andWhere("insight.date >= :since", { since })
      .select([
        "insight.campaignId AS campaignId",
        'COALESCE(SUM(insight.spend), 0) AS "spend"',
        'COALESCE(SUM(insight.clicks), 0) AS "clicks"',
        'COALESCE(SUM(insight.impressions), 0) AS "impressions"',
        'CASE WHEN SUM(insight.impressions) > 0 THEN ROUND(SUM(insight.clicks)::numeric / SUM(insight.impressions) * 100, 4) ELSE 0 END AS "ctr"',
        'CASE WHEN SUM(insight.clicks) > 0 THEN ROUND(SUM(insight.spend)::numeric / SUM(insight.clicks), 4) ELSE 0 END AS "cpc"',
      ])
      .groupBy("insight.campaignId")
      .getRawMany();

    const metricByCampaign: Record<string, any> = {};
    for (const r of insightRows) {
      metricByCampaign[r.campaignId] = {
        spend:       parseFloat(r.spend) || 0,
        clicks:      parseInt(r.clicks) || 0,
        impressions: parseInt(r.impressions) || 0,
        ctr:         parseFloat(r.ctr) || 0,
        cpc:         parseFloat(r.cpc) || 0,
      };
    }

    const accounts = await this.adAccountRepo.find({ where: { workspaceId } });

    const result = await Promise.all(
      accounts.map(async (account) => {
        const campaigns = await this.campaignRepo.find({
          where: { adAccountId: account.id, workspaceId },
          order: { name: "ASC" },
        });

        const enriched = campaigns.map((c) => ({
          id:        c.id,
          name:      c.name,
          status:    c.status,
          objective: c.objective,
          tags:      c.tags ?? [],
          metrics:   metricByCampaign[c.id] ?? { spend: 0, clicks: 0, impressions: 0, ctr: 0, cpc: 0 },
        }));

        // Roll up account-level metrics
        const accountMetrics = enriched.reduce(
          (acc, c) => ({
            spend:       acc.spend + c.metrics.spend,
            clicks:      acc.clicks + c.metrics.clicks,
            impressions: acc.impressions + c.metrics.impressions,
            ctr:         0, // calculated below
            cpc:         0,
          }),
          { spend: 0, clicks: 0, impressions: 0, ctr: 0, cpc: 0 },
        );
        accountMetrics.ctr = accountMetrics.impressions > 0
          ? Math.round((accountMetrics.clicks / accountMetrics.impressions) * 10000) / 100
          : 0;
        accountMetrics.cpc = accountMetrics.clicks > 0
          ? Math.round((accountMetrics.spend / accountMetrics.clicks) * 100) / 100
          : 0;

        return {
          id:        account.id,
          name:      account.name,
          currency:  account.currency ?? "USD",
          timezone:  account.timezone,
          metrics:   accountMetrics,
          campaigns: enriched,
        };
      }),
    );

    return { workspaceId, days: parseInt(days) || 30, accounts: result };
  }

  @Get("reporting/export")
  @ApiOperation({ summary: "Export reporting data as CSV" })
  @ApiQuery({ name: "workspaceId" })
  @ApiQuery({ name: "days", required: false })
  async exportReporting(
    @Query("workspaceId") workspaceId: string | undefined,
    @Query("days") days = "30",
    @Req() req: Request,
  ) {
    const data = await this.reporting(workspaceId, days, req);
    const lines: string[] = [
      "Account,Account ID,Campaign,Campaign ID,Status,Objective,Spend,Clicks,Impressions,CTR (%),CPC",
    ];

    for (const account of data.accounts) {
      for (const campaign of account.campaigns) {
        lines.push([
          `"${account.name}"`,
          account.id,
          `"${campaign.name}"`,
          campaign.id,
          campaign.status,
          campaign.objective ?? "",
          campaign.metrics.spend.toFixed(2),
          campaign.metrics.clicks,
          campaign.metrics.impressions,
          campaign.metrics.ctr.toFixed(4),
          campaign.metrics.cpc.toFixed(4),
        ].join(","));
      }
    }

    return { csv: lines.join("\n"), filename: `performa-report-${new Date().toISOString().slice(0, 10)}.csv` };
  }

  // ─── Spend forecast ────────────────────────────────────────────────────────

  @Get("spend-forecast")
  @ApiOperation({ summary: "Monthly spend actuals + linear prediction for rest of month" })
  @ApiQuery({ name: "workspaceId" })
  async spendForecast(
    @Query("workspaceId") workspaceId: string | undefined,
    @Req() req: Request,
  ) {
    if (!workspaceId) throw new BadRequestException("workspaceId is required");
    await this.assertWorkspaceOwnership(workspaceId, this.getRequestUserId(req));

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = now.getDate(); // days elapsed including today

    // Daily spend for this month
    const dailyRows = await this.insightRepo
      .createQueryBuilder("insight")
      .where("insight.workspaceId = :wid", { wid: workspaceId })
      .andWhere("insight.date >= :since", { since: firstOfMonth })
      .select([
        "CAST(insight.date AS date) AS day",
        'COALESCE(SUM(insight.spend), 0) AS "spend"',
      ])
      .groupBy("CAST(insight.date AS date)")
      .orderBy("day", "ASC")
      .getRawMany();

    // Build a full daily array (fill missing days with 0)
    const spendByDay: Record<string, number> = {};
    for (const r of dailyRows) {
      const key = typeof r.day === "string" ? r.day.slice(0, 10) : new Date(r.day).toISOString().slice(0, 10);
      spendByDay[key] = parseFloat(r.spend) || 0;
    }

    const daily: { date: string; spend: number; isPredicted: boolean }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(now.getFullYear(), now.getMonth(), d);
      const key = date.toISOString().slice(0, 10);
      const isPredicted = d > daysElapsed;
      daily.push({ date: key, spend: spendByDay[key] ?? 0, isPredicted });
    }

    const spendToDate = daily.filter((d) => !d.isPredicted).reduce((s, d) => s + d.spend, 0);
    const avgDailySpend = daysElapsed > 0 ? spendToDate / daysElapsed : 0;

    // Fill predicted days with average daily spend
    for (const d of daily) {
      if (d.isPredicted) d.spend = Math.round(avgDailySpend * 100) / 100;
    }

    const predictedTotal = Math.round(avgDailySpend * daysInMonth * 100) / 100;

    return {
      spendToDate: Math.round(spendToDate * 100) / 100,
      predictedTotal,
      avgDailySpend: Math.round(avgDailySpend * 100) / 100,
      daysElapsed,
      daysTotal: daysInMonth,
      daily,
    };
  }

  // ─── Learning Monitor ─────────────────────────────────────────────────────────

  @Get("learning-monitor")
  @ApiOperation({ summary: "Ad set delivery status breakdown for Learning Monitor widget" })
  @ApiQuery({ name: "workspaceId" })
  async learningMonitor(
    @Query("workspaceId") workspaceId: string | undefined,
    @Req() req: Request,
  ) {
    if (!workspaceId) throw new BadRequestException("workspaceId is required");
    await this.assertWorkspaceOwnership(workspaceId, this.getRequestUserId(req));

    // Use MetaCampaignSync status as a proxy for ad set delivery.
    // Real ad set status would require syncing ad sets separately.
    const rows = await this.campaignRepo
      .createQueryBuilder("c")
      .where("c.workspaceId = :wid", { wid: workspaceId })
      .select(["c.status AS status", "COUNT(*) AS cnt"])
      .groupBy("c.status")
      .getRawMany();

    // Normalise to four buckets used in Smartly's Learning Monitor
    let active = 0, learning = 0, limited = 0, paused = 0;
    for (const r of rows) {
      const s = (r.status as string).toUpperCase();
      const n = parseInt(r.cnt, 10) || 0;
      if (s === "ACTIVE") active += n;
      else if (s === "PAUSED" || s === "ARCHIVED" || s === "DELETED") paused += n;
      else learning += n; // any other status counts as learning/in-progress
    }

    const total = active + learning + limited + paused;
    return { total, active, learning, limited, paused };
  }

  // ─── Conversion Analytics ───────────────────────────────────────────────────────

  @Get("campaigns/:campaignId/conversion-analytics")
  @ApiOperation({
    summary: "Get conversion metrics and analytics for a campaign",
    description:
      "Retrieve conversion summary, cost per conversion, and trends from Meta insights data",
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
  @ApiResponse({
    status: 200,
    description: "Conversion analytics returned successfully",
  })
  async getConversionAnalytics(
    @Param("campaignId") campaignId: string,
    @Query("workspaceId") workspaceId: string | undefined,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Req() req: Request,
  ) {
    if (!workspaceId) throw new BadRequestException("workspaceId is required");
    await this.assertWorkspaceOwnership(workspaceId, this.getRequestUserId(req));

    const start = new Date(startDate + "T00:00:00Z");
    const end = new Date(endDate + "T23:59:59Z");

    const summary = await this.conversionAnalytics.getConversionSummary(
      workspaceId,
      campaignId,
      start,
      end,
    );

    const trend = await this.conversionAnalytics.getConversionTrend(
      workspaceId,
      campaignId,
      start,
      end,
    );

    return {
      success: true,
      campaignId,
      startDate,
      endDate,
      summary,
      trend,
    };
  }

  @Get("campaigns/:campaignId/top-converting")
  @ApiOperation({
    summary: "Get top converting campaigns in a workspace",
    description: "Sorted by conversion count",
  })
  @ApiParam({
    name: "campaignId",
    description: "Campaign ID (used for context, optional filtering)",
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
    description: "Number of campaigns to return (default: 10)",
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Top converting campaigns returned",
  })
  async getTopConvertingCampaigns(
    @Param("campaignId") _campaignId: string, // used for route consistency
    @Query("workspaceId") workspaceId: string | undefined,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Query("limit") limitStr?: string,
    @Req() req?: Request,
  ) {
    if (!workspaceId) throw new BadRequestException("workspaceId is required");
    if (req) await this.assertWorkspaceOwnership(workspaceId, this.getRequestUserId(req));

    const start = new Date(startDate + "T00:00:00Z");
    const end = new Date(endDate + "T23:59:59Z");
    const limit = limitStr ? parseInt(limitStr) : 10;

    const topCampaigns = await this.conversionAnalytics.getTopConvertingCampaigns(
      workspaceId,
      start,
      end,
      limit,
    );

    return {
      success: true,
      startDate,
      endDate,
      limit,
      campaigns: topCampaigns,
    };
  }

  // ─── Campaign Tags ────────────────────────────────────────────────────────────

  @Post("campaigns/:campaignId/tags")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Set tags for a Meta campaign" })
  async setTags(
    @Param("campaignId") campaignId: string,
    @Query("workspaceId") workspaceId: string | undefined,
    @Body() body: { tags: string[] },
    @Req() req: Request,
  ) {
    if (!workspaceId) throw new BadRequestException("workspaceId is required");
    await this.assertWorkspaceOwnership(workspaceId, this.getRequestUserId(req));

    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId, workspaceId } });
    if (!campaign) throw new BadRequestException("Campaign not found");

    await this.campaignRepo.update({ id: campaignId }, { tags: body.tags });
    return { id: campaignId, tags: body.tags };
  }

  // ─── Private: workspace ownership ────────────────────────────────────────────

  /**
   * Verifies the given workspaceId belongs to the authenticated user.
   * Throws ForbiddenException on mismatch — prevents cross-tenant data access.
   */
  private async assertWorkspaceOwnership(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
      select: ["id", "userId"],
    });

    if (!workspace) {
      throw new BadRequestException(`Workspace ${workspaceId} not found`);
    }

    if (workspace.userId !== userId) {
      this.logger.warn({
        message: "Cross-tenant access attempt blocked",
        workspaceId,
        requestingUserId: userId,
        ownerUserId: workspace.userId,
      });
      throw new ForbiddenException("You do not have access to this workspace");
    }
  }

  /** Extracts the authenticated user's ID from req.user (set by JwtStrategy). */
  private getRequestUserId(req: Request): string {
    const user = (req as any).user as User | undefined;
    if (!user?.id) {
      throw new UnauthorizedException("Authenticated user not found in request");
    }
    return user.id;
  }

  // ─── Private: request helpers ────────────────────────────────────────────────

  private resolveRange(range?: string, datePreset?: string): string {
    if (range) {
      const mapped = RANGE_TO_DATE_PRESET[range];
      if (!mapped) {
        throw new BadRequestException(
          `Invalid range "${range}". Allowed values: ${Object.keys(RANGE_TO_DATE_PRESET).join(", ")}`,
        );
      }
      return mapped;
    }
    return datePreset ?? "last_30d";
  }

  /** Resolves a Meta access token from the Authorization header or cookie. */
  private extractMetaToken(authorization?: string, req?: Request): string {
    if (authorization) {
      const [scheme, token] = authorization.split(" ");
      if (scheme?.toLowerCase() === "bearer" && token) return token;
    }

    const cookieHeader = req?.headers?.cookie ?? "";
    const pair = cookieHeader
      .split(";")
      .map((p) => p.trim())
      .find((p) => p.startsWith("meta_access_token="));

    if (pair) {
      const value = pair.split("=")[1];
      if (value) return decodeURIComponent(value);
    }

    throw new UnauthorizedException(
      "Meta access token is required. Provide it as Authorization: Bearer <token> " +
        "or as a meta_access_token cookie.",
    );
  }
}
