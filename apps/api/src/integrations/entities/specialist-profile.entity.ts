import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'

/**
 * Maps AmoCRM specialists to their tier, contact info, and bank details
 * Used for commission calculations and payout tracking
 */
@Entity('specialist_profiles')
@Index(['workspaceId', 'amoCrmUserId'])
export class SpecialistProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string

  /**
   * Workspace ID for multi-tenancy
   */
  @Column()
  @Index()
  workspaceId: string

  /**
   * AmoCRM user ID
   */
  @Column()
  @Index()
  amoCrmUserId: number

  /**
   * Specialist name from AmoCRM
   */
  @Column()
  specialistName: string

  /**
   * Email address
   */
  @Column({ nullable: true })
  email: string

  /**
   * Specialist tier for commission calculation
   */
  @Column({
    type: 'enum',
    enum: ['junior', 'senior', 'manager'],
    default: 'senior',
  })
  tier: 'junior' | 'senior' | 'manager'

  /**
   * Phone number
   */
  @Column({ nullable: true })
  phone: string

  /**
   * Bank account for payouts (JSON for flexibility)
   */
  @Column('jsonb', { nullable: true, default: () => "'{}'" })
  bankAccount: {
    bank_name?: string
    account_number?: string
    account_holder?: string
    routing_number?: string
    swift_code?: string
    iban?: string
    [key: string]: any
  }

  /**
   * Is this profile active
   */
  @Column({ default: true })
  isActive: boolean

  /**
   * Notes or special terms
   */
  @Column({ nullable: true })
  notes: string

  /**
   * Audit fields
   */
  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
