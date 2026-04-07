import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm'
import { SyncEventType, SyncStatus } from '../types/integration.types'

@Entity('sync_logs')
@Index(['connectionId', 'createdAt'])
@Index(['connectionId', 'event'])
@Index(['status'])
export class SyncLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  /**
   * Reference to IntegrationConnection
   */
  @Column()
  @Index()
  connectionId: string

  /**
   * Type of sync event
   */
  @Column({
    type: 'enum',
    enum: SyncEventType,
  })
  event: SyncEventType

  /**
   * Sync status
   */
  @Column({
    type: 'enum',
    enum: SyncStatus,
    default: SyncStatus.PENDING,
  })
  status: SyncStatus

  /**
   * Number of records processed
   */
  @Column({ default: 0 })
  recordsProcessed: number

  /**
   * Number of records skipped (duplicates, invalid, etc)
   */
  @Column({ default: 0 })
  recordsSkipped: number

  /**
   * Number of records that failed
   */
  @Column({ default: 0 })
  recordsFailed: number

  /**
   * Error message if sync failed
   */
  @Column({ nullable: true, type: 'text' })
  errorMessage: string

  /**
   * Error stack trace for debugging
   */
  @Column({ nullable: true, type: 'text' })
  errorStack: string

  /**
   * Additional metadata
   */
  @Column('jsonb', { nullable: true })
  metadata: {
    duration_ms?: number
    sample_data?: any
    api_calls_made?: number
    retry_count?: number
    batch_number?: number
    webhook_id?: string
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
   * User ID if triggered manually
   */
  @Column({ nullable: true })
  triggeredByUserId: string

  /**
   * Audit field
   */
  @CreateDateColumn()
  createdAt: Date
}
