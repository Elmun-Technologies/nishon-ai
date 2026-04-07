import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm'

export class CreateAudienceSegments1712000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'audience_segments',
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
            type: 'varchar',
          },
          {
            name: 'workspaceId',
            type: 'varchar',
          },
          {
            name: 'externalSegmentId',
            type: 'varchar',
          },
          {
            name: 'segmentName',
            type: 'varchar',
          },
          {
            name: 'segmentType',
            type: 'enum',
            enum: ['warm_leads', 'warm_prospects', 'high_value_customers', 're_engagement'],
          },
          {
            name: 'platform',
            type: 'enum',
            enum: ['meta', 'google', 'tiktok', 'yandex'],
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'sourceRule',
            type: 'jsonb',
          },
          {
            name: 'currentSize',
            type: 'int',
            default: 0,
          },
          {
            name: 'lastSyncedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'syncStatus',
            type: 'enum',
            enum: ['pending', 'syncing', 'synced', 'failed'],
            default: "'pending'",
          },
          {
            name: 'syncErrorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
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
      'audience_segments',
      new TableIndex({
        name: 'IDX_audience_segments_connectionId_segmentName',
        columnNames: ['connectionId', 'segmentName'],
      })
    )

    await queryRunner.createIndex(
      'audience_segments',
      new TableIndex({
        name: 'IDX_audience_segments_connectionId_platform',
        columnNames: ['connectionId', 'platform'],
      })
    )

    await queryRunner.createIndex(
      'audience_segments',
      new TableIndex({
        name: 'IDX_audience_segments_connectionId_createdAt',
        columnNames: ['connectionId', 'createdAt'],
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audience_segments')
  }
}
