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

@Controller("mcp")
@UseGuards(AuthGuard("jwt"))
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  @Get("credentials")
  list(
    @Query() query: ListMcpCredentialsQueryDto,
    @Req() req: Request,
  ) {
    return this.mcpService.listCredentials(query.workspaceId, (req.user as any).id);
  }

  @Post("credentials")
  create(
    @Body() dto: CreateMcpCredentialsDto,
    @Req() req: Request,
  ) {
    return this.mcpService.createCredentials(dto.workspaceId, (req.user as any).id);
  }

  @Delete("credentials/:id")
  revoke(
    @Param("id") id: string,
    @Query() query: ListMcpCredentialsQueryDto,
    @Req() req: Request,
  ) {
    return this.mcpService.revokeCredential(id, query.workspaceId, (req.user as any).id);
  }
}
