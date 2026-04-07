import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm'

export class CreateCreativesTables1712000006000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Creatives table
    await queryRunner.createTable(
      new Table({
        name: 'creatives',
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
            type: 'uuid',
          },
          {
            name: 'campaignId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['image', 'video', 'text-to-image', 'ugc'],
          },
          {
            name: 'createdBy',
            type: 'uuid',
          },
          {
            name: 'prompt',
            type: 'text',
          },
          {
            name: 'generatedUrl',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'generatedUrls',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'headline',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'copy',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'performance',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'sharedWith',
            type: 'jsonb',
            isNullable: true,
            default: "'[]'",
          },
          {
            name: 'version',
            type: 'int',
            default: 1,
          },
          {
            name: 'parentCreativeId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'tags',
            type: 'jsonb',
            isNullable: true,
            default: "'[]'",
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
      true,
    )

    await queryRunner.createIndex(
      'creatives',
      new TableIndex({
        name: 'IDX_creatives_workspaceId_createdAt',
        columnNames: ['workspaceId', 'createdAt'],
      }),
    )

    await queryRunner.createIndex(
      'creatives',
      new TableIndex({
        name: 'IDX_creatives_campaignId',
        columnNames: ['campaignId'],
      }),
    )

    await queryRunner.createIndex(
      'creatives',
      new TableIndex({
        name: 'IDX_creatives_type',
        columnNames: ['type'],
      }),
    )

    await queryRunner.createIndex(
      'creatives',
      new TableIndex({
        name: 'IDX_creatives_createdBy',
        columnNames: ['createdBy'],
      }),
    )

    // Creative Performance table
    await queryRunner.createTable(
      new Table({
        name: 'creative_performance',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'creativeId',
            type: 'uuid',
          },
          {
            name: 'campaignId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'workspaceId',
            type: 'uuid',
          },
          {
            name: 'platform',
            type: 'enum',
            enum: ['meta', 'google', 'tiktok', 'yandex', 'internal'],
            isNullable: true,
          },
          {
            name: 'date',
            type: 'date',
          },
          {
            name: 'impressions',
            type: 'int',
            default: 0,
          },
          {
            name: 'clicks',
            type: 'int',
            default: 0,
          },
          {
            name: 'ctr',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'conversions',
            type: 'int',
            default: 0,
          },
          {
            name: 'cpc',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'cpa',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'spend',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'revenue',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'roas',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'conversionRate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'syncedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    )

    await queryRunner.createIndex(
      'creative_performance',
      new TableIndex({
        name: 'IDX_creative_performance_creativeId_date',
        columnNames: ['creativeId', 'date'],
      }),
    )

    await queryRunner.createIndex(
      'creative_performance',
      new TableIndex({
        name: 'IDX_creative_performance_campaignId',
        columnNames: ['campaignId'],
      }),
    )

    await queryRunner.createIndex(
      'creative_performance',
      new TableIndex({
        name: 'IDX_creative_performance_workspaceId',
        columnNames: ['workspaceId'],
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('creative_performance')
    await queryRunner.dropTable('creatives')
  }
}
