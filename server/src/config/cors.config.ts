import "@/config/env";
import type { CorsOptions } from "cors";

// Fronts autorizados, separados por vírgula em CORS_ORIGINS.
const origens = String(process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

if (!origens.length) {
  console.warn("[Senior AI] CORS_ORIGINS não definido: chamadas de navegadores estão bloqueadas.");
}

const corsOptions: CorsOptions = {
  credentials: false,
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
  origin: !origens.length
    ? false
    : (origin, callback) => {
        // Sem Origin: app mobile nativo, curl e chamadas servidor-servidor.
        callback(null, !origin || origens.includes(origin));
      },
};

export default { corsOptions, origens };
