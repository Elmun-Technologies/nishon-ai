import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { AgentProfile } from './agent-profile.entity'

@Entity('agent_languages')
export class AgentLanguage {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  agentProfileId: string

  @Column()
  languageCode: string // "en", "uz", "ru", "kk"

  @Column({
    type: 'enum',
    enum: ['native', 'fluent', 'intermediate'],
    default: 'fluent',
  })
  proficiency: 'native' | 'fluent' | 'intermediate'

  @ManyToOne(() => AgentProfile, (profile) => profile.languages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agent_profile_id' })
  agentProfile: AgentProfile

  @CreateDateColumn()
  createdAt: Date
}
