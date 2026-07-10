import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

/**
 * The agentic decision loop targets real Meta campaigns (which live in
 * meta_campaign_syncs, keyed by the Meta campaign id — not the local campaigns
 * table). It also now persists a real confidence + projected $ impact per
 * decision so the UI shows true numbers instead of hardcoded stubs. Add the
 * four columns; guarded + IF NOT EXISTS so it's a safe no-op where present.
 */
export class AddAiDecisionTargetColumns1763500000000
  implements MigrationInterface
{
  private readonly cols: TableColumn[] = [
    new TableColumn({
      name: "target_external_id",
      type: "varchar",
      isNullable: true,
    }),
    new TableColumn({
      name: "target_platform",
      type: "varchar",
      length: "20",
      isNullable: true,
    }),
    new TableColumn({
      name: "confidence",
      type: "decimal",
      precision: 4,
      scale: 3,
      isNullable: true,
    }),
    new TableColumn({
      name: "impact_usd",
      type: "decimal",
      precision: 12,
      scale: 2,
      isNullable: true,
    }),
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("ai_decisions"))) return;
    for (const col of this.cols) {
      if (!(await queryRunner.hasColumn("ai_decisions", col.name))) {
        await queryRunner.addColumn("ai_decisions", col);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("ai_decisions"))) return;
    for (const col of this.cols) {
      if (await queryRunner.hasColumn("ai_decisions", col.name)) {
        await queryRunner.dropColumn("ai_decisions", col.name);
      }
    }
  }
}
