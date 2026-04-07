import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { getOAuthCallbackUrl } from "./oauth-callback.util";

/**
 * GoogleConnector — Google Ads REST API integration.
 *
 * Google Ads API v17 (REST endpoint):
 *   https://googleads.googleapis.com/v17/customers/{customerId}/...
 *
 * Key points:
 * - Requires a Developer Token (GOOGLE_DEVELOPER_TOKEN) in every request header
 * - Uses OAuth 2.0 refresh tokens for long-lived access
 * - Campaign hierarchy: Customer → Campaign → AdGroup → Ad
 * - Budgets in micros (1 USD = 1,000,000 micros)
 * - Query language: GAQL (Google Ads Query Language)
 */
@Injectable()
export class GoogleConnector {
  private readonly logger = new Logger(GoogleConnector.name);
  private readonly apiBase = "https://googleads.googleapis.com/v17";
  private readonly tokenUrl = "https://oauth2.googleapis.com/token";

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  // ─── OAUTH ────────────────────────────────────────────────────────────────

  getOAuthUrl(workspaceId: string): string {
    const clientId = this.config.get<string>("GOOGLE_CLIENT_ID", "");
    const redirectUri = getOAuthCallbackUrl(this.config, "google");

    if (!clientId || !redirectUri) {
      this.logger.warn("Google OAuth requested without GOOGLE_CLIENT_ID/API_BASE_URL");
      return "";
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      scope: "https://www.googleapis.com/auth/adwords",
      state: Buffer.from(JSON.stringify({ workspaceId })).toString("base64"),
    });

