import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

/**
 * meta_campaign_syncs is a lightweight mirror of Meta campaigns used by the
 * sync/reporting pipeline. The entity had no migration, so a synchronize=false
 * deploy left the table missing and Meta sync / dashboard queries crashed.
 *
 * The primary key is Meta's numeric campaign ID stored as string (varchar),
 * mirroring the entity's @PrimaryColumn — no uuid default or generation.
 * The `tags` simple-array is stored as text (TypeORM serialises it CSV-style).
 */
export class CreateMetaCampaignSyncsTable1763370000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("meta_campaign_syncs");
    if (exists) return;

    await queryRunner.createTable(
      new Table({
        name: "meta_campaign_syncs",
        columns: [
          { name: "id", type: "varchar", length: "50", isPrimary: true },
          { name: "name", type: "varchar", length: "255" },
          { name: "status", type: "varchar", length: "50" },
          {
            name: "objective",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          { name: "createdAt", type: "timestamp", default: "now()" },
          { name: "updatedAt", type: "timestamp", default: "now()" },
          { name: "workspace_id", type: "uuid" },
          { name: "ad_account_id", type: "varchar", length: "50" },
          { name: "tags", type: "text", isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      "meta_campaign_syncs",
      new TableIndex({
        name: "IDX_meta_campaign_syncs_workspace",
        columnNames: ["workspace_id"],
      }),
    );
    await queryRunner.createIndex(
      "meta_campaign_syncs",
      new TableIndex({
        name: "IDX_meta_campaign_syncs_ws_account",
        columnNames: ["workspace_id", "ad_account_id"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("meta_campaign_syncs");
    if (!exists) return;
    await queryRunner.dropIndex(
      "meta_campaign_syncs",
      "IDX_meta_campaign_syncs_ws_account",
    );
    await queryRunner.dropIndex(
      "meta_campaign_syncs",
      "IDX_meta_campaign_syncs_workspace",
    );
    await queryRunner.dropTable("meta_campaign_syncs");
  }
}
