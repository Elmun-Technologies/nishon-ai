import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'
import { IntegrationStatus } from '../types/integration.types'

@Entity('integration_connections')
@Index(['workspaceId', 'integrationKey'])
@Index(['workspaceId', 'isActive'])
export class IntegrationConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string

  /**
   * Workspace ID - for multi-workspace isolation
   */
  @Column()
  @Index()
  workspaceId: string

  /**
   * Integration type (amocrm, slack, etc)
   */
  @Column()
  integrationKey: string

  /**
   * External account identifier (e.g., company.amocrm.ru for AmoCRM)
   */
  @Column()
  externalAccountId: string

  /**
   * Encrypted OAuth access token
   * WARNING: select: false to prevent accidental exposure
   */
  @Column({ select: false })
  encryptedAccessToken: string

  /**
   * Encrypted refresh token (optional)
   */
  @Column({ select: false, nullable: true })
  encryptedRefreshToken: string

  /**
   * Token expiration time
   */
  @Column({ nullable: true })
  tokenExpiresAt: Date

  /**
   * Connection status
   */
  @Column({
    type: 'enum',
    enum: IntegrationStatus,
    default: IntegrationStatus.PENDING,
  })
  status: IntegrationStatus

  /**
   * Is connection active
   */
  @Column({ default: true })
  isActive: boolean

  /**
   * Last successful sync timestamp
   */
  @Column({ nullable: true })
  lastSyncedAt: Date

  /**
   * Last sync error message
   */
  @Column({ nullable: true, type: 'text' })
  syncErrorMessage: string

  /**
   * Count of consecutive sync errors
   */
  @Column({ default: 0 })
  syncErrorCount: number

  /**
   * Last error occurred at
   */
  @Column({ nullable: true })
  lastErrorAt: Date

  /**
   * User who connected this integration
   */
  @Column()
  connectedByUserId: string

  /**
   * Additional metadata
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>

  /**
   * Audit fields
   */
  @CreateDateColumn()
  connectedAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
