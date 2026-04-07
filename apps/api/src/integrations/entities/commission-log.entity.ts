import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm'

/**
 * Audit trail for commission calculations and changes
 * Tracks all modifications to specialist commissions
 */
@Entity('commission_logs')
@Index(['commissionId', 'createdAt'])
@Index(['action'])
export class CommissionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  /**
   * Reference to SpecialistCommission
   */
  @Column()
  @Index()
  commissionId: string

  /**
   * Action performed on the commission
   */
  @Column({
    type: 'enum',
    enum: ['calculated', 'approved', 'rejected', 'modified', 'paid', 'reversed'],
  })
  action: 'calculated' | 'approved' | 'rejected' | 'modified' | 'paid' | 'reversed'

  /**
   * User who made the change
   */
  @Column()
  changedBy: string

  /**
   * What changed (before/after values)
   */
  @Column('jsonb')
  changesApplied: {
    from?: Record<string, any>
    to?: Record<string, any>
    [key: string]: any
  }

  /**
   * Reason for the change
   */
  @Column({ nullable: true })
  reason: string

  /**
   * When change was made
   */
  @CreateDateColumn()
  createdAt: Date
}
