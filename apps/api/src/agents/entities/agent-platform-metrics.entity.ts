import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'
import { AgentProfile } from './agent-profile.entity'

@Entity('agent_platform_metrics')
@Index(['agentProfileId', 'platform', 'aggregationPeriod'])
@Index(['syncedAt'])
export class AgentPlatformMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  agentProfileId: string

  @Column()
  platform: string // "meta", "google", "yandex", "tiktok"

  @Column({ type: 'date' })
  aggregationPeriod: Date

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalSpend: number

  @Column({ default: 0 })
  campaignsCount: number

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  avgRoas: number

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  avgCpa: number

  @Column({ type: 'decimal', precision: 5, scale: 3, nullable: true })
  avgCtr: number

  @Column({ default: 0 })
  conversionCount: number

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalRevenue: number

  @Column({
    type: 'enum',
    enum: ['api_pull', 'manual_upload', 'case_study'],
    default: 'api_pull',
  })
  sourceType: 'api_pull' | 'manual_upload' | 'case_study'

  @Column({ default: true })
  isVerified: boolean

  @ManyToOne(() => AgentProfile, (profile) => profile.platformMetrics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agent_profile_id' })
  agentProfile: AgentProfile

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  syncedAt: Date
}
