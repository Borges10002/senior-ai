import { Router } from "express";
import { gravacoesRoutes } from "@modules/gravacoes/infra/http/routes/gravacoes.routes";
import { reunioesRoutes } from "@modules/reunioes/infra/http/routes/reunioes.routes";
import { usuarioRoutes } from "@modules/usuario/infra/http/routes/usuario.routes";
import authenticateRoutes from "@modules/accounts/infra/http/routes/index.routes";
import feedbackRoutes from "@modules/feedback/infra/http/routes/index.routes";
import adminRoutes from "@modules/admin/infra/http/routes/index.routes";
import assinaturasRoutes from "@modules/assinaturas/infra/http/routes/index.routes";

const routes = Router();

routes.use(authenticateRoutes);
routes.use(usuarioRoutes);
routes.use(reunioesRoutes);
routes.use(gravacoesRoutes);
routes.use(feedbackRoutes);
routes.use(adminRoutes);
routes.use(assinaturasRoutes);

const swaggerRoutes = {
  "/auth/sessions": {
    post: {
      tags: ["Authentication"],
      summary: "User login",
    },
  },
  "/usuarios": {
    get: { tags: ["Users"], summary: "List users" },
    post: { tags: ["Users"], summary: "Create user" },
  },
  "/health": {
    get: { tags: ["System"], summary: "API, database and Redis status" },
  },
  "/reunioes": {
    get: { tags: ["Meetings"], summary: "List the owner's meetings" },
    post: { tags: ["Meetings"], summary: "Create meeting" },
  },
  "/reunioes/{id}": {
    get: { tags: ["Meetings"], summary: "Get meeting" },
    patch: { tags: ["Meetings"], summary: "Update meeting" },
    delete: { tags: ["Meetings"], summary: "Delete meeting (scheduled or cancelled only)" },
  },
  "/reunioes/{id}/iniciar": {
    post: { tags: ["Meetings"], summary: "Start meeting" },
  },
  "/reunioes/{id}/finalizar": {
    post: { tags: ["Meetings"], summary: "Finish meeting" },
  },
  "/reunioes/{id}/cancelar": {
    post: { tags: ["Meetings"], summary: "Cancel meeting" },
  },
  "/reunioes/{id}/gravacoes": {
    post: { tags: ["Recordings"], summary: "Upload the meeting video (multipart: video, consentimento)" },
  },
  "/reunioes/{id}/resultado": {
    get: { tags: ["Recordings"], summary: "Recording status, transcript, notes and scheduling results" },
  },
  "/gravacoes/{id}/arquivo": {
    get: { tags: ["Recordings"], summary: "Download the video (owner only)" },
  },
  "/gravacoes/{id}/reprocessar": {
    post: { tags: ["Recordings"], summary: "Run the pipeline again after a failure" },
  },
  "/feedbacks": {
    post: { tags: ["Feedback"], summary: "Create user feedback" },
  },
  "/assinatura": {
    get: { tags: ["Billing"], summary: "Current plan, trial and access level" },
    post: { tags: ["Billing"], summary: "Subscribe to Pro (returns the invoice link)" },
    delete: { tags: ["Billing"], summary: "Cancel subscription (paid period stays valid)" },
  },
  "/webhooks/asaas": {
    post: { tags: ["Billing"], summary: "Asaas payment webhook (asaas-access-token header)" },
  },
  "/admin/vendas": {
    get: { tags: ["Admin"], summary: "Plan sales, revenue and subscribers (administrators only)" },
  },
  "/admin/vendas/sincronizar": {
    post: { tags: ["Admin"], summary: "Fetch paid charges from the payment gateway (administrators only)" },
  },
  "/admin/resumo": {
    get: { tags: ["Admin"], summary: "System overview (administrators only)" },
  },
  "/admin/usuarios": {
    get: { tags: ["Admin"], summary: "List all users (administrators only)" },
  },
  "/admin/feedbacks": {
    get: { tags: ["Admin"], summary: "List all feedbacks (administrators only)" },
  },
};

export { routes, swaggerRoutes };
