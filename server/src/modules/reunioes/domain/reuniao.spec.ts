import { describe, expect, it } from "vitest";
import { garantirTransicao, podeExcluir, podeMudarStatus } from "./reuniao";

describe("transições de status da reunião", () => {
  it("permite o fluxo normal", () => {
    expect(podeMudarStatus("AGENDADA", "EM_ANDAMENTO")).toBe(true);
    expect(podeMudarStatus("EM_ANDAMENTO", "FINALIZADA")).toBe(true);
  });

  it("bloqueia voltar ou pular etapas", () => {
    expect(podeMudarStatus("AGENDADA", "FINALIZADA")).toBe(false);
    expect(podeMudarStatus("FINALIZADA", "EM_ANDAMENTO")).toBe(false);
    expect(() => garantirTransicao("CANCELADA", "EM_ANDAMENTO")).toThrow(expect.objectContaining({ statusCode: 409 }));
  });

  it("só exclui reunião que não foi iniciada", () => {
    expect(podeExcluir("AGENDADA")).toBe(true);
    expect(podeExcluir("EM_ANDAMENTO")).toBe(false);
    expect(podeExcluir("FINALIZADA")).toBe(false);
  });
});
