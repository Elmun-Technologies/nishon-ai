import * as path from "path";
import { DataSource } from "typeorm";

import { CreateUsersTable1712000000001 } from "./migrations/1712000000001-CreateUsersTable";
import { AlterLegacyUsersOAuthColumns1712000000002 } from "./migrations/1712000000002-AlterLegacyUsersOAuthColumns";
import { CreateAudienceSegments1712000001000 } from "./migrations/1712000001000-CreateAudienceSegments";
import { CreateSegmentMembers1712000002000 } from "./migrations/1712000002000-CreateSegmentMembers";
import { CreateAudienceSync1712000003000 } from "./migrations/1712000003000-CreateAudienceSync";
import { CreateCommissionEntities1712000004000 } from "./migrations/1712000004000-CreateCommissionEntities";
import { CreateSpecialistProfiles1712000005000 } from "./migrations/1712000005000-CreateSpecialistProfiles";
import { CreateCreativesTables1712000006000 } from "./migrations/1712000006000-CreateCreativesTables";
import { CreateAgentProfiles1712281190000 } from "./migrations/1712281190000-CreateAgentProfiles";
import { AddMarketplaceSchema1712281200000 } from "./migrations/1712281200000-AddMarketplaceSchema";
import { AddMarketplaceColumnsToExisting1712281201000 } from "./migrations/1712281201000-AddMarketplaceColumnsToExisting";
import { AddFraudDetectionAudit1712350000000 } from "./migrations/1712350000000-AddFraudDetectionAudit";
import { AddUserTrialEndsAt1745070000000 } from "./migrations/1745070000000-AddUserTrialEndsAt";
import { EnsureUsersTrialEndsAtColumn1750000000000 } from "./migrations/1750000000000-EnsureUsersTrialEndsAtColumn";
import { IdempotentUsersSchemaRepairSql1750000000002 } from "./migrations/1750000000002-IdempotentUsersSchemaRepairSql";

const databaseUrl = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === "production";

/**
 * CLI DataSource for `typeorm migration:run`. Migrations are listed explicitly so
 * production never relies on `*.js` glob expansion (can be empty on some hosts).
 */
export default new DataSource({
  type: "postgres",
  ...(databaseUrl
    ? { url: databaseUrl }
    : {
        host: process.env.DATABASE_HOST ?? "postgres",
        port: Number(process.env.DATABASE_PORT ?? "5432"),
        username: process.env.DATABASE_USERNAME ?? "performa",
        password: process.env.DATABASE_PASSWORD ?? "performa_secret",
        database: process.env.DATABASE_NAME ?? "performa_ai_db",
      }),
  ssl: isProduction || Boolean(databaseUrl) ? { rejectUnauthorized: false } : false,
  entities: [path.join(__dirname, "..", "**", "*.entity.js")],
  migrations: [
    CreateUsersTable1712000000001,
    AlterLegacyUsersOAuthColumns1712000000002,
    CreateAudienceSegments1712000001000,
    CreateSegmentMembers1712000002000,
    CreateAudienceSync1712000003000,
    CreateCommissionEntities1712000004000,
    CreateSpecialistProfiles1712000005000,
    CreateCreativesTables1712000006000,
    CreateAgentProfiles1712281190000,
    AddMarketplaceSchema1712281200000,
    AddMarketplaceColumnsToExisting1712281201000,
    AddFraudDetectionAudit1712350000000,
    AddUserTrialEndsAt1745070000000,
    EnsureUsersTrialEndsAtColumn1750000000000,
    IdempotentUsersSchemaRepairSql1750000000002,
  ],
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === "true" || !isProduction,
});
