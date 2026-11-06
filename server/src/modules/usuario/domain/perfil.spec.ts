import { describe, expect, it } from "vitest";
import { ehAdministrador, perfilDoNivel, resumoPerfil } from "./perfil";

describe("perfil", () => {
  it("reconhece o nível gravado como número, texto ou id", () => {
    expect(perfilDoNivel(3).nome).toBe("Administrador");
    expect(perfilDoNivel("2").nome).toBe("Gestor");
    expect(perfilDoNivel("U").nome).toBe("Usuário");
  });

  it("valor desconhecido vira Usuário (nunca administrador)", () => {
    expect(perfilDoNivel("USER").nome).toBe("Usuário");
    expect(ehAdministrador(undefined)).toBe(false);
    expect(ehAdministrador(99)).toBe(false);
  });

  it("resumo exposto ao frontend", () => {
    expect(resumoPerfil(3)).toEqual({ nivel: 3, nome: "Administrador", admin: true });
    expect(resumoPerfil(1)).toEqual({ nivel: 1, nome: "Usuário", admin: false });
  });
});
