import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { AgentProfile } from './agent-profile.entity'
import { MarketplaceCertification } from './marketplace-certification.entity'

@Entity('agent_certifications')
export class AgentCertification {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  agentProfileId: string

  @Column()
  certificationId: string

  @Column({ nullable: true })
  proofUrl: string

  @Column({ default: false })
  verified: boolean

  @Column({
    type: 'enum',
    enum: ['pending_review', 'approved', 'rejected'],
    default: 'pending_review',
  })
  verificationStatus: 'pending_review' | 'approved' | 'rejected'

  @Column({ nullable: true, type: 'timestamp' })
  verifiedAt: Date

  @Column({ nullable: true })
  verifiedBy: string

  @Column({ nullable: true, type: 'timestamp' })
  expiresAt: Date

  @ManyToOne(() => AgentProfile, (profile) => profile.certifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agent_profile_id' })
  agentProfile: AgentProfile

  @ManyToOne(() => MarketplaceCertification, (cert) => cert.agentCertifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'certification_id' })
  certification: MarketplaceCertification

  @CreateDateColumn()
  createdAt: Date
}
