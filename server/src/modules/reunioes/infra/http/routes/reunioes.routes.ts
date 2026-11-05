import { Router } from "express";
import { ReuniaoController } from "@modules/reunioes/infra/http/controller/ReuniaoController";
import ensureAuthenticated from "@middlewares/ensureAuthenticated";

const reunioesRoutes = Router();
const controller = new ReuniaoController();

reunioesRoutes.use("/meetings", ensureAuthenticated);
reunioesRoutes.get("/meetings", controller.index);
reunioesRoutes.post("/meetings", controller.create);
reunioesRoutes.get("/meetings/:id", controller.show);
reunioesRoutes.patch("/meetings/:id", controller.update);
reunioesRoutes.delete("/meetings/:id", controller.delete);
reunioesRoutes.post("/meetings/:id/start", controller.iniciar);
reunioesRoutes.post("/meetings/:id/finish", controller.finalizar);
reunioesRoutes.post("/meetings/:id/cancel", controller.cancelar);

export { reunioesRoutes };
