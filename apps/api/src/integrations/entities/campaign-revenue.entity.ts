import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'

/**
 * Aggregated revenue metrics by campaign
 * Updated daily with deal sync results
 * Used for dashboard and reporting
 */
@Entity('campaign_revenues')
@Index(['connectionId', 'campaignId'])
@Index(['periodDate'])
@Index(['platform'])
export class CampaignRevenue {
  @PrimaryGeneratedColumn('uuid')
  id: string

  /**
   * Reference to IntegrationConnection
   */
  @Column()
  @Index()
  connectionId: string

  /**
   * Nishon campaign ID
   */
  @Column()
  campaignId: string

  /**
   * Campaign name
   */
  @Column()
  campaignName: string

  /**
   * Platform (meta, google, tiktok, yandex)
   */
  @Column({
    type: 'enum',
    enum: ['meta', 'google', 'tiktok', 'yandex'],
  })
  platform: 'meta' | 'google' | 'tiktok' | 'yandex'

  /**
   * Period for aggregation (daily, weekly, monthly, all-time)
   */
  @Column({
    type: 'enum',
    enum: ['daily', 'weekly', 'monthly', 'all-time'],
    default: 'daily',
  })
  period: 'daily' | 'weekly' | 'monthly' | 'all-time'

  /**
   * Period date (start of period)
   */
  @Column()
  periodDate: Date

  /**
   * Total ad spend during period
   */
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  totalAdSpend: number

  /**
   * Ad spend currency
   */
  @Column({ default: 'USD' })
  adSpendCurrency: string

  /**
   * Number of conversions/leads generated
   */
  @Column({ default: 0 })
  conversionCount: number

  /**
   * Number of won deals
   */
  @Column({ default: 0 })
  dealCount: number

  /**
   * Total revenue from deals
   */
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  totalRevenue: number

  /**
   * Revenue currency
   */
  @Column({ default: 'USD' })
  revenueCurrency: string

  /**
   * Calculated ROAS (totalRevenue / totalAdSpend)
   */
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  roas: number | null

  /**
   * Cost Per Lead (CPA equivalent)
   */
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  costPerLead: number | null

  /**
   * Cost Per Deal
   */
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  costPerDeal: number | null

  /**
   * Conversion rate (deals / conversions)
   */
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  conversionRate: number | null

  /**
   * Average deal value
   */
  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  avgDealValue: number | null

  /**
   * Minimum deal value in period
   */
  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  minDealValue: number | null

  /**
   * Maximum deal value in period
   */
  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  maxDealValue: number | null

  /**
   * Performance vs last period (percentage change)
   */
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  roasChangePercent: number | null

  /**
   * Number of specialists involved
   */
  @Column({ default: 0 })
  specialistCount: number

  /**
   * Status of metrics (calculated, needs_recalc, pending)
   */
  @Column({
    type: 'enum',
    enum: ['calculated', 'needs_recalc', 'pending'],
    default: 'pending',
  })
  status: 'calculated' | 'needs_recalc' | 'pending'

  /**
   * Additional metrics (custom KPIs)
   */
  @Column('jsonb', { nullable: true })
  customMetrics: Record<string, number>

  /**
   * Metadata
   */
  @Column('jsonb', { nullable: true })
  metadata: {
    last_calculated_at?: Date
    calculation_duration_ms?: number
    deals_included?: number
    conversions_included?: number
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
