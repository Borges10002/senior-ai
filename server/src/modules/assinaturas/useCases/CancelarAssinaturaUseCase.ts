import { inject, injectable } from "tsyringe";
import AppError from "@shared/errors/AppError";
import IAssinaturaRepository from "@modules/assinaturas/domain/repositories/IAssinaturaRepository";
import type { IGatewayPagamento } from "@modules/assinaturas/domain/IGatewayPagamento";

/** Encerra a recorrência; o período já pago continua valendo. */
@injectable()
export class CancelarAssinaturaUseCase {
  constructor(
    @inject("AssinaturaRepository")
    private assinaturaRepository: IAssinaturaRepository,
    @inject("GatewayPagamento")
    private gateway: IGatewayPagamento,
  ) {}

  async execute(codusuario: number, agora = new Date()) {
    const assinatura = await this.assinaturaRepository.findByUsuario(codusuario);
    if (!assinatura?.gateway_assinatura_id || assinatura.status === "cancelada") {
      throw new AppError("Nenhuma assinatura ativa para cancelar.", 400);
    }
    await this.gateway.cancelarAssinatura(assinatura.gateway_assinatura_id);
    return await this.assinaturaRepository.update(assinatura.id, {
      status: "cancelada",
      cancelada_em: agora,
      link_pagamento: null,
    });
  }
}
