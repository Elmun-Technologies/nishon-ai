import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { AgentProfile } from './agent-profile.entity'
import { User } from '../../users/entities/user.entity'

export type ContactStatus = 'new' | 'read' | 'responded' | 'spam'

@Entity('specialist_contacts')
export class SpecialistContact {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  specialistId: string

  @Column({ nullable: true })
  userId: string | null // null if anonymous

  @Column({ type: 'varchar', length: 255 })
  email: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null

  @Column({ type: 'text' })
  message: string

  @Column({
    type: 'enum',
    enum: ['email', 'phone', 'message'],
    default: 'email',
  })
  preferredContactMethod: 'email' | 'phone' | 'message'

  @Column({
    type: 'enum',
    enum: ['new', 'read', 'responded', 'spam'],
    default: 'new',
  })
  status: ContactStatus

  @Column({ type: 'text', nullable: true })
  specialistResponse: string | null

  @Column({ type: 'timestamp', nullable: true })
  respondedAt: Date | null

  @ManyToOne(() => AgentProfile, (profile) => profile.contacts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'specialist_id' })
  specialist: AgentProfile

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null

  @CreateDateColumn()
  createdAt: Date
}
