import { Router } from "express";
import { authRoutes } from "@modules/auth/infra/http/routes/auth.routes";
import { reunioesRoutes } from "@modules/reunioes/infra/http/routes/reunioes.routes";
import { healthRoutes } from "./health.routes";

/** Todas as rotas ficam sob /api/v1 (montado em app.ts). */
const routes = Router();

routes.use(healthRoutes);
routes.use(authRoutes);
routes.use(reunioesRoutes);

export { routes };
