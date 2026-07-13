import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Hot-path indexes for token resolution, the Meta sync cron and dashboard reads:
 *  - connected_accounts(workspace_id, platform, "isActive") — every token
 *    resolve / launch filters by all three (meta-sync.service, launch-orchestrator).
 *  - connected_accounts(platform, "isActive") — the 10-minute sync cron scans
 *    every active account for a platform (meta-cron.service).
 *  - meta_ad_accounts(workspace_id) — dashboard, reporting, audiences and audit
 *    all filter ad accounts by workspace; the table had no index on it.
 *
 * `"isActive"` is a camelCase column (TypeORM default naming), so it must stay
 * double-quoted in the DDL. Each index is created only when its table exists
 * (some tables are synchronize-created on older environments) and with
 * IF NOT EXISTS, so the migration is a safe, idempotent no-op wherever the
 * index or table is already present.
 */
export class AddConnectedAndAdAccountIndexes1763500000000
  implements MigrationInterface
{
  private readonly indexes: Array<{ table: string; name: string; cols: string }> = [
    {
      table: "connected_accounts",
      name: "IDX_connected_accounts_ws_platform_active",
      cols: 'workspace_id, platform, "isActive"',
    },
    {
      table: "connected_accounts",
      name: "IDX_connected_accounts_platform_active",
      cols: 'platform, "isActive"',
    },
    {
      table: "meta_ad_accounts",
      name: "IDX_meta_ad_accounts_workspace_id",
      cols: "workspace_id",
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const idx of this.indexes) {
      if (!(await queryRunner.hasTable(idx.table))) continue;
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "${idx.name}" ON "${idx.table}" (${idx.cols})`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const idx of this.indexes) {
      await queryRunner.query(`DROP INDEX IF EXISTS "${idx.name}"`);
    }
  }
}
