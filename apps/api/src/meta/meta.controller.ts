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
import { Workspace } from "../workspaces/entities/workspace.entity";
import { User } from "../users/entities/user.entity";

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
        workspaceId: { type: "string", description: "Nishon workspace UUID" },
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
  @ApiQuery({ name: "workspaceId", description: "Nishon workspace UUID" })
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
