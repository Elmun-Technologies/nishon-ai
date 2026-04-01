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
import { User } from "../../users/entities/user.entity";
import { Campaign } from "../../campaigns/entities/campaign.entity";
import { ConnectedAccount } from "../../platforms/entities/connected-account.entity";
import { AiDecision } from "../../ai-decisions/entities/ai-decision.entity";
import { Budget } from "../../budget/entities/budget.entity";
import { AutopilotMode, CampaignObjective } from "@nishon/shared";

/**
 * A Workspace represents one business managed inside Nishon AI.
 * One user can have multiple workspaces (e.g. they manage 3 different businesses).
 * All campaigns, budgets, and AI decisions belong to a workspace, not directly to a user.
 * This design allows agency accounts to manage multiple clients under one login.
 */
@Entity("workspaces")
@Index("idx_workspace_user", ["userId"])
export class Workspace {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 100 })
  industry: string;

  @Column({ type: "text", nullable: true })
  productDescription: string | null;

  @Column({ type: "text", nullable: true })
  targetAudience: string | null;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  monthlyBudget: number | null;

  @Column({
    type: "enum",
    enum: CampaignObjective,
    default: CampaignObjective.LEADS,
  })
  goal: CampaignObjective;

  @Column({
    type: "enum",
    enum: AutopilotMode,
    default: AutopilotMode.MANUAL,
  })
  autopilotMode: AutopilotMode;

  @Column({ type: "jsonb", nullable: true })
  // Stores the full AI-generated strategy object — see IAiStrategy type in shared package
  aiStrategy: Record<string, any> | null;

  @Column({ default: false })
  isOnboardingComplete: boolean;

  /**
   * Per-workspace auto-optimization policy.
   * Null = use SAFE_DEFAULTS (nothing auto-applied without approval).
   * See WorkspacePolicy type in action-policy.ts.
   */
  @Column({ type: 'jsonb', nullable: true })
  optimizationPolicy: {
    allowAutoBudgetChange: boolean;
    maxAutoBudgetChangePct: number;
    allowAutoCreativeRefresh: boolean;
    allowAutoPauseCreative: boolean;
    allowAudienceChanges: boolean;
    protectedCampaignIds: string[];
    protectedAdSetIds: string[];
  } | null;

  @Column({ length: 100, default: "Uzbekistan" })
  targetLocation: string;

  /**
   * Telegram chat ID for daily report delivery.
   * User gets this by messaging @NishonAIBot and running /start.
   * If null, daily reports are skipped for this workspace.
   */
  @Column({ type: 'varchar', length: 64, nullable: true })
  telegramChatId: string | null;

  /**
   * How the workspace is managed:
   *   'self'        — user manages campaigns themselves
   *   'human_agent' — a real targetologist from marketplace manages it
   *   'ai_agent'    — an AI agent (Nishon or custom) manages it
   */
  @Column({ type: 'varchar', length: 20, default: 'self', name: 'service_type' })
  serviceType: 'self' | 'human_agent' | 'ai_agent';

  /** ID of the assigned AgentProfile (null if self-service) */
  @Column({ type: 'varchar', nullable: true, name: 'assigned_agent_id' })
  assignedAgentId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.workspaces, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "user_id", nullable: true })
  userId: string | null;

  @OneToMany(() => Campaign, (campaign) => campaign.workspace, {
    cascade: true,
  })
  campaigns: Campaign[];

  @OneToMany(() => ConnectedAccount, (account) => account.workspace, {
    cascade: true,
  })
  connectedAccounts: ConnectedAccount[];

  @OneToMany(() => AiDecision, (decision) => decision.workspace)
  aiDecisions: AiDecision[];

  @OneToMany(() => Budget, (budget) => budget.workspace, { cascade: true })
  budgets: Budget[];
}
