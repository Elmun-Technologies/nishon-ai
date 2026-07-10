import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

/**
 * meta_ad_accounts mirrors the Meta Ads ad accounts (act_xxx) synced from the
 * Graph API. The entity existed but had no migration, so a synchronize=false
 * deploy left the table missing and the Meta sync / dashboard pages crashed.
 *
 * The primary key is Meta's own act_xxx string (varchar), so no uuid default or
 * generation strategy — it mirrors the entity's @PrimaryColumn.
 */
export class CreateMetaAdAccountsTable1763310000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("meta_ad_accounts");
    if (exists) return;

    await queryRunner.createTable(
      new Table({
        name: "meta_ad_accounts",
        columns: [
          { name: "id", type: "varchar", length: "50", isPrimary: true },
          { name: "name", type: "varchar", length: "255" },
          { name: "currency", type: "varchar", length: "10", isNullable: true },
          { name: "timezone", type: "varchar", length: "100", isNullable: true },
          { name: "accountStatus", type: "int", default: 1 },
          { name: "isActive", type: "boolean", default: true },
          { name: "createdAt", type: "timestamp", default: "now()" },
          { name: "updatedAt", type: "timestamp", default: "now()" },
          { name: "workspace_id", type: "uuid" },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      "meta_ad_accounts",
      new TableIndex({
        name: "IDX_meta_ad_accounts_workspace",
        columnNames: ["workspace_id"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("meta_ad_accounts");
    if (!exists) return;
    await queryRunner.dropIndex(
      "meta_ad_accounts",
      "IDX_meta_ad_accounts_workspace",
    );
    await queryRunner.dropTable("meta_ad_accounts");
  }
}
