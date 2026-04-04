import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { AgentProfile } from './agent-profile.entity';

/**
 * FraudDetectionAudit — Audit trail for fraud detection checks and admin actions
 *
 * This entity tracks:
 * - Every fraud detection run and its results
 * - Failed checks and issues flagged
 * - Risk score changes over time
 * - Admin actions (approvals, threshold adjustments, false positive marking)
 *
 * Used for compliance, debugging, and understanding fraud patterns
 */
export type AuditAction = 'fraud_check' | 'admin_approved' | 'admin_rejected' | 'marked_false_positive' | 'threshold_adjusted';

@Entity('fraud_detection_audits')
@Index(['agentProfileId', 'createdAt'])
@Index(['riskScore', 'createdAt'])
@Index(['action'])
export class FraudDetectionAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  agentProfileId: string;

  @Column({
    type: 'enum',
    enum: [
      'fraud_check',
      'admin_approved',
      'admin_rejected',
      'marked_false_positive',
      'threshold_adjusted',
    ],
  })
  action: AuditAction;

  @Column({ type: 'varchar', length: 50 })
  platform: string; // "meta", "google", "yandex", "tiktok", "telegram"

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  riskScore: number; // 0-1

  @Column({ type: 'boolean', default: true })
  passed: boolean;

  /**
   * JSON array of failed checks
   * [{rule, severity, message, value?, threshold?}]
   */
  @Column({ type: 'jsonb', nullable: true })
  failedChecks: Array<{
    rule: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    value?: number | string;
    threshold?: number | string;
  }> | null;

  /**
   * For admin actions: reason or comment
   */
  @Column({ type: 'text', nullable: true })
  adminComment: string | null;

  /**
   * UUID of admin user who took action
   */
  @Column({ type: 'varchar', nullable: true })
  adminId: string | null;

  /**
   * For marked false positives: rule that was incorrectly flagged
   */
  @Column({ type: 'varchar', nullable: true })
  falsePosRule: string | null;

  /**
   * Metric source type
   */
  @Column({
    type: 'enum',
    enum: ['api_pull', 'manual_upload', 'case_study'],
    nullable: true,
  })
  sourceType: 'api_pull' | 'manual_upload' | 'case_study' | null;

  @ManyToOne(() => AgentProfile, (profile) => profile.fraudAudits, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'agent_profile_id' })
  agentProfile: AgentProfile;

  @CreateDateColumn()
  createdAt: Date;
}
