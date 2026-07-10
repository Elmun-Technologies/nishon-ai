import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { getOAuthCallbackUrl } from "./oauth-callback.util";

// Meta Graph API version — update when Meta releases new versions
// Keep in sync with GRAPH_VERSION in meta-oauth.service.ts — token exchange
// and campaign creation must run on the same Graph API version.
const META_API_VERSION = "v20.0";
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export interface MetaCampaignCreateParams {
  name: string;
  objective: string; // e.g. 'OUTCOME_LEADS', 'OUTCOME_SALES', 'OUTCOME_TRAFFIC'
  status: string; // 'ACTIVE' | 'PAUSED'
  // Campaign-level daily budget in dollars — set for CBO (campaign budget
  // optimization). Omit for ABO, where each ad set owns its budget; Meta
  // rejects a launch that carries a budget at BOTH levels.
  dailyBudget?: number;
  specialAdCategories: string[]; // Required by Meta — [] for most campaigns
}

export interface MetaAdSetCreateParams {
  campaignId: string;
  name: string;
  // Ad-set daily budget in dollars — set for ABO. Omit for CBO, where the
  // campaign owns the budget and ad sets must NOT carry one.
  dailyBudget?: number;
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
      throw new BadRequestException(
        "API_BASE_URL is not configured for Meta OAuth callback",
      );
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
      throw new BadRequestException(
        "API_BASE_URL is not configured for Meta OAuth callback",
      );
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
        // Only send a campaign budget for CBO. Sending it alongside ad-set
        // budgets (ABO) makes Meta reject the whole launch.
        ...(params.dailyBudget != null
          ? { daily_budget: Math.round(params.dailyBudget * 100) }
          : {}),
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

