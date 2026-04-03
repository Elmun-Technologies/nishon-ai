import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { getOAuthCallbackUrl } from "./oauth-callback.util";

/**
 * YandexConnector — Yandex Direct API integration.
 *
 * Yandex Direct is the dominant CIS ad platform, especially in Russia,
 * Kazakhstan, and Uzbekistan. Key facts:
 * - Uses OAuth 2.0 via oauth.yandex.ru
 * - REST API at api.direct.yandex.com/json/v5
 * - Ad types: Text-graphic, Combinatorial, Graphic, Product, Catalog pages, Neural
 * - Autotargeting: Target, Narrow, Broad, Accompanying, Alternative query categories
 * - Budget in local currency (UZS, RUB, KZT, etc.)
 * - Supports image upload (JPG/PNG/GIF, up to 10MB, min 450x450px, up to 5 variants)
 * - Supports video upload (MP4, up to 100MB, 5–60 seconds)
 * - CTA buttons: Visit site, Learn more, Learn price, Sign up, Sign up online, Buy, Order
 *
 * TODO: Implement full campaign management using Yandex Direct JSON API v5.
 */
@Injectable()
export class YandexConnector {
  private readonly logger = new Logger(YandexConnector.name);
  private readonly apiBase = "https://api.direct.yandex.com/json/v5";
  private readonly oauthBase = "https://oauth.yandex.ru";

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  /**
   * Generate Yandex OAuth authorization URL.
   * Redirects the user to Yandex's consent screen.
   *
   * Required env vars:
   *   YANDEX_CLIENT_ID — application ID from Yandex OAuth app
   *   API_BASE_URL     — used to build the callback redirect URI
   */
  getOAuthUrl(workspaceId: string): string {
    const clientId = this.config.get<string>("YANDEX_CLIENT_ID", "");
    const redirectUri = getOAuthCallbackUrl(this.config, "yandex");

    if (!clientId || !redirectUri) {
      this.logger.warn(
        "Yandex OAuth requested without YANDEX_CLIENT_ID/API_BASE_URL",
      );
      return "";
    }

    const state = Buffer.from(JSON.stringify({ workspaceId })).toString(
      "base64",
    );

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "direct",
      state,
    });

    this.logger.log(
      `Yandex Direct OAuth URL requested for workspace: ${workspaceId}`,
    );
    return `${this.oauthBase}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for an access token.
   *
   * Yandex token endpoint returns:
   *   access_token, expires_in, refresh_token, token_type
   */
  async exchangeCodeForToken(
    code: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    const clientId = this.config.get<string>("YANDEX_CLIENT_ID", "");
    const clientSecret = this.config.get<string>("YANDEX_CLIENT_SECRET", "");
    const redirectUri = getOAuthCallbackUrl(this.config, "yandex");

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });

    const response = await firstValueFrom(
      this.http.post(`${this.oauthBase}/token`, params.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }),
    );

    const { access_token, refresh_token, expires_in } = response.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    return { accessToken: access_token, refreshToken: refresh_token, expiresAt };
  }

  /**
   * Get list of advertiser clients available via the token.
   * Returns agency clients or the user's own login if no agency.
   *
   * Yandex Direct API v5: AgencyClients.get or simply uses the login
   * from the token info endpoint.
   */
  async getAdAccounts(
    accessToken: string,
  ): Promise<Array<{ id: string; name: string }>> {
    try {
      // Get token owner info from Yandex login API
      const response = await firstValueFrom(
        this.http.get("https://login.yandex.ru/info", {
          headers: { Authorization: `OAuth ${accessToken}` },
        }),
      );

      const { login, default_email } = response.data;
      return [{ id: login, name: default_email || login }];
    } catch (error) {
      this.logger.error("Failed to get Yandex accounts", error);
      return [];
    }
  }

  /**
   * Create a text-graphic campaign in Yandex Direct.
   *
   * Yandex Direct campaign hierarchy:
   *   Campaign → AdGroup → Ad (keyword/autotargeting conditions per group)
   *
   * Yandex API v5 JSON-RPC: POST https://api.direct.yandex.com/json/v5/campaigns
   */
  async createCampaign(
    accessToken: string,
    params: {
      name: string;
      startDate: string; // YYYY-MM-DD
      dailyBudget?: number;
      currency?: string;
    },
  ): Promise<{ id: string }> {
    this.logger.log(`Creating Yandex Direct campaign: ${params.name}`);

    const campaignData: Record<string, any> = {
      Name: params.name,
      StartDate: params.startDate,
      Type: "TEXT_CAMPAIGN",
      TextCampaign: {
        BiddingStrategy: {
          Search: {
            WbMaximumClicks: {
              WeeklySpendLimit: params.dailyBudget
                ? params.dailyBudget * 7 * 1_000_000 // micros
                : undefined,
              BidCeiling: undefined,
            },
          },
          Network: { ServingScope: "MAXIMUM_COVERAGE" },
        },
        Settings: [],
      },
    };

    if (params.dailyBudget) {
      campaignData.DailyBudget = {
        Amount: Math.round(params.dailyBudget * 1_000_000), // Yandex uses micros
        Mode: "STANDARD",
      };
    }

    const response = await this.jsonRpc(accessToken, "campaigns", "add", {
      Campaigns: [campaignData],
    });

    const campaignId = response.AddResults?.[0]?.Id;
    if (!campaignId) {
      const error = response.AddResults?.[0]?.Errors?.[0];
      throw new BadRequestException(
        `Yandex Direct campaign creation failed: ${error?.Message ?? "Unknown error"}`,
      );
    }

    this.logger.log(`Yandex Direct campaign created: ${campaignId}`);
    return { id: String(campaignId) };
  }

  /**
   * Pause a campaign.
   */
  async pauseCampaign(accessToken: string, campaignId: string): Promise<void> {
    await this.jsonRpc(accessToken, "campaigns", "suspend", {
      SelectionCriteria: { Ids: [Number(campaignId)] },
    });
    this.logger.log(`Yandex Direct campaign paused: ${campaignId}`);
  }

  /**
   * Resume a campaign.
   */
  async resumeCampaign(accessToken: string, campaignId: string): Promise<void> {
    await this.jsonRpc(accessToken, "campaigns", "resume", {
      SelectionCriteria: { Ids: [Number(campaignId)] },
    });
    this.logger.log(`Yandex Direct campaign resumed: ${campaignId}`);
  }

  /**
   * Update campaign daily budget.
   */
  async updateCampaignBudget(
    accessToken: string,
    campaignId: string,
    dailyBudgetAmount: number,
  ): Promise<void> {
    await this.jsonRpc(accessToken, "campaigns", "update", {
      Campaigns: [{
        Id: Number(campaignId),
        DailyBudget: {
          Amount: Math.round(dailyBudgetAmount * 1_000_000),
          Mode: "STANDARD",
        },
      }],
    });
    this.logger.log(`Yandex Direct budget updated: ${campaignId} → ${dailyBudgetAmount}`);
  }

  /**
   * Get campaign performance insights from Yandex Direct Reports API.
   *
   * Reports API is separate from JSON API v5.
   * For short ranges (< 7 days), reports are returned synchronously.
   * For longer ranges, the API returns 201/202 and we poll until ready.
   */
  async getInsights(
    accessToken: string,
    accountLogin: string,
    params?: { since?: string; until?: string; campaignIds?: string[] },
  ): Promise<Array<{
    campaignId: string;
    date: string;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    ctr: number;
  }>> {
    this.logger.log(`Fetching Yandex Direct insights for: ${accountLogin}`);

    const selection: Record<string, any> = {
      DateRangeType: "CUSTOM_DATE",
      DateFrom: params?.since ?? this.daysAgo(7),
      DateTo: params?.until ?? this.daysAgo(1),
    };

    if (params?.campaignIds?.length) {
      selection.Filter = [{
        Field: "CampaignId",
        Operator: "IN",
        Values: params.campaignIds,
      }];
    }

    const reportBody = JSON.stringify({
      params: {
        SelectionCriteria: selection,
        FieldNames: [
          "Date",
          "CampaignId",
          "CampaignName",
          "Impressions",
          "Clicks",
          "Cost",
          "Conversions",
          "Ctr",
        ],
        ReportName: `PerformaAI_Report_${Date.now()}`,
        ReportType: "CAMPAIGN_PERFORMANCE_REPORT",
        DateRangeType: "CUSTOM_DATE",
        Format: "TSV",
        IncludeVAT: "NO",
        IncludeDiscount: "NO",
      },
    });

    try {
      // Poll for the report (Yandex returns 200 when ready, 201/202 when processing)
      let tsvData: string | null = null;
      let attempts = 0;

      while (!tsvData && attempts < 10) {
        const response = await firstValueFrom(
          this.http.post(
            `${this.apiBase}/reports`,
            reportBody,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Client-Login": accountLogin,
                "Accept-Language": "ru",
                "processingMode": "auto",
                "returnMoneyInMicros": "false",
              },
              responseType: "text",
            },
          ),
        );

        if (response.status === 200) {
          tsvData = response.data as string;
        } else if (response.status === 201 || response.status === 202) {
          // Report is being prepared — wait and retry
          await new Promise((resolve) => setTimeout(resolve, 5000));
          attempts++;
        } else {
          this.logger.warn(`Yandex report unexpected status: ${response.status}`);
          return [];
        }
      }

      if (!tsvData) {
        this.logger.warn("Yandex report not ready after polling — returning empty");
        return [];
      }

      return this.parseTsvReport(tsvData);
    } catch (error: any) {
      const detail = error.response?.data || error.message;
      this.logger.error(`Yandex Direct getInsights failed: ${detail}`);
      return [];
    }
  }

  /**
   * Upload an image to Yandex Direct creative library.
   * Supports JPG, PNG, GIF — up to 10MB, minimum 450×450px.
   * Returns image hash for use in ad creatives.
   */
  async uploadImage(
    accessToken: string,
    imageBase64: string,
    filename: string,
  ): Promise<{ imageHash: string }> {
    this.logger.log(`Uploading image to Yandex Direct: ${filename}`);

    const response = await this.jsonRpc(accessToken, "adimages", "add", {
      AdImages: [{
        ImageData: imageBase64,
        Name: filename,
      }],
    });

    const imageHash = response.AddResults?.[0]?.AdImageHash;
    if (!imageHash) {
      const error = response.AddResults?.[0]?.Errors?.[0];
      throw new BadRequestException(
        `Yandex Direct image upload failed: ${error?.Message ?? "Unknown error"}`,
      );
    }

    this.logger.log(`Yandex Direct image uploaded: ${imageHash}`);
    return { imageHash };
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────

  /**
   * Send a JSON-RPC v5 request to Yandex Direct API.
   * All Yandex Direct v5 methods follow the same pattern:
   *   POST /json/v5/{service}
   *   Body: { method, params }
   */
  private async jsonRpc(
    accessToken: string,
    service: string,
    method: string,
    params: Record<string, any>,
  ): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(
          `${this.apiBase}/${service}`,
          { method, params },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              "Accept-Language": "ru",
            },
          },
        ),
      );

      if (response.data.error) {
        const err = response.data.error;
        throw new BadRequestException(
          `Yandex Direct API error [${err.error_code}]: ${err.error_detail || err.error_string}`,
        );
      }

      return response.data.result ?? response.data;
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      const detail = error.response?.data?.error?.error_detail || error.message;
      this.logger.error(`Yandex Direct JSON-RPC error [${service}.${method}]: ${detail}`);
      throw new BadRequestException(`Yandex Direct request failed: ${detail}`);
    }
  }

  /**
   * Parse TSV report from Yandex Direct Reports API.
   * Format: tab-separated values with a header row and a totals row at the end.
   */
  private parseTsvReport(tsv: string): Array<{
    campaignId: string;
    date: string;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    ctr: number;
  }> {
    const lines = tsv.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return [];

    // Skip the report name line (first line) and use second line as header
    const headerLine = lines.find((l) => l.includes("Date") || l.includes("CampaignId"));
    if (!headerLine) return [];

    const headers = headerLine.split("\t").map((h) => h.trim().toLowerCase());
    const dataLines = lines.slice(lines.indexOf(headerLine) + 1);

    const results = [];

    for (const line of dataLines) {
      const cols = line.split("\t");
      if (cols.length < 3) continue;

      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = cols[i]?.trim() ?? ""; });

      // Skip totals row
      if (row["date"] === "Total" || row["campaignid"] === "Total") continue;

      results.push({
        campaignId: row["campaignid"] ?? "",
        date: row["date"] ?? "",
        impressions: parseFloat(row["impressions"] ?? "0") || 0,
        clicks: parseFloat(row["clicks"] ?? "0") || 0,
        cost: parseFloat(row["cost"] ?? "0") || 0,
        conversions: parseFloat(row["conversions"] ?? "0") || 0,
        ctr: parseFloat(row["ctr"] ?? "0") || 0,
      });
    }

    return results;
  }

  /** Returns date string N days ago in YYYY-MM-DD format */
  private daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split("T")[0];
  }
}
