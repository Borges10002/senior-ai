import { describe, expect, it } from "vitest";
import { ensureStrongPassword, isStrongPassword } from "./passwordSecurity";
describe("Politica de senha no servidor", () => {
  it.each(["Nova@123", "abcdefghijkl", "123456789012", "SemNumero@abc", "SemSimbolo123", "Aa1@" + "x".repeat(69), "Aa1@" + "é".repeat(35)])("recusa senha fraca ou truncavel pelo bcrypt", password => {
    expect(isStrongPassword(password)).toBe(false);
    expect(() => ensureStrongPassword(password)).toThrow(/Senha fraca/);
  });
  it.each(["MinhaFrase@123", "Aa1@" + "x".repeat(68)])("aceita senha forte ate 72 bytes", password => {
    expect(isStrongPassword(password)).toBe(true);
    expect(() => ensureStrongPassword(password)).not.toThrow();
  });
});
