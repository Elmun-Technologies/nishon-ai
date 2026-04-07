import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'

/**
 * Represents a retargeting audience synced to an ad platform
 * Stores metadata about audiences created from AmoCRM contacts/deals
 */
@Entity('audience_segments')
@Index(['connectionId', 'segmentName'])
@Index(['connectionId', 'platform'])
@Index(['connectionId', 'createdAt'])
export class AudienceSegment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  /**
   * Reference to IntegrationConnection for workspace isolation
   */
  @Column()
  @Index()
  connectionId: string

  /**
   * Workspace ID
   */
  @Column()
  @Index()
  workspaceId: string

  /**
   * Platform-specific audience ID (Meta pixel ID, Google segment ID, etc)
   */
  @Column()
  externalSegmentId: string

  /**
   * Human-readable segment name
   */
  @Column()
  @Index()
  segmentName: string

  /**
   * Type of audience segment
   * warm_leads: contacts who converted and became leads
   * warm_prospects: contacts who became deals (in progress)
   * high_value_customers: contacts who won deals
   * re_engagement: contacts whose deals were lost
   */
  @Column({
    type: 'enum',
    enum: ['warm_leads', 'warm_prospects', 'high_value_customers', 're_engagement'],
  })
  segmentType: 'warm_leads' | 'warm_prospects' | 'high_value_customers' | 're_engagement'

  /**
   * Ad platform this segment is synced to
   */
  @Column({
    type: 'enum',
    enum: ['meta', 'google', 'tiktok', 'yandex'],
  })
  platform: 'meta' | 'google' | 'tiktok' | 'yandex'

  /**
   * Human-readable description
   */
  @Column({ nullable: true })
  description: string

  /**
   * AmoCRM filter rule used to define this segment
   * Stored as JSON for dynamic filtering
   */
  @Column('jsonb')
  sourceRule: {
    filterType?: 'status' | 'date_range' | 'custom_field' | 'combined'
    dealStatus?: string[]
    dateRangeStart?: Date
    dateRangeEnd?: Date
    customFieldId?: number
    customFieldValue?: any
    [key: string]: any
  }

  /**
   * Current member count in segment
   */
  @Column({ default: 0 })
  currentSize: number

  /**
   * Timestamp of last successful sync
   */
  @Column({ nullable: true })
  lastSyncedAt: Date

  /**
   * Current sync status
   */
  @Column({
    type: 'enum',
    enum: ['pending', 'syncing', 'synced', 'failed'],
    default: 'pending',
  })
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed'

  /**
   * Error message if sync failed
   */
  @Column({ nullable: true })
  syncErrorMessage: string

  /**
   * Is this segment actively syncing
   */
  @Column({ default: true })
  isActive: boolean

  /**
   * Platform-specific metadata (API responses, config, etc)
   */
  @Column('jsonb', { nullable: true, default: () => "'{}'" })
  metadata: {
    audience_url?: string
    member_count_at_creation?: number
    platform_response?: Record<string, any>
    [key: string]: any
  }

  /**
   * Audit fields
   */
  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
