import { describe, expect, it } from "vitest";
import { assinaturasEmMemoria } from "@shared/testes/repositoriosEmMemoria";
import { ProcessarWebhookPagamentoUseCase } from "./ProcessarWebhookPagamentoUseCase";

const agora = new Date("2027-03-10T12:00:00Z");

function cenario(parcial: any = {}) {
  const repo = assinaturasEmMemoria([
    {
      codusuario: 1,
      status: "ativa",
      ciclo: "MONTHLY",
      trial_fim: new Date("2027-03-01T00:00:00Z"),
      periodo_fim: null,
      gateway_assinatura_id: "sub_1",
      link_pagamento: "https://fatura/1",
      ...parcial,
    },
  ]);
  return { repo, uc: new ProcessarWebhookPagamentoUseCase(repo as any), a: repo.dados[0] };
}

const pagamento = (event: string, extra: any = {}) => ({
  id: `evt_${event}_${extra.dueDate ?? ""}`,
  event,
  payment: { id: "pay_1", subscription: "sub_1", status: "RECEIVED", dueDate: "2027-03-10", ...extra },
});

describe("ProcessarWebhookPagamentoUseCase", () => {
  it("pagamento recebido ativa e estende o período por um ciclo", async () => {
    const { uc, a } = cenario({ status: "inadimplente" });
    expect(await uc.execute(pagamento("PAYMENT_RECEIVED"), agora)).toBe("processado");
    expect(a.status).toBe("ativa");
    expect(new Date(a.periodo_fim).toISOString()).toBe("2027-04-11T02:59:59.999Z");
    expect(a.link_pagamento).toBeNull();
  });

  it("evento repetido não é processado de novo", async () => {
    const { uc } = cenario();
    await uc.execute(pagamento("PAYMENT_CONFIRMED"), agora);
    expect(await uc.execute(pagamento("PAYMENT_CONFIRMED"), agora)).toBe("repetido");
  });

  it("evento antigo fora de ordem não encurta o período pago", async () => {
    const { uc, a } = cenario();
    await uc.execute(pagamento("PAYMENT_RECEIVED", { dueDate: "2027-04-10" }), agora);
    await uc.execute(pagamento("PAYMENT_RECEIVED", { dueDate: "2027-03-10" }), agora);
    expect(new Date(a.periodo_fim).toISOString()).toBe("2027-05-11T02:59:59.999Z");
  });

  it("atraso marca inadimplente e guarda o link da fatura", async () => {
    const { uc, a } = cenario();
    await uc.execute(pagamento("PAYMENT_OVERDUE", { status: "OVERDUE", invoiceUrl: "https://fatura/2" }), agora);
    expect(a.status).toBe("inadimplente");
    expect(a.link_pagamento).toBe("https://fatura/2");
  });

  it("estorno corta o acesso pago na hora", async () => {
    const { uc, a } = cenario({ periodo_fim: new Date("2027-04-10T00:00:00Z") });
    await uc.execute(pagamento("PAYMENT_REFUNDED"), agora);
    expect(a.status).toBe("inadimplente");
    expect(a.periodo_fim).toEqual(agora);
  });

  it("assinatura removida no gateway vira cancelada", async () => {
    const { uc, a } = cenario();
    await uc.execute({ id: "evt_del", event: "SUBSCRIPTION_DELETED", subscription: { id: "sub_1" } }, agora);
    expect(a.status).toBe("cancelada");
  });

  it("ignora assinatura desconhecida", async () => {
    const { uc } = cenario();
    const outro = pagamento("PAYMENT_RECEIVED");
    outro.payment.subscription = "sub_x";
    expect(await uc.execute(outro, agora)).toBe("ignorado");
  });
});
