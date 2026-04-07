import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'

/**
 * Records commission earned by a specialist from closed deals
 * Tied to AmoCRM specialist assignment and configurable commission rates
 */
@Entity('specialist_commissions')
@Index(['workspaceId', 'amoCrmSpecialistId'])
@Index(['workspaceId', 'dealClosedAt'])
@Index(['status'])
@Index(['periodStartDate', 'periodEndDate'])
export class SpecialistCommission {
  @PrimaryGeneratedColumn('uuid')
  id: string

  /**
   * Workspace ID for multi-tenancy
   */
  @Column()
  @Index()
  workspaceId: string

  /**
   * Reference to IntegrationConnection
   */
  @Column()
  connectionId: string

  /**
   * Reference to LinkedDeal (nullable - for historical records)
   */
  @Column({ nullable: true })
  dealId: string

  /**
   * AmoCRM specialist user ID
   */
  @Column()
  @Index()
  amoCrmSpecialistId: number

  /**
   * Specialist name (cached for display)
   */
  @Column()
  specialistName: string

  /**
   * Deal value (in original currency)
   */
  @Column('decimal', { precision: 12, scale: 2 })
  dealValue: number

  /**
   * Deal currency (USD, UZS, RUB, etc)
   */
  @Column({ default: 'USD' })
  dealCurrency: string

  /**
   * Commission amount earned
   */
  @Column('decimal', { precision: 12, scale: 2 })
  commissionAmount: number

  /**
   * Commission currency (usually same as deal)
   */
  @Column({ default: 'USD' })
  commissionCurrency: string

  /**
   * Commission rate applied (8.5 = 8.5%)
   */
  @Column('decimal', { precision: 5, scale: 2 })
  commissionRate: number

  /**
   * Specialist tier (affects base rate)
   */
  @Column({
    type: 'enum',
    enum: ['junior', 'senior', 'manager'],
    default: 'senior',
  })
  specialistTier: 'junior' | 'senior' | 'manager'

  /**
   * Deal name from AmoCRM
   */
  @Column()
  dealName: string

  /**
   * When deal was closed/won
   */
  @Column()
  dealClosedAt: Date

  /**
   * Commission period start date
   */
  @Column()
  periodStartDate: Date

  /**
   * Commission period end date
   */
  @Column()
  periodEndDate: Date

  /**
   * Commission status in approval workflow
   */
  @Column({
    type: 'enum',
    enum: ['pending', 'calculated', 'approved', 'paid', 'disputed'],
    default: 'calculated',
  })
  status: 'pending' | 'calculated' | 'approved' | 'paid' | 'disputed'

  /**
   * Admin user who approved the commission
   */
  @Column({ nullable: true })
  approvedBy: string

  /**
   * When commission was approved
   */
  @Column({ nullable: true })
  approvedAt: Date

  /**
   * When commission was paid
   */
  @Column({ nullable: true })
  paidAt: Date

  /**
   * Payment method used
   */
  @Column({ nullable: true })
  paymentMethod: string

  /**
   * Notes about commission (disputes, adjustments, etc)
   */
  @Column({ nullable: true })
  notes: string

  /**
   * Additional metadata
   */
  @Column('jsonb', { nullable: true, default: () => "'{}'" })
  metadata: {
    source_campaign?: string
    conversion_attribution?: string
    performance_bonus_applied?: boolean
    bonus_rate?: number
    bonus_amount?: number
    [key: string]: any
  }

  /**
   * Audit fields
   */
  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
