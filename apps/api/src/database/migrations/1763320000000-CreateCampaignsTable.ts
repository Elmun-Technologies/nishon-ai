import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

/**
 * campaigns is the top-level advertising unit surfaced on the /campaigns,
 * /budget and /ai-agents pages. The entity had no migration, so a
 * synchronize=false deploy left the table missing and those pages 500'd.
 *
 * Enum-typed columns (platform, status, objective, budgetType, currency) are
 * stored as varchar (see CreateWorkspacesTable note): identical behaviour at
 * runtime, no ALTER TYPE needed for new enum values.
 */
export class CreateCampaignsTable1763320000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("campaigns");
    if (exists) return;

    await queryRunner.createTable(
      new Table({
        name: "campaigns",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          { name: "name", type: "varchar", length: "255" },
          { name: "platform", type: "varchar", length: "20", isNullable: true },
          { name: "status", type: "varchar", length: "20", default: "'draft'" },
          {
            name: "objective",
            type: "varchar",
            length: "20",
            isNullable: true,
          },
          {
            name: "dailyBudget",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: "totalBudget",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: "budget",
            type: "decimal",
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: "budgetType",
            type: "varchar",
            length: "20",
            default: "'daily'",
          },
          {
            name: "currency",
            type: "varchar",
            length: "20",
            default: "'USD'",
          },
          { name: "schedule", type: "jsonb", isNullable: true },
          {
            name: "externalId",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          { name: "aiConfig", type: "jsonb", isNullable: true },
          { name: "startDate", type: "date", isNullable: true },
          { name: "endDate", type: "date", isNullable: true },
          { name: "createdAt", type: "timestamp", default: "now()" },
          { name: "updatedAt", type: "timestamp", default: "now()" },
          { name: "workspace_id", type: "uuid", isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      "campaigns",
      new TableIndex({
        name: "idx_campaign_workspace",
        columnNames: ["workspace_id"],
      }),
    );
    await queryRunner.createIndex(
      "campaigns",
      new TableIndex({
        name: "idx_campaign_workspace_status",
        columnNames: ["workspace_id", "status"],
      }),
    );
    await queryRunner.createIndex(
      "campaigns",
      new TableIndex({
        name: "idx_campaign_workspace_platform",
        columnNames: ["workspace_id", "platform"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("campaigns");
    if (!exists) return;
    await queryRunner.dropIndex("campaigns", "idx_campaign_workspace_platform");
    await queryRunner.dropIndex("campaigns", "idx_campaign_workspace_status");
    await queryRunner.dropIndex("campaigns", "idx_campaign_workspace");
    await queryRunner.dropTable("campaigns");
  }
}
