import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  Query,
  Res,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";
import { MetaOAuthService } from "./meta-oauth.service";

/**
 * Public OAuth endpoints for Meta Ads integration.
 * No JWT guard — these routes handle the OAuth redirect dance before a token exists.
 *
 * Routes (no global prefix in this app):
 *   GET /meta/connect   → build Meta OAuth URL and redirect user to it
 *   GET /meta/callback  → Meta redirects here after user grants permission;
 *                         exchange code for access token, set cookie, redirect to frontend
 */
@Controller("meta")
export class MetaAuthController {
  private readonly logger = new Logger(MetaAuthController.name);

  constructor(
    private readonly metaOAuthService: MetaOAuthService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Entry point for the OAuth flow.
   * Frontend should redirect to this URL (NOT call it via fetch):
   *   window.location.href = `${BACKEND_URL}/meta/connect`
   *
   * Optional ?redirectTo=<url> tells the callback where to send the user after
   * a successful token exchange.
   */
  @Get("connect")
  redirectToMeta(
    @Query("redirectTo") redirectTo: string | undefined,
    @Res() res: Response,
  ): void {
    this.logger.log({ message: "/meta/connect hit — redirecting to Meta OAuth" });

    const oauthUrl = this.metaOAuthService.getAuthUrl(redirectTo);
    res.redirect(HttpStatus.FOUND, oauthUrl);
  }

  /**
   * OAuth callback — Meta redirects here after the user grants (or denies) access.
   * The `redirect_uri` registered in Meta App Dashboard must match this URL exactly.
   *
   * On success:
   *   1. Exchange `code` for an access token
   *   2. Store token in an httpOnly cookie
   *   3. Redirect to the frontend page encoded in `state`
   */
  @Get("callback")
  async metaCallback(
    @Query("code") code: string | undefined,
    @Query("error") error: string | undefined,
    @Query("error_description") errorDescription: string | undefined,
    @Query("state") state: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log({ message: "/meta/callback hit", hasCode: Boolean(code), error });

    // Meta sends `error` if the user denied the permission dialog
    if (error) {
      this.logger.warn({
        message: "Meta OAuth denied by user",
        error,
        errorDescription,
      });

      const frontendUrl = this.config.get<string>("FRONTEND_URL", "");
      const target = frontendUrl
        ? `${frontendUrl}/settings/meta?error=access_denied`
        : null;

      if (target) {
        res.redirect(HttpStatus.FOUND, target);
      } else {
        res.status(HttpStatus.BAD_REQUEST).json({ success: false, error: "Meta OAuth denied" });
      }
      return;
    }

    if (!code) {
      this.logger.error({ message: "Meta callback received no code and no error" });
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: "Missing 'code' in Meta OAuth callback",
      });
      return;
    }

    try {
      const tokenResponse = await this.metaOAuthService.exchangeCodeForToken(code);
      const frontendUrl = this.config.get<string>("FRONTEND_URL", "");
      const redirectTarget = this.resolveRedirectTarget(state, frontendUrl);

      this.logger.log({
        message: "Meta OAuth token exchange succeeded",
        hasAccessToken: Boolean(tokenResponse.access_token),
        redirectTarget,
      });

      // Store the token in an httpOnly cookie so the browser sends it on
      // subsequent requests to the backend without exposing it to JavaScript.
      res.cookie("meta_access_token", tokenResponse.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      if (redirectTarget) {
        const separator = redirectTarget.includes("?") ? "&" : "?";
        res.redirect(HttpStatus.FOUND, `${redirectTarget}${separator}connected=1`);
        return;
      }

      // No frontend redirect target — return JSON (useful for server-side callers)
      res.status(HttpStatus.OK).json({ success: true });
    } catch (err: any) {
      this.logger.error({
        message: "Meta token exchange failed",
        httpStatus: err?.response?.status,
        metaError: err?.response?.data?.error?.message ?? err?.message,
      });

      const frontendUrl = this.config.get<string>("FRONTEND_URL", "");
      const errorTarget = frontendUrl
        ? `${frontendUrl}/settings/meta?error=token_exchange_failed`
        : null;

      if (errorTarget) {
        res.redirect(HttpStatus.FOUND, errorTarget);
      } else {
        res.status(HttpStatus.BAD_GATEWAY).json({
          success: false,
          error: "Failed to exchange Meta authorisation code for access token",
        });
      }
    }
  }

  /**
   * Decodes the base64-JSON `state` parameter and validates that the embedded
   * `redirectTo` URL belongs to the configured FRONTEND_URL before returning it.
   * Returns null if state is absent, invalid, or points to an untrusted host.
   */
  private resolveRedirectTarget(state: string | undefined, frontendUrl: string): string | null {
    if (!state || !frontendUrl) return null;

    try {
      const decoded = JSON.parse(
        Buffer.from(state, "base64").toString("utf8"),
      ) as { redirectTo?: string };

      if (!decoded.redirectTo) return null;

      // Security check: only redirect to the configured frontend origin
      if (!decoded.redirectTo.startsWith(frontendUrl)) {
        this.logger.warn({
          message: "Ignoring untrusted OAuth redirect target",
          redirectTo: decoded.redirectTo,
          allowedOrigin: frontendUrl,
        });
        return null;
      }

      return decoded.redirectTo;
    } catch {
      return null;
    }
  }
}
