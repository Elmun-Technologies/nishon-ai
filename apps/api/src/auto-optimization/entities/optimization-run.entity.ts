import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Persists every auto-optimization run.
 *
 * Acts as the audit log + history for the optimization feature:
 * - Users can see what problems were detected and what was recommended
 * - Supports future dashboard / trend views
 * - Allows comparing current vs previous runs to measure improvement
 *
 * All complex fields are stored as jsonb so we can evolve the schema
 * without migrations on every iteration.
 */
@Entity('optimization_runs')
@Index(['workspaceId', 'createdAt'])
@Index(['workspaceId', 'campaignId'])
export class OptimizationRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workspaceId: string;

  @Column({ nullable: true })
  campaignId: string;

  @Column()
  platform: string;

  @Column({
    type: 'enum',
    enum: ['recommend', 'auto_apply'],
    default: 'recommend',
  })
  mode: string;

  /**
   * Compact snapshot of the input performance data.
   * We strip raw ad-level arrays to keep storage light —
   * just enough to understand what was analyzed.
   */
  @Column({ type: 'jsonb', nullable: true })
  inputSnapshot: {
    campaignName: string;
    spend: number;
    roas: number;
    ctr: number;
    conversions: number;
    adSetCount: number;
    adCount: number;
  } | null;

  @Column({ type: 'jsonb', nullable: true })
  ruleAnalysis: any;

  @Column({ type: 'jsonb', nullable: true })
  aiSuggestion: any;

  /** Final ranked + scored actions returned to the user */
  @Column({ type: 'jsonb', nullable: true })
  rankedActions: any;

  /** Governance-classified actions (AUTO_APPLY_ALLOWED | APPROVAL_REQUIRED | BLOCKED) */
  @Column({ type: 'jsonb', nullable: true })
  governedActions: any;

  /** Summary counts: total / autoApply / approvalRequired / blocked */
  @Column({ type: 'jsonb', nullable: true })
  governanceSummary: {
    total: number;
    autoApply: number;
    approvalRequired: number;
    blocked: number;
  } | null;

  /** Action types that were auto-applied (non-empty only in auto_apply mode) */
  @Column({ type: 'jsonb', nullable: true })
  autoAppliedActions: string[] | null;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  tokensUsed: number;

  @Column({ nullable: true })
  durationMs: number;

  /** Overall health score 0–100 from the AI (null if AI step failed) */
  @Column({ nullable: true })
  healthScore: number;

  @CreateDateColumn()
  createdAt: Date;
}
