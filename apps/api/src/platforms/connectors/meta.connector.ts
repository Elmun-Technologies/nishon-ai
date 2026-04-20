import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { getOAuthCallbackUrl } from "./oauth-callback.util";

// Meta Graph API version — update when Meta releases new versions
const META_API_VERSION = "v19.0";
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export interface MetaCampaignCreateParams {
  name: string;
  objective: string; // e.g. 'OUTCOME_LEADS', 'OUTCOME_SALES', 'OUTCOME_TRAFFIC'
  status: string; // 'ACTIVE' | 'PAUSED'
  dailyBudget: number; // In cents! Meta uses cents — $10 = 1000
  specialAdCategories: string[]; // Required by Meta — [] for most campaigns
}

export interface MetaAdSetCreateParams {
  campaignId: string;
  name: string;
  dailyBudget: number;
  billingEvent: string; // 'IMPRESSIONS' | 'LINK_CLICKS'
  optimizationGoal: string; // 'LEAD_GENERATION' | 'CONVERSIONS' | 'LINK_CLICKS'
  targeting: {
    ageMin: number;
    ageMax: number;
    genders?: number[]; // 1=male, 2=female, empty=all
    geoLocations: { countries?: string[]; cities?: Array<{ key: string }> };
    interests?: Array<{ id: string; name: string }>;
  };
  startTime?: string; // ISO 8601 format
  endTime?: string;
}

export interface MetaAdCreateParams {
  adSetId: string;
  name: string;
  creative: {
    title: string;
    body: string;
    imageUrl?: string;
    videoId?: string;
    callToActionType: string; // 'LEARN_MORE' | 'SHOP_NOW' | 'SIGN_UP' | 'CONTACT_US'
    linkUrl: string; // Landing page URL
  };
}

export interface MetaInsightsParams {
  since: string; // YYYY-MM-DD
  until: string; // YYYY-MM-DD
  level: "campaign" | "adset" | "ad";
  fields: string[];
}

/**
 * MetaConnector is the single point of contact with Facebook/Instagram Ads API.
 *
 * All Meta API calls go through this class — nowhere else in the codebase
 * should you see direct calls to graph.facebook.com. This keeps the
 * Meta-specific logic isolated: if Meta changes their API, we only
 * need to update this one file.
 *
 * Important Meta-specific things to know:
 * - Budgets are always in CENTS (multiply dollars by 100)
 * - Campaign objectives use Meta's naming: OUTCOME_LEADS, OUTCOME_SALES, etc.
 * - Every API call needs a valid access_token
 * - Rate limits: ~200 calls/hour per token — we stay well under this
 */
@Injectable()
export class MetaConnector {
  private readonly logger = new Logger(MetaConnector.name);
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly callbackUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {
    this.appId = this.config.get<string>("META_APP_ID", "");
    this.appSecret = this.config.get<string>("META_APP_SECRET", "");
    this.callbackUrl = getOAuthCallbackUrl(this.config, "meta");
  }

  // ─── OAUTH ────────────────────────────────────────────────────────────────

