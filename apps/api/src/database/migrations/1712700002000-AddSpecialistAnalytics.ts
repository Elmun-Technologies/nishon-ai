import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm'

export class AddSpecialistAnalytics1712700002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'specialist_analytics',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'specialist_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'profile_views',
            type: 'integer',
            default: 0,
          },
          {
            name: 'impressions',
            type: 'integer',
            default: 0,
          },
          {
            name: 'contacts',
            type: 'integer',
            default: 0,
          },
          {
            name: 'engagement',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'conversion',
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
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    )

    // Create foreign key to agent_profiles
    await queryRunner.createForeignKey(
      'specialist_analytics',
      new TableForeignKey({
        columnNames: ['specialist_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'agent_profiles',
        onDelete: 'CASCADE',
      }),
    )

    // Create indexes
    await queryRunner.createIndex(
      'specialist_analytics',
      new TableIndex({
        name: 'IDX_specialist_analytics_specialist_id',
        columnNames: ['specialist_id'],
      }),
    )

    await queryRunner.createIndex(
      'specialist_analytics',
      new TableIndex({
        name: 'IDX_specialist_analytics_date',
        columnNames: ['date'],
      }),
    )

    await queryRunner.createIndex(
      'specialist_analytics',
      new TableIndex({
        name: 'IDX_specialist_analytics_specialist_id_date',
        columnNames: ['specialist_id', 'date'],
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('specialist_analytics')
  }
}
