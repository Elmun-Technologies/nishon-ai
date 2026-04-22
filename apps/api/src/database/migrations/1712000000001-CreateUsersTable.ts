import { MigrationInterface, QueryRunner, Table } from "typeorm";

/**
 * Core auth `users` table (Google/email OAuth, JWT refresh, trials).
 * Was previously only created via TYPEORM_SYNCHRONIZE; production with
 * synchronize=false had no users table → Google callback 500 on INSERT.
 */
export class CreateUsersTable1712000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable("users")) {
      return;
    }

    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.createTable(
      new Table({
        name: "users",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          { name: "email", type: "varchar", length: "255", isUnique: true },
          { name: "password", type: "varchar", length: "255", isNullable: true },
          { name: "name", type: "varchar", length: "100", isNullable: true },
          { name: "plan", type: "varchar", length: "20", default: "'free'" },
          { name: "trial_ends_at", type: "timestamp", isNullable: true },
          { name: "isEmailVerified", type: "boolean", default: false },
          { name: "isAdmin", type: "boolean", default: false },
          { name: "refreshToken", type: "text", isNullable: true },
          { name: "googleId", type: "varchar", length: "255", isNullable: true, isUnique: true },
          { name: "facebookId", type: "varchar", length: "255", isNullable: true, isUnique: true },
          { name: "picture", type: "text", isNullable: true },
          {
            name: "createdAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updatedAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("users");
  }
}