  /**
   * Read a campaign's current name/status/daily budget. Used by the autonomous
   * optimizer to compute a relative budget change (e.g. +30%) from the real
   * current value. `dailyBudget` is returned in dollars (Meta stores cents).
   */
  async getCampaign(
    campaignId: string,
    accessToken: string,
  ): Promise<{
    id: string;
    name: string;
    status: string;
    dailyBudget: number | null;
  }> {
    const data = await this.apiGet<{
      id: string;
      name?: string;
      status?: string;
      daily_budget?: string;
    }>(`${META_BASE_URL}/${campaignId}`, {
      access_token: accessToken,
      fields: "id,name,status,daily_budget",
    });
    const cents =
      data.daily_budget != null ? parseInt(data.daily_budget, 10) : NaN;
    return {
      id: data.id,
      name: data.name ?? "",
      status: data.status ?? "",
      dailyBudget: Number.isFinite(cents) ? cents / 100 : null,
    };
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
        // Only send an ad-set budget for ABO. Under CBO the campaign owns the
        // budget and an ad-set budget here would be rejected by Meta.
        ...(params.dailyBudget != null
          ? { daily_budget: Math.round(params.dailyBudget * 100) }
          : {}),
        billing_event: params.billingEvent,
        optimization_goal: params.optimizationGoal,
        targeting: JSON.stringify(targeting),
        start_time: params.startTime,
        end_time: params.endTime,
        status: "PAUSED", // Always start paused — let user review before going live
      },
    );
  }

  // ─── CUSTOM AUDIENCES ────────────────────────────────────────────────────

  /**
   * List Custom Audiences (and Lookalikes — Meta returns them in the same
   * collection) for a given ad account. Used by the /audiences page so users
   * see what they actually have on Meta instead of a hardcoded preset list.
   */
  async getCustomAudiences(
    adAccountId: string,
    accessToken: string,
  ): Promise<
    Array<{
      id: string;
      name: string;
      description: string | null;
      subtype: string;
      approximateCount: number | null;
      deliveryStatus: string | null;
      timeCreated: string | null;
    }>
  > {
    const data = await this.apiGet<{ data: any[] }>(
      `${META_BASE_URL}/${adAccountId}/customaudiences`,
      {
        access_token: accessToken,
        fields:
          "id,name,description,subtype,approximate_count_lower_bound,approximate_count_upper_bound,delivery_status,time_created",
        limit: "100",
      },
    );
    return (data.data ?? []).map((a) => {
      const lower = Number(a.approximate_count_lower_bound ?? 0);
      const upper = Number(a.approximate_count_upper_bound ?? 0);
      const approx = upper > 0 ? Math.round((lower + upper) / 2) : null;
      return {
        id: String(a.id),
        name: String(a.name ?? a.id),
        description: a.description ? String(a.description) : null,
        subtype: String(a.subtype ?? "CUSTOM"),
        approximateCount: approx,
        deliveryStatus: a.delivery_status?.description ?? null,
        timeCreated: a.time_created ?? null,
      };
    });
  }

  /**
   * Create a Lookalike Audience from an existing source audience id.
   * Meta returns the new audience id immediately; the population status is
   * surfaced through `delivery_status` on subsequent list calls.
   */
  async createLookalikeAudience(
    adAccountId: string,
    accessToken: string,
    params: {
      name: string;
      sourceAudienceId: string;
      /** ISO 3166-1 alpha-2 country code (e.g. "US", "UZ"). */
      country: string;
      /** Ratio between 0.01 and 0.20 (1% — 20%). Smaller = higher fidelity. */
      ratio: number;
    },
  ): Promise<{ id: string }> {
    const ratio = Math.max(0.01, Math.min(0.2, Number(params.ratio) || 0.01));
    return this.apiPost<{ id: string }>(
      `${META_BASE_URL}/${adAccountId}/customaudiences`,
      {
        access_token: accessToken,
        name: params.name,
        subtype: "LOOKALIKE",
        origin_audience_id: params.sourceAudienceId,
        lookalike_spec: JSON.stringify({
          type: "similarity",
          country: params.country,
          ratio,
        }),
      },
    );
  }

  // ─── ADS ─────────────────────────────────────────────────────────────────

  /**
   * List ads under a campaign, returning the `creative.id` for each.
   * Used by the Ad Launcher to copy the existing creatives from the
   * "source" campaign onto the freshly created ad set(s).
   */
  async getCampaignAds(
    campaignId: string,
    accessToken: string,
  ): Promise<
    Array<{
      id: string;
      name: string;
      creativeId: string | null;
      status: string;
    }>
  > {
    const data = await this.apiGet<{ data: any[] }>(
      `${META_BASE_URL}/${campaignId}/ads`,
      {
        access_token: accessToken,
        fields: "id,name,status,creative{id}",
        limit: "50",
      },
    );
    return (data.data ?? []).map((ad) => ({
      id: String(ad.id),
      name: String(ad.name ?? ad.id),
      creativeId: ad?.creative?.id ? String(ad.creative.id) : null,
      status: String(ad.status ?? "UNKNOWN"),
    }));
  }

  /**
   * Create an ad on Meta by reusing an existing creative (by id).
   * This is how the Ad Launcher copies the creative from a source campaign
   * onto a newly-created ad set — Meta lets multiple ads reference the
   * same creative object.
   */
  async createAdFromExistingCreative(
    adAccountId: string,
    accessToken: string,
    params: { adSetId: string; name: string; existingCreativeId: string },
  ): Promise<{ id: string }> {
    return this.apiPost<{ id: string }>(`${META_BASE_URL}/${adAccountId}/ads`, {
      access_token: accessToken,
      name: params.name,
      adset_id: params.adSetId,
      creative: JSON.stringify({ creative_id: params.existingCreativeId }),
      status: "PAUSED",
    });
  }

  /**
   * List Facebook Pages the user has access to. Required for inline creative
   * since every Meta ad creative must be associated with a Page.
   */
  async getPages(
    accessToken: string,
  ): Promise<Array<{ id: string; name: string; category?: string }>> {
    const data = await this.apiGet<{
      data: Array<{ id: string; name: string; category?: string }>;
    }>(`${META_BASE_URL}/me/accounts`, {
      access_token: accessToken,
      fields: "id,name,category",
      limit: "50",
    });
    return (data.data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
    }));
  }

  /**
   * Create an inline ad creative from text + URL + CTA. Returns the creative id
   * which can then be attached to an Ad via `createAdFromExistingCreative`.
   *
   * The creative is built as a link_data object_story_spec attached to the
   * given Page. If `imageHash` is provided it's used; otherwise a plain link
   * preview is generated by Meta from the URL.
   */
  async createAdCreative(
    adAccountId: string,
    accessToken: string,
    params: {
      name: string;
      pageId: string;
      message: string;
      linkUrl: string;
      headline?: string;
      description?: string;
      callToActionType?: string; // 'LEARN_MORE' | 'SHOP_NOW' | 'SIGN_UP' | 'CONTACT_US'
      imageHash?: string;
    },
  ): Promise<{ id: string }> {
    const linkData: Record<string, any> = {
      link: params.linkUrl,
      message: params.message,
    };
    if (params.headline) linkData.name = params.headline;
    if (params.description) linkData.description = params.description;
    if (params.imageHash) linkData.image_hash = params.imageHash;
    if (params.callToActionType) {
      linkData.call_to_action = {
        type: params.callToActionType,
        value: { link: params.linkUrl },
      };
    }
    return this.apiPost<{ id: string }>(
      `${META_BASE_URL}/${adAccountId}/adcreatives`,
      {
        access_token: accessToken,
        name: params.name,
        object_story_spec: JSON.stringify({
          page_id: params.pageId,
          link_data: linkData,
        }),
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
      /** Present when `level: "ad"` and `ad_id` was requested in `fields`. */
      ad_id?: string;
    }>
  > {
    const defaultFields =
      "impressions,clicks,spend,actions,action_values,ctr,cpm,cpp,reach";
    const fields =
      params.fields.length > 0 ? params.fields.join(",") : defaultFields;

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
      ad_id:
        row.ad_id != null && row.ad_id !== "" ? String(row.ad_id) : undefined,
    }));
  }

  /**
   * App access token (client_credentials) for server-side Graph calls such as
   * Ad Library search. Does not represent a specific Facebook user.
   */
  async getAppAccessToken(): Promise<string | null> {
    if (!this.appId || !this.appSecret) {
      this.logger.warn(
        "META_APP_ID / META_APP_SECRET missing — cannot obtain app access token",
      );
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
      const msg =
        error?.response?.data?.error?.message ||
        error?.message ||
        String(error);
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
