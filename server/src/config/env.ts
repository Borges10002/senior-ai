import { validateProductionSecurity } from "./security";
import { config } from "dotenv";
import { existsSync } from "fs";

// Sem APP_ENV e sem .env (ex.: `npm run dev`), usa o .env.local em desenvolvimento.
// Em produção (Render) as variáveis vêm da plataforma, então nada muda lá.
const usarLocalPorPadrao =
  !process.env.APP_ENV &&
  process.env.NODE_ENV !== "production" &&
  !existsSync(".env") &&
  existsSync(".env.local");

const mode = process.env.APP_ENV || (usarLocalPorPadrao ? "local" : undefined);
if (mode && !["local", "online"].includes(mode)) {
  throw new Error("APP_ENV deve ser local ou online.");
}
const envFile = mode ? `.env.${mode}` : ".env";
if (mode && !existsSync(envFile)) {
  throw new Error(`Crie ${envFile} a partir de ${envFile}.example antes de iniciar.`);
}
config({ path: envFile, override: Boolean(mode) });

// Um DATABASE_URL herdado nunca deve direcionar o modo local ao banco publicado.
if (mode === "local") process.env.DATABASE_URL = "";

// Sem segredo o login quebra com erro 500; melhor falhar já na subida.
if (!process.env.JWT_SECRET) {
  throw new Error(
    `JWT_SECRET não definido. Configure-o em ${envFile} ou nas variáveis de ambiente.`,
  );
}

validateProductionSecurity(process.env);
