import { config } from "dotenv";
import { existsSync } from "fs";
import { validateProductionSecurity } from "./security";

// Fora do Docker e da produção, usa .env.local quando existir; senão, .env.
// No Docker as variáveis chegam pelo env_file do docker-compose.
const arquivo =
  process.env.NODE_ENV !== "production" && existsSync(".env.local") ? ".env.local" : ".env";
config({ path: arquivo, quiet: true });

if (!process.env.JWT_SECRET) {
  throw new Error(`JWT_SECRET não definido. Configure-o em ${arquivo} ou nas variáveis de ambiente.`);
}

validateProductionSecurity(process.env);
