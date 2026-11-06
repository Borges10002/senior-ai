import { inject, injectable } from "tsyringe";
import type { IGatewayPagamento } from "@modules/assinaturas/domain/IGatewayPagamento";
import IAssinaturaRepository from "@modules/assinaturas/domain/repositories/IAssinaturaRepository";
import IVendaRepository from "@modules/assinaturas/domain/repositories/IVendaRepository";
import {
  EVENTOS_ESTORNO,
  EVENTOS_PAGO,
  PagamentoGateway,
  STATUS_ESTORNO,
  STATUS_PAGO,
} from "@modules/assinaturas/domain/vendas";
import { RegistrarVendaUseCase } from "./RegistrarVendaUseCase";

export interface ResultadoSincronizacao {
  vendas: number;
  consultouGateway: boolean;
}

/**
 * Recupera vendas que ainda não estão na tabela: refaz os avisos de
 * pagamento já recebidos e, se pedido, consulta as cobranças no gateway
 * (útil quando o webhook não estava configurado na hora da compra).
 */
@injectable()
export class SincronizarVendasUseCase {
  constructor(
    @inject("AssinaturaRepository")
    private assinaturaRepository: IAssinaturaRepository,
    @inject("VendaRepository")
    private vendaRepository: IVendaRepository,
    @inject("GatewayPagamento")
    private gateway: IGatewayPagamento,
    @inject(RegistrarVendaUseCase)
    private registrarVenda: RegistrarVendaUseCase,
  ) {}

  async execute({ consultarGateway = false } = {}): Promise<ResultadoSincronizacao> {
    const eventos = await this.assinaturaRepository.eventosPorTipo([...EVENTOS_PAGO, ...EVENTOS_ESTORNO]);
    for (const evento of eventos) {
      const pagamento = (evento.payload as { payment?: PagamentoGateway } | null)?.payment;
      if (pagamento) await this.registrarVenda.execute(pagamento, EVENTOS_ESTORNO.includes(evento.evento));
    }

    const consultouGateway = consultarGateway && this.gateway.configurado();
    if (consultouGateway) {
      const assinaturas = await this.assinaturaRepository.findAll();
      for (const a of assinaturas.filter((a) => a.gateway_assinatura_id)) {
        for (const c of await this.gateway.cobrancas(a.gateway_assinatura_id!)) {
          const pagamento = { ...c.dados, id: c.id, subscription: a.gateway_assinatura_id!, status: c.status };
          if (STATUS_PAGO.includes(c.status)) await this.registrarVenda.execute(pagamento);
          else if (STATUS_ESTORNO.includes(c.status)) await this.registrarVenda.execute(pagamento, true);
        }
      }
    }

    const vendas = await this.vendaRepository.findAll();
    return { vendas: vendas.length, consultouGateway };
  }
}
