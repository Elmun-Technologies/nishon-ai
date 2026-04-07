import { Injectable, Logger } from '@nestjs/common'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { AxiosInstance } from 'axios'
import {
  ConversionEvent,
  FieldMapping,
  AmoCRMLeadPayload,
  SyncLog as ISyncLog,
} from '../types/integration.types'
import { SyncLog } from '../entities/sync-log.entity'
import { SyncEventType, SyncStatus } from '../types/integration.types'
import { AmoCRMConnectorService } from './amocrm-connector.service'

@Injectable()
export class ConversionToLeadSyncService {
  private readonly logger = new Logger(ConversionToLeadSyncService.name)

  constructor(
    @InjectRepository(SyncLog)
    private syncLogRepository: Repository<SyncLog>,
    private amoCrmConnector: AmoCRMConnectorService
  ) {}

  /**
   * Sync a single conversion event to AmoCRM as a lead
   */
  async syncConversionToLead(
    connectionId: string,
    client: AxiosInstance,
    conversion: ConversionEvent,
    fieldMappings: FieldMapping[]
  ): Promise<{ success: boolean; leadId?: number; error?: string }> {
    try {
      // Transform conversion event to AmoCRM lead payload
      const leadPayload = this.transformConversionToLead(conversion, fieldMappings)

      // Create lead in AmoCRM
      const result = await this.amoCrmConnector.createLead(client, leadPayload)

      // Log successful sync
      await this.logSync(connectionId, SyncEventType.CONVERSION_TO_LEAD, {
        recordsProcessed: 1,
        recordsSkipped: 0,
        status: SyncStatus.SUCCESS,
        metadata: {
          conversion_id: conversion.id,
          lead_id: result.id,
          duration_ms: 0,
        },
        triggeredBy: 'webhook',
      })

      return { success: true, leadId: result.id }
    } catch (error) {
      this.logger.error(
        `Failed to sync conversion ${conversion.id}: ${error.message}`
      )

      await this.logSync(connectionId, SyncEventType.CONVERSION_TO_LEAD, {
        recordsProcessed: 0,
        recordsSkipped: 1,
        status: SyncStatus.FAILED,
        errorMessage: error.message,
        metadata: {
          conversion_id: conversion.id,
        },
        triggeredBy: 'webhook',
      })

      return { success: false, error: error.message }
    }
  }

  /**
   * Batch sync multiple conversions
   */
  async syncConversionsToLeads(
    connectionId: string,
    client: AxiosInstance,
    conversions: ConversionEvent[],
    fieldMappings: FieldMapping[],
    batchSize: number = 100
  ): Promise<{
    success: number
    failed: number
    skipped: number
    errors: Array<{ conversionId: string; error: string }>
  }> {
    const startTime = Date.now()
    let successCount = 0
    let failedCount = 0
    let skippedCount = 0
    const errors: Array<{ conversionId: string; error: string }> = []

    try {
      // Transform all conversions to leads
      const leads: AmoCRMLeadPayload[] = []
      const conversionMap = new Map<number, ConversionEvent>()

      for (const conversion of conversions) {
        try {
          const lead = this.transformConversionToLead(conversion, fieldMappings)
          leads.push(lead)
          conversionMap.set(leads.length - 1, conversion)
        } catch (error) {
          skippedCount++
          errors.push({
            conversionId: conversion.id,
            error: `Transform error: ${error.message}`,
          })
        }
      }

      // Batch create leads in AmoCRM
      const results = await this.amoCrmConnector.batchCreateLeads(
        client,
        leads,
        batchSize
      )

      // Process results
      results.forEach((result, index) => {
        if (result.error) {
          failedCount++
          const conversion = conversionMap.get(index)
          if (conversion) {
            errors.push({
              conversionId: conversion.id,
              error: result.error,
            })
          }
        } else {
          successCount++
        }
      })

      // Log batch sync
      const duration = Date.now() - startTime
      await this.logSync(connectionId, SyncEventType.CONVERSION_TO_LEAD, {
        recordsProcessed: successCount,
        recordsSkipped: skippedCount + failedCount,
        status: failedCount === 0 ? SyncStatus.SUCCESS : SyncStatus.PARTIAL,
        errorMessage:
          failedCount > 0
            ? `${failedCount} conversions failed to sync`
            : undefined,
        metadata: {
          batch_size: conversions.length,
          duration_ms: duration,
          success_count: successCount,
          failed_count: failedCount,
        },
        triggeredBy: 'scheduled',
      })

      return {
        success: successCount,
        failed: failedCount,
        skipped: skippedCount,
        errors,
      }
    } catch (error) {
      this.logger.error(`Batch conversion sync failed: ${error.message}`)

      await this.logSync(connectionId, SyncEventType.CONVERSION_TO_LEAD, {
        recordsProcessed: 0,
        recordsSkipped: conversions.length,
        status: SyncStatus.FAILED,
        errorMessage: error.message,
        metadata: {
          batch_size: conversions.length,
        },
        triggeredBy: 'scheduled',
      })

      throw error
    }
  }

