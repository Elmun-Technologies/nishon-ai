import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

/**
 * workspace_members backs every workspace access check — including
 * LaunchOrchestratorService.assertWorkspaceAccess, which the Ad Launcher calls
 * on draft/validate/launch. Without this table, a synchronize=false deploy
 * would fail authorization on the first launch. The entity had no migration
 * until now.
 */
export class CreateWorkspaceMembersTable1763200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("workspace_members");
    if (exists) return;

    await queryRunner.createTable(
      new Table({
        name: "workspace_members",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          { name: "workspace_id", type: "uuid" },
          { name: "user_id", type: "uuid" },
          {
            name: "role",
            type: "varchar",
            length: "20",
            default: "'advertiser'",
          },
          {
            name: "allowedAdAccountIds",
            type: "jsonb",
            default: "'[]'::jsonb",
          },
          { name: "createdAt", type: "timestamp", default: "now()" },
          { name: "updatedAt", type: "timestamp", default: "now()" },
        ],
        uniques: [
          {
            name: "UQ_workspace_members_workspace_user",
            columnNames: ["workspace_id", "user_id"],
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      "workspace_members",
      new TableIndex({
        name: "IDX_workspace_members_workspace_id",
        columnNames: ["workspace_id"],
      }),
    );
    await queryRunner.createIndex(
      "workspace_members",
      new TableIndex({
        name: "IDX_workspace_members_user_id",
        columnNames: ["user_id"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("workspace_members");
    if (!exists) return;
    await queryRunner.dropIndex(
      "workspace_members",
      "IDX_workspace_members_user_id",
    );
    await queryRunner.dropIndex(
      "workspace_members",
      "IDX_workspace_members_workspace_id",
    );
    await queryRunner.dropTable("workspace_members");
  }
}
