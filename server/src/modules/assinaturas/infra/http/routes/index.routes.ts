import { Router } from "express";
import { AssinaturaController } from "../controller/AssinaturaController";

const assinaturasRoutes = Router();
const assinaturaController = new AssinaturaController();

assinaturasRoutes.get("/assinatura", assinaturaController.show);
assinaturasRoutes.post("/assinatura", assinaturaController.assinar);
assinaturasRoutes.delete("/assinatura", assinaturaController.cancelar);
// Pública (sem JWT): autenticada pelo header asaas-access-token.
assinaturasRoutes.post("/webhooks/asaas", assinaturaController.webhook);

export default assinaturasRoutes;
