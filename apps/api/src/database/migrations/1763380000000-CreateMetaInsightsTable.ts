import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

/**
 * meta_insights stores the daily performance snapshot per Meta campaign. The
 * entity had no migration, so a synchronize=false deploy left the table missing
 * and the reporting / dashboard queries crashed.
 *
 * The primary key is a deterministic `${campaignId}_${date}` string (varchar),
 * mirroring the entity's @PrimaryColumn — no uuid default or generation.
 * Note: this entity has only a CreateDateColumn (no updatedAt).
 */
export class CreateMetaInsightsTable1763380000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("meta_insights");
    if (exists) return;

    await queryRunner.createTable(
      new Table({
        name: "meta_insights",
        columns: [
          { name: "id", type: "varchar", length: "100", isPrimary: true },
          {
            name: "spend",
            type: "decimal",
            precision: 12,
            scale: 2,
            default: 0,
          },
          { name: "impressions", type: "bigint", default: 0 },
          { name: "clicks", type: "integer", default: 0 },
          {
            name: "ctr",
            type: "decimal",
            precision: 8,
            scale: 4,
            default: 0,
          },
          {
            name: "cpc",
            type: "decimal",
            precision: 10,
            scale: 4,
            default: 0,
          },
          { name: "conversions", type: "integer", default: 0 },
          {
            name: "conversionValue",
            type: "decimal",
            precision: 12,
            scale: 2,
            default: 0,
          },
          { name: "date", type: "date" },
          { name: "pagingCursor", type: "text", isNullable: true },
          { name: "createdAt", type: "timestamp", default: "now()" },
          { name: "workspace_id", type: "uuid" },
          { name: "campaign_id", type: "varchar", length: "50" },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      "meta_insights",
      new TableIndex({
        name: "IDX_meta_insights_workspace",
        columnNames: ["workspace_id"],
      }),
    );
    await queryRunner.createIndex(
      "meta_insights",
      new TableIndex({
        name: "IDX_meta_insights_campaign_workspace",
        columnNames: ["campaign_id", "workspace_id"],
      }),
    );
    await queryRunner.createIndex(
      "meta_insights",
      new TableIndex({
        name: "IDX_meta_insights_workspace_date",
        columnNames: ["workspace_id", "date"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("meta_insights");
    if (!exists) return;
    await queryRunner.dropIndex(
      "meta_insights",
      "IDX_meta_insights_workspace_date",
    );
    await queryRunner.dropIndex(
      "meta_insights",
      "IDX_meta_insights_campaign_workspace",
    );
    await queryRunner.dropIndex(
      "meta_insights",
      "IDX_meta_insights_workspace",
    );
    await queryRunner.dropTable("meta_insights");
  }
}
