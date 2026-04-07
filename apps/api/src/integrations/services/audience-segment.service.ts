import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AudienceSegment, SegmentMember, AudienceSync } from '../entities'
import { ContactSyncService } from './contact-sync.service'

interface CreateSegmentInput {
  segmentName: string
  segmentType: 'warm_leads' | 'warm_prospects' | 'high_value_customers' | 're_engagement'
  platform: 'meta' | 'google' | 'tiktok' | 'yandex'
  sourceRule: Record<string, any>
  description?: string
  workspaceId: string
  connectionId: string
}

interface SegmentStats {
  size: number
  pending: number
  lastSync: Date | null
  syncStatus: string
}

@Injectable()
export class AudienceSegmentService {
  private readonly logger = new Logger(AudienceSegmentService.name)

  constructor(
    @InjectRepository(AudienceSegment)
    private audienceSegmentRepository: Repository<AudienceSegment>,
    @InjectRepository(SegmentMember)
    private segmentMemberRepository: Repository<SegmentMember>,
    @InjectRepository(AudienceSync)
    private audienceSyncRepository: Repository<AudienceSync>,
    private contactSyncService: ContactSyncService,
  ) {}

  /**
   * Create a new audience segment
   */
  async createSegment(input: CreateSegmentInput): Promise<AudienceSegment> {
    try {
      // Generate external segment ID (in real implementation, would come from platform API)
      const externalSegmentId = `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const segment = this.audienceSegmentRepository.create({
        ...input,
        externalSegmentId,
        syncStatus: 'pending',
      })

      const saved = await this.audienceSegmentRepository.save(segment)

      // Log creation
      await this.audienceSyncRepository.save(
        this.audienceSyncRepository.create({
          connectionId: input.connectionId,
          segmentId: saved.id,
          syncType: 'segment_create',
          status: 'success',
          triggeredBy: 'manual',
        }),
      )

      return saved
    } catch (error) {
      this.logger.error(`Failed to create segment: ${error.message}`)
      throw error
    }
  }

  /**
   * Update segment configuration
   */
  async updateSegment(
    segmentId: string,
    updates: {
      segmentName?: string
      description?: string
      sourceRule?: Record<string, any>
      isActive?: boolean
    },
  ): Promise<AudienceSegment> {
    const segment = await this.audienceSegmentRepository.findOne({
      where: { id: segmentId },
    })

    if (!segment) {
      throw new Error(`Segment not found: ${segmentId}`)
    }

    // Update fields
    Object.assign(segment, updates)

    // If rule changed, mark for re-sync
    if (updates.sourceRule) {
      segment.syncStatus = 'pending'
      segment.lastSyncedAt = null
    }

    return this.audienceSegmentRepository.save(segment)
  }

  /**
   * Delete audience segment
   */
  async deleteSegment(segmentId: string): Promise<void> {
    const segment = await this.audienceSegmentRepository.findOne({
      where: { id: segmentId },
    })

    if (!segment) {
      return
    }

    // Log deletion
    await this.audienceSyncRepository.save(
      this.audienceSyncRepository.create({
        connectionId: segment.connectionId,
        segmentId,
        syncType: 'segment_delete',
        status: 'success',
        triggeredBy: 'manual',
      }),
    )

    // Delete members
    await this.segmentMemberRepository.delete({ segmentId })

    // Delete segment
    await this.audienceSegmentRepository.delete(segmentId)
  }

  /**
   * List all segments for a connection
   */
  async listSegments(
    connectionId: string,
    platform?: 'meta' | 'google' | 'tiktok' | 'yandex',
  ): Promise<AudienceSegment[]> {
    const query = this.audienceSegmentRepository.createQueryBuilder('segment')
    query.where('segment.connectionId = :connectionId', { connectionId })

    if (platform) {
      query.andWhere('segment.platform = :platform', { platform })
    }

    return query.orderBy('segment.createdAt', 'DESC').getMany()
  }

  /**
   * Get segment statistics
   */
  async getSegmentStats(segmentId: string): Promise<SegmentStats> {
    const segment = await this.audienceSegmentRepository.findOne({
      where: { id: segmentId },
    })

    if (!segment) {
      throw new Error(`Segment not found: ${segmentId}`)
    }

    return this.contactSyncService.getSegmentStats(segmentId)
  }

  /**
   * Manually trigger segment sync
   */
  async triggerSegmentSync(
    segmentId: string,
    incremental: boolean = true,
  ): Promise<{ syncId: string; status: string }> {
    const segment = await this.audienceSegmentRepository.findOne({
      where: { id: segmentId },
    })

    if (!segment) {
      throw new Error(`Segment not found: ${segmentId}`)
    }

    try {
      const result = await this.contactSyncService.syncAudienceSegment(segmentId, incremental)

      return {
        syncId: segment.id,
        status: 'success',
      }
    } catch (error) {
      this.logger.error(`Segment sync failed: ${error.message}`)
      throw error
    }
  }

  /**
   * Get sync history for a segment
   */
  async getSyncHistory(
    segmentId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ logs: AudienceSync[]; total: number }> {
    const [logs, total] = await this.audienceSyncRepository.findAndCount({
      where: { segmentId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    })

    return { logs, total }
  }

  /**
   * Get all sync history for connection
   */
  async getConnectionSyncHistory(
    connectionId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ logs: AudienceSync[]; total: number }> {
    const [logs, total] = await this.audienceSyncRepository.findAndCount({
      where: { connectionId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    })

    return { logs, total }
  }
}
