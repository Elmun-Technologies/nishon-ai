import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'

/**
 * Represents a deal from AmoCRM linked to Nishon campaign/conversion
 * Bridges AmoCRM deals with Nishon campaigns for ROAS calculation
 */
@Entity('linked_deals')
@Index(['connectionId', 'campaignId'])
@Index(['connectionId', 'amoCrmDealId'])
@Index(['campaignId', 'status'])
@Index(['wonAt'])
export class LinkedDeal {
  @PrimaryGeneratedColumn('uuid')
  id: string

  /**
   * Reference to IntegrationConnection
   */
  @Column()
  @Index()
  connectionId: string

  /**
   * AmoCRM deal ID (unique in AmoCRM)
   */
  @Column()
  amoCrmDealId: number

  /**
   * Deal name from AmoCRM
   */
  @Column()
  dealName: string

  /**
   * Deal value (in deal currency)
   */
  @Column('decimal', { precision: 12, scale: 2 })
  dealValue: number

  /**
   * Deal currency (USD, UZS, RUB, etc)
   */
  @Column({ default: 'USD' })
  dealCurrency: string

  /**
   * Deal status in AmoCRM (won, lost, in_progress, etc)
   */
  @Column({
    type: 'enum',
    enum: ['won', 'lost', 'in_progress', 'other'],
    default: 'in_progress',
  })
  status: 'won' | 'lost' | 'in_progress' | 'other'

  /**
   * Link to Nishon campaign
   */
  @Column({ nullable: true })
  @Index()
  campaignId: string

  /**
   * Campaign name (cached for quick access)
   */
  @Column({ nullable: true })
  campaignName: string

  /**
   * Campaign platform (meta, google, tiktok, yandex)
   */
  @Column({
    type: 'enum',
    enum: ['meta', 'google', 'tiktok', 'yandex'],
    nullable: true,
  })
  platform: 'meta' | 'google' | 'tiktok' | 'yandex' | null

  /**
   * Ad spend for this campaign
   */
  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  adSpend: number | null

  /**
   * Calculated ROAS (dealValue / adSpend)
   */
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  calculatedRoas: number | null

  /**
   * Number of conversions that led to this deal
   */
  @Column({ default: 0 })
  conversionCount: number

  /**
   * Responsible user ID in AmoCRM
   */
  @Column({ nullable: true })
  responsibleUserId: number

  /**
   * Responsible user name (cached)
   */
  @Column({ nullable: true })
  responsibleUserName: string

  /**
   * Deal created date in AmoCRM
   */
  @Column({ nullable: true })
  createdAt: Date

  /**
   * Deal closed/won date
   */
  @Column({ nullable: true })
  wonAt: Date

  /**
   * Last sync timestamp
   */
  @Column({ nullable: true })
  lastSyncedAt: Date

  /**
   * Custom fields from AmoCRM (for extensibility)
   */
  @Column('jsonb', { nullable: true })
  customFields: Record<string, any>

  /**
   * Metadata for tracking
   */
  @Column('jsonb', { nullable: true, default: () => "'{}'" })
  metadata: {
    source?: 'sync' | 'webhook'
    sync_id?: string
    notes?: string
    [key: string]: any
  }

  /**
   * Audit fields
   */
  @CreateDateColumn()
  linkCreatedAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
