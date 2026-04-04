import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { AgentProfile } from './agent-profile.entity'

@Entity('agent_performance_sync_logs')
export class AgentPerformanceSyncLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  agentProfileId: string

  @Column({
    type: 'enum',
    enum: ['meta', 'google', 'yandex', 'manual'],
  })
  syncType: 'meta' | 'google' | 'yandex' | 'manual'

  @Column({
    type: 'enum',
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending',
  })
  status: 'pending' | 'in_progress' | 'completed' | 'failed'

  @Column({ default: 0 })
  recordsSynced: number

  @Column({ type: 'text', nullable: true })
  errorMessage: string

  @Column({ nullable: true, type: 'timestamp' })
  nextSyncAt: Date

  @Column({ nullable: true, type: 'timestamp' })
  startedAt: Date

  @Column({ nullable: true, type: 'timestamp' })
  completedAt: Date

  @ManyToOne(() => AgentProfile, (profile) => profile.syncLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agent_profile_id' })
  agentProfile: AgentProfile

  @CreateDateColumn()
  createdAt: Date
}
