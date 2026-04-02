import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { WorkspaceServiceService } from "./workspace-service.service";
import { CreateWorkspaceSetupDto } from "./dto/workspace-service.dto";

@Controller("workspace-service")
@UseGuards(AuthGuard("jwt"))
export class WorkspaceServiceController {
  constructor(private readonly service: WorkspaceServiceService) {}

  @Post("setup")
  setup(@Body() dto: CreateWorkspaceSetupDto, @Req() req: Request) {
    return this.service.createWorkspaceSetup(dto, (req.user as any).id);
  }

  @Patch(":workspaceId/switch")
  switchWorkspace(
    @Param("workspaceId") workspaceId: string,
    @Req() req: Request,
  ) {
    return this.service.switchWorkspace(workspaceId, (req.user as any).id);
  }
}
