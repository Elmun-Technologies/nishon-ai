import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

/**
 * ad_sets sit between a Campaign and individual Ads (targeting + bidding). The
 * entity had no migration, so a synchronize=false deploy left the table missing
 * and the decision-loop / campaign detail queries crashed.
 *
 * The status enum is stored as varchar (see CreateWorkspacesTable note).
 */
export class CreateAdSetsTable1763330000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("ad_sets");
    if (exists) return;

    await queryRunner.createTable(
      new Table({
        name: "ad_sets",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          { name: "name", type: "varchar", length: "255" },
          { name: "targeting", type: "jsonb" },
          {
            name: "bidAmount",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: "bidStrategy",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          { name: "status", type: "varchar", length: "20", default: "'draft'" },
          {
            name: "externalId",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          { name: "createdAt", type: "timestamp", default: "now()" },
          { name: "updatedAt", type: "timestamp", default: "now()" },
          { name: "campaign_id", type: "uuid" },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      "ad_sets",
      new TableIndex({
        name: "IDX_ad_sets_campaign_id",
        columnNames: ["campaign_id"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("ad_sets");
    if (!exists) return;
    await queryRunner.dropIndex("ad_sets", "IDX_ad_sets_campaign_id");
    await queryRunner.dropTable("ad_sets");
  }
}
