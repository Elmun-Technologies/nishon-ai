import { MigrationInterface, QueryRunner, Table } from "typeorm";

/**
 * ads are the creative units (text, image/video, CTA) shown to users. The
 * entity had no migration, so a synchronize=false deploy left the table missing
 * and the campaign detail / creative queries crashed.
 *
 * The creativeType and status enums are stored as varchar (see
 * CreateWorkspacesTable note).
 */
export class CreateAdsTable1763340000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("ads");
    if (exists) return;

    await queryRunner.createTable(
      new Table({
        name: "ads",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          { name: "name", type: "varchar", length: "255" },
          { name: "headlineText", type: "varchar", length: "255" },
          { name: "bodyText", type: "text" },
          { name: "callToAction", type: "varchar", length: "100" },
          { name: "creativeUrl", type: "text", isNullable: true },
          {
            name: "creativeType",
            type: "varchar",
            length: "20",
            default: "'image'",
          },
          { name: "status", type: "varchar", length: "20", default: "'draft'" },
          {
            name: "aiScore",
            type: "decimal",
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: "externalId",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          { name: "createdAt", type: "timestamp", default: "now()" },
          { name: "updatedAt", type: "timestamp", default: "now()" },
          { name: "ad_set_id", type: "uuid" },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("ads");
    if (!exists) return;
    await queryRunner.dropTable("ads");
  }
}
