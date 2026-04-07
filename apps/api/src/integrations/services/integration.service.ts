import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { AxiosInstance } from 'axios'
import {
  IntegrationConnection as IIntegrationConnection,
  IntegrationConfigEntity,
  SyncLog,
} from '../entities'
import {
  IntegrationStatus,
  IntegrationHealthStatus,
  IntegrationPermission,
  OAuthCallbackData,
  IntegrationConfig as IIntegrationConfig,
  ConversionEvent,
} from '../types/integration.types'
import { EncryptionService } from './encryption.service'
import { AmoCRMConnectorService } from './amocrm-connector.service'
import { ConversionToLeadSyncService } from './conversion-to-lead-sync.service'

@Injectable()
export class IntegrationService {
  constructor(
    @InjectRepository(IIntegrationConnection)
    private connectionRepository: Repository<IIntegrationConnection>,
    @InjectRepository(IntegrationConfigEntity)
    private configRepository: Repository<IntegrationConfigEntity>,
    @InjectRepository(SyncLog)
    private syncLogRepository: Repository<SyncLog>,
    private encryptionService: EncryptionService,
    private amoCrmConnector: AmoCRMConnectorService,
    private conversionToLeadSync: ConversionToLeadSyncService
  ) {}

  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl(integrationKey: string, state: string): string {
    switch (integrationKey) {
      case 'amocrm':
        return this.amoCrmConnector.getAuthorizationUrl(state)
      default:
        throw new BadRequestException(`Unsupported integration: ${integrationKey}`)
    }
  }

  /**
   * Handle OAuth callback and create integration connection
   */
  async handleOAuthCallback(
    integrationKey: string,
    workspaceId: string,
    userId: string,
    callbackData: OAuthCallbackData
  ): Promise<IIntegrationConnection> {
    // Validate integration type
    if (integrationKey !== 'amocrm') {
      throw new BadRequestException(`Unsupported integration: ${integrationKey}`)
    }

    // Extract subdomain from callback data
    const subdomain = callbackData.redirectUri.split('://')[1]?.split('.')[0]
    if (!subdomain) {
      throw new BadRequestException('Invalid subdomain in callback')
    }

    // Exchange code for tokens
    const tokens = await this.amoCrmConnector.exchangeCodeForTokens(
      callbackData.code,
      subdomain
    )

    // Encrypt sensitive tokens
    const encryptedAccessToken = this.encryptionService.encrypt(tokens.accessToken)
    const encryptedRefreshToken = tokens.refreshToken
      ? this.encryptionService.encrypt(tokens.refreshToken)
      : null

    // Check if connection already exists
    let connection = await this.connectionRepository.findOne({
      where: {
        workspaceId,
        integrationKey,
        externalAccountId: tokens.subdomain,
      },
    })

    if (connection) {
      // Update existing connection
      connection.encryptedAccessToken = encryptedAccessToken
      connection.encryptedRefreshToken = encryptedRefreshToken
      connection.tokenExpiresAt = tokens.expiresAt
      connection.status = IntegrationStatus.ACTIVE
      connection.connectedByUserId = userId
      connection.updatedAt = new Date()
    } else {
      // Create new connection
      connection = this.connectionRepository.create({
        workspaceId,
        integrationKey,
        externalAccountId: tokens.subdomain,
        encryptedAccessToken,
        encryptedRefreshToken,
        tokenExpiresAt: tokens.expiresAt,
        status: IntegrationStatus.ACTIVE,
        connectedByUserId: userId,
        isActive: true,
      })
    }

    return this.connectionRepository.save(connection)
  }

  /**
   * Get connection with decrypted tokens
   */
  async getConnectionWithTokens(
    connectionId: string,
    workspaceId: string
  ): Promise<IIntegrationConnection> {
    const connection = await this.connectionRepository.findOne({
      where: { id: connectionId, workspaceId },
      select: [
        'id',
        'integrationKey',
        'externalAccountId',
        'encryptedAccessToken',
        'encryptedRefreshToken',
        'tokenExpiresAt',
        'status',
        'isActive',
        'workspaceId',
      ],
    })

    if (!connection) {
      throw new NotFoundException('Integration connection not found')
    }

    return connection
  }

