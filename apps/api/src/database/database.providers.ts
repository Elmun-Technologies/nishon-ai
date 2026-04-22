import * as path from "path";
import { DataSource } from "typeorm";

const databaseUrl = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === "production";

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
  migrations: [path.join(__dirname, "migrations", "*.js")],
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === "true" || !isProduction,
});