    this.logger.log(`Google OAuth URL requested for workspace: ${workspaceId}`);
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access + refresh tokens.
   * Returns refresh token (stored encrypted) and initial access token.
   */
  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  }> {
    const clientId = this.config.get<string>("GOOGLE_CLIENT_ID", "");
    const clientSecret = this.config.get<string>("GOOGLE_CLIENT_SECRET", "");
    const redirectUri = getOAuthCallbackUrl(this.config, "google");

    const params = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    try {
      const response = await firstValueFrom(
        this.http.post(this.tokenUrl, params.toString(), {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }),
      );

      const { access_token, refresh_token, expires_in } = response.data;
      const expiresAt = new Date(Date.now() + (expires_in ?? 3600) * 1000);

      return {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
      };
    } catch (error: any) {
      const detail = error.response?.data?.error_description || error.message;
      this.logger.error(`Google token exchange failed: ${detail}`);
      throw new BadRequestException(`Google OAuth token exchange failed: ${detail}`);
    }
  }

  /**
   * Refresh an expired access token using the stored refresh token.
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresAt: Date;
  }> {
    const clientId = this.config.get<string>("GOOGLE_CLIENT_ID", "");
    const clientSecret = this.config.get<string>("GOOGLE_CLIENT_SECRET", "");

    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    });

    try {
      const response = await firstValueFrom(
        this.http.post(this.tokenUrl, params.toString(), {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }),
      );

      const { access_token, expires_in } = response.data;
      const expiresAt = new Date(Date.now() + (expires_in ?? 3600) * 1000);

      return { accessToken: access_token, expiresAt };
    } catch (error: any) {
      const detail = error.response?.data?.error_description || error.message;
      throw new BadRequestException(`Google token refresh failed: ${detail}`);
    }
  }

  /**
   * List all accessible Google Ads customer accounts.
   * Returns the manager account's child accounts (or the direct account).
   */
  async getAccessibleCustomers(accessToken: string): Promise<
    Array<{ id: string; descriptiveName: string; currencyCode: string }>
  > {
    try {
      const response = await firstValueFrom(
        this.http.get(
          `${this.apiBase}/customers:listAccessibleCustomers`,
          { headers: this.buildHeaders(accessToken) },
        ),
      );

      const resourceNames: string[] = response.data.resourceNames ?? [];

      // For each resource name (customers/1234567890), get account details
      const accounts = await Promise.all(
        resourceNames.map(async (resource) => {
          const customerId = resource.split("/").pop()!;
          try {
            const info = await this.queryGaql(
              customerId,
              accessToken,
              "SELECT customer.id, customer.descriptive_name, customer.currency_code FROM customer LIMIT 1",
            );
            const row = info[0];
            return {
              id: String(row?.customer?.id ?? customerId),
              descriptiveName: row?.customer?.descriptive_name ?? customerId,
              currencyCode: row?.customer?.currency_code ?? "USD",
            };
          } catch {
            return { id: customerId, descriptiveName: customerId, currencyCode: "USD" };
          }
        }),
      );

      return accounts;
    } catch (error: any) {
      const detail = error.response?.data?.error?.message || error.message;
      this.logger.error(`Failed to list Google Ads customers: ${detail}`);
      throw new BadRequestException(`Google Ads: ${detail}`);
    }
  }

  // ─── CAMPAIGN MANAGEMENT ──────────────────────────────────────────────────

  /**
   * Create a campaign budget and campaign on Google Ads.
   * Budgets are in micros (1 USD = 1_000_000 micros).
   * New campaigns are created in PAUSED state for safety.
   */
  async createCampaign(
    customerId: string,
    accessToken: string,
    params: {
      name: string;
      advertisingChannelType: string; // SEARCH | DISPLAY | VIDEO | SHOPPING
      dailyBudgetUsd: number;
      status?: string; // PAUSED | ENABLED
    },
  ): Promise<{ id: string; budgetId: string }> {
    this.logger.log(`Creating Google Ads campaign: ${params.name}`);

    const devToken = this.config.get<string>("GOOGLE_DEVELOPER_TOKEN", "");
    const headers = { ...this.buildHeaders(accessToken), "developer-token": devToken };

    // Step 1: Create campaign budget
    const budgetResponse = await firstValueFrom(
      this.http.post(
        `${this.apiBase}/customers/${customerId}/campaignBudgets:mutate`,
        {
          operations: [{
            create: {
              name: `Budget for ${params.name}`,
              amountMicros: Math.round(params.dailyBudgetUsd * 1_000_000),
              deliveryMethod: "STANDARD",
            },
          }],
        },
        { headers },
      ).pipe(),
    ).catch((err) => {
      throw new BadRequestException(
        `Google Ads budget creation failed: ${err.response?.data?.error?.message || err.message}`,
      );
    });

    const budgetResourceName: string =
      budgetResponse.data.results?.[0]?.resourceName ?? "";
    const budgetId = budgetResourceName.split("/").pop() ?? "";

    // Step 2: Create campaign
    const campaignResponse = await firstValueFrom(
      this.http.post(
        `${this.apiBase}/customers/${customerId}/campaigns:mutate`,
        {
          operations: [{
            create: {
              name: params.name,
              advertisingChannelType: params.advertisingChannelType || "SEARCH",
              status: params.status || "PAUSED",
              campaignBudget: budgetResourceName,
              manualCpc: {},  // Default bidding strategy
              networkSettings: {
                targetGoogleSearch: true,
                targetSearchNetwork: true,
                targetContentNetwork: false,
              },
            },
          }],
        },
        { headers },
      ),
    ).catch((err) => {
      throw new BadRequestException(
        `Google Ads campaign creation failed: ${err.response?.data?.error?.message || err.message}`,
      );
    });

    const campaignResourceName: string =
      campaignResponse.data.results?.[0]?.resourceName ?? "";
    const campaignId = campaignResourceName.split("/").pop() ?? "";

    this.logger.log(`Google Ads campaign created: ${campaignId} (budget: ${budgetId})`);
    return { id: campaignId, budgetId };
  }

  /**
   * Create an ad group within a campaign.
   */
  async createAdGroup(
    customerId: string,
    accessToken: string,
    params: {
      campaignId: string;
      name: string;
      cpcBidMicros?: number; // bid in micros (e.g. 500000 = $0.50)
    },
  ): Promise<{ id: string }> {
    const devToken = this.config.get<string>("GOOGLE_DEVELOPER_TOKEN", "");
    const headers = { ...this.buildHeaders(accessToken), "developer-token": devToken };

    const response = await firstValueFrom(
      this.http.post(
        `${this.apiBase}/customers/${customerId}/adGroups:mutate`,
        {
          operations: [{
            create: {
              name: params.name,
              campaign: `customers/${customerId}/campaigns/${params.campaignId}`,
              status: "PAUSED",
              cpcBidMicros: params.cpcBidMicros ?? 1_000_000, // $1 default
            },
          }],
        },
        { headers },
      ),
    ).catch((err) => {
      throw new BadRequestException(
        `Google Ads ad group creation failed: ${err.response?.data?.error?.message || err.message}`,
      );
    });

    const resourceName: string = response.data.results?.[0]?.resourceName ?? "";
    const id = resourceName.split("/").pop() ?? "";
    return { id };
  }

  /**
   * Create a responsive search ad.
   */
  async createResponsiveSearchAd(
    customerId: string,
    accessToken: string,
    params: {
      adGroupId: string;
      headlines: string[]; // up to 15 headlines, each max 30 chars
      descriptions: string[]; // up to 4 descriptions, each max 90 chars
      finalUrls: string[];
    },
  ): Promise<{ id: string }> {
    const devToken = this.config.get<string>("GOOGLE_DEVELOPER_TOKEN", "");
    const headers = { ...this.buildHeaders(accessToken), "developer-token": devToken };

    const response = await firstValueFrom(
      this.http.post(
        `${this.apiBase}/customers/${customerId}/adGroupAds:mutate`,
        {
          operations: [{
            create: {
              adGroup: `customers/${customerId}/adGroups/${params.adGroupId}`,
              status: "PAUSED",
              ad: {
                responsiveSearchAd: {
                  headlines: params.headlines.slice(0, 15).map((text) => ({ text })),
                  descriptions: params.descriptions.slice(0, 4).map((text) => ({ text })),
                },
                finalUrls: params.finalUrls,
              },
            },
          }],
        },
        { headers },
      ),
    ).catch((err) => {
      throw new BadRequestException(
        `Google Ads ad creation failed: ${err.response?.data?.error?.message || err.message}`,
      );
    });

    const resourceName: string = response.data.results?.[0]?.resourceName ?? "";
    const id = resourceName.split("~").pop() ?? "";
    return { id };
  }

  /**
   * Update campaign status (ENABLED / PAUSED / REMOVED).
   */
  async updateCampaignStatus(
    customerId: string,
    accessToken: string,
    campaignId: string,
    status: "ENABLED" | "PAUSED" | "REMOVED",
  ): Promise<void> {
    const devToken = this.config.get<string>("GOOGLE_DEVELOPER_TOKEN", "");
    const headers = { ...this.buildHeaders(accessToken), "developer-token": devToken };

    await firstValueFrom(
      this.http.post(
        `${this.apiBase}/customers/${customerId}/campaigns:mutate`,
        {
          operations: [{
            update: {
              resourceName: `customers/${customerId}/campaigns/${campaignId}`,
              status,
            },
            updateMask: "status",
          }],
        },
        { headers },
      ),
    ).catch((err) => {
      throw new BadRequestException(
        `Google Ads campaign status update failed: ${err.response?.data?.error?.message || err.message}`,
      );
    });

    this.logger.log(`Google Ads campaign ${campaignId} status → ${status}`);
  }

  /**
   * Update campaign daily budget.
   */
  async updateCampaignBudget(
    customerId: string,
    accessToken: string,
    budgetId: string,
    dailyBudgetUsd: number,
  ): Promise<void> {
    const devToken = this.config.get<string>("GOOGLE_DEVELOPER_TOKEN", "");
    const headers = { ...this.buildHeaders(accessToken), "developer-token": devToken };

    await firstValueFrom(
      this.http.post(
        `${this.apiBase}/customers/${customerId}/campaignBudgets:mutate`,
        {
          operations: [{
            update: {
              resourceName: `customers/${customerId}/campaignBudgets/${budgetId}`,
              amountMicros: Math.round(dailyBudgetUsd * 1_000_000),
            },
            updateMask: "amount_micros",
          }],
        },
        { headers },
      ),
    ).catch((err) => {
      throw new BadRequestException(
        `Google Ads budget update failed: ${err.response?.data?.error?.message || err.message}`,
      );
    });

    this.logger.log(`Google Ads budget ${budgetId} → $${dailyBudgetUsd}/day`);
  }

  // ─── INSIGHTS ─────────────────────────────────────────────────────────────

  /**
   * Get campaign performance metrics using GAQL.
   * Returns daily metrics for the requested date range.
   */
  async getInsights(
    customerId: string,
    accessToken: string,
    params: {
      since: string; // YYYY-MM-DD
      until: string; // YYYY-MM-DD
      campaignId?: string;
    },
  ): Promise<Array<{
    campaignId: string;
    campaignName: string;
    date: string;
    impressions: number;
    clicks: number;
    costMicros: number;
    conversions: number;
  conversionValue: number;
  }>> {
    const campaignFilter = params.campaignId
      ? ` AND campaign.id = ${params.campaignId}`
      : "";

    const query = `
      SELECT
        campaign.id,
        campaign.name,
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign
      WHERE segments.date BETWEEN '${params.since}' AND '${params.until}'
        AND campaign.status != 'REMOVED'
        ${campaignFilter}
      ORDER BY segments.date DESC
    `;

    const rows = await this.queryGaql(customerId, accessToken, query);

    return rows.map((row) => ({
      campaignId: String(row.campaign?.id ?? ""),
      campaignName: row.campaign?.name ?? "",
      date: row.segments?.date ?? "",
      impressions: Number(row.metrics?.impressions ?? 0),
      clicks: Number(row.metrics?.clicks ?? 0),
      costMicros: Number(row.metrics?.cost_micros ?? 0),
      conversions: Number(row.metrics?.conversions ?? 0),
      conversionValue: Number(row.metrics?.conversions_value ?? 0),
    }));
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────

  /**
   * Execute a GAQL query against the Google Ads API.
   * Returns the raw rows array from the API response.
   */
  private async queryGaql(
    customerId: string,
    accessToken: string,
    query: string,
  ): Promise<any[]> {
    const devToken = this.config.get<string>("GOOGLE_DEVELOPER_TOKEN", "");
    const headers = { ...this.buildHeaders(accessToken), "developer-token": devToken };

    try {
      const response = await firstValueFrom(
        this.http.post(
          `${this.apiBase}/customers/${customerId}/googleAds:searchStream`,
          { query: query.trim() },
          { headers },
        ),
      );

      // searchStream returns an array of batch results, each with a results array
      const batches: any[] = Array.isArray(response.data)
        ? response.data
        : [response.data];

      return batches.flatMap((batch) => batch.results ?? []);
    } catch (error: any) {
      const detail = error.response?.data?.error?.message || error.message;
      this.logger.error(`GAQL query failed: ${detail}`);
      throw new BadRequestException(`Google Ads query failed: ${detail}`);
    }
  }

  private buildHeaders(accessToken: string): Record<string, string> {
    return {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
  }
}
