import { timingSafeEqual } from "crypto";
import { Request, Response } from "express";
import { container } from "tsyringe";
import { z } from "zod";
import AppError from "@shared/errors/AppError";
import { CICLOS } from "@modules/assinaturas/domain/plano";
import { AssinarPlanoUseCase } from "@modules/assinaturas/useCases/AssinarPlanoUseCase";
import { CancelarAssinaturaUseCase } from "@modules/assinaturas/useCases/CancelarAssinaturaUseCase";
import { ObterAssinaturaUseCase } from "@modules/assinaturas/useCases/ObterAssinaturaUseCase";
import { ProcessarWebhookPagamentoUseCase } from "@modules/assinaturas/useCases/ProcessarWebhookPagamentoUseCase";
import { RegistrarVendaUseCase } from "@modules/assinaturas/useCases/RegistrarVendaUseCase";
import { EVENTOS_ESTORNO, EVENTOS_PAGO } from "@modules/assinaturas/domain/vendas";

const usuarioLogado = (request: Request): number => {
  const codusuario = Number(request.userAuth.codigo);
  if (!Number.isFinite(codusuario)) {
    throw new AppError("Usuario autenticado invalido", 401);
  }
  return codusuario;
};

/** Compara o token do webhook sem vazar tempo de comparação. */
function tokenConfere(recebido: unknown): boolean {
  const esperado = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!esperado || typeof recebido !== "string") return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

class AssinaturaController {
  async show(request: Request, response: Response): Promise<Response> {
    const obter = container.resolve(ObterAssinaturaUseCase);
    return response.json(await obter.execute(usuarioLogado(request)));
  }

  async assinar(request: Request, response: Response): Promise<Response> {
    const { ciclo, documento } = z
      .object({
        ciclo: z.enum(CICLOS as [string, ...string[]]).default("MONTHLY"),
        documento: z.string().trim().max(20).optional(),
      })
      .parse(request.body ?? {});
    const assinar = container.resolve(AssinarPlanoUseCase);
    const resultado = await assinar.execute(usuarioLogado(request), ciclo as any, documento);
    return response.status(201).json(resultado);
  }

  async cancelar(request: Request, response: Response): Promise<Response> {
    const cancelar = container.resolve(CancelarAssinaturaUseCase);
    await cancelar.execute(usuarioLogado(request));
    const obter = container.resolve(ObterAssinaturaUseCase);
    return response.json(await obter.execute(usuarioLogado(request)));
  }

  /** Avisos do Asaas. Responde rápido; o processamento é curto e idempotente. */
  async webhook(request: Request, response: Response): Promise<Response> {
    if (!tokenConfere(request.headers["asaas-access-token"])) {
      return response.status(401).json({ message: "Token do webhook inválido" });
    }
    const evento = request.body ?? {};
    const processar = container.resolve(ProcessarWebhookPagamentoUseCase);
    const resultado = await processar.execute(evento);

    const tipo = String(evento.event ?? "");
    const estorno = EVENTOS_ESTORNO.includes(tipo);
    if (resultado !== "repetido" && evento.payment && (estorno || EVENTOS_PAGO.includes(tipo))) {
      // A assinatura já foi atualizada; se a venda falhar aqui, o painel
      // de vendas refaz a partir do evento gravado.
      try {
        await container.resolve(RegistrarVendaUseCase).execute(evento.payment, estorno);
      } catch (erro) {
        console.error("[Vendas] Falha ao registrar venda do webhook:", erro);
      }
    }
    return response.json({ recebido: true, resultado });
  }
}

export { AssinaturaController };
