import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm'

export class AddSpecialistContacts1712700001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'specialist_contacts',
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
            name: 'user_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'message',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'preferred_contact_method',
            type: 'enum',
            enum: ['email', 'phone', 'message'],
            default: "'email'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['new', 'read', 'responded', 'spam'],
            default: "'new'",
          },
          {
            name: 'specialist_response',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'responded_at',
            type: 'timestamp',
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
      'specialist_contacts',
      new TableForeignKey({
        columnNames: ['specialist_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'agent_profiles',
        onDelete: 'CASCADE',
      }),
    )

    // Create foreign key to users (if exists)
    try {
      await queryRunner.createForeignKey(
        'specialist_contacts',
        new TableForeignKey({
          columnNames: ['user_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'SET NULL',
        }),
      )
    } catch (err) {
      // users table might not exist yet, skip
    }

    // Create indexes
    await queryRunner.createIndex(
      'specialist_contacts',
      new TableIndex({
        name: 'IDX_specialist_contacts_specialist_id',
        columnNames: ['specialist_id'],
      }),
    )

    await queryRunner.createIndex(
      'specialist_contacts',
      new TableIndex({
        name: 'IDX_specialist_contacts_status',
        columnNames: ['status'],
      }),
    )

    await queryRunner.createIndex(
      'specialist_contacts',
      new TableIndex({
        name: 'IDX_specialist_contacts_created_at',
        columnNames: ['created_at'],
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('specialist_contacts')
  }
}
