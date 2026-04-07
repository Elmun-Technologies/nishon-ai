import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'

/**
 * Configurable commission rates by specialist tier and period
 * Supports base rates and performance bonuses
 */
@Entity('commission_rates')
@Index(['workspaceId', 'specialistTier'])
@Index(['effectiveFrom', 'effectiveTo'])
export class CommissionRate {
  @PrimaryGeneratedColumn('uuid')
  id: string

  /**
   * Workspace ID for multi-tenancy
   */
  @Column()
  @Index()
  workspaceId: string

  /**
   * Optional connection ID (null = workspace default)
   */
  @Column({ nullable: true })
  connectionId: string

  /**
   * Specialist tier this rate applies to
   */
  @Column({
    type: 'enum',
    enum: ['junior', 'senior', 'manager'],
  })
  specialistTier: 'junior' | 'senior' | 'manager'

  /**
   * Base commission percentage (8.5 = 8.5%)
   */
  @Column('decimal', { precision: 5, scale: 2 })
  baseRate: number

  /**
   * Whether performance bonuses apply to this tier
   */
  @Column({ default: false })
  performanceBonus: boolean

  /**
   * Performance bonus rate (5.0 = 5% bonus on top of base)
   */
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  performanceBonusRate: number | null

  /**
   * Minimum deal value to qualify for performance bonus
   */
  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  minDealValueForBonus: number | null

  /**
   * When this rate becomes effective
   */
  @Column()
  effectiveFrom: Date

  /**
   * When this rate expires (null = no end date)
   */
  @Column({ nullable: true })
  effectiveTo: Date

  /**
   * Is this rate currently active
   */
  @Column({ default: true })
  isActive: boolean

  /**
   * Optional notes about rate change
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
