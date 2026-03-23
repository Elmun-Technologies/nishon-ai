import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CampaignService } from '../services/campaign.service';
import { 
  CreateCampaignDto, 
  UpdateCampaignDto, 
  CreateAdGroupDto, 
  UpdateAdGroupDto, 
  CampaignQueryDto, 
  PerformanceQueryDto,
  AdCopyRequestDto,
  KeywordRequestDto,
  BudgetOptimizationRequestDto,
  ImagePromptRequestDto
} from '../dto/campaign.dto';
import { Campaign, AdGroup } from '../entities';
import { CampaignObjective, Platform } from '../enums';
import { AiAgentService } from '../services/ai-agent.service';

@ApiTags('Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignController {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly aiAgentService: AiAgentService,
  ) {}

  // Campaign CRUD operations

  @Post()
  @ApiOperation({ summary: 'Create a new campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Campaign name already exists' })
  async createCampaign(
    @Body() createCampaignDto: CreateCampaignDto,
    @Req() req: Request
  ): Promise<Campaign> {
    const workspaceId = req.user.workspaceId;
    return this.campaignService.createCampaign(createCampaignDto, workspaceId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all campaigns with pagination and filtering' })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'active', 'paused', 'completed', 'deleted'] })
  @ApiQuery({ name: 'objective', required: false, enum: CampaignObjective })
  @ApiQuery({ name: 'autopilot_mode', required: false, enum: ['manual', 'ai_optimized'] })
  @ApiQuery({ name: 'start_date', required: false, type: String })
  @ApiQuery({ name: 'end_date', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, defaultValue: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, defaultValue: 20 })
  @ApiQuery({ name: 'sort', required: false, type: String, defaultValue: 'created_at' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'], defaultValue: 'DESC' })
  @ApiResponse({ status: 200, description: 'Campaigns retrieved successfully' })
  async getCampaigns(
    @Query() query: CampaignQueryDto,
    @Req() req: Request
  ): Promise<{ campaigns: Campaign[]; total: number }> {
    const workspaceId = req.user.workspaceId;
    return this.campaignService.getCampaigns(workspaceId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign by ID' })
  @ApiResponse({ status: 200, description: 'Campaign retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getCampaignById(
    @Param('id') id: string,
    @Req() req: Request
  ): Promise<Campaign> {
    const workspaceId = req.user.workspaceId;
    return this.campaignService.getCampaignById(id, workspaceId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update campaign by ID' })
  @ApiResponse({ status: 200, description: 'Campaign updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @ApiResponse({ status: 409, description: 'Campaign name already exists' })
  async updateCampaign(
    @Param('id') id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
    @Req() req: Request
  ): Promise<Campaign> {
    const workspaceId = req.user.workspaceId;
    return this.campaignService.updateCampaign(id, updateCampaignDto, workspaceId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete campaign (soft delete)' })
  @ApiResponse({ status: 204, description: 'Campaign deleted successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async deleteCampaign(
    @Param('id') id: string,
    @Req() req: Request
  ): Promise<void> {
    const workspaceId = req.user.workspaceId;
    return this.campaignService.deleteCampaign(id, workspaceId);
  }

  // Ad Group operations

  @Post(':campaignId/ad-groups')
  @ApiOperation({ summary: 'Create ad group for campaign' })
  @ApiResponse({ status: 201, description: 'Ad group created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async createAdGroup(
    @Param('campaignId') campaignId: string,
    @Body() createAdGroupDto: CreateAdGroupDto,
    @Req() req: Request
  ): Promise<AdGroup> {
    const workspaceId = req.user.workspaceId;
    return this.campaignService.createAdGroup(campaignId, createAdGroupDto, workspaceId);
  }

  @Put('ad-groups/:id')
  @ApiOperation({ summary: 'Update ad group by ID' })
  @ApiResponse({ status: 200, description: 'Ad group updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Ad group not found' })
  async updateAdGroup(
    @Param('id') id: string,
    @Body() updateAdGroupDto: UpdateAdGroupDto,
    @Req() req: Request
  ): Promise<AdGroup> {
    const workspaceId = req.user.workspaceId;
    return this.campaignService.updateAdGroup(id, updateAdGroupDto, workspaceId);
  }

  // Performance metrics

  @Get(':id/performance')
  @ApiOperation({ summary: 'Get campaign performance metrics' })
  @ApiQuery({ name: 'start_date', required: false, type: String })
  @ApiQuery({ name: 'end_date', required: false, type: String })
  @ApiQuery({ name: 'platform', required: false, enum: Platform })
  @ApiQuery({ name: 'group_by', required: false, enum: ['day', 'week', 'month'], defaultValue: 'day' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getPerformanceMetrics(
    @Param('id') id: string,
    @Query() query: PerformanceQueryDto,
    @Req() req: Request
  ): Promise<any[]> {
    const workspaceId = req.user.workspaceId;
    return this.campaignService.getPerformanceMetrics(id, query, workspaceId);
  }

  // Campaign publishing

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish campaign to selected platforms' })
  @ApiResponse({ status: 200, description: 'Campaign published successfully' })
  @ApiResponse({ status: 400, description: 'Campaign is already active' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async publishCampaign(
    @Param('id') id: string,
    @Req() req: Request
  ): Promise<{ success: boolean; platforms: { platform: string; status: string; error?: string }[] }> {
    const workspaceId = req.user.workspaceId;
    return this.campaignService.publishCampaign(id, workspaceId);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause campaign on all platforms' })
  @ApiResponse({ status: 200, description: 'Campaign paused successfully' })
  @ApiResponse({ status: 400, description: 'Campaign is not active' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async pauseCampaign(
    @Param('id') id: string,
    @Req() req: Request
  ): Promise<void> {
    const workspaceId = req.user.workspaceId;
    return this.campaignService.pauseCampaign(id, workspaceId);
  }

  // Analytics and insights

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get campaign analytics and insights' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getCampaignAnalytics(
    @Param('id') id: string,
    @Req() req: Request
  ): Promise<any> {
    const workspaceId = req.user.workspaceId;
    return this.campaignService.getCampaignAnalytics(id, workspaceId);
  }

  // AI Agent endpoints

  @Post('ai/ad-copy')
  @ApiOperation({ summary: 'Generate ad copy using AI' })
  @ApiResponse({ status: 200, description: 'Ad copy generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input parameters' })
  async generateAdCopy(
    @Body() adCopyRequestDto: AdCopyRequestDto
  ): Promise<any> {
    return this.aiAgentService.generateAdCopy(adCopyRequestDto);
  }

  @Post('ai/keywords')
  @ApiOperation({ summary: 'Generate keywords using AI' })
  @ApiResponse({ status: 200, description: 'Keywords generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input parameters' })
  async generateKeywords(
    @Body() keywordRequestDto: KeywordRequestDto
  ): Promise<any> {
    return this.aiAgentService.generateKeywords(keywordRequestDto);
  }

  @Post('ai/budget-optimization')
  @ApiOperation({ summary: 'Get budget optimization recommendations using AI' })
  @ApiResponse({ status: 200, description: 'Budget optimization recommendations generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input parameters' })
  async optimizeBudget(
    @Body() budgetOptimizationRequestDto: BudgetOptimizationRequestDto
  ): Promise<any> {
    return this.aiAgentService.optimizeBudget(budgetOptimizationRequestDto);
  }

  @Post('ai/image-prompt')
  @ApiOperation({ summary: 'Generate image prompt using AI' })
  @ApiResponse({ status: 200, description: 'Image prompt generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input parameters' })
  async generateImagePrompt(
    @Body() imagePromptRequestDto: ImagePromptRequestDto
  ): Promise<any> {
    return this.aiAgentService.generateImagePrompt(imagePromptRequestDto);
  }
}