import { describe, expect, it } from "vitest";
import { isStrongPassword } from "src/domain/password";
import { readResetToken } from "src/domain/passwordReset";
describe("Politica de senha", () => {
  it.each(["Nova@123", "abcdefghijkl", "123456789012", "SemNumero@abc", "SemSimbolo123", "Aa1@" + "x".repeat(69), "Aa1@" + "é".repeat(35)])("recusa senha fraca ou truncavel pelo bcrypt", password => {
    expect(isStrongPassword(password)).toBe(false);
  });
  it.each(["MinhaFrase@123", "Aa1@" + "x".repeat(68)])("aceita senha forte dentro do limite", password => {
    expect(isStrongPassword(password)).toBe(true);
  });
});
describe("Token do link de recuperacao", () => {
  it("aceita o fragmento sem enviar a credencial na URL HTTP", () => {
    const token = "a".repeat(64);
    const url = new URL("https://app.test/redefinir-senha#token=" + token);
    expect(readResetToken(undefined, url.hash)).toBe(token);
    expect(url.pathname + url.search).toBe("/redefinir-senha");
  });
  it("aceita links anteriores e rejeita tokens malformados", () => {
    expect(readResetToken("b".repeat(64), "")).toBe("b".repeat(64));
    expect(readResetToken(["b".repeat(64)], "")).toBe("");
    expect(readResetToken(undefined, "#token=<script>")).toBe("");
  });
});
