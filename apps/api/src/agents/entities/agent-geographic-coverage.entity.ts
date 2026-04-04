import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { AgentProfile } from './agent-profile.entity'

@Entity('agent_geographic_coverage')
export class AgentGeographicCoverage {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  agentProfileId: string

  @Column()
  countryCode: string // "UZ", "KZ", "TJ", "AF"

  @Column({ nullable: true })
  region: string

  @Column({ type: 'simple-array', nullable: true })
  cities: string[]

  @Column({
    type: 'enum',
    enum: ['primary', 'secondary'],
    default: 'primary',
  })
  coverageType: 'primary' | 'secondary'

  @Column({ default: false })
  isVerified: boolean

  @ManyToOne(() => AgentProfile, (profile) => profile.geographicCoverage, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agent_profile_id' })
  agentProfile: AgentProfile

  @CreateDateColumn()
  createdAt: Date
}
