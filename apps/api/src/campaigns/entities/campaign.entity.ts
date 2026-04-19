import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { Workspace } from "../../workspaces/entities/workspace.entity";
import { AdSet } from "../../ad-sets/entities/ad-set.entity";
import { AiDecision } from "../../ai-decisions/entities/ai-decision.entity";
import { Platform, CampaignStatus, CampaignObjective, BudgetType, CampaignCurrency } from "@adspectr/shared";
import type { CampaignSchedule } from "@adspectr/shared";

/**
 * A Campaign is the top-level advertising unit on any platform.
 * It corresponds directly to a campaign on Meta, Google, or TikTok.
 * externalId stores the ID from the ad platform so we can sync status back.
 * aiConfig stores the AI-generated targeting and optimization parameters.
 */
@Entity("campaigns")
@Index("idx_campaign_workspace", ["workspaceId"])
@Index("idx_campaign_workspace_status", ["workspaceId", "status"])
@Index("idx_campaign_workspace_platform", ["workspaceId", "platform"])
export class Campaign {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: "enum", enum: Platform, nullable: true })
  platform: Platform | null;

  @Column({
    type: "enum",
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT,
  })
  status: CampaignStatus;

  @Column({ type: "enum", enum: CampaignObjective, nullable: true })
  objective: CampaignObjective | null;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  dailyBudget: number | null;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  totalBudget: number | null;

  /** Budget amount as entered by user (daily or weekly) */
  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  budget: number | null;

  @Column({ type: "enum", enum: BudgetType, default: BudgetType.DAILY })
  budgetType: BudgetType;

  @Column({ type: "enum", enum: CampaignCurrency, default: CampaignCurrency.USD })
  currency: CampaignCurrency;

  /** Display schedule: { always: true } or { always: false, hours: [9,10,...] } */
  @Column({ type: "jsonb", nullable: true })
  schedule: CampaignSchedule | null;

  @Column({ nullable: true, length: 255 })
  // The campaign ID assigned by the ad platform (Meta, Google, etc.)
  externalId: string | null;

  @Column({ type: "jsonb", nullable: true })
  // AI-generated config: targeting params, bid strategy, optimization goals
  aiConfig: Record<string, any> | null;

  @Column({ type: "date", nullable: true })
  startDate: Date | null;

  @Column({ type: "date", nullable: true })
  endDate: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Workspace, (workspace) => workspace.campaigns, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "workspace_id" })
  workspace: Workspace;

  @Column({ name: "workspace_id", nullable: true })
  workspaceId: string | null;

  @OneToMany(() => AdSet, (adSet) => adSet.campaign, { cascade: true })
  adSets: AdSet[];

  @OneToMany(() => AiDecision, (decision) => decision.campaign)
  aiDecisions: AiDecision[];
}
