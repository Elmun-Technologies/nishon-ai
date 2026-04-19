import {
  Controller,
  ForbiddenException,
  Get,
  HttpStatus,
  Logger,
  Query,
  Res,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Response } from "express";
import { MetaOAuthService } from "./meta-oauth.service";
import { ConnectedAccount } from "../platforms/entities/connected-account.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { Platform } from "@adspectr/shared";
import { encrypt } from "../common/crypto.util";

/**
 * Public OAuth endpoints for Meta Ads integration.
 * No JWT guard — these routes handle the OAuth redirect dance before a token exists.
 *
 * Routes:
 *   GET /meta/connect   → build Meta OAuth URL and redirect user to it
 *   GET /meta/callback  → Meta redirects here; exchange code, persist token, redirect to frontend
 *
 * IMPORTANT: The redirect_uri registered in Meta App Dashboard must be exactly:
 *   https://<your-backend>/meta/callback
 */
@Controller("meta")
export class MetaAuthController {
  private readonly logger = new Logger(MetaAuthController.name);

  private readonly encryptionKey: string | null;

  constructor(
    private readonly metaOAuthService: MetaOAuthService,
    private readonly config: ConfigService,
    @InjectRepository(ConnectedAccount)
    private readonly connectedAccountRepo: Repository<ConnectedAccount>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
  ) {
    const key = this.config.get<string>("ENCRYPTION_KEY", "");
    if (key.length === 32) {
      this.encryptionKey = key;
    } else {
      this.logger.warn(
        "ENCRYPTION_KEY is not set or not 32 chars — Meta tokens will be stored unencrypted",
      );
      this.encryptionKey = null;
    }
  }