  /**
   * Transform Nishon conversion event to AmoCRM lead payload
   */
  private transformConversionToLead(
    conversion: ConversionEvent,
    fieldMappings: FieldMapping[]
  ): AmoCRMLeadPayload {
    const mappingMap = new Map(fieldMappings.map((m) => [m.nishonField, m]))

    // Build custom fields array
    const customFields: Array<{ field_id: number; values: Array<{ value: string }> }> = []

    // Helper to add custom field
    const addCustomField = (fieldId: number, value: any) => {
      if (value !== undefined && value !== null) {
        customFields.push({
          field_id: fieldId,
          values: [{ value: String(value) }],
        })
      }
    }

    // Map conversion fields to custom fields
    const campaignMapping = mappingMap.get('campaign.name')
    if (campaignMapping) {
      addCustomField(parseInt(campaignMapping.crmField), conversion.campaignName)
    }

    const platformMapping = mappingMap.get('campaign.platform')
    if (platformMapping) {
      addCustomField(parseInt(platformMapping.crmField), conversion.platform)
    }

    const sourceMapping = mappingMap.get('campaign.sourceUrl')
    if (sourceMapping && conversion.sourceUrl) {
      addCustomField(parseInt(sourceMapping.crmField), conversion.sourceUrl)
    }

    const conversionTypeMapping = mappingMap.get('conversionType')
    if (conversionTypeMapping) {
      addCustomField(
        parseInt(conversionTypeMapping.crmField),
        conversion.conversionType
      )
    }

    // Build the lead payload
    const lead: AmoCRMLeadPayload = {
      name: conversion.name || conversion.email || `Lead from ${conversion.platform}`,
      price: Math.round(conversion.conversionValue),
      custom_fields_values: customFields.length > 0 ? customFields : undefined,
    }

    // Add email and phone as linked contact if possible
    // This would require additional configuration in AmoCRM to link contacts
    if (conversion.email || conversion.phone) {
      // Store in metadata for later linking
      lead.custom_fields_values = [
        ...(customFields || []),
        {
          field_id: 999999, // Placeholder for email custom field
          values: [{ value: conversion.email || '' }],
        },
      ]
    }

    return lead
  }

  /**
   * Log sync operation
   */
  private async logSync(
    connectionId: string,
    event: SyncEventType,
    data: {
      recordsProcessed: number
      recordsSkipped: number
      status: SyncStatus
      errorMessage?: string
      metadata?: Record<string, any>
      triggeredBy: 'manual' | 'scheduled' | 'webhook'
    }
  ): Promise<void> {
    try {
      const log = this.syncLogRepository.create({
        connectionId,
        event,
        status: data.status,
        recordsProcessed: data.recordsProcessed,
        recordsSkipped: data.recordsSkipped,
        errorMessage: data.errorMessage,
        metadata: data.metadata,
        triggeredBy: data.triggeredBy,
      })

      await this.syncLogRepository.save(log)
    } catch (error) {
      this.logger.error(`Failed to save sync log: ${error.message}`)
    }
  }

  /**
   * Get recent sync logs
   */
  async getSyncLogs(
    connectionId: string,
    limit: number = 50
  ): Promise<SyncLog[]> {
    return this.syncLogRepository.find({
      where: { connectionId },
      order: { createdAt: 'DESC' },
      take: limit,
    })
  }

  /**
   * Calculate sync success rate
   */
  async getSyncSuccessRate(
    connectionId: string,
    lastNDays: number = 7
  ): Promise<number> {
    const since = new Date()
    since.setDate(since.getDate() - lastNDays)

    const logs = await this.syncLogRepository.find({
      where: {
        connectionId,
        createdAt: { gte: since },
      },
    })

    if (logs.length === 0) return 100

    const successful = logs.filter((l) => l.status === SyncStatus.SUCCESS).length
    return Math.round((successful / logs.length) * 100)
  }
}
