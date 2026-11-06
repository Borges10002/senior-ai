import { clearSessionCookies } from "../sessionCookies";
import { RecuperarSenhaUseCase } from "@modules/accounts/useCases/RecuperarSenhaUseCase";
import { Request, Response } from "express";
import { container } from "tsyringe";
import { z } from "zod";

const MENSAGEM_ENVIO =
  "Se este e-mail estiver cadastrado, enviamos um link para criar uma nova senha. Confira também a caixa de spam.";

class SenhaController {
  async esqueci(request: Request, response: Response): Promise<Response> {
    const { email } = z.object({ email: z.string().trim().email("Informe um e-mail válido") }).parse(request.body);
    await container.resolve(RecuperarSenhaUseCase).solicitar(email);
    return response.json({ message: MENSAGEM_ENVIO });
  }

  async redefinir(request: Request, response: Response): Promise<Response> {
    const { token, senha } = z
      .object({ token: z.string().regex(/^[a-f0-9]{64}$/, "Link inválido"), senha: z.string().min(1) })
      .parse(request.body);
    await container.resolve(RecuperarSenhaUseCase).redefinir(token, senha);
    clearSessionCookies(response);
    return response.json({ message: "Senha alterada. Entre com a nova senha." });
  }
}

export { SenhaController };
