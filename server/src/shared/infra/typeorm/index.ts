import "@/config/env";
import path from "path";
import { DataSource } from "typeorm";

// Em produção roda o JavaScript compilado (dist); em desenvolvimento, o TypeScript.
const extensao = __dirname.includes(`${path.sep}dist${path.sep}`) ? "js" : "ts";

const conexao = process.env.DATABASE_URL
  ? { url: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || "senior_ai",
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || "senior_ai",
    };

const AppDataSource = new DataSource({
  type: "postgres",
  ...conexao,
  // Estrutura controlada por migrations; synchronize só por opção explícita e nunca em produção.
  synchronize: process.env.DB_SYNCHRONIZE === "true",
  migrationsRun: process.env.DB_MIGRATIONS_RUN !== "false",
  migrations: [path.join(__dirname, `migrations/*.${extensao}`)],
  migrationsTableName: "migrations",
  entities: [path.join(__dirname, `../../../modules/**/entities/*.${extensao}`)],
  logging: false,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : false,
});

export { AppDataSource };
