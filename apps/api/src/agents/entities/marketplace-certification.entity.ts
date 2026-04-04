import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { AgentCertification } from './agent-certification.entity'

@Entity('marketplace_certifications')
export class MarketplaceCertification {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  name: string // "Google Partner", "Meta Blueprint Certified"

  @Column({ unique: true })
  slug: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column()
  issuer: string // "Google", "Meta", "Yandex"

  @Column({ nullable: true })
  iconUrl: string

  @Column({ nullable: true })
  badgeColor: string // CSS color/gradient

  @Column({ default: true })
  isActive: boolean

  @OneToMany(() => AgentCertification, (cert) => cert.certification, { cascade: true })
  agentCertifications: AgentCertification[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
