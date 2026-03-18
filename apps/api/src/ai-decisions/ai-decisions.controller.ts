import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AiDecisionsService } from "./ai-decisions.service";

@ApiTags("AI Decisions")
@Controller("ai-decisions")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class AiDecisionsController {
  constructor(private readonly aiDecisionsService: AiDecisionsService) {}

  @Get("workspace/:workspaceId")
  @ApiOperation({ summary: "Get all AI decisions for a workspace" })
  @ApiParam({ name: "workspaceId", description: "Workspace UUID" })
  async findAll(
    @Request() req: any,
    @Param("workspaceId") workspaceId: string,
  ) {
    return this.aiDecisionsService.findAllByWorkspace(workspaceId, req.user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get single AI decision" })
  async findOne(@Request() req: any, @Param("id") id: string) {
    return this.aiDecisionsService.findOne(id, req.user.id);
  }

  @Patch(":id/approve")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Approve an AI decision" })
  async approve(@Request() req: any, @Param("id") id: string) {
    return this.aiDecisionsService.approve(id, req.user.id);
  }

  @Patch(":id/reject")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reject an AI decision" })
  async reject(@Request() req: any, @Param("id") id: string) {
    return this.aiDecisionsService.reject(id, req.user.id);
  }
}
