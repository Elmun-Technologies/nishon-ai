import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from "typeorm";

/**
 * Base `agent_profiles` table (marketplace extensions are added in 1712281201000).
 * Historically this table only existed when TYPEORM_SYNCHRONIZE created it; production
 * with synchronize=false never got the table until this migration.
 */
export class CreateAgentProfiles1712281190000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable("agent_profiles")) {
      return;
    }

    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.createTable(
      new Table({
        name: "agent_profiles",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          { name: "slug", type: "varchar", length: "100", isUnique: true },
          { name: "agent_type", type: "varchar", length: "10", default: "'human'" },
          { name: "owner_id", type: "uuid", isNullable: true },
          { name: "display_name", type: "varchar", length: "100" },
          { name: "title", type: "varchar", length: "150" },
          { name: "bio", type: "text", isNullable: true },
          { name: "avatar", type: "varchar", length: "255", isNullable: true },
          { name: "avatar_color", type: "varchar", length: "100", isNullable: true },
          { name: "location", type: "varchar", length: "100", isNullable: true },
          { name: "response_time", type: "varchar", length: "50", isNullable: true },
          {
            name: "monthly_rate",
            type: "decimal",
            precision: 10,
            scale: 2,
            default: "0",
          },
          {
            name: "commission_rate",
            type: "decimal",
            precision: 5,
            scale: 2,
            default: "0",
          },
          { name: "pricing_model", type: "varchar", length: "20", default: "'fixed'" },
          { name: "currency", type: "varchar", length: "10", default: "'USD'" },
          {
            name: "platform_commission_pct",
            type: "decimal",
            precision: 5,
            scale: 2,
            default: "15",
          },
          { name: "is_verified", type: "boolean", default: false },
          { name: "is_published", type: "boolean", default: false },
          { name: "is_pro_member", type: "boolean", default: false },
          { name: "is_featured", type: "boolean", default: false },
          {
            name: "niches",
            type: "text",
            isArray: true,
            default: "'{}'",
          },
          {
            name: "platforms",
            type: "text",
            isArray: true,
            default: "'{}'",
          },
          { name: "ai_config", type: "jsonb", isNullable: true },
          {
            name: "cached_rating",
            type: "decimal",
            precision: 3,
            scale: 2,
            default: "0",
          },
          { name: "cached_review_count", type: "integer", default: 0 },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      "agent_profiles",
      new TableIndex({
        name: "IDX_agent_profiles_owner_id",
        columnNames: ["owner_id"],
      }),
    );

    if (await queryRunner.hasTable("users")) {
      await queryRunner.createForeignKey(
        "agent_profiles",
        new TableForeignKey({
          name: "FK_agent_profiles_owner_id_users",
          columnNames: ["owner_id"],
          referencedTableName: "users",
          referencedColumnNames: ["id"],
          onDelete: "SET NULL",
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("agent_profiles");
    if (!table) return;

    const ownerFk = table.foreignKeys.find((fk) => fk.name === "FK_agent_profiles_owner_id_users");
    if (ownerFk) {
      await queryRunner.dropForeignKey("agent_profiles", ownerFk);
    }

    await queryRunner.dropIndex("agent_profiles", "IDX_agent_profiles_owner_id");
    await queryRunner.dropTable("agent_profiles");
  }
}
