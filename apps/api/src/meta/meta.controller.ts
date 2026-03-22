import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
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
 * - JWT guard protects all routes (user must be logged in to Nishon).
 * - Passthrough endpoints (ad-accounts, campaigns, insights) take the Meta token
 *   from Authorization header or meta_access_token cookie.
 * - Sync and dashboard use the token stored in the DB (connected_accounts table)
 *   unless overridden via the request body.
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
    @InjectRepository(MetaAdAccount)
    private readonly adAccountRepo: Repository<MetaAdAccount>,
    @InjectRepository(MetaCampaignSync)
    private readonly campaignRepo: Repository<MetaCampaignSync>,
    @InjectRepository(MetaInsight)
    private readonly insightRepo: Repository<MetaInsight>,
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
    description: "Date range shorthand: 7d | 30d | today. Defaults to 30d.",
    enum: ["7d", "30d", "today"],
  })
  @ApiQuery({
    name: "datePreset",
    required: false,
    description: "Raw Meta date_preset value (e.g. last_7d, last_30d, this_month). Overridden by range if both provided.",
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

    // `range` shorthand takes priority; fall back to raw datePreset; default to last_30d
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
        workspaceId: { type: "string", description: "Nishon workspace UUID" },
        accessToken: {
          type: "string",
          description:
            "Optional Meta access token override. If omitted, the token stored " +
            "in the workspace's connected_accounts record is used.",
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Sync completed (may include partial errors in result.errors)" })
  async sync(
    @Body() body: { workspaceId?: string; accessToken?: string },
  ) {
    if (!body.workspaceId) {
      throw new BadRequestException("workspaceId is required in the request body");
    }

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
      "Returns all synced ad accounts and their campaigns, enriched with aggregated " +
      "metrics (spend, clicks, impressions, CTR, CPC) and an AI health/action recommendation " +
      "per campaign.",
  })
  @ApiQuery({ name: "workspaceId", description: "Nishon workspace UUID" })
  @ApiResponse({
    status: 200,
    description: "Dashboard data",
    schema: {
      example: {
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
  async dashboard(@Query("workspaceId") workspaceId: string | undefined) {
    if (!workspaceId) {
      throw new BadRequestException("workspaceId query parameter is required");
    }

    const accounts = await this.adAccountRepo.find({
      where: { workspaceId },
      order: { name: "ASC" },
    });

    const enrichedAccounts = await Promise.all(
      accounts.map((account) => this.buildAccountPayload(account)),
    );

    return { accounts: enrichedAccounts };
  }

  // ─── Private: dashboard builders ────────────────────────────────────────────

  private async buildAccountPayload(account: MetaAdAccount) {
    const campaigns = await this.campaignRepo.find({
      where: { adAccountId: account.id },
      order: { name: "ASC" },
    });

    const enrichedCampaigns = await Promise.all(
      campaigns.map((c) => this.buildCampaignPayload(c)),
    );

    return {
      id: account.id,
      name: account.name,
      currency: account.currency,
      timezone: account.timezone,
      campaigns: enrichedCampaigns,
    };
  }

  private async buildCampaignPayload(campaign: MetaCampaignSync) {
    const aggregated = await this.aggregateInsights(campaign.id);
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
   * Recalculates CTR and CPC from aggregated totals (not averages) — correct for
   * weighted metrics. Guards against division by zero.
   */
  private async aggregateInsights(campaignId: string): Promise<CampaignInsights> {
    const rows = await this.insightRepo.find({ where: { campaignId } });

    if (rows.length === 0) {
      return { campaignId, spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0 };
    }

    const spend = rows.reduce((s, r) => s + Number(r.spend), 0);
    const impressions = rows.reduce((s, r) => s + Number(r.impressions), 0);
    const clicks = rows.reduce((s, r) => s + Number(r.clicks), 0);

    // Recalculate from totals to avoid averaging-bias on daily values
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;

    return { campaignId, spend, impressions, clicks, ctr, cpc };
  }

  // ─── Private: helpers ────────────────────────────────────────────────────────

  /**
   * Resolves the Meta API date_preset from the user-facing `range` shorthand
   * or falls back to the raw `datePreset` param. Defaults to "last_30d".
   */
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
