import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

/**
 * Legacy `users` from create-schema.sql had no OAuth / admin columns and often
 * `password NOT NULL`. TypeORM then queried `google_id` etc. → Google callback 500.
 */
export class AlterLegacyUsersOAuthColumns1712000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("users"))) {
      return;
    }

    if (!(await queryRunner.hasColumn("users", "google_id"))) {
      await queryRunner.addColumn(
        "users",
        new TableColumn({
          name: "google_id",
          type: "varchar",
          length: "255",
          isNullable: true,
          isUnique: true,
        }),
      );
    }

    if (!(await queryRunner.hasColumn("users", "facebook_id"))) {
      await queryRunner.addColumn(
        "users",
        new TableColumn({
          name: "facebook_id",
          type: "varchar",
          length: "255",
          isNullable: true,
          isUnique: true,
        }),
      );
    }

    if (!(await queryRunner.hasColumn("users", "picture"))) {
      await queryRunner.addColumn(
        "users",
        new TableColumn({
          name: "picture",
          type: "text",
          isNullable: true,
        }),
      );
    }

    if (!(await queryRunner.hasColumn("users", "is_admin"))) {
      await queryRunner.addColumn(
        "users",
        new TableColumn({
          name: "is_admin",
          type: "boolean",
          default: false,
        }),
      );
    }

    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn("users", "google_id")) {
      await queryRunner.dropColumn("users", "google_id");
    }
    if (await queryRunner.hasColumn("users", "facebook_id")) {
      await queryRunner.dropColumn("users", "facebook_id");
    }
    if (await queryRunner.hasColumn("users", "picture")) {
      await queryRunner.dropColumn("users", "picture");
    }
    if (await queryRunner.hasColumn("users", "is_admin")) {
      await queryRunner.dropColumn("users", "is_admin");
    }
  }
}
