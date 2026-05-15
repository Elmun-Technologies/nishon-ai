import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

/**
 * Ad Launcher (launch-orchestrator) persists every launch attempt as a row.
 * Without this migration, production deploys with synchronize=false would
 * crash on the very first /launch-orchestrator/draft request.
 */
export class CreateLaunchJobsTable1763000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("launch_jobs");
    if (exists) return;

    await queryRunner.createTable(
      new Table({
        name: "launch_jobs",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          { name: "workspace_id", type: "uuid" },
          {
            name: "status",
            type: "varchar",
            length: "20",
            default: "'draft'",
          },
          { name: "payload", type: "jsonb" },
          { name: "error", type: "text", isNullable: true },
          { name: "launchedAt", type: "timestamp", isNullable: true },
          {
            name: "createdAt",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updatedAt",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      "launch_jobs",
      new TableIndex({
        name: "IDX_launch_jobs_workspace_id",
        columnNames: ["workspace_id"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("launch_jobs");
    if (!exists) return;
    await queryRunner.dropIndex("launch_jobs", "IDX_launch_jobs_workspace_id");
    await queryRunner.dropTable("launch_jobs");
  }
}
