import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import type { AgentGoal, FunnelAllocation } from "@adspectr/shared";

/**
 * AgentConfig is the persisted "plan" the autonomous AI agent operates under.
 *
 * When a user activates the AI Agent on the dashboard (link + goal + budget +
 * stop-loss), that plan used to live only in the browser's localStorage — the
 * backend optimization loop never saw the goal, budget or stop-loss it was
 * meant to enforce. This entity makes the plan real server-side state: one row
 * per workspace, snapshotting the approved plan plus the computed funnel
 * allocation the engine can pace against.
 */
@Entity("agent_configs")
export class AgentConfig {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /** One config per workspace. */
  @Index("idx_agent_config_workspace", { unique: true })
  @Column({ type: "uuid", name: "workspace_id" })
  workspaceId: string;

  /** The landing page / product URL the agent advertises. */
  @Column({ type: "text", nullable: true })
  link: string | null;

  /** Business goal driving the funnel split. */
  @Column({ type: "varchar", length: 20, default: "sales" })
  goal: AgentGoal;

  /** Total monthly budget in USD the agent manages. */
  @Column({ type: "integer", default: 0 })
  budget: number;

  /** Hard stop-loss threshold in USD (spend-without-result auto-pause). */
  @Column({ type: "integer", name: "stop_loss_usd", default: 30 })
  stopLossUsd: number;

  /**
   * Snapshot of the funnel allocation computed at activation time
   * (allocateFunnelBudget output). Recomputed whenever goal/budget change.
   */
  @Column({ type: "jsonb", nullable: true })
  allocation: FunnelAllocation | null;

  /** When the agent was (last) activated. */
  @Column({ type: "timestamp", name: "activated_at", nullable: true })
  activatedAt: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
