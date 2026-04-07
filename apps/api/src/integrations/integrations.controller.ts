import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  BadRequestException,
  UseGuards,
  Req,
  HttpCode,
  Logger,
  Query,
} from '@nestjs/common'
import { IntegrationService } from './services/integration.service'
import {
  CreateIntegrationAuthDto,
  SaveConfigurationDto,
  SyncConversionDto,
  BatchSyncConversionsDto,
  IntegrationConnectionResponseDto,
  IntegrationHealthStatusDto,
  SyncLogsResponseDto,
} from './dtos/integration.dto'
import {
  CreateAudienceSegmentDto,
  UpdateAudienceSegmentDto,
  SegmentSyncRequestDto,
  ListAudienceSegmentsResponseDto,
} from './dtos/audience.dto'
import {
  UpdateCommissionStatusDto,
  RecalculateCommissionDto,
  CreateCommissionRateDto,
  UpdateCommissionRateDto,
} from './dtos/commission.dto'
import { JwtAuthGuard } from '@/auth/guards/jwt.guard'
import { WorkspaceGuard } from '@/common/guards/workspace.guard'
import { ConversionEvent } from './types/integration.types'
import {
  AudienceSegmentService,
  ContactSyncService,
  CommissionCalculationService,
  CommissionRateService,
  CommissionReportingService,
} from './services'

