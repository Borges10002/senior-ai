import "reflect-metadata";
import "express-async-errors";
import "@shared/container";
import "@shared/infra/typeorm";

import { TipecDataSource } from "@/shared/infra/typeorm";

import express from "express";
import cors from "cors";
import { routes } from "@/shared/infra/http/routes";
import { healthRoutes } from "@/shared/infra/http/routes/health.routes";
import ensureAuthenticate from "@middleawares/ensureAuthenticated";
import ensurePlanoAtivo from "@middleawares/ensurePlanoAtivo";
import throwAppError from "@middleawares/throwAppError";

import corsConfig from "@config/cors.config";
import helmet from "helmet";

import swaggerUi from "swagger-ui-express";
import swaggerDocs from "@/shared/infra/http/swagger/swaggerDocs";
import ensureRateLimit from "@middleawares/ensureRateLimit";

class App {
  private readonly app: express.Application;

  constructor() {
    this.app = express();
    // Render fica atrás de um proxy: sem isso todos os acessos teriam o mesmo
    // IP e o limite de requisições valeria para todos os usuários juntos.
    this.app.set("trust proxy", 1);
    this.app.disable("x-powered-by");
    this.app.use(express.json({ limit: "100kb" }));
    this.app.use((_req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); });
    this.app.use(cors(corsConfig.corsOptions));
    this.app.use(ensureRateLimit());
    this.app.use(helmet());

    // Swagger: só fora de produção. Em produção ele entregaria o mapa de todas
    // as rotas (inclusive /admin); SWAGGER_PUBLICO=true libera de propósito.
    if (process.env.NODE_ENV !== "production" || process.env.SWAGGER_PUBLICO === "true") {
      this.app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs()));
    }

    // Público: usado pelo healthcheck do Docker e pelo monitoramento.
    this.app.use(healthRoutes);

    this.app.use(ensureAuthenticate);
    // Teste grátis vencido sem pagamento: conta só leitura.
    this.app.use(ensurePlanoAtivo);

    this.app.use(routes);
    this.app.use(throwAppError as any);
  }

  public async start(port: number): Promise<void> {
    try {
      await TipecDataSource.initialize().then(() => {
        console.log(
          `[Senior AI] - Conexão com banco ${TipecDataSource.name} realizada com sucesso.`,
        );
      });

      this.app.listen(port, "0.0.0.0", () => {
        console.log(`[Senior AI API] - Servidor rodando na porta ${port}`);
      });

    } catch (error) {
      // Sem banco a API não funciona: encerra para o Render/Docker reiniciar.
      console.error("[Senior AI DB Error] - ", error);
      process.exit(1);
    }
  }
}

export default App;
