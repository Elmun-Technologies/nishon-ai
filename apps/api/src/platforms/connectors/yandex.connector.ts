import { Injectable, Logger } from "@nestjs/common";
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
   * TODO: Implement full campaign creation with ad groups and ads.
   */
  async createCampaign(
    accessToken: string,
    params: {
      name: string;
      startDate: string;
      dailyBudget?: number;
      currency?: string;
    },
  ): Promise<{ id: string }> {
    this.logger.log(`Yandex Direct campaign creation stub: ${params.name}`);

    // TODO: Implement via POST https://api.direct.yandex.com/json/v5/campaigns
    // Body example:
    // {
    //   "method": "add",
    //   "params": {
    //     "Campaigns": [{
    //       "Name": params.name,
    //       "StartDate": params.startDate,
    //       "Type": "TEXT_CAMPAIGN",
    //       "TextCampaign": {
    //         "BiddingStrategy": { "Search": { "OptimizingConversion": { "GoalId": 0, "AttributionModel": "LYDC" } } },
    //         "Settings": []
    //       }
    //     }]
    //   }
    // }

    return { id: "yandex-stub-id" };
  }

  /**
   * Get campaign performance insights from Yandex Direct.
   *
   * Uses the Reports API (not JSON API v5) — separate endpoint.
   * Reports are created asynchronously: POST → poll for readiness → GET.
   *
   * TODO: Implement async report generation and polling.
   */
  async getInsights(
    accessToken: string,
    accountLogin: string,
  ): Promise<any[]> {
    this.logger.log(
      `Yandex Direct getInsights stub for account: ${accountLogin}`,
    );
    // TODO: Implement via https://api.direct.yandex.com/v5/reports
    return [];
  }

  /**
   * Upload an image to Yandex Direct creative library.
   * Supports JPG, PNG, GIF — up to 10MB, minimum 450×450px, up to 5 variants.
   *
   * TODO: Implement via POST https://api.direct.yandex.com/json/v5/adimages
   */
  async uploadImage(
    accessToken: string,
    imageBase64: string,
    filename: string,
  ): Promise<{ imageHash: string }> {
    this.logger.log(`Yandex Direct uploadImage stub: ${filename}`);
    // TODO: Implement image upload
    return { imageHash: "stub-hash" };
  }
}
