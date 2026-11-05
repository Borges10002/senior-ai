import type { Request, Response } from "express";
import { container } from "tsyringe";
import { z } from "zod";
import { LoginUseCase } from "@modules/auth/useCases/LoginUseCase";
import { LogoutUseCase } from "@modules/auth/useCases/LogoutUseCase";
import { RefreshTokenUseCase } from "@modules/auth/useCases/RefreshTokenUseCase";
import { CreateUsuarioUseCase } from "@modules/usuarios/useCases/CreateUsuarioUseCase";
import { GetUsuarioUseCase } from "@modules/usuarios/useCases/GetUsuarioUseCase";

const email = z.string().trim().toLowerCase().email().max(180);

class AuthController {
  async register(request: Request, response: Response): Promise<Response> {
    const dados = z
      .object({ nome: z.string().trim().min(2).max(120), email, senha: z.string().min(1).max(200) })
      .parse(request.body);
    const usuario = await container.resolve(CreateUsuarioUseCase).execute(dados);
    return response.status(201).json(usuario);
  }

  async login(request: Request, response: Response): Promise<Response> {
    const dados = z.object({ email, senha: z.string().min(1).max(200) }).parse(request.body);
    const sessao = await container.resolve(LoginUseCase).execute({
      ...dados,
      ip: request.ip,
      userAgent: request.get("user-agent"),
    });
    return response.json(sessao);
  }

  async refresh(request: Request, response: Response): Promise<Response> {
    const { refreshToken } = z.object({ refreshToken: z.string().min(1).max(200) }).parse(request.body);
    const sessao = await container.resolve(RefreshTokenUseCase).execute(refreshToken, request.ip);
    return response.json(sessao);
  }

  async logout(request: Request, response: Response): Promise<Response> {
    await container.resolve(LogoutUseCase).execute(request.userAuth.id, request.userAuth.sessaoId, request.ip);
    return response.status(204).send();
  }

  async me(request: Request, response: Response): Promise<Response> {
    const usuario = await container.resolve(GetUsuarioUseCase).execute(request.userAuth.id);
    return response.json(usuario);
  }
}

export { AuthController };
