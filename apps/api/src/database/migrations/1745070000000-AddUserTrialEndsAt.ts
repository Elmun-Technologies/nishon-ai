import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Adds trial_ends_at for time-boxed product demos (FREE plan).
 * Existing FREE users get a one-time grace window from migration time.
 */
export class AddUserTrialEndsAt1745070000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'trial_ends_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    await queryRunner.query(`
      UPDATE "users"
      SET "trial_ends_at" = NOW() + INTERVAL '7 days'
      WHERE "plan" = 'free' AND "trial_ends_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'trial_ends_at');
  }
}
