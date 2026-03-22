import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";

export type MetaOAuthState = {
  workspaceId: string;
  redirectTo?: string;
};

type MetaTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

const GRAPH_VERSION = "v20.0";

@Injectable()
export class MetaOAuthService {
  private readonly logger = new Logger(MetaOAuthService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  /**
   * Builds the Meta OAuth dialog URL to redirect the user to.
   *
   * The `workspaceId` MUST be provided — it is encoded into the OAuth `state`
   * so the callback knows which tenant to associate the token with.
   * The optional `redirectTo` tells the callback where to send the user after success.
   *
   * Alias: also exposed as `buildOAuthUrl()` for backward compatibility.
   */
  getAuthUrl(workspaceId: string, redirectTo?: string): string {
    const clientId = this.config.get<string>("META_APP_ID", "");
    const redirectUri = this.resolveCallbackUrl();

    // Encode workspace + redirectTo in state so they survive the Meta round-trip
    const statePayload: MetaOAuthState = { workspaceId, redirectTo };
    const state = Buffer.from(JSON.stringify(statePayload), "utf8").toString("base64");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "ads_management,ads_read,business_management",
      response_type: "code",
      state,
    });

    const url = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`;

    this.logger.log({
      message: "Meta OAuth URL built",
      workspaceId,
      redirectUri,
    });

    return url;
  }

  /** Backward-compatible alias — redirectTo only, workspaceId optional. */
  buildOAuthUrl(redirectTo?: string, workspaceId = "unknown"): string {
    return this.getAuthUrl(workspaceId, redirectTo);
  }

  /** Decodes the base64 state string back to a typed object. Returns null on failure. */
  decodeState(state: string): MetaOAuthState | null {
    try {
      return JSON.parse(Buffer.from(state, "base64").toString("utf8")) as MetaOAuthState;
    } catch {
      return null;
    }
  }

  async exchangeCodeForToken(code: string): Promise<MetaTokenResponse> {
    const clientId = this.config.get<string>("META_APP_ID", "");
    const clientSecret = this.config.get<string>("META_APP_SECRET", "");
    const redirectUri = this.resolveCallbackUrl();

    const response = await firstValueFrom(
      this.http.get<MetaTokenResponse>(
        `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`,
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

    this.logger.log({
      message: "Meta token exchange succeeded",
      tokenType: response.data.token_type ?? "unknown",
      expiresIn: response.data.expires_in ?? null,
      tokenPreview: this.maskToken(token),
    });

    return response.data;
  }

  /**
   * Resolves the OAuth callback URL.
   * Prefers the explicit `META_CALLBACK_URL` env var (must match Meta App Dashboard
   * exactly). Falls back to constructing it from `API_BASE_URL` + `/meta/callback`.
   */
  resolveCallbackUrl(): string {
    const explicit = this.config.get<string>("META_CALLBACK_URL", "").trim();
    if (explicit) return explicit;

    const apiBase = this.config.get<string>("API_BASE_URL", "").trim().replace(/\/$/, "");
    if (apiBase) return `${apiBase}/meta/callback`;

    this.logger.warn(
      "Neither META_CALLBACK_URL nor API_BASE_URL is set — OAuth redirect_uri will be empty",
    );
    return "";
  }

  private maskToken(token: string): string {
    if (!token || token.length < 10) return "[redacted]";
    return `${token.slice(0, 6)}...${token.slice(-4)}`;
  }
}
