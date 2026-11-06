import ensureAdmin from "@middleawares/ensureAdmin";
import { Router } from "express";
import { AdminController } from "../controller/AdminController";

const adminRoutes = Router();
const adminController = new AdminController();

// Todas as rotas /admin exigem perfil Administrador (conferido no banco).
adminRoutes.use("/admin", ensureAdmin);

adminRoutes.get("/admin/resumo", adminController.resumo);
adminRoutes.get("/admin/vendas", adminController.vendas);
adminRoutes.post("/admin/vendas/sincronizar", adminController.sincronizarVendas);
adminRoutes.get("/admin/perfis", adminController.perfis);
adminRoutes.get("/admin/usuarios", adminController.listarUsuarios);
adminRoutes.patch("/admin/usuarios/:codigo", adminController.alterarUsuario);
adminRoutes.get("/admin/feedbacks", adminController.listarFeedbacks);
adminRoutes.patch("/admin/feedbacks/:id", adminController.atualizarFeedback);
adminRoutes.delete("/admin/feedbacks/:id", adminController.excluirFeedback);

export default adminRoutes;
