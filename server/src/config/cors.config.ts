import "@/config/env";
import type { CorsOptions } from "cors";

// Fronts que podem chamar a API, separados por vírgula em CORS_ORIGINS
// (ex.: http://localhost:9000,https://senior-ai.vercel.app).
const origens = String(process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

if (!origens.length) {
  console.warn(
    "[Senior AI] CORS_ORIGINS não definido: chamadas de navegadores estao bloqueadas. " +
      "Defina as URLs dos fronts para restringir.",
  );
}

const corsOptions: CorsOptions = {
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Auth-Mode"],
  optionsSuccessStatus: 200,
  origin: !origens.length
    ? false
    : (origin, callback) => {
        // Sem Origin: app mobile nativo, curl e chamadas servidor-servidor.
        if (!origin || origens.includes(origin)) return callback(null, true);
        return callback(null, false);
      },
};

export default { corsOptions, origens };
