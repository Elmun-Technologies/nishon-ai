import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  BadRequestException,
  UseGuards,
  Req,
  HttpCode,
  Logger,
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
import { JwtAuthGuard } from '@/auth/guards/jwt.guard'
import { WorkspaceGuard } from '@/common/guards/workspace.guard'
import { ConversionEvent } from './types/integration.types'

@Controller('integrations')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class IntegrationsController {
  private readonly logger = new Logger(IntegrationsController.name)

  constructor(private integrationService: IntegrationService) {}

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
