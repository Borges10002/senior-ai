import "@/config/env";
import path, { join } from "path";
import { DataSource } from "typeorm";

// Em produção roda o JavaScript compilado (dist); em desenvolvimento, o TypeScript.
const extensao = path.join(__dirname).includes("dist") ? "js" : "ts";
const entitiesPath = join(__dirname, `../../../modules/**/entities/*.${extensao}`);
const migrationsPath = join(__dirname, `migrations/*.${extensao}`);

const parseConnectionString = (url: string) => {
  const regex = /postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:\/]+)(?::(\d+))?\/([^?]+)/;
  const match = url.match(regex);
  if (!match) throw new Error("Invalid DATABASE_URL");
  return {
    username: decodeURIComponent(match[1]!),
    password: decodeURIComponent(match[2]!),
    host: match[3],
    port: parseInt(match[4] || "5432"),
    database: match[5],
  };
};

const dbConfig = process.env.DATABASE_URL
  ? parseConnectionString(process.env.DATABASE_URL)
  : {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || "senior_ai",
      password: process.env.DB_PASS,
      database: process.env.DB_NAME || "senior_ai",
    };

const TipecDataSource = new DataSource({
  name: "Senior AI",
  type: "postgres",
  ...dbConfig,
  // A estrutura do banco é controlada por migrations (src/shared/infra/typeorm/migrations).
  // synchronize só por opção explícita (DB_SYNCHRONIZE=true), nunca em produção.
  synchronize: process.env.DB_SYNCHRONIZE === "true",
  // Migrations pendentes são aplicadas ao iniciar a API. Scripts de manutenção desligam.
  migrationsRun: process.env.DB_MIGRATIONS_RUN !== "false",
  migrations: [migrationsPath],
  migrationsTableName: "migrations",
  logging: false,
  entities: [entitiesPath],
  ssl: process.env.DATABASE_URL ? {
    rejectUnauthorized: true,
    ...(process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, "\n") } : {}),
  } : false,
});

export { TipecDataSource };
