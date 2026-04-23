import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { McpService } from "./mcp.service";

@Injectable()
export class McpAuthGuard implements CanActivate {
  constructor(private readonly mcpService: McpService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const clientId = req.headers["x-mcp-client-id"] as string | undefined;
    const clientSecret = req.headers["x-mcp-client-secret"] as string | undefined;

    // Also support HTTP Basic auth: Authorization: Basic base64(clientId:clientSecret)
    let resolvedId = clientId;
    let resolvedSecret = clientSecret;
    if (!resolvedId || !resolvedSecret) {
      const auth = req.headers.authorization ?? "";
      if (auth.startsWith("Basic ")) {
        const decoded = Buffer.from(auth.slice(6), "base64").toString("utf8");
        const colon = decoded.indexOf(":");
        if (colon !== -1) {
          resolvedId = decoded.slice(0, colon);
          resolvedSecret = decoded.slice(colon + 1);
        }
      }
    }

    if (!resolvedId || !resolvedSecret) {
      throw new UnauthorizedException(
        "MCP credentials talab qilinadi: X-MCP-Client-Id va X-MCP-Client-Secret headerlarini yuboring",
      );
    }

    const ctx = await this.mcpService.validateCredential(resolvedId, resolvedSecret);
    if (!ctx) {
      throw new UnauthorizedException("Noto'g'ri yoki muddati o'tgan MCP credentials");
    }

    (req as any).mcpContext = ctx;
    return true;
  }
}
