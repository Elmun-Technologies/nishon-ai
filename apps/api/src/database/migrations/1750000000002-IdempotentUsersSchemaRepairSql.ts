import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Belt-and-suspenders repair for production `users` (Google OAuth 500).
 * Uses raw SQL + DO blocks so columns are added even if prior TypeORM
 * migrations were skipped, partially applied, or hasColumn checks disagreed with PG.
 */
export class IdempotentUsersSchemaRepairSql1750000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasUsers = await queryRunner.hasTable("users");
    if (!hasUsers) {
      return;
    }

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "users" ADD COLUMN "trial_ends_at" TIMESTAMP NULL;
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "users" ADD COLUMN "google_id" VARCHAR(255) NULL;
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "users" ADD COLUMN "facebook_id" VARCHAR(255) NULL;
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "users" ADD COLUMN "picture" TEXT NULL;
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "users" ADD COLUMN "is_admin" BOOLEAN NOT NULL DEFAULT false;
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
      EXCEPTION
        WHEN undefined_column THEN NULL;
        WHEN invalid_table_definition THEN NULL;
        WHEN OTHERS THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "trial_ends_at" = NOW() + INTERVAL '7 days'
      WHERE "plan"::text = 'free' AND "trial_ends_at" IS NULL;
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    /* Intentionally empty — repair migration; manual rollback if ever needed. */
  }
}
