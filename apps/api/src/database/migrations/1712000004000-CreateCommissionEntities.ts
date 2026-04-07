import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm'

export class CreateCommissionEntities1712000004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Specialist Commissions
    await queryRunner.createTable(
      new Table({
        name: 'specialist_commissions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'workspaceId',
            type: 'varchar',
          },
          {
            name: 'connectionId',
            type: 'varchar',
          },
          {
            name: 'dealId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'amoCrmSpecialistId',
            type: 'int',
          },
          {
            name: 'specialistName',
            type: 'varchar',
          },
          {
            name: 'dealValue',
            type: 'decimal',
            precision: 12,
            scale: 2,
          },
          {
            name: 'dealCurrency',
            type: 'varchar',
            default: "'USD'",
          },
          {
            name: 'commissionAmount',
            type: 'decimal',
            precision: 12,
            scale: 2,
          },
          {
            name: 'commissionCurrency',
            type: 'varchar',
            default: "'USD'",
          },
          {
            name: 'commissionRate',
            type: 'decimal',
            precision: 5,
            scale: 2,
          },
          {
            name: 'specialistTier',
            type: 'enum',
            enum: ['junior', 'senior', 'manager'],
            default: "'senior'",
          },
          {
            name: 'dealName',
            type: 'varchar',
          },
          {
            name: 'dealClosedAt',
            type: 'timestamp',
          },
          {
            name: 'periodStartDate',
            type: 'date',
          },
          {
            name: 'periodEndDate',
            type: 'date',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'calculated', 'approved', 'paid', 'disputed'],
            default: "'calculated'",
          },
          {
            name: 'approvedBy',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'approvedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'paidAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'paymentMethod',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    await queryRunner.createIndex(
      'specialist_commissions',
      new TableIndex({
        name: 'IDX_specialist_commissions_workspaceId_amoCrmSpecialistId',
        columnNames: ['workspaceId', 'amoCrmSpecialistId'],
      })
    )

    await queryRunner.createIndex(
      'specialist_commissions',
      new TableIndex({
        name: 'IDX_specialist_commissions_workspaceId_dealClosedAt',
        columnNames: ['workspaceId', 'dealClosedAt'],
      })
    )

    await queryRunner.createIndex(
      'specialist_commissions',
      new TableIndex({
        name: 'IDX_specialist_commissions_status',
        columnNames: ['status'],
      })
    )

    await queryRunner.createIndex(
      'specialist_commissions',
      new TableIndex({
        name: 'IDX_specialist_commissions_periodStartDate_periodEndDate',
        columnNames: ['periodStartDate', 'periodEndDate'],
      })
    )

    // Commission Rates
    await queryRunner.createTable(
      new Table({
        name: 'commission_rates',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'workspaceId',
            type: 'varchar',
          },
          {
            name: 'connectionId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'specialistTier',
            type: 'enum',
            enum: ['junior', 'senior', 'manager'],
          },
          {
            name: 'baseRate',
            type: 'decimal',
            precision: 5,
            scale: 2,
          },
          {
            name: 'performanceBonus',
            type: 'boolean',
            default: false,
          },
          {
            name: 'performanceBonusRate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'minDealValueForBonus',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'effectiveFrom',
            type: 'date',
          },
          {
            name: 'effectiveTo',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    await queryRunner.createIndex(
      'commission_rates',
      new TableIndex({
        name: 'IDX_commission_rates_workspaceId_specialistTier',
        columnNames: ['workspaceId', 'specialistTier'],
      })
    )

    await queryRunner.createIndex(
      'commission_rates',
      new TableIndex({
        name: 'IDX_commission_rates_effectiveFrom_effectiveTo',
        columnNames: ['effectiveFrom', 'effectiveTo'],
      })
    )

    // Commission Logs
    await queryRunner.createTable(
      new Table({
        name: 'commission_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'commissionId',
            type: 'uuid',
          },
          {
            name: 'action',
            type: 'enum',
            enum: ['calculated', 'approved', 'rejected', 'modified', 'paid', 'reversed'],
          },
          {
            name: 'changedBy',
            type: 'varchar',
          },
          {
            name: 'changesApplied',
            type: 'jsonb',
          },
          {
            name: 'reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    await queryRunner.createIndex(
      'commission_logs',
      new TableIndex({
        name: 'IDX_commission_logs_commissionId_createdAt',
        columnNames: ['commissionId', 'createdAt'],
      })
    )

    await queryRunner.createIndex(
      'commission_logs',
      new TableIndex({
        name: 'IDX_commission_logs_action',
        columnNames: ['action'],
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('commission_logs')
    await queryRunner.dropTable('commission_rates')
    await queryRunner.dropTable('specialist_commissions')
  }
}
