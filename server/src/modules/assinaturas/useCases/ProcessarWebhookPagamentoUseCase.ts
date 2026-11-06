import { inject, injectable } from "tsyringe";
import IAssinaturaRepository from "@modules/assinaturas/domain/repositories/IAssinaturaRepository";
import { fimDoPeriodo } from "@modules/assinaturas/domain/plano";
import { Assinatura } from "@modules/assinaturas/infra/typeorm/entities/Assinatura";

export interface EventoWebhook {
  id?: string;
  event?: string;
  payment?: {
    id?: string;
    subscription?: string;
    status?: string;
    dueDate?: string;
    invoiceUrl?: string;
  };
  subscription?: { id?: string };
}

const PAGO = ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"];
const ESTORNO = [
  "PAYMENT_REFUNDED",
  "PAYMENT_CHARGEBACK_REQUESTED",
  "PAYMENT_CHARGEBACK_DISPUTE",
];
const NOVA_FATURA = ["PAYMENT_CREATED", "PAYMENT_UPDATED", "PAYMENT_RESTORED"];
const FIM = ["SUBSCRIPTION_DELETED", "SUBSCRIPTION_INACTIVATED"];

/**
 * Atualiza a assinatura a partir dos avisos do gateway. Idempotente: o mesmo
 * evento entregue de novo é ignorado; eventos fora de ordem não encurtam o
 * período pago.
 */
@injectable()
export class ProcessarWebhookPagamentoUseCase {
  constructor(
    @inject("AssinaturaRepository")
    private assinaturaRepository: IAssinaturaRepository,
  ) {}

  async execute(
    evento: EventoWebhook,
    agora = new Date(),
  ): Promise<"processado" | "repetido" | "ignorado"> {
    const tipo = String(evento.event ?? "");
    const gatewayAssinaturaId =
      evento.payment?.subscription ?? evento.subscription?.id ?? null;
    const idEvento =
      evento.id ??
      `${tipo}:${evento.payment?.id ?? gatewayAssinaturaId}:${evento.payment?.status ?? ""}`;

    const novo = await this.assinaturaRepository.registrarEvento({
      id: idEvento,
      evento: tipo,
      gateway_assinatura_id: gatewayAssinaturaId,
      payload: evento,
    });
    if (!novo) return "repetido";
    if (!gatewayAssinaturaId) return "ignorado";

    const assinatura =
      await this.assinaturaRepository.findByGatewayAssinatura(
        gatewayAssinaturaId,
      );
    if (!assinatura) return "ignorado";

    const mudancas = this.mudancas(assinatura, tipo, evento, agora);
    if (!mudancas) return "ignorado";
    await this.assinaturaRepository.update(assinatura.id, mudancas);
    return "processado";
  }

  private mudancas(
    a: Assinatura,
    tipo: string,
    evento: EventoWebhook,
    agora: Date,
  ): Partial<Assinatura> | null {
    const pagamento = evento.payment ?? {};
    const cancelada = a.status === "cancelada";

    if (PAGO.includes(tipo) && pagamento.dueDate && a.ciclo) {
      const fim = fimDoPeriodo(pagamento.dueDate, a.ciclo);
      const atual = a.periodo_fim ? new Date(a.periodo_fim) : null;
      return {
        status: cancelada ? "cancelada" : "ativa",
        periodo_fim: atual && atual > fim ? atual : fim,
        link_pagamento: null,
      };
    }
    if (tipo === "PAYMENT_OVERDUE") {
      return cancelada
        ? null
        : {
            status: "inadimplente",
            link_pagamento: pagamento.invoiceUrl ?? a.link_pagamento,
          };
    }
    if (ESTORNO.includes(tipo)) {
      return {
        status: cancelada ? "cancelada" : "inadimplente",
        periodo_fim: agora,
      };
    }
    if (
      NOVA_FATURA.includes(tipo) &&
      pagamento.status === "PENDING" &&
      pagamento.invoiceUrl
    ) {
      return cancelada ? null : { link_pagamento: pagamento.invoiceUrl };
    }
    if (FIM.includes(tipo)) {
      return cancelada
        ? null
        : { status: "cancelada", cancelada_em: agora, link_pagamento: null };
    }
    return null;
  }
}
