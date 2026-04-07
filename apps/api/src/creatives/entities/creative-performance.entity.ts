import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm'

/**
 * Performance metrics for creative ads
 * Tracks impressions, clicks, conversions, ROI
 */
@Entity('creative_performance')
@Index(['creativeId', 'date'])
@Index(['campaignId'])
@Index(['workspaceId'])
export class CreativePerformance {
  @PrimaryGeneratedColumn('uuid')
  id: string

  /**
   * Reference to creative
   */
  @Column()
  @Index()
  creativeId: string

  /**
   * Reference to campaign (if used in campaign)
   */
  @Column({ nullable: true })
  @Index()
  campaignId: string

  /**
   * Workspace ID
   */
  @Column()
  @Index()
  workspaceId: string

  /**
   * Ad platform where creative was used
   */
  @Column({
    type: 'enum',
    enum: ['meta', 'google', 'tiktok', 'yandex', 'internal'],
    nullable: true,
  })
  platform: 'meta' | 'google' | 'tiktok' | 'yandex' | 'internal' | null

  /**
   * Date of metrics
   */
  @Column({ type: 'date' })
  date: Date

  /**
   * Impressions
   */
  @Column({ default: 0 })
  impressions: number

  /**
   * Clicks
   */
  @Column({ default: 0 })
  clicks: number

  /**
   * Click-through rate
   */
  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  ctr: number

  /**
   * Conversions
   */
  @Column({ default: 0 })
  conversions: number

  /**
   * Cost per click
   */
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  cpc: number

  /**
   * Cost per conversion/acquisition
   */
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  cpa: number

  /**
   * Total spend
   */
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  spend: number

  /**
   * Total revenue
   */
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  revenue: number

  /**
   * Return on ad spend
   */
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  roas: number

  /**
   * Conversion rate
   */
  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  conversionRate: number

  /**
   * Additional metrics
   */
  @Column('jsonb', { nullable: true, default: () => "'{}'" })
  metadata: {
    avgSessionDuration?: number
    bounceRate?: number
    socialShares?: number
    saves?: number
    [key: string]: any
  }

  /**
   * When data was synced
   */
  @CreateDateColumn()
  syncedAt: Date
}
