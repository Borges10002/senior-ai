import mensagemConstants from "@/constants/mensagem.constants";
import parametroConstants from "@/constants/parametro.constants";
import IUsuarioRepository from "@modules/usuario/domain/repositories/IUsuarioRepository";
import { ehAdministrador } from "@modules/usuario/domain/perfil";
import AppError from "@shared/errors/AppError";
import { NextFunction, Request, Response } from "express";
import { container } from "tsyringe";

/**
 * Libera a rota só para administradores. Roda após ensureAuthenticate e
 * confere o perfil no banco, não no token: promoções e remoções de acesso
 * valem na hora, sem esperar o token expirar.
 */
export default async function ensureAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const codigo = Number(req.userAuth?.codigo);
  if (!Number.isFinite(codigo)) {
    throw new AppError(mensagemConstants.TOKEN_INVALIDO, 401);
  }

  const usuarioRepository = container.resolve<IUsuarioRepository>("UsuarioRepository");
  const usuario = await usuarioRepository.findById(codigo);

  if (
    !usuario ||
    usuario.ativo == parametroConstants.NAO ||
    !ehAdministrador(usuario.nivelacesso)
  ) {
    throw new AppError("Acesso restrito a administradores", 403);
  }

  return next();
}
