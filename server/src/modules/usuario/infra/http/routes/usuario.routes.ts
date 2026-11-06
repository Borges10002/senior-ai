import { ensureAuthRateLimit } from "@middleawares/ensureRateLimit";
import { Router } from "express";
import { UsuarioController } from "../controller/UsuarioController";

const usuarioRoutes = Router();
const usuarioController = new UsuarioController();
// Cadastro e consulta de e-mail são públicos: toda chamada conta no limite.
const publicoRateLimit = ensureAuthRateLimit({ contarSucesso: true });
const senhaRateLimit = ensureAuthRateLimit();

usuarioRoutes.get("/usuarios", usuarioController.show);
usuarioRoutes.get("/usuarios/:codigo", usuarioController.showById);
usuarioRoutes.post("/usuarios", publicoRateLimit, usuarioController.create);
usuarioRoutes.put(
  "/usuarios/alterar-senha",
  senhaRateLimit,
  usuarioController.changePassword,
);
usuarioRoutes.put("/usuarios/:codigo", usuarioController.update);
usuarioRoutes.delete("/usuarios/:codigo", usuarioController.delete);
usuarioRoutes.get("/usuarios/usuario/:usuario", usuarioController.findByUsuario);

export { usuarioRoutes };
