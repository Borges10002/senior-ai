import { describe, expect, it } from "vitest";
import { dataCalendario, hojeNoFuso, normalizarCompetencia, somarMeses } from "./dataCalendario";

describe("dataCalendario", () => {
  it("mantém a data como texto, sem deslocar fuso", () => {
    expect(dataCalendario.parse("2026-10-26")).toBe("2026-10-26");
    expect(dataCalendario.parse("2026-10-26T00:00:00.000Z")).toBe("2026-10-26");
  });

  it("recusa datas inexistentes", () => {
    expect(() => dataCalendario.parse("2026-02-31")).toThrow();
    expect(() => dataCalendario.parse("26/10/2026")).toThrow();
  });
});

describe("somarMeses", () => {
  it("preserva o dia e limita ao fim do mês", () => {
    expect(somarMeses("2027-01-31", 1)).toBe("2027-02-28");
    expect(somarMeses("2028-01-31", 1)).toBe("2028-02-29"); // bissexto
    expect(somarMeses("2027-02-28", 1, 31)).toBe("2027-03-31");
  });

  it("vira o ano", () => {
    expect(somarMeses("2026-12-10", 1)).toBe("2027-01-10");
    expect(somarMeses("2026-11-05", 14)).toBe("2028-01-05");
  });
});

describe("normalizarCompetencia", () => {
  it("guarda o dia 1 do mês de referência", () => {
    expect(normalizarCompetencia("2026-10-15", "2026-11-05")).toBe("2026-10-01");
  });

  it("devolve nulo quando é o mesmo mês do vencimento ou vazio", () => {
    expect(normalizarCompetencia("2026-11-01", "2026-11-05")).toBeNull();
    expect(normalizarCompetencia(null, "2026-11-05")).toBeNull();
  });
});

describe("hojeNoFuso", () => {
  it("usa o fuso de Brasília (02:00 UTC ainda é o dia anterior)", () => {
    expect(hojeNoFuso(new Date("2026-11-01T02:00:00Z"))).toBe("2026-10-31");
    expect(hojeNoFuso(new Date("2026-11-01T15:00:00Z"))).toBe("2026-11-01");
  });
});
