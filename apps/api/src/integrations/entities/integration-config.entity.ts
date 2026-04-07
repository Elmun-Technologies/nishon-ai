import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'
import { IntegrationConfig as IIntegrationConfig } from '../types/integration.types'

@Entity('integration_configs')
@Index(['connectionId'])
export class IntegrationConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  /**
   * Reference to IntegrationConnection
   */
  @Column()
  @Index()
  connectionId: string

  /**
   * Field mapping configuration
   * Maps Nishon fields to CRM fields
   */
  @Column('jsonb')
  fieldMappings: Array<{
    nishonField: string
    crmField: string
    required: boolean
    transform?: string
    dataType?: 'string' | 'number' | 'date' | 'boolean'
  }>

  /**
   * Sync settings
   */
  @Column('jsonb')
  syncSettings: {
    enabled: boolean
    frequency: 'real-time' | '15min' | '30min' | 'hourly' | 'daily'
    lookbackDays?: number
    batchSize?: number
    timeoutMs?: number
  }

  /**
   * Webhook configuration
   */
  @Column({ default: true })
  webhookEnabled: boolean

  /**
   * Webhook secret (for signature verification)
   */
  @Column({ nullable: true, select: false })
  webhookSecret: string

  /**
   * Test run status
   */
  @Column({
    type: 'enum',
    enum: ['not-run', 'success', 'failed'],
    default: 'not-run',
  })
  testRunStatus: 'not-run' | 'success' | 'failed'

  /**
   * Test run error message
   */
  @Column({ nullable: true, type: 'text' })
  testRunError: string

  /**
   * Custom fields mapping for advanced use cases
   */
  @Column('jsonb', { nullable: true })
  customFields: Record<string, any>

  /**
   * Enable/disable various sync types
   */
  @Column('jsonb', { default: () => "'{}'" })
  syncTypeConfig: {
    conversions?: boolean
    deals?: boolean
    contacts?: boolean
    audiences?: boolean
  }

  /**
   * Audit fields
   */
  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  lastConfiguredAt: Date
}
