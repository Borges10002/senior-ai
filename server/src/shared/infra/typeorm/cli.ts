/**
 * DataSource usado pela CLI do TypeORM (gerar/rodar/reverter migrations).
 *
 *   npm run migration:generate -- NomeDaMudanca   (compara entidades x banco local)
 *   npm run migration:run                         (aplica as pendentes)
 *   npm run migration:revert                      (desfaz a última)
 *
 * CLI_DB_NAME aponta para outro banco local (ex.: um banco vazio para gerar a
 * migration inicial) sem mexer no .env.
 */
import "@/config/env";

process.env.DB_SYNCHRONIZE = "false";
process.env.DB_MIGRATIONS_RUN = "false";
if (process.env.CLI_DB_NAME) {
  process.env.DB_NAME = process.env.CLI_DB_NAME;
  process.env.DATABASE_URL = "";
}

// require depois de ajustar o ambiente: o DataSource lê as variáveis ao carregar.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { TipecDataSource } = require("./index");

export default TipecDataSource;
