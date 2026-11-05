/**
 * DataSource da CLI do TypeORM.
 *
 *   npm run migration:generate -- src/shared/infra/typeorm/migrations/NomeDaMudanca
 *   npm run migration:run
 *   npm run migration:revert
 */
import "@/config/env";

process.env.DB_SYNCHRONIZE = "false";
process.env.DB_MIGRATIONS_RUN = "false";

// require depois de ajustar o ambiente: o DataSource lê as variáveis ao carregar.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AppDataSource } = require("./index");

export default AppDataSource;
