import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AgentsService } from "./agents.service";

@ApiTags("Agents Marketplace")
@Controller("agents")
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  // ── PUBLIC MARKETPLACE ──────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: "Public marketplace listing (agents + targetologists)" })
  @ApiQuery({ name: "type", enum: ["all", "human", "ai"], required: false })
  @ApiQuery({ name: "platform", required: false })
  @ApiQuery({ name: "niche", required: false })
  @ApiQuery({ name: "verified", required: false })
  @ApiQuery({ name: "sortBy", enum: ["roas", "spend", "campaigns", "rating", "price"], required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "offset", required: false })
  listPublic(@Query() query: any) {
    return this.agentsService.listPublic({
      type: query.type,
      platform: query.platform,
      niche: query.niche,
      verified: query.verified === "true",
      featured: query.featured === "true",
      priceMin: query.priceMin ? Number(query.priceMin) : undefined,
      priceMax: query.priceMax ? Number(query.priceMax) : undefined,
      sortBy: query.sortBy,
      limit: query.limit ? Number(query.limit) : 20,
      offset: query.offset ? Number(query.offset) : 0,
    });
  }

  @Get("slug/:slug")
  @ApiOperation({ summary: "Get public agent profile by slug" })
  findBySlug(@Param("slug") slug: string) {
    return this.agentsService.findBySlug(slug);
  }

  @Get(":id/reviews")
  @ApiOperation({ summary: "Get reviews for an agent" })
  getReviews(@Param("id") id: string, @Query("limit") limit?: string) {
    return this.agentsService.getReviews(id, limit ? Number(limit) : 10);
  }

  // ── TARGETOLOGIST PROFILE MANAGEMENT (auth) ─────────────────────────────

  @Get("mine")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get my agent profiles (targetologist)" })
  findMine(@Request() req: any) {
    return this.agentsService.findMine(req.user.id);
  }

  @Post()
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create agent profile (targetologist or AI agent builder)" })
  create(@Request() req: any, @Body() dto: any) {
    return this.agentsService.create(req.user.id, dto);
  }

  @Patch(":id")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update agent profile" })
  update(@Param("id") id: string, @Request() req: any, @Body() dto: any) {
    return this.agentsService.update(id, req.user.id, dto);
  }

  @Patch(":id/publish")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Toggle publish/unpublish agent profile" })
  togglePublish(@Param("id") id: string, @Request() req: any) {
    return this.agentsService.togglePublish(id, req.user.id);
  }

  // ── SERVICE ENGAGEMENTS (auth) ─────────────────────────────────────────

  @Post(":agentId/hire/workspace/:workspaceId")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Hire an agent for a workspace" })
  hireAgent(
    @Param("agentId") agentId: string,
    @Param("workspaceId") workspaceId: string,
    @Request() req: any,
    @Body() body: { notes?: string },
  ) {
    return this.agentsService.hireAgent(workspaceId, agentId, req.user.id, body?.notes);
  }

  @Get("engagement/workspace/:workspaceId")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current active engagement for workspace" })
  getCurrentEngagement(@Param("workspaceId") workspaceId: string, @Request() req: any) {
    return this.agentsService.getCurrentEngagement(workspaceId, req.user.id);
  }

  @Patch("engagement/:id/cancel")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cancel an engagement (switch back to self-service)" })
  cancelEngagement(@Param("id") id: string, @Request() req: any) {
    return this.agentsService.cancelEngagement(id, req.user.id);
  }

  @Post("engagement/:id/review")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Leave a review for a completed/active engagement" })
  addReview(
    @Param("id") id: string,
    @Request() req: any,
    @Body() dto: { rating: number; text: string; authorName: string; authorCompany?: string },
  ) {
    return this.agentsService.addReview(id, req.user.id, dto);
  }
}
