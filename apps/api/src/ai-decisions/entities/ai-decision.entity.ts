import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Workspace } from "../../workspaces/entities/workspace.entity";
import { Campaign } from "../../campaigns/entities/campaign.entity";
import { AiDecisionAction } from "@nishon/shared";

/**
 * Every action the AI takes (or recommends) is logged here as an AiDecision.
 * This is the "explainability layer" — users can always see WHAT the AI did and WHY.
 * In ASSISTED mode, isApproved starts as null (pending human approval).
 * In FULL_AUTO mode, isApproved is set to true automatically and isExecuted to true.
 * beforeState and afterState store snapshots so users can see exactly what changed.
 */
@Entity("ai_decisions")
export class AiDecision {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: AiDecisionAction, nullable: true })
  actionType: AiDecisionAction | null;

  @Column({ type: "text" })
  // Plain language explanation shown to the user — e.g. "Paused this ad because CTR dropped below 0.5% over 3 days"
  reason: string;

  @Column({ type: "jsonb", nullable: true })
  // Snapshot of metrics/settings BEFORE the action
  beforeState: Record<string, any> | null;

  @Column({ type: "jsonb", nullable: true })
  // Snapshot of metrics/settings AFTER the action
  afterState: Record<string, any> | null;

  @Column({ type: "text", nullable: true })
  // e.g. "Expected to reduce CPA by ~25% based on similar campaigns"
  estimatedImpact: string | null;

  @Column({ type: "boolean", nullable: true, default: null })
  // null = pending (ASSISTED mode), true = approved, false = rejected
  isApproved: boolean | null;

  @Column({ default: false })
  // Whether the action has actually been sent to the ad platform API
  isExecuted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Workspace, (workspace) => workspace.aiDecisions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "workspace_id" })
  workspace: Workspace;

  @Column({ name: "workspace_id", nullable: true })
  workspaceId: string | null;

  @ManyToOne(() => Campaign, (campaign) => campaign.aiDecisions, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "campaign_id" })
  campaign: Campaign | null;

  @Column({ name: "campaign_id", nullable: true })
  campaignId: string | null;
}
