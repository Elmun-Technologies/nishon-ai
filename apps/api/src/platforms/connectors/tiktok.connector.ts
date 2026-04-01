import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { getOAuthCallbackUrl } from "./oauth-callback.util";

/**
 * TiktokConnector — TikTok Marketing API v1.3 integration.
 *
 * TikTok Ads API reference: https://business-api.tiktok.com/portal/docs
 *
 * Key terminology (differs from Meta/Google):
 *   "Campaign"   → Campaign         (objective level)
 *   "Ad Group"   → Ad Group         (targeting, budget, schedule level)
 *   "Creative"   → Ad               (actual creative content)
 *
 * Budget: in local currency (not cents/micros)
 * Strong in CIS market for 18–35 age group.
 */
@Injectable()
export class TiktokConnector {
  private readonly logger = new Logger(TiktokConnector.name);
  private readonly apiBase = "https://business-api.tiktok.com/open_api/v1.3";

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  // ─── OAUTH ────────────────────────────────────────────────────────────────

  getOAuthUrl(workspaceId: string): string {
    const clientKey = this.config.get<string>("TIKTOK_APP_ID", "");
    const redirectUri = getOAuthCallbackUrl(this.config, "tiktok");

    if (!clientKey || !redirectUri) {
      this.logger.warn("TikTok OAuth requested without TIKTOK_APP_ID/API_BASE_URL");
      return "";
    }

    const state = Buffer.from(JSON.stringify({ workspaceId })).toString("base64");

    const params = new URLSearchParams({
      client_key: clientKey,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "ad.account.read,ad.report.read,ad.campaign.read,ad.campaign.write",
      state,
    });

    this.logger.log(`TikTok OAuth URL requested for workspace: ${workspaceId}`);
    return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
  }

