import { describe, expect, it } from "vitest";
import { chaveDaGravacao, podeReprocessar, tipoAceito } from "./gravacao";

describe("gravação", () => {
  it("aceita só vídeo conhecido", () => {
    expect(tipoAceito("video/mp4")).toBe(true);
    expect(tipoAceito("video/quicktime")).toBe(true);
    expect(tipoAceito("application/x-msdownload")).toBe(false);
    expect(tipoAceito("__proto__")).toBe(false);
  });

  it("monta a chave sem usar dados do nome do arquivo", () => {
    expect(chaveDaGravacao(7, "r1", "g1", "video/mp4")).toBe("gravacoes/7/r1/g1.mp4");
  });

  it("só reprocessa o que falhou", () => {
    expect(podeReprocessar("FALHOU")).toBe(true);
    expect(podeReprocessar("CONCLUIDA")).toBe(false);
    expect(podeReprocessar("TRANSCREVENDO")).toBe(false);
  });
});
