import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { MetaAdsService } from "./meta-ads.service";
import { MetaAdAccount } from "./entities/meta-ad-account.entity";
import { MetaCampaignSync } from "./entities/meta-campaign-sync.entity";
import { MetaInsight } from "./entities/meta-insight.entity";
import { ConnectedAccount } from "../platforms/entities/connected-account.entity";
import { Platform } from "@nishon/shared";
import { decrypt } from "../common/crypto.util";

export type SyncResult = {
  success: boolean;
  accountsSynced: number;
  campaignsSynced: number;
  insightRowsSynced: number;
  errors: string[];
};

/**
 * Orchestrates a full Meta Ads sync for a workspace.
 *
 * All data written includes workspaceId for strict tenant isolation.
 * Every campaign and insight row is tagged with the workspace they belong to —
 * no JOIN through ad_account is needed to filter by tenant.
 *
 * Sync flow per workspace:
 *   1. Load the workspace's connected Meta account to get the access token.
 *   2. Fetch all ad accounts from the Graph API.
 *   3. For each ad account:
 *      a. Upsert MetaAdAccount record (with workspaceId).
 *      b. Fetch campaigns → upsert MetaCampaignSync records (with workspaceId).
 *      c. Fetch insights → upsert MetaInsight records (with workspaceId).
 *
 * Error philosophy: errors on individual accounts are logged and collected but
 * do NOT abort the rest of the sync — partial success is better than full failure.
 */
@Injectable()
export class MetaSyncService {
  private readonly logger = new Logger(MetaSyncService.name);

  private readonly encryptionKey: string | null;

  constructor(
    private readonly metaApi: MetaAdsService,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    @InjectRepository(MetaAdAccount)
    private readonly adAccountRepo: Repository<MetaAdAccount>,
    @InjectRepository(MetaCampaignSync)
    private readonly campaignRepo: Repository<MetaCampaignSync>,
    @InjectRepository(MetaInsight)
    private readonly insightRepo: Repository<MetaInsight>,
    @InjectRepository(ConnectedAccount)
    private readonly connectedAccountRepo: Repository<ConnectedAccount>,
  ) {
    const key = this.config.get<string>("ENCRYPTION_KEY", "");
    this.encryptionKey = key.length === 32 ? key : null;
  }

  /**
   * Entry point: sync all Meta data for the given workspace.
   * Pass a `workspaceId` and optionally a one-off `accessToken` to override
   * what's stored in the DB (useful for post-OAuth immediate syncs).
   */
  async syncWorkspace(
    workspaceId: string,
    accessTokenOverride?: string,
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      accountsSynced: 0,
      campaignsSynced: 0,
      insightRowsSynced: 0,
      errors: [],
    };

    // ── Step 1: Resolve access token ─────────────────────────────────────────
    const accessToken =
      accessTokenOverride ?? (await this.resolveAccessToken(workspaceId));

    if (!accessToken) {
      throw new NotFoundException(
        `No active Meta integration found for workspace ${workspaceId}. ` +
          "Please connect a Meta ad account first.",
      );
    }

    // ── Step 2: Fetch ad accounts ─────────────────────────────────────────────
    const adAccounts = await this.metaApi.getAdAccounts(accessToken);
    this.logger.log({
      message: "Sync started",
      workspaceId,
      adAccountCount: adAccounts.length,
    });

    // ── Step 3: Process each ad account ──────────────────────────────────────
    for (const account of adAccounts) {
      try {
        await this.syncAccount(account, workspaceId, accessToken, result);
      } catch (err: any) {
        const msg = `Account ${account.id} (${account.name}): ${err?.message ?? "unknown error"}`;
        this.logger.error({
          message: "Account sync failed",
          accountId: account.id,
          workspaceId,
          error: err?.message,
        });
        result.errors.push(msg);
        // Continue with remaining accounts — partial sync is better than none
      }
    }

    result.success = result.errors.length === 0;

    this.logger.log({
      message: "Sync complete",
      workspaceId,
      ...result,
    });

