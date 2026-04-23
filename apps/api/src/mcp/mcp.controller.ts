import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import {
  CreateMcpCredentialsDto,
  ListMcpCredentialsQueryDto,
} from "./dto/mcp-credentials.dto";
import { McpService } from "./mcp.service";
import { MCP_TOOLS } from "./mcp-tools.service";

@Controller("mcp")
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  @Get("health")
  health() {
    return {
      status: "ok",
      service: "AdSpectr MCP",
      version: "1.0",
      tools: MCP_TOOLS.length,
      timestamp: new Date().toISOString(),
    };
  }

  @Get("credentials")
  @UseGuards(AuthGuard("jwt"))
  list(
    @Query() query: ListMcpCredentialsQueryDto,
    @Req() req: Request,
  ) {
    return this.mcpService.listCredentials(query.workspaceId, (req.user as any).id);
  }

  @Post("credentials")
  @UseGuards(AuthGuard("jwt"))
  create(
    @Body() dto: CreateMcpCredentialsDto,
    @Req() req: Request,
  ) {
    return this.mcpService.createCredentials(dto.workspaceId, (req.user as any).id);
  }

  @Delete("credentials/:id")
  @UseGuards(AuthGuard("jwt"))
  revoke(
    @Param("id") id: string,
    @Query() query: ListMcpCredentialsQueryDto,
    @Req() req: Request,
  ) {
    return this.mcpService.revokeCredential(id, query.workspaceId, (req.user as any).id);
  }
}
