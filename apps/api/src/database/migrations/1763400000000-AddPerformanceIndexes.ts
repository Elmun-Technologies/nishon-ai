import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Hot-path indexes for the dashboard/AI query load:
 *  - ad_sets(campaign_id)          — decision-loop joins ad sets by campaign
 *  - ai_decisions(workspace_id)    — listings filter decisions per workspace
 *  - meta_campaign_syncs(workspace_id, ad_account_id) — dashboard + reporting
 *    filter by both together.
 *
 * Each is created only when the table exists (some of these tables are
 * synchronize-created on older environments) and with IF NOT EXISTS, so the
 * migration is a safe no-op wherever the index or table is already present.
 */
export class AddPerformanceIndexes1763400000000 implements MigrationInterface {
  private readonly indexes: Array<{ table: string; name: string; cols: string }> = [
    { table: "ad_sets", name: "IDX_ad_sets_campaign_id", cols: "campaign_id" },
    {
      table: "ai_decisions",
      name: "IDX_ai_decisions_workspace_id",
      cols: "workspace_id",
    },
    {
      table: "meta_campaign_syncs",
      name: "IDX_meta_campaign_syncs_ws_account",
      cols: "workspace_id, ad_account_id",
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
