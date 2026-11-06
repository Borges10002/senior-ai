import { describe, expect, it } from "vitest";
import { horario, juntarPartes, textoComHorarios } from "./montarTranscricao";

describe("montagem da transcrição", () => {
  it("desloca os horários de cada parte e mantém a ordem", () => {
    const juntos = juntarPartes([
      { inicio: 1200, trechos: [{ inicio: 5, fim: 8, texto: " segunda " }] },
      { inicio: 0, trechos: [{ inicio: 1, fim: 2, texto: "primeira" }, { inicio: 3, fim: 4, texto: "   " }] },
    ]);
    expect(juntos).toEqual([
      { inicio: 1, fim: 2, texto: "primeira" },
      { inicio: 1205, fim: 1208, texto: "segunda" },
    ]);
  });

  it("formata horários acima de uma hora", () => {
    expect(horario(3725.9)).toBe("01:02:05");
  });

  it("mantém o horário em cada linha", () => {
    expect(textoComHorarios([{ inicio: 61, texto: "Olá" }])).toBe("[00:01:01] Olá");
  });
});
