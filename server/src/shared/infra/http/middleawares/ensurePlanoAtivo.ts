import { NextFunction, Request, Response } from "express";
import { container } from "tsyringe";
import IUsuarioRepository from "@modules/usuario/domain/repositories/IUsuarioRepository";
import { ehAdministrador } from "@modules/usuario/domain/perfil";
import { planosAtivos, situacaoAcesso } from "@modules/assinaturas/domain/plano";
import { ObterAssinaturaUseCase } from "@modules/assinaturas/useCases/ObterAssinaturaUseCase";

const LEITURA = ["GET", "HEAD", "OPTIONS"];

/** Escritas que continuam liberadas mesmo sem plano (conta, suporte e a própria assinatura). */
const SEMPRE_LIBERADAS: Array<[string, RegExp]> = [
  ["*", /^\/sessions(\/|$)/],
  ["POST", /^\/senha\/(esqueci|redefinir)$/],
  ["POST", /^\/usuarios$/],
  ["PUT", /^\/usuarios\/alterar-senha$/],
  ["*", /^\/usuarios\/\d+$/], // perfil e exclusão da própria conta
  ["*", /^\/assinatura$/],
  ["POST", /^\/webhooks\//],
  ["*", /^\/feedbacks(\/|$)/],
  ["*", /^\/admin(\/|$)/],
];

export const CODIGO_ASSINATURA_NECESSARIA = "ASSINATURA_NECESSARIA";

/**
 * Depois do teste grátis sem pagamento, a conta vira só leitura: consulta tudo,
 * mas não cria, altera nem exclui. Responde 402 para o app abrir a tela do plano.
 */
export default async function ensurePlanoAtivo(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!planosAtivos() || LEITURA.includes(req.method)) return next();
  if (SEMPRE_LIBERADAS.some(([m, rota]) => (m === "*" || m === req.method) && rota.test(req.path))) {
    return next();
  }

  const codigo = Number(req.userAuth?.codigo);
  if (!Number.isFinite(codigo)) return next(); // rota pública; o ensureAuthenticate já decidiu

  const usuario = await container.resolve<IUsuarioRepository>("UsuarioRepository").findById(codigo);
  if (usuario && ehAdministrador(usuario.nivelacesso)) return next();

  const assinatura = await container.resolve(ObterAssinaturaUseCase).garantir(codigo);
  const situacao = situacaoAcesso(assinatura);
  if (situacao.acesso === "completo") return next();

  res.status(402).json({ message: situacao.mensagem, code: CODIGO_ASSINATURA_NECESSARIA, situacao });
}
