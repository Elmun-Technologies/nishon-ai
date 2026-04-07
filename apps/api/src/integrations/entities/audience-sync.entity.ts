import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm'

/**
 * Audit log for audience sync operations
 * Tracks what was synced to platforms when and why
 */
@Entity('audience_syncs')
@Index(['connectionId', 'createdAt'])
@Index(['segmentId'])
@Index(['status'])
export class AudienceSync {
  @PrimaryGeneratedColumn('uuid')
  id: string

  /**
   * Reference to IntegrationConnection
   */
  @Column()
  @Index()
  connectionId: string

  /**
   * Reference to AudienceSegment (null for bulk operations)
   */
  @Column({ nullable: true })
  @Index()
  segmentId: string

  /**
   * Type of sync operation
   */
  @Column({
    type: 'enum',
    enum: ['full_sync', 'incremental_add', 'incremental_remove', 'segment_create', 'segment_delete'],
  })
  syncType: 'full_sync' | 'incremental_add' | 'incremental_remove' | 'segment_create' | 'segment_delete'

  /**
   * Sync operation status
   */
  @Column({
    type: 'enum',
    enum: ['pending', 'in_progress', 'success', 'partial', 'failed'],
    default: 'pending',
  })
  status: 'pending' | 'in_progress' | 'success' | 'partial' | 'failed'

  /**
   * Number of members added in this sync
   */
  @Column({ default: 0 })
  membersAdded: number

  /**
   * Number of members removed in this sync
   */
  @Column({ default: 0 })
  membersRemoved: number

  /**
   * Number of members that failed to sync
   */
  @Column({ default: 0 })
  membersFailed: number

  /**
   * Total members processed
   */
  @Column({ default: 0 })
  totalProcessed: number

  /**
   * Error message if sync failed
   */
  @Column({ nullable: true })
  errorMessage: string

  /**
   * What triggered this sync
   */
  @Column({
    type: 'enum',
    enum: ['manual', 'scheduled', 'webhook', 'deal_event'],
    default: 'manual',
  })
  triggeredBy: 'manual' | 'scheduled' | 'webhook' | 'deal_event'

  /**
   * User who triggered the sync (if manual)
   */
  @Column({ nullable: true })
  triggeredByUserId: string

  /**
   * Operational metadata (duration, API calls, etc)
   */
  @Column('jsonb', { nullable: true, default: () => "'{}'" })
  metadata: {
    duration_ms?: number
    api_calls?: number
    batch_count?: number
    platform_response?: Record<string, any>
    deal_id?: string
    deal_status?: string
    [key: string]: any
  }

  /**
   * When sync was created
   */
  @CreateDateColumn()
  createdAt: Date
}
