import { describe, expect, it } from "vitest";
import { recebedorDasVendas, resumirVendas, vendaDoPagamento } from "./vendas";

const ehAdmin = (nivel: unknown) => Number(nivel) >= 3;

describe("vendaDoPagamento", () => {
  it("usa a data do pagamento e o líquido informado pelo gateway", () => {
    const venda = vendaDoPagamento({
      id: "pay_1",
      subscription: "sub_1",
      value: 199,
      netValue: 195.01,
      billingType: "PIX",
      dueDate: "2026-10-20",
      paymentDate: "2026-10-18",
    });
    expect(venda).toMatchObject({ id: "pay_1", valor: 199, valor_liquido: 195.01, forma_pagamento: "PIX" });
    expect(venda!.pago_em.toISOString()).toBe("2026-10-18T15:00:00.000Z");
  });

  it("ignora cobrança sem id ou sem valor e forma de pagamento indefinida", () => {
    expect(vendaDoPagamento({ value: 10 })).toBeNull();
    expect(vendaDoPagamento({ id: "x", value: 0 })).toBeNull();
    expect(vendaDoPagamento({ id: "x", value: 10, billingType: "UNDEFINED" })!.forma_pagamento).toBeNull();
  });
});

describe("recebedorDasVendas", () => {
  const usuarios = [
    { codigo: 7, nivelacesso: 3, ativo: "S" },
    { codigo: 2, nivelacesso: 1, ativo: "S" },
    { codigo: 4, nivelacesso: 3, ativo: "S" },
    { codigo: 1, nivelacesso: 3, ativo: "N" },
  ];

  it("escolhe o administrador ativo mais antigo", () => {
    expect(recebedorDasVendas(usuarios, ehAdmin, "")?.codigo).toBe(4);
  });

  it("respeita VENDAS_CODUSUARIO quando definido", () => {
    expect(recebedorDasVendas(usuarios, ehAdmin, "7")?.codigo).toBe(7);
    expect(recebedorDasVendas(usuarios, ehAdmin, "99")).toBeNull();
  });
});

describe("resumirVendas", () => {
  const hoje = new Date("2026-10-31T15:00:00Z");
  const vendas = [
    { id: "a", codusuario: 1, ciclo: "MONTHLY" as const, valor: 19.9, valor_liquido: 18.91, forma_pagamento: "PIX", status: "paga" as const, pago_em: "2026-10-05T15:00:00Z" },
    { id: "b", codusuario: 2, ciclo: "YEARLY" as const, valor: 199, valor_liquido: 193.03, forma_pagamento: "CREDIT_CARD", status: "paga" as const, pago_em: "2026-10-20T15:00:00Z" },
    { id: "c", codusuario: 3, ciclo: "MONTHLY" as const, valor: 19.9, valor_liquido: null, forma_pagamento: "BOLETO", status: "paga" as const, pago_em: "2026-09-10T15:00:00Z" },
    { id: "d", codusuario: 4, ciclo: "MONTHLY" as const, valor: 19.9, valor_liquido: 18.91, forma_pagamento: "PIX", status: "estornada" as const, pago_em: "2026-10-07T15:00:00Z" },
  ];
  const assinaturas = [
    { status: "ativa" as const, ciclo: "MONTHLY" as const, valor: 19.9 },
    { status: "ativa" as const, ciclo: "YEARLY" as const, valor: 199 },
    { status: "trial" as const, ciclo: null, valor: null },
    { status: "cancelada" as const, ciclo: "MONTHLY" as const, valor: 19.9 },
  ];

  it("soma só vendas pagas e separa mês atual e anterior", () => {
    const r = resumirVendas(vendas, assinaturas, hoje);
    expect(r.receitaMes).toBe(211.94);
    expect(r.vendasMes).toBe(2);
    expect(r.receitaMesAnterior).toBe(19.9);
    expect(r.receitaTotal).toBe(238.8);
    expect(r.liquidoTotal).toBe(231.84);
    expect(r.taxasTotal).toBe(6.96);
    expect(r.estornos).toBe(1);
    expect(r.ticketMedio).toBe(79.6);
  });

  it("calcula MRR (anual dividido por 12), assinantes e 12 meses de histórico", () => {
    const r = resumirVendas(vendas, assinaturas, hoje);
    expect(r.mrr).toBe(36.48);
    expect(r.assinantes).toEqual({ trial: 1, ativa: 2, inadimplente: 0, cancelada: 1 });
    expect(r.porMes).toHaveLength(12);
    expect(r.porMes[11]).toMatchObject({ mes: "2026-10", vendas: 2 });
    expect(r.porMes[0].mes).toBe("2025-11");
    expect(r.porForma[0]).toMatchObject({ forma: "CREDIT_CARD", vendas: 1 });
  });
});
