import { ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthGuard } from "@nestjs/passport";
import type { Response } from "express";
import {
  isFacebookConfigured,
  isGoogleConfigured,
  resolveFrontendUrl,
} from "../oauth.util";

/**
 * OAuth guards that fail *honestly* instead of 500-ing. When the provider isn't
 * configured on the server, its passport strategy is never registered — the
 * default AuthGuard would throw "Unknown authentication strategy". Instead we
 * redirect to the frontend callback with a clean `error=not_configured` so the
 * user sees a real message. When configured, behaviour is the normal passport flow.
 */
@Injectable()
export class GoogleOAuthGuard extends AuthGuard("google") {
  constructor(private readonly config: ConfigService) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    if (!isGoogleConfigured(this.config)) {
      return this.redirectNotConfigured(context, "google", "Google");
    }
    return super.canActivate(context);
  }

  private redirectNotConfigured(
    context: ExecutionContext,
    provider: string,
    label: string,
  ): boolean {
    const res = context.switchToHttp().getResponse<Response>();
    const params = new URLSearchParams({
      error: "not_configured",
      detail: `${label} sign-in is not configured on the server.`,
    });
    res.redirect(
      `${resolveFrontendUrl(this.config)}/auth/${provider}/callback?${params.toString()}`,
    );
    return false;
  }
}

@Injectable()
export class FacebookOAuthGuard extends AuthGuard("facebook") {
  constructor(private readonly config: ConfigService) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    if (!isFacebookConfigured(this.config)) {
      const res = context.switchToHttp().getResponse<Response>();
      const params = new URLSearchParams({
        error: "not_configured",
        detail: "Facebook sign-in is not configured on the server.",
      });
      // Facebook errors are surfaced on the Google callback page (shared UI).
      res.redirect(
        `${resolveFrontendUrl(this.config)}/auth/google/callback?${params.toString()}`,
      );
      return false;
    }
    return super.canActivate(context);
  }
}
