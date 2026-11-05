import type { NextFunction, Request, Response } from "express";
import { TokenExpiredError } from "jsonwebtoken";
import { container } from "tsyringe";
import type ISessaoRepository from "@modules/auth/domain/repositories/ISessaoRepository";
import { verificarAccessToken } from "@modules/auth/domain/tokens";
import type IUsuarioRepository from "@modules/usuarios/domain/repositories/IUsuarioRepository";
import mensagens from "@/constants/mensagem.constants";
import AppError from "@shared/errors/AppError";

/**
 * Exige um access token válido de uma sessão ativa. Conferir usuário e sessão no banco
 * a cada requisição garante que logout, troca de senha e desativação valham na hora.
 */
export default async function ensureAuthenticated(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const [tipo, token] = String(req.headers.authorization || "").split(" ");
  if (tipo !== "Bearer" || !token) throw new AppError(mensagens.TOKEN_INVALIDO, 401);

  let claims;
  try {
    claims = verificarAccessToken(token);
  } catch (erro) {
    throw new AppError(erro instanceof TokenExpiredError ? mensagens.TOKEN_EXPIRADO : mensagens.TOKEN_INVALIDO, 401);
  }

  const [usuario, sessao] = await Promise.all([
    container.resolve<IUsuarioRepository>("UsuarioRepository").findById(claims.sub),
    container.resolve<ISessaoRepository>("SessaoRepository").findById(claims.sid),
  ]);
  const sessaoAtiva =
    sessao && sessao.usuario_id === claims.sub && !sessao.revogada_em && sessao.expira_em.getTime() > Date.now();
  if (!usuario || !usuario.ativo || usuario.versao_credencial !== claims.cv || !sessaoAtiva) {
    throw new AppError(mensagens.TOKEN_INVALIDO, 401);
  }

  req.userAuth = { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil, sessaoId: sessao.id };
  next();
}
