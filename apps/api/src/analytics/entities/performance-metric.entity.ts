import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn
} from 'typeorm'
import { Ad } from '../../ads/entities/ad.entity'

/**
 * Stores daily performance snapshots for each ad.
 * We record one row per ad per day — this lets us track trends over time.
 * CTR, CPA, ROAS, CPM are stored as pre-calculated values for fast querying
 * even though they can be derived from other fields (to avoid heavy computation on read).
 */
@Entity('performance_metrics')
export class PerformanceMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'bigint', default: 0 })
  impressions: number

  @Column({ type: 'integer', default: 0 })
  clicks: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  spend: number

  @Column({ type: 'integer', default: 0 })
  conversions: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  revenue: number

  @Column({ type: 'decimal', precision: 8, scale: 4, default: 0 })
  // clicks / impressions * 100 — stored as percentage
  ctr: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  // spend / conversions — cost per acquisition
  cpa: number

  @Column({ type: 'decimal', precision: 8, scale: 4, default: 0 })
  // revenue / spend — return on ad spend
  roas: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  // spend / impressions * 1000 — cost per thousand impressions
  cpm: number

  @Column({ type: 'date' })
  recordedAt: Date

  @CreateDateColumn()
  createdAt: Date

  @ManyToOne(() => Ad, (ad) => ad.metrics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ad_id' })
  ad: Ad

  @Column({ name: 'ad_id' })
  adId: string
}