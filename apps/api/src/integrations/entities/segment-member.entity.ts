import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm'

/**
 * Links individual contacts from AmoCRM to audience segments
 * Used for tracking membership and incremental sync operations
 */
@Entity('segment_members')
@Index(['segmentId', 'amoCrmContactId'])
@Index(['amoCrmContactId'])
@Index(['email'])
@Index(['phone'])
@Index(['syncStatus'])
export class SegmentMember {
  @PrimaryGeneratedColumn('uuid')
  id: string

  /**
   * Reference to AudienceSegment
   */
  @Column()
  @Index()
  segmentId: string

  /**
   * AmoCRM contact ID
   */
  @Column()
  amoCrmContactId: number

  /**
   * Contact email (used for syncing to platforms)
   */
  @Column({ nullable: true })
  @Index()
  email: string

  /**
   * Contact phone (alternative identifier for some platforms)
   */
  @Column({ nullable: true })
  @Index()
  phone: string

  /**
   * When contact was added to segment
   */
  @CreateDateColumn()
  addedAt: Date

  /**
   * When contact was removed from segment (null if still member)
   */
  @Column({ nullable: true })
  removedAt: Date

  /**
   * Sync status for this membership
   */
  @Column({
    type: 'enum',
    enum: ['pending', 'synced', 'failed'],
    default: 'pending',
  })
  syncStatus: 'pending' | 'synced' | 'failed'

  /**
   * Error message if sync failed for this contact
   */
  @Column({ nullable: true })
  syncErrorMessage: string
}
