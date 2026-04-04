import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { AgentProfile } from './agent-profile.entity'

@Entity('agent_historical_performance')
export class AgentHistoricalPerformance {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  agentProfileId: string

  @Column()
  yearMonth: string // "2024-02" format

  @Column({ type: 'simple-array', nullable: true })
  platforms: string[]

  @Column({ default: 0 })
  totalCampaigns: number

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalSpend: number

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  avgRoas: number

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  avgCpa: number

  @Column({ type: 'decimal', precision: 5, scale: 3, nullable: true })
  avgCtr: number

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  bestRoas: number

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  successRate: number

  @ManyToOne(() => AgentProfile, (profile) => profile.historicalPerformance, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agent_profile_id' })
  agentProfile: AgentProfile

  @CreateDateColumn()
  createdAt: Date
}
