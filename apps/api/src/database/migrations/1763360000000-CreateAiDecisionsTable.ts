import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

/**
 * ai_decisions is the AI explainability log powering the /ai-agents page. The
 * entity had no migration, so a synchronize=false deploy left the table missing
 * and the AI Agents / decision listing queries crashed.
 *
 * The actionType enum is stored as varchar (see CreateWorkspacesTable note).
 * Note: this entity has only a CreateDateColumn (no updatedAt).
 */
export class CreateAiDecisionsTable1763360000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("ai_decisions");
    if (exists) return;

    await queryRunner.createTable(
      new Table({
        name: "ai_decisions",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "actionType",
            type: "varchar",
            length: "20",
            isNullable: true,
          },
          { name: "reason", type: "text" },
          { name: "beforeState", type: "jsonb", isNullable: true },
          { name: "afterState", type: "jsonb", isNullable: true },
          { name: "estimatedImpact", type: "text", isNullable: true },
          { name: "isApproved", type: "boolean", isNullable: true },
          { name: "isExecuted", type: "boolean", default: false },
          { name: "createdAt", type: "timestamp", default: "now()" },
          { name: "workspace_id", type: "uuid", isNullable: true },
          { name: "campaign_id", type: "uuid", isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      "ai_decisions",
      new TableIndex({
        name: "IDX_ai_decisions_workspace_id",
        columnNames: ["workspace_id"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("ai_decisions");
    if (!exists) return;
    await queryRunner.dropIndex(
      "ai_decisions",
      "IDX_ai_decisions_workspace_id",
    );
    await queryRunner.dropTable("ai_decisions");
  }
}
