import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { AgentProfile } from './agent-profile.entity'

@Entity('specialist_analytics')
export class SpecialistAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  specialistId: string

  @Column({ type: 'date' })
  date: Date // One record per day

  @Column({ type: 'integer', default: 0 })
  profileViews: number

  @Column({ type: 'integer', default: 0 })
  impressions: number

  @Column({ type: 'integer', default: 0 })
  contacts: number

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  engagement: number // percentage

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  conversion: number // percentage (hires/contacts)

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null

  @ManyToOne(() => AgentProfile, (profile) => profile.analytics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'specialist_id' })
  specialist: AgentProfile

  @CreateDateColumn()
  createdAt: Date
}
