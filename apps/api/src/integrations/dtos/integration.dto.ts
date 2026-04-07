import { IsString, IsEmail, IsOptional, IsNumber, IsObject, IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateIntegrationAuthDto {
  @IsString()
  code: string

  @IsString()
  state: string

  @IsString()
  redirectUri: string
}

export class FieldMappingDto {
  @IsString()
  nishonField: string

  @IsString()
  crmField: string

  @IsOptional()
  @IsString()
  transform?: string

  @IsOptional()
  @IsString()
  dataType?: 'string' | 'number' | 'date' | 'boolean'
}

export class SyncSettingsDto {
  @IsOptional()
  enabled?: boolean

  @IsString()
  frequency: 'real-time' | '15min' | '30min' | 'hourly' | 'daily'

  @IsOptional()
  @IsNumber()
  lookbackDays?: number

  @IsOptional()
  @IsNumber()
  batchSize?: number

  @IsOptional()
  @IsNumber()
  timeoutMs?: number
}

export class SaveConfigurationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldMappingDto)
  fieldMappings: FieldMappingDto[]

  @ValidateNested()
  @Type(() => SyncSettingsDto)
  syncSettings: SyncSettingsDto

  @IsOptional()
  webhookEnabled?: boolean

  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>
}

export class ConversionEventDto {
  @IsString()
  id: string

  @IsEmail()
  email: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsString()
  name?: string

  @IsString()
  campaignId: string

  @IsString()
  campaignName: string

  @IsString()
  platform: 'meta' | 'google' | 'tiktok' | 'yandex'

  @IsOptional()
  @IsString()
  adSetId?: string

  @IsString()
  conversionType: string

  @IsNumber()
  conversionValue: number

  @IsString()
  conversionCurrency: string

  @IsString()
  conversionTimestamp: string // ISO date string

  @IsOptional()
  @IsString()
  sourceUrl?: string

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>
}

export class SyncConversionDto {
  @ValidateNested()
  @Type(() => ConversionEventDto)
  conversion: ConversionEventDto
}

export class BatchSyncConversionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConversionEventDto)
  conversions: ConversionEventDto[]
}

export class IntegrationConnectionResponseDto {
  id: string
  integrationKey: string
  externalAccountId: string
  status: string
  isActive: boolean
  lastSyncedAt?: Date
  connectedAt: Date
  updatedAt: Date
}

export class IntegrationHealthStatusDto {
  connectionId: string
  integrationKey: string
  status: string
  lastSyncedAt?: Date
  lastError?: string
  errorCount: number
  syncSuccessRate: number
  nextScheduledSync?: Date
  webhookLastReceived?: Date
  metadata?: Record<string, any>
}

export class SyncLogEntryDto {
  id: string
  connectionId: string
  event: string
  status: string
  recordsProcessed: number
  recordsSkipped: number
  recordsFailed: number
  errorMessage?: string
  metadata?: Record<string, any>
  triggeredBy: string
  createdAt: Date
}

export class SyncLogsResponseDto {
  logs: SyncLogEntryDto[]
  total: number
}