  /**
   * Step 1 of OAuth: Generate the URL where we redirect the user.
   * The user clicks this URL, Facebook shows them a permission screen,
   * and after they approve, Facebook redirects back to our callbackUrl
   * with a ?code=XXX query parameter.
   */
  getOAuthUrl(workspaceId: string): string {
    if (!this.callbackUrl) {
      throw new BadRequestException("API_BASE_URL is not configured for Meta OAuth callback");
    }

    const scopes = [
      "ads_management",
      "ads_read",
      "business_management",
      "pages_read_engagement",
    ].join(",");

    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.callbackUrl,
      scope: scopes,
      response_type: "code",
      // state prevents CSRF — we encode the workspaceId here so we know
      // which workspace to connect when the callback comes back
      state: Buffer.from(JSON.stringify({ workspaceId })).toString("base64"),
    });

    return `https://www.facebook.com/dialog/oauth?${params.toString()}`;
  }

  /**
   * Step 2 of OAuth: Exchange the temporary code for a long-lived access token.
   * The code is valid for only 1 hour — we must exchange it immediately.
   * The resulting token is valid for 60 days (long-lived token).
   */
  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    tokenType: string;
    expiresAt: Date | null;
  }> {
    if (!this.callbackUrl) {
      throw new BadRequestException("API_BASE_URL is not configured for Meta OAuth callback");
    }

    const url = `${META_BASE_URL}/oauth/access_token`;

    const response = await this.apiGet<{
      access_token: string;
      token_type: string;
      expires_in?: number;
    }>(url, {
      client_id: this.appId,
      client_secret: this.appSecret,
      redirect_uri: this.callbackUrl,
      code,
    });

    const expiresAt = response.expires_in
      ? new Date(Date.now() + response.expires_in * 1000)
      : null;

    return {
      accessToken: response.access_token,
      tokenType: response.token_type,
      expiresAt,
    };
  }

  /**
   * Get all ad accounts accessible with this token.
   * One Facebook user can manage multiple ad accounts (their own + clients').
   * We show the user a list so they can choose which account to connect.
   */
  async getAdAccounts(accessToken: string): Promise<
    Array<{
      id: string;
      name: string;
      currency: string;
      status: number;
    }>
  > {
    const data = await this.apiGet<{
      data: Array<{
        id: string;
        name: string;
        currency: string;
        account_status: number;
      }>;
    }>(`${META_BASE_URL}/me/adaccounts`, {
      access_token: accessToken,
      fields: "id,name,currency,account_status",
    });

    return data.data.map((acc) => ({
      id: acc.id,
      name: acc.name,
      currency: acc.currency,
      status: acc.account_status,
    }));
  }

  // ─── CAMPAIGNS ────────────────────────────────────────────────────────────

  /**
   * Create a campaign on Meta.
   * Note: dailyBudget must be converted from dollars to cents before calling this.
   * We do the conversion here so callers can always work in dollars.
   */
  async createCampaign(
    adAccountId: string,
    accessToken: string,
    params: MetaCampaignCreateParams,
  ): Promise<{ id: string }> {
    this.logger.log(
      `Creating Meta campaign: ${params.name} for account: ${adAccountId}`,
    );

    const data = await this.apiPost<{ id: string }>(
      `${META_BASE_URL}/${adAccountId}/campaigns`,
      {
        access_token: accessToken,
        name: params.name,
        objective: params.objective,
        status: params.status,
        // Meta requires budget in cents — multiply dollars by 100
        daily_budget: Math.round(params.dailyBudget * 100),
        special_ad_categories: params.specialAdCategories || [],
      },
    );

    this.logger.log(`Meta campaign created: ${data.id}`);
    return data;
  }

  async pauseCampaign(campaignId: string, accessToken: string): Promise<void> {
    await this.apiPost(`${META_BASE_URL}/${campaignId}`, {
      access_token: accessToken,
      status: "PAUSED",
    });
    this.logger.log(`Meta campaign paused: ${campaignId}`);
  }

  async resumeCampaign(campaignId: string, accessToken: string): Promise<void> {
    await this.apiPost(`${META_BASE_URL}/${campaignId}`, {
      access_token: accessToken,
      status: "ACTIVE",
    });
  }

  async updateCampaignBudget(
    campaignId: string,
    accessToken: string,
    dailyBudgetUsd: number,
  ): Promise<void> {
    await this.apiPost(`${META_BASE_URL}/${campaignId}`, {
      access_token: accessToken,
      daily_budget: Math.round(dailyBudgetUsd * 100),
    });
    this.logger.log(
      `Meta campaign budget updated: ${campaignId} → $${dailyBudgetUsd}`,
    );
  }

  // ─── AD SETS ──────────────────────────────────────────────────────────────

  async createAdSet(
    adAccountId: string,
    accessToken: string,
    params: MetaAdSetCreateParams,
  ): Promise<{ id: string }> {
    this.logger.log(`Creating Meta ad set: ${params.name}`);

    const targeting = {
      age_min: params.targeting.ageMin,
      age_max: params.targeting.ageMax,
      genders: params.targeting.genders,
      geo_locations: {
        countries: params.targeting.geoLocations.countries,
        cities: params.targeting.geoLocations.cities,
      },
      interests: params.targeting.interests?.map((i) => ({
        id: i.id,
        name: i.name,
      })),
    };

    return this.apiPost<{ id: string }>(
      `${META_BASE_URL}/${adAccountId}/adsets`,
      {
        access_token: accessToken,
        campaign_id: params.campaignId,
        name: params.name,
        daily_budget: Math.round(params.dailyBudget * 100),
        billing_event: params.billingEvent,
        optimization_goal: params.optimizationGoal,
        targeting: JSON.stringify(targeting),
        start_time: params.startTime,
        end_time: params.endTime,
        status: "PAUSED", // Always start paused — let user review before going live
      },
    );
  }

  // ─── INSIGHTS (METRICS) ───────────────────────────────────────────────────

  /**
   * Get performance metrics for campaigns/adsets/ads.
   * This is called hourly by the CampaignSyncProcessor to keep
   * our PerformanceMetric table up to date.
   *
   * Meta returns data asynchronously for large date ranges —
   * for daily sync we use short ranges (yesterday only) to get
   * synchronous responses.
   */
  async getInsights(
    objectId: string,
    accessToken: string,
    params: MetaInsightsParams,
  ): Promise<
    Array<{
      impressions: number;
      clicks: number;
      spend: number;
      actions: Array<{ action_type: string; value: string }>;
      action_values: Array<{ action_type: string; value: string }>;
      date_start: string;
    }>
  > {
    const defaultFields = "impressions,clicks,spend,actions,action_values,ctr,cpm,cpp,reach";
    const fields = params.fields.length > 0 ? params.fields.join(",") : defaultFields;

    const data = await this.apiGet<{ data: any[] }>(
      `${META_BASE_URL}/${objectId}/insights`,
      {
        access_token: accessToken,
        level: params.level,
        time_range: JSON.stringify({
          since: params.since,
          until: params.until,
        }),
        fields,
      },
    );

    return data.data.map((row) => ({
      impressions: parseInt(row.impressions || "0"),
      clicks: parseInt(row.clicks || "0"),
      spend: parseFloat(row.spend || "0"),
      actions: row.actions || [],
      action_values: row.action_values || [],
      date_start: row.date_start,
    }));
  }

  /**
   * App access token (client_credentials) for server-side Graph calls such as
   * Ad Library search. Does not represent a specific Facebook user.
   */
  async getAppAccessToken(): Promise<string | null> {
    if (!this.appId || !this.appSecret) {
      this.logger.warn("META_APP_ID / META_APP_SECRET missing — cannot obtain app access token");
      return null;
    }
    try {
      const url = `${META_BASE_URL}/oauth/access_token`;
      const data = await this.apiGet<{ access_token: string }>(url, {
        client_id: this.appId,
        client_secret: this.appSecret,
        grant_type: "client_credentials",
      });
      return data.access_token ?? null;
    } catch (error: any) {
      const msg = error?.response?.data?.error?.message || error?.message || String(error);
      this.logger.warn(`Meta app access token failed: ${msg}`);
      return null;
    }
  }

  // ─── COMPETITOR INTELLIGENCE ──────────────────────────────────────────────

  /**
   * Search the Facebook Ad Library — the public database of all active ads.
   * This is the "competitor analysis" feature: we can see what ads
   * any page is currently running, what their creative looks like,
   * and how long they've been running them.
   *
   * This API is FREE and does not require an ad account — only the app token.
   */
  async searchAdLibrary(params: {
    searchTerms: string;
    adType?: string;
    countryCode?: string;
    limit?: number;
    accessToken: string;
  }): Promise<
    Array<{
      id: string;
      adCreativeBody: string;
      adCreativeLinkCaption: string;
      pageName: string;
      adDeliveryStartTime: string;
      impressionsLowerBound?: number;
      spendLowerBound?: number;
    }>
  > {
    const data = await this.apiGet<{ data: any[] }>(
      `${META_BASE_URL}/ads_archive`,
      {
        access_token: params.accessToken,
        ad_type: params.adType || "ALL",
        ad_reached_countries: JSON.stringify([params.countryCode || "UZ"]),
        search_terms: params.searchTerms,
        fields:
          "id,ad_creative_body,ad_creative_link_caption,page_name,ad_delivery_start_time,impressions,spend",
        limit: params.limit || 20,
      },
    );

    return data.data.map((ad) => ({
      id: ad.id,
      adCreativeBody: ad.ad_creative_body || "",
      adCreativeLinkCaption: ad.ad_creative_link_caption || "",
      pageName: ad.page_name || "",
      adDeliveryStartTime: ad.ad_delivery_start_time || "",
      impressionsLowerBound: ad.impressions?.lower_bound,
      spendLowerBound: ad.spend?.lower_bound,
    }));
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────

  private async apiGet<T>(
    url: string,
    params: Record<string, any>,
  ): Promise<T> {
    try {
      const response = await firstValueFrom(this.http.get<T>(url, { params }));
      return response.data;
    } catch (error: any) {
      const metaError = error.response?.data?.error;
      this.logger.error(
        `Meta API GET error: ${metaError?.message || error.message}`,
      );
      throw new BadRequestException(
        metaError?.message || "Meta API request failed",
      );
    }
  }

  private async apiPost<T>(url: string, data: Record<string, any>): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.http.post<T>(url, null, { params: data }),
      );
      return response.data;
    } catch (error: any) {
      const metaError = error.response?.data?.error;
      this.logger.error(
        `Meta API POST error: ${metaError?.message || error.message}`,
      );
      throw new BadRequestException(
        metaError?.message || "Meta API request failed",
      );
    }
  }
}
