import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm'

export class CreateSpecialistProfiles1712000005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'specialist_profiles',
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
            name: 'amoCrmUserId',
            type: 'int',
          },
          {
            name: 'specialistName',
            type: 'varchar',
          },
          {
            name: 'email',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'tier',
            type: 'enum',
            enum: ['junior', 'senior', 'manager'],
            default: "'senior'",
          },
          {
            name: 'phone',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'bankAccount',
            type: 'jsonb',
            default: "'{}'",
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
      'specialist_profiles',
      new TableIndex({
        name: 'IDX_specialist_profiles_workspaceId_amoCrmUserId',
        columnNames: ['workspaceId', 'amoCrmUserId'],
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('specialist_profiles')
  }
}
