import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm'

export class CreateSegmentMembers1712000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'segment_members',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'segmentId',
            type: 'uuid',
          },
          {
            name: 'amoCrmContactId',
            type: 'int',
          },
          {
            name: 'email',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'addedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'removedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'syncStatus',
            type: 'enum',
            enum: ['pending', 'synced', 'failed'],
            default: "'pending'",
          },
          {
            name: 'syncErrorMessage',
            type: 'text',
            isNullable: true,
          },
        ],
      }),
      true
    )

    await queryRunner.createIndex(
      'segment_members',
      new TableIndex({
        name: 'IDX_segment_members_segmentId_amoCrmContactId',
        columnNames: ['segmentId', 'amoCrmContactId'],
      })
    )

    await queryRunner.createIndex(
      'segment_members',
      new TableIndex({
        name: 'IDX_segment_members_amoCrmContactId',
        columnNames: ['amoCrmContactId'],
      })
    )

    await queryRunner.createIndex(
      'segment_members',
      new TableIndex({
        name: 'IDX_segment_members_email',
        columnNames: ['email'],
      })
    )

    await queryRunner.createIndex(
      'segment_members',
      new TableIndex({
        name: 'IDX_segment_members_phone',
        columnNames: ['phone'],
      })
    )

    await queryRunner.createIndex(
      'segment_members',
      new TableIndex({
        name: 'IDX_segment_members_syncStatus',
        columnNames: ['syncStatus'],
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('segment_members')
  }
}
