import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn
} from 'typeorm'
import { Workspace } from '../../workspaces/entities/workspace.entity'
import { AdSet } from '../../ad-sets/entities/ad-set.entity'
import { AiDecision } from '../../ai-decisions/entities/ai-decision.entity'
import { Platform, CampaignStatus, CampaignObjective } from '@nishon/shared'

/**
 * A Campaign is the top-level advertising unit on any platform.
 * It corresponds directly to a campaign on Meta, Google, or TikTok.
 * externalId stores the ID from the ad platform so we can sync status back.
 * aiConfig stores the AI-generated targeting and optimization parameters.
 */
@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 255 })
  name: string

  @Column({ type: 'enum', enum: Platform })
  platform: Platform

  @Column({
    type: 'enum',
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT,
  })
  status: CampaignStatus

  @Column({ type: 'enum', enum: CampaignObjective })
  objective: CampaignObjective

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  dailyBudget: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalBudget: number

  @Column({ nullable: true, length: 255 })
  // The campaign ID assigned by the ad platform (Meta, Google, etc.)
  externalId: string | null

  @Column({ type: 'jsonb', nullable: true })
  // AI-generated config: targeting params, bid strategy, optimization goals
  aiConfig: Record<string, any> | null

  @Column({ type: 'date', nullable: true })
  startDate: Date | null

  @Column({ type: 'date', nullable: true })
  endDate: Date | null

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Workspace, (workspace) => workspace.campaigns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace

  @Column({ name: 'workspace_id' })
  workspaceId: string

  @OneToMany(() => AdSet, (adSet) => adSet.campaign, { cascade: true })
  adSets: AdSet[]

  @OneToMany(() => AiDecision, (decision) => decision.campaign)
  aiDecisions: AiDecision[]
}