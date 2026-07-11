import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { Capability, PlatformStatusService } from "./platform-status.service";

/**
 * Activation Center backend — a single read endpoint that reports which
 * capabilities are live. Auth-guarded; returns booleans only, never key values.
 */
@ApiTags("Platform status")
@Controller("platform")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class PlatformStatusController {
  constructor(private readonly status: PlatformStatusService) {}

  @Get("capabilities")
  @ApiOperation({
    summary:
      "Consolidated capability status (Live / needs key) for the Activation Center",
  })
  @ApiQuery({
    name: "workspaceId",
    required: false,
    description: "Scopes the workspace-level Meta capability to this workspace",
  })
  async capabilities(
    @Req() req: Request,
    @Query("workspaceId") workspaceId?: string,
  ): Promise<{ capabilities: Capability[] }> {
    const userId = (req.user as { id: string } | undefined)?.id;
    const capabilities = await this.status.getCapabilities(workspaceId, userId);
    return { capabilities };
  }
}
