import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

/**
 * connected_accounts stores the encrypted Meta (and other platform) OAuth
 * tokens created by the "Connect Meta" step and read by the Ad Launcher on
 * every launch. The entity had no migration, so a synchronize=false deploy
 * crashed the moment a user connected Meta or attempted a launch.
 *
 * The `platform` enum is stored as varchar (see CreateWorkspacesTable note):
 * identical behaviour at runtime, no ALTER TYPE needed for new platforms.
 */
export class CreateConnectedAccountsTable1763300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("connected_accounts");
    if (exists) return;

    await queryRunner.createTable(
      new Table({
        name: "connected_accounts",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          { name: "platform", type: "varchar", length: "20" },
          { name: "accessToken", type: "text" },
          { name: "refreshToken", type: "text", isNullable: true },
          { name: "externalAccountId", type: "varchar", length: "255" },
          { name: "externalAccountName", type: "varchar", length: "255" },
          { name: "isActive", type: "boolean", default: true },
          { name: "tokenExpiresAt", type: "timestamp", isNullable: true },
          {
            name: "tracking_started_at",
            type: "timestamp",
            isNullable: true,
          },
          { name: "createdAt", type: "timestamp", default: "now()" },
          { name: "updatedAt", type: "timestamp", default: "now()" },
          { name: "workspace_id", type: "uuid" },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      "connected_accounts",
      new TableIndex({
        name: "IDX_connected_accounts_workspace_id",
        columnNames: ["workspace_id"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("connected_accounts");
    if (!exists) return;
    await queryRunner.dropIndex(
      "connected_accounts",
      "IDX_connected_accounts_workspace_id",
    );
    await queryRunner.dropTable("connected_accounts");
  }
}
