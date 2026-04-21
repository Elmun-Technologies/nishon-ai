import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";

/**
 * CRM webhook: `CRM_WEBHOOK_SECRET` bo‘lsa, `X-CRM-Secret` header majburiy.
 */
@Injectable()
export class CrmWebhookGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.config.get<string>("CRM_WEBHOOK_SECRET", "").trim();
    if (!secret) {
      return true;
    }
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers["x-crm-secret"];
    const value = Array.isArray(header) ? header[0] : header;
    if (value !== secret) {
      throw new UnauthorizedException("Invalid CRM webhook secret");
    }
    return true;
  }
}
