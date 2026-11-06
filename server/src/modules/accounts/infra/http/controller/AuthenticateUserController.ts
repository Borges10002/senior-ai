import { cookie, COOKIE_REFRESH, ensureCookieOrigin, sessionResponse, clearSessionCookies } from "../sessionCookies";
import { sessions } from "../../typeorm/repositories/SessionStore";
import { verifySessionToken } from "@modules/accounts/tokenProfile";
import TOKEN_TYPE from "@/constants/tokenType.constants";
import { AuthenticateUserUseCase } from "@modules/accounts/useCases/AuthenticateUserUseCase";
import { Request, Response } from "express";
import { container } from "tsyringe";
import z from "zod";

class AuthenticateUserController {
  async handleAuth(req: Request, res: Response): Promise<Response> {
    if (req.headers["x-auth-mode"] === "cookie") ensureCookieOrigin(req);
    const schema = z.object({
      usuario: z.string().toUpperCase().optional().default(""),
      email: z.string().optional(),
      password: z.string().optional(),
      senha: z.string().optional(),
    }).refine(data => data.password || data.senha, {
      message: "password ou senha é obrigatório",
      path: ["password"],
    });

    const body = schema.parse(req.body);
    const password = body.password || body.senha || "";

    const authenticateUserUseCase = container.resolve(AuthenticateUserUseCase);
    const token = await authenticateUserUseCase.authenticate({
      usuario: body.usuario,
      email: body.email || "",
      password,
    });

    return sessionResponse(req, res, token);
  }

  async handleRefreshAuth(req: Request, res: Response): Promise<Response> {
    const schema = z.object({ refreshToken: z.string() });

    const fromCookie = cookie(req, COOKIE_REFRESH);
    if (fromCookie || req.headers["x-auth-mode"] === "cookie") ensureCookieOrigin(req);
    const { refreshToken } = schema.parse(fromCookie ? { refreshToken: fromCookie } : req.body);

    const authenticateUserUseCase = container.resolve(AuthenticateUserUseCase);
    const token = await authenticateUserUseCase.refrehAuthenticate({
      refreshToken,
    });

    return sessionResponse(req, res, token);
  }
  async logout(req: Request, res: Response): Promise<Response> {
    const refresh = cookie(req, COOKIE_REFRESH);
    if (refresh || req.headers["x-auth-mode"] === "cookie") ensureCookieOrigin(req);
    const value = refresh || req.body?.refreshToken;
    if (typeof value === "string") {
      let payload: any;
      try { payload = verifySessionToken(value, TOKEN_TYPE.REFRESH); }
      catch { /* Invalid credentials cannot identify a live session. */ }
      if (payload?.tokenType === "refresh" && typeof payload.sid === "string") await sessions.revoke(payload.sid);
    }
    clearSessionCookies(res);
    return res.status(204).send();
  }
}

export { AuthenticateUserController };
