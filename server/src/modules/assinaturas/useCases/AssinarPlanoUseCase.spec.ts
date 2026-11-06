import { describe, expect, it } from "vitest";
import { assinaturasEmMemoria } from "@shared/testes/repositoriosEmMemoria";
import { AssinarPlanoUseCase } from "./AssinarPlanoUseCase";
import { ObterAssinaturaUseCase } from "./ObterAssinaturaUseCase";

const agora = new Date("2027-03-10T12:00:00Z");

function cenario(cpf = "") {
  const repo = assinaturasEmMemoria();
  const usuario = { codigo: 1, nome: "Ana", email: "ana@exemplo.com", cpf };
  const usuarios = {
    findById: async () => usuario,
    update: async (_: number, p: any) => Object.assign(usuario, p),
  };
  const chamadas: any[] = [];
  const gateway = {
    configurado: () => true,
    criarCliente: async (c: any) => (chamadas.push(["cliente", c]), "cus_1"),
    criarAssinatura: async (d: any) => (chamadas.push(["assinatura", d]), "sub_1"),
    cobrancas: async () => [{ id: "pay_1", status: "PENDING", vencimento: "2027-03-24", valor: 19.9, link: "https://fatura/1" }],
    cancelarAssinatura: async () => undefined,
  };
  const obter = new ObterAssinaturaUseCase(repo as any);
  const uc = new AssinarPlanoUseCase(repo as any, usuarios as any, gateway as any, obter);
  return { uc, repo, usuario, chamadas };
}

describe("AssinarPlanoUseCase", () => {
  it("exige CPF/CNPJ válido", async () => {
    const { uc } = cenario();
    await expect(uc.execute(1, "MONTHLY", undefined, agora)).rejects.toMatchObject({ statusCode: 400 });
  });

  it("assinando no teste, a 1ª cobrança vence no fim do teste", async () => {
    const { uc, repo, usuario, chamadas } = cenario();
    const r = await uc.execute(1, "MONTHLY", "123.456.789-09", agora);

    expect(r).toEqual({ link: "https://fatura/1", jaAssinado: false });
    expect(usuario.cpf).toBe("12345678909");
    const [, assinatura] = chamadas.find(([t]) => t === "assinatura");
    expect(assinatura).toMatchObject({ clienteId: "cus_1", ciclo: "MONTHLY", primeiroVencimento: "2027-03-24" });
    expect(repo.dados[0]).toMatchObject({ status: "ativa", gateway_assinatura_id: "sub_1", ciclo: "MONTHLY" });
  });

  it("assinar de novo só devolve a fatura em aberto", async () => {
    const { uc, chamadas } = cenario("12345678909");
    await uc.execute(1, "YEARLY", undefined, agora);
    const r = await uc.execute(1, "YEARLY", undefined, agora);
    expect(r.jaAssinado).toBe(true);
    expect(chamadas.filter(([t]) => t === "assinatura")).toHaveLength(1);
  });
});
