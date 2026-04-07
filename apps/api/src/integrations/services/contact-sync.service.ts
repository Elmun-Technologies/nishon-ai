import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import {
  AudienceSegment,
  SegmentMember,
  AudienceSync,
  LinkedDeal,
  IntegrationConnection,
} from '../entities'
import { AmoCRMConnectorService } from './amocrm-connector.service'

interface SyncResult {
  membersAdded: number
  membersRemoved: number
  membersFailed: number
  totalProcessed: number
  duration: number
}

interface AmoCRMContact {
  id: number
  name: string
  emails?: Array<{ value: string }>
  phones?: Array<{ value: string }>
  custom_fields?: Record<string, any>
  [key: string]: any
}

@Injectable()
export class ContactSyncService {
  private readonly logger = new Logger(ContactSyncService.name)

  constructor(
    @InjectRepository(AudienceSegment)
    private audienceSegmentRepository: Repository<AudienceSegment>,
    @InjectRepository(SegmentMember)
    private segmentMemberRepository: Repository<SegmentMember>,
    @InjectRepository(AudienceSync)
    private audienceSyncRepository: Repository<AudienceSync>,
    @InjectRepository(LinkedDeal)
    private linkedDealRepository: Repository<LinkedDeal>,
    @InjectRepository(IntegrationConnection)
    private integrationConnectionRepository: Repository<IntegrationConnection>,
    private amoCRMConnectorService: AmoCRMConnectorService,
  ) {}

  /**
   * Fetch contacts from AmoCRM matching a filter rule
   */
  async fetchContactsByRule(
    connectionId: string,
    rule: Record<string, any>,
  ): Promise<AmoCRMContact[]> {
    try {
      const connection = await this.integrationConnectionRepository.findOne({
        where: { id: connectionId },
      })

      if (!connection) {
        throw new NotFoundException(`Connection not found: ${connectionId}`)
      }

      const client = this.amoCRMConnectorService.createClient(
        (connection as any).accessToken || 'token',
        connection.externalAccountId || 'subdomain'
      )

      // Build query parameters based on rule type
      const queryParams: Record<string, any> = {
        limit: 250,
        with: 'leads',
      }

      if (rule.dealStatus) {
        queryParams.filter = {
          status_id: rule.dealStatus,
        }
      }

      if (rule.dateRangeStart) {
        queryParams.filter = {
          ...queryParams.filter,
          updated_at: {
            from: Math.floor(new Date(rule.dateRangeStart).getTime() / 1000),
          },
        }
      }

      // Fetch with pagination
      const contacts: AmoCRMContact[] = []
      let page = 1
      let hasMore = true

      while (hasMore) {
        const response = await client.get('/api/v4/contacts', {
          params: { ...queryParams, page },
        })

        if (response.data._embedded?.contacts) {
          contacts.push(...response.data._embedded.contacts)
        }

        hasMore = response.data._links?.next !== undefined
        page++
      }

      return contacts
    } catch (error) {
      this.logger.error(`Failed to fetch contacts for rule: ${error.message}`)
      throw error
    }
  }

  /**
   * Sync audience segment - full sync or incremental
   */
  async syncAudienceSegment(
    segmentId: string,
    incremental: boolean = true,
  ): Promise<SyncResult> {
    const startTime = Date.now()

    try {
      const segment = await this.audienceSegmentRepository.findOne({
        where: { id: segmentId },
      })

      if (!segment) {
        throw new Error(`Segment not found: ${segmentId}`)
      }

      // Create audit log entry
      const syncLog = this.audienceSyncRepository.create({
        connectionId: segment.connectionId,
        segmentId,
        syncType: incremental ? 'incremental_add' : 'full_sync',
        status: 'in_progress',
      })
      await this.audienceSyncRepository.save(syncLog)

      // Fetch contacts matching segment's source rule
      const contacts = await this.fetchContactsByRule(
        segment.connectionId,
        segment.sourceRule,
      )

      // Extract emails and phones
      const contactIdentifiers = contacts
        .map((contact) => ({
          amoCrmContactId: contact.id,
          email: contact.emails?.[0]?.value,
          phone: contact.phones?.[0]?.value,
        }))
        .filter((c) => c.email || c.phone)

      // Track sync results
      let membersAdded = 0
      let membersFailed = 0

      // Upsert segment members
      for (const identifier of contactIdentifiers) {
        try {
          const existing = await this.segmentMemberRepository.findOne({
            where: {
              segmentId,
              amoCrmContactId: identifier.amoCrmContactId,
            },
          })

          if (existing && existing.removedAt) {
            // Re-add member
            existing.removedAt = null
            existing.syncStatus = 'pending'
            await this.segmentMemberRepository.save(existing)
            membersAdded++
          } else if (!existing) {
            // Add new member
            await this.segmentMemberRepository.save(
              this.segmentMemberRepository.create({
                segmentId,
                ...identifier,
                syncStatus: 'pending',
              }),
            )
            membersAdded++
          }
        } catch (error) {
          this.logger.error(
            `Failed to add contact ${identifier.amoCrmContactId}: ${error.message}`,
          )
          membersFailed++
        }
      }

      const duration = Date.now() - startTime

      // Update segment
      segment.currentSize = contactIdentifiers.length
      segment.lastSyncedAt = new Date()
      segment.syncStatus = 'synced'
      segment.syncErrorMessage = null
      await this.audienceSegmentRepository.save(segment)

      // Update sync log
      syncLog.status = membersFailed === 0 ? 'success' : 'partial'
      syncLog.membersAdded = membersAdded
      syncLog.membersFailed = membersFailed
      syncLog.totalProcessed = contactIdentifiers.length
      syncLog.metadata = { duration_ms: duration }
      await this.audienceSyncRepository.save(syncLog)

      return {
        membersAdded,
        membersRemoved: 0,
        membersFailed,
        totalProcessed: contactIdentifiers.length,
        duration,
      }
    } catch (error) {
      this.logger.error(`Audience sync failed: ${error.message}`)

      // Update segment error status
      const segment = await this.audienceSegmentRepository.findOne({
        where: { id: segmentId },
      })
      if (segment) {
        segment.syncStatus = 'failed'
        segment.syncErrorMessage = error.message
        await this.audienceSegmentRepository.save(segment)
      }

      throw error
    }
  }

