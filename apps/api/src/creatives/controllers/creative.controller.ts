import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  Logger,
} from '@nestjs/common'
import { CreativeService } from '../services/creative.service'
import {
  CreateImageCreativeDto,
  CreateVideoCreativeDto,
  CreateTextToImageCreativeDto,
  SelectUGCTemplateDto,
  CreativeResponseDto,
  CreativeListResponseDto,
  CreativePerformanceDto,
} from '../dtos/creative.dto'
import { JwtAuthGuard } from '@/auth/guards/jwt.guard'
import { WorkspaceGuard } from '@/common/guards/workspace.guard'

@Controller('creatives')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class CreativeController {
  private readonly logger = new Logger(CreativeController.name)

  constructor(private creativeService: CreativeService) {}

  /**
   * POST /creatives/generate/image
   * Generate image creative using AI
   */
  @Post('generate/image')
  @HttpCode(201)
  async generateImageCreative(
    @Body() dto: CreateImageCreativeDto,
    @Req() req: any,
  ): Promise<CreativeResponseDto> {
    const workspaceId = req.workspace?.id
    const userId = req.user?.id

    const creative = await this.creativeService.generateImageCreative(
      workspaceId,
      userId,
      dto,
    )

    return this.mapToDto(creative)
  }

  /**
   * POST /creatives/generate/video
   * Generate video creative using AI
   */
  @Post('generate/video')
  @HttpCode(201)
  async generateVideoCreative(
    @Body() dto: CreateVideoCreativeDto,
    @Req() req: any,
  ): Promise<CreativeResponseDto> {
    const workspaceId = req.workspace?.id
    const userId = req.user?.id

    const creative = await this.creativeService.generateVideoCreative(
      workspaceId,
      userId,
      dto,
    )

    return this.mapToDto(creative)
  }

  /**
   * POST /creatives/generate/text-to-image
   * Generate image from text using AI
   */
  @Post('generate/text-to-image')
  @HttpCode(201)
  async generateTextToImage(
    @Body() dto: CreateTextToImageCreativeDto,
    @Req() req: any,
  ): Promise<CreativeResponseDto> {
    const workspaceId = req.workspace?.id
    const userId = req.user?.id

    const creative = await this.creativeService.generateTextToImage(
      workspaceId,
      userId,
      dto,
    )

    return this.mapToDto(creative)
  }

  /**
   * POST /creatives/templates/ugc
   * Select and customize UGC template
   */
  @Post('templates/ugc')
  @HttpCode(201)
  async selectUGCTemplate(
    @Body() dto: SelectUGCTemplateDto,
    @Req() req: any,
  ): Promise<CreativeResponseDto> {
    const workspaceId = req.workspace?.id
    const userId = req.user?.id

    const creative = await this.creativeService.selectUGCTemplate(
      workspaceId,
      userId,
      dto,
    )

    return this.mapToDto(creative)
  }

  /**
   * GET /creatives
   * List all creatives for workspace
   */
  @Get()
  @HttpCode(200)
  async listCreatives(
    @Query('type') type?: string,
    @Query('campaignId') campaignId?: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
    @Req() req: any,
  ): Promise<CreativeListResponseDto> {
    const workspaceId = req.workspace?.id

    const { creatives, total } = await this.creativeService.listCreatives(
      workspaceId,
      type,
      campaignId,
      limit,
      offset,
    )

    return {
      creatives: creatives.map((c) => this.mapToDto(c)),
      pagination: { total, limit, offset },
    }
  }

  /**
   * GET /creatives/:id
   * Get creative detail
   */
  @Get(':id')
  @HttpCode(200)
  async getCreative(@Param('id') creativeId: string): Promise<CreativeResponseDto> {
    const creative = await this.creativeService.getCreative(creativeId)
    return this.mapToDto(creative)
  }

  /**
   * PUT /creatives/:id
   * Update creative metadata
   */
  @Put(':id')
  @HttpCode(200)
  async updateCreative(
    @Param('id') creativeId: string,
    @Body() updates: Partial<CreativeResponseDto>,
  ): Promise<CreativeResponseDto> {
    const creative = await this.creativeService.updateCreative(creativeId, updates)
    return this.mapToDto(creative)
  }

  /**
   * DELETE /creatives/:id
   * Delete creative
   */
  @Delete(':id')
  @HttpCode(204)
  async deleteCreative(@Param('id') creativeId: string): Promise<void> {
    await this.creativeService.deleteCreative(creativeId)
  }

  /**
   * POST /creatives/:id/versions
   * Create new version of creative
   */
  @Post(':id/versions')
  @HttpCode(201)
  async createVersion(
    @Param('id') creativeId: string,
    @Req() req: any,
  ): Promise<CreativeResponseDto> {
    const userId = req.user?.id
    const creative = await this.creativeService.createVersion(creativeId, userId)
    return this.mapToDto(creative)
  }

  /**
   * POST /creatives/:id/share
   * Share creative with another user
   */
  @Post(':id/share')
  @HttpCode(200)
  async shareCreative(
    @Param('id') creativeId: string,
    @Body() { userId, permission }: { userId: string; permission: 'view' | 'edit' | 'admin' },
  ): Promise<CreativeResponseDto> {
    const creative = await this.creativeService.shareCreative(
      creativeId,
      userId,
      permission,
    )
    return this.mapToDto(creative)
  }

  /**
   * GET /creatives/:id/collaborators
   * Get list of collaborators
   */
  @Get(':id/collaborators')
  @HttpCode(200)
  async getCollaborators(@Param('id') creativeId: string) {
    return this.creativeService.getCollaborators(creativeId)
  }

  /**
   * GET /creatives/:id/performance
   * Get performance metrics for creative
   */
  @Get(':id/performance')
  @HttpCode(200)
  async getPerformance(
    @Param('id') creativeId: string,
    @Query('days') days: number = 30,
  ): Promise<CreativePerformanceDto[]> {
    return this.creativeService.getPerformance(creativeId, days)
  }

  // Helper method
  private mapToDto(creative: any): CreativeResponseDto {
    return {
      id: creative.id,
      workspaceId: creative.workspaceId,
      campaignId: creative.campaignId,
      type: creative.type,
      generatedUrl: creative.generatedUrl,
      generatedUrls: creative.generatedUrls,
      prompt: creative.prompt,
      metadata: creative.metadata,
      createdAt: creative.createdAt,
      updatedAt: creative.updatedAt,
    }
  }
}