  /**
   * Decrypt and refresh token if needed
   */
  async getValidAccessToken(
    connection: IIntegrationConnection
  ): Promise<string> {
    try {
      // Check if token is expired
      if (connection.tokenExpiresAt && new Date() > connection.tokenExpiresAt) {
        // Refresh token
        if (connection.encryptedRefreshToken && connection.integrationKey === 'amocrm') {
          const refreshToken = this.encryptionService.decrypt(
            connection.encryptedRefreshToken
          )
          const tokens = await this.amoCrmConnector.refreshToken(
            refreshToken,
            connection.externalAccountId
          )

          // Update connection with new tokens
          connection.encryptedAccessToken = this.encryptionService.encrypt(
            tokens.accessToken
          )
          if (tokens.refreshToken) {
            connection.encryptedRefreshToken = this.encryptionService.encrypt(
              tokens.refreshToken
            )
          }
          connection.tokenExpiresAt = tokens.expiresAt
          connection.status = IntegrationStatus.ACTIVE
          await this.connectionRepository.save(connection)
        }
      }

      // Decrypt and return access token
      return this.encryptionService.decrypt(connection.encryptedAccessToken)
    } catch (error) {
      throw new BadRequestException(`Failed to get valid token: ${error.message}`)
    }
  }

  /**
   * Save integration configuration
   */
  async saveConfiguration(
    connectionId: string,
    config: Partial<IIntegrationConfig>
  ): Promise<IntegrationConfigEntity> {
    let integrationConfig = await this.configRepository.findOne({
      where: { connectionId },
    })

    if (!integrationConfig) {
      integrationConfig = this.configRepository.create({
        connectionId,
        fieldMappings: config.fieldMappings || [],
        syncSettings: config.syncSettings || {
          enabled: true,
          frequency: '30min',
          batchSize: 100,
        },
        webhookEnabled: config.webhookEnabled ?? true,
      })
    } else {
      if (config.fieldMappings) {
        integrationConfig.fieldMappings = config.fieldMappings
      }
      if (config.syncSettings) {
        integrationConfig.syncSettings = {
          ...integrationConfig.syncSettings,
          ...config.syncSettings,
        }
      }
      if (config.webhookEnabled !== undefined) {
        integrationConfig.webhookEnabled = config.webhookEnabled
      }
    }

    return this.configRepository.save(integrationConfig)
  }

  /**
   * Get integration configuration
   */
  async getConfiguration(connectionId: string): Promise<IntegrationConfigEntity> {
    const config = await this.configRepository.findOne({
      where: { connectionId },
    })

    if (!config) {
      throw new NotFoundException('Integration configuration not found')
    }

    return config
  }

  /**
   * Test integration connection
   */
  async testConnection(
    connectionId: string,
    workspaceId: string
  ): Promise<boolean> {
    const connection = await this.getConnectionWithTokens(connectionId, workspaceId)

    if (connection.integrationKey === 'amocrm') {
      const accessToken = await this.getValidAccessToken(connection)
      const client = this.amoCrmConnector.createClient(
        accessToken,
        connection.externalAccountId
      )
      return this.amoCrmConnector.verifyConnection(client)
    }

    throw new BadRequestException(`Unsupported integration: ${connection.integrationKey}`)
  }

  /**
   * List connections for workspace
   */
  async listConnections(workspaceId: string): Promise<IIntegrationConnection[]> {
    return this.connectionRepository.find({
      where: { workspaceId },
      select: [
        'id',
        'integrationKey',
        'externalAccountId',
        'status',
        'isActive',
        'lastSyncedAt',
        'connectedAt',
        'updatedAt',
      ],
    })
  }

