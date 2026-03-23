import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { Workspace } from "../../workspaces/entities/workspace.entity";

/**
 * A Triggerset is an automation rule: "if condition then action".
 *
 * Examples:
 *   - If CTR < 0.5% for 3 days → pause campaign
 *   - If ROAS > 3 for 7 days → increase budget by 20%
 *   - If spend > daily_budget * 0.9 → send Telegram alert
 *
 * Conditions and actions are stored as JSON for flexibility.
 * The executor evaluates all enabled triggersets every 30 minutes.
 */

export type TriggerCondition = {
  metric: 'ctr' | 'cpc' | 'roas' | 'spend' | 'impressions' | 'clicks' | 'conversions';
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  value: number;
  /** How many consecutive days the condition must hold before firing */
  windowDays: number;
  /** Apply to: 'campaign' | 'adset' | 'workspace' */
  dimension: 'campaign' | 'workspace';
};

export type TriggerAction = {
  type: 'pause_campaign' | 'increase_budget' | 'decrease_budget' | 'notify_telegram' | 'notify_email';
  /** For budget actions: % change (e.g. 20 = +20%) */
  value?: number;
  /** For notify: custom message template */
  message?: string;
};

export type TriggerRunStatus = 'success' | 'failed' | 'no_match' | 'skipped';

@Entity("triggersets")
export class Triggerset {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ default: true })
  enabled: boolean;

  @Column({ type: "jsonb" })
  conditions: TriggerCondition[];

  @Column({ type: "jsonb" })
  actions: TriggerAction[];

  @Column({ type: "varchar", length: 50, nullable: true })
  lastRunStatus: TriggerRunStatus | null;

  @Column({ type: "timestamptz", nullable: true })
  lastRunAt: Date | null;

  @Column({ type: "integer", default: 0 })
  totalFires: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Workspace, { onDelete: "CASCADE" })
  @JoinColumn({ name: "workspace_id" })
  workspace: Workspace;

  @Column({ name: "workspace_id" })
  workspaceId: string;

  @OneToMany(() => TriggerLog, (log) => log.triggerset, { cascade: true })
  logs: TriggerLog[];
}

@Entity("trigger_logs")
export class TriggerLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 50 })
  status: TriggerRunStatus;

  @Column({ type: "jsonb", nullable: true })
  matchedItems: { id: string; name: string; metricValue: number }[] | null;

  @Column({ type: "jsonb", nullable: true })
  actionsApplied: { type: string; target: string; result: string }[] | null;

  @Column({ type: "text", nullable: true })
  errorMessage: string | null;

  @CreateDateColumn()
  ranAt: Date;

  @ManyToOne(() => Triggerset, (ts) => ts.logs, { onDelete: "CASCADE" })
  @JoinColumn({ name: "triggerset_id" })
  triggerset: Triggerset;

  @Column({ name: "triggerset_id" })
  triggersetId: string;
}
