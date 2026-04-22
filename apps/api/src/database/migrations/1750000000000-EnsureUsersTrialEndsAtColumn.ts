import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

/**
 * Production hit: QueryFailedError column trial_ends_at does not exist on Google callback.
 * Older DBs may have skipped or never applied 1745070000000; this migration is idempotent.
 */
export class EnsureUsersTrialEndsAtColumn1750000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("users"))) {
      return;
    }
    if (await queryRunner.hasColumn("users", "trial_ends_at")) {
      return;
    }

    await queryRunner.addColumn(
      "users",
      new TableColumn({
        name: "trial_ends_at",
        type: "timestamp",
        isNullable: true,
      }),
    );

    await queryRunner.query(`
      UPDATE "users"
      SET "trial_ends_at" = NOW() + INTERVAL '7 days'
      WHERE "plan"::text = 'free' AND "trial_ends_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn("users", "trial_ends_at")) {
      await queryRunner.dropColumn("users", "trial_ends_at");
    }
  }
}