  /**
   * Get integration health status
   */
  async getHealthStatus(
    connectionId: string,
    workspaceId: string
  ): Promise<IntegrationHealthStatus> {
    const connection = await this.getConnectionWithTokens(connectionId, workspaceId)

    // Get recent sync logs
    const recentLogs = await this.syncLogRepository.find({
      where: { connectionId },
      order: { createdAt: 'DESC' },
      take: 100,
    })

    // Calculate success rate
    const successCount = recentLogs.filter((l) => l.status === 'success').length
    const successRate = recentLogs.length > 0 ? (successCount / recentLogs.length) * 100 : 100

    // Get next scheduled sync
    const config = await this.configRepository.findOne({
      where: { connectionId },
    })

    let nextScheduledSync: Date | undefined
    if (config?.syncSettings.enabled && connection.lastSyncedAt) {
      const frequency = config.syncSettings.frequency
      const nextSync = new Date(connection.lastSyncedAt)

      switch (frequency) {
        case 'real-time':
          nextSync.setMinutes(nextSync.getMinutes() + 1)
          break
        case '15min':
          nextSync.setMinutes(nextSync.getMinutes() + 15)
          break
        case '30min':
          nextSync.setMinutes(nextSync.getMinutes() + 30)
          break
        case 'hourly':
          nextSync.setHours(nextSync.getHours() + 1)
          break
        case 'daily':
          nextSync.setDate(nextSync.getDate() + 1)
          break
      }

      nextScheduledSync = nextSync
    }

    return {
      connectionId,
      integrationKey: connection.integrationKey,
      status: connection.status,
      lastSyncedAt: connection.lastSyncedAt,
      lastError: connection.syncErrorMessage,
      errorCount: connection.syncErrorCount,
      syncSuccessRate: Math.round(successRate),
      nextScheduledSync,
      webhookLastReceived: undefined, // TODO: Track from webhook events
      metadata: {
        externalAccountId: connection.externalAccountId,
        isActive: connection.isActive,
        connectedAt: connection.connectedAt,
      },
    }
  }

  /**
   * Sync conversion to lead (single)
   */
  async syncConversionToLead(
    connectionId: string,
    workspaceId: string,
    conversion: ConversionEvent
  ): Promise<{ success: boolean; leadId?: number; error?: string }> {
    const connection = await this.getConnectionWithTokens(connectionId, workspaceId)
    const config = await this.getConfiguration(connectionId)

    if (connection.integrationKey !== 'amocrm') {
      throw new BadRequestException('This integration does not support conversion syncing')
    }

    const accessToken = await this.getValidAccessToken(connection)
    const client = this.amoCrmConnector.createClient(
      accessToken,
      connection.externalAccountId
    )

    return this.conversionToLeadSync.syncConversionToLead(
      connectionId,
      client,
      conversion,
      config.fieldMappings
    )
  }

  /**
   * Sync batch conversions to leads
   */
  async syncConversionsToLeads(
    connectionId: string,
    workspaceId: string,
    conversions: ConversionEvent[]
  ): Promise<{
    success: number
    failed: number
    skipped: number
    errors: Array<{ conversionId: string; error: string }>
  }> {
    const connection = await this.getConnectionWithTokens(connectionId, workspaceId)
    const config = await this.getConfiguration(connectionId)

    if (connection.integrationKey !== 'amocrm') {
      throw new BadRequestException('This integration does not support conversion syncing')
    }

    const accessToken = await this.getValidAccessToken(connection)
    const client = this.amoCrmConnector.createClient(
      accessToken,
      connection.externalAccountId
    )

    return this.conversionToLeadSync.syncConversionsToLeads(
      connectionId,
      client,
      conversions,
      config.fieldMappings,
      config.syncSettings.batchSize || 100
    )
  }

  /**
   * Disconnect integration
   */
  async disconnect(connectionId: string, workspaceId: string): Promise<void> {
    const connection = await this.getConnectionWithTokens(connectionId, workspaceId)

    // Delete connection and related configs/logs
    await this.connectionRepository.delete(connectionId)
    await this.configRepository.delete({ connectionId })
    await this.syncLogRepository.delete({ connectionId })
  }

  /**
   * Get sync logs
   */
  async getSyncLogs(
    connectionId: string,
    workspaceId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ logs: SyncLog[]; total: number }> {
    // Verify connection exists in workspace
    const connection = await this.getConnectionWithTokens(connectionId, workspaceId)

    const [logs, total] = await this.syncLogRepository.findAndCount({
      where: { connectionId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    })

    return { logs, total }
  }
}
