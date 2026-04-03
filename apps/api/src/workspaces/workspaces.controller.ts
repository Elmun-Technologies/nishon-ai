import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
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
import { WorkspacesService } from "./workspaces.service";
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  UpdateAutopilotDto,
} from "@performa/shared";

@ApiTags("Workspaces")
@Controller("workspaces")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create a new workspace (called at end of onboarding)",
  })
  async create(@Request() req: any, @Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "Get all workspaces for the current user" })
  async findAll(@Request() req: any) {
    return this.workspacesService.findAllByUser(req.user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single workspace by ID" })
  @ApiParam({ name: "id", description: "Workspace UUID" })
  async findOne(@Request() req: any, @Param("id") id: string) {
    return this.workspacesService.findOne(id, req.user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update workspace settings" })
  async update(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(id, req.user.id, dto);
  }

  @Patch(":id/autopilot")
  @ApiOperation({
    summary: "Switch autopilot mode (manual / assisted / full_auto)",
  })
  async updateAutopilot(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateAutopilotDto,
  ) {
    return this.workspacesService.updateAutopilotMode(id, req.user.id, dto);
  }

  @Get(":id/performance")
  @ApiOperation({ summary: "Get aggregated performance summary for dashboard" })
  async performance(@Request() req: any, @Param("id") id: string) {
    return this.workspacesService.getPerformanceSummary(id, req.user.id);
  }

  @Get(":id/policy")
  @ApiOperation({ summary: "Get workspace optimization policy" })
  async getPolicy(@Request() req: any, @Param("id") id: string) {
    return this.workspacesService.getPolicy(id, req.user.id);
  }

  @Patch(":id/policy")
  @ApiOperation({ summary: "Update workspace optimization policy" })
  async updatePolicy(
    @Request() req: any,
    @Param("id") id: string,
    @Body() body: Record<string, any>,
  ) {
    return this.workspacesService.updatePolicy(id, req.user.id, body);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a workspace and all its data" })
  async delete(@Request() req: any, @Param("id") id: string) {
    return this.workspacesService.delete(id, req.user.id);
  }
}