    return result;
  }

  // ─── Private: per-account sync ───────────────────────────────────────────────

  private async syncAccount(
    account: {
      id: string;
      name: string;
      account_status: number;
      currency: string | null;
      timezone_name: string | null;
    },
    workspaceId: string,
    accessToken: string,
    result: SyncResult,
  ): Promise<void> {
    // All DB writes for this account run inside a single transaction so that
    // a mid-sync crash doesn't leave the DB in a partial state.
    await this.dataSource.transaction(async (em) => {
      // ── 3a: Upsert ad account ─────────────────────────────────────────────
      await em.upsert(
        MetaAdAccount,
        {
          id: account.id,
          name: account.name,
          currency: account.currency,
          timezone: account.timezone_name,
          accountStatus: account.account_status,
          workspaceId,
          isActive: account.account_status === 1,
        },
        { conflictPaths: ["id"], skipUpdateIfNoValuesChanged: true },
      );
      result.accountsSynced++;

      // ── 3b: Fetch & upsert campaigns ──────────────────────────────────────
      const campaigns = await this.metaApi.getCampaigns(account.id, accessToken);

      if (campaigns.length > 0) {
        const campaignRows = campaigns.map((c) => ({
          id: c.id,
          name: c.name,
          status: c.status,
          objective: c.objective,
          adAccountId: account.id,
          // Tenant isolation: tag every row with the workspace it belongs to
          workspaceId,
        }));

        await em.upsert(MetaCampaignSync, campaignRows, {
          conflictPaths: ["id"],
          skipUpdateIfNoValuesChanged: true,
        });

        result.campaignsSynced += campaigns.length;
      }

      // ── 3c: Fetch & upsert insights ───────────────────────────────────────
      const insightRows = await this.metaApi.getInsights(account.id, accessToken);

      if (insightRows.length > 0) {
        // Build a set of valid campaign IDs so we don't insert orphan insights
        // for campaigns that didn't make it into our DB (e.g. DELETED campaigns
        // that were filtered out by getCampaigns).
        const campaignIds = new Set(campaigns.map((c) => c.id));

        const validInsights = insightRows
          .filter((row) => campaignIds.has(row.campaignId))
          .map((row) => ({
            // Deterministic PK: `${campaignId}_${date}` — idempotent upserts
            id: `${row.campaignId}_${row.date}`,
            campaignId: row.campaignId,
            date: new Date(row.date),
            spend: row.spend,
            impressions: row.impressions,
            clicks: row.clicks,
            ctr: row.ctr,
            cpc: row.cpc,
            conversions: row.conversions,
            conversionValue: row.conversionValue,
            pagingCursor: null,
            // Tenant isolation: tag every row with the workspace it belongs to
            workspaceId,
          }));

        if (validInsights.length > 0) {
          // Upsert in chunks of 500 to avoid hitting query size limits
          for (const chunk of this.chunks(validInsights, 500)) {
            await em.upsert(MetaInsight, chunk, {
              conflictPaths: ["id"],
              skipUpdateIfNoValuesChanged: true,
            });
          }
          result.insightRowsSynced += validInsights.length;
        }
      }
    });
  }

  // ─── Private: helpers ────────────────────────────────────────────────────────

  /**
   * Looks up and decrypts the Meta access token for a workspace.
   * Tokens are stored AES-256-CBC encrypted when ENCRYPTION_KEY is set.
   * Falls back to returning the raw value so existing plain-text tokens
   * still work during the encryption migration window.
   */
  private async resolveAccessToken(workspaceId: string): Promise<string | null> {
    const account = await this.connectedAccountRepo.findOne({
      where: { workspaceId, platform: Platform.META, isActive: true },
      order: { createdAt: "DESC" },
    });

    if (!account) return null;

    const raw = account.accessToken;

    // Decrypt if the token looks like our iv:ciphertext format and key is available
    if (this.encryptionKey && raw.includes(":")) {
      try {
        return decrypt(raw, this.encryptionKey);
      } catch (err: any) {
        this.logger.warn({
          message: "Token decryption failed — trying raw value",
          workspaceId,
          error: err?.message,
        });
      }
    }

    return raw;
  }

  /** Splits an array into chunks of `size` for batch DB operations. */
  private chunks<T>(array: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }
}
