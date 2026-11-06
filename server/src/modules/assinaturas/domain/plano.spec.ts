import { describe, expect, it } from "vitest";
import { documentoValido, fimDoPeriodo, situacaoAcesso, somarDias } from "./plano";

const agora = new Date("2027-03-10T12:00:00Z");

describe("situacaoAcesso", () => {
  it("teste grátis em andamento libera tudo e conta os dias", () => {
    const s = situacaoAcesso({ status: "trial", trial_fim: somarDias(agora, 5), periodo_fim: null }, agora);
    expect(s.acesso).toBe("completo");
    expect(s.diasTrial).toBe(5);
  });

  it("assinou durante o teste: mostra assinatura confirmada e a data da 1ª cobrança", () => {
    const s = situacaoAcesso({ status: "ativa", trial_fim: somarDias(agora, 5), periodo_fim: null }, agora);
    expect(s.acesso).toBe("completo");
    expect(s.mensagem).toMatch(/Assinatura confirmada.*5 dia\(s\) grátis.*15\/03\/2027/);
  });

  it("teste vencido sem pagamento vira só leitura", () => {
    const s = situacaoAcesso({ status: "trial", trial_fim: somarDias(agora, -1), periodo_fim: null }, agora);
    expect(s.acesso).toBe("leitura");
    expect(s.mensagem).toMatch(/teste grátis terminou/);
  });

  it("período pago libera, com carência de 3 dias após o vencimento", () => {
    const base = { status: "ativa" as const, trial_fim: somarDias(agora, -30) };
    expect(situacaoAcesso({ ...base, periodo_fim: somarDias(agora, -2) }, agora).acesso).toBe("completo");
    expect(situacaoAcesso({ ...base, periodo_fim: somarDias(agora, -4) }, agora).acesso).toBe("leitura");
  });

  it("cancelada mantém acesso até o fim do período pago, sem carência", () => {
    const base = { status: "cancelada" as const, trial_fim: somarDias(agora, -60) };
    expect(situacaoAcesso({ ...base, periodo_fim: somarDias(agora, 10) }, agora).acesso).toBe("completo");
    expect(situacaoAcesso({ ...base, periodo_fim: somarDias(agora, -1) }, agora).acesso).toBe("leitura");
  });

  it("assinou no teste: carência enquanto a 1ª cobrança compensa", () => {
    const a = { status: "ativa" as const, trial_fim: somarDias(agora, -1), periodo_fim: null };
    expect(situacaoAcesso(a, agora).acesso).toBe("completo");
    expect(situacaoAcesso(a, somarDias(agora, 3)).acesso).toBe("leitura");
  });
});

describe("fimDoPeriodo", () => {
  it("mensal e anual a partir do vencimento, fim do dia em Brasília", () => {
    expect(fimDoPeriodo("2027-01-31", "MONTHLY").toISOString()).toBe("2027-03-01T02:59:59.999Z");
    expect(fimDoPeriodo("2027-03-10", "YEARLY").toISOString()).toBe("2028-03-11T02:59:59.999Z");
  });
});

describe("documentoValido", () => {
  it("aceita CPF/CNPJ com máscara e recusa sequências", () => {
    expect(documentoValido("123.456.789-09")).toBe("12345678909");
    expect(documentoValido("11.222.333/0001-81")).toBe("11222333000181");
    expect(documentoValido("111.111.111-11")).toBeNull();
    expect(documentoValido("123")).toBeNull();
  });
});
