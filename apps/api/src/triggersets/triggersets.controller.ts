import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, Request, HttpCode, HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { TriggersetService, CreateTriggersetDto } from "./triggersets.service";

@ApiTags("Triggersets")
@Controller("triggersets")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class TriggersetController {
  constructor(private readonly service: TriggersetService) {}

  @Get()
  @ApiOperation({ summary: "List all triggersets for a workspace" })
  findAll(@Request() req: any, @Query("workspaceId") workspaceId: string) {
    return this.service.findAll(workspaceId, req.user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a triggerset by ID" })
  @ApiParam({ name: "id", description: "Triggerset UUID" })
  findOne(@Request() req: any, @Param("id") id: string) {
    return this.service.findOne(id, req.user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new triggerset" })
  create(
    @Request() req: any,
    @Query("workspaceId") workspaceId: string,
    @Body() dto: CreateTriggersetDto,
  ) {
    return this.service.create(workspaceId, req.user.id, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update triggerset (including toggle enabled)" })
  update(@Request() req: any, @Param("id") id: string, @Body() body: any) {
    return this.service.update(id, req.user.id, body);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a triggerset" })
  remove(@Request() req: any, @Param("id") id: string) {
    return this.service.remove(id, req.user.id);
  }

  @Get(":id/logs")
  @ApiOperation({ summary: "Get run history for a triggerset" })
  getLogs(@Request() req: any, @Param("id") id: string, @Query("limit") limit?: string) {
    return this.service.getLogs(id, req.user.id, limit ? parseInt(limit) : 20);
  }

  @Post(":id/run")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Manually trigger a run for a triggerset" })
  async runNow(@Request() req: any, @Param("id") id: string) {
    const ts = await this.service.findOne(id, req.user.id);
    return this.service.runOne(ts);
  }
}
