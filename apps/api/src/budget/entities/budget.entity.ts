import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn
} from 'typeorm'
import { Workspace } from '../../workspaces/entities/workspace.entity'

export enum BudgetPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

/**
 * Defines how the total advertising budget is allocated across platforms.
 * platformSplit stores percentages that must sum to 100.
 * When autoRebalance is true, the AI can shift budget between platforms
 * based on performance without asking for human approval.
 */
@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalBudget: number

  @Column({ type: 'jsonb' })
  // e.g. { "meta": 60, "google": 40 } — percentages, must sum to 100
  platformSplit: Record<string, number>

  @Column({ type: 'enum', enum: BudgetPeriod, default: BudgetPeriod.MONTHLY })
  period: BudgetPeriod

  @Column({ default: true })
  // If true, AI can rebalance platform split automatically based on ROAS
  autoRebalance: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Workspace, (workspace) => workspace.budgets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace

  @Column({ name: 'workspace_id' })
  workspaceId: string
}