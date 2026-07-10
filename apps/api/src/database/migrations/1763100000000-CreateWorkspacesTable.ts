import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

/**
 * A Workspace is the root of every MVP flow — auth creates a user, then the
 * user creates a workspace, connects Meta to it, and launches ads under it.
 * The entity existed but had no migration, so a production deploy with
 * synchronize=false crashed on the first "create workspace" request. This
 * migration creates the table so the documented MVP path works without the
 * (unsafe) TYPEORM_SYNCHRONIZE=true first-deploy workaround.
 *
 * Enum-typed columns (goal, autopilotMode) are stored as varchar: functionally
 * identical for insert/select under synchronize=false, and robust to new enum
 * values without an ALTER TYPE.
 */
export class CreateWorkspacesTable1763100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("workspaces");
    if (exists) return;

    await queryRunner.createTable(
      new Table({
        name: "workspaces",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          { name: "name", type: "varchar", length: "255" },
          { name: "industry", type: "varchar", length: "100" },
          { name: "productDescription", type: "text", isNullable: true },
          { name: "targetAudience", type: "text", isNullable: true },
          {
            name: "monthlyBudget",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          { name: "goal", type: "varchar", length: "20", default: "'leads'" },
          {
            name: "autopilotMode",
            type: "varchar",
            length: "20",
            default: "'manual'",
          },
          { name: "aiStrategy", type: "jsonb", isNullable: true },
          { name: "isOnboardingComplete", type: "boolean", default: false },
          { name: "optimizationPolicy", type: "jsonb", isNullable: true },
          {
            name: "targetLocation",
            type: "varchar",
            length: "100",
            default: "'Uzbekistan'",
          },
          { name: "telegramChatId", type: "varchar", length: "64", isNullable: true },
          {
            name: "service_type",
            type: "varchar",
            length: "20",
            default: "'self'",
          },
          { name: "assigned_agent_id", type: "varchar", isNullable: true },
          { name: "createdAt", type: "timestamp", default: "now()" },
          { name: "updatedAt", type: "timestamp", default: "now()" },
          { name: "user_id", type: "uuid", isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      "workspaces",
      new TableIndex({
        name: "idx_workspace_user",
        columnNames: ["user_id"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("workspaces");
    if (!exists) return;
    await queryRunner.dropIndex("workspaces", "idx_workspace_user");
    await queryRunner.dropTable("workspaces");
  }
}
