import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Request,
  UseGuards,
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
import { LandingPagesService } from "./landing-pages.service";
import { GenerateLandingPageDto } from "./dto/generate-landing-page.dto";

@ApiTags("Landing Pages")
@Controller("landing-pages")
export class LandingPagesController {
  constructor(private readonly service: LandingPagesService) {}

  /**
   * Generate (or regenerate) landing page content with AI.
   * Requires auth — calls AI and upserts the page.
   */
  @Post("workspace/:workspaceId/generate")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Generate landing page content with AI" })
  @ApiParam({ name: "workspaceId", description: "Workspace UUID" })
  async generate(
    @Param("workspaceId") workspaceId: string,
    @Request() req: any,
    @Body() dto: GenerateLandingPageDto,
  ) {
    return this.service.generate(workspaceId, req.user.id, dto ?? {});
  }

  /**
   * Get the landing page for a workspace (auth required).
   */
  @Get("workspace/:workspaceId")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get landing page for a workspace" })
  @ApiParam({ name: "workspaceId", description: "Workspace UUID" })
  async findByWorkspace(
    @Param("workspaceId") workspaceId: string,
    @Request() req: any,
  ) {
    return this.service.findByWorkspace(workspaceId, req.user.id);
  }

  /**
   * Public endpoint — get landing page by slug (no auth needed).
   * Returns 404 if not found or not published.
   */
  @Get("public/:slug")
  @ApiOperation({ summary: "Get published landing page by slug (public)" })
  @ApiParam({ name: "slug", description: "Landing page slug" })
  async findBySlug(@Param("slug") slug: string) {
    const page = await this.service.findBySlug(slug);
    return page;
  }

  /**
   * Update landing page content, settings, or pixel IDs.
   */
  @Patch(":id")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update landing page content, settings, or pixel IDs" })
  @ApiParam({ name: "id", description: "Landing page UUID" })
  async update(
    @Param("id") id: string,
    @Request() req: any,
    @Body()
    dto: {
      content?: any;
      settings?: any;
      metaPixelId?: string;
      googleAnalyticsId?: string;
    },
  ) {
    return this.service.update(id, req.user.id, dto);
  }

  /**
   * Publish or unpublish the landing page.
   */
  @Patch(":id/publish")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Toggle publish/unpublish landing page" })
  @ApiParam({ name: "id", description: "Landing page UUID" })
  async togglePublish(
    @Param("id") id: string,
    @Request() req: any,
  ) {
    return this.service.togglePublish(id, req.user.id);
  }
}
