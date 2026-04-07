import { Processor, Process, OnQueueFailed } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Job } from "bull";
import { QUEUE_NAMES } from "../queue.constants";
import { ConnectedAccount } from "../../platforms/entities/connected-account.entity";
import { Campaign } from "../../campaigns/entities/campaign.entity";
import { PerformanceMetric } from "../../analytics/entities/performance-metric.entity";
import { MetaConnector } from "../../platforms/connectors/meta.connector";
import { GoogleConnector } from "../../platforms/connectors/google.connector";
import { TiktokConnector } from "../../platforms/connectors/tiktok.connector";
import { YandexConnector } from "../../platforms/connectors/yandex.connector";
import { Platform, CampaignStatus } from "@performa/shared";
import * as crypto from "crypto";
import { ConfigService } from "@nestjs/config";

interface CampaignSyncJobData {
  workspaceId: string;
  platform: string;
  campaignId?: string;
}

/**
 * CampaignSyncProcessor syncs campaign performance data FROM the ad platforms.
 *
 * Flow: Meta/Google/TikTok/Yandex API → PerformanceMetric table → Dashboard
 *
 * Runs every hour so the dashboard shows metrics that are at most 1 hour old.
 * One PerformanceMetric row is upserted per ad per day to avoid duplicates.
 */
@Processor(QUEUE_NAMES.CAMPAIGN_SYNC)
export class CampaignSyncProcessor {
  private readonly logger = new Logger(CampaignSyncProcessor.name);
  private readonly encryptionKey: string;

  constructor(
    @InjectRepository(ConnectedAccount)
    private readonly accountRepo: Repository<ConnectedAccount>,
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(PerformanceMetric)
    private readonly metricRepo: Repository<PerformanceMetric>,
    private readonly metaConnector: MetaConnector,
    private readonly googleConnector: GoogleConnector,
    private readonly tiktokConnector: TiktokConnector,
    private readonly yandexConnector: YandexConnector,
    private readonly config: ConfigService,
  ) {
    const key = this.config.get<string>("ENCRYPTION_KEY", "");
    if (!key || key.length !== 32) {
      this.logger.error("ENCRYPTION_KEY is not set or is not 32 characters — token decryption will fail");
    }
    this.encryptionKey = key;
  }

  @Process("sync-campaign-metrics")
  async handleCampaignSync(job: Job<CampaignSyncJobData>): Promise<void> {
    const { workspaceId, platform, campaignId } = job.data;
    this.logger.log(`Syncing ${platform} metrics for workspace: ${workspaceId}`);

    const account = await this.accountRepo.findOne({
      where: { workspaceId, platform: platform as Platform, isActive: true },
    });

    if (!account) {
      this.logger.warn(`No active ${platform} account for workspace ${workspaceId}`);
      return;
    }

    const accessToken = this.decrypt(account.accessToken);
    const since = this.daysAgo(2); // Sync last 2 days (yesterday + today)
    const until = this.daysAgo(0);

    try {
      if (platform === Platform.META) {
        await this.syncMeta(account, accessToken, since, until, campaignId);
      } else if (platform === Platform.GOOGLE) {
        const refreshToken = account.refreshToken ? this.decrypt(account.refreshToken) : null;
        await this.syncGoogle(account, accessToken, refreshToken, since, until, campaignId);
      } else if (platform === Platform.TIKTOK) {
        await this.syncTiktok(account, accessToken, since, until, campaignId);
      } else if (platform === Platform.YANDEX) {
        await this.syncYandex(account, accessToken, since, until);
      }

      this.logger.log(`Sync complete for ${platform} — workspace: ${workspaceId}`);
    } catch (error: any) {
      this.logger.error(
        `Sync failed for ${platform} workspace ${workspaceId}: ${error.message}`,
      );
      throw error; // Let Bull retry according to job options
    }
  }

