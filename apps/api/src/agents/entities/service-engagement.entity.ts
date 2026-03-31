import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Workspace } from "../../workspaces/entities/workspace.entity";
import { AgentProfile } from "./agent-profile.entity";

export type EngagementStatus =
  | "pending"
  | "active"
  | "paused"
  | "completed"
  | "cancelled";

/**
 * ServiceEngagement — created when a workspace "hires" an agent.
 *
 * Revenue flow:
 *   Client pays agreedMonthlyRate to Nishon.
 *   Nishon pays (agreedMonthlyRate * (1 - platformCommissionPct/100)) to the agent owner.
 *   Nishon keeps platformCommissionPct of every payment.
 *
 *   For Nishon's own AI agents (ownerId=null): 100% goes to Nishon.
 *   For human agents: owner gets ~85%, Nishon gets ~15%.
 *   For user AI agents: owner gets ~80%, Nishon gets ~20%.
 */
@Entity("service_engagements")
export class ServiceEngagement {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "workspace_id" })
  workspaceId: string;

  @Column({ name: "agent_profile_id" })
  agentProfileId: string;

  @ManyToOne(() => Workspace, { onDelete: "CASCADE" })
  @JoinColumn({ name: "workspace_id" })
  workspace: Workspace;

  @ManyToOne(() => AgentProfile, { onDelete: "CASCADE" })
  @JoinColumn({ name: "agent_profile_id" })
  agentProfile: AgentProfile;

  @Column({ type: "varchar", length: 20, default: "active" })
  status: EngagementStatus;

  @Column({ type: "timestamp", name: "start_date", nullable: true })
  startDate: Date | null;

  @Column({ type: "timestamp", name: "end_date", nullable: true })
  endDate: Date | null;

  /** Rate locked at time of hire */
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0, name: "agreed_monthly_rate" })
  agreedMonthlyRate: number;

  @Column({ type: "decimal", precision: 5, scale: 2, default: 0, name: "agreed_commission_rate" })
  agreedCommissionRate: number;

  @Column({ type: "varchar", length: 20, default: "fixed", name: "agreed_pricing_model" })
  agreedPricingModel: string;

  /** Nishon's commission rate locked at hire time */
  @Column({ type: "decimal", precision: 5, scale: 2, default: 15, name: "platform_commission_pct" })
  platformCommissionPct: number;

  /** Optional note from client when hiring */
  @Column({ type: "text", nullable: true })
  notes: string | null;

  /** Whether a review has been left for this engagement */
  @Column({ default: false, name: "is_reviewed" })
  isReviewed: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
