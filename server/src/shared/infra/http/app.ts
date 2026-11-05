import "reflect-metadata";
import "express-async-errors";
import "@/config/env";
import "@shared/container";

import cors from "cors";
import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import corsConfig from "@config/cors.config";
import ensureRateLimit from "@middlewares/ensureRateLimit";
import throwAppError from "@middlewares/throwAppError";
import { fecharFilas } from "@shared/infra/queue/filas";
import { AppDataSource } from "@shared/infra/typeorm";
import { routes } from "./routes";
import swaggerDocs from "./swagger/swaggerDocs";

export function criarApp(): express.Application {
  const app = express();
  // Atrás de proxy reverso / Cloudflare Tunnel: usa o IP real no limite de requisições.
  app.set("trust proxy", Number(process.env.TRUST_PROXY ?? 1));
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors(corsConfig.corsOptions));
  app.use(express.json({ limit: "100kb" }));
  app.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.use(ensureRateLimit());

  // Swagger só fora de produção: em produção ele entregaria o mapa de todas as rotas.
  if (process.env.NODE_ENV !== "production" || process.env.SWAGGER_PUBLICO === "true") {
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  }

  app.use("/api/v1", routes);
  app.use((_req, res) => {
    res.status(404).json({ message: "Rota não encontrada." });
  });
  app.use(throwAppError);
  return app;
}

export async function iniciarServidor(porta: number): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log("[Senior AI] Banco conectado e migrations aplicadas.");
  } catch (erro) {
    // Sem banco a API não funciona: encerra para o Docker reiniciar.
    console.error("[Senior AI] Falha ao conectar no banco:", erro);
    process.exit(1);
  }

  const servidor = criarApp().listen(porta, "0.0.0.0", () => {
    console.log(`[Senior AI] API em http://localhost:${porta}/api/v1`);
  });

  const encerrar = () => {
    servidor.close(async () => {
      await fecharFilas();
      await AppDataSource.destroy();
      process.exit(0);
    });
  };
  process.on("SIGTERM", encerrar);
  process.on("SIGINT", encerrar);
}
