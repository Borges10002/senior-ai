import { describe, expect, it } from "vitest";
import { ROTULO_STATUS, formatarDataHora } from "./reuniao";

describe("reuniao (web)", () => {
  it("tem rótulo para todos os status", () => {
    expect(Object.keys(ROTULO_STATUS)).toEqual(["AGENDADA", "EM_ANDAMENTO", "FINALIZADA", "CANCELADA"]);
  });

  it("formata data ausente", () => {
    expect(formatarDataHora(null)).toBe("Sem horário");
  });
});