  /**
   * Entry point for the OAuth flow.
   * The frontend must redirect the browser here — NOT call via fetch():
   *   window.location.href = `${BACKEND_URL}/meta/connect?workspaceId=<id>`
   *
   * workspaceId is REQUIRED — it identifies which tenant is connecting Meta.
   * redirectTo tells the callback where to send the user after success.
   */
  @Get("connect")
  redirectToMeta(
    @Query("workspaceId") workspaceId: string | undefined,
    @Query("redirectTo") redirectTo: string | undefined,
    @Res() res: Response,
  ): void {
    this.logger.log({ message: "/meta/connect hit", workspaceId, hasRedirectTo: Boolean(redirectTo) });

    if (!workspaceId) {
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: "workspaceId query parameter is required to start Meta OAuth",
      });
      return;
    }

    const oauthUrl = this.metaOAuthService.getAuthUrl(workspaceId, redirectTo);
    res.redirect(HttpStatus.FOUND, oauthUrl);
  }

  /**
   * OAuth callback — Meta redirects here after the user grants (or denies) access.
   *
   * On success:
   *   1. Decode `state` → extract workspaceId + redirectTo
   *   2. Verify workspace exists
   *   3. Exchange `code` for access token
   *   4. Persist token to connected_accounts (upsert by workspace + platform)
   *   5. Set httpOnly cookie for same-session API calls
   *   6. Redirect to frontend with ?connected=1
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

    const frontendUrl = this.config.get<string>("FRONTEND_URL", "");

    // ── Meta denied (user cancelled) ──────────────────────────────────────────
    if (error) {
      this.logger.warn({ message: "Meta OAuth denied by user", error, errorDescription });
      this.redirectWithError(res, frontendUrl, "access_denied");
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

    // ── Decode state ──────────────────────────────────────────────────────────
    const decoded = state ? this.metaOAuthService.decodeState(state) : null;
    const workspaceId = decoded?.workspaceId;
    const redirectTo = decoded?.redirectTo;

    if (!workspaceId) {
      this.logger.error({ message: "Meta callback: workspaceId missing from state" });
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: "Missing workspaceId in OAuth state — cannot identify tenant",
      });
      return;
    }

    // ── Verify workspace exists ───────────────────────────────────────────────
    const workspace = await this.workspaceRepo.findOne({ where: { id: workspaceId } });
    if (!workspace) {
      this.logger.error({ message: "Meta callback: workspace not found", workspaceId });
      throw new ForbiddenException("Invalid workspace — cannot associate Meta token");
    }

    try {
      // ── Exchange code for token ───────────────────────────────────────────
      const tokenResponse = await this.metaOAuthService.exchangeCodeForToken(code);
      const accessToken = tokenResponse.access_token;

      // ── Persist token to connected_accounts (upsert) ──────────────────────
      // This is what the cron auto-sync reads to find tokens per workspace.
      await this.upsertConnectedAccount(workspaceId, accessToken, tokenResponse.expires_in);

      this.logger.log({
        message: "Meta OAuth complete — token saved to connected_accounts",
        workspaceId,
        hasAccessToken: Boolean(accessToken),
      });

      // ── Set short-lived httpOnly cookie for same-session passthrough calls ─
      res.cookie("meta_access_token", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      // ── Redirect back to frontend ─────────────────────────────────────────
      const target = this.resolveRedirectTarget(redirectTo, frontendUrl, workspaceId);
      if (target) {
        res.redirect(HttpStatus.FOUND, target);
      } else {
        res.status(HttpStatus.OK).json({ success: true, workspaceId });
      }
    } catch (err: any) {
      this.logger.error({
        message: "Meta token exchange failed",
        workspaceId,
        httpStatus: err?.response?.status,
        metaError: err?.response?.data?.error?.message ?? err?.message,
      });
      this.redirectWithError(res, frontendUrl, "token_exchange_failed");
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Upserts the Meta access token for a workspace.
   * If a ConnectedAccount already exists for this workspace + META, it is updated.
   * Otherwise a new record is created.
   */
  private async upsertConnectedAccount(
    workspaceId: string,
    accessToken: string,
    expiresIn?: number,
  ): Promise<void> {
    const tokenExpiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : null;

    // Encrypt token at rest when ENCRYPTION_KEY is available
    const storedToken = this.encryptionKey
      ? encrypt(accessToken, this.encryptionKey)
      : accessToken;

    const existing = await this.connectedAccountRepo.findOne({
      where: { workspaceId, platform: Platform.META },
    });

    if (existing) {
      existing.accessToken = storedToken;
      existing.isActive = true;
      existing.tokenExpiresAt = tokenExpiresAt;
      await this.connectedAccountRepo.save(existing);
    } else {
      const record = this.connectedAccountRepo.create({
        workspaceId,
        platform: Platform.META,
        accessToken: storedToken,
        refreshToken: null,
        externalAccountId: "meta_oauth",   // updated to real ID on first sync
        externalAccountName: "Meta Account", // updated to real name on first sync
        isActive: true,
        tokenExpiresAt,
      });
      await this.connectedAccountRepo.save(record);
    }
  }

  /**
   * Returns a safe redirect target for the post-OAuth redirect.
   * If `redirectTo` is set and matches the allowed frontend origin, use it
   * (append ?connected=1&workspaceId=...). Otherwise fall back to /settings/meta.
   */
  private resolveRedirectTarget(
    redirectTo: string | undefined,
    frontendUrl: string,
    workspaceId: string,
  ): string | null {
    if (!frontendUrl) return null;

    let target: string;

    if (redirectTo && redirectTo.startsWith(frontendUrl)) {
      target = redirectTo;
    } else {
      // Safe fallback within the allowed frontend origin
      target = `${frontendUrl}/settings/meta`;
    }

    const separator = target.includes("?") ? "&" : "?";
    return `${target}${separator}connected=1&workspaceId=${encodeURIComponent(workspaceId)}`;
  }

  /** Redirects to the frontend with an error query param. */
  private redirectWithError(res: Response, frontendUrl: string, error: string): void {
    if (frontendUrl) {
      res.redirect(HttpStatus.FOUND, `${frontendUrl}/settings/meta?error=${error}`);
    } else {
      res.status(HttpStatus.BAD_REQUEST).json({ success: false, error });
    }
  }
}
