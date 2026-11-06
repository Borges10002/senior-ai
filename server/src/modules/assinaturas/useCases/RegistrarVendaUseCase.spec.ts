import { describe, expect, it } from "vitest";
import { assinaturasEmMemoria, vendasEmMemoria } from "@shared/testes/repositoriosEmMemoria";
import { RegistrarVendaUseCase } from "./RegistrarVendaUseCase";

function cenario() {
  const vendas = vendasEmMemoria();
  const assinaturas = assinaturasEmMemoria([
    { codusuario: 20, status: "ativa", ciclo: "YEARLY", gateway_assinatura_id: "sub_1" },
  ]);
  return { uc: new RegistrarVendaUseCase(vendas as any, assinaturas as any), vendas };
}

const pago = { id: "pay_1", subscription: "sub_1", value: 199, netValue: 195.01, billingType: "PIX", paymentDate: "2026-10-18" };

describe("RegistrarVendaUseCase", () => {
  it("registra a venda do comprador", async () => {
    const { uc } = cenario();
    expect(await uc.execute(pago)).toMatchObject({ id: "pay_1", codusuario: 20, ciclo: "YEARLY", status: "paga" });
  });

  it("o mesmo pagamento avisado de novo não duplica a venda", async () => {
    const { uc, vendas } = cenario();
    await uc.execute(pago);
    await uc.execute({ ...pago, netValue: 195.01 });
    expect(vendas.dados).toHaveLength(1);
  });

  it("estorno não volta com aviso de pagamento atrasado", async () => {
    const { uc, vendas } = cenario();
    await uc.execute(pago);
    await uc.execute({ id: "pay_1" }, true);
    expect(vendas.dados[0].status).toBe("estornada");

    await uc.execute(pago);
    expect(vendas.dados[0].status).toBe("estornada");
  });

  it("ignora cobrança de assinatura desconhecida", async () => {
    const { uc, vendas } = cenario();
    expect(await uc.execute({ ...pago, subscription: "sub_x" })).toBeNull();
    expect(vendas.dados).toHaveLength(0);
  });
});