  /**
   * Update segment membership based on deal status change
   */
  async updateSegmentFromDeal(
    dealId: string,
    dealStatus: 'won' | 'lost' | 'in_progress' | 'other',
  ): Promise<void> {
    try {
      const deal = await this.linkedDealRepository.findOne({
        where: { id: dealId },
      })

      if (!deal) {
        return
      }

      const segments = await this.audienceSegmentRepository.find({
        where: { connectionId: deal.connectionId, isActive: true },
      })

      // Map deal status to segment types
      const targetSegmentTypes = this.mapDealStatusToSegments(dealStatus)

      for (const segment of segments) {
        if (targetSegmentTypes.includes(segment.segmentType)) {
          // Add contact to segment
          const contactEmail = deal.customFields?.email
          const contactPhone = deal.customFields?.phone

          if (contactEmail || contactPhone) {
            const existing = await this.segmentMemberRepository.findOne({
              where: {
                segmentId: segment.id,
                email: contactEmail,
              },
            })

            if (!existing) {
              await this.segmentMemberRepository.save(
                this.segmentMemberRepository.create({
                  segmentId: segment.id,
                  amoCrmContactId: deal.customFields?.contact_id || 0,
                  email: contactEmail,
                  phone: contactPhone,
                  syncStatus: 'pending',
                }),
              )

              // Queue sync
              await this.incrementalSyncSegment(segment.id)
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to update segment from deal: ${error.message}`)
      // Don't throw - this is non-blocking
    }
  }

  /**
   * Incremental sync - only new/changed members
   */
  async incrementalSyncSegment(segmentId: string): Promise<SyncResult> {
    const startTime = Date.now()

    const segment = await this.audienceSegmentRepository.findOne({
      where: { id: segmentId },
    })

    if (!segment) {
      throw new Error(`Segment not found: ${segmentId}`)
    }

    // Find pending members
    const pendingMembers = await this.segmentMemberRepository.find({
      where: {
        segmentId,
        syncStatus: 'pending',
      },
    })

    // Mark as synced (in real implementation, would upload to platform)
    for (const member of pendingMembers) {
      member.syncStatus = 'synced'
      await this.segmentMemberRepository.save(member)
    }

    const duration = Date.now() - startTime

    return {
      membersAdded: pendingMembers.length,
      membersRemoved: 0,
      membersFailed: 0,
      totalProcessed: pendingMembers.length,
      duration,
    }
  }

  /**
   * Map deal status to audience segment types
   */
  private mapDealStatusToSegments(
    dealStatus: 'won' | 'lost' | 'in_progress' | 'other',
  ): string[] {
    const mapping: Record<string, string[]> = {
      won: ['high_value_customers'],
      lost: ['re_engagement'],
      in_progress: ['warm_prospects'],
      other: [],
    }
    return mapping[dealStatus] || []
  }

  /**
   * Get segment statistics
   */
  async getSegmentStats(segmentId: string) {
    const segment = await this.audienceSegmentRepository.findOne({
      where: { id: segmentId },
    })

    const memberCount = await this.segmentMemberRepository.count({
      where: {
        segmentId,
        removedAt: null,
      },
    })

    const pendingCount = await this.segmentMemberRepository.count({
      where: {
        segmentId,
        syncStatus: 'pending',
        removedAt: null,
      },
    })

    return {
      size: memberCount,
      pending: pendingCount,
      lastSync: segment?.lastSyncedAt,
      syncStatus: segment?.syncStatus,
    }
  }
}
