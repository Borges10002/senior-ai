import { sessaoValida } from "@/domain/models";

describe("sessaoValida", () => {
  it("aceita sessão completa", () => {
    expect(
      sessaoValida({ accessToken: "a", refreshToken: "b", usuario: { id: "1", nome: "Ana", email: "a@x", perfil: "proprietario" } }),
    ).toBe(true);
  });

  it("recusa sessão corrompida", () => {
    expect(sessaoValida(null)).toBe(false);
    expect(sessaoValida({ accessToken: "a" })).toBe(false);
  });
});
