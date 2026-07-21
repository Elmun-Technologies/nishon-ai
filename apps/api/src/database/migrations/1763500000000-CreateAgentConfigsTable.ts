import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

/**
 * The autonomous AI agent's plan (link + goal + budget + stop-loss + computed
 * funnel allocation) used to live only in the browser. This table persists it
 * server-side — one row per workspace — so the optimization loop enforces the
 * budget and stop-loss the user actually approved.
 *
 * Idempotent: guarded by hasTable so re-runs on an existing DB are no-ops.
 * `goal` is stored as varchar (not a PG enum) so new goals never need ALTER TYPE.
 */
export class CreateAgentConfigsTable1763500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("agent_configs");
    if (exists) return;

    await queryRunner.createTable(
      new Table({
        name: "agent_configs",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          { name: "workspace_id", type: "uuid" },
          { name: "link", type: "text", isNullable: true },
          { name: "goal", type: "varchar", length: "20", default: "'sales'" },
          { name: "budget", type: "integer", default: 0 },
          { name: "stop_loss_usd", type: "integer", default: 30 },
          { name: "allocation", type: "jsonb", isNullable: true },
          { name: "activated_at", type: "timestamp", isNullable: true },
          { name: "created_at", type: "timestamp", default: "now()" },
          { name: "updated_at", type: "timestamp", default: "now()" },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      "agent_configs",
      new TableIndex({
        name: "idx_agent_config_workspace",
        columnNames: ["workspace_id"],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("agent_configs");
    if (!exists) return;
    await queryRunner.dropIndex("agent_configs", "idx_agent_config_workspace");
    await queryRunner.dropTable("agent_configs");
  }
}
