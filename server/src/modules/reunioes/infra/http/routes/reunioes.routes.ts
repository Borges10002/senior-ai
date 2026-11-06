import { Router } from "express";
import { ReuniaoController } from "@modules/reunioes/infra/http/controller/ReuniaoController";

const reunioesRoutes = Router();
const controller = new ReuniaoController();

reunioesRoutes.get("/reunioes", controller.index);
reunioesRoutes.post("/reunioes", controller.create);
reunioesRoutes.get("/reunioes/:id", controller.show);
reunioesRoutes.patch("/reunioes/:id", controller.update);
reunioesRoutes.delete("/reunioes/:id", controller.delete);
reunioesRoutes.post("/reunioes/:id/iniciar", controller.iniciar);
reunioesRoutes.post("/reunioes/:id/finalizar", controller.finalizar);
reunioesRoutes.post("/reunioes/:id/cancelar", controller.cancelar);

export { reunioesRoutes };
