import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migration: Add fraud detection audit table
 *
 * Creates the fraud_detection_audits table for:
 * - Tracking all fraud detection checks
 * - Logging admin actions and decisions
 * - Storing audit trails for compliance
 * - Analyzing fraud patterns over time
 */
export class AddFraudDetectionAudit1712350000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create fraud_detection_audits table
    await queryRunner.createTable(
      new Table({
        name: 'fraud_detection_audits',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'agent_profile_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'action',
            type: 'enum',
            enum: [
              'fraud_check',
              'admin_approved',
              'admin_rejected',
              'marked_false_positive',
              'threshold_adjusted',
            ],
            isNullable: false,
          },
          {
            name: 'platform',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'risk_score',
            type: 'numeric',
            precision: 3,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'passed',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'failed_checks',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'admin_comment',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'admin_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'false_pos_rule',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'source_type',
            type: 'enum',
            enum: ['api_pull', 'manual_upload', 'case_study'],
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['agent_profile_id'],
            referencedTableName: 'agent_profiles',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
      true,
    );

    // Create indexes for efficient querying
    await queryRunner.createIndex(
      'fraud_detection_audits',
      new TableIndex({
        name: 'idx_fraud_audit_agent_date',
        columnNames: ['agent_profile_id', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'fraud_detection_audits',
      new TableIndex({
        name: 'idx_fraud_audit_risk_score',
        columnNames: ['risk_score', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'fraud_detection_audits',
      new TableIndex({
        name: 'idx_fraud_audit_action',
        columnNames: ['action'],
      }),
    );

    await queryRunner.createIndex(
      'fraud_detection_audits',
      new TableIndex({
        name: 'idx_fraud_audit_platform',
        columnNames: ['platform'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('fraud_detection_audits', 'idx_fraud_audit_platform');
    await queryRunner.dropIndex('fraud_detection_audits', 'idx_fraud_audit_action');
    await queryRunner.dropIndex('fraud_detection_audits', 'idx_fraud_audit_risk_score');
    await queryRunner.dropIndex('fraud_detection_audits', 'idx_fraud_audit_agent_date');

    // Drop table
    await queryRunner.dropTable('fraud_detection_audits', true);
  }
}
