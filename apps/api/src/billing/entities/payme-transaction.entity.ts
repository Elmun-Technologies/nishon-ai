import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'

/**
 * Payme transaction states (matches Payme Merchant API spec):
 *  0  — created (waiting for payment)
 *  1  — performing (funds captured, being processed)
 *  2  — completed (successfully paid)
 * -1  — cancelled after creation
 * -2  — cancelled after completion (refund)
 */
export type PaymeTransactionState = 0 | 1 | 2 | -1 | -2

/**
 * Tracks every Payme transaction linked to a subscription order.
 *
 * Flow:
 *   1. User clicks "Upgrade" → we create an Order with state=0
 *   2. User is redirected to Payme checkout
 *   3. Payme calls our Merchant API endpoints (CheckPerformTransaction, CreateTransaction, etc.)
 *   4. On PerformTransaction success → state=2, user.plan is upgraded
 */
@Entity('payme_transactions')
@Index(['workspaceId', 'createdAt'])
@Index(['paymeTransactionId'], { unique: true, where: '"payme_transaction_id" IS NOT NULL' })
export class PaymeTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string

  /** Our internal order ID (sent to Payme as account[order_id]) */
  @Column({ unique: true, name: 'order_id' })
  @Index()
  orderId: string

  @Column({ name: 'workspace_id' })
  @Index()
  workspaceId: string

  @Column({ name: 'user_id' })
  userId: string

  /** Payme-assigned transaction ID (set when Payme calls CreateTransaction) */
  @Column({ nullable: true, name: 'payme_transaction_id' })
  paymeTransactionId: string | null

  /** Amount in tiyin (1 UZS = 100 tiyin). Payme works in tiyin. */
  @Column({ type: 'bigint' })
  amount: number

  /** Target plan the user is paying for */
  @Column({ length: 20, name: 'target_plan' })
  targetPlan: string

  /** Current state of the Payme transaction */
  @Column({ type: 'smallint', default: 0 })
  state: PaymeTransactionState

  /** Reason code if cancelled (Payme cancel reason) */
  @Column({ type: 'smallint', nullable: true })
  reason: number | null

  /** Payme create_time (unix ms) */
  @Column({ type: 'bigint', nullable: true, name: 'payme_create_time' })
  paymeCreateTime: number | null

  /** Payme perform_time (unix ms) */
  @Column({ type: 'bigint', nullable: true, name: 'payme_perform_time' })
  paymePerformTime: number | null

  /** Payme cancel_time (unix ms) */
  @Column({ type: 'bigint', nullable: true, name: 'payme_cancel_time' })
  paymeCancelTime: number | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
