import {
  BadRequestException,
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

@Controller("api/v1/auth")
export class MetaAuthController {
  private readonly logger = new Logger(MetaAuthController.name);

  constructor(
    private readonly metaOAuthService: MetaOAuthService,
    private readonly config: ConfigService,
  ) {}

  @Get("meta")
  redirectToMeta(
    @Query("redirectTo") redirectTo: string | undefined,
    @Res() res: Response,
  ): void {
    this.logger.log({ message: "Meta OAuth start endpoint hit" });

    const oauthUrl = this.metaOAuthService.buildOAuthUrl(redirectTo);
    res.redirect(HttpStatus.FOUND, oauthUrl);
  }

  @Get("meta/callback")
  async metaCallback(
    @Query("code") code: string | undefined,
    @Query("state") state: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log({ message: "Meta OAuth callback endpoint hit" });

    if (!code) {
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: "Missing 'code' query parameter",
      });
      return;
    }

    try {
      const tokenResponse = await this.metaOAuthService.exchangeCodeForToken(code);
      const frontendUrl = this.config.get<string>("FRONTEND_URL", "");
      const redirectTo = this.resolveRedirectTarget(state, frontendUrl);

      this.logger.log({
        message: "Meta OAuth callback completed",
        hasAccessToken: Boolean(tokenResponse.access_token),
      });

      res.cookie("meta_access_token", tokenResponse.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 60 * 60 * 1000,
      });

      if (redirectTo) {
        res.redirect(HttpStatus.FOUND, `${redirectTo}${redirectTo.includes("?") ? "&" : "?"}connected=1`);
        return;
      }

      res.status(HttpStatus.OK).json({
        success: true,
        access_token: tokenResponse.access_token,
      });
    } catch (error: any) {
      this.logger.error({
        message: "Meta token exchange failed",
        status: error?.response?.status,
        metaError: error?.response?.data?.error?.message || error?.message,
      });

      res.status(HttpStatus.BAD_GATEWAY).json({
        success: false,
        error: "Failed to exchange code for Meta access token",
      });
    }
  }

  private resolveRedirectTarget(state: string | undefined, frontendUrl: string): string | null {
    if (!state || !frontendUrl) {
      return null;
    }

    try {
      const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf8")) as {
        redirectTo?: string;
      };

      if (!decoded.redirectTo) {
        return null;
      }

      if (!decoded.redirectTo.startsWith(frontendUrl)) {
        throw new BadRequestException("Invalid redirect target");
      }

      return decoded.redirectTo;
    } catch {
      return null;
    }
  }
}
