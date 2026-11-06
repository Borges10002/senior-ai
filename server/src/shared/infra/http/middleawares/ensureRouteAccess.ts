import mensagemConstansts from "@/constants/mensagem.constants";
import AppError from "@shared/errors/AppError";
import { NextFunction, Request, Response } from "express";
import nivelacessoConstansts from "@/constants/nivelacesso.constants";

interface AcessoParametro {
  id: string;
  level: number;
}

export default function ensureRouteAccess(acessoParametro: AcessoParametro) {
  return function ensureRouteAccess(req: Request, res: Response, next: NextFunction): void {
    // userAuth vem do token ja verificado em ensureAuthenticate.
    if (!req.userAuth) throw new AppError(mensagemConstansts.TOKEN_INVALIDO, 401);

    const userNivelAcesso = getNivelAcesso(req.userAuth.nivelAcesso);

    if (!userNivelAcesso || userNivelAcesso.level < acessoParametro.level) {
      throw new AppError(mensagemConstansts.NAO_POSSUI_ACESSO, 403);
    }

    return next();
  };

  // Aceita o nivel salvo como id ("U", "G", "T") ou como level numerico.
  function getNivelAcesso(valor: unknown) {
    for (const nivel of Object.values(nivelacessoConstansts)) {
      if (nivel.id === valor || nivel.level === Number(valor)) {
        return nivel;
      }
    }
    return null;
  }
}
