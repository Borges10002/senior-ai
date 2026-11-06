import { verifySessionToken } from "@modules/accounts/tokenProfile";
import { container } from "tsyringe";
import IUsuarioRepository from "@modules/usuario/domain/repositories/IUsuarioRepository";
import { validAccount } from "@modules/accounts/sessionSecurity";
import { sessions } from "@modules/accounts/infra/typeorm/repositories/SessionStore";
import { cookie, COOKIE_ACCESS, ensureCookieOrigin } from "@modules/accounts/infra/http/sessionCookies";
import AppError from "@shared/errors/AppError";
import { NextFunction, Request, Response } from "express";
import { TokenExpiredError } from "jsonwebtoken";
import mensagemConstants from "@/constants/mensagem.constants";
import TOKEN_TYPE from "@/constants/tokenType.constants";

const TOKEN_EXPIRADO =
  "Sessão expirada. Você será desconectado. Faça login novamente.";

export default async function ensureAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const isPublicRoute =
    (req.method === "POST" && req.path === "/sessions") ||
    (req.method === "POST" && (req.path === "/sessions/refresh-token" || req.path === "/sessions/logout")) ||
    (req.method === "POST" && req.path === "/usuarios") ||
    // Esqueci minha senha: pedir o link e trocar a senha pelo link do e-mail.
    (req.method === "POST" && (req.path === "/senha/esqueci" || req.path === "/senha/redefinir")) ||
    // Webhook do gateway: autenticado pelo token próprio no controller.
    (req.method === "POST" && req.path.startsWith("/webhooks/"));

  if (isPublicRoute) {
    return next();
  }

  const cookieToken = cookie(req, COOKIE_ACCESS);
  if (!req.headers.authorization && cookieToken && !["GET", "HEAD", "OPTIONS"].includes(req.method)) ensureCookieOrigin(req);
  const authorization = req.headers.authorization || (cookieToken ? "Bearer " + cookieToken : undefined);
  if (!authorization) {
    throw new AppError(mensagemConstants.TOKEN_INVALIDO, 401);
  }

  const [typeAuthorization, token] = authorization.split(" ");
  if (typeAuthorization != "Bearer")
    throw new AppError(mensagemConstants.TOKEN_INVALIDO, 401);

  try {
    const { sub, sid, cv } = verifySessionToken(token, TOKEN_TYPE.ACCESS);
    const codigo = Number(sub);
    const usuario = await container.resolve<IUsuarioRepository>("UsuarioRepository").findById(codigo);
    if (!Number.isFinite(codigo) || !validAccount(usuario, cv) || typeof sid !== "string" || !(await sessions.active(sid, codigo))) {
      throw new AppError(mensagemConstants.TOKEN_INVALIDO, 401);
    }
    req.userAuth = { codigo: String(usuario.codigo), usuario: usuario.usuario, nome: usuario.nome, email: usuario.email, nivelAcesso: usuario.nivelacesso };

    return next();
  } catch (error: any) {
    if (error instanceof TokenExpiredError) {
      throw new AppError(TOKEN_EXPIRADO, 401);
    } else {
      throw new AppError(mensagemConstants.TOKEN_INVALIDO, 401);
    }
  }
}
