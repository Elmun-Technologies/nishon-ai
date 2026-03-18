import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

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
    // TODO: Implement TikTok OAuth
    return "";
  }

  async createCampaign(): Promise<{ id: string }> {
    // TODO: Implement TikTok campaign creation
    return { id: "tiktok-stub-id" };
  }
}
