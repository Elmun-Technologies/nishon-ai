import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { AgentProfile } from './agent-profile.entity'

@Entity('agent_case_studies')
export class AgentCaseStudy {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  agentProfileId: string

  @Column()
  title: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ nullable: true })
  industry: string // "E-commerce", "B2B SaaS", "Services"

  @Column({ nullable: true })
  clientName: string

  @Column()
  platform: string // "meta", "google", "yandex"

  @Column({ nullable: true })
  durationMonths: number

  @Column({ type: 'jsonb', nullable: true })
  metrics: {
    roas?: number
    cpa?: number
    conversionRate?: number
    spend?: number
    revenue?: number
    conversions?: number
    [key: string]: any
  }

  @Column({ nullable: true })
  beforeScreenshotUrl: string

  @Column({ nullable: true })
  afterScreenshotUrl: string

  @Column({ nullable: true })
  proofUrl: string

  @Column({ default: false })
  isVerified: boolean

  @Column({ default: false })
  isPublic: boolean

  @Column({ default: 0 })
  orderIndex: number

  @ManyToOne(() => AgentProfile, (profile) => profile.caseStudies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agent_profile_id' })
  agentProfile: AgentProfile

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
