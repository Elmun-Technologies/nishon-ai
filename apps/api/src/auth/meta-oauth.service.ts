import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";

type MetaTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

@Injectable()
export class MetaOAuthService {
  private readonly logger = new Logger(MetaOAuthService.name);
  private latestAccessToken: string | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  buildOAuthUrl(redirectTo?: string): string {
    const clientId = this.config.get<string>("META_APP_ID", "");
    const redirectUri = this.config.get<string>("META_CALLBACK_URL", "");

    const statePayload = redirectTo ? { redirectTo } : undefined;
    const state = statePayload
      ? Buffer.from(JSON.stringify(statePayload), "utf8").toString("base64")
      : undefined;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "ads_management,ads_read,business_management",
      response_type: "code",
    });

    if (state) {
      params.set("state", state);
    }

    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<MetaTokenResponse> {
    const clientId = this.config.get<string>("META_APP_ID", "");
    const clientSecret = this.config.get<string>("META_APP_SECRET", "");
    const redirectUri = this.config.get<string>("META_CALLBACK_URL", "");

    const response = await firstValueFrom(
      this.http.get<MetaTokenResponse>(
        "https://graph.facebook.com/v19.0/oauth/access_token",
        {
          params: {
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            code,
          },
        },
      ),
    );

    const token = response.data.access_token;
    this.latestAccessToken = token;

    this.logger.log({
      message: "Meta token exchange succeeded",
      tokenType: response.data.token_type ?? "unknown",
      expiresIn: response.data.expires_in ?? null,
      tokenPreview: this.maskToken(token),
    });

    return response.data;
  }

  getLatestAccessToken(): string | null {
    return this.latestAccessToken;
  }

  private maskToken(token: string): string {
    if (!token || token.length < 10) {
      return "[redacted]";
    }

    return `${token.slice(0, 6)}...${token.slice(-4)}`;
  }
}
