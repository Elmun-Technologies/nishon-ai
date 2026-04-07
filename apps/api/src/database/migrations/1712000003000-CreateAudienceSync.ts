import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm'

export class CreateAudienceSync1712000003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'audience_syncs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'connectionId',
            type: 'uuid',
          },
          {
            name: 'segmentId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'syncType',
            type: 'enum',
            enum: ['full_sync', 'incremental_add', 'incremental_remove', 'segment_create', 'segment_delete'],
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'in_progress', 'success', 'partial', 'failed'],
            default: "'pending'",
          },
          {
            name: 'membersAdded',
            type: 'int',
            default: 0,
          },
          {
            name: 'membersRemoved',
            type: 'int',
            default: 0,
          },
          {
            name: 'membersFailed',
            type: 'int',
            default: 0,
          },
          {
            name: 'totalProcessed',
            type: 'int',
            default: 0,
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'triggeredBy',
            type: 'enum',
            enum: ['manual', 'scheduled', 'webhook', 'deal_event'],
            default: "'manual'",
          },
          {
            name: 'triggeredByUserId',
            type: 'varchar',
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
        ],
      }),
      true
    )

    await queryRunner.createIndex(
      'audience_syncs',
      new TableIndex({
        name: 'IDX_audience_syncs_connectionId_createdAt',
        columnNames: ['connectionId', 'createdAt'],
      })
    )

    await queryRunner.createIndex(
      'audience_syncs',
      new TableIndex({
        name: 'IDX_audience_syncs_segmentId',
        columnNames: ['segmentId'],
      })
    )

    await queryRunner.createIndex(
      'audience_syncs',
      new TableIndex({
        name: 'IDX_audience_syncs_status',
        columnNames: ['status'],
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audience_syncs')
  }
}