  /**
   * Exchange authorization code for an access token.
   * TikTok access tokens are long-lived (no refresh token needed for most flows).
   */
  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    advertiserId: string;
    expiresAt: Date | null;
  }> {
    const appId = this.config.get<string>("TIKTOK_APP_ID", "");
    const appSecret = this.config.get<string>("TIKTOK_APP_SECRET", "");

    try {
      const response = await firstValueFrom(
        this.http.post(`${this.apiBase}/oauth2/access_token/`, {
          app_id: appId,
          secret: appSecret,
          auth_code: code,
        }),
      );

      const { data, code: respCode } = response.data;

      if (respCode !== 0) {
        throw new BadRequestException(
          `TikTok token exchange failed: ${response.data.message}`,
        );
      }

      const expiresAt = data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : null;

      // TikTok returns a list of advertiser IDs the user has access to
      const advertiserId: string = data.advertiser_ids?.[0] ?? "";

      return {
        accessToken: data.access_token,
        advertiserId,
        expiresAt,
      };
    } catch (error: any) {
      const detail = error.response?.data?.message || error.message;
      this.logger.error(`TikTok token exchange failed: ${detail}`);
      throw new BadRequestException(`TikTok OAuth failed: ${detail}`);
    }
  }

  /**
   * Get all advertiser accounts accessible with this token.
   */
  async getAdvertiserAccounts(accessToken: string): Promise<
    Array<{ id: string; name: string; currency: string; timezone: string }>
  > {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.apiBase}/oauth2/advertiser/get/`, {
          params: { access_token: accessToken },
        }),
      );

      const { data, code } = response.data;
      if (code !== 0) {
        throw new BadRequestException(`TikTok get advertisers failed: ${response.data.message}`);
      }

      return (data.list ?? []).map((adv: any) => ({
        id: String(adv.advertiser_id),
        name: adv.advertiser_name,
        currency: adv.currency,
        timezone: adv.timezone,
      }));
    } catch (error: any) {
      const detail = error.response?.data?.message || error.message;
      this.logger.error(`TikTok getAdvertiserAccounts failed: ${detail}`);
      return [];
    }
  }

  // ─── CAMPAIGNS ────────────────────────────────────────────────────────────

  /**
   * Create a campaign on TikTok Ads.
   *
   * Objective types:
   *   REACH, VIDEO_VIEWS, ENGAGEMENT, APP_INSTALL, WEB_CONVERSIONS,
   *   LEAD_GENERATION, TRAFFIC, CATALOG_SALES, COMMUNITY_INTERACTION
   */
  async createCampaign(
    advertiserId: string,
    accessToken: string,
    params: {
      name: string;
      objectiveType: string;
      budgetMode: "BUDGET_MODE_DAY" | "BUDGET_MODE_TOTAL" | "BUDGET_MODE_INFINITE";
      budget?: number;
    },
  ): Promise<{ id: string }> {
    this.logger.log(`Creating TikTok campaign: ${params.name}`);

    const body: Record<string, any> = {
      advertiser_id: advertiserId,
      campaign_name: params.name,
      objective_type: params.objectiveType || "TRAFFIC",
      budget_mode: params.budgetMode || "BUDGET_MODE_DAY",
      operation_status: "DISABLE", // Start paused — always safe
    };

    if (params.budget != null) {
      body.budget = params.budget;
    }

    const response = await this.apiPost<{ campaign_id: string }>(
      `${this.apiBase}/campaign/create/`,
      accessToken,
      body,
    );

    this.logger.log(`TikTok campaign created: ${response.campaign_id}`);
    return { id: String(response.campaign_id) };
  }

  /**
   * Pause a campaign.
   */
  async pauseCampaign(
    advertiserId: string,
    accessToken: string,
    campaignId: string,
  ): Promise<void> {
    await this.apiPost(
      `${this.apiBase}/campaign/status/update/`,
      accessToken,
      {
        advertiser_id: advertiserId,
        campaign_ids: [campaignId],
        opt_status: "DISABLE",
      },
    );
    this.logger.log(`TikTok campaign paused: ${campaignId}`);
  }

  /**
   * Enable a campaign.
   */
  async enableCampaign(
    advertiserId: string,
    accessToken: string,
    campaignId: string,
  ): Promise<void> {
    await this.apiPost(
      `${this.apiBase}/campaign/status/update/`,
      accessToken,
      {
        advertiser_id: advertiserId,
        campaign_ids: [campaignId],
        opt_status: "ENABLE",
      },
    );
  }

  /**
   * Update campaign daily budget.
   */
  async updateCampaignBudget(
    advertiserId: string,
    accessToken: string,
    campaignId: string,
    budget: number,
  ): Promise<void> {
    await this.apiPost(
      `${this.apiBase}/campaign/update/`,
      accessToken,
      {
        advertiser_id: advertiserId,
        campaign_id: campaignId,
        budget,
        budget_mode: "BUDGET_MODE_DAY",
      },
    );
    this.logger.log(`TikTok campaign budget updated: ${campaignId} → ${budget}`);
  }

  // ─── AD GROUPS ────────────────────────────────────────────────────────────

  /**
   * Create an ad group (targeting + schedule + bid).
   */
  async createAdGroup(
    advertiserId: string,
    accessToken: string,
    params: {
      campaignId: string;
      name: string;
      promotionType: string; // WEBSITE | APP_ANDROID | APP_IOS
      placementType: "PLACEMENT_TYPE_AUTOMATIC" | "PLACEMENT_TYPE_NORMAL";
      budget: number;
      budgetMode: "BUDGET_MODE_DAY" | "BUDGET_MODE_TOTAL";
      scheduleStartTime: string; // "YYYY-MM-DD HH:MM:SS"
      scheduleEndTime?: string;
      optimizationGoal: string; // CLICK | REACH | VIDEO_VIEW | LEAD
      bidType?: string; // BID_TYPE_NO_BID | BID_TYPE_CUSTOM
      bid?: number;
      targeting?: {
        ageGroups?: string[]; // AGE_13_17, AGE_18_24, AGE_25_34, AGE_35_44, AGE_45_54, AGE_55_100
        genders?: string[]; // GENDER_MALE | GENDER_FEMALE | GENDER_UNLIMITED
        locations?: string[]; // location IDs
        languages?: string[];
        interests?: string[];
      };
    },
  ): Promise<{ id: string }> {
    this.logger.log(`Creating TikTok ad group: ${params.name}`);

    const body: Record<string, any> = {
      advertiser_id: advertiserId,
      campaign_id: params.campaignId,
      adgroup_name: params.name,
      promotion_type: params.promotionType || "WEBSITE",
      placement_type: params.placementType || "PLACEMENT_TYPE_AUTOMATIC",
      budget: params.budget,
      budget_mode: params.budgetMode || "BUDGET_MODE_DAY",
      schedule_start_time: params.scheduleStartTime,
      optimization_goal: params.optimizationGoal || "CLICK",
      bid_type: params.bidType || "BID_TYPE_NO_BID",
      operation_status: "DISABLE",
    };

    if (params.scheduleEndTime) {
      body.schedule_end_time = params.scheduleEndTime;
    }

    if (params.bid != null) {
      body.bid = params.bid;
    }

    // Targeting
    if (params.targeting) {
      const t = params.targeting;
      const targeting: Record<string, any> = {};

      if (t.ageGroups?.length) targeting.age_groups = t.ageGroups;
      if (t.genders?.length) targeting.gender = t.genders;
      if (t.locations?.length) targeting.location_ids = t.locations;
      if (t.languages?.length) targeting.languages = t.languages;
      if (t.interests?.length) targeting.interest_keyword_ids = t.interests;

      body.targeting = targeting;
    }

    const response = await this.apiPost<{ adgroup_id: string }>(
      `${this.apiBase}/adgroup/create/`,
      accessToken,
      body,
    );

    this.logger.log(`TikTok ad group created: ${response.adgroup_id}`);
    return { id: String(response.adgroup_id) };
  }

  // ─── ADS (CREATIVES) ──────────────────────────────────────────────────────

  /**
   * Create an ad (creative) within an ad group.
   */
  async createAd(
    advertiserId: string,
    accessToken: string,
    params: {
      adGroupId: string;
      name: string;
      creativeType: "SINGLE_VIDEO" | "SINGLE_IMAGE" | "SPARK_ADS";
      imageId?: string;  // from uploadImage()
      videoId?: string;  // from uploadVideo()
      text: string;      // ad caption
      callToActionType?: string; // LEARN_MORE | SHOP_NOW | SIGN_UP | DOWNLOAD_NOW
      landingPageUrl: string;
    },
  ): Promise<{ id: string }> {
    const body: Record<string, any> = {
      advertiser_id: advertiserId,
      adgroup_id: params.adGroupId,
      ad_name: params.name,
      ad_text: params.text,
      call_to_action: params.callToActionType || "LEARN_MORE",
      landing_page_url: params.landingPageUrl,
      status: "AD_STATUS_DISABLE",
    };

    if (params.imageId) body.image_ids = [params.imageId];
    if (params.videoId) body.video_id = params.videoId;

    const response = await this.apiPost<{ ad_id: string }>(
      `${this.apiBase}/ad/create/`,
      accessToken,
      body,
    );

    return { id: String(response.ad_id) };
  }

  /**
   * Upload an image to TikTok's asset library.
   * Returns image_id for use in ad creation.
   */
  async uploadImage(
    advertiserId: string,
    accessToken: string,
    imageBase64: string,
    filename: string,
  ): Promise<{ imageId: string }> {
    const response = await this.apiPost<{ image_id: string; image_url: string }>(
      `${this.apiBase}/file/image/ad/upload/`,
      accessToken,
      {
        advertiser_id: advertiserId,
        upload_type: "UPLOAD_BY_FILE",
        image_file: imageBase64,
        file_name: filename,
      },
    );

    return { imageId: response.image_id };
  }

  // ─── INSIGHTS ─────────────────────────────────────────────────────────────

  /**
   * Get campaign performance report.
   * TikTok reports are synchronous for shorter date ranges (< 30 days).
   */
  async getInsights(
    advertiserId: string,
    accessToken: string,
    params: {
      since: string; // YYYY-MM-DD
      until: string; // YYYY-MM-DD
      campaignId?: string;
      level?: "CAMPAIGN" | "ADGROUP" | "AD";
    },
  ): Promise<Array<{
    campaignId: string;
    date: string;
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
    reach: number;
    videoPlayActions?: number;
  }>> {
    const queryBody: Record<string, any> = {
      advertiser_id: advertiserId,
      report_type: "BASIC",
      dimensions: ["campaign_id", "stat_time_day"],
      data_level: params.level || "CAMPAIGN",
      lifetime: false,
      start_date: params.since,
      end_date: params.until,
      metrics: [
        "campaign_name",
        "impressions",
        "clicks",
        "spend",
        "reach",
        "conversion",
        "video_play_actions",
      ],
      page_size: 200,
    };

    if (params.campaignId) {
      queryBody.filtering = [
        { field_name: "campaign_id", filter_type: "IN", filter_value: `["${params.campaignId}"]` },
      ];
    }

    try {
      const response = await firstValueFrom(
        this.http.get(`${this.apiBase}/report/integrated/get/`, {
          params: { ...queryBody, advertiser_id: advertiserId },
          headers: { "Access-Token": accessToken },
        }),
      );

      const { data, code } = response.data;
      if (code !== 0) {
        this.logger.warn(`TikTok insights error: ${response.data.message}`);
        return [];
      }

      return (data.list ?? []).map((row: any) => ({
        campaignId: String(row.dimensions?.campaign_id ?? ""),
        date: row.dimensions?.stat_time_day ?? "",
        impressions: Number(row.metrics?.impressions ?? 0),
        clicks: Number(row.metrics?.clicks ?? 0),
        spend: parseFloat(row.metrics?.spend ?? "0"),
        conversions: Number(row.metrics?.conversion ?? 0),
        reach: Number(row.metrics?.reach ?? 0),
        videoPlayActions: Number(row.metrics?.video_play_actions ?? 0),
      }));
    } catch (error: any) {
      const detail = error.response?.data?.message || error.message;
      this.logger.error(`TikTok getInsights failed: ${detail}`);
      return [];
    }
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────

  private async apiPost<T>(
    url: string,
    accessToken: string,
    body: Record<string, any>,
  ): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.http.post(url, body, {
          headers: {
            "Access-Token": accessToken,
            "Content-Type": "application/json",
          },
        }),
      );

      const { data, code, message } = response.data;
      if (code !== 0) {
        throw new BadRequestException(`TikTok API error: ${message}`);
      }

      return data as T;
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      const detail = error.response?.data?.message || error.message;
      this.logger.error(`TikTok API POST error [${url}]: ${detail}`);
      throw new BadRequestException(`TikTok API request failed: ${detail}`);
    }
  }
}
