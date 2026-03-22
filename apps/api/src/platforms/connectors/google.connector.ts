import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { getOAuthCallbackUrl } from "./oauth-callback.util";

/**
 * GoogleConnector — Google Ads API integration.
 *
 * Google Ads API is significantly more complex than Meta:
 * - Uses gRPC protocol (not REST)
 * - Requires a Developer Token approved by Google
 * - Has a strict hierarchy: Manager Account → Client Account → Campaign
 * - OAuth uses Google's own library (google-auth-library)
 *
 * TODO (Prompt 11): Implement using the official google-ads-api npm package.
 * All methods below are stubs ready to be filled in.
 */
@Injectable()
export class GoogleConnector {
  private readonly logger = new Logger(GoogleConnector.name);

  constructor(private readonly config: ConfigService) {}

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

  async createCampaign(): Promise<{ id: string }> {
    // TODO: Implement using google-ads-api
    this.logger.log(`Google campaign creation stub called`);
    return { id: "google-stub-id" };
  }

  async getInsights(): Promise<any[]> {
    // TODO: Implement Google Ads insights (uses GAQL — Google Ads Query Language)
    return [];
  }
}
