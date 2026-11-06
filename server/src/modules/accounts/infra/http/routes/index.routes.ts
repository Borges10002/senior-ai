import { AuthenticateUserController } from "@modules/accounts/infra/http/controller/AuthenticateUserController";
import { SenhaController } from "@modules/accounts/infra/http/controller/SenhaController";
import { ensureAuthRateLimit } from "@middleawares/ensureRateLimit";
import { Router } from "express";

const authenticateRoutes = Router();
const authenticateUserController = new AuthenticateUserController();
const authRateLimit = ensureAuthRateLimit();

authenticateRoutes.post(
  "/sessions",
  authRateLimit,
  authenticateUserController.handleAuth as any
);

authenticateRoutes.post(
  "/sessions/refresh-token",
  authRateLimit,
  authenticateUserController.handleRefreshAuth as any
);

authenticateRoutes.post("/sessions/logout", authRateLimit, authenticateUserController.logout as any);

// Esqueci minha senha: limite que conta também os pedidos bem-sucedidos (evita disparo em massa de e-mails).
const senhaController = new SenhaController();
const senhaRateLimit = ensureAuthRateLimit({ contarSucesso: true });
authenticateRoutes.post("/senha/esqueci", senhaRateLimit, senhaController.esqueci as any);
authenticateRoutes.post("/senha/redefinir", senhaRateLimit, senhaController.redefinir as any);

export default authenticateRoutes;
