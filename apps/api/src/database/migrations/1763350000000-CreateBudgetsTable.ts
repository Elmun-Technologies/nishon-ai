import { MigrationInterface, QueryRunner, Table } from "typeorm";

/**
 * budgets define how the total advertising budget is allocated across
 * platforms. The entity had no migration, so a synchronize=false deploy left
 * the table missing and the /budget page 500'd.
 *
 * The period enum is stored as varchar (see CreateWorkspacesTable note).
 */
export class CreateBudgetsTable1763350000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("budgets");
    if (exists) return;

    await queryRunner.createTable(
      new Table({
        name: "budgets",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "totalBudget",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          { name: "platformSplit", type: "jsonb", isNullable: true },
          {
            name: "period",
            type: "varchar",
            length: "20",
            default: "'monthly'",
          },
          { name: "autoRebalance", type: "boolean", default: true },
          { name: "createdAt", type: "timestamp", default: "now()" },
          { name: "updatedAt", type: "timestamp", default: "now()" },
          { name: "workspace_id", type: "uuid", isNullable: true },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("budgets");
    if (!exists) return;
    await queryRunner.dropTable("budgets");
  }
}
