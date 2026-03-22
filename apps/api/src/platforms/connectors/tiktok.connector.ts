import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { getOAuthCallbackUrl } from "./oauth-callback.util";

/**
 * TiktokConnector — TikTok Ads API integration.
 *
 * TikTok Ads API is similar to Meta but uses different terminology:
 * - "Campaign" → "Campaign" (same)
 * - "Ad Group" instead of "Ad Set"
 * - "Creative" instead of "Ad"
 * - All budgets in local currency (not cents)
 * - Requires TikTok for Business account
 *
 * Strong in CIS market — especially for 18-35 age group.
 *
 * TODO (Prompt 12): Implement using TikTok's official API.
 */
@Injectable()
export class TiktokConnector {
  private readonly logger = new Logger(TiktokConnector.name);

  constructor(private readonly config: ConfigService) {}

  getOAuthUrl(): string {
    const clientKey = this.config.get<string>("TIKTOK_APP_ID", "");
    const redirectUri = getOAuthCallbackUrl(this.config, "tiktok");

    if (!clientKey || !redirectUri) {
      this.logger.warn("TikTok OAuth requested without TIKTOK_APP_ID/API_BASE_URL");
      return "";
    }

    const params = new URLSearchParams({
      client_key: clientKey,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "ad.account.read,ad.report.read,ad.campaign.read,ad.campaign.write",
      state: "tiktok-oauth",
    });

    return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
  }

  async createCampaign(): Promise<{ id: string }> {
    // TODO: Implement TikTok campaign creation
    return { id: "tiktok-stub-id" };
  }
}
