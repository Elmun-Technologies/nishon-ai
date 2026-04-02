import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { LaunchOrchestratorService } from "./launch-orchestrator.service";
import { CreateLaunchJobDto } from "./dto/launch-orchestrator.dto";

@Controller("launch-orchestrator")
@UseGuards(AuthGuard("jwt"))
export class LaunchOrchestratorController {
  constructor(private readonly service: LaunchOrchestratorService) {}

  @Post("draft")
  createDraft(@Body() dto: CreateLaunchJobDto, @Req() req: Request) {
    return this.service.createDraft(dto, (req.user as any).id);
  }

  @Patch(":jobId/validate")
  validate(@Param("jobId") jobId: string, @Req() req: Request) {
    return this.service.validate(jobId, (req.user as any).id);
  }

  @Patch(":jobId/launch")
  launch(@Param("jobId") jobId: string, @Req() req: Request) {
    return this.service.launch(jobId, (req.user as any).id);
  }

  @Get("workspaces/:workspaceId")
  list(@Param("workspaceId") workspaceId: string, @Req() req: Request) {
    return this.service.list(workspaceId, (req.user as any).id);
  }
}
