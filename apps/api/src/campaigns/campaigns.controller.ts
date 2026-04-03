import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
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
import { CampaignsService } from "./campaigns.service";
import { CreateCampaignDto } from "@performa/shared";

@ApiTags("Campaigns")
@Controller("campaigns")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get("workspace/:workspaceId")
  @ApiOperation({ summary: "Get all campaigns for a workspace" })
  @ApiParam({ name: "workspaceId", description: "Workspace UUID" })
  async findAll(
    @Request() req: any,
    @Param("workspaceId") workspaceId: string,
  ) {
    return this.campaignsService.findAllByWorkspace(workspaceId, req.user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get single campaign with ad sets and ads" })
  async findOne(@Request() req: any, @Param("id") id: string) {
    return this.campaignsService.findOne(id, req.user.id);
  }

  @Post("workspace/:workspaceId")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create a new campaign (normally done by AI agent)",
  })
  async create(
    @Request() req: any,
    @Param("workspaceId") workspaceId: string,
    @Body() dto: CreateCampaignDto,
  ) {
    return this.campaignsService.create(workspaceId, req.user.id, dto);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Update campaign status (pause, resume, stop)" })
  async updateStatus(
    @Request() req: any,
    @Param("id") id: string,
    @Body() body: { status: any },
  ) {
    return this.campaignsService.updateStatus(id, req.user.id, body.status);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a campaign" })
  async delete(@Request() req: any, @Param("id") id: string) {
    return this.campaignsService.delete(id, req.user.id);
  }
}
