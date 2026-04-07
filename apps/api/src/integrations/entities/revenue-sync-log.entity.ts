import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm'

/**
 * Audit trail for deal/revenue sync operations
 */
@Entity('revenue_sync_logs')
@Index(['connectionId', 'createdAt'])
@Index(['status'])
export class RevenueSyncLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  /**
   * Reference to IntegrationConnection
   */
  @Column()
  @Index()
  connectionId: string

  /**
   * Type of sync (deal_pull, revenue_calc, etc)
   */
  @Column({
    type: 'enum',
    enum: ['deal_pull', 'revenue_calculation', 'roas_update', 'sync_all'],
  })
  syncType: 'deal_pull' | 'revenue_calculation' | 'roas_update' | 'sync_all'

  /**
   * Sync status
   */
  @Column({
    type: 'enum',
    enum: ['pending', 'in_progress', 'success', 'partial', 'failed'],
  })
  status: 'pending' | 'in_progress' | 'success' | 'partial' | 'failed'

  /**
   * Number of deals processed
   */
  @Column({ default: 0 })
  dealsProcessed: number

  /**
   * Number of deals with successful ROAS calculation
   */
  @Column({ default: 0 })
  dealsWithRoas: number

  /**
   * Number of deals that failed
   */
  @Column({ default: 0 })
  dealsFailed: number

  /**
   * Number of deals skipped (missing campaign link, etc)
   */
  @Column({ default: 0 })
  dealsSkipped: number

  /**
   * Error message if sync failed
   */
  @Column({ nullable: true, type: 'text' })
  errorMessage: string

  /**
   * Error stack trace
   */
  @Column({ nullable: true, type: 'text' })
  errorStack: string

  /**
   * Date range processed (from)
   */
  @Column({ nullable: true })
  dateRangeFrom: Date

  /**
   * Date range processed (to)
   */
  @Column({ nullable: true })
  dateRangeTo: Date

  /**
   * Total revenue synced
   */
  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  totalRevenueSynced: number

  /**
   * Total ad spend referenced
   */
  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  totalAdSpend: number

  /**
   * Calculated aggregate ROAS
   */
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  aggregateRoas: number

  /**
   * Metadata
   */
  @Column('jsonb', { nullable: true })
  metadata: {
    duration_ms?: number
    api_calls?: number
    batch_size?: number
    campaigns_linked?: number
    new_campaigns?: number
    updated_campaigns?: number
    [key: string]: any
  }

  /**
   * Triggered by (manual, scheduled, webhook)
   */
  @Column({
    type: 'enum',
    enum: ['manual', 'scheduled', 'webhook'],
    default: 'scheduled',
  })
  triggeredBy: 'manual' | 'scheduled' | 'webhook'

  /**
   * User who triggered (if manual)
   */
  @Column({ nullable: true })
  triggeredByUserId: string

  /**
   * Audit field
   */
  @CreateDateColumn()
  createdAt: Date
}