  @Process("sync-all-platforms")
  async handleFullSync(job: Job<CampaignSyncJobData>): Promise<void> {
    const { workspaceId } = job.data;
    this.logger.log(`Full platform sync for workspace: ${workspaceId}`);

    const accounts = await this.accountRepo.find({
      where: { workspaceId, isActive: true },
    });

    await Promise.allSettled(
      accounts.map((account) =>
        this.handleCampaignSync({
          ...job,
          data: { workspaceId, platform: account.platform },
        } as Job<CampaignSyncJobData>),
      ),
    );
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Sync job failed for workspace ${job.data.workspaceId}: ${error.message}`,
    );
  }

  // ─── PLATFORM-SPECIFIC SYNC ────────────────────────────────────────────────

  private async syncMeta(
    account: ConnectedAccount,
    accessToken: string,
    since: string,
    until: string,
    campaignId?: string,
  ): Promise<void> {
    const adAccountId = account.externalAccountId;

    const insights = await this.metaConnector.getInsights(
      campaignId ?? adAccountId,
      accessToken,
      {
        since,
        until,
        level: campaignId ? "campaign" : "ad",
        fields: ["impressions", "clicks", "spend", "actions", "ctr", "cpm", "reach"],
      },
    );

    // Find campaigns in our DB that belong to this workspace and have an externalId
    const campaigns = await this.campaignRepo.find({
      where: { workspaceId: account.workspaceId, platform: Platform.META },
      relations: ["adSets", "adSets.ads"],
    });

    for (const insight of insights) {
      // Find matching ads in our DB to associate metrics
      for (const campaign of campaigns) {
        for (const adSet of campaign.adSets ?? []) {
          for (const ad of adSet.ads ?? []) {
            if (!ad.id) continue;

            const actions = insight.actions ?? [];
            const conversions = actions
              .filter((a) => a.action_type === "offsite_conversion.fb_pixel_purchase")
              .reduce((sum, a) => sum + parseInt(a.value || "0"), 0);

            // Extract revenue from action_values (purchase conversion value)
            const actionValues = insight.action_values ?? [];
            const revenue = actionValues
              .filter((a) => a.action_type === "offsite_conversion.fb_pixel_purchase")
              .reduce((sum, a) => sum + parseFloat(a.value || "0"), 0);

            await this.upsertMetric(ad.id, insight.date_start, {
              impressions: insight.impressions,
              clicks: insight.clicks,
              spend: insight.spend,
              conversions,
              revenue,
            });
          }
        }
      }
    }
  }

  private async syncGoogle(
    account: ConnectedAccount,
    accessToken: string,
    refreshToken: string | null,
    since: string,
    until: string,
    campaignId?: string,
  ): Promise<void> {
    // Refresh token if needed
    let token = accessToken;
    if (account.tokenExpiresAt && new Date() >= account.tokenExpiresAt && refreshToken) {
      try {
        const refreshed = await this.googleConnector.refreshAccessToken(refreshToken);
        token = refreshed.accessToken;
        // Update the token in DB
        await this.accountRepo.update(account.id, {
          accessToken: this.encrypt(token),
          tokenExpiresAt: refreshed.expiresAt,
        });
      } catch (err: any) {
        this.logger.warn(`Google token refresh failed: ${err.message}`);
      }
    }

    const customerId = account.externalAccountId;

    const rows = await this.googleConnector.getInsights(customerId, token, {
      since,
      until,
      campaignId,
    });

    const campaigns = await this.campaignRepo.find({
      where: { workspaceId: account.workspaceId, platform: Platform.GOOGLE },
      relations: ["adSets", "adSets.ads"],
    });

    for (const row of rows) {
      const matched = campaigns.find((c) => c.externalId === row.campaignId);
      if (!matched) continue;

      for (const adSet of matched.adSets ?? []) {
        for (const ad of adSet.ads ?? []) {
          await this.upsertMetric(ad.id, row.date, {
            impressions: row.impressions,
            clicks: row.clicks,
            spend: row.costMicros / 1_000_000,
            conversions: row.conversions,
            revenue: row.conversionValue ?? 0,
          });
        }
      }
    }
  }

  private async syncTiktok(
    account: ConnectedAccount,
    accessToken: string,
    since: string,
    until: string,
    campaignId?: string,
  ): Promise<void> {
    const advertiserId = account.externalAccountId;

    const rows = await this.tiktokConnector.getInsights(advertiserId, accessToken, {
      since,
      until,
      campaignId,
      level: "CAMPAIGN",
    });

    const campaigns = await this.campaignRepo.find({
      where: { workspaceId: account.workspaceId, platform: Platform.TIKTOK },
      relations: ["adSets", "adSets.ads"],
    });

    for (const row of rows) {
      const matched = campaigns.find((c) => c.externalId === row.campaignId);
      if (!matched) continue;

      for (const adSet of matched.adSets ?? []) {
        for (const ad of adSet.ads ?? []) {
          await this.upsertMetric(ad.id, row.date, {
            impressions: row.impressions,
            clicks: row.clicks,
            spend: row.spend,
            conversions: row.conversions,
            // TikTok Ads API does not expose conversion_value in standard reporting;
            // revenue tracking requires TikTok Pixel events or offline conversion upload
            revenue: 0,
          });
        }
      }
    }
  }

  private async syncYandex(
    account: ConnectedAccount,
    accessToken: string,
    since: string,
    until: string,
  ): Promise<void> {
    const accountLogin = account.externalAccountId;

    const rows = await this.yandexConnector.getInsights(accessToken, accountLogin, {
      since,
      until,
    });

    const campaigns = await this.campaignRepo.find({
      where: { workspaceId: account.workspaceId, platform: Platform.YANDEX },
      relations: ["adSets", "adSets.ads"],
    });

    for (const row of rows) {
      const matched = campaigns.find((c) => c.externalId === row.campaignId);
      if (!matched) continue;

      for (const adSet of matched.adSets ?? []) {
        for (const ad of adSet.ads ?? []) {
          await this.upsertMetric(ad.id, row.date, {
            impressions: row.impressions,
            clicks: row.clicks,
            spend: row.cost,
            conversions: row.conversions,
            // Yandex Direct API returns conversions via goals but does not provide
            // conversion value in standard stat reports; needs Yandex.Metrika integration
            revenue: 0,
          });
        }
      }
    }
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  /**
   * Upsert a daily performance metric row for an ad.
   * If a metric row already exists for this ad/date, update it.
   * Otherwise insert a new row.
   */
  private async upsertMetric(
    adId: string,
    date: string,
    data: {
      impressions: number;
      clicks: number;
      spend: number;
      conversions: number;
      revenue: number;
    },
  ): Promise<void> {
    const existing = await this.metricRepo.findOne({
      where: { adId, recordedAt: new Date(date) as any },
    });

    const ctr = data.impressions > 0
      ? (data.clicks / data.impressions) * 100
      : 0;
    const cpa = data.conversions > 0
      ? data.spend / data.conversions
      : 0;
    const roas = data.spend > 0
      ? data.revenue / data.spend
      : 0;
    const cpm = data.impressions > 0
      ? (data.spend / data.impressions) * 1000
      : 0;

    if (existing) {
      await this.metricRepo.update(existing.id, {
        impressions: data.impressions,
        clicks: data.clicks,
        spend: data.spend,
        conversions: data.conversions,
        revenue: data.revenue,
        ctr,
        cpa,
        roas,
        cpm,
      });
    } else {
      await this.metricRepo.save(
        this.metricRepo.create({
          adId,
          recordedAt: new Date(date) as any,
          impressions: data.impressions,
          clicks: data.clicks,
          spend: data.spend,
          conversions: data.conversions,
          revenue: data.revenue,
          ctr,
          cpa,
          roas,
          cpm,
        }),
      );
    }
  }

  private daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split("T")[0];
  }

  private decrypt(encryptedText: string): string {
    const [ivHex, encrypted] = encryptedText.split(":");
    if (!ivHex || !encrypted) throw new Error("Invalid encrypted token format");

    const iv = new Uint8Array(Buffer.from(ivHex, "hex"));
    const decipher = crypto.createDecipheriv("aes-256-cbc", this.encryptionKey, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  private encrypt(text: string): string {
    const ivBuf = crypto.randomBytes(16);
    const iv = new Uint8Array(ivBuf);
    const cipher = crypto.createCipheriv("aes-256-cbc", this.encryptionKey, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${ivBuf.toString("hex")}:${encrypted}`;
  }
}
