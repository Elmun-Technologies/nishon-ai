import { IsString, IsEnum, IsOptional, IsObject, IsNumber, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

// ─────────────────────────────────────────────────────────────────────────
// Audience Segment DTOs

export class CreateAudienceSegmentDto {
  @IsString()
  segmentName: string

  @IsEnum(['warm_leads', 'warm_prospects', 'high_value_customers', 're_engagement'])
  segmentType: 'warm_leads' | 'warm_prospects' | 'high_value_customers' | 're_engagement'

  @IsEnum(['meta', 'google', 'tiktok', 'yandex'])
  platform: 'meta' | 'google' | 'tiktok' | 'yandex'

  @IsOptional()
  @IsString()
  description?: string

  @IsObject()
  sourceRule: Record<string, any>
}

export class UpdateAudienceSegmentDto {
  @IsOptional()
  @IsString()
  segmentName?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsObject()
  sourceRule?: Record<string, any>

  @IsOptional()
  isActive?: boolean
}

export class AudienceSegmentResponseDto {
  id: string
  segmentName: string
  segmentType: string
  platform: string
  description?: string
  externalSegmentId: string
  currentSize: number
  lastSyncedAt?: Date
  syncStatus: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export class AudienceSegmentStatsDto {
  size: number
  pending: number
  lastSync?: Date
  syncStatus: string
}

export class AudienceSegmentDetailDto extends AudienceSegmentResponseDto {
  stats: AudienceSegmentStatsDto
  sourceRule: Record<string, any>
}

// ─────────────────────────────────────────────────────────────────────────
// Audience Sync DTOs

export class SegmentSyncRequestDto {
  @IsOptional()
  incremental?: boolean = true
}

export class SegmentSyncResultDto {
  syncId: string
  status: string
  membersProcessed: number
  membersFailed: number
  duration: number
}

export class AudienceSyncLogEntryDto {
  id: string
  syncType: string
  status: string
  membersAdded: number
  membersRemoved: number
  membersFailed: number
  totalProcessed: number
  errorMessage?: string
  triggeredBy: string
  triggeredByUserId?: string
  metadata?: Record<string, any>
  createdAt: Date
}

export class AudienceSyncHistoryResponseDto {
  logs: AudienceSyncLogEntryDto[]
  pagination: {
    total: number
    limit: number
    offset: number
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Segment Member DTOs

export class SegmentMemberDto {
  id: string
  amoCrmContactId: number
  email?: string
  phone?: string
  syncStatus: string
  addedAt: Date
  removedAt?: Date
}

export class SegmentMembersResponseDto {
  members: SegmentMemberDto[]
  total: number
}

// ─────────────────────────────────────────────────────────────────────────
// List Responses

export class ListAudienceSegmentsResponseDto {
  segments: AudienceSegmentResponseDto[]
  total: number
}