@Controller('integrations')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class IntegrationsController {
  private readonly logger = new Logger(IntegrationsController.name)

  constructor(
    private integrationService: IntegrationService,
    private audienceSegmentService: AudienceSegmentService,
    private contactSyncService: ContactSyncService,
    private commissionCalculationService: CommissionCalculationService,
    private commissionRateService: CommissionRateService,
    private commissionReportingService: CommissionReportingService,
  ) {}

  /**
   * GET /integrations/authorize/:key
   * Get authorization URL for OAuth flow
   */
  @Get('authorize/:key')
  @HttpCode(200)
  getAuthorizationUrl(
    @Param('key') key: string,
    @Req() req: any
  ): { authUrl: string; state: string } {
    const state = require('crypto').randomBytes(32).toString('hex')

    // Store state in session/cache (implement as needed)
    // await this.stateCache.set(state, { workspaceId, expiresIn: 5 * 60 * 1000 })

    const authUrl = this.integrationService.getAuthorizationUrl(key, state)
    return { authUrl, state }
  }

  /**
   * POST /integrations/callback/:key
   * Handle OAuth callback
   */
  @Post('callback/:key')
  @HttpCode(201)
  async handleCallback(
    @Param('key') key: string,
    @Body() dto: CreateIntegrationAuthDto,
    @Req() req: any
  ): Promise<IntegrationConnectionResponseDto> {
    const workspaceId = req.workspace?.id
    const userId = req.user?.id

    if (!workspaceId || !userId) {
      throw new BadRequestException('Missing workspace or user context')
    }

    const connection = await this.integrationService.handleOAuthCallback(
      key,
      workspaceId,
      userId,
      dto
    )

    return this.mapConnectionToDto(connection)
  }

  /**
   * GET /integrations
   * List all connections for workspace
   */
  @Get()
  @HttpCode(200)
  async listConnections(@Req() req: any): Promise<IntegrationConnectionResponseDto[]> {
    const workspaceId = req.workspace?.id
    const connections = await this.integrationService.listConnections(workspaceId)
    return connections.map((c) => this.mapConnectionToDto(c))
  }

  /**
   * GET /integrations/:connectionId
   * Get connection details
   */
  @Get(':connectionId')
  @HttpCode(200)
  async getConnection(
    @Param('connectionId') connectionId: string,
    @Req() req: any
  ): Promise<IntegrationConnectionResponseDto> {
    const workspaceId = req.workspace?.id
    const connection = await this.integrationService.getConnectionWithTokens(
      connectionId,
      workspaceId
    )
    return this.mapConnectionToDto(connection)
  }

  /**
   * GET /integrations/:connectionId/health
   * Get integration health status
   */
  @Get(':connectionId/health')
  @HttpCode(200)
  async getHealthStatus(
    @Param('connectionId') connectionId: string,
    @Req() req: any
  ): Promise<IntegrationHealthStatusDto> {
    const workspaceId = req.workspace?.id
    return this.integrationService.getHealthStatus(connectionId, workspaceId)
  }

  /**
   * POST /integrations/:connectionId/test
   * Test integration connection
   */
  @Post(':connectionId/test')
  @HttpCode(200)
  async testConnection(
    @Param('connectionId') connectionId: string,
    @Req() req: any
  ): Promise<{ success: boolean; message: string }> {
    const workspaceId = req.workspace?.id

    try {
      const success = await this.integrationService.testConnection(
        connectionId,
        workspaceId
      )
      return {
        success,
        message: success ? 'Connection successful' : 'Connection failed',
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      }
    }
  }

  /**
   * POST /integrations/:connectionId/config
   * Save integration configuration
   */
  @Post(':connectionId/config')
  @HttpCode(201)
  async saveConfiguration(
    @Param('connectionId') connectionId: string,
    @Body() dto: SaveConfigurationDto,
    @Req() req: any
  ): Promise<{ success: boolean; message: string }> {
    const workspaceId = req.workspace?.id

    try {
      await this.integrationService.saveConfiguration(connectionId, dto)
      return {
        success: true,
        message: 'Configuration saved successfully',
      }
    } catch (error) {
      throw new BadRequestException(error.message)
    }
  }

  /**
   * GET /integrations/:connectionId/config
   * Get integration configuration
   */
  @Get(':connectionId/config')
  @HttpCode(200)
  async getConfiguration(@Param('connectionId') connectionId: string) {
    return this.integrationService.getConfiguration(connectionId)
  }

  /**
   * POST /integrations/:connectionId/sync/conversion
   * Sync single conversion to lead
   */
  @Post(':connectionId/sync/conversion')
  @HttpCode(200)
  async syncConversion(
    @Param('connectionId') connectionId: string,
    @Body() dto: SyncConversionDto,
    @Req() req: any
  ): Promise<{ success: boolean; leadId?: number; error?: string }> {
    const workspaceId = req.workspace?.id

    const conversion = this.dtoToConversionEvent(dto.conversion)
    return this.integrationService.syncConversionToLead(
      connectionId,
      workspaceId,
      conversion
    )
  }

  /**
   * POST /integrations/:connectionId/sync/conversions
   * Batch sync conversions to leads
   */
  @Post(':connectionId/sync/conversions')
  @HttpCode(200)
  async syncConversions(
    @Param('connectionId') connectionId: string,
    @Body() dto: BatchSyncConversionsDto,
    @Req() req: any
  ): Promise<{
    success: number
    failed: number
    skipped: number
    errors: Array<{ conversionId: string; error: string }>
  }> {
    const workspaceId = req.workspace?.id

    const conversions = dto.conversions.map((c) => this.dtoToConversionEvent(c))
    return this.integrationService.syncConversionsToLeads(
      connectionId,
      workspaceId,
      conversions
    )
  }

  /**
   * GET /integrations/:connectionId/logs
   * Get sync logs
   */
  @Get(':connectionId/logs')
  @HttpCode(200)
  async getSyncLogs(
    @Param('connectionId') connectionId: string,
    @Req() req: any
  ): Promise<SyncLogsResponseDto> {
    const workspaceId = req.workspace?.id
    const limit = req.query.limit ? parseInt(req.query.limit) : 50
    const offset = req.query.offset ? parseInt(req.query.offset) : 0

    return this.integrationService.getSyncLogs(
      connectionId,
      workspaceId,
      limit,
      offset
    )
  }

  /**
   * POST /integrations/:connectionId/sync/deals
   * Sync deals from AmoCRM and calculate ROAS
   */
  @Post(':connectionId/sync/deals')
  @HttpCode(200)
  async syncDeals(
    @Param('connectionId') connectionId: string,
    @Req() req: any
  ): Promise<any> {
    const workspaceId = req.workspace?.id
    const lookbackDays = req.query.lookbackDays ? parseInt(req.query.lookbackDays) : 90

    return this.integrationService.syncDealsAndCalculateRoas(
      connectionId,
      workspaceId,
      lookbackDays
    )
  }

  /**
   * GET /integrations/:connectionId/revenue/attribution
   * Get revenue attribution data (ROAS by platform)
   */
  @Get(':connectionId/revenue/attribution')
  @HttpCode(200)
  async getRevenueAttribution(
    @Param('connectionId') connectionId: string,
    @Req() req: any
  ): Promise<any> {
    const workspaceId = req.workspace?.id
    return this.integrationService.getRevenueAttribution(connectionId, workspaceId)
  }

  /**
   * GET /integrations/:connectionId/revenue/trends
   * Get revenue trends over time
   */
  @Get(':connectionId/revenue/trends')
  @HttpCode(200)
  async getRevenueTrends(
    @Param('connectionId') connectionId: string,
    @Req() req: any
  ): Promise<any> {
    const workspaceId = req.workspace?.id
    const days = req.query.days ? parseInt(req.query.days) : 30

    const trends = await this.integrationService.getRevenueTrends(
      connectionId,
      workspaceId,
      days
    )

    return {
      trends,
      period: days,
    }
  }

  /**
   * DELETE /integrations/:connectionId
   * Disconnect integration
   */
  @Delete(':connectionId')
  @HttpCode(204)
  async disconnect(
    @Param('connectionId') connectionId: string,
    @Req() req: any
  ): Promise<void> {
    const workspaceId = req.workspace?.id
    await this.integrationService.disconnect(connectionId, workspaceId)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 4: AUDIENCE SEGMENT MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * POST /integrations/:connectionId/audiences
   * Create new audience segment for retargeting
   */
  @Post(':connectionId/audiences')
  @HttpCode(201)
  async createAudienceSegment(
    @Param('connectionId') connectionId: string,
    @Body() dto: CreateAudienceSegmentDto,
    @Req() req: any,
  ): Promise<any> {
    const workspaceId = req.workspace?.id
    return this.audienceSegmentService.createSegment({
      ...dto,
      connectionId,
      workspaceId,
    })
  }

  /**
   * GET /integrations/:connectionId/audiences
   * List all audience segments
   */
  @Get(':connectionId/audiences')
  @HttpCode(200)
  async listAudienceSegments(
    @Param('connectionId') connectionId: string,
    @Query('platform') platform?: string,
    @Req() req: any,
  ): Promise<ListAudienceSegmentsResponseDto> {
    const segments = await this.audienceSegmentService.listSegments(
      connectionId,
      platform as any,
    )
    return { segments, total: segments.length }
  }

  /**
   * GET /integrations/:connectionId/audiences/:segmentId
   * Get segment details with statistics
   */
  @Get(':connectionId/audiences/:segmentId')
  @HttpCode(200)
  async getAudienceSegment(
    @Param('connectionId') connectionId: string,
    @Param('segmentId') segmentId: string,
  ): Promise<any> {
    const stats = await this.audienceSegmentService.getSegmentStats(segmentId)
    return { segmentId, ...stats }
  }

  /**
   * PUT /integrations/:connectionId/audiences/:segmentId
   * Update audience segment configuration
   */
  @Put(':connectionId/audiences/:segmentId')
  @HttpCode(200)
  async updateAudienceSegment(
    @Param('connectionId') connectionId: string,
    @Param('segmentId') segmentId: string,
    @Body() dto: UpdateAudienceSegmentDto,
  ): Promise<any> {
    return this.audienceSegmentService.updateSegment(segmentId, dto)
  }

  /**
   * DELETE /integrations/:connectionId/audiences/:segmentId
   * Delete audience segment
   */
  @Delete(':connectionId/audiences/:segmentId')
  @HttpCode(204)
  async deleteAudienceSegment(
    @Param('connectionId') connectionId: string,
    @Param('segmentId') segmentId: string,
  ): Promise<void> {
    await this.audienceSegmentService.deleteSegment(segmentId)
  }

  /**
   * POST /integrations/:connectionId/audiences/:segmentId/sync
   * Manually trigger audience segment sync
   */
  @Post(':connectionId/audiences/:segmentId/sync')
  @HttpCode(200)
  async syncAudienceSegment(
    @Param('connectionId') connectionId: string,
    @Param('segmentId') segmentId: string,
    @Body() dto: SegmentSyncRequestDto,
  ): Promise<any> {
    return this.audienceSegmentService.triggerSegmentSync(
      segmentId,
      dto.incremental ?? true,
    )
  }

  /**
   * GET /integrations/:connectionId/audiences/:segmentId/syncs
   * Get sync history for segment
   */
  @Get(':connectionId/audiences/:segmentId/syncs')
  @HttpCode(200)
  async getAudienceSyncHistory(
    @Param('connectionId') connectionId: string,
    @Param('segmentId') segmentId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ): Promise<any> {
    const { logs, total } = await this.audienceSegmentService.getSyncHistory(
      segmentId,
      limit,
      offset,
    )
    return { logs, pagination: { total, limit, offset } }
  }

  /**
   * GET /integrations/:connectionId/audiences/syncs
   * Get sync history for all segments in connection
   */
  @Get(':connectionId/audiences/syncs')
  @HttpCode(200)
  async getConnectionAudienceSyncs(
    @Param('connectionId') connectionId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ): Promise<any> {
    const { logs, total } = await this.audienceSegmentService.getConnectionSyncHistory(
      connectionId,
      limit,
      offset,
    )
    return { logs, pagination: { total, limit, offset } }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 5: COMMISSION MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * POST /integrations/:connectionId/commissions/recalculate
   * Force recalculation of all commissions
   */
  @Post(':connectionId/commissions/recalculate')
  @HttpCode(200)
  async recalculateCommissions(
    @Param('connectionId') connectionId: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
    @Req() req: any,
  ): Promise<any> {
    const workspaceId = req.workspace?.id
    const now = new Date()
    const m = month || now.getMonth() + 1
    const y = year || now.getFullYear()

    const commissions = await this.commissionCalculationService.calculateMonthlyCommissions(
      workspaceId,
      y,
      m,
    )

    return {
      recalculated: commissions.length,
      month: `${y}-${String(m).padStart(2, '0')}`,
    }
  }

  /**
   * GET /integrations/:connectionId/commissions
   * List commissions with filters
   */
  @Get(':connectionId/commissions')
  @HttpCode(200)
  async listCommissions(
    @Param('connectionId') connectionId: string,
    @Query('status') status?: string,
    @Query('specialistId') specialistId?: number,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
    @Req() req: any,
  ): Promise<any> {
    const workspaceId = req.workspace?.id
    const summary = await this.commissionReportingService.getCommissionsSummary(
      workspaceId,
      { status, specialistId },
    )
    return {
      commissions: summary.bySpecialist,
      pagination: { total: summary.totalCommissions, limit, offset },
    }
  }

  /**
   * GET /integrations/:connectionId/commissions/:commissionId
   * Get commission details with audit log
   */
  @Get(':connectionId/commissions/:commissionId')
  @HttpCode(200)
  async getCommissionDetail(
    @Param('connectionId') connectionId: string,
    @Param('commissionId') commissionId: string,
  ): Promise<any> {
    // In a real implementation, would fetch from DB
    return { commissionId, message: 'Commission detail endpoint' }
  }

  /**
   * PUT /integrations/:connectionId/commissions/:commissionId
   * Update commission status (approve, reject, adjust)
   */
  @Put(':connectionId/commissions/:commissionId')
  @HttpCode(200)
  async updateCommissionStatus(
    @Param('connectionId') connectionId: string,
    @Param('commissionId') commissionId: string,
    @Body() dto: UpdateCommissionStatusDto,
    @Req() req: any,
  ): Promise<any> {
    const userId = req.user?.id

    if (dto.status === 'approved') {
      return this.commissionCalculationService.approveCommission(
        commissionId,
        userId,
        dto.approvalNotes,
      )
    } else if (dto.status === 'rejected') {
      return this.commissionCalculationService.rejectCommission(
        commissionId,
        userId,
        dto.approvalNotes || 'Rejected',
      )
    }

    return { message: 'Commission updated' }
  }

  /**
   * POST /integrations/:connectionId/commissions/:commissionId/recalc
   * Recalculate specific commission
   */
  @Post(':connectionId/commissions/:commissionId/recalc')
  @HttpCode(200)
  async recalculateCommission(
    @Param('connectionId') connectionId: string,
    @Param('commissionId') commissionId: string,
    @Body() dto: RecalculateCommissionDto,
  ): Promise<any> {
    return this.commissionCalculationService.recalculateCommission(
      commissionId,
      dto.rateOverride,
    )
  }

  /**
   * GET /integrations/:connectionId/commissions/summary
   * Get commissions summary dashboard
   */
  @Get(':connectionId/commissions/summary')
  @HttpCode(200)
  async getCommissionsSummary(
    @Param('connectionId') connectionId: string,
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string,
    @Req() req: any,
  ): Promise<any> {
    const workspaceId = req.workspace?.id
    return this.commissionReportingService.getCommissionsSummary(workspaceId, {
      periodStart: periodStart ? new Date(periodStart) : undefined,
      periodEnd: periodEnd ? new Date(periodEnd) : undefined,
    })
  }

  /**
   * GET /integrations/:connectionId/commissions/specialist/:specialistId
   * Get commission stats for specialist
   */
  @Get(':connectionId/commissions/specialist/:specialistId')
  @HttpCode(200)
  async getSpecialistStats(
    @Param('connectionId') connectionId: string,
    @Param('specialistId') specialistId: string,
    @Req() req: any,
  ): Promise<any> {
    const workspaceId = req.workspace?.id
    return this.commissionReportingService.getSpecialistStats(
      workspaceId,
      parseInt(specialistId),
    )
  }

  /**
   * GET /integrations/:connectionId/commissions/payroll/:period
   * Get payroll data for period (YYYY-MM)
   */
  @Get(':connectionId/commissions/payroll/:period')
  @HttpCode(200)
  async getPayroll(
    @Param('connectionId') connectionId: string,
    @Param('period') period: string,
    @Req() req: any,
  ): Promise<any> {
    const workspaceId = req.workspace?.id
    return this.commissionReportingService.generatePayroll(workspaceId, period)
  }

  /**
   * GET /integrations/:connectionId/rates
   * List commission rates
   */
  @Get(':connectionId/rates')
  @HttpCode(200)
  async listCommissionRates(
    @Param('connectionId') connectionId: string,
    @Query('activeOnly') activeOnly: boolean = false,
    @Req() req: any,
  ): Promise<any> {
    const workspaceId = req.workspace?.id
    const rates = await this.commissionRateService.listRates(workspaceId, activeOnly)
    return { rates, total: rates.length }
  }

  /**
   * POST /integrations/:connectionId/rates
   * Create new commission rate
   */
  @Post(':connectionId/rates')
  @HttpCode(201)
  async createCommissionRate(
    @Param('connectionId') connectionId: string,
    @Body() dto: CreateCommissionRateDto,
    @Req() req: any,
  ): Promise<any> {
    const workspaceId = req.workspace?.id
    return this.commissionRateService.createRate({
      ...dto,
      workspaceId,
    })
  }

  /**
   * PUT /integrations/:connectionId/rates/:rateId
   * Update commission rate
   */
  @Put(':connectionId/rates/:rateId')
  @HttpCode(200)
  async updateCommissionRate(
    @Param('connectionId') connectionId: string,
    @Param('rateId') rateId: string,
    @Body() dto: UpdateCommissionRateDto,
  ): Promise<any> {
    return this.commissionRateService.updateRate(rateId, dto)
  }

  // ─────────────────────────────────────────────────────────────────────────

  // Helper methods

  private mapConnectionToDto(connection: any): IntegrationConnectionResponseDto {
    return {
      id: connection.id,
      integrationKey: connection.integrationKey,
      externalAccountId: connection.externalAccountId,
      status: connection.status,
      isActive: connection.isActive,
      lastSyncedAt: connection.lastSyncedAt,
      connectedAt: connection.connectedAt,
      updatedAt: connection.updatedAt,
    }
  }

  private dtoToConversionEvent(dto: any): ConversionEvent {
    return {
      id: dto.id,
      email: dto.email,
      phone: dto.phone,
      name: dto.name,
      campaignId: dto.campaignId,
      campaignName: dto.campaignName,
      platform: dto.platform,
      adSetId: dto.adSetId,
      conversionType: dto.conversionType,
      conversionValue: dto.conversionValue,
      conversionCurrency: dto.conversionCurrency,
      conversionTimestamp: new Date(dto.conversionTimestamp),
      sourceUrl: dto.sourceUrl,
      metadata: dto.metadata,
    }
  }
}
