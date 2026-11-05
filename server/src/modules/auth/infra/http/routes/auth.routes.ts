import { Router } from "express";
import { AuthController } from "@modules/auth/infra/http/controller/AuthController";
import ensureAuthenticated from "@middlewares/ensureAuthenticated";
import { ensureAuthRateLimit } from "@middlewares/ensureRateLimit";

const authRoutes = Router();
const controller = new AuthController();
const limiteLogin = ensureAuthRateLimit();
const limiteCadastro = ensureAuthRateLimit({ contarSucesso: true });

authRoutes.post("/auth/register", limiteCadastro, controller.register);
authRoutes.post("/auth/login", limiteLogin, controller.login);
authRoutes.post("/auth/refresh", limiteLogin, controller.refresh);
authRoutes.post("/auth/logout", ensureAuthenticated, controller.logout);
authRoutes.get("/auth/me", ensureAuthenticated, controller.me);

export { authRoutes };
