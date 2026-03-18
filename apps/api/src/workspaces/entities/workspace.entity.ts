import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn
} from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { Campaign } from '../../campaigns/entities/campaign.entity'
import { ConnectedAccount } from '../../platforms/entities/connected-account.entity'
import { AiDecision } from '../../ai-decisions/entities/ai-decision.entity'
import { Budget } from '../../budget/entities/budget.entity'
import { AutopilotMode, CampaignObjective } from '@nishon/shared'

/**
 * A Workspace represents one business managed inside Nishon AI.
 * One user can have multiple workspaces (e.g. they manage 3 different businesses).
 * All campaigns, budgets, and AI decisions belong to a workspace, not directly to a user.
 * This design allows agency accounts to manage multiple clients under one login.
 */
@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 255 })
  name: string

  @Column({ length: 100 })
  industry: string

  @Column({ type: 'text' })
  productDescription: string

  @Column({ type: 'text' })
  targetAudience: string

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monthlyBudget: number

  @Column({
    type: 'enum',
    enum: CampaignObjective,
    default: CampaignObjective.LEADS,
  })
  goal: CampaignObjective

  @Column({
    type: 'enum',
    enum: AutopilotMode,
    default: AutopilotMode.MANUAL,
  })
  autopilotMode: AutopilotMode

  @Column({ type: 'jsonb', nullable: true })
  // Stores the full AI-generated strategy object — see IAiStrategy type in shared package
  aiStrategy: Record<string, any> | null

  @Column({ default: false })
  isOnboardingComplete: boolean

  @Column({ length: 100, default: 'Uzbekistan' })
  targetLocation: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => User, (user) => user.workspaces, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ name: 'user_id' })
  userId: string

  @OneToMany(() => Campaign, (campaign) => campaign.workspace, { cascade: true })
  campaigns: Campaign[]

  @OneToMany(() => ConnectedAccount, (account) => account.workspace, { cascade: true })
  connectedAccounts: ConnectedAccount[]

  @OneToMany(() => AiDecision, (decision) => decision.workspace)
  aiDecisions: AiDecision[]

  @OneToMany(() => Budget, (budget) => budget.workspace, { cascade: true })
  budgets: Budget[]
}